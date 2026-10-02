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
  discoveryShopsFrom,
  districtListingFrom,
  getShop,
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
  isHalfwayEligible(starbucks),
  "a dine-in chain would pass the sit-down gate on its own",
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
  districtListingFrom(fixtures, "namar").map((shop) => shop.id).join(",") === "dunkin-namar",
  "drive-through is the page only when the district has no listing shops",
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
    "starbucks,dunkin,mccafe,barns,krispy-kreme,peets,dr-cafe,java,24cafe",
  "registry is the mass-market set",
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
    "dc92747be581e99b85a7478c6eb92b4e68f3efbaa3c684715e0e3c31e01c29a5",
  "district copy with zero chains is byte-identical to main",
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

console.log("check-chains: ok");
