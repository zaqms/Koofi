/**
 * Fixed list pages: Nearby, Outdoor seating, Best coffee, Work.
 * Rules and counts are pinned. One H1. Chat does not auto-send.
 * Best coffee and Work contain zero chains. No Places calls.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FixedListBody } from "../components/fixed-list-body";
import { isChainShop } from "../lib/chain-brands";
import {
  directoryShopsInOrder,
  listListingShops,
  listRealShops,
} from "../lib/catalog";
import { formatDistanceKm } from "../lib/distance";
import {
  FIXED_LIST_ACTION,
  FIXED_LIST_HEADING,
  FIXED_LIST_IDS,
  FIXED_LIST_NEARBY_PAGE_SIZE,
  fixedListAllowsChains,
  fixedListExplainer,
  fixedListHeading,
  NEARBY_EXPLAINER,
  type FixedListId,
} from "../lib/fixed-list-ids";
import {
  fixedListDescription,
  fixedListMetadata,
  listBestCoffeeShops,
  listFixedListShops,
  listNearbyShops,
  listOutdoorShops,
  listWorkShops,
} from "../lib/fixed-lists";
import { listLiveCatalogDistrictIds } from "../lib/district-dictionary";
import { listPopularDirectoryShops, listPopularPublicShops } from "../lib/most-popular";
import { chipSharePath, isFixedListChip, isStaticDirectoryChip } from "../lib/product";
import { listSitemapLocs } from "../lib/sitemap-xml";
import {
  fixedListItemListJsonLd,
  listPublicShops,
  publicShopsItemList,
} from "../lib/structured-data";
import { officialShopCoords } from "../lib/place-coords";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const PIN = {
  nearby: 592,
  outdoor: 278,
  coffee: 71,
  work: 65,
} as const;

assert(listRealShops().length === 647, "catalog is 647 after the 21 Oct trending adds (10), Batch SD1 Al Shohda (14 adds), Batch S As Salam (6 adds), Batch R Al Qadisiyah (8 adds), the 18 Oct trending adds (7), Trace Al Mursalat (AJ add), Batch Q, Batch P, Batch O and Found Ar Rabwah (468 + 10 At Taawun + 9 Shubra + 15 An Nafal + 7 Al Izdihar + 6 Ar Rahmaniyyah + 8 Al Mathar + 4 other adds + 12 Umm Al Hamam Al Gharbi + 3 Umm Al Hamam Ash Sharqi + 13 Diplomatic Quarter + 15 Dhahrat Laban + 1 Found Ar Rabwah + 4 Namar + 14 Tuwaiq + 12 Ash Shifa + 1 Trace Al Mursalat + 7 trending adds 18 Oct + 8 Al Qadisiyah + 6 As Salam + 14 Al Shohda)");
assert(listListingShops().length === 592, "listing is 592 (10 trending adds 21 Oct + 14 Batch SD1 Al Shohda + 6 Batch S As Salam + 8 Batch R Al Qadisiyah + 7 trending adds 18 Oct + 1 Trace Al Mursalat + 12 Batch Q Ash Shifa + 14 Batch P Tuwaiq + 1 Found Ar Rabwah + 413 + 10 Batch E At Taawun + 9 Batch F Shubra + 15 Batch G An Nafal + 7 Batch H Al Izdihar + 6 Batch I Ar Rahmaniyyah + 8 Batch J Al Mathar + 4 Batch J other adds + 12 Batch K Umm Al Hamam Al Gharbi + 3 Batch L Umm Al Hamam Ash Sharqi + 13 Batch M Diplomatic Quarter + 15 Batch N Dhahrat Laban + 4 Batch O Namar)");
assert(listPublicShops().length === 592, "sit-down listing is 592");
assert(
  publicShopsItemList().numberOfItems === listRealShops().length,
  "GET /api/shops includes every café page",
);
assert(listLiveCatalogDistrictIds().length === 67, "district pages are 67 (Al Raqban and the Takhassusi street retired)");
assert(listSitemapLocs().length === 1473, "sitemap is 1473 (+ 10 trending adds 21 Oct cafés × AR/EN; − Al Raqban and Al Takhassusi district pages AR/EN)");

assert(FIXED_LIST_NEARBY_PAGE_SIZE === 12, "Nearby shows 12, then show more");
assert(formatDistanceKm(1.2, "ar") === "1.2 كم", "AR distance is 1.2 كم");
assert(formatDistanceKm(1.2, "en") === "1.2 km", "EN distance is 1.2 km");

const nearby = listNearbyShops();
assert(nearby.length === PIN.nearby, `nearby is ${PIN.nearby}, got ${nearby.length}`);
assert(
  nearby.every((shop) => officialShopCoords(shop) != null),
  "nearby is listing rows with official coords",
);
assert(
  nearby.filter((shop) => isChainShop(shop)).length === 48,
  "nearby includes the 48 listed chains (21 Oct adds Namq Al Malqa and As Salam; Batch SD1 adds 2 dr.CAFE, Peet's, Starbucks, Half Million, Tim Hortons and Caribou Al Shohda; 8 on main + Drive Al Ghadeer and Al Qirawan + Veloce At Taawun + Half Million and Tim Hortons Shubra + Costa, Starbucks and dr.CAFE An Nafal) + Starbucks and Java Time Ar Rahmaniyyah + Peet's and 3 Starbucks Al Mathar + Starbucks Oruba Square Umm Al Hamam Al Gharbi + Costa, Caribou and 2 Starbucks Diplomatic Quarter + Veloce and dr.CAFE Dhahrat Laban + Java Cafe and The Coffee Bean & Tea Leaf Namar + Java Cafe and 2 Half Million Ash Shifa + Peet's, Half Million, 2 Starbucks and Tim Hortons Al Qadisiyah (Batch R)",
);
assert(
  new Set(nearby.map((shop) => shop.id)).size === nearby.length,
  "nearby does not brand-dedupe branches away",
);

const outdoor = listOutdoorShops();
assert(outdoor.length === PIN.outdoor, `outdoor is ${PIN.outdoor}, got ${outdoor.length}`);
assert(
  outdoor.every((shop) => shop.outdoorSeating === true),
  "outdoor is Places outdoorSeating === true only",
);
assert(
  listListingShops().filter((shop) => shop.outdoorSeating !== true).every(
    (shop) => !outdoor.some((row) => row.id === shop.id),
  ),
  "null, false, and missing outdoor seating stay out",
);
assert(
  outdoor.every((shop) => shop.pickupOnly !== true),
  "outdoor drops pickup-only rows (same pickupOnly === true rule as the catalog)",
);
assert(
  read("lib/fixed-lists.ts").includes("shop.outdoorSeating === true && shop.pickupOnly !== true"),
  "outdoor filter carries the spec's not-pickup-only guard",
);
assert(
  outdoor.filter((shop) => isChainShop(shop)).length === 20 &&
    outdoor.filter((shop) => !isChainShop(shop)).length === 258,
  "outdoor is 258 local + 20 chains (trending adds 21 Oct: Sample Roastery Al Rayyan, Hjeen At Taawun, MID-SAJJ Al Ghadeer and Harmony An Nakheel; 21 Oct: Namq Al Malqa moves to chains; Batch SD1 adds Andarena, BeFine, Cobee, Arco, Tahn and Black Wolf, plus dr.CAFE Ash Shuhada, Peet's and Tim Hortons Granada Mall as chains; Batch S adds Sakaf and Breehant As Salam; Batch R adds Half Million and Starbucks Rakaa Plaza Al Qadisiyah as chains; Batch Q adds Light Dose and Butterfly Ash Shifa, plus Java Cafe and Half Million Tirmidhi Ash Shifa as chains; Batch P adds IRLO, Ratio, Quba, Gedeb, BREATH, Lihaf, Inverno, Era, Haqwa and Nv Tuwaiq; Batch O adds Freedom Namar, plus Java Cafe and The Coffee Bean & Tea Leaf Namar as chains; Batch N adds Crete, Ezwa and Jadeel Dhahrat Laban; Batch M adds 8 Diplomatic Quarter local cafés plus Costa and Caribou DQ as chains; Veloce At Taawun is a chain with outdoor seating; Batch F adds mhj cafe and Coffee Address Shubra; Batch G adds 6 An Nafal local cafés; Batch H adds CONVOY, temper, Rakiza and Hijana; Batch I adds Sipology and Ramli Cafe, plus Starbucks Ar Rahmaniyyah as a chain; Batch J adds Richony Cafe and Urth Caffé Al Mathar, plus Peet's Euromarché as a chain; Batch J other adds Nafees; Batch K adds ARCHI, Caffeination, Café Kitsuné, Jaam Coffee, MIDWAY Coffee, Hamasat Coffee and Mazaj Cafe Umm Al Hamam Al Gharbi; Starbucks Oruba has no outdoor seating)",
);

const coffee = listBestCoffeeShops();
assert(coffee.length === PIN.coffee, `best coffee is ${PIN.coffee}, got ${coffee.length}`);
assert(
  coffee.every((shop) => shop.momentTags.includes("roaster") && !isChainShop(shop)),
  "best coffee is local roasters",
);
assert(
  coffee.map((shop) => shop.id).join(",") ===
    listPopularPublicShops()
      .filter((shop) => shop.momentTags.includes("roaster"))
      .map((shop) => shop.id)
      .join(","),
  "best coffee is the roaster slice of listPopularPublicShops",
);

const work = listWorkShops();
assert(work.length === PIN.work, `work is ${PIN.work}, got ${work.length}`);
assert(
  work.every(
    (shop) =>
      shop.momentTags.includes("work") && shop.dineIn === true && !isChainShop(shop),
  ),
  "work is local, tagged work, Places dineIn === true",
);
assert(
  !work.some((shop) => shop.id === "namq-al-malqa"),
  "the work-tagged café with dineIn false stays out",
);

for (const id of ["coffee", "work"] as const) {
  assert(
    listFixedListShops(id).every((shop) => !isChainShop(shop)),
    `${id} contains zero chains`,
  );
  assert(!fixedListAllowsChains(id), `${id} has no chain toggle`);
}
assert(fixedListAllowsChains("nearby") && fixedListAllowsChains("outdoor"), "chains on Nearby and Outdoor");

for (const id of FIXED_LIST_IDS) {
  assert(isFixedListChip(id), `${id} is a fixed-list chip`);
  assert(!isStaticDirectoryChip(id), `${id} is not a static three-ask chip`);
  assert(chipSharePath(id, "ar") === `/coffee-shops/${id}`, `${id} AR slug stays`);
  assert(chipSharePath(id, "en") === `/en/coffee-shops/${id}`, `${id} EN slug stays`);
  assert(fixedListHeading(id, "ar") === FIXED_LIST_HEADING[id].ar, `${id} AR H1`);
  assert(fixedListHeading(id, "en") === FIXED_LIST_HEADING[id].en, `${id} EN H1`);
  const description = fixedListDescription(id, "ar") + fixedListDescription(id, "en");
  assert(description.includes(String(PIN[id])), `${id} meta description has the live count`);
  assert(!description.includes("وين ودّك"), `${id} description is not the opener`);
  assert(!/\bween\b/i.test(description + fixedListExplainer(id, "en")), `${id} copy has no ween`);
  assert(!/koofi/i.test(description + fixedListHeading(id, "en") + fixedListHeading(id, "ar")), `${id} copy has no Koofi`);
  const meta = fixedListMetadata(id, "ar");
  assert(meta.title === `${FIXED_LIST_HEADING[id].ar} · wain.lol`, `${id} title`);
  assert(!JSON.stringify(meta).includes("noindex"), `${id} stays indexable`);
  const itemList = fixedListItemListJsonLd(id, "ar");
  if (id === "nearby") {
    assert(itemList == null, "nearby has no ItemList — the order is the visitor's");
  } else {
    assert(itemList?.["@type"] === "ItemList", `${id} ItemList`);
    assert(itemList?.numberOfItems === PIN[id], `${id} ItemList count`);
    if (id === "coffee" || id === "work") {
      assert(
        listFixedListShops(id).every((shop) => !isChainShop(shop)),
        `${id} ItemList source has zero chains`,
      );
    }
  }
}

// QA round 1 (M1, L4, I1): copy follows the page state and the spec wording.
assert(FIXED_LIST_HEADING.work.en === "Coffee shops to work from in Riyadh", "EN Work H1 is the spec wording");
assert(
  fixedListMetadata("work", "en").title === "Coffee shops to work from in Riyadh · wain.lol" &&
    fixedListDescription("work", "en").includes("to work from") &&
    !fixedListDescription("work", "en").includes("good for work"),
  "EN Work title and meta match the H1 wording",
);
assert(
  fixedListDescription("nearby", "ar") ===
    `${PIN.nearby} قهاوي في الرياض، تترتب حسب المسافة لما تشارك موقعك.` &&
    fixedListDescription("nearby", "en") ===
      `${PIN.nearby} cafes in Riyadh, sorted by distance once you share your location.`,
  "Nearby meta does not claim a distance sort before a location is shared",
);
assert(
  NEARBY_EXPLAINER.noLocation.ar ===
    "شارك موقعك ونرتبها لك حسب المسافة. للحين هذي أشهر القهاوي في الرياض." &&
    NEARBY_EXPLAINER.noLocation.en ===
      "Share your location to sort by distance. Until then, these are Riyadh's most popular." &&
    NEARBY_EXPLAINER.denied.ar ===
      "الموقع مقفل، فهذي أشهر القهاوي في الرياض. أو اختر حي من تحت." &&
    NEARBY_EXPLAINER.denied.en ===
      "Location is off, so these are Riyadh's most popular. Or pick a neighborhood below." &&
    NEARBY_EXPLAINER.unread.ar === "ما قدرنا نقرأ موقعك." &&
    NEARBY_EXPLAINER.unread.en === "Couldn't read your location." &&
    NEARBY_EXPLAINER.located.ar === "مرتبة حسب المسافة من موقعك." &&
    NEARBY_EXPLAINER.located.en === "Sorted by distance from you.",
  "Nearby explainer lines per location state",
);
assert(
  fixedListExplainer("outdoor", "ar") ===
    "اللي ما عندها جلسات خارجية في Google Maps أو بياناتها ناقصة ما تطلع هنا." &&
    fixedListExplainer("work", "ar") === "قهاوي اخترناها للشغل والقعدة الطويلة." &&
    !fixedListExplainer("work", "ar").includes("موسومة"),
  "Outdoor and Work AR explainers use the QA wording",
);
for (const line of Object.values(NEARBY_EXPLAINER).flatMap((row) => [row.ar, row.en])) {
  assert(!/\bween\b/i.test(line) && !/koofi/i.test(line), "Nearby explainer has no ween / Koofi");
}

const chat = read("components/chat.tsx");
assert(
  chat.includes("isFixedListChip(selectedChipId)") &&
    chat.includes("isFixedListChip(chipId)") &&
    chat.includes("listFirst && !threadVisible ? null") &&
    chat.includes("usePeekVisitorLocation") &&
    !chat.includes("useVisitorLocation("),
  "fixed lists do not auto-send, do not mount the opener H1, and chat does not prompt for location",
);

const bodySrc = read("components/fixed-list-body.tsx");
const pageSrc = read("components/fixed-list-page.tsx");
assert((bodySrc.match(/<h1\b/g) ?? []).length === 1, "fixed list body has exactly one H1");
assert(!pageSrc.includes("<h1"), "page shell adds no second H1");
assert(!pageSrc.includes("LegacyOpenerHero"), "list page does not render the opener hero");
assert(bodySrc.includes("autoLocate={false}"), "cards do not prompt for location");
assert(bodySrc.includes("usePeekVisitorLocation"), "granted permission can fill location without a tap");
assert(bodySrc.includes("requestVisitorLocation({ retry: true })"), "location prompt is on tap");
assert(bodySrc.includes("data-fixed-show-more"), "Nearby show more is in the list");
assert(bodySrc.includes("FIXED_LIST_NEARBY_PAGE_SIZE"), "show more uses the page size");
assert(!bodySrc.includes("pickNearestShops") && !bodySrc.includes("TARGET_PICKS"), "the page list does not use the chat 3-pick cap");
assert(pageSrc.includes("selectedChipId={listId}"), "chat stays on the page");
assert(read("components/fixed-list-nav.tsx").includes("data-fixed-list-footer"), "footer links the four lists");
assert(read("components/shop-directory.tsx").includes("FixedListPills"), "district pages get the sibling row");
assert(!read("lib/fixed-lists.ts").includes('from "./places"'), "no Places client in the list rules");
assert(!read("lib/fixed-lists.ts").includes("noindex"), "lists are not noindex");
assert(FIXED_LIST_ACTION.showMore.ar === "عرض المزيد" && FIXED_LIST_ACTION.showMore.en === "Show more", "show more copy");
assert(
  FIXED_LIST_ACTION.useLocation.ar === "استخدم موقعي" &&
    FIXED_LIST_ACTION.useLocation.en === "Use my location" &&
    FIXED_LIST_ACTION.retryLocation.ar === "جرّب مرة ثانية" &&
    FIXED_LIST_ACTION.retryLocation.en === "Try again" &&
    FIXED_LIST_ACTION.locationBlocked.en === "Location is blocked in the browser." &&
    FIXED_LIST_ACTION.pickNeighborhood.en === "Pick a neighborhood instead" &&
    FIXED_LIST_ACTION.pickNeighborhood.ar === "اختر حي بداله" &&
    !FIXED_LIST_ACTION.locationBlocked.en.toLowerCase().includes("phone") &&
    !FIXED_LIST_ACTION.locationBlocked.ar.includes("جوال"),
  "use my location and retry copy; a block is a device-neutral notice",
);
assert(
  bodySrc.includes('data-location-notice="blocked"') &&
    bodySrc.includes("neighborhoodsPath") &&
    bodySrc.includes("FIXED_LIST_ACTION.pickNeighborhood") &&
    bodySrc.includes('data-retry-location=""') &&
    bodySrc.includes("FIXED_LIST_ACTION.retryLocation"),
  "denied location is a notice with a neighborhood path and Try again, not a bean button",
);
assert(
  /function sendChip\(chip: ChipPick\) \{[\s\S]*?chip\.id === NEARBY_CHIP\.id[\s\S]*?requestVisitorLocation\(\{ retry: true \}\)/.test(
    chat,
  ),
  "the home Nearby tile requests location on the tap, before navigation",
);

function renderList(id: FixedListId, language: "ar" | "en" = "ar"): string {
  return renderToStaticMarkup(
    createElement(FixedListBody, {
      language,
      listId: id,
      shops: directoryShopsInOrder(listFixedListShops(id)),
      popularFallback:
        id === "nearby"
          ? listPopularDirectoryShops().slice(0, FIXED_LIST_NEARBY_PAGE_SIZE)
          : [],
      neighborhoodCandidates: [],
    }),
  );
}

for (const id of FIXED_LIST_IDS) {
  for (const language of ["ar", "en"] as const) {
    const html = renderList(id, language);
    const h1s = html.match(/<h1\b/g) ?? [];
    assert(h1s.length === 1, `${language} ${id} renders exactly one H1`);
    assert(html.includes(fixedListHeading(id, language)), `${language} ${id} H1 text`);
    assert(!html.includes("وين ودّك تروح اليوم؟"), `${language} ${id} has no opener H1`);
    assert(!html.includes("Where do you want to go today?"), `${language} ${id} has no EN opener`);
    const cards = html.match(/data-listing-card/g) ?? [];
    if (id === "nearby") {
      assert(cards.length === FIXED_LIST_NEARBY_PAGE_SIZE, "nearby without location shows 12 popular");
      assert(html.includes("data-fixed-list-mode=\"popular-fallback\""), "nearby fallback is labelled popular");
      assert(html.includes("data-fixed-list-popular"), "popular heading is present");
      assert(html.includes("data-use-my-location"), "use my location is on the page");
      assert(!html.includes("data-fixed-show-more"), "show more waits for a location");
      assert(!html.includes("data-shop-distance=\"km\""), "fallback cards are not labelled with distance");
      assert(
        html.includes('data-fixed-list-explainer="noLocation"') &&
          html.includes(NEARBY_EXPLAINER.noLocation[language].replace(/'/g, "&#x27;")),
        `${language} nearby server HTML shows the no-location line`,
      );
      assert(
        !html.includes(NEARBY_EXPLAINER.located[language]),
        `${language} nearby server HTML does not claim a distance sort`,
      );
    } else {
      assert(cards.length === PIN[id], `${id} renders the full list (${cards.length})`);
    }
    if (id === "coffee" || id === "work") {
      assert(!html.includes("data-chain-card"), `${id} HTML has zero chain cards`);
      assert(!html.includes("data-chain-filter"), `${id} has no chain toggle`);
    } else if (id === "nearby") {
      assert(
        !html.includes("data-chain-filter"),
        `${language} nearby hides Local only until the distance list shows (fallback has no chains)`,
      );
    } else {
      assert(html.includes("data-chain-filter"), `${id} has the Local only toggle`);
    }
  }
}

const arPage = read("app/[category]/[slug]/page.tsx");
const enPage = read("app/en/[category]/[slug]/page.tsx");
assert(
  arPage.includes("FixedListPage") &&
    arPage.includes('language="ar"') &&
    enPage.includes("FixedListPage") &&
    enPage.includes('language="en"') &&
    arPage.includes("fixedListItemListJsonLd") &&
    !arPage.includes("outdoor-seating") &&
    !arPage.includes("best-coffee") &&
    !arPage.includes("for-work"),
  "existing slugs render FixedListPage — no new routes",
);

console.log("check-fixed-lists: ok", PIN);
