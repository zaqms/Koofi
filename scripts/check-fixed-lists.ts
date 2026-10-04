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
} from "../lib/structured-data";
import { officialShopCoords } from "../lib/place-coords";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function read(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const PIN = {
  nearby: 387,
  outdoor: 179,
  coffee: 66,
  work: 65,
} as const;

assert(listRealShops().length === 441, "catalog stays 441");
assert(listListingShops().length === 387, "listing stays 387");
assert(listPublicShops().length === 387, "/api/shops pool stays 387");
assert(listLiveCatalogDistrictIds().length === 68, "district pages stay 68");
assert(listSitemapLocs().length === 1059, "sitemap stays 1059");

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
  nearby.filter((shop) => isChainShop(shop)).length === 7,
  "nearby includes the 7 listed chains",
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
  outdoor.filter((shop) => isChainShop(shop)).length === 5 &&
    outdoor.filter((shop) => !isChainShop(shop)).length === 174,
  "outdoor is 174 local + 5 chains",
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
    chat.includes("auto: !listFirst"),
  "fixed lists do not auto-send, do not mount the opener H1, and do not prompt from chat",
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
    FIXED_LIST_ACTION.useLocation.en === "Use my location",
  "use my location copy",
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
