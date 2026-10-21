/**
 * Home / chat ask field is one textbox: in the tab order, named by its
 * label, and not a display:none mirror.
 *
 * Static checks always run. Browser checks load ASK_COMPOSER_URL
 * (default http://localhost:3000) and prove Tab, the accessible name,
 * fill(), and both locales. Start `npm run dev` first, or point the
 * variable at a Vercel preview.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "playwright-core";
import { copy } from "../lib/copy";
import { districtPath } from "../lib/product";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const chatPath = join(repoRoot, "components/chat.tsx");
const cssPath = join(repoRoot, "app/globals.css");

function walk(dir: string, out: string[]) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (/\.(tsx|jsx)$/.test(entry.name)) out.push(path);
  }
}

function textareaOpenTags(source: string): string[] {
  return source.match(/<textarea\b[^>]*>/g) ?? [];
}

function sliceFn(source: string, name: string): string {
  const start = source.indexOf(`function ${name}`);
  assert(start >= 0, `missing function ${name}`);
  const rest = source.slice(start + 1);
  const next = rest.search(/\nfunction |\nexport function /);
  return source.slice(start, next < 0 ? source.length : start + 1 + next);
}

function checkSource() {
  const chat = readFileSync(chatPath, "utf8");
  const css = readFileSync(cssPath, "utf8");
  const files: string[] = [];
  walk(join(repoRoot, "components"), files);
  walk(join(repoRoot, "app"), files);

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    for (const tag of textareaOpenTags(source)) {
      assert(!tag.includes("aria-hidden"), `${file} textarea is aria-hidden:\n${tag}`);
      assert(!/tabIndex=\{-1\}|tabindex="-1"/i.test(tag), `${file} textarea is removed from tab order:\n${tag}`);
      assert(!/\bhidden\b/.test(tag), `${file} textarea uses the hidden class:\n${tag}`);
    }
  }

  const tags = textareaOpenTags(chat);
  assert(tags.length === 1, `chat composer should be one textarea, found ${tags.length}`);
  assert(tags[0]?.includes('id="koofi-ask"'), "the only textarea is #koofi-ask");
  assert(!tags[0]?.includes("readOnly") && !tags[0]?.includes("read-only"), "ask field is editable");

  const ids = chat.match(/id="koofi-ask"/g) ?? [];
  assert(ids.length === 1, `expected one #koofi-ask, found ${ids.length}`);
  const labels = chat.match(/htmlFor="koofi-ask"/g) ?? [];
  assert(labels.length === 2, `expected a label on both composer paths, found ${labels.length}`);

  const manual = sliceFn(chat, "ManualSearchFields");
  const field = sliceFn(chat, "AskComposerField");
  assert(manual.includes("<AskComposerField"), "search screen uses the shared ask field");
  assert(!manual.includes("<textarea"), "search screen does not keep a second textarea");
  assert(manual.includes('htmlFor="koofi-ask"'), "search screen labels the ask field");
  assert(field.includes('id="koofi-ask"'), "shared field owns #koofi-ask");
  assert(field.includes("ask-composer-paint"), "14px line is paint, not a second field");
  assert(field.includes("aria-hidden"), "paint line is hidden from assistive tech");
  assert(!field.includes("display:none") && !field.includes('"hidden"'), "shared field is never display:none");

  const formAt = chat.indexOf("showAskComposer ? (");
  const discoveryAfter = chat.indexOf("pinComposer && discovery && !listFirst ? discovery : null");
  assert(formAt >= 0 && discoveryAfter > formAt, "pinned home ask field is before the cafe list in tab order");

  const fieldRuleEnd = css.indexOf(".ask-composer-field::placeholder");
  const fieldRule = css.slice(css.indexOf(".ask-composer-field {"), fieldRuleEnd);
  assert(fieldRule.includes("font-size: 16px"), "ask field stays 16px so iOS does not zoom");
  assert(!fieldRule.includes("display:") && !/zoom\s*:/.test(fieldRule) && !fieldRule.includes("scale("), "ask field is not zoomed, scaled, or hidden");
  assert(css.includes(".ask-composer-field:focus"), "typed text is painted on focus");
  assert(css.includes("forced-colors: active"), "high contrast shows the real field, not the paint");
}

type Surface = {
  path: string;
  name: string;
  dir: "rtl" | "ltr";
  pin: boolean;
  search: boolean;
  shot: string;
};

const surfaces: Surface[] = [
  { path: "/", name: copy.placeholder.ar, dir: "rtl", pin: true, search: true, shot: "ar" },
  { path: "/en", name: copy.placeholder.en, dir: "ltr", pin: true, search: true, shot: "en" },
  {
    path: districtPath("al-malqa", "en"),
    name: copy.placeholder.en,
    dir: "ltr",
    pin: false,
    search: false,
    shot: "district-en",
  },
  {
    path: districtPath("al-malqa", "ar"),
    name: copy.placeholder.ar,
    dir: "rtl",
    pin: false,
    search: false,
    shot: "district-ar",
  },
];

function rgbAlpha(color: string): number | null {
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (!match?.[1]) return null;
  const parts = match[1].split(",").map((part) => part.trim());
  if (parts.length < 4) return 1;
  return Number(parts[3]);
}

async function tabToAsk(page: Page): Promise<number> {
  await page.evaluate(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  });
  for (let tabs = 1; tabs <= 40; tabs += 1) {
    await page.keyboard.press("Tab");
    const id = await page.evaluate(() => document.activeElement?.id ?? "");
    if (id === "koofi-ask") return tabs;
  }
  const before = await page.evaluate(() => {
    const field = document.getElementById("koofi-ask");
    const tabbables = [...document.querySelectorAll<HTMLElement>("a, button, input, textarea, select, [tabindex]")].filter(
      (el) => {
        if (el.tabIndex < 0) return false;
        const style = getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden";
      },
    );
    return {
      index: field ? tabbables.indexOf(field) : -1,
      count: tabbables.length,
    };
  });
  throw new Error(`Tab never reached #koofi-ask within 40 presses (tabbable index ${before.index} of ${before.count})`);
}

async function proveSurface(page: Page, base: string, surface: Surface, wide: boolean) {
  const url = new URL(surface.path, base).toString();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const field = page.locator("#koofi-ask");
  await field.waitFor({ state: "attached", timeout: 30_000 });
  // The node is in the server HTML before hydration. Filling earlier lets
  // React reset the value and the paint layer never sees it.
  await page.waitForFunction(() => {
    const el = document.getElementById("koofi-ask");
    return !!el && Object.keys(el).some((key) => key.startsWith("__reactProps"));
  });

  const named = page.getByRole("textbox", { name: surface.name, exact: true });
  assert((await named.count()) === 1, `${url} should expose one textbox named “${surface.name}”`);
  await named.waitFor({ state: "visible" });

  const meta = await field.evaluate((el) => {
    const style = getComputedStyle(el);
    let node: Element | null = el;
    let hiddenAncestor = false;
    while (node) {
      if (node.getAttribute("aria-hidden") === "true") hiddenAncestor = true;
      node = node.parentElement;
    }
    const label = document.querySelector('label[for="koofi-ask"]');
    const paint = document.querySelector(".ask-composer-paint");
    return {
      id: el.id,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      fontSize: style.fontSize,
      transform: style.transform,
      dir: el.getAttribute("dir"),
      tabIndex: el.tabIndex,
      ariaHidden: el.getAttribute("aria-hidden"),
      hiddenAncestor,
      width: el.getBoundingClientRect().width,
      label: label?.textContent?.trim() ?? "",
      paintTag: paint?.tagName ?? "",
      paintHidden: paint?.getAttribute("aria-hidden") ?? "",
      className: el.className,
    };
  });

  assert(meta.id === "koofi-ask", `${url} field id`);
  assert(meta.display !== "none" && meta.visibility !== "hidden" && meta.opacity !== "0", `${url} field is not shown (${meta.display}/${meta.visibility})`);
  assert(meta.width > 40, `${url} field has no box`);
  assert(meta.fontSize === "16px", `${url} field is ${meta.fontSize}, want 16px`);
  assert(meta.transform === "none", `${url} field is transformed`);
  assert(meta.dir === surface.dir, `${url} dir is ${meta.dir}, want ${surface.dir}`);
  assert(meta.tabIndex === 0, `${url} tabIndex is ${meta.tabIndex}`);
  assert(meta.ariaHidden === null && !meta.hiddenAncestor, `${url} field is hidden from the accessibility tree`);
  assert(meta.label === surface.name, `${url} label text is “${meta.label}”`);
  assert(meta.paintTag === "DIV" && meta.paintHidden === "true", `${url} paint layer should be an aria-hidden div`);
  assert(
    surface.pin ? meta.className.includes("rounded-full") : meta.className.includes("rounded-2xl"),
    `${url} shape class is ${meta.className}`,
  );

  const tabs = await tabToAsk(page);
  assert(tabs >= 1 && tabs <= 40, `${url} took ${tabs} Tabs`);
  await page.keyboard.press("Shift+Tab");
  const left = await page.evaluate(() => document.activeElement?.id ?? "");
  assert(left !== "koofi-ask", `${url} Shift+Tab stayed on the field`);
  await page.keyboard.press("Tab");
  const back = await page.evaluate(() => document.activeElement?.id ?? "");
  assert(back === "koofi-ask", `${url} Tab did not return to the field (on ${back || "nothing"})`);

  const sample = surface.dir === "rtl" ? "حطين" : "Olaya";
  await field.fill(sample);
  await page.waitForFunction((expected) => {
    const input = document.getElementById("koofi-ask");
    const paint = document.querySelector(".ask-composer-paint");
    return (
      input instanceof HTMLTextAreaElement &&
      input.value === expected &&
      paint?.getAttribute("data-has-value") === "true"
    );
  }, sample);
  assert((await field.inputValue()) === sample, `${url} fill() did not set the value`);
  assert((await named.count()) === 1, `${url} lost its accessible name after typing`);

  await page.evaluate(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  });
  const blurred = await page.evaluate(() => {
    const input = document.getElementById("koofi-ask");
    const paint = document.querySelector(".ask-composer-paint");
    if (!input || !paint) return null;
    return {
      field: getComputedStyle(input).getPropertyValue("-webkit-text-fill-color") || getComputedStyle(input).color,
      paint: getComputedStyle(paint).getPropertyValue("-webkit-text-fill-color") || getComputedStyle(paint).color,
    };
  });
  assert(blurred, `${url} missing paint while blurred`);
  assert((rgbAlpha(blurred.field) ?? 1) === 0, `${url} blurred field text should be transparent (${blurred.field})`);
  assert((rgbAlpha(blurred.paint) ?? 0) > 0, `${url} blurred paint should show the value (${blurred.paint})`);

  await field.click();
  const focusedId = await page.evaluate(() => document.activeElement?.id ?? "");
  assert(focusedId === "koofi-ask", `${url} click did not focus the field`);
  const focusedInk = await field.evaluate(
    (el) => getComputedStyle(el).getPropertyValue("-webkit-text-fill-color") || getComputedStyle(el).color,
  );
  assert((rgbAlpha(focusedInk) ?? 0) > 0, `${url} focused text is invisible (${focusedInk})`);
  const border = await page.locator(".ask-composer-paint").evaluate((el) => getComputedStyle(el).borderTopColor);
  assert(border.replace(/\s/g, "") === "rgb(127,53,38)", `${url} focus border is ${border}`);

  const shotDir = process.env.ASK_COMPOSER_SHOTS;
  if (shotDir && !wide) {
    await page.screenshot({ path: join(shotDir, `${surface.shot}.png`), fullPage: false });
  }

  if (!surface.search || wide) return;

  await field.fill("");
  await field.fill(sample);
  await field.press("Enter");
  await page.getByText("qa-ask-ok").waitFor({ timeout: 15_000 });
  const after = page.locator("#koofi-ask");
  await after.waitFor({ state: "visible" });
  assert(
    (await page.getByRole("textbox", { name: surface.name, exact: true }).count()) === 1,
    `${url} search screen lost the named textbox`,
  );
  assert((await after.inputValue()) === "", `${url} search field was not cleared`);
  const shape = await after.evaluate((el) => el.className);
  assert(shape.includes("rounded-2xl"), `${url} search screen should use the chat field, got ${shape}`);
  const searchTabs = await tabToAsk(page);
  assert(searchTabs <= 40, `${url} search screen took ${searchTabs} Tabs`);
  await after.fill(surface.dir === "rtl" ? "ملقا" : "work table");
  assert((await after.inputValue()).length > 0, `${url} could not type on the search screen`);
  if (shotDir) {
    await page.screenshot({ path: join(shotDir, `${surface.shot}-search.png`), fullPage: false });
  }
}

async function checkBrowser() {
  const base = process.env.ASK_COMPOSER_URL ?? "http://localhost:3000";
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    browser = await chromium.launch({
      channel: "chrome",
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
  } catch (error) {
    throw new Error(`Could not launch Chrome for the ask-field check (${base}). ${error instanceof Error ? error.message : error}`);
  }

  try {
    const probe = await fetch(base, { redirect: "manual" });
    assert(probe.ok || probe.status === 308 || probe.status === 307, `Ask composer server at ${base} returned ${probe.status}. Start \`npm run dev\` or set ASK_COMPOSER_URL to a preview.`);
    for (const wide of [false, true]) {
      const context = await browser.newContext({
        viewport: wide ? { width: 1280, height: 800 } : { width: 390, height: 844 },
        locale: "en-US",
      });
      await context.addInitScript(() => {
        const geo = {
          getCurrentPosition(_success: unknown, error?: (err: { code: number }) => void) {
            error?.({ code: 1 });
          },
          watchPosition() {
            return 0;
          },
          clearWatch() {},
        };
        Object.defineProperty(navigator, "geolocation", { configurable: true, get: () => geo });
      });
      const page = await context.newPage();
      await page.route("**/api/chat", async (route) => {
        const path = new URL(route.request().headers()["referer"] ?? base).pathname;
        const language = path === "/en" || path.startsWith("/en/") ? "en" : "ar";
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            language,
            reply: "qa-ask-ok",
            thinCatalog: false,
            picks: [],
          }),
        });
      });
      const list = wide ? surfaces.filter((surface) => surface.path === "/" || surface.path === "/en") : surfaces;
      for (const surface of list) {
        await proveSurface(page, base, surface, wide);
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

checkSource();
checkBrowser()
  .then(() => {
    console.log("check-ask-composer: ok");
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
