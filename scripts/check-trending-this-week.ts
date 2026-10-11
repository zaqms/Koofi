/**
 * Trending this week is its own v1 allowlist. It is not New this week.
 * The home tiles stay logo-plus-name. The list page renders the reason lines.
 */
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { POST as chatPost } from "../app/api/chat/route";
import { GET as trendingOgGet } from "../app/og/[locale]/[kind]/[[...id]]/route";
import { HomeTrending } from "../components/home-trending";
import { TrendingThisWeekList } from "../components/trending-this-week-page";
import { getShop, listDirectoryShops, listRealShops } from "../lib/catalog";
import { copy } from "../lib/copy";
import { listingOgCopy } from "../lib/listing-og";
import { NEW_THIS_WEEK_IDS, listNewThisWeekShops } from "../lib/new-this-week";
import { isTrendingWeekAsk, parseIntent } from "../lib/parse-intent";
import { pickCafes } from "../lib/picker";
import { LOCKED_OPENER, LOCKED_OPENER_EN, PUBLIC_SITE_URL, trendingPath } from "../lib/product";
import { trendingWeekChatAnswer } from "../lib/trending-ask";
import { listSitemapLocs } from "../lib/sitemap-xml";
import {
  buildLlmsTxt,
  listPublicShops,
  publicShopRecord,
} from "../lib/structured-data";
import { trendingDescription, trendingMetadata, trendingRobots } from "../lib/trending-page";
import {
  TRENDING_THIS_WEEK,
  TRENDING_THIS_WEEK_IDS,
  TRENDING_THIS_WEEK_WINDOW,
  listTrendingThisWeekRows,
  listTrendingThisWeekShops,
  trendingMetaRange,
  trendingWindowLabel,
} from "../lib/trending-this-week";
import type { Language } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const LINE_PROMO =
  /\b(paid|promo|sponsored|offers?|discounts?|deals?|free|new menu)\b|%|عرض|عروض|خصم|مجان|برعاية|سبونسر|منيو جديد/i;

assert(
  TRENDING_THIS_WEEK_WINDOW.from === "2026-10-04" &&
    TRENDING_THIS_WEEK_WINDOW.to === "2026-10-11",
  "Trending window is 2026-10-04 to 2026-10-11",
);
assert(TRENDING_THIS_WEEK.length === 0, "Trending allowlist has 0 entries this window");
assert(TRENDING_THIS_WEEK_IDS.length === 0, "Trending ids follow the empty allowlist");
assert(
  TRENDING_THIS_WEEK.map((row) => row.id).join(",") === "",
  "Trending rows stay in allowlist order",
);

const trending = listTrendingThisWeekShops();
assert(trending.length === 0, "listTrendingThisWeekShops resolves 0 cafés");
assert(
  listTrendingThisWeekRows().length === 0,
  "listTrendingThisWeekRows resolves 0 cafés",
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
const FILLED_IDS = [
  "torre-al-rawabi",
  "dm-cafe-roastery-as-sahafah",
  "namq-al-malqa",
  "waqar-al-aziziyah",
] as const;
assert(
  FILLED_IDS.join(",") !== NEW_THIS_WEEK_IDS.join(","),
  "Trending is not the New this week list",
);
assert(
  copy.trendingEmpty.en ===
    "No café cleared our trending bar this week. Check back next week." &&
    copy.trendingEmpty.ar ===
      "ما في مقهى تجاوز معيار الترند هالأسبوع، ارجع لنا الأسبوع الجاي.",
  "empty line is the neutral bar line in EN and AR",
);
assert(
  !/popular|rank|buy|best|الأكثر|ترتيب|اشتري|شراء/i.test(
    `${copy.trendingEmpty.en} ${copy.trendingEmpty.ar}`,
  ),
  "empty line does not claim popularity or add a buy or rank framing",
);
assert(
  !/\bween\b/i.test(copy.trendingEmpty.en) && !/وين/.test(copy.trendingEmpty.ar),
  "empty line does not say ween",
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
  !/TRENDING_THIS_WEEK\s*\[/.test(trendingSrc) &&
    !/listTrendingThisWeek(?:Rows|Shops)\(\)\s*\[/.test(trendingSrc),
  "trending data file does not index the list",
);
assert(
  !/\/\s*(?:TRENDING_THIS_WEEK|rows|shops)\.length/.test(trendingSrc),
  "trending data file does not divide by the list length",
);
assert(
  trendingWindowLabel("ar") === "4 أكتوبر – 11 أكتوبر" &&
    trendingWindowLabel("en") === "4 Oct – 11 Oct",
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
  home.includes("const trendingShops = listTrendingThisWeekShops()") &&
    home.includes("<HomeTrending language={language} shops={trendingShops} />") &&
    home.includes("flushTop={trendingShops.length === 0}"),
  "bare home feeds Trending from the trending allowlist and drops the following gap when it is empty",
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
assert(
  trendingUi.includes("if (rows.length === 0) return null;"),
  "empty home Trending renders nothing",
);
assert(
  !/\[\s*0\s*\]/.test(trendingUi) && !/\/\s*rows\.length/.test(trendingUi),
  "home Trending does not index [0] or divide by length",
);

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

function homeHtml(language: Language, shops = listTrendingThisWeekShops()): string {
  return renderToStaticMarkup(
    createElement(HomeTrending, {
      language,
      shops,
    }),
  );
}

for (const language of ["ar", "en"] as const) {
  const html = homeHtml(language);
  assert(html === "", `${language} home hides the trending block when the list is empty`);
  assert(!html.includes("data-home-trending"), `${language} home has no trending section`);
  assert(!html.includes("data-trending-id"), `${language} home has no trending tiles`);
  assert(
    !html.includes(language === "ar" ? "ترند الأسبوع" : "Trending this week"),
    `${language} home has no empty trending heading`,
  );
}

const sampleShop = getShop("namq-al-malqa");
const sample = listDirectoryShops().find((shop) => shop.id === "namq-al-malqa");
assert(
  sampleShop && sampleShop.example === false && sample,
  "a catalog café can still fill the home block",
);
const filledHome = homeHtml("en", [sample]);
assert(
  filledHome.includes("data-home-trending") &&
    filledHome.includes('data-trending-id="namq-al-malqa"') &&
    filledHome.includes("Trending this week"),
  "a non-empty list still renders the home block",
);

const PROMO = /\b(paid|promo|sponsored|offer)\b|عروض|برعاية|سبونسر/i;

const filledShops = FILLED_IDS.map((id) => listDirectoryShops().find((shop) => shop.id === id));
assert(
  filledShops.every((shop) => shop != null),
  "filled fixture resolves four catalog cafés",
);
const filledFixture = filledShops.flatMap((shop) => (shop ? [shop] : []));
for (const language of ["ar", "en"] as const) {
  const html = homeHtml(language, filledFixture);
  const ids = [...html.matchAll(/data-trending-id="([^"]+)"/g)].map((match) => match[1]);
  assert(ids.join(",") === FILLED_IDS.join(","), `${language} home fixture keeps the four cafés`);
  assert(html.includes("grid-cols-2"), `${language} lays four tiles out two-by-two`);
  assert(!html.includes("grid-cols-3"), `${language} does not leave a lone tile on a second row`);
  assert(
    html.includes(`href="${trendingPath(language)}"`),
    `${language} home View all points at the Trending page`,
  );
  assert(!PROMO.test(html), `${language} home tiles have no promo wording`);
  assert(!/\bween\b/i.test(html), `${language} home tiles do not say ween`);
}

function listHtml(language: Language, rows = listTrendingThisWeekRows()): string {
  return renderToStaticMarkup(
    createElement(TrendingThisWeekList, { language, rows }),
  );
}

for (const language of ["ar", "en"] as const) {
  const html = listHtml(language);
  assert(!html.includes("data-trending-id"), `${language} page has no cafés this week`);
  assert(!html.includes("data-trending-list"), `${language} page has no café list`);
  assert(!html.includes("ItemList"), `${language} page emits no ItemList`);
  assert(!html.includes("application/ld+json"), `${language} page emits no JSON-LD`);
  assert(html.includes(trendingWindowLabel(language)), `${language} window comes from the data file`);
  assert(html.includes(copy.trendingEmpty[language]), `${language} empty state`);
  assert(html.includes("data-trending-empty"), `${language} empty state is marked`);
  assert(
    html.includes(language === "ar" ? "ترند الأسبوع" : "Trending this week"),
    `${language} page keeps its heading`,
  );
  assert(!/\bween\b/i.test(html), `${language} page does not say ween`);
  assert(!PROMO.test(html), `${language} page has no promo or offer wording`);
  assert(!/popular|rank|buy|الأكثر|ترتيب/i.test(html), `${language} page does not claim popularity`);
}

assert(sample, "sample café exists for the non-empty list path");
const filledList = listHtml("en", [
  {
    shop: sample,
    lineAr: "سطر تجريبي للقائمة.",
    lineEn: "A sample line for the list.",
  },
]);
assert(
  filledList.includes("data-trending-list") &&
    filledList.includes('data-trending-id="namq-al-malqa"') &&
    filledList.includes("A sample line for the list.") &&
    !filledList.includes("data-trending-empty"),
  "a non-empty list still renders café cards and lines",
);

const llms = buildLlmsTxt();
for (const id of [
  "torre-al-rawabi",
  "dm-cafe-roastery-as-sahafah",
  "waqar-al-aziziyah",
] as const) {
  assert(!llms.includes(id), `llms.txt does not name dropped trending id ${id}`);
}

const pageSrc = readFileSync("components/trending-this-week-page.tsx", "utf8");
assert(pageSrc.includes("trendingWindowLabel(language)"), "window is not hardcoded in the component");
assert(!pageSrc.includes("25 سبتمبر") && !pageSrc.includes("25 Sep"), "component does not hardcode the window");
assert(!pageSrc.includes("4 أكتوبر") && !pageSrc.includes("4 Oct"), "component does not hardcode this window");
assert(pageSrc.includes("DirectoryCard"), "Trending page uses the normal café card");
assert(pageSrc.includes("copy.trendingEmpty[language]"), "empty state uses the shared copy");
assert(
  pageSrc.includes("rows.length === 0") && !/rows\s*\[\s*0\s*\]/.test(pageSrc),
  "Trending page branches on length and does not index [0]",
);
assert(
  !pageSrc.includes("ItemList") && !pageSrc.includes("application/ld+json"),
  "Trending page component does not emit ItemList JSON-LD",
);

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
assert(
  /if \(isTrendingSlug\(slug\)\) \{\s*return <TrendingThisWeekPage language="ar" \/>;\s*\}/.test(
    arRoute,
  ) &&
    /if \(isTrendingSlug\(slug\)\) \{\s*return <TrendingThisWeekPage language="en" \/>;\s*\}/.test(
      enRoute,
    ),
  "trending routes render the page and do not attach ItemList JSON-LD",
);

const arMeta = trendingMetadata("ar");
const enMeta = trendingMetadata("en");
function isNoindexFollow(robots: unknown): boolean {
  return Boolean(
    robots &&
      typeof robots === "object" &&
      "index" in robots &&
      "follow" in robots &&
      (robots as { index?: boolean; follow?: boolean }).index === false &&
      (robots as { index?: boolean; follow?: boolean }).follow === true,
  );
}
assert(trendingMetaRange("en") === "4–11 Oct" && trendingMetaRange("ar") === "4–11 أكتوبر", "meta range is the compact window");
assert(
  enMeta.description ===
    "No café cleared our trending bar this week (4–11 Oct). Check back next week." &&
    arMeta.description ===
      "ما في مقهى تجاوز معيار الترند هالأسبوع (4–11 أكتوبر)، ارجع لنا الأسبوع الجاي.",
  "empty week meta description is the neutral line plus the window",
);
assert(isNoindexFollow(arMeta.robots) && isNoindexFollow(enMeta.robots), "empty trending pages are noindex, follow");
assert(
  trendingDescription("en", FILLED_IDS.map((id) => ({ id }))) ===
    "Riyadh cafés on the list this week." &&
    trendingDescription("ar", FILLED_IDS.map((id) => ({ id }))) ===
      "قهاوي الرياض اللي على ترند هالأسبوع." &&
    trendingRobots(FILLED_IDS.map((id) => ({ id }))) === undefined,
  "a filled list restores the indexable description",
);
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
assert(locs.length === 1211, `sitemap is 1211 (4 legal pages AR/EN + 1111 plus 10 Batch E cafés, 9 Batch F cafés, 15 Batch G cafés, 7 Batch H cafés and 6 Batch I cafés × AR/EN, plus the Shubra district AR/EN), got ${locs.length}`);
assert(
  locs.includes("https://wain.lol/coffee-shops/trending") &&
    locs.includes("https://wain.lol/en/coffee-shops/trending"),
  "sitemap lists both Trending URLs",
);

const chips = readFileSync("lib/discovery-categories.ts", "utf8");
assert(!chips.includes('slug: "trending"'), "Trending is not a chip");

const TRENDING_ASKS = [
  ["trending", "en"],
  ["what's trending this week", "en"],
  ["ترند", "ar"],
  ["وش الترند هالأسبوع", "ar"],
] as const;
for (const [text, language] of TRENDING_ASKS) {
  assert(isTrendingWeekAsk(text), `${text} is a trending-week ask`);
  assert(!parseIntent(text).moments.includes("popular"), `${text} is not a Most Popular ask`);
  const answer = trendingWeekChatAnswer({ text, landing: language });
  assert(answer.language === language, `${text} answers in the user's language`);
  assert(answer.picks.length === 0, `${text} returns no café list while the week is empty`);
  assert(answer.reply.includes(copy.trendingEmpty[language]), `${text} uses the neutral line`);
  assert(
    answer.reply.includes(`${PUBLIC_SITE_URL}${trendingPath(language)}`),
    `${text} links to the trending page`,
  );
  assert(!/namq|نمق/i.test(answer.reply), `${text} does not name a café`);
}
assert(!isTrendingWeekAsk("most popular"), "most popular stays off the weekly ask");
assert(!isTrendingWeekAsk("trendy"), "trendy stays off the weekly ask");
assert(!isTrendingWeekAsk("الأكثر طلباً"), "الأكثر طلباً stays off the weekly ask");
assert(!isTrendingWeekAsk("الأكثر شعبية"), "الأكثر شعبية stays off the weekly ask");
assert(parseIntent("most popular").moments.includes("popular"), "most popular still ranks Most Popular");
assert(parseIntent("trendy").moments.includes("popular"), "trendy still ranks Most Popular");
assert(parseIntent("الأكثر طلباً").moments.includes("popular"), "الأكثر طلباً still ranks Most Popular");
const popularLead = pickCafes({ text: "most popular", language: "en" });
assert(popularLead.askedMoments.includes("popular"), "most popular still uses the popular rank");
assert(popularLead.picks[0]?.shop.id === "namq-al-malqa", "Most Popular still leads with Namq");

const filledAnswer = trendingWeekChatAnswer({
  text: "trending",
  landing: "en",
  rows: FILLED_IDS.map((id) => ({
    id,
    lineAr: "سطر محايد.",
    lineEn: "A neutral line.",
  })),
});
assert(
  filledAnswer.picks.map((pick) => pick.id).join(",") === FILLED_IDS.join(","),
  "a filled week returns the trending cafés in allowlist order",
);
assert(
  filledAnswer.picks.map((pick) => pick.id).join(",") !==
    popularLead.picks.map((pick) => pick.shop.id).join(","),
  "filled trending chat is not the Most Popular picks",
);
assert(filledAnswer.picks[0]?.id === "torre-al-rawabi", "filled trending does not lead with the popular rank");
assert(filledAnswer.reply === "Trending this week", "filled trending reply is the section heading");

const chatRoute = readFileSync("app/api/chat/route.ts", "utf8");
const chatUi = readFileSync("components/chat.tsx", "utf8");
const trendingAskAt = chatRoute.indexOf("isTrendingWeekAsk(text)");
const offTopicAt = chatRoute.indexOf("isOffTopicAsk(text)");
const pickAt = chatRoute.indexOf("pickCafes({");
assert(
  trendingAskAt > 0 && trendingAskAt < offTopicAt && trendingAskAt < pickAt,
  "chat answers a trending ask before off-topic and before Most Popular",
);
assert(chatUi.includes('part.startsWith("https://")'), "chat renders the trending URL as a link");

async function assertChatRoute(text: string, landing: "ar" | "en") {
  const response = await chatPost(
    new Request("https://wain.lol/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, landing }),
    }),
  );
  assert(response.status === 200, `${text} chat status ${response.status}`);
  const body = (await response.json()) as {
    language: string;
    reply: string;
    picks: { id: string }[];
  };
  const answer = trendingWeekChatAnswer({ text, landing });
  assert(body.language === answer.language, `${text} route language`);
  assert(body.reply === answer.reply, `${text} route reply`);
  assert(body.picks.length === 0, `${text} route has no café list`);
}

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
  for (const [text, landing] of TRENDING_ASKS) {
    await assertChatRoute(text, landing);
  }
  console.log("check-trending-this-week: ok");
})().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
