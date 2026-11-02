/**
 * Nearby's saved scroll is one Back, not every later mount in that tab.
 * A slow high-accuracy fix still restores; a wheel, touch, or key cancels it.
 *
 * Uses the production build (`npm run build`, then this check starts
 * `next start`) unless LIST_SCROLL_URL already points at one.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { chromium, type Browser, type Page } from "playwright-core";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const port = 3417;
const startedHere = !process.env.LIST_SCROLL_URL;
const base = process.env.LIST_SCROLL_URL ?? `http://127.0.0.1:${port}`;

async function waitReady(url: string): Promise<void> {
  for (let i = 0; i < 40; i += 1) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.ok || response.status === 307 || response.status === 308) return;
    } catch {
      // Server still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Nearby scroll server at ${url} did not start. Run npm run build first.`);
}

function startServer(): ChildProcess {
  return spawn("npx", ["next", "start", "-p", String(port)], {
    cwd: repoRoot,
    stdio: "ignore",
    detached: true,
  });
}

function stopServer(server: ChildProcess | null): void {
  if (!server?.pid || server.killed) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    server.kill("SIGTERM");
  }
}

async function browser(): Promise<Browser> {
  return chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-back-forward-cache"],
  });
}

async function prepare(page: Page, geoDelayMs: number): Promise<void> {
  await page.context().addInitScript((delay: number) => {
    const geo = navigator.geolocation;
    const original = geo.getCurrentPosition.bind(geo);
    geo.getCurrentPosition = (success, error, options) => {
      window.setTimeout(() => original(success, error, options), delay);
    };
    const calls: number[] = [];
    const scrollTo = window.scrollTo.bind(window);
    (window as unknown as { scrollTo: (x: number, y: number) => void }).scrollTo = (x, y) => {
      if (typeof y === "number") calls.push(y);
      scrollTo(x, y);
    };
    (window as unknown as { __listScrollTos: number[] }).__listScrollTos = calls;
  }, geoDelayMs);
}

async function scrollTos(page: Page): Promise<number[]> {
  return page.evaluate(() => (window as unknown as { __listScrollTos?: number[] }).__listScrollTos ?? []);
}

async function clearScrollTos(page: Page): Promise<void> {
  await page.evaluate(() => {
    const calls = (window as unknown as { __listScrollTos?: number[] }).__listScrollTos;
    if (calls) calls.length = 0;
  });
}

async function dismissConsent(page: Page): Promise<void> {
  const accept = page.locator("[data-consent=accept]");
  if (await accept.count()) await accept.first().click().catch(() => undefined);
}

async function visibleCafe(page: Page): Promise<string> {
  const href = await page.evaluate(() => {
    const link = [...document.querySelectorAll('a[href*="/en/c/"]')].find((anchor) => {
      const box = anchor.getBoundingClientRect();
      return box.top > 80 && box.bottom < window.innerHeight - 20;
    });
    return link instanceof HTMLAnchorElement ? link.href : null;
  });
  assert(href, "a café card is on screen");
  return href;
}

async function hardBackFrom(page: Page, savedY: number): Promise<void> {
  await page.goto(`${base}/en/coffee-shops/nearby`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("[data-listing-card]");
  await page.waitForFunction(
    () => document.querySelector("[data-fixed-list-mode]")?.getAttribute("data-fixed-list-mode") === "distance",
    { timeout: 15000 },
  );
  await dismissConsent(page);
  await page.evaluate((y) => window.scrollTo(0, y), savedY);
  await page.waitForTimeout(250);
  const href = await visibleCafe(page);
  await page.evaluate((url) => window.location.assign(url), href);
  await page.waitForURL(/\/en\/c\//);
  await page.waitForTimeout(200);
  await page.goBack();
  await page.waitForURL(/coffee-shops\/nearby/);
  await clearScrollTos(page);
}

async function checkStale(chrome: Browser): Promise<void> {
  const context = await chrome.newContext({
    viewport: { width: 390, height: 844 },
    locale: "en-US",
    geolocation: { latitude: 24.7136, longitude: 46.6753 },
    permissions: ["geolocation"],
  });
  const page = await context.newPage();
  await prepare(page, 0);
  await hardBackFrom(page, 1190);
  await page.waitForTimeout(2500);
  const first = await page.evaluate(() => Math.round(window.scrollY));
  assert(Math.abs(first - 1190) < 80, `the hard Back should return near 1190, got ${first}`);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const link = [...document.querySelectorAll("a")].find((anchor) => {
      if (!(anchor instanceof HTMLAnchorElement) || !anchor.href.includes("/en/c/")) return false;
      const box = anchor.getBoundingClientRect();
      return box.top > 80 && box.bottom < window.innerHeight - 20;
    });
    if (link instanceof HTMLAnchorElement) link.click();
  });
  await page.waitForURL(/\/en\/c\//);
  await page.evaluate(() => history.back());
  await page.waitForURL(/coffee-shops\/nearby/);
  await page.waitForTimeout(1500);
  const second = await page.evaluate(() => Math.round(window.scrollY));
  assert(second < 40, `a later café Back in the same document jumped to ${second}`);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('a[href="/en/coffee-shops/outdoor"]').first().click();
  await page.waitForURL(/coffee-shops\/outdoor/);
  await page.locator('a[href="/en/coffee-shops/nearby"]').first().click();
  await page.waitForURL(/coffee-shops\/nearby/);
  await page.waitForTimeout(1500);
  const third = await page.evaluate(() => Math.round(window.scrollY));
  assert(third < 40, `Outdoor then Nearby jumped to ${third}`);
  await context.close();
}

async function checkCancel(chrome: Browser, kind: "key" | "touch"): Promise<void> {
  const context = await chrome.newContext({
    viewport: { width: 390, height: 844 },
    locale: "en-US",
    geolocation: { latitude: 24.7136, longitude: 46.6753 },
    permissions: ["geolocation"],
  });
  const page = await context.newPage();
  await prepare(page, 3000);
  await hardBackFrom(page, 1190);
  await page.waitForTimeout(400);
  if (kind === "key") await page.keyboard.press("ArrowDown");
  else {
    await page.evaluate(() => window.dispatchEvent(new Event("touchstart")));
  }
  await page.waitForTimeout(4500);
  const tos = await scrollTos(page);
  assert(
    !tos.some((value) => Math.abs(value - 1190) < 80),
    `${kind} during settling still restored (scrollTo ${tos.join(",")})`,
  );
  await context.close();
}

async function checkDelayedRestore(chrome: Browser): Promise<void> {
  const context = await chrome.newContext({
    viewport: { width: 390, height: 844 },
    locale: "en-US",
    geolocation: { latitude: 24.7136, longitude: 46.6753 },
    permissions: ["geolocation"],
  });
  const page = await context.newPage();
  await prepare(page, 3000);
  await hardBackFrom(page, 1190);
  await page.waitForTimeout(5000);
  const y = await page.evaluate(() => Math.round(window.scrollY));
  const tos = await scrollTos(page);
  assert(
    Math.abs(y - 1190) < 120 || tos.some((value) => Math.abs(value - 1190) < 40),
    `a 3s location fix did not restore (y=${y}, scrollTo ${tos.join(",")})`,
  );
  await context.close();
}

async function checkLateFixDoesNotJump(chrome: Browser): Promise<void> {
  const context = await chrome.newContext({
    viewport: { width: 390, height: 844 },
    locale: "en-US",
    geolocation: { latitude: 24.7136, longitude: 46.6753 },
    permissions: ["geolocation"],
  });
  const page = await context.newPage();
  await prepare(page, 9000);
  await hardBackFrom(page, 1190);
  await page.waitForTimeout(11000);
  const tos = await scrollTos(page);
  assert(
    !tos.some((value) => Math.abs(value - 1190) < 40),
    `a fix after the wait still called scrollTo (${tos.join(",")})`,
  );
  await context.close();
}

async function main(): Promise<void> {
  let server: ChildProcess | null = null;
  if (startedHere) server = startServer();
  let chrome: Browser | null = null;
  try {
    await waitReady(`${base}/en/coffee-shops/nearby`);
    chrome = await browser();
    await checkStale(chrome);
    await checkDelayedRestore(chrome);
    await checkCancel(chrome, "key");
    await checkCancel(chrome, "touch");
    await checkLateFixDoesNotJump(chrome);
    console.log("check-list-scroll-restore: ok");
  } finally {
    await chrome?.close();
    stopServer(server);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
