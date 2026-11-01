/**
 * Show more after Back must use the real onMore path in chat.tsx.
 * A restored snapshot has no pins. Host and guest /h/ send them from the
 * invite session. Soft-Back بيننا sends the pins still in this document.
 * A reloaded بيننا page has neither, so the button hides.
 *
 * Needs the app on HALFWAY_SHOW_MORE_URL (default http://localhost:3000).
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { shopToChatPick } from "../lib/chat-pick";
import { listRealShops } from "../lib/catalog";
import { roundHalfwayPin } from "../lib/halfway-invite";
import { HALFWAY_WAITING_STORAGE_KEY } from "../lib/halfway-waiting";
import { pickHalfwayShops } from "../lib/meet-halfway";
import {
  CAFE_RETURN_TOKEN_KEY,
  RESULTS_SNAPSHOT_KEY,
  writeResultsSnapshot,
  type ResultsMessage,
} from "../lib/results-return";

const require = createRequire(join(dirname(fileURLToPath(import.meta.url)), "../package.json"));
const { chromium } = require("playwright-core") as typeof import("playwright-core");

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const base = process.env.HALFWAY_SHOW_MORE_URL ?? "http://localhost:3000";
function mustPin(lat: number, lng: number): { lat: number; lng: number } {
  const pin = roundHalfwayPin(lat, lng);
  if (!pin) throw new Error("fixture pin");
  return pin;
}

const hostPin = mustPin(24.6982742, 46.6832109);
const guestPin = mustPin(24.7371909, 46.6944962);

const ENTRY = "show-more-restore";

function snapshotJson(input: {
  threadKey: string;
  href: string;
  picks: ReturnType<typeof shopToChatPick>[];
}): string {
  const memory = new Map<string, string>();
  const previous = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: unknown }).window = {
    sessionStorage: {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    },
  };
  try {
    const now = Date.now();
    writeResultsSnapshot(
      {
        entryKey: ENTRY,
        threadKey: input.threadKey,
        href: input.href,
        scrollY: 0,
        listScroll: 0,
        cardCount: input.picks.length,
        composerLanguage: "ar",
        awaitingMaps: false,
        savedAt: now,
        messages: [
          { id: "ask", role: "user", text: "بيننا" },
          {
            id: "halfway-picks",
            role: "assistant",
            text: "3 قهاوي بينكم",
            language: "ar",
            halfwayMore: true,
            picks: input.picks,
          },
        ] as ResultsMessage[],
      },
      now,
    );
    return memory.get(RESULTS_SNAPSHOT_KEY) ?? "";
  } finally {
    if (previous === undefined) delete (globalThis as { window?: unknown }).window;
    else (globalThis as { window?: unknown }).window = previous;
  }
}

function samePins(
  body: { halfway?: { locations?: { lat?: number; lng?: number }[] } },
  pins: { lat: number; lng: number }[],
): boolean {
  const got = body.halfway?.locations ?? [];
  if (got.length !== pins.length) return false;
  return pins.every((pin, index) => {
    const row = got[index];
    return row?.lat === pin.lat && row?.lng === pin.lng;
  });
}

async function installBack(
  page: import("playwright-core").Page,
  snapshot: string,
  waiting: string | null,
) {
  await page.addInitScript(
    ({ snapshot, waiting, entry, snapshotKey, tokenKey, waitingKey }) => {
      const original = performance.getEntriesByType.bind(performance);
      performance.getEntriesByType = ((type: string) => {
        if (type === "navigation") {
          return [{ type: "back_forward" } as PerformanceNavigationTiming];
        }
        return original(type);
      }) as typeof performance.getEntriesByType;
      let key = entry;
      try {
        const current = (window as unknown as {
          navigation?: { currentEntry?: { key?: string } };
        }).navigation?.currentEntry?.key;
        if (current) key = current;
      } catch {
        // History state is the fallback key.
      }
      const stored = JSON.parse(snapshot) as { entries?: { entryKey?: string }[] };
      for (const item of stored.entries ?? []) item.entryKey = key;
      sessionStorage.setItem(snapshotKey, JSON.stringify(stored));
      sessionStorage.setItem(tokenKey, JSON.stringify({ entryKey: key, ts: Date.now() }));
      if (waiting) sessionStorage.setItem(waitingKey, waiting);
      const state = history.state && typeof history.state === "object" ? { ...history.state } : {};
      history.replaceState({ ...state, wainEntry: key }, "", location.href);
    },
    {
      snapshot,
      waiting,
      entry: ENTRY,
      snapshotKey: RESULTS_SNAPSHOT_KEY,
      tokenKey: CAFE_RETURN_TOKEN_KEY,
      waitingKey: HALFWAY_WAITING_STORAGE_KEY,
    },
  );
}

async function createInvite(): Promise<string> {
  const created = (await fetch(`${base}/api/halfway/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat: hostPin.lat, lng: hostPin.lng, locale: "ar", seed: true }),
  }).then((res) => res.json())) as { id?: string; error?: string };
  assert(created.id, `invite create failed: ${created.error ?? "no id"}`);
  const joined = await fetch(`${base}/api/halfway/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: created.id, lat: guestPin.lat, lng: guestPin.lng }),
  });
  assert(joined.ok, `guest join failed: ${joined.status}`);
  return created.id;
}

async function restoredShowMore(
  browser: import("playwright-core").Browser,
  input: { id: string; host: boolean; picks: ReturnType<typeof shopToChatPick>[] },
) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const posts: { halfwayMore?: boolean; halfway?: { locations?: { lat?: number; lng?: number }[] } }[] = [];
  page.on("request", (req) => {
    if (req.method() !== "POST" || !req.url().includes("/api/chat")) return;
    try {
      posts.push(JSON.parse(req.postData() || "{}"));
    } catch {
      posts.push({});
    }
  });
  const snapshot = snapshotJson({
    threadKey: `halfway:${input.id}`,
    href: `/h/${input.id}`,
    picks: input.picks,
  });
  const waiting = input.host
    ? JSON.stringify({
        id: input.id,
        locale: "ar",
        me: hostPin,
        exp: Date.now() + 24 * 60 * 60 * 1000,
      })
    : null;
  await installBack(page, snapshot, waiting);
  await page.route("**/api/halfway/invite**", (route) => {
    if (route.request().method() === "GET") return route.abort();
    return route.continue();
  });
  await page.goto(`${base}/h/${input.id}`, { waitUntil: "domcontentloaded" });
  const button = page.locator("[data-halfway-show-more]");
  await button.waitFor({ timeout: 20000 });
  await page.locator("[data-halfway-results]").getByText("•").waitFor({ timeout: 10000 });
  const response = page.waitForResponse(
    (res) => res.url().includes("/api/chat") && res.request().method() === "POST",
    { timeout: 20000 },
  );
  await button.click();
  await response;
  const more = posts.filter((post) => post.halfwayMore === true);
  assert(more.length >= 1, `${input.host ? "host" : "guest"} Show more sent no /api/chat`);
  assert(
    samePins(more[0], [hostPin, guestPin]),
    `${input.host ? "host" : "guest"} Show more pins ${JSON.stringify(more[0]?.halfway?.locations)}`,
  );
  await page.waitForFunction(
    () => document.activeElement?.hasAttribute("data-halfway-end") === true,
    { timeout: 15000 },
  );
  await context.close();
}

async function refetchOnly(
  browser: import("playwright-core").Browser,
  picks: ReturnType<typeof shopToChatPick>[],
) {
  const created = (await fetch(`${base}/api/halfway/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lat: hostPin.lat, lng: hostPin.lng, locale: "ar", seed: true }),
  }).then((res) => res.json())) as { id?: string; error?: string };
  assert(created.id, `host-only invite failed: ${created.error ?? "no id"}`);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const posts: { halfwayMore?: boolean; halfway?: { locations?: { lat?: number; lng?: number }[] } }[] = [];
  page.on("request", (req) => {
    if (req.method() !== "POST" || !req.url().includes("/api/chat")) return;
    try {
      posts.push(JSON.parse(req.postData() || "{}"));
    } catch {
      posts.push({});
    }
  });
  await installBack(
    page,
    snapshotJson({ threadKey: `halfway:${created.id}`, href: `/h/${created.id}`, picks }),
    null,
  );
  await page.goto(`${base}/h/${created.id}`, { waitUntil: "domcontentloaded" });
  const button = page.locator("[data-halfway-show-more]");
  await button.waitFor({ timeout: 20000 });
  const joined = await fetch(`${base}/api/halfway/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: created.id, lat: guestPin.lat, lng: guestPin.lng }),
  });
  assert(joined.ok, "refetch guest join failed");
  const response = page.waitForResponse(
    (res) => res.url().includes("/api/chat") && res.request().method() === "POST",
    { timeout: 20000 },
  );
  await button.click();
  await response;
  const more = posts.filter((post) => post.halfwayMore === true);
  assert(more.length >= 1, "refetch Show more sent no /api/chat");
  assert(
    samePins(more[0], [hostPin, guestPin]),
    `refetch pins ${JSON.stringify(more[0]?.halfway?.locations)}`,
  );
  await context.close();
}

async function inPageThenSoftBack(browser: import("playwright-core").Browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const posts: { halfwayMore?: boolean; halfway?: { locations?: { lat?: number; lng?: number }[] } }[] = [];
  page.on("request", (req) => {
    if (req.method() !== "POST" || !req.url().includes("/api/chat")) return;
    try {
      posts.push(JSON.parse(req.postData() || "{}"));
    } catch {
      posts.push({});
    }
  });
  await page.goto(`${base}/halfway`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() =>
    Object.keys(document.querySelector("#meet-halfway-me") || {}).some((key) =>
      key.startsWith("__react"),
    ),
  );
  const wideHost = mustPin(24.761, 46.604);
  const wideGuest = mustPin(24.687, 46.685);
  await page.locator("#meet-halfway-me").fill(`${wideHost.lat}, ${wideHost.lng}`);
  const copy = page.getByRole("button", { name: "انسخ الرابط", exact: true });
  await page.waitForFunction(() =>
    [...document.querySelectorAll("button")].some(
      (button) => button.textContent?.trim() === "انسخ الرابط" && !button.disabled,
    ),
  );
  const created = page.waitForResponse(
    (res) => res.url().includes("/api/halfway/invite") && res.request().method() === "POST",
  );
  await copy.click();
  const invite = (await (await created).json()) as { id?: string };
  assert(invite.id, "بيننا copy link did not mint an invite");
  const joined = await fetch(`${base}/api/halfway/invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: invite.id, lat: wideGuest.lat, lng: wideGuest.lng }),
  });
  assert(joined.ok, "بيننا guest join failed");
  try {
    await page.locator("[data-halfway-results]").waitFor({ timeout: 20000 });
  } catch (error) {
    console.error("SOFT BODY\n" + (await page.locator("body").innerText().catch(() => "no body")));
    throw error;
  }
  const firstButton = page.locator("[data-halfway-show-more]");
  await firstButton.waitFor({ timeout: 20000 });
  const firstResponse = page.waitForResponse(
    (res) => res.url().includes("/api/chat") && res.request().method() === "POST",
  );
  await firstButton.click();
  await firstResponse;
  const inPage = posts.filter((post) => post.halfwayMore === true);
  assert(inPage.length >= 1, "in-page بيننا Show more sent no /api/chat");
  assert(
    samePins(inPage[0], [wideHost, wideGuest]),
    `in-page بيننا pins ${JSON.stringify(inPage[0]?.halfway?.locations)}`,
  );
  await page.evaluate(() => {
    (window as unknown as { __sameDoc?: number }).__sameDoc = 1;
  });
  await page.locator("[data-halfway-card]").first().click();
  await page.waitForURL(/\/c\//, { timeout: 20000 });
  await page.goBack({ waitUntil: "domcontentloaded" });
  const same = await page.evaluate(
    () => (window as unknown as { __sameDoc?: number }).__sameDoc === 1,
  );
  assert(same, "بيننا Back reloaded the document, so it was not a soft Back");
  const before = posts.filter((post) => post.halfwayMore === true).length;
  const button = page.locator("[data-halfway-show-more]");
  await button.waitFor({ timeout: 20000 });
  const response = page.waitForResponse(
    (res) => res.url().includes("/api/chat") && res.request().method() === "POST",
  );
  await button.click();
  await response;
  const more = posts.filter((post) => post.halfwayMore === true);
  assert(more.length > before, "soft-Back بيننا Show more sent no /api/chat");
  assert(
    samePins(more[more.length - 1], [wideHost, wideGuest]),
    `soft-Back بيننا pins ${JSON.stringify(more[more.length - 1]?.halfway?.locations)}`,
  );
  await context.close();
}

async function reloadedBainna(browser: import("playwright-core").Browser) {
  const shops = listRealShops();
  const picks = shops.slice(0, 3).map((shop) => shopToChatPick(shop, "ar", ""));
  const snapshot = snapshotJson({
    threadKey: "halfway-local:ar",
    href: "/halfway",
    picks,
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  let morePosts = 0;
  page.on("request", (req) => {
    if (req.method() !== "POST" || !req.url().includes("/api/chat")) return;
    try {
      const body = JSON.parse(req.postData() || "{}") as { halfwayMore?: boolean };
      if (body.halfwayMore === true) morePosts += 1;
    } catch {
      // ignore
    }
  });
  await installBack(page, snapshot, null);
  await page.goto(`${base}/halfway`, { waitUntil: "domcontentloaded" });
  try {
    await page.locator("[data-halfway-results]").waitFor({ timeout: 20000 });
  } catch (error) {
    const state = await page.evaluate(() => ({
      key: (history.state as { wainEntry?: string } | null)?.wainEntry ?? null,
      state: history.state,
      step: (window as unknown as { __wainStep?: string }).__wainStep ?? null,
      patched: (window as unknown as { __wainPatched?: number }).__wainPatched ?? 0,
      patchError: (window as unknown as { __wainPatchError?: string }).__wainPatchError ?? null,
      nav: (performance.getEntriesByType("navigation")[0] as { type?: string } | undefined)?.type ?? null,
      snap: sessionStorage.getItem("wain.resultsSnapshot.v1")?.slice(0, 180) ?? null,
    }));
    console.error("RELOAD STATE", JSON.stringify(state));
    console.error("RELOAD BODY\n" + (await page.locator("body").innerText().catch(() => "no body")).slice(0, 800));
    throw error;
  }
  await page.waitForTimeout(500);
  assert(
    (await page.locator("[data-halfway-show-more]").count()) === 0,
    "reloaded بيننا still shows Show more with no pins to send",
  );
  assert(morePosts === 0, "reloaded بيننا sent Show more without a session");
  await context.close();
}

async function main() {
  const probe = await fetch(base).catch(() => null);
  assert(
    probe && (probe.ok || probe.status === 307 || probe.status === 308),
    `Show more restore check needs the app at ${base}`,
  );
  const shops = listRealShops();
  const first = pickHalfwayShops({
    locations: [{ pin: hostPin }, { pin: guestPin }],
    shops,
  });
  assert(first.length === 3, "fixture band has a first page");
  const picks = first.map((shop) => shopToChatPick(shop, "ar", ""));
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const only = process.env.SHOW_MORE_ONLY;
    if (!only || only === "invite") {
      const hostId = process.env.SHOW_MORE_INVITE_ID || (await createInvite());
      const guestId = process.env.SHOW_MORE_INVITE_ID ? hostId : await createInvite();
      await restoredShowMore(browser, { id: hostId, host: true, picks });
      await restoredShowMore(browser, { id: guestId, host: false, picks });
    }
    if (!only || only === "refetch") await refetchOnly(browser, picks);
    if (!only || only === "soft") await inPageThenSoftBack(browser);
    if (!only || only === "reload") await reloadedBainna(browser);
  } finally {
    await browser.close();
  }
  console.log("check-halfway-show-more-restore: ok");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
