/**
 * Trending this week is its own v1 allowlist. It is not New this week.
 * The home tiles stay logo-plus-name. The list page renders the reason lines.
 */
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GET as trendingOgGet } from "../app/og/[locale]/[kind]/[[...id]]/route";
import { HomeTrending } from "../components/home-trending";
import { TrendingThisWeekList } from "../components/trending-this-week-page";
import { getShop, listRealShops } from "../lib/catalog";
import { listingOgCopy } from "../lib/listing-og";
import { NEW_THIS_WEEK_IDS, listNewThisWeekShops } from "../lib/new-this-week";
import { LOCKED_OPENER, LOCKED_OPENER_EN, trendingPath } from "../lib/product";
import { listSitemapLocs } from "../lib/sitemap-xml";
import {
  listPublicShops,
  publicShopRecord,
} from "../lib/structured-data";
import { trendingMetadata } from "../lib/trending-page";
import {
  TRENDING_THIS_WEEK,
  TRENDING_THIS_WEEK_IDS,
  TRENDING_THIS_WEEK_WINDOW,
  listTrendingThisWeekRows,
  listTrendingThisWeekShops,
  trendingWindowLabel,
} from "../lib/trending-this-week";
import type { Language } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

/** renderToStaticMarkup escapes "&" (DM Café & Roastery). */
function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;");
}

const LINE_PROMO =
  /\b(paid|promo|sponsored|offers?|discounts?|deals?|free|new menu)\b|%|عرض|عروض|خصم|مجان|برعاية|سبونسر|منيو جديد/i;

const EXPECTED = [
  "torre-al-rawabi",
  "dm-cafe-roastery-as-sahafah",
  "namq-al-malqa",
  "waqar-al-aziziyah",
] as const;

assert(
  TRENDING_THIS_WEEK_WINDOW.from === "2026-09-25" &&
    TRENDING_THIS_WEEK_WINDOW.to === "2026-10-02",
  "Trending window is 2026-09-25 to 2026-10-02",
);
assert(
  TRENDING_THIS_WEEK_IDS.join(",") === EXPECTED.join(","),
  "Trending allowlist order is TORRE, DM, Namq, then Waqar",
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
    trendingSrc.includes("return shop ?") &&
    weekSrc.includes("return shop ? [shop] : []"),
  "Trending skips missing ids the same way New this week does",
);
assert(
  trendingSrc.includes("under each café card") &&
    trendingSrc.includes("not rendered there"),
  "lines render on the Trending page, not on the home tiles",
);
assert(
  TRENDING_THIS_WEEK[2]?.lineAr ===
    "نمق كان من أكثر الأسماء اللي انتشرت بيوم القهوة العالمي." &&
    TRENDING_THIS_WEEK[2]?.lineEn ===
      "Namq was one of the most talked-about names on World Coffee Day.",
  "Namq's line no longer promotes the expired owner offer",
);
assert(
  TRENDING_THIS_WEEK[0]?.lineAr ===
    "توري مقهى جديد فتح بالروابي، وصار من أكثر الأماكن اللي انتكلم عنها هالأسبوع." &&
    TRENDING_THIS_WEEK[0]?.lineEn ===
      "TORRE is a new opening in Al Rawabi that people were talking about this week.",
  "TORRE's line is the neutral new-opening reason",
);
assert(
  TRENDING_THIS_WEEK[1]?.lineAr ===
    "دي ام بالصحافة كان من أول الأماكن اللي انذكرت مع ترند الكوكيز فوق الآيسكريم." &&
    TRENDING_THIS_WEEK[1]?.lineEn ===
      "DM Café & Roastery in As Sahafah was one of the first spots named in the cookie-on-ice-cream trend.",
  "DM's line is the neutral cookie-on-ice-cream reason",
);
assert(
  trendingWindowLabel("ar") === "25 سبتمبر – 2 أكتوبر" &&
    trendingWindowLabel("en") === "25 Sep – 2 Oct",
  "window line is derived from the stored dates",
);
for (const row of TRENDING_THIS_WEEK) {
  assert(row.lineAr.length > 0 && row.lineEn.length > 0, `${row.id} keeps both lines`);
  assert(!/\bween\b/i.test(row.lineEn), `${row.id} line does not say ween`);
  assert(!/وين/.test(row.lineAr), `${row.id} Arabic line does not say ween`);
  assert(row.lineAr.endsWith("."), `${row.id} Arabic line ends with a period`);
  assert(
    !row.lineAr.includes(LOCKED_OPENER) && !row.lineEn.includes(LOCKED_OPENER_EN),
    `${row.id} line does not reuse a locked opener`,
  );
  assert(
    !/(^|[^0-9])[12]([^0-9]|$)|[١٢]/.test(row.lineAr),
    `${row.id} Arabic line writes one and two as words`,
  );
  assert(!LINE_PROMO.test(row.lineAr) && !LINE_PROMO.test(row.lineEn), `${row.id} line has no offer or menu hype`);
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
    trendingUi.includes("grid-cols-3") &&
    trendingUi.includes("count === 2 || count === 4"),
  "Trending column count follows 1, 2, or 3 rows, and four sit two-by-two",
);
assert(trendingUi.includes("const HOME_TRENDING_COUNT = 4;"), "home shows up to four Trending tiles");

const names = listRealShops().flatMap((shop) => [
  shop.id,
  shop.nameEn,
  shop.nameAr,
]);
const torre = getShop("torre-al-rawabi");
const dm = getShop("dm-cafe-roastery-as-sahafah");
assert(
  torre?.neighborhood === "al-rawabi" && torre.nameEn === "TORRE Cafe" && !torre.isChain,
  "TORRE is a real Al Rawabi café row",
);
assert(
  dm?.neighborhood === "as-sahafah" && dm.nameEn === "DM Café & Roastery" && !dm.isChain,
  "DM Café & Roastery is a real As Sahafah café row, not a chain",
);
assert(
  names.filter((name) => /\btorre\b/i.test(name)).length === 2,
  "TORRE has exactly one catalog row",
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
    assert(!html.includes(escapeHtml(row.lineEn)), `${language} does not render the English line`);
  }
  assert(html.includes("grid-cols-2"), `${language} lays four rows out two-by-two`);
  assert(!html.includes("grid-cols-3"), `${language} does not leave a lone tile on a second row`);
  assert(
    html.includes(language === "ar" ? "ترند الأسبوع" : "Trending this week"),
    `${language} keeps the existing heading`,
  );
  return [...html.matchAll(/data-trending-id="([^"]+)"/g)].map((match) => match[1]!);
}

assert(
  trendingIds("ar").join(",") === EXPECTED.join(","),
  "AR home Trending renders all four in allowlist order",
);
assert(
  trendingIds("en").join(",") === EXPECTED.join(","),
  "EN home Trending renders all four in allowlist order",
);

const PROMO = /\b(paid|promo|sponsored|offer)\b|عروض|برعاية|سبونسر/i;

function listHtml(language: Language, rows = listTrendingThisWeekRows()): string {
  return renderToStaticMarkup(
    createElement(TrendingThisWeekList, { language, rows }),
  );
}

for (const language of ["ar", "en"] as const) {
  const html = listHtml(language);
  const ids = [...html.matchAll(/data-trending-id="([^"]+)"/g)].map((match) => match[1]);
  assert(ids.join(",") === EXPECTED.join(","), `${language} page keeps allowlist order`);
  assert(html.includes(trendingWindowLabel(language)), `${language} window comes from the data file`);
  assert(!/\bween\b/i.test(html), `${language} page does not say ween`);
  assert(!PROMO.test(html), `${language} page has no promo or offer wording`);
  for (const row of TRENDING_THIS_WEEK) {
    const line = language === "ar" ? row.lineAr : row.lineEn;
    assert(html.includes(escapeHtml(line)), `${language} renders ${row.id} reason`);
  }
  const home = renderToStaticMarkup(
    createElement(HomeTrending, {
      language,
      shops: listTrendingThisWeekShops(),
    }),
  );
  assert(
    home.includes(`href="${trendingPath(language)}"`),
    `${language} home View all points at the Trending page`,
  );
  assert(!PROMO.test(home), `${language} home tiles have no promo wording`);
  assert(!/\bween\b/i.test(home), `${language} home tiles do not say ween`);
}

for (const language of ["ar", "en"] as const) {
  const html = listHtml(language, []);
  const expected =
    language === "ar"
      ? "ما فيه ترند هالأسبوع للحين."
      : "Nothing trending this week yet.";
  assert(html.includes(expected), `${language} empty state`);
  assert(html.includes("data-trending-empty"), `${language} empty state is marked`);
  assert(!html.includes("data-trending-id"), `${language} empty state has no cafés`);
  assert(!/\bween\b/i.test(html), `${language} empty state does not say ween`);
}

const pageSrc = readFileSync("components/trending-this-week-page.tsx", "utf8");
assert(pageSrc.includes("trendingWindowLabel(language)"), "window is not hardcoded in the component");
assert(!pageSrc.includes("25 سبتمبر") && !pageSrc.includes("25 Sep"), "component does not hardcode the window");
assert(pageSrc.includes("DirectoryCard"), "Trending page uses the normal café card");

const arRoute = readFileSync("app/[category]/[slug]/page.tsx", "utf8");
const enRoute = readFileSync("app/en/[category]/[slug]/page.tsx", "utf8");
assert(
  arRoute.includes("<TrendingThisWeekPage language=\"ar\" />") &&
    arRoute.includes("trendingMetadata(\"ar\")"),
  "AR /coffee-shops/trending renders the list",
);
assert(
  enRoute.includes("<TrendingThisWeekPage language=\"en\" />") &&
    enRoute.includes("trendingMetadata(\"en\")"),
  "EN /en/coffee-shops/trending renders the list",
);

const arMeta = trendingMetadata("ar");
const enMeta = trendingMetadata("en");
assert(arMeta.alternates?.canonical === trendingPath("ar"), "AR canonical");
assert(enMeta.alternates?.canonical === trendingPath("en"), "EN canonical");
assert(
  arMeta.alternates?.languages?.["ar-SA"] === trendingPath("ar") &&
    arMeta.alternates?.languages?.en === trendingPath("en") &&
    enMeta.alternates?.languages?.["ar-SA"] === trendingPath("ar") &&
    enMeta.alternates?.languages?.en === trendingPath("en"),
  "hreflang alternates match the other list pages",
);
assert(
  listingOgCopy({ kind: "trending", language: "ar" })?.title === "ترند الأسبوع" &&
    listingOgCopy({ kind: "trending", language: "en" })?.title === "Trending this week",
  "OG card uses the page heading",
);
assert(
  listingOgCopy({ kind: "trending", language: "ar" })?.subtitle === trendingWindowLabel("ar") &&
    listingOgCopy({ kind: "trending", language: "en" })?.subtitle === trendingWindowLabel("en"),
  "OG card subtitle is the window line",
);

const locs = listSitemapLocs();
assert(locs.length === 1059, `sitemap is 1059 (1035 plus 8 Bisat batch cafés and 4 districts × AR/EN), got ${locs.length}`);
assert(
  locs.includes("https://wain.lol/coffee-shops/trending") &&
    locs.includes("https://wain.lol/en/coffee-shops/trending"),
  "sitemap lists both Trending URLs",
);

const chips = readFileSync("lib/discovery-categories.ts", "utf8");
assert(!chips.includes('slug: "trending"'), "Trending is not a chip");

async function assertOg(locale: "ar" | "en") {
  const response = await trendingOgGet(new Request(`https://wain.lol/og/${locale}/trending`), {
    params: Promise.resolve({ locale, kind: "trending" }),
  });
  assert(response.status === 200, `${locale} OG route returns 200, got ${response.status}`);
  const type = response.headers.get("content-type") ?? "";
  assert(type.includes("image/png"), `${locale} OG is image/png, got ${type}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert(bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47, `${locale} OG bytes are PNG`);
}

void (async () => {
  await assertOg("ar");
  await assertOg("en");
  console.log("check-trending-this-week: ok");
})().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
