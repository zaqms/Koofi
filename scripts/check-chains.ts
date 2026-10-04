/**
 * Chain infrastructure plus the existing dr.CAFE, Java, and 24cafe tags.
 * Those 27 rows were already drive-through, so specialty counts stay put.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { districtArMeta, districtArMarkdown, cafeArMarkdown, chainDistrictHereIntroAr, chainDistrictLeadAr, chainDistrictMetaAr } from "../lib/ar-content";
import { CONTENT_MARKERS, EnRichText } from "../components/en-rich-text";
import {
  CHAIN_BRANDS,
  chainBrandNameEn,
  isChainBrandId,
  isChainShop,
} from "../lib/chain-brands";
import {
  CHAIN_FILTER_EMPTY,
  CHAIN_FILTER_EMPTY_LEAD,
  CHAIN_FILTER_LABEL,
  CHAIN_FILTER_SHOW,
  HIDE_CHAINS_STORAGE_KEY,
  applyHideChains,
  chainFilterDedupeKey,
  chainFilterShowsEmpty,
} from "../lib/chain-filter";
import {
  catalogDistrictIdsFrom,
  chainIsListed,
  seatingVerdictDisagrees,
  discoveryShopsFrom,
  districtListingFrom,
  districtRowsAreUnlistedChains,
  getShop,
  isListingShop,
  listingShopsFrom,
  listBrowseDirectoryShops,
  listDirectoryShopsForDistrict,
  listDiscoveryShops,
  listDriveThroughDirectoryShops,
  listListingShops,
  listDirectoryShops,
  listRealShops,
  listedDistrictIdsFrom,
  bakedPopularityFor,
  specialtyDistrictIdsFrom,
} from "../lib/catalog";
import { listNeighborhoodRows } from "../lib/browse-neighborhoods";
import { categoryDistrictStaticParams } from "../lib/district";
import {
  districtPageHidden,
  hiddenDistrictRedirect,
  listLiveCatalogDistrictIds,
  listLiveDistrictIds,
} from "../lib/district-dictionary";
import { sortDistrictCafes } from "../lib/district-cafe-sort";
import type { DirectoryShop } from "../lib/directory";
import {
  cafeEnMarkdown,
  chainDistrictHereIntroEn,
  chainDistrictLeadEn,
  chainDistrictMetaEn,
  districtEnMarkdown,
  districtEnMeta,
  NEARBY_DISTRICTS,
} from "../lib/en-content";
import { chainOnlyBlock, countedCafesAr, countWord, countWordAr } from "../lib/cafe-count";
import { foldHalfwayPlaceAndScoutAttrs } from "../lib/fold-halfway-place-attrs";
import { isHalfwayEligible, filterHalfwayEligible } from "../lib/halfway-eligibility";
import { rankByPopularity } from "../lib/district-rank";
import { listPopularDirectoryShops } from "../lib/most-popular";
import {
  listBestCoffeeShops,
  listNearbyShops,
  listOutdoorShops,
  listWorkShops,
} from "../lib/fixed-lists";
import { fixedListAllowsChains } from "../lib/fixed-list-ids";
import { formatReply, pickCafes } from "../lib/picker";
import { districtPath } from "../lib/product";
import { dedupeSameBrand, shopBrandKey } from "../lib/shop-brand";
import { matchCatalogShops } from "../lib/shop-name";
import { listSitemapLocs } from "../lib/sitemap-xml";
import { buildLlmsTxt, listPublicShops, publicShopRecord } from "../lib/structured-data";
import {
  CHAIN_POPULARITY_BASE,
  TIKTOK_NEUTRAL_BONUS,
  chainPopularityIndex,
} from "../lib/tiktok-popularity";
import { NEIGHBORHOOD_IDS, type NeighborhoodId, type Shop } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

function fixtureShop(partial: Partial<Shop> & Pick<Shop, "id">): Shop {
  return {
    nameAr: partial.id,
    nameEn: partial.id,
    city: "riyadh",
    neighborhood: "olaya",
    neighborhoodAr: "العليا",
    vibeTags: [],
    momentTags: ["qahwa"],
    example: false,
    dineIn: true,
    outdoorSeating: true,
    ...partial,
  };
}

const localA = fixtureShop({
  id: "local-north",
  nameEn: "Local North",
  nameAr: "محلي شمال",
  neighborhood: "olaya",
  popularityIndex: 70,
});
const localB = fixtureShop({
  id: "local-south",
  nameEn: "Local South",
  nameAr: "محلي جنوب",
  neighborhood: "olaya",
  popularityIndex: 60,
});
const localC = fixtureShop({
  id: "local-east",
  nameEn: "Local East",
  nameAr: "محلي شرق",
  neighborhood: "hittin",
  popularityIndex: 50,
});
const starbucks = fixtureShop({
  id: "starbucks-olaya",
  nameEn: "Starbucks",
  nameAr: "ستاربكس",
  neighborhood: "olaya",
  isChain: true,
  chainBrand: "starbucks",
  momentTags: [],
  vibeTags: [],
  popularityIndex: 99,
});
const starbucksDrive = fixtureShop({
  id: "starbucks-olaya-dt",
  nameEn: "Starbucks Drive",
  nameAr: "ستاربكس",
  neighborhood: "olaya",
  isChain: true,
  chainBrand: "starbucks",
  catalogLane: "drive-through",
  momentTags: ["drive-through"],
  vibeTags: [],
  dineIn: false,
});
const peetsOnly = fixtureShop({
  id: "peets-tuwaiq",
  nameEn: "Peet's",
  nameAr: "بيتس",
  neighborhood: "tuwaiq",
  neighborhoodAr: "طويق",
  isChain: true,
  chainBrand: "peets",
  momentTags: [],
  vibeTags: [],
  dineIn: true,
});
const dunkinOnly = fixtureShop({
  id: "dunkin-namar",
  nameEn: "Dunkin'",
  nameAr: "دانكن",
  neighborhood: "namar",
  isChain: true,
  chainBrand: "dunkin",
  catalogLane: "drive-through",
  momentTags: ["drive-through"],
  vibeTags: [],
  dineIn: false,
});
const barnsA = fixtureShop({
  id: "barns-a",
  nameEn: "Barn's",
  nameAr: "بارنز",
  isChain: true,
  chainBrand: "barns",
});
const barnsB = fixtureShop({
  id: "barns-b",
  nameEn: "Barn's Olaya",
  nameAr: "بارنز",
  isChain: true,
  chainBrand: "barns",
});

const fixtures = [
  localA,
  localB,
  localC,
  starbucks,
  starbucksDrive,
  peetsOnly,
  dunkinOnly,
];

assert(!isChainShop(localA), "a local café is not a chain");
assert(isChainShop(starbucks), "Starbucks fixture is a chain");
assert(
  discoveryShopsFrom(fixtures).every((shop) => !shop.isChain),
  "discovery is local specialty",
);
assert(
  !discoveryShopsFrom(fixtures).some((shop) => shop.id === "starbucks-olaya"),
  "a dine-in chain is absent from discovery even with a high score",
);
assert(
  discoveryShopsFrom(fixtures).map((shop) => shop.id).sort().join(",") ===
    "local-east,local-north,local-south",
  "discovery keeps the three local cafés",
);

const popular = rankByPopularity(discoveryShopsFrom(fixtures));
assert(
  popular.every((shop) => !shop.isChain) && popular[0]?.id === "local-north",
  "Most Popular stays on local cafés and ignores a chain's higher score",
);
assert(
  listPopularDirectoryShops().every((shop) => !shop.isChain),
  "live Most Popular has no chain rows",
);

assert(
  !isHalfwayEligible(starbucks),
  "a chain is not a بيننا candidate even when it is sit-down",
);
assert(
  isHalfwayEligible(localA),
  "a sit-down local café still passes بيننا",
);
assert(
  filterHalfwayEligible(discoveryShopsFrom(fixtures)).every((shop) => !shop.isChain),
  "بيننا candidates stay on discovery, so chains stay out",
);
assert(
  read("lib/meet-halfway.ts").includes(
    "filterHalfwayEligible(input.shops ?? listDiscoveryShops())",
  ),
  "halfway still defaults to listDiscoveryShops",
);

const generic = pickCafes({
  text: "coffee please",
  language: "en",
  shops: fixtures,
});
assert(generic.picks.length > 0, "generic ask still returns picks");
assert(
  generic.picks.every((pick) => !pick.shop.isChain),
  "generic three-picks stay local",
);
const named = pickCafes({
  text: "Starbucks",
  language: "en",
  shops: fixtures,
});
assert(
  named.picks.some((pick) => pick.shop.id === "starbucks-olaya"),
  "a named brand ask finds the chain",
);
assert(
  !named.picks.some((pick) => pick.shop.id === "starbucks-olaya-dt") ||
    named.picks.some((pick) => pick.shop.id === "starbucks-olaya"),
  "the named Starbucks hit is the dine-in branch",
);

const olaya = districtListingFrom(fixtures, "olaya");
assert(
  olaya.map((shop) => shop.id).sort().join(",") === "local-north,local-south,starbucks-olaya",
  "a district with listing shops includes the dine-in chain and drops drive-through",
);
assert(
  districtListingFrom(fixtures, "namar").length === 0,
  "a drive-through chain is not the district page",
);
const localDriveOnly = fixtureShop({
  id: "local-drive-only",
  nameEn: "Local Drive",
  neighborhood: "al-falah",
  catalogLane: "drive-through",
  momentTags: ["drive-through"],
  dineIn: true,
});
assert(
  districtListingFrom([localDriveOnly], "al-falah").map((shop) => shop.id).join(",") ===
    "local-drive-only",
  "a local drive-through row keeps the district page",
);
const pickupFallback = fixtureShop({
  id: "chain-pickup-fallback",
  nameEn: "Dunkin' Pickup",
  neighborhood: "al-izdihar",
  isChain: true,
  chainBrand: "dunkin",
  pickupOnly: true,
  dineIn: true,
  outdoorSeating: false,
  momentTags: [],
});
assert(
  districtListingFrom([pickupFallback], "al-izdihar").length === 0,
  "a pickup-only chain is not a district-page fallback",
);
const closedFallback = fixtureShop({
  id: "chain-closed-fallback",
  nameEn: "Barn's Closed",
  neighborhood: "dhahrat-al-badiah",
  isChain: true,
  chainBrand: "barns",
  dineIn: false,
  outdoorSeating: false,
  momentTags: [],
});
assert(
  districtListingFrom([closedFallback], "dhahrat-al-badiah").length === 0,
  "a non-sit-down chain is not a district-page fallback",
);
assert(
  districtListingFrom(fixtures, "tuwaiq").map((shop) => shop.id).join(",") === "peets-tuwaiq",
  "a chains-only district still has a page",
);
assert(
  !specialtyDistrictIdsFrom(fixtures).includes("tuwaiq"),
  "a chains-only district is not in the specialty set",
);
assert(
  catalogDistrictIdsFrom(fixtures).includes("tuwaiq"),
  "a chains-only district counts in the catalog district set",
);
assert(
  specialtyDistrictIdsFrom(fixtures).includes("olaya") &&
    catalogDistrictIdsFrom(fixtures).includes("olaya"),
  "a mixed district stays in both district sets",
);

const mixed = [localA, starbucks];
assert(
  applyHideChains(mixed, false).map((shop) => shop.id).join(",") ===
    "local-north,starbucks-olaya",
  "chains stay visible until Local only is on",
);
assert(
  applyHideChains(mixed, true).map((shop) => shop.id).join(",") === "local-north",
  "Local only drops chain rows",
);
assert(
  !chainFilterShowsEmpty(mixed, true),
  "Local only with a local café left is not the empty state",
);
assert(
  chainFilterShowsEmpty([starbucks], true) &&
    applyHideChains([starbucks], true).length === 0,
  "Local only on a chains-only list is the empty state",
);
assert(!chainFilterShowsEmpty([starbucks], false), "default does not show the empty state");
assert(CHAIN_FILTER_LABEL.en === "Local only", "EN toggle label");
assert(CHAIN_FILTER_LABEL.ar === "المحلية بس", "AR toggle label");
assert(
  CHAIN_FILTER_EMPTY_LEAD.en + CHAIN_FILTER_SHOW.en === CHAIN_FILTER_EMPTY.en,
  "EN empty state reads as one sentence",
);
assert(
  CHAIN_FILTER_EMPTY_LEAD.ar + CHAIN_FILTER_SHOW.ar === CHAIN_FILTER_EMPTY.ar,
  "AR empty state reads as one sentence",
);
assert(
  CHAIN_FILTER_EMPTY.en ===
    "No local cafés here yet — only chains so far. Show chains",
  "EN empty state copy",
);
assert(
  CHAIN_FILTER_EMPTY.ar ===
    "ما فيه قهاوي محلية هنا للحين، بس سلاسل. اعرض السلاسل",
  "AR empty state copy",
);
assert(HIDE_CHAINS_STORAGE_KEY === "wain.hideChains.v1", "toggle persists in localStorage");
assert(
  chainFilterDedupeKey({
    listing: "district",
    districtId: "olaya",
    language: "en",
    state: "hidden",
  }) === "chain_filter:district:olaya:en:hidden",
  "chain_filter dedupe key mirrors directory_sort",
);
assert(
  chainFilterDedupeKey({
    listing: "category",
    language: "ar",
    state: "shown",
  }) === "chain_filter:category::ar:shown",
  "category chain_filter key leaves district empty",
);

const directory = read("components/shop-directory.tsx");
const chat = read("components/chat.tsx");
const picker = read("lib/picker.ts");
assert(directory.includes("useSyncExternalStore"), "toggle uses useSyncExternalStore");
assert(directory.includes("subscribeHideChains"), "toggle subscribes like district sort");
assert(directory.includes("data-chain-filter"), "toggle is marked for the listing");
assert(!directory.includes("URLSearchParams"), "toggle has no URL param");
assert(!read("lib/chain-filter.ts").includes("searchParams"), "chain filter does not read the URL");
assert(!chat.includes("hideChains") && !picker.includes("hideChains"), "the toggle does not carry into chat");
assert(read("lib/track.ts").includes("| \"chain_filter\""), "chain_filter is an analytics event");

function directoryRow(
  partial: Partial<DirectoryShop> & Pick<DirectoryShop, "id" | "addedAt" | "catalogIndex">,
): DirectoryShop {
  return {
    nameAr: partial.id,
    nameEn: partial.id,
    neighborhood: "olaya",
    neighborhoodAr: "العليا",
    vibeTags: [],
    momentTags: [],
    mapsHref: `https://example.com/${partial.id}`,
    ...partial,
  };
}

const newest = sortDistrictCafes(
  [
    directoryRow({
      id: "local-old",
      nameEn: "Local Old",
      addedAt: "2026-01-01T00:00:00.000Z",
      catalogIndex: 1,
    }),
    directoryRow({
      id: "chain-newest",
      nameEn: "Starbucks",
      addedAt: "2026-09-01T00:00:00.000Z",
      catalogIndex: 9,
      isChain: true,
    }),
    directoryRow({
      id: "local-new",
      nameEn: "Local New",
      addedAt: "2026-06-01T00:00:00.000Z",
      catalogIndex: 4,
    }),
  ],
  "new",
  null,
  "en",
);
assert(
  newest.map((shop) => shop.id).join(",") === "local-new,local-old,chain-newest",
  "New puts chains after local cafés, locals stay newest-first",
);

assert(shopBrandKey(barnsA) === shopBrandKey(barnsB), "Barn's branches share a brand key");
assert(dedupeSameBrand([barnsA, barnsB]).length === 1, "three-pack dedupe collapses a chain brand");
assert(shopBrandKey(starbucks) === "starbucks", "Starbucks brand key");
assert(
  shopBrandKey(fixtureShop({ id: "java-cafe-al-malaz", nameEn: "Java Cafe" })) === "java",
  "Java Cafe keeps the java key",
);
const liveJava = getShop("java-cafe-al-malaz");
const liveDr = getShop("drcafe-namar");
const live24 = getShop("24cafe-al-wadi");
assert(liveJava && shopBrandKey(liveJava) === "java", "live Java Cafe key is unchanged");
assert(liveDr && shopBrandKey(liveDr) === "dr-cafe", "live dr.CAFE key is unchanged");
assert(live24 && shopBrandKey(live24) === "24cafe", "live 24cafe key is unchanged");
assert(
  liveJava?.isChain === true && liveJava.chainBrand === "java",
  "live Java Cafe is tagged java",
);
assert(
  liveDr?.isChain === true && liveDr.chainBrand === "dr-cafe",
  "live dr.CAFE is tagged dr-cafe",
);
assert(
  live24?.isChain === true && live24.chainBrand === "24cafe",
  "live 24cafe is tagged 24cafe",
);
const taggedLive = listRealShops().filter((shop) => shop.isChain === true);
assert(taggedLive.length === 44, "exactly 44 existing rows are tagged (28 on main + 16 Drive Coffee)");
assert(
  taggedLive.filter((shop) => shop.chainBrand === "drive").length === 16 &&
    listRealShops()
      .filter((shop) => shop.nameEn === "Drive Coffee")
      .every((shop) => shop.isChain === true && shop.chainBrand === "drive"),
  "all 16 Drive Coffee rows are tagged drive",
);
assert(
  taggedLive.filter((shop) => shop.chainBrand === "dr-cafe").length === 19,
  "19 dr.CAFE rows are tagged (18 + As Suwaidi, Batch D1)",
);
assert(
  taggedLive.filter((shop) => shop.chainBrand === "java").length === 6,
  "6 Java rows are tagged",
);
assert(
  taggedLive.filter((shop) => shop.chainBrand === "24cafe").length === 3,
  "3 24cafe rows are tagged",
);
const dineInLaneRemoved = [
  // Drive Coffee rows that were never on the drive-through lane (tagged 4 Oct 2026).
  "drive-al-ghadeer",
  "drive-al-arid",
  "drive-al-qirawan",
  // Batch D1 (4 Oct): sit-down + drive-through branch, added without the lane.
  "drcafe-as-suwaidi",
  "drcafe-namar",
  "drcafe-tuwaiq",
  "drcafe-sulimaniyah",
  "drcafe-sulimaniyah-2",
  "drcafe-al-mughrizat",
  "java-cafe-al-malaz",
  "java-cafe-al-manar",
] as const;
const qaKiosks = [
  "drcafe-al-wadi",
  "drcafe-an-nasim-al-gharbi",
  "java-cafe-al-rawabi",
  "java-cafe-al-wadi",
] as const;
const scoutKiosks = [
  "java-cafe-al-muruj",
  "24cafe-al-rabi",
  "24cafe-al-wadi",
] as const;
const laneKept = [
  "drcafe-kkia",
  "drcafe-manfuha",
  "drcafe-an-nasim",
  "drcafe-al-mathar",
  "drcafe-al-jazirah",
  "drcafe-al-jazirah-2",
  "drcafe-shubra",
] as const;
assert(
  taggedLive.every((shop) => shop.momentTags.includes("drive-through")),
  "tagged rows keep the drive-through moment tag",
);
assert(
  dineInLaneRemoved.every((id) => getShop(id)?.catalogLane !== "drive-through"),
  "the 11 sit-down rows leave the drive-through lane",
);
for (const id of qaKiosks) {
  const shop = getShop(id);
  assert(
    shop?.catalogLane === "drive-through" &&
      shop.dineIn === false &&
      shop.seatingVerdict?.dineIn === false &&
      shop.seatingVerdict.source === "qa" &&
      shop.seatingVerdict.date === "2026-10-02",
    `${id} stays a drive-through kiosk with a qa verdict`,
  );
}
for (const id of scoutKiosks) {
  const shop = getShop(id);
  assert(
    shop?.catalogLane === "drive-through" &&
      shop.dineIn === false &&
      shop.seatingVerdict?.dineIn === false &&
      shop.seatingVerdict.source === "scout" &&
      shop.seatingVerdict.date === "2026-10-02",
    `${id} stays a drive-through kiosk with a scout verdict`,
  );
}
const javaRabi = getShop("java-cafe-al-rabi");
assert(
  javaRabi?.catalogLane === "drive-through" &&
    javaRabi.dineIn === true &&
    javaRabi.seatingVerdict == null &&
    javaRabi.neighborhood === "al-rabi" &&
    javaRabi.placeId === "ChIJqd-bBwDjLj4R2d50wDLTI7A" &&
    javaRabi.pin?.lat === 24.801485 &&
    javaRabi.pin?.lng === 46.6544722 &&
    javaRabi.mapsShareUrl?.includes("0x3e2ee300079bdfa9"),
  "java-cafe-al-rabi keeps the Al Rabi drive-through lane on the corrected pin",
);
assert(
  getShop("24cafe-al-rabi")?.neighborhood === "jarir" &&
    getShop("24cafe-al-rabi")?.isChain === true &&
    getShop("24cafe-al-rabi")?.dineIn === false,
  "24cafe-al-rabi is filed in Jarir (its pin), stays a chain kiosk with dineIn=false",
);
assert(
  laneKept.every((id) => getShop(id)?.catalogLane === "drive-through"),
  "unreliable placeIds and the Jazirah/Shubra rows keep the drive-through lane",
);
const laneRemoved = new Set<string>(dineInLaneRemoved);
assert(
  taggedLive
    .filter((shop) => !laneRemoved.has(shop.id))
    .every((shop) => shop.catalogLane === "drive-through"),
  "every other tagged row stays on the drive-through lane",
);
assert(
  listRealShops()
    .filter((shop) => /coffee address/i.test(shop.nameEn))
    .every((shop) => shop.isChain !== true),
  "Coffee Address stays untagged",
);
assert(
  listRealShops()
    .filter((shop) => /arabica/i.test(shop.nameEn))
    .every((shop) => shop.isChain !== true),
  "% Arabica stays untagged",
);

assert(CHAIN_POPULARITY_BASE === 40, "chain popularity base is flat 40");
assert(
  chainPopularityIndex() === CHAIN_POPULARITY_BASE + TIKTOK_NEUTRAL_BONUS,
  "chains take the neutral TikTok weight",
);
assert(
  bakedPopularityFor(starbucks) === chainPopularityIndex(),
  "a chain ignores a baked spike",
);
const waqar = getShop("waqar-al-aziziyah");
assert(waqar && !waqar.isChain, "Waqar stays local");
assert(
  waqar && waqar.popularityIndex === bakedPopularityFor(waqar),
  "a local café keeps its baked popularity plus TikTok bonus",
);

const brandIds = Object.keys(CHAIN_BRANDS);
assert(
  brandIds.join(",") ===
    "starbucks,dunkin,mccafe,barns,peets,dr-cafe,java,24cafe,shqaf,coffee-day,kyan,dancafe,drive",
  "registry is the mass-market set",
);
assert(!isChainBrandId("krispy-kreme"), "Krispy Kreme is not a chain brand");
assert(isChainBrandId("shqaf") && CHAIN_BRANDS.shqaf.nameAr === "شقفه", "Shqaf is شقفه");
assert(isChainBrandId("coffee-day") && CHAIN_BRANDS["coffee-day"].logo === null, "Coffee Day has no invented logo");
assert(isChainBrandId("kyan") && CHAIN_BRANDS.kyan.nameAr === "كيان", "Kyan is كيان");
assert(isChainBrandId("dancafe") && CHAIN_BRANDS.dancafe.nameAr === "دان كافيه", "Dancafe is دان كافيه");
assert(isChainBrandId("drive") && CHAIN_BRANDS.drive.nameAr === "درايف كوفي", "Drive Coffee is درايف كوفي");
assert(
  shopBrandKey(fixtureShop({ id: "drive-x", nameEn: "Drive Coffee" })) === "drive",
  "Drive Coffee brand key",
);
assert(
  shopBrandKey(fixtureShop({ id: "shqaf-x", nameEn: "Shgaf" })) === "shqaf",
  "shgaf resolves to Shqaf",
);
assert(
  shopBrandKey(fixtureShop({ id: "coffee-day-x", nameEn: "Coffee Day" })) === "coffee-day",
  "Coffee Day resolves before a generic coffee key",
);
assert(
  shopBrandKey(fixtureShop({ id: "kyan-x", nameEn: "Kyan" })) === "kyan",
  "Kyan brand key",
);
assert(
  shopBrandKey(fixtureShop({ id: "dancafe-x", nameEn: "Dan Cafe" })) === "dancafe",
  "Dan Cafe resolves to Dancafe",
);
assert(!isChainBrandId("coffee-address"), "Coffee Address stays specialty");
assert(!isChainBrandId("percent-arabica"), "% Arabica stays specialty");
for (const brand of Object.values(CHAIN_BRANDS)) {
  if (brand.logo == null) continue;
  assert(
    existsSync(join(process.cwd(), "public", brand.logo)),
    `${brand.id} logo already exists`,
  );
}
assert(chainBrandNameEn("starbucks") === "Starbucks", "brand label");
const chainRecord = publicShopRecord(starbucks, { includeContext: false });
assert(chainRecord.isChain === true && chainRecord.brand === "Starbucks", "API row carries brand and isChain");
const localRecord = publicShopRecord(localA, { includeContext: false });
assert(!("isChain" in localRecord) && !("brand" in localRecord), "local API rows omit chain fields");

assert(listDiscoveryShops().length === 403, "specialty discovery is 403 (406 on main − 3 Drive Coffee rows now chains)");
assert(listRealShops().length === 468, "catalog is 468 after D1, D2 and D3");
assert(listLiveDistrictIds().length === 62, "specialty districts are 62 (the 3 Drive rows were not a district's only specialty cafe)");
assert(
  catalogDistrictIdsFrom(listRealShops()).length === 78,
  "catalog rows cover 78 districts (Jarir hidden; 4 Bisat batch + 4 Batch D3 districts)",
);
assert(listLiveCatalogDistrictIds().length === 67, "district pages are 67 (72 on main minus 5 Drive-only)");
assert(listDriveThroughDirectoryShops().length === 73, "drive-through is 73 (count unchanged; the 16 Drive rows were already on the list)");
assert(listListingShops().length === 413, "listing is 403 local plus the 10 sit-down chains");
assert(listPublicShops().length === 413, "public list includes the 10 sit-down chains");
assert(listBrowseDirectoryShops().length === 418, "browse is 424 on main minus Drive Al Arid and the 5 Drive-only district rows");
assert(
  listListingShops().filter((shop) => shop.isChain).length === 10,
  "exactly 10 sit-down chains are listed (8 on main + Drive Al Ghadeer and Al Qirawan)",
);
assert(
  listDirectoryShopsForDistrict("al-malaz").some((shop) => shop.id === "java-cafe-al-malaz") &&
    listDirectoryShopsForDistrict("al-manar").some((shop) => shop.id === "java-cafe-al-manar"),
  "Al Malaz and Al Manar list the sit-down Java branches",
);
assert(
  ["al-wadi", "al-muruj", "al-rabi", "al-rawabi", "an-nasim-al-gharbi"].every(
    (id) => !listDirectoryShopsForDistrict(id as NeighborhoodId).some((shop) => shop.isChain),
  ),
  "kiosk districts list local cafes only",
);
assert(
  listDiscoveryShops().every((shop) => !shop.isChain),
  "specialty never counts a chain, even without the drive-through lane",
);
assert(
  listDirectoryShopsForDistrict("al-masif").length === 10,
  "Al Masif listing is unchanged",
);
assert(
  listDirectoryShopsForDistrict("al-aziziyah").map((shop) => shop.id).sort().join(",") ===
    "sama-cafe-al-aziziyah,waqar-al-aziziyah",
  "Al Aziziyah lists Waqar and SAMA",
);

assert(
  districtEnMeta("al-aziziyah") ===
    "Two cafes in Al Aziziyah on wain.lol — a Riyadh neighborhood list including Waqar, with a Maps link.",
  "Al Aziziyah EN meta uses a word for two",
);
assert(
  districtArMeta("al-aziziyah") ===
    "قهوتين بالعزيزية على wain.lol — قائمة حي فيها وقار، وعليها رابط قوقل ماب.",
  "Al Aziziyah AR meta uses a word for two",
);
assert(
  districtEnMeta("al-masif") ===
    "10 cafes in Al Masif on wain.lol — a Riyadh neighborhood list, with Maps links.",
  "Al Masif EN meta uses a digit",
);
assert(
  districtEnMeta("olaya") ===
    "29 cafes in Al Olaya on wain.lol — a Riyadh neighborhood list, with Maps links.",
  "Al Olaya EN meta counts Trov (Batch D3)",
);
const wordingMatrix: {
  total: number;
  local: number;
  chains: number;
  enIntro: string;
  arIntro: string;
  enMeta: string;
  arMeta: string;
}[] = [
  {
    total: 0,
    local: 0,
    chains: 0,
    enIntro: "No cafes from Al Olaya on the catalog yet.",
    arIntro: "ما فيه قهاوي من العليا بالكتالوج للحين.",
    enMeta: "No cafes in Al Olaya on wain.lol yet — a Riyadh neighborhood list.",
    arMeta: "ما فيه قهاوي بالعليا على wain.lol للحين — قائمة حي بالرياض.",
  },
  {
    total: 1,
    local: 0,
    chains: 1,
    enIntro: "{chain-only}There is **one** cafe from Al Olaya on the catalog today — one chain branch:{/chain-only}",
    arIntro: "{chain-only}فيه **قهوة وحدة** من العليا بالكتالوج اليوم — فرع واحد:{/chain-only}",
    enMeta: "One cafe in Al Olaya on wain.lol — chain branch only so far, with a Maps link.",
    arMeta: "قهوة وحدة بالعليا على wain.lol — فرع سلسلة بس للحين، وعليها رابط قوقل ماب.",
  },
  {
    total: 2,
    local: 0,
    chains: 2,
    enIntro: "{chain-only}There are **two** cafes from Al Olaya on the catalog today — two chain branches:{/chain-only}",
    arIntro: "{chain-only}فيه **قهوتين** من العليا بالكتالوج اليوم — فرعين:{/chain-only}",
    enMeta: "Two cafes in Al Olaya on wain.lol — chain branches only so far, with Maps links.",
    arMeta: "قهوتين بالعليا على wain.lol — فروع سلاسل بس للحين، وعليها روابط قوقل ماب.",
  },
  {
    total: 3,
    local: 2,
    chains: 1,
    enIntro: "{chain-counts}There are **3** cafes from Al Olaya on the catalog today — two local cafes, one chain branch:{/chain-counts}{local-counts}There are **two** local cafes from Al Olaya on the catalog today:{/local-counts}",
    arIntro: "{chain-counts}فيه **3 قهاوي** من العليا بالكتالوج اليوم — قهوتين محليتين، وفرع واحد:{/chain-counts}{local-counts}فيه **قهوتين محليتين** من العليا بالكتالوج اليوم:{/local-counts}",
    enMeta: "3 cafes in Al Olaya on wain.lol — local specialty plus chain branches, each with a Maps link.",
    arMeta: "3 قهاوي بالعليا على wain.lol — المحلية المختصة ومعها فروع السلاسل، وكل وحدة عليها رابط قوقل ماب.",
  },
  {
    total: 11,
    local: 10,
    chains: 1,
    enIntro: "{chain-counts}There are **11** cafes from Al Olaya on the catalog today — 10 local cafes, one chain branch:{/chain-counts}{local-counts}There are **10** local cafes from Al Olaya on the catalog today:{/local-counts}",
    arIntro: "{chain-counts}فيه **11 قهاوي** من العليا بالكتالوج اليوم — 10 قهاوي محلية، وفرع واحد:{/chain-counts}{local-counts}فيه **10 قهاوي محلية** من العليا بالكتالوج اليوم:{/local-counts}",
    enMeta: "11 cafes in Al Olaya on wain.lol — local specialty plus chain branches, each with a Maps link.",
    arMeta: "11 قهاوي بالعليا على wain.lol — المحلية المختصة ومعها فروع السلاسل، وكل وحدة عليها رابط قوقل ماب.",
  },
];
for (const row of wordingMatrix) {
  const enIntro = chainDistrictHereIntroEn("Al Olaya", row.total, row.local, row.chains);
  const arIntro = chainDistrictHereIntroAr("العليا", row.total, row.local, row.chains);
  const enMeta = chainDistrictMetaEn("Al Olaya", row.total, row.local, row.chains);
  const arMeta = chainDistrictMetaAr("العليا", row.total, row.local, row.chains);
  assert(enIntro === row.enIntro, `EN intro ${row.total}: ${enIntro}`);
  assert(arIntro === row.arIntro, `AR intro ${row.total}: ${arIntro}`);
  assert(enMeta === row.enMeta, `EN meta ${row.total}: ${enMeta}`);
  assert(arMeta === row.arMeta, `AR meta ${row.total}: ${arMeta}`);
  assert(!enIntro.toLowerCase().includes("zero") && !enMeta.toLowerCase().includes("zero"), "EN never says zero");
  assert(!arIntro.includes("صفر") && !arMeta.includes("صفر"), "AR never says صفر");
  assert(!enIntro.includes("مقهى") && !arIntro.includes("مقهى") && !arMeta.includes("مقهى"), "Arabic stays قهوة / قهاوي");
  assert(!enIntro.includes("on the list today") && !arIntro.includes("بالقائمة"), "chain intro uses the catalog wording");
}
assert(
  chainDistrictMetaEn("KKIA", 1, 0, 1, "at") ===
    "One cafe at KKIA on wain.lol — chain branch only so far, with a Maps link.",
  "KKIA chain meta says at KKIA",
);
assert(
  chainDistrictMetaAr("طويق", 1, 0, 1) ===
    "قهوة وحدة بطويق على wain.lol — فرع سلسلة بس للحين، وعليها رابط قوقل ماب.",
  "chain-only Arabic meta uses وعليها after قهوة وحدة",
);
assert(
  chainDistrictLeadEn("Al Olaya", 4, 3, 1) ===
    "This page is the Al Olaya catalog on wain.lol: {chain-counts}4 cafes — 3 local cafes, one chain branch{/chain-counts}{local-counts}3 local cafes{/local-counts}.",
  "EN chain lead states the live count and names no shop",
);
assert(
  chainDistrictLeadAr("العليا", 4, 3, 1) ===
    "هذي صفحة العليا بالكتالوج على wain.lol: {chain-counts}4 قهاوي — 3 قهاوي محلية، وفرع واحد{/chain-counts}{local-counts}3 قهاوي محلية{/local-counts}.",
  "AR chain lead states the live count and names no shop",
);
assert(
  !chainDistrictLeadEn("Namar", 1, 0, 1).includes("no local") &&
    !chainDistrictLeadAr("نمار", 1, 0, 1).includes("ما فيه"),
  "chain leads omit a zero clause",
);
// Batch D3: ON OFF Coffee (local) joins dr.CAFE in Namar, so Namar is mixed now (Tuwaiq pattern).
assert(
  districtEnMarkdown("namar").includes("on the catalog today — one local cafe, one chain branch:"),
  "Namar EN intro counts the local cafe and the dine-in chain",
);
assert(
  districtArMarkdown("namar").includes("بالكتالوج اليوم — قهوة محلية وحدة، وفرع واحد:"),
  "Namar AR intro counts the local cafe and the dine-in chain",
);
assert(
  districtEnMarkdown("namar").includes("[ON OFF Coffee](/en/c/on-off-coffee-namar) is the local cafe on this list today.") &&
    districtArMarkdown("namar").includes("[اون اوف كوفي](/c/on-off-coffee-namar) القهوة المحلية بهالقائمة اليوم."),
  "Namar intro names only the local cafe (ON OFF Coffee)",
);
assert(
  districtEnMarkdown("namar").includes("{chain} [dr.CAFE](/en/c/drcafe-namar)"),
  "Namar EN bullet marks the chain row",
);
assert(
  districtEnMarkdown("namar").includes("south side of Riyadh"),
  "Namar keeps the handwritten local lead",
);

const districtIds = listLiveCatalogDistrictIds();
const copyBlob = districtIds
  .map((id: NeighborhoodId) =>
    [
      districtEnMeta(id),
      districtArMeta(id),
      districtEnMarkdown(id),
      districtArMarkdown(id),
    ].join("\n"),
  )
  .join("\n---\n");
const chainOnlyDistricts = [
  "al-jazirah",
  "an-nasim",
  "kkia",
  "manfuha",
  "shubra",
  // Drive Coffee drive-through-lane-only districts (4 Oct 2026).
  "al-hazm",
  "al-andalus",
  "al-khaleej",
  "ar-rimal",
  "al-janadriyyah",
] as const;
const withMixedChainMeta = districtIds.filter((id: NeighborhoodId) =>
  districtEnMeta(id).includes("local specialty plus chain branches"),
);
assert(
  withMixedChainMeta.join(",") === "sulimaniyah,al-mughrizat,al-manar,al-ghadeer,al-qirawan,al-malaz,namar,tuwaiq,as-suwaidi",
  "mixed districts say local specialty plus chain branches",
);
assert(
  districtEnMeta("namar") ===
    "Two cafes in Namar on wain.lol — local specialty plus chain branches, each with a Maps link.",
  "Namar meta is the mixed line since Batch D3 (ON OFF Coffee + dr.CAFE)",
);
assert(
  listDirectoryShopsForDistrict("tuwaiq").map((shop) => shop.id).sort().join(",") ===
    "drcafe-tuwaiq,drip-tuwaiq",
  "Tuwaiq lists dr.CAFE (chain) and Drip (local) since the Trending adds batch",
);
for (const id of chainOnlyDistricts) {
  const listed = listDirectoryShopsForDistrict(id);
  assert(listed.length === 0, `${id} lists no drive-through chain`);
  assert(!districtIds.includes(id), `${id} has no district page`);
  assert(
    districtEnMeta(id).startsWith(id === "kkia" ? "No cafes at " : "No cafes in "),
    `${id} EN meta is the empty district line`,
  );
  assert(
    districtArMeta(id).startsWith("ما فيه قهاوي"),
    `${id} AR meta is the empty district line`,
  );
}
const EN_TOTAL_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};
const AR_TOTAL_WORDS: Record<string, number> = {
  وحدة: 1,
  ثنتين: 2,
  ثلاث: 3,
  أربع: 4,
  خمس: 5,
  ست: 6,
  سبع: 7,
  ثمان: 8,
  تسع: 9,
  عشر: 10,
  "إحدى عشر": 11,
  "اثنتي عشر": 12,
};

function districtLead(markdown: string, heading: string): string {
  const cut = markdown.indexOf(heading);
  return cut === -1 ? markdown : markdown.slice(0, cut);
}

function enTotal(token: string): number | null {
  if (/^\d+$/.test(token)) return Number(token);
  return EN_TOTAL_WORDS[token.toLowerCase()] ?? null;
}

function arTotal(token: string): number | null {
  if (/^\d+$/.test(token)) return Number(token);
  return AR_TOTAL_WORDS[token] ?? null;
}

function statedLeadTotals(lead: string): number[] {
  const found: number[] = [];
  const enCount = lead.match(/The count is ([a-z0-9]+)/i);
  if (enCount) {
    const n = enTotal(enCount[1]!);
    if (n != null) found.push(n);
  }
  const added = lead.match(/([a-z0-9]+) cafes? we['’]ve actually added/i);
  if (added) {
    const n = enTotal(added[1]!);
    if (n != null) found.push(n);
  }
  const addedSoFar = lead.match(
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+) cafes? added so far\b/i,
  );
  if (addedSoFar) {
    const n = enTotal(addedSoFar[1]!);
    if (n != null) found.push(n);
  }
  const cards = lead.match(
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+) cards\b/i,
  );
  if (cards) {
    const n = enTotal(cards[1]!);
    if (n != null) found.push(n);
  }
  const arCount = lead.match(
    /العدد (إحدى عشر|اثنتي عشر|وحدة|ثنتين|ثلاث|أربع|خمس|ست|سبع|ثمان|تسع|عشر|\d+)/,
  );
  if (arCount) {
    const n = arTotal(arCount[1]!);
    if (n != null) found.push(n);
  }
  const arAdded = lead.match(
    /(إحدى عشر|اثنتي عشر|وحدة|ثنتين|ثلاث|أربع|خمس|ست|سبع|ثمان|تسع|عشر|\d+) قهاوي ضفناها/,
  );
  if (arAdded) {
    const n = arTotal(arAdded[1]!);
    if (n != null) found.push(n);
  }
  if (lead.includes("قهوة وحدة ضفناها")) found.push(1);
  if (lead.includes("قهوتين ضفناها")) found.push(2);
  const arCards = lead.match(
    /(إحدى عشر|اثنتي عشر|وحدة|ثنتين|ثلاث|أربع|خمس|ست|سبع|ثمان|تسع|عشر|\d+) بطاقة/,
  );
  if (arCards) {
    const n = arTotal(arCards[1]!);
    if (n != null) found.push(n);
  }
  return found;
}

for (const id of districtIds) {
  const listed = listDirectoryShopsForDistrict(id);
  const listedIds = new Set(listed.map((shop) => shop.id));
  const enLead = districtLead(districtEnMarkdown(id), "## What’s here");
  const arLead = districtLead(districtArMarkdown(id), "## وش فيه");
  const localCount = listed.filter((shop) => !shop.isChain).length;
  for (const lead of [enLead, arLead]) {
    for (const match of lead.matchAll(/\/(?:en\/)?c\/([a-z0-9-]+)/g)) {
      assert(
        listedIds.has(match[1]!),
        `${id} lead names ${match[1]} which is not listed`,
      );
    }
    for (const stated of statedLeadTotals(lead)) {
      const matchesLocalCopy = listed.some((shop) => shop.isChain) && stated === localCount;
      assert(
        stated === listed.length || matchesLocalCopy,
        `${id} lead says ${stated} but lists ${listed.length}`,
      );
    }
  }
  for (const shop of listRealShops().filter((shop) => shop.neighborhood === id)) {
    if (listedIds.has(shop.id)) continue;
    const enName = shop.nameEn.trim();
    const arName = shop.nameAr.trim();
    if (enName.length > 2) {
      assert(
        !enLead.includes(enName),
        `${id} EN lead names unlisted ${enName}`,
      );
    }
    if (arName.length > 2) {
      assert(
        !arLead.includes(arName),
        `${id} AR lead names unlisted ${arName}`,
      );
    }
  }
}

const yarmukListed = listDirectoryShopsForDistrict("al-yarmouk");
assert(
  statedLeadTotals(districtLead(districtEnMarkdown("al-yarmouk"), "## What’s here")).includes(
    yarmukListed.length,
  ) &&
    statedLeadTotals(districtLead(districtArMarkdown("al-yarmouk"), "## وش فيه")).includes(
      yarmukListed.length,
    ),
  "Al Yarmuk 'The count is …' / العدد matches the listed shops",
);
// #239 QA: handwritten district intro copy never names a chain. With Local only on, only
// {chain-only} / {chain-counts} blocks and {chain} list rows hide, so a chain name or /c/ link
// anywhere else stays visible. Meta descriptions are checked too.
{
  const chainRows = listRealShops().filter((shop) => shop.isChain);
  const chainIds = new Set(chainRows.map((shop) => shop.id));
  const chainNames = [...new Set(chainRows.flatMap((shop) => [shop.nameEn, shop.nameAr]))].filter(
    (name) => name && name.length > 2,
  );
  const localOnlyView = (markdown: string) =>
    markdown
      .replace(/\{chain-only\}[\s\S]*?\{\/chain-only\}/g, "")
      .replace(/\{chain-counts\}[\s\S]*?\{\/chain-counts\}/g, "")
      .split("\n")
      .filter((line) => !line.startsWith("- {chain}"))
      .join("\n");
  const offenders: string[] = [];
  for (const district of NEIGHBORHOOD_IDS) {
    if (districtPageHidden(district)) continue;
    const views = [
      ["en", localOnlyView(districtEnMarkdown(district)) + "\n" + districtEnMeta(district)],
      ["ar", localOnlyView(districtArMarkdown(district)) + "\n" + districtArMeta(district)],
    ] as const;
    for (const [lang, text] of views) {
      for (const match of text.matchAll(/\/c\/([a-z0-9-]+)/g)) {
        if (chainIds.has(match[1])) offenders.push(`${district} ${lang} links chain ${match[1]}`);
      }
      for (const name of chainNames) {
        if (text.includes(name)) offenders.push(`${district} ${lang} names chain "${name}"`);
      }
    }
  }
  assert(offenders.length === 0, `district intro copy names no chains with Local only on: ${offenders.join("; ")}`);
  const tuwaiqEn = districtEnMarkdown("tuwaiq");
  const tuwaiqAr = districtArMarkdown("tuwaiq");
  assert(
    tuwaiqEn.includes("[Drip](/en/c/drip-tuwaiq) is the local cafe on this list today.") &&
      tuwaiqAr.includes("[دريب](/c/drip-tuwaiq) القهوة المحلية بهالقائمة اليوم."),
    "Tuwaiq intro names only the local cafe (Drip)",
  );
  assert(
    tuwaiqEn.includes("- {chain} [dr.CAFE](/en/c/drcafe-tuwaiq)"),
    "Tuwaiq dr.CAFE stays a {chain} list row (hidden with Local only on)",
  );
}
const copyHash = createHash("sha256").update(copyBlob).digest("hex");
assert(
  copyHash === "b5b3f94e657b511bc14f75d73a76464d8c31543588cf6e0ec6dc50ce93503e81",
  `district copy hash includes the house count helper: ${copyHash}`,
);
assert(
  !copyBlob.includes("Zero cafes") && !copyBlob.includes("صفر"),
  "a total of 0 never says Zero or صفر",
);
const mainDistrictPages = (
  JSON.parse(read("data/main-district-pages.json")) as { slugs: NeighborhoodId[] }
).slugs;
assert(mainDistrictPages.length === 69, "main baseline is 69 district pages");
const pageIds = new Set(listLiveCatalogDistrictIds());
const paramIds = new Set(categoryDistrictStaticParams().map((row) => row.slug));
const sitemapLocs = new Set(listSitemapLocs());
const browseIds = new Set(
  listNeighborhoodRows("en", listBrowseDirectoryShops()).map((row) => row.id),
);
const real = listRealShops();
const disappeared: NeighborhoodId[] = [];
for (const id of mainDistrictPages) {
  const rows = real.filter((shop) => shop.neighborhood === id);
  const arLoc = `https://wain.lol${districtPath(id, "ar")}`;
  const enLoc = `https://wain.lol${districtPath(id, "en")}`;
  const onPage =
    pageIds.has(id) &&
    paramIds.has(id) &&
    sitemapLocs.has(arLoc) &&
    sitemapLocs.has(enLoc) &&
    browseIds.has(id);
  if (rows.some((shop) => !isChainShop(shop))) {
    assert(onPage, `${id} has a non-chain row and keeps its prod page`);
  }
  if (!onPage) disappeared.push(id);
}
for (const id of disappeared) {
  assert(
    districtRowsAreUnlistedChains(real, id),
    `${id} left the prod page set without every row being a non-qualifying chain`,
  );
}
console.log(
  `baseline districts hidden: ${disappeared.length === 0 ? "(none)" : disappeared.join(", ")}`,
);
assert(
  paramIds.has("as-suwaidi") &&
    pageIds.has("as-suwaidi") &&
    sitemapLocs.has("https://wain.lol/coffee-shops/as-suwaidi") &&
    !districtPageHidden("as-suwaidi"),
  "as-suwaidi keeps the prod URL and is now a sitemap page (Alwaal Albari)",
);
const localDriveThrough = fixtureShop({
  id: "local-dt-only",
  nameEn: "Local Drive",
  neighborhood: "al-mursalat",
  catalogLane: "drive-through",
  momentTags: ["drive-through"],
});
assert(
  districtListingFrom([localDriveThrough], "al-mursalat").some(
    (shop) => shop.id === "local-dt-only",
  ) && listedDistrictIdsFrom([localDriveThrough]).includes("al-mursalat"),
  "a district with only a local drive-through row keeps its page",
);
const chainLaneOnly = fixtureShop({
  id: "chain-dt-only",
  nameEn: "dr.CAFE",
  neighborhood: "shubra",
  isChain: true,
  chainBrand: "dr-cafe",
  catalogLane: "drive-through",
  dineIn: true,
  momentTags: ["drive-through"],
});
assert(
  districtListingFrom([chainLaneOnly], "shubra").length === 0 &&
    !listedDistrictIdsFrom([chainLaneOnly]).includes("shubra") &&
    districtRowsAreUnlistedChains([chainLaneOnly], "shubra"),
  "a district whose only row is a non-qualifying chain has no page",
);
const chainSitOnly = fixtureShop({
  id: "chain-sit-only",
  nameEn: "Starbucks",
  neighborhood: "shubra",
  isChain: true,
  chainBrand: "starbucks",
  dineIn: true,
  outdoorSeating: false,
  momentTags: [],
});
assert(
  listedDistrictIdsFrom([chainSitOnly]).includes("shubra"),
  "a dine-in chain branch brings the district page back",
);
assert(
  formatReply(pickCafes({ text: "حطين", language: "ar" })).includes(
    "/coffee-shops/hittin",
  ),
  "chat still links a district that has a page",
);
assert(
  read("app/[category]/[slug]/page.tsx").includes("districtPageHidden") &&
    read("app/en/[category]/[slug]/page.tsx").includes("districtPageHidden") &&
    read("app/api/chat/route.ts").includes("districtPageHidden"),
  "notFound and the chat chip hide only an all-unlisted-chain district",
);
assert(
  districtEnMeta("kkia").startsWith("No cafes at KKIA"),
  "an empty KKIA page says at KKIA",
);
assert(
  districtEnMarkdown("manfuha").includes("Manfuha") &&
    !districtEnMarkdown("manfuha").includes("Manfuhah"),
  "Manfuha spelling matches the H1",
);
const driveThrough = listDriveThroughDirectoryShops();
assert(
  driveThrough.filter((shop) => shop.isChain === true).length === 44,
  "the drive-through directory includes the 44 tagged branches (28 on main + 16 Drive Coffee)",
);
assert(
  applyHideChains(driveThrough, true).length === 29,
  "drive-through local-only keeps the 29 non-chain rows (45 on main − 16 Drive Coffee)",
);
assert(
  !chainFilterShowsEmpty(driveThrough, true),
  "drive-through local-only does not show the empty state",
);
const llms = buildLlmsTxt();
const llmsHash = createHash("sha256").update(llms).digest("hex");
assert(
  llmsHash === "0cfa7f44dc151add587be31fa5524d94e92e898567262f434bb1c0534627a75f",
  `llms.txt counts specialty plus the sit-down chains: ${llmsHash}`,
);
assert(
  llms.includes("403 local, 10 chain branches"),
  "llms.txt names the 10 chain branches separately from specialty",
);

assert(
  read("scripts/check-district-urls.ts").includes('"Starbucks stays dropped"'),
  "Starbucks stays dropped assert is unchanged",
);

const dineInChain = fixtureShop({
  id: "mccafe-sit",
  nameEn: "McCafe",
  nameAr: "ماك كافيه",
  neighborhood: "al-hamra",
  isChain: true,
  chainBrand: "mccafe",
  dineIn: true,
  outdoorSeating: false,
  momentTags: [],
});
const dineInFalse = fixtureShop({
  id: "dunkin-closed",
  nameEn: "Dunkin'",
  nameAr: "دانكن",
  neighborhood: "al-nakheel",
  isChain: true,
  chainBrand: "dunkin",
  dineIn: false,
  outdoorSeating: false,
  momentTags: [],
});
const dineInUnknown = fixtureShop({
  id: "barns-unknown",
  nameEn: "Barn's",
  nameAr: "بارنز",
  neighborhood: "al-malqa",
  isChain: true,
  chainBrand: "barns",
  dineIn: undefined,
  outdoorSeating: undefined,
  momentTags: [],
});
const pickupChain = fixtureShop({
  id: "java-pickup",
  nameEn: "Java",
  nameAr: "جافا",
  neighborhood: "al-narjis",
  isChain: true,
  chainBrand: "java",
  dineIn: true,
  outdoorSeating: false,
  pickupOnly: true,
  momentTags: ["drive-through"],
});
const momentTagSitDown = fixtureShop({
  id: "java-moment",
  nameEn: "Java Moment",
  nameAr: "جافا",
  neighborhood: "al-rabi",
  isChain: true,
  chainBrand: "java",
  dineIn: true,
  outdoorSeating: false,
  pickupOnly: false,
  momentTags: ["drive-through"],
});
const gateShops = [dineInChain, dineInFalse, dineInUnknown, pickupChain, momentTagSitDown];

assert(
  chainIsListed(dineInChain) && isListingShop(dineInChain),
  "a chain with dineIn true is listed",
);
assert(
  !chainIsListed(dineInFalse) && !isListingShop(dineInFalse),
  "a chain with dineIn false is not listed",
);
assert(
  !chainIsListed(dineInUnknown) && !isListingShop(dineInUnknown),
  "a chain with dine-in unknown is not listed",
);
assert(
  !chainIsListed(pickupChain) && !isListingShop(pickupChain),
  "a pickup-only chain is not listed",
);
assert(
  chainIsListed(momentTagSitDown) && isListingShop(momentTagSitDown),
  "a sit-down chain with only a drive-through moment tag is listed",
);

function listingSurfaceText(shops: readonly Shop[], district: NeighborhoodId): string {
  const page = districtListingFrom(shops, district);
  const listed = listingShopsFrom(shops).filter((shop) => shop.neighborhood === district);
  const meta = `${page.map((shop) => shop.id).join(" ")} ${
    page.some((shop) => shop.isChain)
      ? chainDistrictMetaEn("District", page.length, page.filter((shop) => !shop.isChain).length, page.filter((shop) => shop.isChain).length)
      : ""
  }`;
  const jsonLd = JSON.stringify({
    numberOfItems: listed.length,
    itemListElement: listed.map((shop) => shop.id),
  });
  const llms = listed.map((shop) => `${shop.id} ${shop.nameEn}`).join("\n");
  return [page.map((shop) => shop.id).join(","), meta, jsonLd, llms].join("\n");
}

assert(
  listingSurfaceText(gateShops, "al-hamra").includes("mccafe-sit"),
  "a chain with dineIn true is on the district page, meta, JSON-LD, and llms.txt",
);
assert(
  listingSurfaceText(gateShops, "al-rabi").includes("java-moment"),
  "a sit-down chain kept for the drive-through list still appears on its district page",
);
for (const [id, district] of [
  ["dunkin-closed", "al-nakheel"],
  ["barns-unknown", "al-malqa"],
  ["java-pickup", "al-narjis"],
] as const) {
  const blob = listingSurfaceText(gateShops, district);
  assert(
    !blob.includes(id) && districtListingFrom(gateShops, district).length === 0,
    `${id} stays off the district page, meta, JSON-LD, and llms.txt`,
  );
}

const catalogSrc = read("lib/catalog.ts");
const structuredSrc = read("lib/structured-data.ts");
const enSrc = read("lib/en-content.ts");
const arSrc = read("lib/ar-content.ts");
assert(catalogSrc.includes("function chainIsListed"), "listing gate is chainIsListed");
assert(
  enSrc.includes("shopsInDistrict(district)") &&
    arSrc.includes("shopsInDistrict(district)"),
  "district meta is built from the district listing",
);
assert(
  structuredSrc.includes("publicShopsInDistrict(district)") &&
    structuredSrc.includes("listListingDirectoryShops()") &&
    structuredSrc.includes("const shops = listPublicShops()"),
  "JSON-LD and llms.txt are built from public listing shops",
);

const layoutSrc = read("app/layout.tsx");
const cssSrc = read("app/globals.css");
assert(
  layoutSrc.includes("data-hide-chains") &&
    layoutSrc.includes("localStorage.getItem") &&
    layoutSrc.includes("catch(e)") &&
    layoutSrc.includes("HIDE_CHAINS_STORAGE_KEY"),
  "root layout sets data-hide-chains before paint and survives a storage throw",
);
assert(
  cssSrc.includes("html[data-hide-chains] [data-chain-card]"),
  "CSS hides chain cards while data-hide-chains is set",
);
assert(
  read("components/directory-card.tsx").includes("data-chain-card"),
  "chain cards are marked for the pre-paint hide",
);
assert(
  read("components/en-rich-text.tsx").includes('"{chain}"') ||
    read("components/en-rich-text.tsx").includes("{chain}"),
  "What's here chain bullets carry data-chain-card",
);
assert(
  read("components/en-rich-text.tsx").includes("data-chain-card"),
  "chain prose is hidden with the same attribute as the cards",
);
assert(
  read("lib/chain-filter.ts").includes("function syncHideChainsAttribute") &&
    read("components/shop-directory.tsx").includes("syncHideChainsAttribute"),
  "the toggle keeps data-hide-chains in sync",
);

const askShops = [starbucks, barnsA, barnsB, dineInChain, dunkinOnly];
assert(
  matchCatalogShops("mc cafe", askShops).some((shop) => shop.id === "mccafe-sit"),
  "mc cafe matches McCafe",
);
assert(
  matchCatalogShops("mccafe", askShops).some((shop) => shop.id === "mccafe-sit"),
  "mccafe matches McCafe",
);
assert(
  matchCatalogShops("barn", askShops)
    .map((shop) => shop.id)
    .sort()
    .join(",") === "barns-a,barns-b",
  "barn matches Barn's",
);
for (const ask of [
  "not starbucks",
  "no starbucks",
  "غير ستاربكس",
  "بدون ستاربكس",
  "مو ستاربكس",
]) {
  assert(
    !matchCatalogShops(ask, askShops).some((shop) => shop.chainBrand === "starbucks"),
    `${ask} excludes Starbucks`,
  );
}
const dunkinNotStarbucks = matchCatalogShops("dunkin not starbucks", askShops);
assert(
  dunkinNotStarbucks.some((shop) => shop.id === "dunkin-namar") &&
    !dunkinNotStarbucks.some((shop) => shop.chainBrand === "starbucks"),
  "negation drops Starbucks and still matches Dunkin",
);

const drCafeAsk = fixtureShop({
  id: "drcafe-namar",
  nameEn: "dr.CAFE",
  nameAr: "د.كيف كافيه",
  neighborhood: "namar",
  isChain: true,
  chainBrand: "dr-cafe",
});
const javaAsk = fixtureShop({
  id: "java-cafe-al-rabi",
  nameEn: "Java Cafe",
  nameAr: "جافا كافيه",
  neighborhood: "al-rabi",
  isChain: true,
  chainBrand: "java",
});
const negationShops = [...askShops, drCafeAsk, javaAsk];
assert(
  matchCatalogShops("دكتور كيف", negationShops).some((shop) => shop.chainBrand === "dr-cafe"),
  "دكتور كيف matches dr.CAFE",
);
assert(
  matchCatalogShops("doctor cafe", negationShops).some((shop) => shop.chainBrand === "dr-cafe"),
  "doctor cafe matches dr.CAFE",
);
assert(
  matchCatalogShops("dr. cafe", negationShops).some((shop) => shop.chainBrand === "dr-cafe"),
  "dr. cafe matches dr.CAFE",
);
for (const ask of ["مو دكتور كيف", "anything but java", "except java", "ما ابي جافا", "إلا جافا"]) {
  const hits = matchCatalogShops(ask, negationShops);
  if (ask.includes("java") || ask.includes("جافا")) {
    assert(!hits.some((shop) => shop.chainBrand === "java"), `${ask} excludes Java`);
  } else {
    assert(!hits.some((shop) => shop.chainBrand === "dr-cafe"), `${ask} excludes dr.CAFE`);
  }
}

const manualKiosk = fixtureShop({
  id: "manual-kiosk",
  isChain: true,
  chainBrand: "dr-cafe",
  catalogLane: "drive-through",
  dineIn: false,
  outdoorSeating: true,
  seatingVerdict: { dineIn: false, source: "qa", date: "2026-10-02" },
});
assert(!chainIsListed(manualKiosk), "a manual not-dine-in verdict stays off the district page");
assert(seatingVerdictDisagrees(manualKiosk) === null, "a matching manual verdict agrees with the lane");
assert(
  seatingVerdictDisagrees({ ...manualKiosk, catalogLane: undefined, dineIn: true }) != null,
  "a manual verdict that disagrees with the lane fails",
);
const foldedVerdict = foldHalfwayPlaceAndScoutAttrs(
  [manualKiosk],
  [{ id: "manual-kiosk", dine_in: true, outdoor_seating: true }],
);
assert(
  foldedVerdict.shops[0]?.dineIn === false,
  "Places dineIn cannot override a manual seating verdict",
);
for (const shop of listRealShops()) {
  const reason = seatingVerdictDisagrees(shop);
  assert(reason == null, reason ?? "seating verdict");
}

assert(hiddenDistrictRedirect("ar") === "/neighborhoods", "hidden AR districts redirect to /neighborhoods");
assert(
  hiddenDistrictRedirect("en") === "/en/neighborhoods",
  "hidden EN districts redirect to /en/neighborhoods",
);
assert(
  read("app/[category]/[slug]/page.tsx").includes('redirect(hiddenDistrictRedirect("ar"))') &&
    read("app/en/[category]/[slug]/page.tsx").includes('redirect(hiddenDistrictRedirect("en"))'),
  "hidden district pages 307 to the neighborhoods index",
);
assert(
  cssSrc.includes("html[data-hide-chains] [data-chain-counts]") &&
    cssSrc.includes("html[data-hide-chains] [data-chain-only]") &&
    cssSrc.includes("[data-local-counts]"),
  "Local only hides chain counts and chain-only intros",
);

// #239 QA: As Suwaidi copy drops the "southwest" framing (its nearby list includes Al Malaz,
// which is central/east) and says why the list shows 3: Al Wisham's only cafe is a drive-thru.
{
  const suwaidiEn = districtEnMarkdown("as-suwaidi");
  const suwaidiAr = districtArMarkdown("as-suwaidi");
  assert(
    suwaidiEn.includes("As Suwaidi (السويدي) is a Riyadh neighborhood.") &&
      suwaidiAr.includes("السويدي حي بالرياض."),
    "As Suwaidi EN/AR lead is the neutral #239 copy",
  );
  assert(
    !/south-?west/i.test(suwaidiEn) && !suwaidiAr.includes("جنوب غرب") && !suwaidiAr.includes("جنوب الغرب"),
    "As Suwaidi copy has no southwest framing",
  );
  const suwaidiNearby = (markdown: string, heading: string) =>
    (markdown.split(heading)[1] ?? "").split("\n## ")[0].split("\n").filter((line) => line.startsWith("- "));
  const nearbyEn = suwaidiNearby(suwaidiEn, "## Other neighborhoods nearby");
  assert(
    nearbyEn.length === 3 && !nearbyEn.some((line) => line.includes("al-wisham")),
    `As Suwaidi nearby renders 3 (Al Wisham left out), got ${nearbyEn.length}`,
  );
  assert(
    listRealShops().filter((shop) => shop.neighborhood === "al-wisham").length > 0 &&
      !listDirectoryShops().some((shop) => shop.neighborhood === "al-wisham"),
    "Al Wisham has catalog rows but no listed (non-drive-thru) cafe, which is why it drops from nearby",
  );
  assert(
    suwaidiEn.includes("these three lists are the closest on the site. Al Wisham is close too, but its only cafe is a drive-thru") &&
      suwaidiAr.includes("هذي أقرب 3 قوائم بالموقع. الوشام قريب بعد، بس قهوته الوحيدة درايف ثرو"),
    "As Suwaidi nearby intro says 3 lists and why (AR digits from 3)",
  );
  // Five pages show 3 nearby, each because one listed neighbor only has drive-thru rows.
  const listed = new Set(listDirectoryShops().map((shop) => shop.neighborhood));
  const shortNearby = (Object.keys(NEARBY_DISTRICTS) as NeighborhoodId[])
    .filter((id) => listed.has(id))
    .filter((id) => NEARBY_DISTRICTS[id].filter((n) => listed.has(n) && n !== id).length < 4)
    .sort();
  assert(
    shortNearby.join(",") === "al-aziziyah,as-suwaidi,badr,king-salman,tuwaiq",
    `nearby lists with 3 rows: ${shortNearby.join(",")}`,
  );
}

const BAD_EN_INTRO = [
  /\bone cafes\b/i,
  /\bthere are one\b/i,
  /\bthere is (?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\b/i,
];
const BAD_AR_INTRO = [/وحدة قهاوي/, /ثنتين قهاوي/, /قهوة ثنتين/, /قهوة ثلاث/, /قهوة أربع/, /قهوة خمس/];

function hereIntroParagraph(markdown: string): string {
  const at = markdown.search(/What’s here|وش فيه/);
  const after = markdown.slice(at).replace(/^[^\n]*\n+/, "");
  return (after.split(/\n\n/)[0] ?? "")
    .replaceAll("{chain-only}", "")
    .replaceAll("{/chain-only}", "")
    .replaceAll("{chain-counts}", "")
    .replaceAll("{/chain-counts}", "")
    .replaceAll("{local-counts}", "")
    .replaceAll("{/local-counts}", "");
}

for (const id of NEIGHBORHOOD_IDS) {
  if (districtPageHidden(id)) continue;
  const count = listDirectoryShopsForDistrict(id).length;
  const en = hereIntroParagraph(districtEnMarkdown(id));
  const ar = hereIntroParagraph(districtArMarkdown(id));
  for (const bad of BAD_EN_INTRO) assert(!bad.test(en), `${id} EN intro mismatch: ${en}`);
  for (const bad of BAD_AR_INTRO) assert(!bad.test(ar), `${id} AR intro mismatch: ${ar}`);
  if (count === 1) {
    assert(/\*\*one\*\* cafe\b/i.test(en) && !/\bcafes\b/i.test(en), `${id} EN singular intro: ${en}`);
    assert(ar.includes("**قهوة وحدة**"), `${id} AR singular intro: ${ar}`);
  } else if (count === 2) {
    assert(/\*\*two\*\* cafes\b/i.test(en), `${id} EN dual intro: ${en}`);
    assert(ar.includes("**قهوتين**"), `${id} AR dual intro: ${ar}`);
  } else if (count > 2) {
    assert(
      new RegExp(`\\*\\*${countWord(count)}\\*\\* cafes\\b`, "i").test(en),
      `${id} EN plural intro: ${en}`,
    );
    assert(
      ar.includes(`**${countedCafesAr(count)}**`) ||
        ar.includes(`**${countWordAr(count)}** قهاوي`),
      `${id} AR plural intro: ${ar}`,
    );
  }
}

const EN_SPELLED_NUMBER =
  /\b(?:three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/i;
const AR_SPELLED_NUMBERS = [
  "الثلاثة",
  "الأربعة",
  "الخمسة",
  "الستة",
  "السبعة",
  "الثمانية",
  "التسعة",
  "العشرة",
  "الثلاث",
  "الأربع",
  "الخمس",
  "الست",
  "السبع",
  "الثمان",
  "التسع",
  "العشر",
  "إحدى عشر",
  "اثنتي عشر",
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
  "عشرة",
  "ثلاث",
  "أربع",
  "خمس",
  "ست",
  "سبع",
  "ثمان",
  "تسع",
  "عشر",
];

const AR_DEFINITE_FROM_THREE = [
  "الثلاثة",
  "الأربعة",
  "الخمسة",
  "الستة",
  "السبعة",
  "الثمانية",
  "التسعة",
  "العشرة",
  "الثلاث",
  "الأربع",
  "الخمس",
  "الست",
  "السبع",
  "الثمان",
  "التسع",
  "العشر",
].sort((a, b) => b.length - a.length);

/** و ب ف ك before الـ, plus ل with the article alef dropped (للثلاث، للأربع). */
const AR_PREFIXED_DEFINITE = new RegExp(
  `(?<![\\u0600-\\u06FF])(?:[وبفك](?:${AR_DEFINITE_FROM_THREE.join("|")})|ل(?:${AR_DEFINITE_FROM_THREE.map((word) => word.replace(/^[اأإآ]/, "")).join("|")}))(?![\\u0600-\\u06FF])`,
);

const AR_INDEFINITE_FROM_THREE = [
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
  "عشرة",
  "إحدى عشر",
  "اثنتي عشر",
  "أحد عشر",
  "اثنا عشر",
  "ثلاث",
  "أربع",
  "خمس",
  "ست",
  "سبع",
  "ثمان",
  "تسع",
  "عشر",
].sort((a, b) => b.length - a.length);

/**
 * و ب ف ك on a count from 3 up that has no ال (وأربع، بثلاث، وثلاث، فخمس).
 * ل is not a prefix here: «لست» is “I am not”, and للثلاث is already the definite form.
 */
const AR_PREFIXED_INDEFINITE = new RegExp(
  `(?<![\\u0600-\\u06FF])[وبفك](?:${AR_INDEFINITE_FROM_THREE.join("|")})(?![\\u0600-\\u06FF])`,
);

function spelledNumberWord(text: string): string | null {
  const en = text.match(EN_SPELLED_NUMBER);
  if (en) return en[0] ?? null;
  const prefixed = text.match(AR_PREFIXED_DEFINITE);
  if (prefixed) return prefixed[0] ?? null;
  const indefinite = text.match(AR_PREFIXED_INDEFINITE);
  if (indefinite) return indefinite[0] ?? null;
  for (const word of AR_SPELLED_NUMBERS) {
    const re = new RegExp(`(?<![\\u0600-\\u06FF])${word}(?![\\u0600-\\u06FF])`);
    if (re.test(text)) return word;
  }
  return null;
}

assert(spelledNumberWord("والثلاث") === "والثلاث", "prefixed والثلاث is a spelled count");
assert(spelledNumberWord("بالثلاث") === "بالثلاث", "prefixed بالثلاث is a spelled count");
assert(spelledNumberWord("للثلاث") === "للثلاث", "prefixed للثلاث is a spelled count");
assert(spelledNumberWord("فالأربع") === "فالأربع", "prefixed فالأربع is a spelled count");
assert(spelledNumberWord("كالخمس") === "كالخمس", "prefixed كالخمس is a spelled count");
assert(spelledNumberWord("قهوة وحدة") == null, "one stays a word");
assert(spelledNumberWord("قهوتين") == null, "two stays a word");
assert(spelledNumberWord("one cafe") == null && spelledNumberWord("two cafes") == null, "EN one and two stay words");
assert(spelledNumberWord("محمصة هجين التسعينات") == null, "التسعينات is not a count");
assert(spelledNumberWord("وأربع") === "وأربع", "prefixed وأربع is a spelled count");
assert(spelledNumberWord("بثلاث") === "بثلاث", "prefixed بثلاث is a spelled count");
assert(spelledNumberWord("وثلاث") === "وثلاث", "prefixed وثلاث is a spelled count");
assert(spelledNumberWord("فخمس") === "فخمس", "prefixed فخمس is a spelled count");

function prefixedIndefiniteCount(text: string): string | null {
  return text.match(AR_PREFIXED_INDEFINITE)?.[0] ?? null;
}

assert(prefixedIndefiniteCount("وأربع") === "وأربع", "prefixed وأربع is a spelled count");
assert(prefixedIndefiniteCount("بثلاث") === "بثلاث", "prefixed بثلاث is a spelled count");
assert(prefixedIndefiniteCount("وثلاث") === "وثلاث", "prefixed وثلاث is a spelled count");
assert(prefixedIndefiniteCount("فخمس") === "فخمس", "prefixed فخمس is a spelled count");
assert(prefixedIndefiniteCount("كستة") === "كستة", "prefixed كستة is a spelled count");
assert(prefixedIndefiniteCount("ثلاث") == null, "a bare ثلاث has no prefix");
assert(prefixedIndefiniteCount("لست") == null, "لست is not a count");
assert(prefixedIndefiniteCount("وستيم") == null, "وستيم is Steam, not six");
assert(prefixedIndefiniteCount("ريبوستري") == null, "ريبوستري is not six");
assert(prefixedIndefiniteCount("فستان") == null, "فستان is not six");
assert(prefixedIndefiniteCount("بستان") == null, "بستان is not six");
assert(prefixedIndefiniteCount("أربعاء") == null, "أربعاء is Wednesday");
assert(prefixedIndefiniteCount("محمصة هجين التسعينات") == null, "التسعينات is not a prefixed count");

/** 3–10 take a plural noun. 11+ may stay singular, and 1–2 stay words. */
const AR_SINGULAR_AFTER_THREE_TO_TEN =
  /(?<![0-9])(?:10|[3-9])(?![0-9])\s+(?:ال)?(?:بطاقة|قهوة|فرع|مقهى|مكان|محل|اسم)(?![\u0600-\u06FF])/;

function singularNounAfterCount(text: string): string | null {
  return text.match(AR_SINGULAR_AFTER_THREE_TO_TEN)?.[0] ?? null;
}

assert(singularNounAfterCount("الـ 3 بطاقة") === "3 بطاقة", "3 بطاقة is a singular noun");
assert(singularNounAfterCount("5 قهوة") === "5 قهوة", "5 قهوة is a singular noun");
assert(singularNounAfterCount("10 فرع") === "10 فرع", "10 فرع is a singular noun");
assert(singularNounAfterCount("3 بطاقات") == null, "3 بطاقات is plural");
assert(singularNounAfterCount("البطاقات الـ3") == null, "البطاقات الـ3 keeps the plural");
assert(singularNounAfterCount("7 قهاوي") == null, "7 قهاوي is plural");
assert(singularNounAfterCount("7 أماكن") == null, "7 أماكن is plural");
assert(singularNounAfterCount("11 بطاقة") == null, "11+ may use the singular");
assert(singularNounAfterCount("فرع واحد") == null, "one branch stays a word");
assert(singularNounAfterCount("1/4") == null, "a photo counter is not an Arabic count");

/** Digit 3+ then a singular noun. Plurals (cards, cafes, branches) stay allowed. */
const EN_SINGULAR_AFTER_THREE =
  /(?<![0-9])(?:[1-9]\d+|[3-9])(?![0-9])\s+(?:card|cafe|branch)\b/i;

function singularEnNounAfterCount(text: string): string | null {
  return text.match(EN_SINGULAR_AFTER_THREE)?.[0] ?? null;
}

assert(singularEnNounAfterCount("the 3 card") === "3 card", "3 card is singular");
assert(singularEnNounAfterCount("4 cafe") === "4 cafe", "4 cafe is singular");
assert(singularEnNounAfterCount("5 branch") === "5 branch", "5 branch is singular");
assert(singularEnNounAfterCount("10 cafe") === "10 cafe", "10 cafe is singular");
assert(singularEnNounAfterCount("3 cards") == null, "3 cards is plural");
assert(singularEnNounAfterCount("4 cafes") == null, "4 cafes is plural");
assert(singularEnNounAfterCount("5 branches") == null, "5 branches is plural");
assert(singularEnNounAfterCount("1 card") == null && singularEnNounAfterCount("2 cafe") == null, "one and two stay allowed");
assert(singularEnNounAfterCount("1/4") == null && singularEnNounAfterCount("1 / 4") == null, "a photo counter is not a singular noun");

function leadBeforeHeading(markdown: string, heading: string): string {
  const body = markdown.replace(/^#[^\n]*\n+/, "");
  const cut = body.indexOf(heading);
  return (cut === -1 ? body : body.slice(0, cut)).trim();
}

// District lead, intro, and meta only. Café pages render a "1/4" hero counter.
for (const id of NEIGHBORHOOD_IDS) {
  const surfaces = [
    ["EN lead", leadBeforeHeading(districtEnMarkdown(id), "## What’s here")],
    ["AR lead", leadBeforeHeading(districtArMarkdown(id), "## وش فيه")],
    ["EN intro", hereIntroParagraph(districtEnMarkdown(id))],
    ["AR intro", hereIntroParagraph(districtArMarkdown(id))],
    ["EN meta", districtEnMeta(id)],
    ["AR meta", districtArMeta(id)],
  ] as const;
  for (const [label, text] of surfaces) {
    const spelled = spelledNumberWord(text);
    assert(spelled == null, `${id} ${label} spells a count (${spelled}): ${text}`);
    const singular = singularNounAfterCount(text);
    assert(
      singular == null,
      `${id} ${label} uses a singular noun after 3–10 (${singular}): ${text}`,
    );
    if (label.startsWith("EN")) {
      const singularEn = singularEnNounAfterCount(text);
      assert(
        singularEn == null,
        `${id} ${label} uses a singular noun after a digit 3+ (${singularEn}): ${text}`,
      );
    }
  }
}

function renderedMarkdown(markdown: string): string {
  return renderToStaticMarkup(createElement(EnRichText, { markdown }));
}

function rawMarker(html: string): string | null {
  return CONTENT_MARKERS.find((marker) => html.includes(marker)) ?? null;
}

assert(
  CONTENT_MARKERS.join(",") ===
    "{chain-counts},{/chain-counts},{local-counts},{/local-counts},{chain-only},{/chain-only},{chain}",
  "the marker check enumerates every marker the renderer uses",
);

for (const id of NEIGHBORHOOD_IDS) {
  for (const [locale, markdown] of [
    ["en", districtEnMarkdown(id)],
    ["ar", districtArMarkdown(id)],
  ] as const) {
    const html = renderedMarkdown(markdown);
    const marker = rawMarker(html);
    assert(marker == null, `${id} ${locale} district page rendered a raw marker ${marker ?? ""}`);
  }
}
for (const shop of listRealShops()) {
  for (const [locale, markdown] of [
    ["en", cafeEnMarkdown(shop)],
    ["ar", cafeArMarkdown(shop)],
  ] as const) {
    const html = renderedMarkdown(markdown);
    const marker = rawMarker(html);
    assert(marker == null, `${shop.id} ${locale} cafe page rendered a raw marker ${marker ?? ""}`);
  }
}
const wrappedLead = chainOnlyBlock("First lead paragraph.\n\nSecond lead paragraph.");
assert(
  wrappedLead ===
    "{chain-only}First lead paragraph.{/chain-only}\n\n{chain-only}Second lead paragraph.{/chain-only}",
  "chain-only wraps each lead paragraph on its own",
);
const spanning = renderedMarkdown(
  "{chain-only}First lead paragraph.\n\nSecond lead paragraph.{/chain-only}",
);
assert(rawMarker(spanning) == null, "a spanning chain-only pair leaked a raw marker");
assert(
  (spanning.match(/data-chain-only/g) ?? []).length >= 2,
  "each paragraph of a spanning chain-only pair stays hidden with Local only",
);

function paragraphWith(html: string, needle: string): string {
  return html.split("</p>").find((part) => part.includes(needle)) ?? "";
}
// Tuwaiq left this chain-only set on 3 Oct 2026 (Drip is local); Namar left it in Batch D3
// (ON OFF Coffee is local). Both are in the mixed list above. The dr.CAFE row stays a {chain} row.
for (const id of ["namar"] as const) {
  const en = renderedMarkdown(districtEnMarkdown(id));
  const ar = renderedMarkdown(districtArMarkdown(id));
  assert(
    paragraphWith(en, "is the local cafe") !== "" &&
      paragraphWith(ar, "القهوة المحلية") !== "" &&
      !paragraphWith(en, "is the local cafe").includes("data-chain-only") &&
      !paragraphWith(ar, "القهوة المحلية").includes("data-chain-only"),
    `${id} local lead stays visible with Local only`,
  );
  assert(
    districtEnMarkdown(id).includes("- {chain} [dr.CAFE](/en/c/drcafe-namar)"),
    `${id} dr.CAFE stays a {chain} list row (hidden with Local only on)`,
  );
}
assert(
  !districtArMarkdown("al-manar").includes("بطاقتين") &&
    !districtEnMarkdown("al-manar").includes("Two cards"),
  "Al Manar lead does not state a card count that changes with the toggle",
);

function headingIsChainOnly(html: string, title: string): boolean {
  const chunk = html.split("<h2").find((part) => part.includes(title));
  if (!chunk) return false;
  return chunk.slice(0, chunk.indexOf(">")).includes("data-chain-only");
}
for (const [id, enTitle, arTitle] of [
  ["namar", "What’s here", "وش فيه"],
] as const) {
  assert(
    !headingIsChainOnly(renderedMarkdown(districtEnMarkdown(id)), enTitle),
    `${id} EN What's here stays under Local only (local ON OFF card follows it)`,
  );
  assert(
    !headingIsChainOnly(renderedMarkdown(districtArMarkdown(id)), arTitle),
    `${id} AR وش فيه stays under Local only (local ON OFF card follows it)`,
  );
}
assert(
  !headingIsChainOnly(renderedMarkdown(districtEnMarkdown("al-rawabi")), "What’s here"),
  "Al Rawabi What's here stays when local cards follow it",
);
const rawabiEn = districtEnMarkdown("al-rawabi");
const rawabiAr = districtArMarkdown("al-rawabi");
assert(
  rawabiEn.includes("[Bala](/en/c/bala-al-rawabi)") &&
    rawabiEn.includes("4 cards") &&
    rawabiEn.includes("[TORRE Cafe](/en/c/torre-al-rawabi)") &&
    rawabiEn.includes("[THE IT]") &&
    rawabiEn.includes("[Essert]"),
  "Al Rawabi EN lead names the four cards",
);
assert(
  rawabiAr.includes("[بلة](/c/bala-al-rawabi)") &&
    rawabiAr.includes("البطاقات الـ4") &&
    !rawabiAr.includes("4 بطاقة") &&
    rawabiAr.includes("[توري](/c/torre-al-rawabi)") &&
    rawabiAr.includes("[THE IT]") &&
    rawabiAr.includes("[ايزرت]"),
  "Al Rawabi AR lead names the four cards",
);
const nadaEn = districtEnMarkdown("an-nada");
const nadaAr = districtArMarkdown("an-nada");
assert(
  nadaEn.includes("[SoMatcha](/en/c/somatcha-an-nada)") &&
    nadaEn.includes("[Brew 92 - Al Nada]") &&
    nadaEn.includes("[Century Cafe](/en/c/century-cafe-an-nada)") &&
    /\b3 cards\b/.test(nadaEn) &&
    /\b3 cafes\b/.test(nadaEn),
  "An Nada EN lead names the 3 cards (Batch D3 adds Century Cafe)",
);
assert(
  nadaAr.includes("[سو ماتشا](/c/somatcha-an-nada)") &&
    nadaAr.includes("[برو92]") &&
    nadaAr.includes("[سنشري كافيه](/c/century-cafe-an-nada)") &&
    nadaAr.includes("البطاقات الـ3") &&
    nadaAr.includes("3 قهاوي") &&
    !nadaAr.includes("ثلاث قهاوي"),
  "An Nada AR lead names the 3 cards (digits from 3)",
);
const chainSection = renderedMarkdown(
  "## What’s here\n\n{chain-only}Only a chain.{/chain-only}\n\n- {chain} [dr.CAFE](/en/c/drcafe-namar)\n\n## Nearby\n\n- [Olaya](/en/coffee-shops/olaya)",
);
assert(
  headingIsChainOnly(chainSection, "What’s here") &&
    !headingIsChainOnly(chainSection, "Nearby"),
  "a heading hides under Local only only when its section is entirely chain-only",
);
const hiddenDistrictCafes = ["kkia", "al-jazirah", "an-nasim", "shubra", "manfuha"] as const;
const listLeftovers = ["الأسماء الثانية مربوطة تحت", "باقي الحي تحت", "linked below", "مربوطة تحت", "مربوط تحت"];
for (const district of hiddenDistrictCafes) {
  for (const shop of listRealShops().filter((row) => row.neighborhood === district)) {
    const en = cafeEnMarkdown(shop);
    const ar = cafeArMarkdown(shop);
    for (const phrase of listLeftovers) {
      assert(!en.includes(phrase) && !ar.includes(phrase), `${shop.id} still promises a list (${phrase})`);
    }
  }
}

assert(fixedListAllowsChains("nearby") && fixedListAllowsChains("outdoor"), "Nearby and Outdoor show chains behind Local only");
assert(!fixedListAllowsChains("coffee") && !fixedListAllowsChains("work"), "Best coffee and Work are local only");
assert(listNearbyShops().some((shop) => isChainShop(shop)), "Nearby pool includes listed chains");
assert(listOutdoorShops().some((shop) => isChainShop(shop)), "Outdoor pool includes listed chains");
assert(
  listBestCoffeeShops().every((shop) => !isChainShop(shop)) &&
    listWorkShops().every((shop) => !isChainShop(shop)),
  "Best coffee and Work contain zero chains",
);
assert(
  read("components/fixed-list-body.tsx").includes("data-chain-filter") &&
    read("components/fixed-list-body.tsx").includes("HIDE_CHAINS") === false &&
    read("components/fixed-list-body.tsx").includes("writeHideChains") &&
    !read("components/fixed-list-body.tsx").includes("URLSearchParams"),
  "fixed lists reuse the Local only toggle, localStorage, no URL param",
);
assert(
  listPopularDirectoryShops().every((shop) => !shop.isChain),
  "Most Popular stays local",
);

console.log("check-chains: ok");
