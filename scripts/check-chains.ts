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
import { listPopularDirectoryShops, listPopularPublicShops } from "../lib/most-popular";
import {
  listBestCoffeeShops,
  listNearbyShops,
  listOutdoorShops,
  listWorkShops,
} from "../lib/fixed-lists";
import { fixedListAllowsChains } from "../lib/fixed-list-ids";
import { formatReply, pickCafes } from "../lib/picker";
import { districtPath, LEGACY_DISTRICT_REDIRECTS } from "../lib/product";
import { dedupeSameBrand, shopBrandKey } from "../lib/shop-brand";
import { matchCatalogShops, shopNameAliases } from "../lib/shop-name";
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
assert(taggedLive.length === 82, "exactly 82 rows are tagged (2 Namq, Al Malqa and As Salam, 21 Oct Amjad; 7 Batch SD1 Al Shohda: 2 dr.CAFE, Peet's, Starbucks, Half Million, Tim Hortons, Caribou; 5 Batch R Al Qadisiyah: Peet's, Half Million, 2 Starbucks, Tim Hortons; 28 on main + 16 Drive Coffee + Veloce At Taawun, Batch E r2 + Half Million and Tim Hortons Shubra, Batch F + Costa, Starbucks and dr.CAFE An Nafal, Batch G; Batch H Al Izdihar adds no chain; + Starbucks and Java Time Ar Rahmaniyyah, Batch I; + Peet's Euromarché and Starbucks Panorama, Tafaseel and Takhassusi Al Mathar, Batch J; + Starbucks Oruba Square Umm Al Hamam Al Gharbi, Batch K; + Costa, Caribou and 2 Starbucks Diplomatic Quarter, Batch M; + Veloce and dr.CAFE Dhahrat Laban, Batch N; + Java Cafe and The Coffee Bean & Tea Leaf Namar, Batch O; + Java Cafe and 2 Half Million Ash Shifa, Batch Q)");
assert(
  taggedLive.filter((shop) => shop.chainBrand === "drive").length === 16 &&
    listRealShops()
      .filter((shop) => shop.nameEn === "Drive Coffee")
      .every((shop) => shop.isChain === true && shop.chainBrand === "drive"),
  "all 16 Drive Coffee rows are tagged drive",
);
assert(
  taggedLive.filter((shop) => shop.chainBrand === "dr-cafe").length === 23,
  "23 dr.CAFE rows are tagged (18 + As Suwaidi, Batch D1 + An Nafal Park, Batch G + Park Dhahrat Laban, Batch N + Ash Shuhada and Granada Mall, Batch SD1)",
);
assert(
  taggedLive.filter((shop) => shop.chainBrand === "java").length === 8,
  "8 Java rows are tagged (6 + sit-down Namar, Batch O + sit-down Ash Shifa, Batch Q)",
);
assert(
  taggedLive.filter((shop) => shop.chainBrand === "24cafe").length === 3,
  "3 24cafe rows are tagged",
);
// Batch E r2 (8 Oct 2026): Veloce has 60+ branches (official TikTok @veloce_cafe_sa), so At Taawun's row is a sit-down chain.
assert(
  taggedLive.filter((shop) => shop.chainBrand === "veloce").map((shop) => shop.id).join(",") === "veloce-cafe-at-taawun,veloce-dhahrat-laban",
  "Veloce has one tagged row (At Taawun, Batch E r2)",
);
// Batch F (5 Oct 2026): first Half Million and Tim Hortons rows, both sit-down in Shubra.
assert(
  taggedLive.filter((shop) => shop.chainBrand === "half-million").map((shop) => shop.id).join(",") ===
    "half-million-shubra,half-million-ibn-taymiyyah-ash-shifa,half-million-tirmidhi-ash-shifa,half-million-al-qadisiyah,half-million-al-shohda" &&
    taggedLive.filter((shop) => shop.chainBrand === "tim-hortons").map((shop) => shop.id).join(",") === "tim-hortons-shubra,tim-hortons-sheikh-jaber-al-qadisiyah,tim-hortons-granada-mall-al-shohda",
  "Half Million has Shubra (Batch F), 2 Ash Shifa rows (Batch Q), Al Qadisiyah (Batch R) and Al Shohda (Batch SD1); Tim Hortons has Shubra (Batch F), Al Qadisiyah (Batch R) and Granada Mall Al Shohda (Batch SD1)",
);
// Batch G (8 Oct 2026): first Costa and Starbucks rows, both sit-down in Tala Mall (An Nafal).
assert(
  taggedLive.filter((shop) => shop.chainBrand === "costa").map((shop) => shop.id).join(",") === "costa-tala-mall-an-nafal,costa-coffee-diplomatic-quarter" &&
    taggedLive.filter((shop) => shop.chainBrand === "starbucks").map((shop) => shop.id).join(",") ===
      "starbucks-tala-mall-an-nafal,starbucks-the-plaza-al-rahmaniyyah,starbucks-panorama-al-mathar,starbucks-tafaseel-al-mathar,starbucks-takhassusi-al-mathar,starbucks-oruba-square-umm-al-hamam-al-gharbi,starbucks-safarat-diplomatic-quarter,starbucks-oud-square-diplomatic-quarter,starbucks-rakaa-plaza-al-qadisiyah,starbucks-tamimi-al-qadisiyah,starbucks-granada-mall-al-shohda",
  "Costa has Tala Mall An Nafal (Batch G) and Diplomatic Quarter (Batch M); Starbucks has Tala Mall (Batch G), The Plaza Ar Rahmaniyyah (Batch I), Panorama, Tafaseel and Takhassusi Al Mathar (Batch J), Oruba Square Umm Al Hamam Al Gharbi (Batch K) and Safarat and Oud Square DQ (Batch M), Rakaa Plaza and Tamimi Al Qadisiyah (Batch R), Granada Mall Al Shohda (Batch SD1)",
);
// Batch I (10 Oct 2026): Java Time (~20 Riyadh branches, coffee-first) is its own chain brand, never Java Cafe.
assert(
  taggedLive.filter((shop) => shop.chainBrand === "java-time").map((shop) => shop.id).join(",") === "java-time-al-rahmaniyyah",
  "Java Time has one tagged row (Ar Rahmaniyyah, Batch I)",
);
{
  const javaTime = getShop("java-time-al-rahmaniyyah");
  assert(
    javaTime?.isChain === true && javaTime.chainBrand === "java-time" && shopBrandKey(javaTime) === "java-time" && !javaTime.logoUrl,
    "Java Time row is brand java-time (letter tile, no Java Cafe mark)",
  );
  assert(CHAIN_BRANDS["java-time"].logo === null, "Java Time registry has no logo");
  assert(
    listRealShops().filter((shop) => shop.chainBrand === "java").every((shop) => shopBrandKey(shop) === "java" && shop.nameEn === "Java Cafe"),
    "Java Cafe rows keep brand java",
  );
  assert(!shopNameAliases(javaTime!).some((alias) => ["java", "جافا", "time", "تايم"].includes(alias)), "Java Time does not answer to java / جافا / time / تايم alone");
  const starbucksR = getShop("starbucks-the-plaza-al-rahmaniyyah");
  assert(
    starbucksR?.isChain === true && starbucksR.chainBrand === "starbucks" && shopBrandKey(starbucksR) === "starbucks" && starbucksR.logoUrl === "/logos/starbucks-mark.png",
    "Starbucks Ar Rahmaniyyah is brand starbucks with the siren mark",
  );
}
// Batch J (11 Oct 2026): first Peet's row (Euromarché, Al Mathar) and three Starbucks in Al Mathar, all sit-down chains.
assert(
  taggedLive.filter((shop) => shop.chainBrand === "peets").map((shop) => shop.id).join(",") === "peets-euromarche-al-mathar,peets-sheikh-jaber-al-qadisiyah,peets-granada-mall-al-shohda",
  "Peet's has Euromarché Al Mathar (Batch J) and Sheikh Jaber Al Qadisiyah (Batch R)",
);
{
  const peets = getShop("peets-euromarche-al-mathar");
  assert(
    peets?.isChain === true && peets.chainBrand === "peets" && shopBrandKey(peets) === "peets" && peets.logoUrl === "/logos/peets-mark.png",
    "Peet's Al Mathar is brand peets with the Peet's Coffee wordmark",
  );
  assert(CHAIN_BRANDS.peets.logo === "/logos/peets-mark.png", "Peet's registry ships the wordmark (Batch J)");
  for (const id of ["starbucks-panorama-al-mathar", "starbucks-tafaseel-al-mathar", "starbucks-takhassusi-al-mathar"] as const) {
    const shop = getShop(id);
    assert(
      shop?.isChain === true && shop.chainBrand === "starbucks" && shopBrandKey(shop) === "starbucks" && shop.logoUrl === "/logos/starbucks-mark.png" &&
        shop.nameEn === "Starbucks" && shop.nameAr === "ستاربكس",
      `${id} is brand starbucks with the siren mark`,
    );
  }
  // Places says dineIn false for Panorama Mall; Scout's gallery and reviews show seating, so a scout verdict keeps it sit-down (torre-al-rawabi precedent).
  const panorama = getShop("starbucks-panorama-al-mathar");
  assert(
    panorama?.dineIn === true && panorama.seatingVerdict?.dineIn === true && panorama.seatingVerdict.source === "scout" && panorama.seatingVerdict.date === "2026-10-11" &&
      seatingVerdictDisagrees(panorama) === null,
    "Starbucks Panorama is sit-down by scout verdict (Places dineIn false overridden)",
  );
  for (const id of ["peets-euromarche-al-mathar", "starbucks-panorama-al-mathar", "starbucks-tafaseel-al-mathar", "starbucks-takhassusi-al-mathar"] as const) {
    assert(listDirectoryShopsForDistrict("al-mathar").some((shop) => shop.id === id), `${id} shows on the Al Mathar page`);
    assert(!listDiscoveryShops().some((shop) => shop.id === id), `${id} is not specialty discovery`);
    assert(!listPopularPublicShops().some((shop) => shop.id === id), `${id} is not in Most popular`);
    assert(!filterHalfwayEligible(listDiscoveryShops()).some((shop) => shop.id === id), `${id} is not in the بيننا pool`);
    assert(!listBestCoffeeShops().some((shop) => shop.id === id) && !listWorkShops().some((shop) => shop.id === id), `${id} is not in Best coffee or Work`);
  }
  for (const id of ["richony-cafe-al-mathar", "leto-caffe-al-mathar", "urth-caffe-al-mathar", "waynes-coffee-al-mathar"] as const) {
    const shop = getShop(id);
    assert(shop?.isChain !== true && !shop?.chainBrand && listDiscoveryShops().some((row) => row.id === id), `${id} is local specialty`);
  }
  // Urth Al Mathar follows its specialty sibling (Urth Caffé Tahlia): same mark, never a chain.
  assert(getShop("urth-caffe-tahlia-sulimaniyah")?.isChain !== true && getShop("urth-caffe-al-mathar")?.logoUrl === getShop("urth-caffe-tahlia-sulimaniyah")?.logoUrl, "Urth rows share the sibling mark and stay specialty");
}
// Batch K (12 Oct 2026): Starbucks Oruba Square (Umm Al Hamam Al Gharbi) has a drive-through lane but verified indoor seating: a sit-down chain, no drive-through tag (no Starbucks row carries one). Java Time Umm Al Hamam was dropped (kiosk, no seating, rule 5). Café Kitsuné (1 Riyadh branch) and Toby's Estate (4) are under the ~8-branch chain threshold and stay specialty.
{
  const oruba = getShop("starbucks-oruba-square-umm-al-hamam-al-gharbi");
  assert(
    oruba?.isChain === true && oruba.chainBrand === "starbucks" && shopBrandKey(oruba) === "starbucks" && oruba.logoUrl === "/logos/starbucks-mark.png" &&
      oruba.nameEn === "Starbucks" && oruba.nameAr === "ستاربكس" && oruba.dineIn === true && oruba.catalogLane !== "drive-through" &&
      !(oruba.momentTags ?? []).includes("drive-through"),
    "Starbucks Oruba Square is a sit-down starbucks row (siren mark, no drive-through tag or lane)",
  );
  assert(
    listRealShops().filter((shop) => shop.chainBrand === "starbucks" && shop.id !== "starbucks-tamimi-al-qadisiyah").every((shop) => !(shop.momentTags ?? []).includes("drive-through")),
    "no Starbucks row carries the drive-through tag (Batch R carve-out: Starbucks Tamimi Al Qadisiyah only)",
  );
  assert(listDirectoryShopsForDistrict("umm-al-hamam-al-gharbi").some((shop) => shop.id === oruba!.id), "Starbucks Oruba shows on the Umm Al Hamam Al Gharbi page");
  assert(!listDiscoveryShops().some((shop) => shop.id === oruba!.id), "Starbucks Oruba is not specialty discovery");
  assert(!listPopularPublicShops().some((shop) => shop.id === oruba!.id), "Starbucks Oruba is not in Most popular");
  assert(!filterHalfwayEligible(listDiscoveryShops()).some((shop) => shop.id === oruba!.id), "Starbucks Oruba is not in the بيننا pool");
  assert(!listBestCoffeeShops().some((shop) => shop.id === oruba!.id) && !listWorkShops().some((shop) => shop.id === oruba!.id), "Starbucks Oruba is not in Best coffee or Work");
  assert(!getShop("java-time-umm-al-hamam-al-gharbi"), "no Java Time Umm Al Hamam row (dropped, kiosk with no seating)");
  assert(
    taggedLive.filter((shop) => shop.chainBrand === "java-time").map((shop) => shop.id).join(",") === "java-time-al-rahmaniyyah",
    "Java Time still has one tagged row after Batch K",
  );
  for (const id of [
    "archi-umm-al-hamam-al-gharbi",
    "book-of-beans-umm-al-hamam-al-gharbi",
    "caffeination-umm-al-hamam-al-gharbi",
    "cafe-kitsune-laysen-umm-al-hamam-al-gharbi",
    "jaam-coffee-umm-al-hamam-al-gharbi",
    "midway-coffee-umm-al-hamam-al-gharbi",
    "malmoum-cafe-umm-al-hamam-al-gharbi",
    "tobys-estate-laysen-umm-al-hamam-al-gharbi",
    "hamasat-coffee-umm-al-hamam-al-gharbi",
    "mazaj-cafe-umm-al-hamam-al-gharbi",
    "shafaq-cafe-umm-al-hamam-al-gharbi",
  ] as const) {
    const shop = getShop(id);
    assert(shop?.isChain !== true && !shop?.chainBrand && listDiscoveryShops().some((row) => row.id === id), `${id} is local specialty`);
  }
  assert(
    listRealShops().filter((shop) => /toby/i.test(shop.id)).every((shop) => shop.isChain !== true) &&
      listRealShops().filter((shop) => /kitsune/i.test(shop.id)).every((shop) => shop.isChain !== true),
    "Toby's Estate and Café Kitsuné rows stay specialty (under the chain threshold)",
  );
}
// Batch K search guards: brand-qualified Starbucks asks find Oruba; bare location and everyday words pin nothing new.
for (const [ask, id] of [
  ["starbucks oruba", "starbucks-oruba-square-umm-al-hamam-al-gharbi"],
  ["starbucks oruba square", "starbucks-oruba-square-umm-al-hamam-al-gharbi"],
  ["ستاربكس العروبة", "starbucks-oruba-square-umm-al-hamam-al-gharbi"],
  ["archi umm al hamam", "archi-umm-al-hamam-al-gharbi"],
  ["book of beans", "book-of-beans-umm-al-hamam-al-gharbi"],
  ["toby's estate laysen", "tobys-estate-laysen-umm-al-hamam-al-gharbi"],
  ["كافيه مزاج", "mazaj-cafe-umm-al-hamam-al-gharbi"],
  ["شفق كافيه", "shafaq-cafe-umm-al-hamam-al-gharbi"],
  ["ملموم كافيه", "malmoum-cafe-umm-al-hamam-al-gharbi"],
  ["مقهى همسات قهوة", "hamasat-coffee-umm-al-hamam-al-gharbi"],
] as const) {
  const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
  assert(hits[0] === id, `${ask} matches ${id} first, got ${hits.join(",")}`);
}
{
  const kIds = new Set(listRealShops().filter((shop) => shop.neighborhood === "umm-al-hamam-al-gharbi" && !shop.id.startsWith("bisat")).map((shop) => shop.id));
  assert(kIds.size === 12, "Batch K adds 12 Umm Al Hamam Al Gharbi rows");
  for (const ask of ["oruba", "العروبة", "square", "سكوير", "laysen", "valley", "ليسن", "book", "beans", "كتاب", "caf", "همسات", "مزاج", "شفق", "ملموم", "عندي مزاج قهوة", "قهوة الشفق", "همسات المساء"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.some((hit) => kIds.has(hit)), `${ask} does not pin a Batch K row, got ${hits.join(",")}`);
  }
  for (const ask of ["archi", "ارتشي"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] !== "archi-umm-al-hamam-al-gharbi", `${ask} keeps the older Archi rows first, got ${hits.join(",")}`);
  }
  const jt = matchCatalogShops("java time", listRealShops()).map((shop) => shop.id);
  assert(jt[0] === "java-time-al-rahmaniyyah", `java time still matches Ar Rahmaniyyah first, got ${jt.join(",")}`);
}
// Batch L (13 Oct 2026): Umm Al Hamam Ash Sharqi opens with 3 local specialty cafés. molten (~3 Riyadh branches) is under the chain threshold; Elixir Bunn is a specialty sibling. The 4 traditional Sudanese / youth-majlis rows from Scout's pack are not listed.
{
  const ids = ["elixir-bunn-umm-al-hamam-ash-sharqi", "fill-umm-al-hamam-ash-sharqi", "molten-umm-al-hamam-ash-sharqi"] as const;
  for (const id of ids) {
    const shop = getShop(id);
    assert(shop?.isChain !== true && !shop?.chainBrand && listDiscoveryShops().some((row) => row.id === id), `${id} is local specialty`);
    assert(listDirectoryShopsForDistrict("umm-al-hamam-ash-sharqi").some((row) => row.id === id), `${id} shows on the Umm Al Hamam Ash Sharqi page`);
  }
  assert(getShop("elixir-bunn-umm-al-hamam-ash-sharqi")?.logoUrl === getShop("elixir-bunn-al-narjis")?.logoUrl, "Elixir Bunn Sharqi reuses the sibling mark");
  assert(getShop("fill-umm-al-hamam-ash-sharqi")?.placeId === "ChIJ3epDZIYdLz4RtyMcaduiQyg" && getShop("fill-umm-al-hamam-ash-sharqi")?.nameEn === "Fill", "Fill keeps the DRIPORA CAFE placeId under its storefront name");
  for (const gone of ["coffee-corner-sudanese", "rukn-al-talaqi", "sami-sudanese-coffee", "multaqa-al-shabab"]) {
    assert(!getShop(`${gone}-umm-al-hamam-ash-sharqi`), `${gone} Umm Al Hamam Ash Sharqi is not listed (Batch L policy drop)`);
  }
  for (const [ask, id] of [
    ["dripora", "fill-umm-al-hamam-ash-sharqi"],
    ["دريبورا", "fill-umm-al-hamam-ash-sharqi"],
    ["fill cafe", "fill-umm-al-hamam-ash-sharqi"],
    ["fill umm al hamam", "fill-umm-al-hamam-ash-sharqi"],
    ["sill cafe", "fill-umm-al-hamam-ash-sharqi"],
    ["مقهى ملء", "fill-umm-al-hamam-ash-sharqi"],
    ["molten cafe", "molten-umm-al-hamam-ash-sharqi"],
    ["مولتن", "molten-umm-al-hamam-ash-sharqi"],
    ["elixir umm al hamam", "elixir-bunn-umm-al-hamam-ash-sharqi"],
  ] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === id, `${ask} matches ${id} first, got ${hits.join(",")}`);
  }
  const lIds = new Set<string>(ids);
  for (const ask of ["fill", "sill", "سيل", "ملء", "molten", "molten cake", "corner", "ركن", "ملتقى", "الشباب", "ام الحمام", "window sill"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.some((hit) => lIds.has(hit)), `${ask} does not pin a Batch L row, got ${hits.join(",")}`);
  }
  const elixir = matchCatalogShops("elixir", listRealShops()).map((shop) => shop.id);
  assert(elixir[0] === "elixir-bunn-al-nakheel", `bare elixir keeps the older Elixir Bunn rows first, got ${elixir.join(",")}`);
}
// Batch M (14 Oct 2026): Diplomatic Quarter — 9 local specialty cafés + 4 sit-down chains (Costa, first Caribou row, 2 Starbucks). DQ becomes a mixed district.
{
  const chainIds = ["costa-coffee-diplomatic-quarter", "caribou-coffee-diplomatic-quarter", "starbucks-safarat-diplomatic-quarter", "starbucks-oud-square-diplomatic-quarter"] as const;
  const localIds = [
    "ralphs-coffee-diplomatic-quarter", "onda-coffee-diplomatic-quarter", "draft-cafe-diplomatic-quarter", "wacafe-diplomatic-quarter", "archi-diplomatic-quarter",
    "urth-caffe-diplomatic-quarter", "nua-diplomatic-quarter", "pink-camel-diplomatic-quarter", "coffee-table-diplomatic-quarter",
  ] as const;
  assert(
    taggedLive.filter((shop) => shop.chainBrand === "caribou").map((shop) => shop.id).join(",") === "caribou-coffee-diplomatic-quarter,caribou-granada-mall-al-shohda",
    "Caribou has Diplomatic Quarter (Batch M) and Granada Mall Al Shohda (Batch SD1)",
  );
  const caribou = getShop("caribou-coffee-diplomatic-quarter");
  assert(
    caribou?.isChain === true && caribou.chainBrand === "caribou" && shopBrandKey(caribou) === "caribou" &&
      caribou.logoUrl === "/logos/caribou-coffee-diplomatic-quarter.png" && existsSync(join(process.cwd(), "public/logos/caribou-coffee-diplomatic-quarter.png")) &&
      CHAIN_BRANDS.caribou.logo === null &&
      caribou.nameEn === "Caribou Coffee" && caribou.nameAr === "كاريبو كوفي",
    "Caribou DQ is brand caribou (official cariboucoffee.safr.com.sa mark on the row, logo sweep 18 Oct; registry logo stays null)",
  );
  const costa = getShop("costa-coffee-diplomatic-quarter");
  assert(
    costa?.isChain === true && costa.chainBrand === "costa" && shopBrandKey(costa) === "costa" && costa.logoUrl === CHAIN_BRANDS.costa.logo && costa.nameEn === "Costa Coffee",
    "Costa DQ is brand costa with the registry mark",
  );
  for (const id of ["starbucks-safarat-diplomatic-quarter", "starbucks-oud-square-diplomatic-quarter"] as const) {
    const shop = getShop(id);
    assert(
      shop?.isChain === true && shop.chainBrand === "starbucks" && shopBrandKey(shop) === "starbucks" && shop.logoUrl === "/logos/starbucks-mark.png" &&
        shop.nameEn.startsWith("Starbucks ") && shop.nameAr.startsWith("ستاربكس ") && shop.dineIn === true && !(shop.momentTags ?? []).includes("drive-through"),
      `${id} is a sit-down Starbucks with the siren mark, no drive-through tag`,
    );
  }
  // QA #264: two Starbucks cards share the DQ list, so each carries its branch name.
  assert(
    getShop("starbucks-safarat-diplomatic-quarter")?.nameEn === "Starbucks Safarat" && getShop("starbucks-safarat-diplomatic-quarter")?.nameAr === "ستاربكس السفارات" &&
      getShop("starbucks-oud-square-diplomatic-quarter")?.nameEn === "Starbucks Oud Square" && getShop("starbucks-oud-square-diplomatic-quarter")?.nameAr === "ستاربكس ساحة العود",
    "DQ Starbucks cards carry branch suffixes",
  );
  for (const id of chainIds) {
    assert(listDirectoryShopsForDistrict("diplomatic-quarter").some((shop) => shop.id === id), `${id} shows on the Diplomatic Quarter page`);
    assert(!listDiscoveryShops().some((shop) => shop.id === id), `${id} is not specialty discovery`);
    assert(!listPopularPublicShops().some((shop) => shop.id === id), `${id} is not in Most popular`);
    assert(!filterHalfwayEligible(listDiscoveryShops()).some((shop) => shop.id === id), `${id} is not in the بيننا pool`);
    assert(!applyHideChains(listDirectoryShopsForDistrict("diplomatic-quarter"), true).some((shop) => shop.id === id), `${id} is hidden by Local only`);
  }
  for (const id of localIds) {
    const shop = getShop(id);
    assert(shop?.isChain !== true && !shop?.chainBrand && listDiscoveryShops().some((row) => row.id === id), `${id} is local specialty`);
  }
  // Specialty siblings reuse their catalog marks and stay specialty (ARCHI per Amjad; Urth follows Tahlia / Al Mathar).
  for (const [id, sibling] of [
    ["archi-diplomatic-quarter", "archi-al-bujairi-diriyah"],
    ["urth-caffe-diplomatic-quarter", "urth-caffe-tahlia-sulimaniyah"],
    ["draft-cafe-diplomatic-quarter", "draft-cafe-kafd"],
    ["wacafe-diplomatic-quarter", "wacafe-al-rabi"],
  ] as const) {
    assert(getShop(id)?.logoUrl === getShop(sibling)?.logoUrl, `${id} reuses the ${sibling} mark`);
  }
  // No bare location word pins a DQ Starbucks; brand-qualified asks do.
  const sb = new Set<string>(["starbucks-safarat-diplomatic-quarter", "starbucks-oud-square-diplomatic-quarter"]);
  for (const id of sb) {
    const aliases = shopNameAliases(getShop(id)!);
    for (const bare of ["safarat", "السفارات", "oud", "العود", "square", "oud square", "ساحة العود", "diplomatic quarter", "الحي الدبلوماسي", "dq"]) {
      assert(!aliases.includes(bare), `${id} has no bare alias ${bare}`);
    }
  }
  for (const ask of ["safarat", "السفارات", "oud", "العود", "square", "oud square", "diplomatic quarter", "الحي الدبلوماسي", "قهوة السفارات", "coffee diplomatic quarter"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.some((hit) => sb.has(hit)), `${ask} does not name-pin a DQ Starbucks, got ${hits.join(",")}`);
    for (let run = 0; run < 3; run += 1) {
      assert(!sb.has(pickCafes({ text: ask }).picks[0]?.shop.id ?? ""), `${ask} does not pick a DQ Starbucks first`);
    }
  }
  for (const [ask, id] of [
    ["starbucks safarat", "starbucks-safarat-diplomatic-quarter"],
    ["ستاربكس السفارات", "starbucks-safarat-diplomatic-quarter"],
    ["starbucks oud square", "starbucks-oud-square-diplomatic-quarter"],
    ["ستاربكس العود", "starbucks-oud-square-diplomatic-quarter"],
    ["ralphs coffee", "ralphs-coffee-diplomatic-quarter"],
    ["onda", "onda-coffee-diplomatic-quarter"],
    ["nua", "nua-diplomatic-quarter"],
    ["pink camel", "pink-camel-diplomatic-quarter"],
    ["the coffee table", "coffee-table-diplomatic-quarter"],
    ["caribou", "caribou-coffee-diplomatic-quarter"],
    ["كاريبو", "caribou-coffee-diplomatic-quarter"],
    ["ash bloom", "ash-bloom-al-nakheel"],
  ] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === id, `${ask} matches ${id} first, got ${hits.join(",")}`);
  }
  const mIds = new Set<string>([...chainIds, ...localIds]);
  for (const ask of ["pink", "camel", "بينك", "كاميل", "table", "تيبل", "coffee", "كوفي"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.some((hit) => mIds.has(hit)), `${ask} does not pin a Batch M row, got ${hits.join(",")}`);
  }
  for (const bare of ["ash", "آش"]) {
    assert(!matchCatalogShops(bare, listRealShops()).some((shop) => shop.id === "ash-bloom-al-nakheel"), `bare ${bare} does not pin Ash Bloom (QA #262 / #264 minor)`);
  }
  for (const full of ["ash bloom", "آش بلوم"]) {
    assert(matchCatalogShops(full, listRealShops())[0]?.id === "ash-bloom-al-nakheel", `${full} still pins Ash Bloom`);
  }
  for (const [ask, first] of [["archi", "archi-al-bujairi-diriyah"], ["urth", "urth-caffe-tahlia-sulimaniyah"], ["draft", "draft-cafe-kafd"], ["wacafe", "wacafe-al-rabi"], ["costa", "costa-tala-mall-an-nafal"]] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === first, `bare ${ask} keeps the older row first, got ${hits.join(",")}`);
  }
  for (const id of [...chainIds, ...localIds]) {
    const shop = getShop(id)!;
    for (const name of [shop.nameEn, shop.nameAr]) {
      assert(matchCatalogShops(name, listRealShops()).some((hit) => hit.id === id), `${name} name-matches ${id}`);
    }
  }
}
// Batch N (15 Oct 2026): Dhahrat Laban — 13 local specialty cafés + 2 sit-down chains (Veloce, dr.CAFE). District becomes mixed (toggle).
{
  const chainIds = ["veloce-dhahrat-laban", "drcafe-park-dhahrat-laban"] as const;
  const localIds = [
    "filter-cafe-dhahrat-laban", "nakhat-almashrub-dhahrat-laban", "crete-cafe-dhahrat-laban", "arco-coffee-dhahrat-laban",
    "coffee-address-najd-dhahrat-laban", "angel-coffee-dhahrat-laban", "ezwa-cafe-dhahrat-laban", "sidedoor-dhahrat-laban",
    "portafilter-dhahrat-laban", "qasura-coffee-dhahrat-laban", "shafel-coffee-dhahrat-laban", "yabub-coffee-dhahrat-laban",
    "jadeel-coffee-dhahrat-laban",
  ] as const;
  const veloce = getShop("veloce-dhahrat-laban");
  assert(
    veloce?.isChain === true && veloce.chainBrand === "veloce" && shopBrandKey(veloce) === "veloce" &&
      veloce.logoUrl === CHAIN_BRANDS.veloce.logo && veloce.nameEn === "Veloce Cafe" &&
      veloce.dineIn === true && !(veloce.momentTags ?? []).includes("drive-through"),
    "Veloce Dhahrat Laban is a sit-down veloce row (sibling mark, no drive-through tag)",
  );
  const dr = getShop("drcafe-park-dhahrat-laban");
  assert(
    dr?.isChain === true && dr.chainBrand === "dr-cafe" && shopBrandKey(dr) === "dr-cafe" &&
      dr.logoUrl === CHAIN_BRANDS["dr-cafe"].logo && dr.nameEn === "dr.CAFE" &&
      dr.dineIn === true && !(dr.momentTags ?? []).includes("drive-through"),
    "dr.CAFE Park Dhahrat Laban is a sit-down dr-cafe row",
  );
  for (const id of chainIds) {
    assert(listDirectoryShopsForDistrict("dhahrat-laban").some((shop) => shop.id === id), `${id} shows on the Dhahrat Laban page`);
    assert(!listDiscoveryShops().some((shop) => shop.id === id), `${id} is not specialty discovery`);
    assert(!listPopularPublicShops().some((shop) => shop.id === id), `${id} is not in Most popular`);
    assert(!filterHalfwayEligible(listDiscoveryShops()).some((shop) => shop.id === id), `${id} is not in the بيننا pool`);
    assert(!applyHideChains(listDirectoryShopsForDistrict("dhahrat-laban"), true).some((shop) => shop.id === id), `${id} is hidden by Local only`);
  }
  for (const id of localIds) {
    const shop = getShop(id);
    assert(shop?.isChain !== true && !shop?.chainBrand && listDiscoveryShops().some((row) => row.id === id), `${id} is local specialty`);
  }
  assert(getShop("arco-coffee-dhahrat-laban")?.logoUrl === getShop("arco-al-rabi")?.logoUrl, "Arco Dhahrat Laban reuses the Al Rabi mark");
  assert(getShop("shafel-coffee-dhahrat-laban")?.logoUrl === getShop("shafel-roastery-al-nahdah")?.logoUrl, "Shafel Dhahrat Laban reuses the Al Nahdah mark");
  assert(getShop("coffee-address-najd-dhahrat-laban")?.logoUrl === "/logos/coffee-address-mark.png", "Coffee Address Najd uses the shared mark");
  assert(getShop("shafel-coffee-dhahrat-laban")?.seatingVerdict?.source === "scout", "Shafel has a Scout seatingVerdict (Places dineIn was null)");
  assert(getShop("coffee-address-najd-dhahrat-laban")?.isChain !== true, "Coffee Address stays specialty (Amjad carve-out)");
  for (const [ask, id] of [
    ["filter cafe", "filter-cafe-dhahrat-laban"],
    ["فلتر كافيه", "filter-cafe-dhahrat-laban"],
    ["crete cafe", "crete-cafe-dhahrat-laban"],
    ["angel coffee", "angel-coffee-dhahrat-laban"],
    ["sidedoor", "sidedoor-dhahrat-laban"],
    ["portafilter", "portafilter-dhahrat-laban"],
    ["قسورة كوفي", "qasura-coffee-dhahrat-laban"],
    ["يعبوب قهوة", "yabub-coffee-dhahrat-laban"],
    ["ezwa cafe", "ezwa-cafe-dhahrat-laban"],
    ["نكهة المشروب", "nakhat-almashrub-dhahrat-laban"],
    ["coffee address najd", "coffee-address-najd-dhahrat-laban"],
    ["veloce laban", "veloce-dhahrat-laban"],
    ["dr cafe park", "drcafe-park-dhahrat-laban"],
  ] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === id, `${ask} matches ${id} first, got ${hits.join(",")}`);
  }
  const nIds = new Set<string>([...chainIds, ...localIds]);
  for (const ask of ["filter", "فلتر", "angel", "انجل", "crete", "كريت", "side", "door", "سايد", "دور", "porta", "بورتا", "jadeel", "جديل", "yabub", "يعبوب", "nakhat", "نكهة", "najd", "نجد", "ezwa", "عزوة"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.some((hit) => nIds.has(hit)), `${ask} does not pin a Batch N row, got ${hits.join(",")}`);
  }
  for (const [ask, first] of [["veloce", "veloce-cafe-at-taawun"], ["arco", "arco-al-rabi"], ["shafel", "shafel-roastery-al-yarmouk"], ["jadeel", "jadeel-coffee-at-taawun"]] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === first, `bare ${ask} keeps the older row first, got ${hits.join(",")}`);
  }
  assert(listDirectoryShopsForDistrict("dhahrat-laban").length === 17, "Dhahrat Laban page has 17 cafés (ON OFF + 15 Batch N + Dwell, trending add 18 Oct)");
}
// Trending adds (18 Oct 2026): 7 local specialty rows from Scout's trending verify.
{
  const TILES = ["dwell-dhahrat-laban", "veni-al-nakheel", "horus-house-olaya", "espresso-culture-al-mursalat", "shal-al-mohammadiyah"];
  const LOGOS: Record<string, string> = { "in-row-al-fayha": "/logos/in-row-al-fayha.png", "kultura-as-suwaidi-al-gharbi": "/logos/kultura-as-suwaidi-al-gharbi.jpg" };
  for (const id of [...TILES, ...Object.keys(LOGOS)]) {
    const shop = getShop(id);
    assert(shop && shop.isChain !== true && !shop.chainBrand && listDiscoveryShops().some((s) => s.id === id), `${id} is local specialty`);
    assert(TILES.includes(id) ? !shop.logoUrl : shop.logoUrl === LOGOS[id], `${id} logo/tile`);
    assert(listDirectoryShopsForDistrict(shop.neighborhood).some((s) => s.id === id), `${id} shows on its district page`);
  }
  for (const id of ["kultura-hittin", "kultura-al-malqa", "kultura-al-rayyan", "kultura-al-ghadeer"]) {
    assert(getShop(id)?.logoUrl === `/logos/${id}.jpg`, `${id} keeps its logo path (file now the 512px official mark)`);
  }
  const first: Array<[string, string]> = [
    ["dwell cafe", "dwell-dhahrat-laban"], ["دويل", "dwell-dhahrat-laban"],
    ["in row", "in-row-al-fayha"], ["ان رو", "in-row-al-fayha"], ["إن رو", "in-row-al-fayha"],
    // r2 (QA M1): branch + district short forms rank the Suwaidi Al Gharbi branch first; Google's «كلتورا» spelling matches.
    ["kultura suwaidi", "kultura-as-suwaidi-al-gharbi"], ["كولتورا السويدي", "kultura-as-suwaidi-al-gharbi"],
    ["كلتورا السويدي", "kultura-as-suwaidi-al-gharbi"], ["كولتورا السويدي الغربي", "kultura-as-suwaidi-al-gharbi"],
    ["كلتورا حطين", "kultura-hittin"],
    ["veni", "veni-al-nakheel"], ["فيني", "veni-al-nakheel"],
    ["horus house", "horus-house-olaya"], ["بيت حورس", "horus-house-olaya"],
    ["espresso culture", "espresso-culture-al-mursalat"], ["إسبريسو كالتشر", "espresso-culture-al-mursalat"],
    ["shal coffee", "shal-al-mohammadiyah"], ["شال", "shal-al-mohammadiyah"],
  ];
  for (const [ask, id] of first) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === id, `${ask} matches ${id} first, got ${hits.join(",")}`);
  }
  assert(matchCatalogShops("كولتورا", listRealShops()).some((s) => s.id === "kultura-as-suwaidi-al-gharbi"), "كولتورا includes the Suwaidi Al Gharbi branch");
  {
    const k = matchCatalogShops("كلتورا", listRealShops()).map((s) => s.id).filter((id) => id.startsWith("kultura-")).sort();
    assert(k.join(",") === "kultura-al-ghadeer,kultura-al-malqa,kultura-al-rayyan,kultura-as-suwaidi-al-gharbi,kultura-hittin", `كلتورا (Google spelling) matches all 5 Kultura rows, got ${k.join(",")}`);
  }
  assert(pickCafes({ text: "kultura suwaidi" }).picks[0]?.shop.id === "kultura-as-suwaidi-al-gharbi", "picker leads with the Suwaidi Al Gharbi branch for kultura suwaidi");
  assert(getShop("in-row-al-fayha")?.nameAr === "إن رو", "in row AR name is «إن رو» (r2, QA policy default 4)");
  const guards: Array<[string, string]> = [
    ["row", "in-row-al-fayha"], ["ان", "in-row-al-fayha"], ["رو", "in-row-al-fayha"],
    ["بيت", "horus-house-olaya"], ["espresso", "espresso-culture-al-mursalat"], ["اسبريسو", "espresso-culture-al-mursalat"], ["culture", "espresso-culture-al-mursalat"], ["كالتشر", "espresso-culture-al-mursalat"],
  ];
  for (const [ask, id] of guards) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.includes(id), `${ask} does not pin ${id}, got ${hits.join(",")}`);
  }
}
// AJ add (18 Oct 2026): Trace / تريس, Al Mursalat — local specialty, letter tile; Places dineIn true.
{
  const trace = getShop("trace-al-mursalat");
  assert(trace && trace.isChain !== true && !trace.chainBrand && trace.logoUrl === "/logos/trace-al-mursalat.png" && existsSync(join(process.cwd(), "public/logos/trace-al-mursalat.png")) && listDiscoveryShops().some((s) => s.id === "trace-al-mursalat"), "Trace Al Mursalat is local specialty with its official TikTok mark (logo sweep 25 Oct)");
  assert(trace?.dineIn === true, "Trace is dine-in on Places");
  const mursalat = listDirectoryShopsForDistrict("al-mursalat").map((s) => s.id);
  assert(mursalat.length === 2 && mursalat.includes("trace-al-mursalat") && mursalat.includes("espresso-culture-al-mursalat"), `Trace and Espresso Culture are the Al Mursalat page rows (Camel Step DT-lane fallback drops off), got ${mursalat.join(",")}`);
  for (const ask of ["trace cafe", "trace coffee", "تريس", "تريس كافيه"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === "trace-al-mursalat", `${ask} matches Trace first, got ${hits.join(",")}`);
  }
  for (const ask of ["trace", "track and trace", "no trace of coffee"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.includes("trace-al-mursalat"), `${ask} does not pin Trace, got ${hits.join(",")}`);
  }
}
// Batch O (16 Oct 2026): Namar — 2 local specialty cafés (Pandemic, Freedom) + 2 sit-down chains (Java Cafe; The Coffee Bean & Tea Leaf, new brand pending Amjad).
{
  const chainIds = ["java-cafe-namar", "coffee-bean-tea-leaf-namar"] as const;
  const localIds = ["pandemic-coffee-namar", "freedom-coffee-namar"] as const;
  const java = getShop("java-cafe-namar");
  assert(
    java?.isChain === true && java.chainBrand === "java" && shopBrandKey(java) === "java" && java.logoUrl === CHAIN_BRANDS.java.logo &&
      java.dineIn === true && !(java.momentTags ?? []).includes("drive-through"),
    "Java Cafe Namar is a sit-down java row (registry mark, no drive-through tag)",
  );
  const cb = getShop("coffee-bean-tea-leaf-namar");
  assert(
    cb?.isChain === true && cb.chainBrand === "coffee-bean" && shopBrandKey(cb) === "coffee-bean" &&
      cb.logoUrl === CHAIN_BRANDS["coffee-bean"].logo && existsSync(join(process.cwd(), "public/logos/coffee-bean-mark.png")) &&
      cb.dineIn === true && !(cb.momentTags ?? []).includes("drive-through"),
    "The Coffee Bean & Tea Leaf Namar is a sit-down coffee-bean row with the official mark",
  );
  for (const id of chainIds) {
    assert(listDirectoryShopsForDistrict("namar").some((shop) => shop.id === id), `${id} shows on the Namar page`);
    assert(!listDiscoveryShops().some((shop) => shop.id === id), `${id} is not specialty discovery`);
    assert(!listPopularPublicShops().some((shop) => shop.id === id), `${id} is not in Most popular`);
    assert(!filterHalfwayEligible(listDiscoveryShops()).some((shop) => shop.id === id), `${id} is not in the بيننا pool`);
    assert(!applyHideChains(listDirectoryShopsForDistrict("namar"), true).some((shop) => shop.id === id), `${id} is hidden by Local only`);
  }
  for (const id of localIds) {
    const shop = getShop(id);
    assert(shop?.isChain !== true && !shop?.chainBrand && listDiscoveryShops().some((row) => row.id === id), `${id} is local specialty`);
  }
  for (const [ask, id] of [
    ["pandemic coffee", "pandemic-coffee-namar"],
    ["بانديمك كوفي", "pandemic-coffee-namar"],
    ["بانديمك", "pandemic-coffee-namar"],
    ["freedom coffee", "freedom-coffee-namar"],
    ["فريدم كافيه", "freedom-coffee-namar"],
    ["the coffee bean & tea leaf", "coffee-bean-tea-leaf-namar"],
    ["coffee bean and tea leaf", "coffee-bean-tea-leaf-namar"],
    ["كوفي بين", "coffee-bean-tea-leaf-namar"],
    ["java namar", "java-cafe-namar"],
  ] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === id, `${ask} matches ${id} first, got ${hits.join(",")}`);
  }
  const oIds = new Set<string>([...chainIds, ...localIds]);
  for (const ask of ["bean", "tea", "leaf", "tea leaf", "coffee bean", "بين", "تي", "ليف", "ذا", "freedom", "فريدم"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.some((hit) => oIds.has(hit)), `${ask} does not pin a Batch O row, got ${hits.join(",")}`);
  }
  const javaFirst = matchCatalogShops("java", listRealShops()).map((shop) => shop.id);
  assert(javaFirst[0] !== "java-cafe-namar", `bare java keeps an older Java row first, got ${javaFirst.join(",")}`);
  assert(listDirectoryShopsForDistrict("namar").length === 6, "Namar page has 6 cafés (ON OFF + dr.CAFE + 4 Batch O)");
}
// Batch R (19 Oct 2026): Al Qadisiyah — 3 local (Tu Momento tile, heet, Rewanted) + 5 sit-down chains beside ON OFF.
{
  const chains = [
    ["peets-sheikh-jaber-al-qadisiyah", "peets", "Peet's Coffee"],
    ["half-million-al-qadisiyah", "half-million", "Half Million"],
    ["starbucks-rakaa-plaza-al-qadisiyah", "starbucks", "Starbucks Rakaa Plaza"],
    ["starbucks-tamimi-al-qadisiyah", "starbucks", "Starbucks Tamimi Markets"],
    ["tim-hortons-sheikh-jaber-al-qadisiyah", "tim-hortons", "Tim Hortons"],
  ] as const;
  const localIds = ["tu-momento-al-qadisiyah", "heet-coffee-al-qadisiyah", "rewanted-al-qadisiyah"] as const;
  const page = listDirectoryShopsForDistrict("al-qadisiyah");
  for (const [id, brand, nameEn] of chains) {
    const shop = getShop(id);
    assert(
      shop?.isChain === true && shop.chainBrand === brand && shopBrandKey(shop) === brand && shop.logoUrl === CHAIN_BRANDS[brand].logo &&
        shop.nameEn === nameEn && shop.dineIn === true && shop.catalogLane !== "drive-through" && chainIsListed(shop),
      `${id} is a listed sit-down ${brand} row on the sibling mark`,
    );
    assert(page.some((row) => row.id === id), `${id} shows on the Al Qadisiyah page`);
    assert(!listDiscoveryShops().some((row) => row.id === id), `${id} is not specialty discovery`);
    assert(!listPopularPublicShops().some((row) => row.id === id), `${id} is not in Most popular`);
    assert(!filterHalfwayEligible(listDiscoveryShops()).some((row) => row.id === id), `${id} is not in the بيننا pool`);
    assert(!applyHideChains(page, true).some((row) => row.id === id), `${id} is hidden by Local only`);
    assert((shop.momentTags ?? []).includes("drive-through") === (id === "starbucks-tamimi-al-qadisiyah"), `${id} drive-through tag is Tamimi only`);
  }
  for (const id of localIds) {
    const shop = getShop(id);
    assert(shop?.isChain !== true && !shop?.chainBrand && listDiscoveryShops().some((row) => row.id === id), `${id} is local specialty`);
  }
  assert(!getShop("tu-momento-al-qadisiyah")?.logoUrl, "Tu Momento is a letter tile");
  assert(applyHideChains(page, true).length === 4 && page.length === 9, "Al Qadisiyah page is 9 (ON OFF + 8 Batch R); Local only keeps 4");
  for (const [ask, id] of [
    ["tu momento", "tu-momento-al-qadisiyah"], ["تو مومنتو كافيه", "tu-momento-al-qadisiyah"], ["momento", "tu-momento-al-qadisiyah"],
    ["heet coffee", "heet-coffee-al-qadisiyah"], ["هيت", "heet-coffee-al-qadisiyah"],
    ["rewanted", "rewanted-al-qadisiyah"], ["ري ونتد", "rewanted-al-qadisiyah"],
    ["starbucks rakaa", "starbucks-rakaa-plaza-al-qadisiyah"], ["ستاربكس ركاء بلازا", "starbucks-rakaa-plaza-al-qadisiyah"],
    ["starbucks tamimi", "starbucks-tamimi-al-qadisiyah"], ["ستاربكس التميمي", "starbucks-tamimi-al-qadisiyah"],
  ] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === id, `${ask} matches ${id} first, got ${hits.join(",")}`);
  }
  const rIds = new Set<string>([...localIds, ...chains.map(([id]) => id)]);
  for (const ask of ["tu", "تو", "ري", "cafe", "كافيه", "plaza", "بلازا", "markets", "tamimi", "التميمي"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.some((hit) => rIds.has(hit)), `${ask} does not pin a Batch R row, got ${hits.join(",")}`);
  }
  assert(matchCatalogShops("ري", listRealShops())[0]?.id === "re-matcha-al-hamra", "bare «ري» keeps Re Matcha");
  for (const [ask, first] of [["peets", "peets-euromarche-al-mathar"], ["half million", "half-million-shubra"], ["tim hortons", "tim-hortons-shubra"], ["starbucks", "starbucks-tala-mall-an-nafal"]] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === first, `bare ${ask} keeps the older row first, got ${hits.join(",")}`);
  }
}
// Batch S (20 Oct 2026): As Salam — 6 local specialty beside THE HAT; A PLUS (drive-through lane) unchanged.
{
  // 21 Oct 2026: Namq As Salam is now a namq chain branch (asserted in the 21 Oct block below).
  const ids = ["smpl-as-salam", "bud-art-cafe-as-salam", "heddah-roaster-as-salam", "sakaf-as-salam", "breehant-as-salam"] as const;
  for (const id of ids) {
    const shop = getShop(id);
    assert(shop?.isChain !== true && !shop?.chainBrand && listDiscoveryShops().some((row) => row.id === id), `${id} is local specialty`);
  }
  assert(!getShop("smpl-as-salam")?.logoUrl && !getShop("bud-art-cafe-as-salam")?.logoUrl, "Smpl and Bu'd Art are letter tiles");
  assert(getShop("namq-as-salam")?.logoUrl === getShop("namq-al-malqa")?.logoUrl, "Namq As Salam reuses the Al Malqa mark");
  assert(getShop("breehant-as-salam")?.logoUrl === getShop("breehant-al-yasmin")?.logoUrl, "Breehant As Salam reuses the Al Yasmin mark");
  assert(shopBrandKey(getShop("namq-as-salam")!) === "namq" && shopBrandKey(getShop("namq-al-malqa")!) === "namq", "Namq branches share a brand key");
  assert(shopBrandKey(getShop("breehant-as-salam")!) === "breehant", "Breehant As Salam shares the breehant key");
  assert(getShop("a-plus-as-salam")?.catalogLane === "drive-through", "A PLUS As Salam stays on the drive-through lane");
  assert(listDriveThroughDirectoryShops().some((shop) => shop.id === "a-plus-as-salam"), "A PLUS stays on the drive-through directory");
  const page = listDirectoryShopsForDistrict("as-salam").map((shop) => shop.id);
  assert(page.length === 8 && page.includes("the-hat-as-salam") && page.includes("maqha-mahamasa-al-raqban") && !page.includes("a-plus-as-salam"), `As Salam page is THE HAT + 6 Batch S + Cafe & Roastery from Al Raqban (A PLUS steps back), got ${page.join(",")}`);
  for (const [ask, id] of [
    ["namq salam", "namq-as-salam"], ["نمق السلام", "namq-as-salam"],
    ["smpl", "smpl-as-salam"], ["سمبل", "smpl-as-salam"],
    ["bud art", "bud-art-cafe-as-salam"], ["بعد آرت كافيه", "bud-art-cafe-as-salam"],
    ["heddah roaster", "heddah-roaster-as-salam"], ["محمصة حدة", "heddah-roaster-as-salam"],
    ["sakaf", "sakaf-as-salam"], ["سكف", "sakaf-as-salam"],
    ["breehant salam", "breehant-as-salam"], ["بريهانت السلام", "breehant-as-salam"],
    ["the hat", "the-hat-as-salam"], ["ذا هات", "the-hat-as-salam"],
  ] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === id, `${ask} matches ${id} first, got ${hits.join(",")}`);
  }
  const sIds = new Set<string>(ids);
  for (const ask of ["bud", "بعد", "art", "آرت", "art cafe", "آرت كافيه", "حدة", "حِدّة", "roaster", "محمصة", "cafe", "كافيه", "قهوة بعد العشا"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.some((hit) => sIds.has(hit)), `${ask} does not pin a Batch S row, got ${hits.join(",")}`);
  }
  for (const [ask, first] of [["namq", "namq-al-malqa"], ["نمق", "namq-al-malqa"], ["breehant", "breehant-olaya"], ["بريهانت", "breehant-olaya"], ["art", "roasting-art-al-masif"]] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === first, `bare ${ask} keeps the older row first, got ${hits.join(",")}`);
  }
}
// Batch SD1 (21 Oct 2026): Al Shohda (الشهداء) — 7 local specialty (Cobee and Tahn letter tiles; BeFine / Arco reuse
// their sibling marks; Black Wolf roastery) + 7 sit-down chain branches (Granada Mall cluster + dr.CAFE Ash Shuhada) beside Camel Step.
{
  const chains = [
    ["drcafe-ash-shuhada-al-shohda", "dr-cafe", "dr.CAFE Ash Shuhada"],
    ["drcafe-granada-mall-al-shohda", "dr-cafe", "dr.CAFE Granada Mall"],
    ["peets-granada-mall-al-shohda", "peets", "Peet's Coffee"],
    ["starbucks-granada-mall-al-shohda", "starbucks", "Starbucks"],
    ["half-million-al-shohda", "half-million", "Half Million"],
    ["tim-hortons-granada-mall-al-shohda", "tim-hortons", "Tim Hortons"],
    ["caribou-granada-mall-al-shohda", "caribou", "Caribou Coffee"],
  ] as const;
  const localIds = [
    "andarena-cafe-al-shohda", "befine-coffee-al-shohda", "cobee-cafe-al-shohda", "arco-al-shohda",
    "tahn-al-shohda", "black-wolf-al-shohda", "illy-cafe-granada-mall-al-shohda",
  ] as const;
  const page = listDirectoryShopsForDistrict("al-shohda");
  for (const [id, brand, nameEn] of chains) {
    const shop = getShop(id);
    const mark = brand === "caribou" ? "/logos/caribou-coffee-diplomatic-quarter.png" : CHAIN_BRANDS[brand].logo;
    assert(
      shop?.isChain === true && shop.chainBrand === brand && shopBrandKey(shop) === brand && shop.logoUrl === mark &&
        shop.nameEn === nameEn && shop.dineIn === true && shop.catalogLane !== "drive-through" && chainIsListed(shop) &&
        !(shop.momentTags ?? []).includes("drive-through"),
      `${id} is a listed sit-down ${brand} row on the sibling mark`,
    );
    assert(page.some((row) => row.id === id), `${id} shows on the Al Shohda page`);
    assert(!listDiscoveryShops().some((row) => row.id === id), `${id} is not specialty discovery`);
    assert(!listPopularPublicShops().some((row) => row.id === id), `${id} is not in Most popular`);
    assert(!filterHalfwayEligible(listDiscoveryShops()).some((row) => row.id === id), `${id} is not in the بيننا pool`);
    assert(!applyHideChains(page, true).some((row) => row.id === id), `${id} is hidden by Local only`);
  }
  for (const id of localIds) {
    const shop = getShop(id);
    assert(shop?.isChain !== true && !shop?.chainBrand && listDiscoveryShops().some((row) => row.id === id), `${id} is local specialty`);
    assert(page.some((row) => row.id === id) && applyHideChains(page, true).some((row) => row.id === id), `${id} stays on the Al Shohda page with Local only`);
  }
  assert(!getShop("cobee-cafe-al-shohda")?.logoUrl && !getShop("tahn-al-shohda")?.logoUrl, "Cobee and Tahn are letter tiles");
  assert(getShop("befine-coffee-al-shohda")?.logoUrl === getShop("befine-coffee-al-masif")?.logoUrl, "BeFine Al Shohda reuses the Al Masif mark");
  assert(getShop("arco-al-shohda")?.logoUrl === getShop("arco-al-rabi")?.logoUrl, "Arco Al Shohda reuses the Al Rabi mark");
  for (const id of ["andarena-cafe-al-shohda", "black-wolf-al-shohda", "illy-cafe-granada-mall-al-shohda"] as const) {
    assert(getShop(id)?.logoUrl === `/logos/${id}.png` && existsSync(join(process.cwd(), `public/logos/${id}.png`)), `${id} ships its own mark`);
  }
  assert((getShop("black-wolf-al-shohda")?.momentTags ?? []).includes("roaster") && listBestCoffeeShops().some((s) => s.id === "black-wolf-al-shohda"), "Black Wolf (محمصة ومقهى) is a roaster");
  assert(shopBrandKey(getShop("befine-coffee-al-shohda")!) === "befine" && shopBrandKey(getShop("arco-al-shohda")!) === "arco", "BeFine / Arco share their sibling brand keys");
  assert(shopBrandKey(getShop("black-wolf-al-shohda")!) === "black-wolf" && shopBrandKey(getShop("black-stamp-al-masif")!) === "black", "Black Wolf never folds into Black Stamp");
  assert(page.length === 21 && applyHideChains(page, true).length === 14 && page.some((row) => row.id === "camel-step-granada-business"), `Al Shohda page is 21 (Camel Step + 14 Batch SD1 + 6 re-tagged from Ghirnatah, 21 Oct); Local only keeps 14, got ${page.length}`);
  for (const [ask, id] of [
    ["andarena", "andarena-cafe-al-shohda"], ["مقهى اندرينا", "andarena-cafe-al-shohda"],
    ["befine shohda", "befine-coffee-al-shohda"], ["بي فاين الشهداء", "befine-coffee-al-shohda"],
    ["cobee", "cobee-cafe-al-shohda"], ["كوبي كافيه", "cobee-cafe-al-shohda"],
    ["arco shohda", "arco-al-shohda"], ["اركو الشهداء", "arco-al-shohda"],
    ["tahn", "tahn-al-shohda"], ["طحن قهوة مختصة", "tahn-al-shohda"],
    ["black wolf", "black-wolf-al-shohda"], ["بلاك وولف", "black-wolf-al-shohda"],
    ["illy", "illy-cafe-granada-mall-al-shohda"], ["ايلي كافيه", "illy-cafe-granada-mall-al-shohda"],
    ["dr cafe shuhada", "drcafe-ash-shuhada-al-shohda"], ["د.كيف الشهداء", "drcafe-ash-shuhada-al-shohda"],
    ["dr cafe granada", "drcafe-granada-mall-al-shohda"], ["د.كيف غرناطة", "drcafe-granada-mall-al-shohda"],
    ["peets granada", "peets-granada-mall-al-shohda"], ["starbucks granada", "starbucks-granada-mall-al-shohda"], ["ستاربكس غرناطة", "starbucks-granada-mall-al-shohda"],
    ["half million shohda", "half-million-al-shohda"], ["tim hortons granada", "tim-hortons-granada-mall-al-shohda"], ["caribou granada", "caribou-granada-mall-al-shohda"],
  ] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === id, `${ask} matches ${id} first, got ${hits.join(",")}`);
  }
  const sdIds = new Set<string>([...localIds, ...chains.map(([id]) => id)]);
  for (const ask of ["طحن", "كوبي", "black", "wolf", "بلاك", "mall", "مول", "granada", "غرناطة", "granada mall", "غرناطة مول", "cafe", "كافيه", "مقهى", "coffee"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.some((hit) => sdIds.has(hit)), `${ask} does not pin a Batch SD1 row, got ${hits.join(",")}`);
  }
  for (const [ask, first] of [["befine", "befine-coffee-al-masif"], ["arco", "arco-al-rabi"], ["black", "black-stamp-al-masif"], ["peets", "peets-euromarche-al-mathar"], ["half million", "half-million-shubra"], ["tim hortons", "tim-hortons-shubra"], ["starbucks", "starbucks-tala-mall-an-nafal"], ["caribou", "caribou-coffee-diplomatic-quarter"]] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === first, `bare ${ask} keeps the older row first, got ${hits.join(",")}`);
  }
}
// 21 Oct 2026 (Amjad via Ajz): Namq is a chain (10 Riyadh branches on its own Linktree); Al Raqban folds into As Salam;
// the six Ghirnatah rows inside the Al Shohda polygon move to al-shohda. Café ids and URLs are unchanged.
{
  for (const [id, district] of [["namq-al-malqa", "al-malqa"], ["namq-as-salam", "as-salam"]] as const) {
    const shop = getShop(id);
    assert(
      shop?.isChain === true && shop.chainBrand === "namq" && shopBrandKey(shop) === "namq" && shop.logoUrl === CHAIN_BRANDS.namq.logo &&
        shop.catalogLane !== "drive-through" && chainIsListed(shop),
      `${id} is a listed sit-down namq chain row on the Namq mark`,
    );
    const page = listDirectoryShopsForDistrict(district);
    assert(page.some((row) => row.id === id), `${id} stays on the ${district} page`);
    assert(!applyHideChains(page, true).some((row) => row.id === id), `${id} is hidden by Local only`);
    assert(!listDiscoveryShops().some((row) => row.id === id), `${id} is not specialty discovery`);
    assert(!listPopularPublicShops().some((row) => row.id === id), `${id} is not in Most popular`);
    assert(!filterHalfwayEligible(listDiscoveryShops()).some((row) => row.id === id), `${id} is not in the بيننا pool`);
  }
  for (const [ask, id] of [["namq", "namq-al-malqa"], ["نمق", "namq-al-malqa"], ["namq salam", "namq-as-salam"], ["نمق السلام", "namq-as-salam"], ["بلاك ولف", "black-wolf-al-shohda"]] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === id, `${ask} matches ${id} first, got ${hits.join(",")}`);
  }
  const raqban = getShop("maqha-mahamasa-al-raqban");
  assert(raqban?.neighborhood === "as-salam" && raqban.neighborhoodAr === "السلام" && raqban.isChain !== true, "Cafe & Roastery (Al Raqban street) lists under As Salam as local specialty");
  const salam = listDirectoryShopsForDistrict("as-salam");
  assert(salam.length === 8 && applyHideChains(salam, true).length === 7, `As Salam page is 8; Local only keeps 7 (Namq hidden), got ${salam.length}`);
  assert(!listRealShops().some((shop) => (shop.neighborhood as string) === "al-raqban"), "no row is tagged al-raqban");
  const moved = ["specialty-bean-ghirnatah", "mkth-ghirnatah", "bind-specialty-coffee-ghirnatah", "jae-specialty-coffee-ghirnatah", "semi-specialty-cafe-ghirnatah", "archi-ghirnatah"] as const;
  for (const id of moved) {
    const shop = getShop(id);
    assert(shop?.neighborhood === "al-shohda" && shop.neighborhoodAr === "الشهداء", `${id} is re-tagged to al-shohda`);
  }
  const ghirnatah = listDirectoryShopsForDistrict("ghirnatah").map((shop) => shop.id);
  assert(
    ghirnatah.join(",") === ["file-coffee-ghirnatah", "sanva-specialty-coffee-ghirnatah", "moff-ghirnatah", "quokka-coffee-ghirnatah"].sort().join(",") ||
      ghirnatah.slice().sort().join(",") === ["file-coffee-ghirnatah", "moff-ghirnatah", "quokka-coffee-ghirnatah", "sanva-specialty-coffee-ghirnatah"].join(","),
    `Ghirnatah keeps the 4 east-Ghirnatah rows, got ${ghirnatah.join(",")}`,
  );
}
// TRENDVERIFY-1023PM (23 Oct 2026): OPULENT / أوبلنت, Qurtubah — local bakery-café that passes the bakery rule
// (Google primaryType coffee_shop; coffee bar + seating in Places frame 2). Sit-down, letter tile, 2 Scout frames.
{
  const opulent = getShop("opulent-qurtubah");
  const page = listDirectoryShopsForDistrict("qurtubah");
  assert(
    opulent?.isChain !== true && !opulent?.chainBrand && opulent?.nameEn === "OPULENT" && opulent.nameAr === "أوبلنت" &&
      opulent.neighborhood === "qurtubah" && opulent.dineIn === true && opulent.logoUrl === "/logos/opulent-qurtubah.png" && existsSync(join(process.cwd(), "public/logos/opulent-qurtubah.png")) &&
      opulent.catalogLane !== "drive-through" && !opulent.momentTags.includes("drive-through") && !opulent.momentTags.includes("roaster"),
    "OPULENT Qurtubah is a local sit-down café with its official TikTok mark (logo sweep 25 Oct)",
  );
  assert(listDiscoveryShops().some((row) => row.id === opulent.id), "OPULENT is specialty discovery");
  assert(page.some((row) => row.id === opulent.id) && applyHideChains(page, true).some((row) => row.id === opulent.id), "OPULENT shows on the Qurtubah page with Local only");
  for (const ask of ["opulent", "OPULENT", "أوبلنت", "اوبلنت", "opulent bakery", "اوبلنت بيكري كوفي"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === "opulent-qurtubah", `${ask} matches opulent-qurtubah first, got ${hits.join(",")}`);
  }
  for (const ask of ["bakery", "bakery cafe", "bakery coffee", "بيكري", "مخبز", "coffee", "cafe", "كافيه", "قهوة", "french toast", "qurtubah", "قرطبة"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.includes("opulent-qurtubah"), `${ask} does not pin OPULENT, got ${hits.join(",")}`);
  }
}
// NG1 An Nasim Al Gharbi (29 Oct 2026): 10 local specialty cafés from Scout's daily hunt (no chain, no drive-through, no shisha). Scout's Places frames, 0 Dev Places calls.
// Places dineIn is true for 8 (Beek Cup and Malath Delicious: Places empty, Scout seatingVerdict). Coffee Address (specialty per the policy carve-out) reuses the catalog mark;
// SAVA Cafe and Malath Delicious carry their TikTok marks; Noura, Asal, Thimar Al Wusool, effect, NQT, Madawi and Beek Cup are letter tiles.
{
  const ng1Ids = ["coffee-address-al-naseem-gharbi", "noura-specialty-coffee-al-naseem-gharbi", "sava-al-naseem-gharbi", "asal-specialty-coffee-al-naseem-gharbi", "thimar-al-wusool-al-naseem-gharbi", "effect-al-naseem-gharbi", "nqt-al-naseem-gharbi", "madawi-coffee-al-naseem-gharbi", "beek-cup-al-naseem-gharbi", "malath-delicious-al-naseem-gharbi"] as const;
  const ng1 = ng1Ids.map((id) => getShop(id));
  assert(ng1.every((row) => row && row.isChain !== true && !row.chainBrand && row.neighborhood === "an-nasim-al-gharbi" && row.neighborhoodAr === "النسيم الغربي" && row.dineIn === true && row.catalogLane !== "drive-through" && !row.momentTags.includes("drive-through")), "NG1: 10 local sit-down An Nasim Al Gharbi cafés, no chain, no drive-through");
  const tiles = ["noura-specialty-coffee-al-naseem-gharbi", "asal-specialty-coffee-al-naseem-gharbi", "thimar-al-wusool-al-naseem-gharbi", "effect-al-naseem-gharbi", "nqt-al-naseem-gharbi", "madawi-coffee-al-naseem-gharbi", "beek-cup-al-naseem-gharbi"];
  assert(ng1.every((row) => (tiles.includes(row!.id) ? !row!.logoUrl : !!row!.logoUrl)), "NG1: 7 letter tiles; Coffee Address, SAVA Cafe and Malath Delicious carry a logo");
  assert(getShop("coffee-address-al-naseem-gharbi")?.logoUrl === getShop("coffee-address-ash-shifa")?.logoUrl, "Coffee Address An Nasim Al Gharbi reuses the catalog Coffee Address mark");
  for (const id of ["sava-al-naseem-gharbi", "malath-delicious-al-naseem-gharbi"]) {
    assert(getShop(id)?.logoUrl === `/logos/${id}.jpg` && existsSync(join(process.cwd(), "public", "logos", `${id}.jpg`)), `${id} ships its TikTok mark`);
  }
  assert(ng1.every((row) => !row!.momentTags.includes("roaster")), "no NG1 café carries the roaster tag (best coffee stays 71)");
  assert(ng1.filter((row) => row!.outdoorSeating === true).map((row) => row!.id).join(",") === "coffee-address-al-naseem-gharbi,sava-al-naseem-gharbi", "outdoor seating on Coffee Address and SAVA Cafe (Places)");
  assert(getShop("nqt-al-naseem-gharbi")?.outdoorSeating === false, "NQT: Places outdoorSeating false");
  for (const id of ["beek-cup-al-naseem-gharbi", "malath-delicious-al-naseem-gharbi"]) {
    const row = getShop(id);
    assert(row?.seatingVerdict?.dineIn === true && row.seatingVerdict.source === "scout" && row.seatingVerdict.date === "2026-10-29" && row.pickupOnly == null, `${id}: Places dineIn is empty, Scout seatingVerdict (dine-in, not pickup-only) from photos and reviews`);
  }
  for (const id of ["coffee-address-al-naseem-gharbi", "beek-cup-al-naseem-gharbi"]) {
    const hours = getShop(id)!.openingHours;
    const periods = hours?.periods ?? [];
    const lines = hours?.weekdayDescriptions ?? [];
    assert(lines.length === 7 && lines.every((l) => l.endsWith("Open 24 hours")) && periods.length === 1 && periods[0]!.open.day === 0 && periods[0]!.open.hour === 0 && !periods[0]!.close, `${id} ships Places "Open 24 hours" as the 24-hour period`);
  }
  {
    // Madawi: 24 hours Saturday to Thursday, Friday 4 PM – 12 AM: one period from Friday 4 PM to the next Friday 00:00.
    const periods = getShop("madawi-coffee-al-naseem-gharbi")!.openingHours?.periods ?? [];
    assert(periods.length === 1 && periods[0]!.open.day === 5 && periods[0]!.open.hour === 16 && periods[0]!.close?.day === 5 && periods[0]!.close.hour === 0, "Madawi ships 24 hours Sat–Thu and Friday 4 PM – 12 AM as one period");
  }
  assert((getShop("nqt-al-naseem-gharbi")!.openingHours?.weekdayDescriptions ?? [])[0]?.replace(/[\u202f\u2009]/g, " ") === "Monday: 6:00 AM – 1:00 AM", "NQT ships the Google (Places) hours, not Snapchat's");
  assert(ng1.every((row) => (row!.openingHours?.periods ?? []).length > 0), "every NG1 café ships Places hours");
  const page = listDirectoryShopsForDistrict("an-nasim-al-gharbi");
  assert(page.length === 13, `An Nasim Al Gharbi page has 13 cafés (Trivali, Gusn, BE SUCH + 10 NG1), got ${page.length}`);
  assert([...page.map((shop) => shop.id)].sort().join(",") === ["trivali-roaster-al-naseem-gharbi", "gusn-coffee-al-naseem-gharbi", "be-such-al-naseem-gharbi", ...ng1Ids].sort().join(","), "An Nasim Al Gharbi lists Trivali, Gusn, BE SUCH and the 10 NG1 cafés");
  const localPage = applyHideChains(page, true);
  for (const row of ng1) {
    assert(listDiscoveryShops().some((r) => r.id === row!.id), `${row!.id} is specialty discovery`);
    assert(page.some((r) => r.id === row!.id) && localPage.some((r) => r.id === row!.id), `${row!.id} shows on the An Nasim Al Gharbi page with Local only`);
  }
  assert(listDriveThroughDirectoryShops().filter((shop) => shop.neighborhood === "an-nasim-al-gharbi").map((shop) => shop.id).sort().join(",") === "drcafe-an-nasim-al-gharbi,drive-an-nasim-al-gharbi", "An Nasim Al Gharbi drive-through directory keeps Drive and dr.CAFE only");
  for (const [id, asks] of [
    ["coffee-address-al-naseem-gharbi", ["Coffee Address An Nasim Al Gharbi", "coffee address naseem", "coffee address al naseem", "Coffee Address Al Naseem Gharbi", "coffee address naseem west", "عنوان القهوة النسيم", "عنوان القهوة النسيم الغربي", "coffee address abdallah ibn massoud"]],
    ["noura-specialty-coffee-al-naseem-gharbi", ["Noura Specialty Coffee", "noura coffee", "noura cafe", "كافية نوره للقهوة المختصة", "كافيه نوره", "قهوة نورة", "نورة للقهوة المختصة"]],
    ["sava-al-naseem-gharbi", ["SAVA Cafe", "sava", "sava cafe", "سافا كافيه", "سافا", "قهوة سافا"]],
    ["asal-specialty-coffee-al-naseem-gharbi", ["Asal Specialty Coffee", "asal cafe", "asal specialty", "اصال قهوة مختصة", "اصال", "قهوة اصال"]],
    ["thimar-al-wusool-al-naseem-gharbi", ["Thimar Al Wusool Coffee", "thimar al wusool", "كوفي ثمار الوصول", "ثمار الوصول", "قهوة ثمار الوصول"]],
    ["effect-al-naseem-gharbi", ["effect cafe", "Effect Café", "إفكت", "افكت", "قهوة افكت", "effect naseem"]],
    ["nqt-al-naseem-gharbi", ["NQT Specialty Coffee", "nqt", "NQT", "نقط قهوة مختصة", "قهوة نقط", "nqt coffee"]],
    ["madawi-coffee-al-naseem-gharbi", ["Madawi Coffee", "madawi cafe", "كوفي مضاوي", "قهوة مضاوي", "مضاوي كافيه"]],
    ["beek-cup-al-naseem-gharbi", ["Beek Cup", "beek cup", "بيك كوب", "pick cup cafe"]],
    ["malath-delicious-al-naseem-gharbi", ["Malath Delicious", "malath cafe", "ملاذ ديليشيز", "قهوة ملاذ", "malathdelicious"]],
  ] as const) {
    for (const ask of asks) {
      const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
      assert(hits[0] === id, `${ask} matches ${id} first, got ${hits.join(",")}`);
    }
  }
  // Coffee Address: bare asks keep the existing branches first; the new branch ties with the same-named branches and sorts after all of them (catalog order).
  for (const [ask, field] of [["Coffee Address", "nameEn"], ["coffee address", "nameEn"], ["عنوان القهوة", "nameAr"]] as const) {
    const hits = matchCatalogShops(ask, listRealShops());
    const at = hits.findIndex((shop) => shop.id === "coffee-address-al-naseem-gharbi");
    const sameName = hits.filter((shop) => shop.id !== "coffee-address-al-naseem-gharbi" && shop.id.startsWith("coffee-address-") && shop[field] === getShop("coffee-address-al-naseem-gharbi")![field]);
    assert(at > 0 && sameName.length >= 10 && sameName.every((shop) => hits.indexOf(shop) < at), `bare ${ask} keeps every same-named Coffee Address branch ahead of the An Nasim Al Gharbi branch, got ${hits.map((shop) => shop.id).join(",")}`);
  }
  assert(matchCatalogShops("Coffee Address", listRealShops())[0]?.id === "coffee-address-al-hamra", "bare Coffee Address still leads with the first existing branch");
  assert(matchCatalogShops("عنوان القهوة", listRealShops())[0]?.id === "coffee-address-al-yarmouk", "bare «عنوان القهوة» still leads with the same existing branch as main");
  // Single words of the new names are everyday words or given names and never pin an NG1 café on ordinary phrases.
  for (const ask of ["effect", "the effect of coffee", "what effect coffee has on sleep", "side effect", "caffeine effect", "تأثير القهوة", "noura", "نورة", "نوره", "coffee with noura", "نورة تبي قهوة", "قهوة مع نورة", "asal", "عسل", "قهوة بالعسل", "honey coffee", "asal latte", "لاتيه عسل", "thimar", "ثمار", "وصول", "ثمار طازجة", "وقت الوصول", "قهوة قبل الوصول", "madawi", "مضاوي", "قهوة لمضاوي", "malath", "ملاذ", "ملاذ هادي", "مكان ملاذ للمذاكرة", "delicious", "delicious coffee", "something delicious", "قهوة لذيذة", "ديليشيز", "beek", "cup", "a cup of coffee", "cup of coffee", "coffee cup", "best cup in riyadh", "كوب", "كوب قهوة", "كوب كبير", "بيك", "specialty", "specialty coffee", "specialty coffee An Nasim Al Gharbi", "قهوة مختصة", "قهوة مختصة النسيم", "coffee in An Nasim Al Gharbi", "قهوة بالنسيم الغربي", "النسيم الغربي", "An Nasim Al Gharbi", "address", "عنوان", "your address", "what is the address", "عنوان المقهى", "وش العنوان", "نقط", "نقاط", "اجمع نقط", "نقط الولاء", "points", "cafe", "coffee", "كافيه", "قهوة", "roaster", "drip", "v60", "ايس دريب", "quiet cafe to study", "مكان هادي للمذاكرة", "asal coffee", "effect coffee", "specialty cafe", "cozy cafe", "desserts", "حلويات", "chocolate", "شوكولاتة", "match screenings", "playstation", "بلايستيشن", "مباريات", "24 hours", "مفتوح 24 ساعة", "open late", "drive through", "طلبات السيارة", "family section", "قسم العوائل"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.some((id) => (ng1Ids as readonly string[]).includes(id)), `${ask} does not pin an NG1 café, got ${hits.join(",")}`);
  }
}
// AJ add (16 Oct 2026): Found / فاوند, Ar Rabwah — local specialty, letter tile; Places dineIn null → Scout seatingVerdict.
{
  const found = getShop("found-ar-rabwah");
  assert(found && found.isChain !== true && !found.chainBrand && !found.logoUrl && listDiscoveryShops().some((s) => s.id === "found-ar-rabwah"), "Found Ar Rabwah is local specialty with a letter tile");
  assert(found?.seatingVerdict?.source === "scout" && found.dineIn === true, "Found has a Scout seatingVerdict (Places dineIn was null)");
  assert(listDirectoryShopsForDistrict("al-rabwah").some((s) => s.id === "found-ar-rabwah"), "Found shows on the Ar Rabwah page");
  for (const ask of ["found cafe", "فاوند", "فاوند كافيه"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === "found-ar-rabwah", `${ask} matches Found first, got ${hits.join(",")}`);
  }
  for (const ask of ["found", "i found a cafe", "lost and found"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.includes("found-ar-rabwah"), `${ask} does not pin Found, got ${hits.join(",")}`);
  }
}
// Batch P (17 Oct 2026): Tuwaiq — 14 local specialty cafés (no chains). Ratio, Gedeb and Era keep their sibling brand marks and stay non-chain.
{
  const ids = [
    "irlo-tuwaiq", "ratio-speciality-tuwaiq", "quba-tuwaiq", "oldlane-tuwaiq", "gedeb-tuwaiq", "breath-tuwaiq", "lihaf-tuwaiq",
    "saaf-tuwaiq", "inverno-tuwaiq", "era-coffee-tuwaiq", "haqwa-tuwaiq", "taghrid-tuwaiq", "nv-coffee-tuwaiq", "shathb-tuwaiq",
  ] as const;
  const tiles = new Set<string>(["saaf-tuwaiq", "taghrid-tuwaiq", "nv-coffee-tuwaiq", "shathb-tuwaiq"]);
  const siblingLogo: Record<string, string> = {
    "ratio-speciality-tuwaiq": "/logos/ratio-speciality-al-yarmouk.png",
    "gedeb-tuwaiq": "/logos/gedeb-al-olaya.jpg",
    "era-coffee-tuwaiq": "/logos/era-coffee-as-suwaidi.png",
  };
  for (const id of ids) {
    const shop = getShop(id);
    assert(shop?.isChain !== true && !shop?.chainBrand && listDiscoveryShops().some((row) => row.id === id), `${id} is local specialty`);
    assert(shop?.dineIn === true && shop.neighborhood === "tuwaiq", `${id} is a sit-down Tuwaiq row`);
    assert(listDirectoryShopsForDistrict("tuwaiq").some((row) => row.id === id), `${id} shows on the Tuwaiq page`);
    if (tiles.has(id)) assert(!shop?.logoUrl, `${id} is a letter tile`);
    else if (siblingLogo[id]) assert(shop?.logoUrl === siblingLogo[id], `${id} reuses its sibling brand mark`);
    else assert(shop?.logoUrl === `/logos/${id}.png` && existsSync(join(process.cwd(), `public/logos/${id}.png`)), `${id} has its own mark (TikTok, or Lihaf's Maps-linked site wordmark in r2)`);
  }
  for (const [ask, id] of [
    ["irlo", "irlo-tuwaiq"],
    ["أرلو", "irlo-tuwaiq"],
    ["quba", "quba-tuwaiq"],
    ["qoba", "quba-tuwaiq"],
    ["قوبا", "quba-tuwaiq"],
    ["old lane", "oldlane-tuwaiq"],
    ["أولد لين", "oldlane-tuwaiq"],
    ["breath coffee", "breath-tuwaiq"],
    ["بريث كافيه", "breath-tuwaiq"],
    ["lihaf coffee", "lihaf-tuwaiq"],
    ["لحاف قهوة مختصة", "lihaf-tuwaiq"],
    ["saaf cafe", "saaf-tuwaiq"],
    ["saaf", "saaf-tuwaiq"],
    ["سعف", "saaf-tuwaiq"],
    ["بريث", "breath-tuwaiq"],
    ["مقهى سعف", "saaf-tuwaiq"],
    ["inverno", "inverno-tuwaiq"],
    ["era tuwaiq", "era-coffee-tuwaiq"],
    ["قهوة إرا", "era-coffee-tuwaiq"],
    ["ratio tuwaiq", "ratio-speciality-tuwaiq"],
    ["haqwa", "haqwa-tuwaiq"],
    ["هقوة", "haqwa-tuwaiq"],
    ["taghrid cafe", "taghrid-tuwaiq"],
    ["تغاريد كافيه", "taghrid-tuwaiq"],
    ["nv coffee", "nv-coffee-tuwaiq"],
    ["ان في كافية", "nv-coffee-tuwaiq"],
    ["shathb", "shathb-tuwaiq"],
    ["شذب", "shathb-tuwaiq"],
  ] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === id, `${ask} matches ${id} first, got ${hits.join(",")}`);
  }
  const pIds = new Set<string>(ids);
  for (const ask of ["breath", "era", "إرا", "ratio", "ريشيو", "lihaf", "لحاف", "taghrid", "تغاريد", "ان في", "ابي قهوة ان في جلسات", "old", "lane", "i need a breath of fresh air"]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.some((hit) => pIds.has(hit)), `${ask} does not pin a Batch P row, got ${hits.join(",")}`);
  }
  for (const [ask, first] of [["ratio", "ratio-speciality-al-yarmouk"], ["era", "era-coffee-as-suwaidi"], ["gedeb", "gedeb-al-olaya"]] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === first, `bare ${ask} keeps the older ${first} first, got ${hits.join(",")}`);
  }
  assert(listDirectoryShopsForDistrict("tuwaiq").length === 16, "Tuwaiq page has 16 cafés (Drip + dr.CAFE + 14 Batch P)");
}
// Batch Q (18 Oct 2026): Ash Shifa — 9 local specialty cafés + 3 sit-down chains (Java Cafe, 2 Half Million). Yamm and Coffee Address reuse their sibling marks and stay non-chain (Coffee Address is specialty per Amjad, 2 Oct).
{
  const localIds = [
    "yamm-ash-shifa", "coffee-address-ash-shifa", "folk-coffee-ash-shifa", "light-dose-ash-shifa", "third-place-ash-shifa",
    "butterfly-cafe-ash-shifa", "rwy-ash-shifa", "icon-ash-shifa", "linor-ash-shifa",
  ] as const;
  const chainIds = ["java-cafe-ash-shifa", "half-million-ibn-taymiyyah-ash-shifa", "half-million-tirmidhi-ash-shifa"] as const;
  const tiles = new Set<string>(["folk-coffee-ash-shifa", "light-dose-ash-shifa", "rwy-ash-shifa", "icon-ash-shifa", "linor-ash-shifa"]);
  const siblingLogo: Record<string, string> = {
    "yamm-ash-shifa": "/logos/yamm-olaya.jpg",
    "coffee-address-ash-shifa": "/logos/coffee-address-mark.png",
  };
  for (const id of localIds) {
    const shop = getShop(id);
    assert(shop?.isChain !== true && !shop?.chainBrand && listDiscoveryShops().some((row) => row.id === id), `${id} is local specialty`);
    assert(shop?.dineIn === true && shop.neighborhood === "ash-shifa", `${id} is a sit-down Ash Shifa row`);
    assert(listDirectoryShopsForDistrict("ash-shifa").some((row) => row.id === id), `${id} shows on the Ash Shifa page`);
    if (tiles.has(id)) assert(!shop?.logoUrl, `${id} is a letter tile`);
    else if (siblingLogo[id]) assert(shop?.logoUrl === siblingLogo[id], `${id} reuses its sibling brand mark`);
    else assert(shop?.logoUrl === `/logos/${id}.png` && existsSync(join(process.cwd(), `public/logos/${id}.png`)), `${id} has its TikTok mark`);
  }
  const linor = getShop("linor-ash-shifa");
  assert(linor?.nameEn === "Linor Coffee" && linor?.seatingVerdict?.source === "scout" && linor.dineIn === true, "Linor Coffee (r2 rename from Lenore) has a Scout seatingVerdict (Places dineIn was null)");
  assert(getShop("icon-ash-shifa")?.nameEn === "Ayquna Cafe", "Icon EN name is Ayquna Cafe (r2)");
  for (const id of chainIds) {
    const shop = getShop(id);
    const brand = id.startsWith("java") ? "java" : "half-million";
    assert(
      shop?.isChain === true && shop.chainBrand === brand && shopBrandKey(shop) === brand && shop.logoUrl === CHAIN_BRANDS[brand].logo &&
        shop.dineIn === true && !(shop.momentTags ?? []).includes("drive-through") && shop.catalogLane !== "drive-through",
      `${id} is a sit-down ${brand} row (registry mark, no drive-through tag)`,
    );
    assert(listDirectoryShopsForDistrict("ash-shifa").some((row) => row.id === id), `${id} shows on the Ash Shifa page`);
    assert(!listDiscoveryShops().some((row) => row.id === id), `${id} is not specialty discovery`);
    assert(!listPopularPublicShops().some((row) => row.id === id), `${id} is not in Most popular`);
    assert(!filterHalfwayEligible(listDiscoveryShops()).some((row) => row.id === id), `${id} is not in the بيننا pool`);
    assert(!applyHideChains(listDirectoryShopsForDistrict("ash-shifa"), true).some((row) => row.id === id), `${id} is hidden by Local only`);
  }
  for (const [ask, id] of [
    ["yamm shifa", "yamm-ash-shifa"],
    ["coffee address shifa", "coffee-address-ash-shifa"],
    ["folk coffee", "folk-coffee-ash-shifa"],
    ["فوك", "folk-coffee-ash-shifa"],
    ["light dose cafe", "light-dose-ash-shifa"],
    ["جرعة خفيفة", "light-dose-ash-shifa"],
    ["third place cafe", "third-place-ash-shifa"],
    ["third place specialty coffee", "third-place-ash-shifa"],
    ["ثيرد بليس", "third-place-ash-shifa"],
    ["butterfly cafe", "butterfly-cafe-ash-shifa"],
    ["بترفلاي", "butterfly-cafe-ash-shifa"],
    ["rwy", "rwy-ash-shifa"],
    ["icon cafe", "icon-ash-shifa"],
    ["ayquna", "icon-ash-shifa"],
    ["أيقونة حي الشفا", "icon-ash-shifa"],
    ["linor", "linor-ash-shifa"],
    ["linor coffee", "linor-ash-shifa"],
    ["lenore", "linor-ash-shifa"],
    ["ayquna cafe", "icon-ash-shifa"],
    ["icon cafe", "icon-ash-shifa"],
    ["icon coffee", "icon-ash-shifa"],
    ["لينور", "linor-ash-shifa"],
    ["java shifa", "java-cafe-ash-shifa"],
    ["half million ibn taymiyyah", "half-million-ibn-taymiyyah-ash-shifa"],
    ["half million tirmidhi", "half-million-tirmidhi-ash-shifa"],
  ] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === id, `${ask} matches ${id} first, got ${hits.join(",")}`);
  }
  const qIds = new Set<string>([...localIds, ...chainIds]);
  for (const ask of [
    "folk", "light", "dose", "light dose", "جرعة", "خفيفة", "third", "place", "third place", "a quiet place to study", "بليس",
    "butterfly", "icon", "أيقونة", "حي", "قهوة في حي الملقا", "ومقهى", "light roast",
  ]) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(!hits.some((hit) => qIds.has(hit)), `${ask} does not pin a Batch Q row, got ${hits.join(",")}`);
  }
  for (const [ask, first] of [["yamm", "yamm-olaya"], ["half million", "half-million-shubra"]] as const) {
    const hits = matchCatalogShops(ask, listRealShops()).map((shop) => shop.id);
    assert(hits[0] === first, `bare ${ask} keeps the older ${first} first, got ${hits.join(",")}`);
  }
  const javaFirst = matchCatalogShops("java", listRealShops()).map((shop) => shop.id);
  assert(javaFirst[0] !== "java-cafe-ash-shifa", `bare java keeps an older Java row first, got ${javaFirst.join(",")}`);
  assert(listDirectoryShopsForDistrict("ash-shifa").length === 13, "Ash Shifa page has 13 cafés (Tul Cafe + 12 Batch Q)");
}
// Batch H (9 Oct 2026): McCafé Uthman Ibn Affan (Al Izdihar) was dropped per Amjad (r3); no McCafé row is live. Dunkin' stays out pending Amjad (donut-led rule).
assert(
  !listRealShops().some((shop) => shop.chainBrand === "mccafe" || /mccaf|mc caf|ماك كافيه/i.test(`${shop.id} ${shop.nameEn} ${shop.nameAr}`)),
  "no McCafé row is live (dropped from Batch H per Amjad)",
);
assert(
  !listRealShops().some((shop) => shop.chainBrand === "dunkin" || /dunkin|دانكن/i.test(`${shop.id} ${shop.nameEn} ${shop.nameAr}`)),
  "no Dunkin' row is live (donut-led chain question is open with Amjad)",
);
assert(CHAIN_BRANDS.mccafe.logo === null && !existsSync(join(process.cwd(), "public/logos/mccafe-mark.png")), "McCafe registry keeps its pre-Batch H entry with no logo (mark file removed)");

// Generic cafe words are not a brand name. «كوفي» inside كوستا كوفي used to pin Costa first.
const GENERIC_CAFE_TOKENS = new Set([
  "كوفي",
  "كوفيه",
  "كوفه",
  "قهوه",
  "كافيه",
  "كافية",
  "كافي",
  "coffee",
  "coffe",
  "cofee",
  "cafe",
  "café",
  "caffe",
  "caffé",
  "kofi",
  "kofe",
  "koffee",
  "qahwa",
  "qahwah",
  "kahwa",
  "gahwa",
]);
const genericChainAliases = listRealShops()
  .filter((shop) => shop.isChain === true)
  .flatMap((shop) =>
    shopNameAliases(shop)
      .filter((alias) => !alias.includes(" ") && GENERIC_CAFE_TOKENS.has(alias))
      .map((alias) => `${shop.id}:${alias}`),
  );
assert(
  genericChainAliases.length === 0,
  `chain rows must not alias a generic cafe token, got ${genericChainAliases.join(",")}`,
);
for (const ask of ["كوفي النفل", "كوفي قريب من النفل", "coffee an nafal", "كافيه النفل"] as const) {
  const result = pickCafes({ text: ask });
  assert(result.picks.length > 0, `${ask} still returns picks`);
  assert(
    result.picks.every((pick) => pick.shop.isChain !== true),
    `${ask} top picks stay local, got ${result.picks.map((pick) => pick.shop.id).join(",")}`,
  );
}
// Batch H: same rule in Al Izdihar (local-only after the McCafé drop).
for (const ask of ["كوفي الازدهار", "coffee al izdihar", "كافيه الازدهار", "قهوة الازدهار", "كوفي قريب من الازدهار", "cafe izdihar"] as const) {
  const result = pickCafes({ text: ask });
  assert(result.picks.length > 0, `${ask} still returns picks`);
  assert(
    result.picks.every((pick) => pick.shop.isChain !== true),
    `${ask} top picks stay local, got ${result.picks.map((pick) => pick.shop.id).join(",")}`,
  );
}
// Batch I: same rule in Ar Rahmaniyyah, where Starbucks and Java Time are the chains.
for (const ask of ["كوفي الرحمانية", "قهوة الرحمانية", "قهوه الرحمانية", "كافيه الرحمانية", "كوفي قريب من الرحمانية", "coffee al rahmaniyyah", "cafe rahmaniyyah", "coffee ar rahmaniyyah"] as const) {
  const result = pickCafes({ text: ask });
  assert(result.picks.length > 0, `${ask} still returns picks`);
  assert(
    result.picks.every((pick) => pick.shop.isChain !== true),
    `${ask} top picks stay local, got ${result.picks.map((pick) => pick.shop.id).join(",")}`,
  );
}
for (const [ask, id] of [
  ["ستاربكس الرحمانية", "starbucks-the-plaza-al-rahmaniyyah"],
  ["starbucks rahmaniyyah", "starbucks-the-plaza-al-rahmaniyyah"],
  // Batch I r2 (#257 QA m1/n1): the branch is The Plaza on King Abdullah Rd.
  ["starbucks the plaza", "starbucks-the-plaza-al-rahmaniyyah"],
  ["Starbucks The Plaza", "starbucks-the-plaza-al-rahmaniyyah"],
  ["starbucks plaza", "starbucks-the-plaza-al-rahmaniyyah"],
  ["ستاربكس بلازا", "starbucks-the-plaza-al-rahmaniyyah"],
  ["ستاربكس ذا بلازا", "starbucks-the-plaza-al-rahmaniyyah"],
  ["java time", "java-time-al-rahmaniyyah"],
  ["Java Time", "java-time-al-rahmaniyyah"],
  ["جافا تايم", "java-time-al-rahmaniyyah"],
  ["javatime", "java-time-al-rahmaniyyah"],
] as const) {
  const result = pickCafes({ text: ask });
  assert(result.picks[0]?.shop.id === id, `${ask} picks ${id} first, got ${result.picks.map((pick) => pick.shop.id).join(",")}`);
}
for (const ask of ["java", "جافا", "java cafe", "جافا كافيه"] as const) {
  const result = pickCafes({ text: ask });
  assert(
    result.picks[0]?.shop.chainBrand === "java" && !result.picks.some((pick) => pick.shop.chainBrand === "java-time"),
    `${ask} stays Java Cafe (not Java Time), got ${result.picks.map((pick) => pick.shop.id).join(",")}`,
  );
}
for (const ask of ["time", "coffee time", "تايم"] as const) {
  const result = pickCafes({ text: ask });
  assert(!result.picks.some((pick) => pick.shop.chainBrand === "java-time"), `${ask} does not pin Java Time, got ${result.picks.map((pick) => pick.shop.id).join(",")}`);
}
// Batch I r2 (#257 QA M1): Grind Coffee (counter-only mall kiosk, rule 5) is not live; "tent" alone is not Peaks (n4).
assert(!getShop("grind-coffee-al-rahmaniyyah") && !listRealShops().some((shop) => shop.id === "grind-coffee-al-rahmaniyyah" || shop.placeId === "ChIJl63oJOkdLz4R2-t0NffdqVY"), "no Grind Coffee row is live (dropped in Batch I r2; id/placeId only)");
assert(!shopNameAliases(getShop("peaks-the-tent-al-rahmaniyyah")!).includes("tent"), "Peaks – The Tent does not answer to tent alone");
assert(!pickCafes({ text: "tent" }).picks.some((pick) => pick.shop.id === "peaks-the-tent-al-rahmaniyyah"), "tent alone does not pick Peaks");
// Batch I r3 (#257 QA r2 M1): bare plaza / بلازا asks never pin Starbucks The Plaza; brand-qualified asks still do.
{
  const plazaAliases = shopNameAliases(getShop("starbucks-the-plaza-al-rahmaniyyah")!);
  for (const bare of ["plaza", "the plaza", "بلازا", "ذا بلازا"]) assert(!plazaAliases.includes(bare), `Starbucks The Plaza has no bare alias ${bare}`);
  for (const ask of ["plaza", "the plaza", "coffee plaza", "cafe plaza", "plaza mall", "riyadh plaza", "plaza cafe olaya", "the plaza king abdullah", "بلازا", "ذا بلازا", "كوفي بلازا", "بلازا مول", "رياض بلازا", "كوفي قريب من بلازا"]) {
    for (let run = 0; run < 3; run += 1) {
      assert(!pickCafes({ text: ask }).picks.some((pick) => pick.shop.id === "starbucks-the-plaza-al-rahmaniyyah"), `${ask} does not pick Starbucks The Plaza`);
    }
  }
}
// Batch I name self-tests: every new row finds itself by its EN and AR names.
for (const id of [
  "peaks-the-tent-al-rahmaniyyah",
  "november-coffee-al-rahmaniyyah",
  "sipology-al-rahmaniyyah",
  "ramli-cafe-al-rahmaniyyah",
  "starbucks-the-plaza-al-rahmaniyyah",
  "java-time-al-rahmaniyyah",
] as const) {
  const shop = getShop(id)!;
  for (const name of [shop.nameEn, shop.nameAr]) {
    assert(
      matchCatalogShops(name, listRealShops()).some((hit) => hit.id === id),
      `${name} name-matches ${id}`,
    );
  }
}
for (const [ask, id] of [
  ["Sipology", "sipology-al-rahmaniyyah"],
  ["سايبولوجي", "sipology-al-rahmaniyyah"],
  ["Ramli Cafe", "ramli-cafe-al-rahmaniyyah"],
  ["رملي كافيه", "ramli-cafe-al-rahmaniyyah"],
  ["Peaks The Tent", "peaks-the-tent-al-rahmaniyyah"],
  ["بيكس الرحمانية", "peaks-the-tent-al-rahmaniyyah"],
  ["peaks tent", "peaks-the-tent-al-rahmaniyyah"],
] as const) {
  const result = pickCafes({ text: ask });
  assert(result.picks[0]?.shop.id === id, `${ask} picks ${id} first, got ${result.picks.map((pick) => pick.shop.id).join(",")}`);
}
// Batch J: Al Mathar generic asks stay local (Peet's and 3 Starbucks are the chains).
for (const ask of ["كوفي المعذر", "قهوة المعذر", "قهوه المعذر", "كافيه المعذر", "كوفي قريب من المعذر", "coffee al mathar", "cafe mathar", "coffee mathar"] as const) {
  const result = pickCafes({ text: ask });
  assert(result.picks.length > 0, `${ask} still returns picks`);
  assert(
    result.picks.every((pick) => pick.shop.isChain !== true),
    `${ask} top picks stay local, got ${result.picks.map((pick) => pick.shop.id).join(",")}`,
  );
}
// Batch J: the three Starbucks are told apart by real location; brand-qualified asks find the right branch first.
for (const [ask, id] of [
  ["starbucks panorama", "starbucks-panorama-al-mathar"],
  ["Starbucks Panorama", "starbucks-panorama-al-mathar"],
  ["starbucks panorama mall", "starbucks-panorama-al-mathar"],
  ["ستاربكس بانوراما", "starbucks-panorama-al-mathar"],
  ["ستاربكس بانوراما مول", "starbucks-panorama-al-mathar"],
  ["starbucks tafaseel", "starbucks-tafaseel-al-mathar"],
  ["ستاربكس تفاصيل", "starbucks-tafaseel-al-mathar"],
  ["starbucks takhassusi", "starbucks-takhassusi-al-mathar"],
  ["ستاربكس التخصصي", "starbucks-takhassusi-al-mathar"],
  ["peets euromarche", "peets-euromarche-al-mathar"],
  ["بيتس يورومارشيه", "peets-euromarche-al-mathar"],
] as const) {
  for (let run = 0; run < 3; run += 1) {
    const result = pickCafes({ text: ask });
    assert(result.picks[0]?.shop.id === id, `${ask} picks ${id} first, got ${result.picks.map((pick) => pick.shop.id).join(",")}`);
  }
}
for (const ask of ["ستاربكس المعذر", "starbucks mathar", "starbucks al mathar"] as const) {
  const result = pickCafes({ text: ask });
  assert(
    ["starbucks-panorama-al-mathar", "starbucks-tafaseel-al-mathar", "starbucks-takhassusi-al-mathar"].includes(result.picks[0]?.shop.id ?? ""),
    `${ask} picks an Al Mathar Starbucks first, got ${result.picks.map((pick) => pick.shop.id).join(",")}`,
  );
}
for (const ask of ["peets", "بيتس", "peet's coffee", "بيتس كوفي"] as const) {
  assert(pickCafes({ text: ask }).picks.some((pick) => pick.shop.id === "peets-euromarche-al-mathar"), `${ask} surfaces Peet's`);
}
// No bare location word pins a chain: Panorama Mall also hosts L'ETO, Urth and Wayne's, and Takhassusi / Tafaseel are streets, buildings and a حي.
{
  const sbIds = new Set(["starbucks-panorama-al-mathar", "starbucks-tafaseel-al-mathar", "starbucks-takhassusi-al-mathar", "peets-euromarche-al-mathar"]);
  for (const id of sbIds) {
    const aliases = shopNameAliases(getShop(id)!);
    for (const bare of ["panorama", "بانوراما", "panorama mall", "بانوراما مول", "mall", "مول", "tafaseel", "تفاصيل", "takhassusi", "تخصصي", "التخصصي", "euromarche", "يورومارشيه"]) {
      assert(!aliases.includes(bare), `${id} has no bare alias ${bare}`);
    }
  }
  for (const ask of ["panorama", "panorama mall", "coffee panorama", "cafe panorama mall", "بانوراما", "بانوراما مول", "كوفي بانوراما", "قهوة بانوراما مول", "mall", "مول", "tafaseel", "تفاصيل", "takhassusi", "كوفي التخصصي", "قهوة التخصصي", "euromarche", "يورومارشيه"]) {
    for (let run = 0; run < 3; run += 1) {
      assert(!pickCafes({ text: ask }).picks.some((pick) => sbIds.has(pick.shop.id)), `${ask} does not pick an Al Mathar chain`);
    }
  }
}
// Batch J name self-tests: every new row finds itself by its EN and AR names.
for (const id of [
  "richony-cafe-al-mathar",
  "leto-caffe-al-mathar",
  "urth-caffe-al-mathar",
  "waynes-coffee-al-mathar",
  "peets-euromarche-al-mathar",
  "starbucks-panorama-al-mathar",
  "starbucks-tafaseel-al-mathar",
  "starbucks-takhassusi-al-mathar",
] as const) {
  const shop = getShop(id)!;
  for (const name of [shop.nameEn, shop.nameAr]) {
    assert(matchCatalogShops(name, listRealShops()).some((hit) => hit.id === id), `${name} name-matches ${id}`);
  }
}
for (const [ask, id] of [
  ["Richony Cafe", "richony-cafe-al-mathar"],
  ["ريتشوني", "richony-cafe-al-mathar"],
  ["L'ETO Caffe", "leto-caffe-al-mathar"],
  ["leto", "leto-caffe-al-mathar"],
  ["ليتو كافيه", "leto-caffe-al-mathar"],
  ["Wayne's Coffee", "waynes-coffee-al-mathar"],
  ["waynes", "waynes-coffee-al-mathar"],
  ["واينز كوفي", "waynes-coffee-al-mathar"],
  ["urth al mathar", "urth-caffe-al-mathar"],
  ["إيرث المعذر", "urth-caffe-al-mathar"],
] as const) {
  const result = pickCafes({ text: ask });
  assert(result.picks[0]?.shop.id === id, `${ask} picks ${id} first, got ${result.picks.map((pick) => pick.shop.id).join(",")}`);
}
const costaNafal = pickCafes({ text: "كوستا النفل" });
assert(
  costaNafal.picks.some((pick) => pick.shop.id === "costa-tala-mall-an-nafal"),
  `كوستا النفل returns Costa, got ${costaNafal.picks.map((pick) => pick.shop.id).join(",")}`,
);
for (const [ask, brand] of [
  ["كوستا", "costa"],
  ["costa", "costa"],
  ["costa coffee", "costa"],
  ["starbucks", "starbucks"],
  ["ستاربكس", "starbucks"],
  ["د.كيف", "dr-cafe"],
  ["dr.CAFE", "dr-cafe"],
  ["هاف مليون", "half-million"],
  ["تيم هورتنز", "tim-hortons"],
  ["فيلوتشي", "veloce"],
  ["درايف كوفي", "drive"],
  ["جافا", "java"],
  ["جافا تايم", "java-time"],
  ["java time", "java-time"],
  ["بيتس", "peets"],
  ["peets", "peets"],
] as const) {
  const result = pickCafes({ text: ask });
  assert(
    result.picks.some((pick) => pick.shop.chainBrand === brand),
    `${ask} still surfaces ${brand}, got ${result.picks.map((pick) => pick.shop.id).join(",")}`,
  );
}
// Batch H r2 (#256 QA L1): Latin accents fold in name search ("Rémi's" = "remis"), both ways, and no name loses itself.
{
  const shops = listRealShops();
  for (const [ask, id] of [
    ["Rémis Matcha Club", "remis-matcha-club-hittin"],
    ["remis matcha club", "remis-matcha-club-hittin"],
    ["Voûte Fot", "voute-fot-al-naseem-sharqi"],
    ["voute fot", "voute-fot-al-naseem-sharqi"],
  ] as const) {
    assert(
      matchCatalogShops(ask, shops).some((shop) => shop.id === id),
      `${ask} name-matches ${id}, got ${matchCatalogShops(ask, shops).slice(0, 3).map((shop) => shop.id).join(",")}`,
    );
  }
  const accented = shops.filter((shop) => /[\u00C0-\u024F]/.test(shop.nameEn));
  assert(accented.length >= 10, `accented English names still in catalog (${accented.length})`);
  for (const shop of accented) {
    assert(
      matchCatalogShops(shop.nameEn, shops).some((hit) => hit.id === shop.id),
      `${shop.nameEn} still name-matches ${shop.id}`,
    );
  }
}
// Sit-down chain rows with no drive-through (no drive-through moment tag, never on the lane).
const SIT_DOWN_ONLY_CHAINS = new Set<string>([
  "veloce-cafe-at-taawun",
  "half-million-shubra",
  "costa-tala-mall-an-nafal",
  "starbucks-tala-mall-an-nafal",
  "drcafe-an-nafal",
  "starbucks-the-plaza-al-rahmaniyyah",
  "java-time-al-rahmaniyyah",
  "peets-euromarche-al-mathar",
  "starbucks-panorama-al-mathar",
  "starbucks-tafaseel-al-mathar",
  "starbucks-takhassusi-al-mathar",
  "starbucks-oruba-square-umm-al-hamam-al-gharbi",
  "costa-coffee-diplomatic-quarter",
  "caribou-coffee-diplomatic-quarter",
  "starbucks-safarat-diplomatic-quarter", "starbucks-oud-square-diplomatic-quarter",
  "veloce-dhahrat-laban",
  "drcafe-park-dhahrat-laban",
  // Batch O (16 Oct): sit-down chains in Namar, no drive-through.
  "java-cafe-namar",
  "coffee-bean-tea-leaf-namar",
  // Batch Q (18 Oct): sit-down chains in Ash Shifa, no drive-through.
  "java-cafe-ash-shifa",
  "half-million-ibn-taymiyyah-ash-shifa",
  "half-million-tirmidhi-ash-shifa",
  // Batch R (19 Oct 2026) Al Qadisiyah; Starbucks Tamimi carries the drive-through tag so it is not here.
  "peets-sheikh-jaber-al-qadisiyah",
  "half-million-al-qadisiyah",
  "starbucks-rakaa-plaza-al-qadisiyah",
  "tim-hortons-sheikh-jaber-al-qadisiyah",
  // Batch SD1 (21 Oct 2026) Al Shohda: Granada Mall / Ash Shuhada sit-down chains, no drive-through.
  "drcafe-ash-shuhada-al-shohda",
  "drcafe-granada-mall-al-shohda",
  "peets-granada-mall-al-shohda",
  "starbucks-granada-mall-al-shohda",
  "half-million-al-shohda",
  "tim-hortons-granada-mall-al-shohda",
  "caribou-granada-mall-al-shohda",
  // 21 Oct 2026: Namq (chain, Amjad via Ajz) — both rows are sit-down cafés, never on the drive-through lane.
  "namq-al-malqa",
  "namq-as-salam",
]);
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
  // Batch E r2 (8 Oct): sit-down chain in At Taawun, never on the lane.
  "veloce-cafe-at-taawun",
  // Batch F (5 Oct): sit-down chains in Shubra, never on the lane (Tim Hortons also has a drive-through).
  "tim-hortons-shubra",
  "half-million-shubra",
  // Batch G (8 Oct): sit-down chains in An Nafal, none has a drive-through.
  "costa-tala-mall-an-nafal",
  "starbucks-tala-mall-an-nafal",
  "drcafe-an-nafal",
  // Batch I (10 Oct): sit-down chains in Ar Rahmaniyyah, no drive-through.
  "starbucks-the-plaza-al-rahmaniyyah",
  "java-time-al-rahmaniyyah",
  // Batch J (11 Oct): sit-down chains in Al Mathar, no drive-through.
  "peets-euromarche-al-mathar",
  "starbucks-panorama-al-mathar",
  "starbucks-tafaseel-al-mathar",
  "starbucks-takhassusi-al-mathar",
  // Batch K (12 Oct): Starbucks Oruba Square has a drive-through lane but verified indoor seating; sit-down, never on the lane, no tag (Starbucks rule).
  "starbucks-oruba-square-umm-al-hamam-al-gharbi",
  // Batch M (14 Oct): sit-down chains in the Diplomatic Quarter, no drive-through.
  "costa-coffee-diplomatic-quarter",
  "caribou-coffee-diplomatic-quarter",
  "starbucks-safarat-diplomatic-quarter", "starbucks-oud-square-diplomatic-quarter",
  // Batch N (15 Oct): sit-down chains in Dhahrat Laban, no drive-through.
  "veloce-dhahrat-laban",
  "drcafe-park-dhahrat-laban",
  "java-cafe-namar",
  "coffee-bean-tea-leaf-namar",
  // Batch Q (18 Oct): sit-down chains in Ash Shifa, never on the lane.
  "java-cafe-ash-shifa",
  "half-million-ibn-taymiyyah-ash-shifa",
  "half-million-tirmidhi-ash-shifa",
  // Batch R (19 Oct): Al Qadisiyah chains; Starbucks Tamimi is sit-down with the drive-through moment tag, no lane.
  "peets-sheikh-jaber-al-qadisiyah",
  "half-million-al-qadisiyah",
  "starbucks-rakaa-plaza-al-qadisiyah",
  "starbucks-tamimi-al-qadisiyah",
  "tim-hortons-sheikh-jaber-al-qadisiyah",
  // Batch SD1 (21 Oct): Al Shohda chains, sit-down, never on the lane.
  "drcafe-ash-shuhada-al-shohda",
  "drcafe-granada-mall-al-shohda",
  "peets-granada-mall-al-shohda",
  "starbucks-granada-mall-al-shohda",
  "half-million-al-shohda",
  "tim-hortons-granada-mall-al-shohda",
  "caribou-granada-mall-al-shohda",
  "namq-al-malqa",
  "namq-as-salam",
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
  taggedLive
    .filter((shop) => !SIT_DOWN_ONLY_CHAINS.has(shop.id))
    .every((shop) => shop.momentTags.includes("drive-through")),
  "tagged rows keep the drive-through moment tag (sit-down-only chains excepted)",
);
for (const id of SIT_DOWN_ONLY_CHAINS) {
  const shop = getShop(id);
  assert(
    shop?.isChain === true &&
      !shop.momentTags.includes("drive-through") &&
      shop.vibeTags.join(",") === "قهوة" &&
      shop.catalogLane !== "drive-through" &&
      // Namq Al Malqa: Places dineIn is false but outdoorSeating is true (seated terrace), so it stays listed as before.
      (shop.dineIn === true || (id === "namq-al-malqa" && shop.outdoorSeating === true)),
    `${id} is a sit-down chain without a drive-through tag`,
  );
}
const veloce = getShop("veloce-cafe-at-taawun");
assert(
  veloce?.isChain === true &&
    veloce.chainBrand === "veloce" &&
    !veloce.momentTags.includes("drive-through") &&
    veloce.catalogLane !== "drive-through" &&
    veloce.dineIn === true,
  "Veloce At Taawun is a sit-down chain without a drive-through tag",
);
const halfMillion = getShop("half-million-shubra");
assert(
  halfMillion?.isChain === true &&
    !halfMillion.momentTags.includes("drive-through") &&
    halfMillion.catalogLane !== "drive-through" &&
    halfMillion.dineIn === true,
  "Half Million Shubra is a sit-down chain without a drive-through tag",
);
const timHortons = getShop("tim-hortons-shubra");
assert(
  timHortons?.isChain === true &&
    timHortons.momentTags.includes("drive-through") &&
    timHortons.catalogLane !== "drive-through" &&
    timHortons.dineIn === true,
  "Tim Hortons Shubra is sit-down + drive-through like dr.CAFE As Suwaidi (moment tag, no lane)",
);
assert(
  dineInLaneRemoved.every((id) => getShop(id)?.catalogLane !== "drive-through"),
  "the 23 sit-down rows stay off the drive-through lane",
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
    "starbucks,dunkin,mccafe,barns,peets,dr-cafe,java,java-time,24cafe,shqaf,coffee-day,kyan,dancafe,drive,half-million,tim-hortons,veloce,costa,caribou,coffee-bean,namq",
  "registry is the mass-market set (Java Time added in Batch I; Caribou in Batch M; The Coffee Bean & Tea Leaf in Batch O; Namq 21 Oct)",
);
assert(!isChainBrandId("krispy-kreme"), "Krispy Kreme is not a chain brand");
assert(isChainBrandId("shqaf") && CHAIN_BRANDS.shqaf.nameAr === "شقفه", "Shqaf is شقفه");
assert(isChainBrandId("coffee-day") && CHAIN_BRANDS["coffee-day"].logo === null, "Coffee Day has no invented logo");
assert(isChainBrandId("kyan") && CHAIN_BRANDS.kyan.nameAr === "كيان", "Kyan is كيان");
assert(isChainBrandId("dancafe") && CHAIN_BRANDS.dancafe.nameAr === "دان كافيه", "Dancafe is دان كافيه");
assert(isChainBrandId("drive") && CHAIN_BRANDS.drive.nameAr === "درايف كوفي", "Drive Coffee is درايف كوفي");
assert(isChainBrandId("veloce") && CHAIN_BRANDS.veloce.nameAr === "فيلوتشي", "Veloce is فيلوتشي");
assert(isChainBrandId("costa") && CHAIN_BRANDS.costa.nameAr === "كوستا كوفي", "Costa Coffee is كوستا كوفي");
assert(
  shopBrandKey(fixtureShop({ id: "costa-x", nameEn: "Costa Coffee" })) === "costa",
  "Costa brand key",
);
assert(
  shopBrandKey(fixtureShop({ id: "veloce-x", nameEn: "Veloce Cafe" })) === "veloce",
  "Veloce brand key",
);
assert(
  isChainBrandId("half-million") && CHAIN_BRANDS["half-million"].nameAr === "هاف مليون",
  "Half Million is هاف مليون",
);
assert(
  isChainBrandId("tim-hortons") && CHAIN_BRANDS["tim-hortons"].nameAr === "تيم هورتنز",
  "Tim Hortons is تيم هورتنز",
);
assert(
  shopBrandKey(fixtureShop({ id: "half-million-x", nameEn: "Half Million" })) === "half-million" &&
    shopBrandKey(fixtureShop({ id: "tim-hortons-x", nameEn: "Tim Hortons" })) === "tim-hortons",
  "Half Million and Tim Hortons brand keys",
);
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

assert(listDiscoveryShops().length === 555, "specialty discovery is 555 (10 NG1 An Nasim Al Gharbi local (29 Oct 2026) + 1 OPULENT Qurtubah (TRENDVERIFY-1023PM) + 10 trending adds 21 Oct + − 2 Namq now chain, 21 Oct; 7 Batch SD1 Al Shohda local + 6 Batch S As Salam local + 3 Batch R Al Qadisiyah local + 7 trending adds 18 Oct + 1 Trace Al Mursalat AJ add + 9 Batch Q Ash Shifa local + 14 Batch P Tuwaiq local + 2 Batch O Namar local + 1 Found Ar Rabwah AJ add + 403 + 9 Batch E At Taawun local + 7 Batch F Shubra local + 12 Batch G An Nafal local + 7 Batch H Al Izdihar local + 4 Batch I Ar Rahmaniyyah local + 4 Batch J Al Mathar local + 4 Batch J other adds + 11 Batch K Umm Al Hamam Al Gharbi local + 3 Batch L Umm Al Hamam Ash Sharqi local + 9 Batch M Diplomatic Quarter local + 13 Batch N Dhahrat Laban local; Veloce is a chain)");
assert(listRealShops().length === 658, "catalog is 658 after 10 NG1 An Nasim Al Gharbi (29 Oct 2026), OPULENT Qurtubah (TRENDVERIFY-1023PM), the 21 Oct trending adds (10), Batch SD1 (14 Al Shohda), Batch S (6 As Salam), Batch R (8 Al Qadisiyah), the 18 Oct trending adds (7), Trace Al Mursalat (AJ add), Batch Q (12 Ash Shifa), Batch P (14 Tuwaiq), Batch O (4 Namar), Found Ar Rabwah (AJ add), D1, D2, D3, Batch E, Batch F (9 Shubra), Batch G (15 An Nafal), Batch H (7 Al Izdihar), Batch I (6 Ar Rahmaniyyah), Batch J (8 Al Mathar + 4 other adds) Batch K (12 Umm Al Hamam Al Gharbi), Batch L (3 Umm Al Hamam Ash Sharqi) Batch M (13 Diplomatic Quarter) and Batch N (15 Dhahrat Laban)");
assert(listLiveDistrictIds().length === 64, "specialty districts are 64 (Al Raqban into As Salam, and the Takhassusi street retired)");
assert(
  catalogDistrictIdsFrom(listRealShops()).length === 77,
  "catalog rows cover 77 districts (Al Raqban and the Takhassusi street retired; Jarir hidden)",
);
assert(listLiveCatalogDistrictIds().length === 67, "district pages are 67 (Al Raqban and the Takhassusi street retired)");
assert(listDriveThroughDirectoryShops().length === 75, "drive-through is 75 (73 + Tim Hortons Shubra + Starbucks Tamimi Al Qadisiyah, sit-down + drive-through)");
assert(listListingShops().length === 603, "listing is 555 local plus the 48 sit-down chains");
assert(listPublicShops().length === 603, "public list includes the 48 sit-down chains");
assert(listBrowseDirectoryShops().length === 606, "browse is 418 plus the 10 NG1 An Nasim Al Gharbi rows (29 Oct 2026), OPULENT Qurtubah (TRENDVERIFY-1023PM), the 10 trending-add rows (21 Oct), the 14 Batch SD1 Al Shohda rows, the 6 Batch S As Salam rows, the 8 Batch R Al Qadisiyah rows, the 7 trending-add rows (18 Oct), the 1 Trace Al Mursalat row (which replaces the Camel Step DT-lane fallback on the Al Mursalat page), the 12 Batch Q Ash Shifa rows, the 14 Batch P Tuwaiq rows, the 4 Batch O Namar rows, the 1 Found Ar Rabwah row, the 15 Batch N Dhahrat Laban rows, the 13 Batch M Diplomatic Quarter rows, the 10 Batch E At Taawun rows, the 9 Batch F Shubra rows, the 15 Batch G An Nafal rows, the 7 Batch H Al Izdihar rows, the 6 Batch I Ar Rahmaniyyah rows, the 8 Batch J Al Mathar rows and the 4 Batch J other rows, the 12 Batch K Umm Al Hamam Al Gharbi rows and the 3 Batch L Umm Al Hamam Ash Sharqi rows, minus A PLUS (As Salam drive-through fallback steps back behind THE HAT)");
assert(
  listListingShops().filter((shop) => shop.isChain).length === 48,
  "exactly 48 sit-down chains are listed (21 Oct: + Namq Al Malqa and As Salam; Batch SD1: + 2 dr.CAFE, Peet's, Starbucks, Half Million, Tim Hortons and Caribou Al Shohda; Batch R: + Peet's, Half Million, 2 Starbucks and Tim Hortons Al Qadisiyah; Batch Q: + Java Cafe and 2 Half Million Ash Shifa; Batch O: + Java Cafe and The Coffee Bean & Tea Leaf Namar; 8 on main + Drive Al Ghadeer and Al Qirawan + Veloce At Taawun + Half Million and Tim Hortons Shubra + Costa, Starbucks and dr.CAFE An Nafal + Starbucks and Java Time Ar Rahmaniyyah + Peet's and 3 Starbucks Al Mathar + Starbucks Oruba Square Umm Al Hamam Al Gharbi + Costa, Caribou and 2 Starbucks Diplomatic Quarter + Veloce and dr.CAFE Dhahrat Laban)",
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
    "31 cafes in Al Olaya on wain.lol — a Riyadh neighborhood list, with Maps links.",
  "Al Olaya EN meta counts Trov (Batch D3), HORUS House (trending add 18 Oct) and AGRIO (trending add 21 Oct)",
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
  districtEnMarkdown("namar").includes("on the catalog today — 3 local cafes, 3 chain branches:"),
  "Namar EN intro counts 3 local cafés and 3 dine-in chains (Batch O)",
);
assert(
  districtArMarkdown("namar").includes("بالكتالوج اليوم — 3 قهاوي محلية، و3 فروع:"),
  "Namar AR intro counts 3 local cafés and 3 dine-in chains (Batch O)",
);
assert(
  districtEnMarkdown("namar").includes("[ON OFF Coffee](/en/c/on-off-coffee-namar), [Pandemic Coffee](/en/c/pandemic-coffee-namar), and [Freedom Coffee](/en/c/freedom-coffee-namar) are the local cafes on this list today.") &&
    districtArMarkdown("namar").includes("[اون اوف كوفي](/c/on-off-coffee-namar) و[بانديمك كوفي](/c/pandemic-coffee-namar) و[فريدم كافيه](/c/freedom-coffee-namar) من القهاوي المحلية بهالقائمة اليوم.") &&
    !districtEnMarkdown("namar").split("## ")[0].includes("java-cafe-namar") && !districtEnMarkdown("namar").split("## ")[0].includes("coffee-bean-tea-leaf-namar"),
  "Namar intro names only local cafés (ON OFF, Pandemic, Freedom; Batch O)",
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
  // Shubra left this list in Batch F (5 Oct 2026): 7 local cafés + 2 sit-down chains.
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
  withMixedChainMeta.join(",") === "al-malqa,sulimaniyah,al-rahmaniyyah,al-mughrizat,al-shohda,al-manar,diplomatic-quarter,al-ghadeer,al-qirawan,al-malaz,al-mathar,at-taawun,as-salam,namar,shubra,tuwaiq,as-suwaidi,umm-al-hamam-al-gharbi,an-nafal,ash-shifa,al-qadisiyah,dhahrat-laban",
  "mixed districts say local specialty plus chain branches",
);
assert(
  districtEnMeta("namar") ===
    "6 cafes in Namar on wain.lol — local specialty plus chain branches, each with a Maps link.",
  "Namar meta is the mixed line (Batch D3 ON OFF + dr.CAFE; Batch O adds 4)",
);
assert(
  listDirectoryShopsForDistrict("tuwaiq").map((shop) => shop.id).sort().join(",") ===
    "breath-tuwaiq,drcafe-tuwaiq,drip-tuwaiq,era-coffee-tuwaiq,gedeb-tuwaiq,haqwa-tuwaiq,inverno-tuwaiq,irlo-tuwaiq,lihaf-tuwaiq,nv-coffee-tuwaiq,oldlane-tuwaiq,quba-tuwaiq,ratio-speciality-tuwaiq,saaf-tuwaiq,shathb-tuwaiq,taghrid-tuwaiq",
  "Tuwaiq lists dr.CAFE (chain), Drip (local) and the 14 Batch P local cafés",
);
assert(
  districtEnMeta("tuwaiq") ===
    "16 cafes in Tuwaiq on wain.lol — local specialty plus chain branches, each with a Maps link.",
  "Tuwaiq meta is the mixed line (Drip + dr.CAFE; Batch P adds 14)",
);
assert(
  listDirectoryShopsForDistrict("ash-shifa").map((shop) => shop.id).sort().join(",") ===
    "butterfly-cafe-ash-shifa,coffee-address-ash-shifa,folk-coffee-ash-shifa,half-million-ibn-taymiyyah-ash-shifa,half-million-tirmidhi-ash-shifa,icon-ash-shifa,java-cafe-ash-shifa,light-dose-ash-shifa,linor-ash-shifa,rwy-ash-shifa,third-place-ash-shifa,tul-cafe-ash-shifa,yamm-ash-shifa",
  "Ash Shifa lists Tul Cafe plus the 12 Batch Q rows (9 local, 3 chain)",
);
assert(
  districtEnMeta("ash-shifa") ===
    "13 cafes in Ash Shifa on wain.lol — local specialty plus chain branches, each with a Maps link.",
  "Ash Shifa meta is the mixed line (Batch Q adds Java Cafe and 2 Half Million)",
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
    tuwaiqEn.includes("[Drip](/en/c/drip-tuwaiq), [IRLO](/en/c/irlo-tuwaiq), [Quba](/en/c/quba-tuwaiq), [Oldlane](/en/c/oldlane-tuwaiq), and [BREATH](/en/c/breath-tuwaiq) are among the local cafes on this list today.") &&
      tuwaiqAr.includes("[دريب](/c/drip-tuwaiq) و[أرلو كافيه](/c/irlo-tuwaiq) و[قوبا](/c/quba-tuwaiq) و[أولد لين](/c/oldlane-tuwaiq) و[بريث](/c/breath-tuwaiq) من القهاوي المحلية بهالقائمة اليوم."),
    "Tuwaiq intro names only local cafes (Drip + 4 Batch P)",
  );
  assert(
    tuwaiqEn.includes("- {chain} [dr.CAFE · Jeddah Hwy](/en/c/drcafe-tuwaiq)"),
    "Tuwaiq dr.CAFE stays a {chain} list row (hidden with Local only on)",
  );
  const shifaEn = districtEnMarkdown("ash-shifa");
  const shifaAr = districtArMarkdown("ash-shifa");
  assert(
    shifaEn.includes("[Tul Cafe](/en/c/tul-cafe-ash-shifa), [Yamm](/en/c/yamm-ash-shifa), [Butterfly](/en/c/butterfly-cafe-ash-shifa), [Coffee Address](/en/c/coffee-address-ash-shifa), and [Third Place](/en/c/third-place-ash-shifa) are among the local cafes on this list today.") &&
      shifaAr.includes("[طَول كافيه](/c/tul-cafe-ash-shifa) و[يَمّ](/c/yamm-ash-shifa) و[بترفلاي كافيه](/c/butterfly-cafe-ash-shifa) و[عنوان القهوة](/c/coffee-address-ash-shifa) و[ثيرد بليس](/c/third-place-ash-shifa) من القهاوي المحلية بهالقائمة اليوم.") &&
      !shifaEn.split("## ")[0].includes("java-cafe-ash-shifa") && !shifaEn.split("## ")[0].includes("half-million"),
    "Ash Shifa intro names only local cafes (Tul Cafe + 4 Batch Q), no chain",
  );
  for (const id of ["java-cafe-ash-shifa", "half-million-ibn-taymiyyah-ash-shifa", "half-million-tirmidhi-ash-shifa"]) {
    assert(shifaEn.includes(`- {chain} [`) && shifaEn.includes(`(/en/c/${id})`), `Ash Shifa ${id} is a {chain} list row`);
  }
}
const copyHash = createHash("sha256").update(copyBlob).digest("hex");
assert(
  copyHash === "ec50fdc70397893e2f57dec4c15e01b010c967ec94bfe726429c48650c427ca2",
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
const rows0 = (id: string) => real.filter((shop) => (shop.neighborhood as string) === id);
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
  if (!onPage) {
    if (id === ("al-takhassusi" as NeighborhoodId)) {
      assert(rows.length === 0, "retired Al Takhassusi street has no catalog rows");
      continue;
    }
    disappeared.push(id);
  }
}
// 21 Oct 2026: Al Raqban (a street inside As Salam) folds into as-salam; its old URLs 308 there.
const foldedDistricts = new Map<string, NeighborhoodId>([["al-raqban", "as-salam"]]);
for (const id of disappeared) {
  const into = foldedDistricts.get(id);
  if (into) {
    assert(
      rows0(id).length === 0 &&
        (["ar", "en"] as const).every((lang) =>
          LEGACY_DISTRICT_REDIRECTS.some(
            (row) => row.source === districtPath(id, lang) && row.destination === districtPath(into, lang) && row.statusCode === 308,
          ),
        ),
      `${id} folds into ${into}: no rows left and AR/EN district URLs 308 there`,
    );
    continue;
  }
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
  driveThrough.filter((shop) => shop.isChain === true).length === 46,
  "the drive-through directory includes the 46 drive-through chain branches (28 on main + 16 Drive Coffee + Tim Hortons Shubra + Starbucks Tamimi Al Qadisiyah)",
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
  llmsHash === "b768d55f30974d8776c7a94d56b9d53fceda37e8614f8f1c1de4456e0e877018",
  `llms.txt headline follows the default catalog: ${llmsHash}`,
);
assert(
  llms.includes("603: 555 local, 48 chain branches"),
  "llms.txt names the sit-down total and the 48 chain branches",
);

// 16 Sep scope stays: no Starbucks row carries the drive-through tag or chip.
// Most popular, بيننا, and trending still exclude chains (including Starbucks) as implemented.
assert(
  read("scripts/check-district-urls.ts").includes(
    '"no Starbucks row carries the drive-through tag or chip"',
  ),
  "Starbucks drive-through chip ban stays in the district check",
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
    structuredSrc.includes("listListingDirectoryShops(city)") &&
    structuredSrc.includes("const shops = listPublicShops()"),
  "JSON-LD and llms.txt are built from public listing shops",
);
assert(
  structuredSrc.includes("listDriveThroughDirectoryShops(city)"),
  "the drive-through catalog view keeps the requested city",
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
// Batch H r2/r3: the accent fold reaches chain aliases too, on the synthetic row (no live McCafé row after r3).
for (const ask of ["McCafé", "MCCAFÉ", "mc café", "Mc Cafe\u0301"] as const) {
  assert(
    matchCatalogShops(ask, askShops).some((shop) => shop.id === "mccafe-sit"),
    `${ask} matches the synthetic McCafe row`,
  );
}
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
  // Four pages show 3 nearby, each because one listed neighbor only has drive-thru rows.
  // (AJ add 18 Oct 2026: Trace makes Al Mursalat a specialty list, so King Salman gets its 4th nearby back.)
  const listed = new Set(listDirectoryShops().map((shop) => shop.neighborhood));
  const shortNearby = (Object.keys(NEARBY_DISTRICTS) as NeighborhoodId[])
    .filter((id) => listed.has(id))
    .filter((id) => NEARBY_DISTRICTS[id].filter((n) => listed.has(n) && n !== id).length < 4)
    .sort();
  assert(
    shortNearby.join(",") === "al-aziziyah,as-suwaidi,badr,tuwaiq",
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
    paragraphWith(en, "are the local cafes") !== "" &&
      paragraphWith(ar, "من القهاوي المحلية") !== "" &&
      !paragraphWith(en, "are the local cafes").includes("data-chain-only") &&
      !paragraphWith(ar, "من القهاوي المحلية").includes("data-chain-only"),
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
const hiddenDistrictCafes = ["kkia", "al-jazirah", "an-nasim", "manfuha"] as const;
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

// Batch J other adds: DISAM matches by sign and Google name; THE HAT matches only as "the hat" / «ذا هات»
// («هات» is everyday Arabic for "bring", so it must never pin the café on its own).
for (const [name, id] of [
  ["disam", "disam-al-narjis"],
  ["DISAM", "disam-al-narjis"],
  ["ديسم", "disam-al-narjis"],
  ["the hat", "the-hat-as-salam"],
  ["THE HAT", "the-hat-as-salam"],
  ["ذا هات", "the-hat-as-salam"],
  ["nafees", "nafees-as-suwaidi-al-gharbi"],
  ["نفيس", "nafees-as-suwaidi-al-gharbi"],
] as const) {
  assert(matchCatalogShops(name, listRealShops()).some((hit) => hit.id === id), `${name} name-matches ${id}`);
}
for (const ask of ["هات", "hat", "هات لي قهوة", "هات قهوة باردة", "ذا"]) {
  assert(
    !matchCatalogShops(ask, listRealShops()).some((hit) => hit.id === "the-hat-as-salam"),
    `${ask} does not pin THE HAT (SHOP_TOKEN_BLOCK)`,
  );
}
// Batch J r2: one letter never pins L'ETO (QA n1); Robusta Bake by name, never by bare "bake" / «بيك».
for (const ask of ["l", "L"]) {
  assert(
    !matchCatalogShops(ask, listRealShops()).some((hit) => hit.id === "leto-caffe-al-mathar"),
    `bare ${ask} does not pin L'ETO (SHOP_TOKEN_BLOCK)`,
  );
}
for (const [name, id] of [
  ["l'eto", "leto-caffe-al-mathar"],
  ["L'ETO", "leto-caffe-al-mathar"],
  ["leto", "leto-caffe-al-mathar"],
  ["ليتو", "leto-caffe-al-mathar"],
  ["robusta", "robusta-bake-al-rawdah"],
  ["Robusta Bake", "robusta-bake-al-rawdah"],
  ["روبيستا", "robusta-bake-al-rawdah"],
  ["محمصة روبيستا بيك", "robusta-bake-al-rawdah"],
] as const) {
  assert(matchCatalogShops(name, listRealShops())[0]?.id === id, `${name} picks ${id} first`);
}
{
  const robusta = listRealShops().find((shop) => shop.id === "robusta-bake-al-rawdah");
  assert(
    robusta?.dineIn === true && robusta?.seatingVerdict?.dineIn === true && robusta?.seatingVerdict?.source === "scout" && robusta?.outdoorSeating == null,
    "Robusta Bake is sit-down by Scout seating verdict (Places gave no dineIn); outdoor unknown",
  );
}
for (const ask of ["bake", "بيك"]) {
  assert(
    !matchCatalogShops(ask, listRealShops()).some((hit) => hit.id === "robusta-bake-al-rawdah"),
    `bare ${ask} does not pin Robusta Bake (SHOP_TOKEN_BLOCK)`,
  );
}
console.log("check-chains: batch J other-adds search ok");
