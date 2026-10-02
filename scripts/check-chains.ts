/**
 * Chain infrastructure. Fixtures only — catalog.json is not the subject.
 * Live counts stay put because no catalog row is tagged isChain.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { districtArMeta, districtArMarkdown, chainDistrictHereIntroAr, chainDistrictMetaAr } from "../lib/ar-content";
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
  discoveryShopsFrom,
  districtListingFrom,
  getShop,
  isListingShop,
  listingShopsFrom,
  listBrowseDirectoryShops,
  listDirectoryShopsForDistrict,
  listDiscoveryShops,
  listDriveThroughDirectoryShops,
  listListingShops,
  listRealShops,
  bakedPopularityFor,
  specialtyDistrictIdsFrom,
} from "../lib/catalog";
import { listLiveCatalogDistrictIds, listLiveDistrictIds } from "../lib/district-dictionary";
import { sortDistrictCafes } from "../lib/district-cafe-sort";
import type { DirectoryShop } from "../lib/directory";
import {
  chainDistrictHereIntroEn,
  chainDistrictMetaEn,
  districtEnMarkdown,
  districtEnMeta,
} from "../lib/en-content";
import { isHalfwayEligible, filterHalfwayEligible } from "../lib/halfway-eligibility";
import { rankByPopularity } from "../lib/district-rank";
import { listPopularDirectoryShops } from "../lib/most-popular";
import { pickCafes } from "../lib/picker";
import { dedupeSameBrand, shopBrandKey } from "../lib/shop-brand";
import { matchCatalogShops } from "../lib/shop-name";
import { buildLlmsTxt, listPublicShops, publicShopRecord } from "../lib/structured-data";
import {
  CHAIN_POPULARITY_BASE,
  TIKTOK_NEUTRAL_BONUS,
  chainPopularityIndex,
} from "../lib/tiktok-popularity";
import type { NeighborhoodId, Shop } from "../lib/types";

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
  districtListingFrom([localDriveOnly], "al-falah").length === 0,
  "an empty listing does not fall back to a drive-through lane",
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
  "an empty listing does not fall back to a pickup-only row",
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
  "an empty listing does not fall back to a non-sit-down row",
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
assert(!liveJava?.isChain && !liveDr?.isChain && !live24?.isChain, "existing rows are not tagged");

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
    "starbucks,dunkin,mccafe,barns,peets,dr-cafe,java,24cafe,shqaf,coffee-day,kyan,dancafe",
  "registry is the mass-market set",
);
assert(!isChainBrandId("krispy-kreme"), "Krispy Kreme is not a chain brand");
assert(isChainBrandId("shqaf") && CHAIN_BRANDS.shqaf.nameAr === "شقفه", "Shqaf is شقفه");
assert(isChainBrandId("coffee-day") && CHAIN_BRANDS["coffee-day"].logo === null, "Coffee Day has no invented logo");
assert(isChainBrandId("kyan") && CHAIN_BRANDS.kyan.nameAr === "كيان", "Kyan is كيان");
assert(isChainBrandId("dancafe") && CHAIN_BRANDS.dancafe.nameAr === "دان كافيه", "Dancafe is دان كافيه");
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

assert(listDiscoveryShops().length === 354, "specialty discovery stays 354");
assert(listRealShops().length === 422, "catalog stays 422");
assert(listLiveDistrictIds().length === 52, "specialty districts stay 52");
assert(listLiveCatalogDistrictIds().length === 69, "catalog districts stay 69");
assert(listDriveThroughDirectoryShops().length === 78, "drive-through stays 78");
assert(listListingShops().length === 354, "no dine-in chains in the live catalog");
assert(listPublicShops().length === 354, "public list stays the specialty directory");
assert(listBrowseDirectoryShops().length === 372, "browse rows stay put with zero chains");
assert(
  listDiscoveryShops().every((shop) => !shop.isChain),
  "no live discovery row is tagged",
);
assert(
  listDirectoryShopsForDistrict("al-masif").length === 10,
  "Al Masif listing is unchanged",
);
assert(
  listDirectoryShopsForDistrict("al-aziziyah").map((shop) => shop.id).join(",") ===
    "waqar-al-aziziyah",
  "Al Aziziyah listing is unchanged",
);

assert(
  districtEnMeta("al-aziziyah") ===
    "One cafe in Al Aziziyah on wain.lol — a Riyadh neighborhood list including Waqar, with a Maps link.",
  "Al Aziziyah EN meta is unchanged",
);
assert(
  districtArMeta("al-aziziyah") ===
    "قهوة وحدة بالعزيزية على wain.lol — قائمة حي فيها وقار، وعليها رابط قوقل ماب.",
  "Al Aziziyah AR meta is unchanged",
);
assert(
  districtEnMeta("al-masif") ===
    "Ten cafes in Al Masif on wain.lol — a Riyadh neighborhood list, with Maps links.",
  "Al Masif EN meta is unchanged",
);
assert(
  districtEnMeta("olaya") ===
    "27 cafes in Al Olaya on wain.lol — a Riyadh neighborhood list, with Maps links.",
  "Al Olaya EN meta is unchanged",
);
assert(
  chainDistrictMetaEn("Al Olaya", 4) ===
    "Four cafes in Al Olaya on wain.lol — local specialty plus chain branches, each with a Maps link.",
  "EN chain meta template",
);
assert(
  chainDistrictHereIntroEn("Al Olaya", 4, 3, 1) ===
    "There are **four** cafes from Al Olaya on the list today — three local, one chain branches:",
  "EN chain hereIntro template",
);
assert(
  chainDistrictMetaAr("العليا", 4) ===
    "أربع قهاوي بالعليا على wain.lol — المحلية المختصة ومعها فروع السلاسل، وكل وحدة عليها رابط قوقل ماب.",
  "AR chain meta template",
);
assert(
  chainDistrictHereIntroAr("العليا", 4, 3, 1) ===
    "فيه **أربع** قهاوي من العليا بالقائمة اليوم — ثلاث محلية ووحدة فروع سلاسل:",
  "AR chain hereIntro template",
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
assert(
  createHash("sha256").update(copyBlob).digest("hex") ===
    "3ef3134c58456ec4ff710f374f76cc4cae1c79634acaccdd8d6e7650ad28267e",
  "district copy hash after the empty-listing fallback",
);
assert(
  !copyBlob.includes("Zero cafes") && !copyBlob.includes("صفر"),
  "a total of 0 never says Zero or صفر",
);
const emptyAfterFallback = [
  "al-mursalat",
  "al-murabba",
  "as-salam",
  "ghubairah",
  "al-wisham",
  "al-hazm",
  "al-andalus",
  "al-khaleej",
  "ar-rimal",
  "al-janadriyyah",
  "namar",
  "kkia",
  "al-jazirah",
  "an-nasim",
  "shubra",
  "manfuha",
  "tuwaiq",
] as const;
assert(
  emptyAfterFallback.every((id) => listDirectoryShopsForDistrict(id).length === 0),
  "drive-through-only districts stay generated and list no rows",
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
assert(
  !copyBlob.includes("local specialty plus chain branches"),
  "chain meta wording stays off the live site",
);
assert(
  !copyBlob.includes("فروع سلاسل"),
  "Arabic chain wording stays off the live site",
);
const llms = buildLlmsTxt();
assert(
  createHash("sha256").update(llms).digest("hex") ===
    "4e823f4d6a294980659b713803d6286ccdfd45adafa22e815ea7f1e8b1a6e738",
  "llms.txt is identical with no chains",
);
assert(!llms.includes("chain"), "llms.txt does not mention chains");

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
      ? chainDistrictMetaEn("District", page.length)
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

console.log("check-chains: ok");
