/**
 * Trending this week is its own v1 allowlist. It is not New this week.
 * Copy lines stay in data and are not rendered.
 */
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { HomeTrending } from "../components/home-trending";
import { getShop, listRealShops } from "../lib/catalog";
import { NEW_THIS_WEEK_IDS, listNewThisWeekShops } from "../lib/new-this-week";
import {
  listPublicShops,
  publicShopRecord,
} from "../lib/structured-data";
import {
  TRENDING_THIS_WEEK,
  TRENDING_THIS_WEEK_IDS,
  TRENDING_THIS_WEEK_WINDOW,
  listTrendingThisWeekShops,
} from "../lib/trending-this-week";
import type { Language } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const EXPECTED = ["namq-al-malqa", "waqar-al-aziziyah"] as const;

assert(
  TRENDING_THIS_WEEK_WINDOW.from === "2026-09-25" &&
    TRENDING_THIS_WEEK_WINDOW.to === "2026-10-02",
  "Trending window is 2026-09-25 to 2026-10-02",
);
assert(
  TRENDING_THIS_WEEK_IDS.join(",") === EXPECTED.join(","),
  "Trending allowlist order is namq-al-malqa then waqar-al-aziziyah",
);
assert(
  TRENDING_THIS_WEEK.map((row) => row.id).join(",") === EXPECTED.join(","),
  "Trending rows stay in allowlist order",
);

const trending = listTrendingThisWeekShops();
assert(
  trending.map((shop) => shop.id).join(",") === EXPECTED.join(","),
  "listTrendingThisWeekShops keeps allowlist order",
);

const publicIds = new Set(listPublicShops().map((shop) => shop.id));
for (const id of TRENDING_THIS_WEEK_IDS) {
  const shop = getShop(id);
  assert(shop, `${id} exists in the catalog`);
  assert(shop.example === false, `${id} is not an example shop`);
  assert(publicIds.has(id), `${id} is a public café`);
  assert(
    publicShopRecord(shop)["@type"] === "CafeOrCoffeeShop",
    `${id} public record is a café`,
  );
}

assert(
  NEW_THIS_WEEK_IDS.join(",") ===
    "brew92-an-nada,ashjar-cafe-ar-rabi,jazean-diplomatic-quarter,markab-king-fahd",
  "New this week allowlist is unchanged",
);
assert(
  listNewThisWeekShops()
    .map((shop) => shop.id)
    .join(",") === NEW_THIS_WEEK_IDS.join(","),
  "New this week strip still resolves the unchanged allowlist",
);
assert(
  trending.map((shop) => shop.id).join(",") !==
    listNewThisWeekShops()
      .map((shop) => shop.id)
      .join(","),
  "Trending is not the New this week list",
);

const trendingSrc = readFileSync("lib/trending-this-week.ts", "utf8");
const weekSrc = readFileSync("lib/new-this-week.ts", "utf8");
assert(
  trendingSrc.includes("listDirectoryShops()") &&
    trendingSrc.includes(".flatMap(") &&
    trendingSrc.includes("return shop ? [shop] : []") &&
    weekSrc.includes("return shop ? [shop] : []"),
  "Trending skips missing ids the same way New this week does",
);
assert(
  trendingSrc.includes("NOT rendered") && trendingSrc.includes("Amjad"),
  "stored lines are marked as not rendered; UI is Amjad's call",
);
for (const row of TRENDING_THIS_WEEK) {
  assert(row.lineAr.length > 0 && row.lineEn.length > 0, `${row.id} keeps both lines`);
  assert(!/\bween\b/i.test(row.lineEn), `${row.id} line does not say ween`);
}

const home = readFileSync("components/home-landing.tsx", "utf8");
const district = readFileSync("components/district-page.tsx", "utf8");
const trendingUi = readFileSync("components/home-trending.tsx", "utf8");
assert(
  home.includes(
    "<HomeTrending language={language} shops={listTrendingThisWeekShops()} />",
  ),
  "bare home feeds Trending from the trending allowlist",
);
assert(
  home.includes(
    "<NewThisWeek language={language} shops={listNewThisWeekShops()} />",
  ),
  "the New this week rail still uses its own allowlist",
);
assert(
  !home.includes(
    "<HomeTrending language={language} shops={listNewThisWeekShops()} />",
  ),
  "HomeTrending is not fed by New this week",
);
assert(
  district.includes("listNewThisWeekShops()") &&
    !district.includes("listTrendingThisWeekShops"),
  "district pages keep New this week",
);
assert(
  !trendingUi.includes("lineAr") && !trendingUi.includes("lineEn"),
  "Trending UI has no line slot",
);
assert(
  trendingUi.includes("grid-cols-1") &&
    trendingUi.includes("grid-cols-2") &&
    trendingUi.includes("grid-cols-3"),
  "Trending column count can follow 1, 2, or 3 rows",
);

const names = listRealShops().flatMap((shop) => [
  shop.id,
  shop.nameEn,
  shop.nameAr,
]);
assert(
  !names.some((name) => /\btorre\b/i.test(name)),
  "TORRE is not in the catalog",
);
assert(
  !names.some((name) => /dm café|dm cafe|^dm\b/i.test(name)),
  "DM Café is not in the catalog",
);

function trendingIds(language: Language): string[] {
  const html = renderToStaticMarkup(
    createElement(HomeTrending, {
      language,
      shops: listTrendingThisWeekShops(),
    }),
  );
  for (const row of TRENDING_THIS_WEEK) {
    assert(!html.includes(row.lineAr), `${language} does not render the Arabic line`);
    assert(!html.includes(row.lineEn), `${language} does not render the English line`);
  }
  assert(html.includes("grid-cols-2"), `${language} uses two columns for two rows`);
  assert(!html.includes("grid-cols-3"), `${language} does not keep an empty third column`);
  assert(
    html.includes(language === "ar" ? "ترند الأسبوع" : "Trending this week"),
    `${language} keeps the existing heading`,
  );
  return [...html.matchAll(/data-trending-id="([^"]+)"/g)].map((match) => match[1]!);
}

assert(
  trendingIds("ar").join(",") === EXPECTED.join(","),
  "AR Trending renders namq-al-malqa then waqar-al-aziziyah",
);
assert(
  trendingIds("en").join(",") === EXPECTED.join(","),
  "EN Trending renders namq-al-malqa then waqar-al-aziziyah",
);

console.log("check-trending-this-week: ok");
