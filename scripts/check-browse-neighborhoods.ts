import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CITY_LABEL,
  DEFAULT_BROWSE_CITY,
  FEATURED_NEIGHBORHOODS_BY_CITY,
  NEIGHBORHOOD_SORTS,
  POPULAR_NEIGHBORHOODS_BY_CITY,
  RIYADH_FEATURED_NEIGHBORHOODS,
  RIYADH_POPULAR_NEIGHBORHOODS,
  browseNeighborhoodLabel,
  featuredNeighborhoodIds,
  filterNeighborhoodRows,
  homeNeighborhoodCandidates,
  HOME_NEIGHBORHOOD_TOP_N,
  listNeighborhoodRows,
  nearestHomeNeighborhoodIds,
  neighborhoodCafeCount,
  neighborhoodCafeCountLabel,
  neighborhoodDistanceKm,
  neighborhoodsIndexHeading,
  popularNeighborhoodIds,
  resolveHomeNeighborhoods,
  sortNeighborhoodRows,
} from "../lib/browse-neighborhoods";
import { browseNeighborhoodsHintForCity } from "../lib/cities";
import { cityIdFromPin } from "../lib/city-geo";
import { listBrowseDirectoryShops, listRealShops } from "../lib/catalog";
import { copy } from "../lib/copy";
import { directoryNeighborhoods } from "../lib/directory";
import { extractPrimaryDistrict } from "../lib/district-dictionary";
import { NEIGHBORHOODS } from "../lib/neighborhoods";
import { districtPath, neighborhoodsPath } from "../lib/product";
import { matchCatalogShops } from "../lib/shop-name";
import { NEIGHBORHOOD_IDS, type NeighborhoodId } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function readRepo(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

assert(neighborhoodsPath("ar") === "/neighborhoods", "AR view-all path");
assert(neighborhoodsPath("en") === "/en/neighborhoods", "EN view-all path");
assert(DEFAULT_BROWSE_CITY === "riyadh", "default browse city is Riyadh");
assert(
  CITY_LABEL.riyadh.en === "Riyadh" && CITY_LABEL.riyadh.ar === "الرياض",
  "Riyadh city labels",
);

assert(
  RIYADH_FEATURED_NEIGHBORHOODS.join(",") ===
    "hittin,al-malqa,al-nakheel,al-yasmin,olaya,sulimaniyah",
  "Riyadh featured ids start at Hittin",
);
assert(RIYADH_FEATURED_NEIGHBORHOODS.length === 6, "exactly 6 featured pills");
assert(
  FEATURED_NEIGHBORHOODS_BY_CITY.riyadh.join(",") ===
    RIYADH_FEATURED_NEIGHBORHOODS.join(","),
  "featured map is city-keyed",
);
assert(
  featuredNeighborhoodIds("en").join(",") ===
    "hittin,al-malqa,al-nakheel,al-yasmin,olaya,sulimaniyah",
  "EN LTR pills start at Hittin",
);
assert(
  featuredNeighborhoodIds("ar").join(",") ===
    "hittin,al-malqa,al-nakheel,al-yasmin,olaya,sulimaniyah",
  "AR RTL DOM starts at Hittin so حطين is the rightmost start",
);

const AMJAD_POPULAR =
  "hittin,al-malqa,al-takhassusi,olaya,al-yasmin,al-nakheel,al-aqiq,as-sahafah,al-narjis,al-ghadeer,al-arid,al-qirawan,al-rabi,al-wadi,qurtubah,ghirnatah,diplomatic-quarter,diriyah,sulimaniyah,al-mohammadiyah,al-muruj,al-masif,al-mughrizat,al-rawdah,al-hamra,al-yarmouk,al-munsiyah,al-malaz,al-wurud";
assert(
  RIYADH_POPULAR_NEIGHBORHOODS.join(",") === AMJAD_POPULAR,
  "Riyadh Popular follows Amjad's locked order",
);
assert(RIYADH_POPULAR_NEIGHBORHOODS.length === 29, "exactly 29 Popular slots");
assert(
  POPULAR_NEIGHBORHOODS_BY_CITY.riyadh.join(",") ===
    RIYADH_POPULAR_NEIGHBORHOODS.join(","),
  "Popular map is city-keyed",
);
assert(
  popularNeighborhoodIds().join(",") === AMJAD_POPULAR,
  "popularNeighborhoodIds is Amjad's list",
);
assert(
  RIYADH_FEATURED_NEIGHBORHOODS.join(",") !==
    RIYADH_POPULAR_NEIGHBORHOODS.slice(0, 6).join(","),
  "home featured belt is not the Popular prefix",
);

const NEW_POPULAR_DISTRICTS = [
  "al-takhassusi",
  "al-aqiq",
  "al-ghadeer",
  "al-arid",
  "al-qirawan",
  "al-wadi",
  "al-mohammadiyah",
  "al-muruj",
  "al-malaz",
] as const;
const WAVE1_CATALOG_DISTRICTS = [
  "al-takhassusi",
  "al-aqiq",
  "al-ghadeer",
  "al-arid",
  "al-qirawan",
] as const;
const WADI_REFILL_DISTRICTS = ["al-wadi"] as const;
const MURUJ_REFILL_DISTRICTS = ["al-muruj"] as const;
const MOH_REFILL_DISTRICTS = ["al-mohammadiyah"] as const;
const MALAZ_REFILL_DISTRICTS = ["al-malaz"] as const;
const EMPTY_DICTIONARY_DISTRICTS = ["as-suwaidi"] as const;

assert(
  browseNeighborhoodLabel("sulimaniyah", "en") === "As Sulimaniyah",
  "EN Sulimaniyah uses locked As Sulimaniyah",
);
assert(
  browseNeighborhoodLabel("olaya", "en") === "Al Olaya",
  "EN Olaya uses Al Olaya",
);
assert(browseNeighborhoodLabel("hittin", "en") === "Hittin", "EN Hittin label");
assert(browseNeighborhoodLabel("hittin", "ar") === "حطين", "AR Hittin label");
assert(NEIGHBORHOODS.hittin.ar === "حطين", "catalog Hittin Arabic stays حطين");
assert(browseNeighborhoodLabel("al-nakheel", "en") === "An Nakheel", "EN An Nakheel");
assert(browseNeighborhoodLabel("as-sahafah", "en") === "As Sahafah", "EN As Sahafah");
assert(browseNeighborhoodLabel("al-rabi", "en") === "Ar Rabi", "EN Ar Rabi");
assert(browseNeighborhoodLabel("ghirnatah", "en") === "Ghirnatah", "EN Ghirnatah");
assert(browseNeighborhoodLabel("al-rawdah", "en") === "Ar Rawdah", "EN Ar Rawdah");
assert(browseNeighborhoodLabel("al-yarmouk", "en") === "Al Yarmuk", "EN Al Yarmuk");
assert(
  browseNeighborhoodLabel("al-narjis", "en") === "An Narjis",
  "EN An Narjis",
);
assert(
  browseNeighborhoodLabel("al-ghadeer", "en") === "Al Ghadir",
  "EN Al Ghadir",
);
assert(
  browseNeighborhoodLabel("king-fahd", "en") === "King Fahd District",
  "EN King Fahd District",
);
assert(
  browseNeighborhoodLabel("al-shohda", "en") === "Ash Shuhada",
  "EN Ash Shuhada",
);
assert(
  browseNeighborhoodLabel("diplomatic-quarter", "en") === "Diplomatic Quarter",
  "EN Diplomatic Quarter label",
);
assert(
  browseNeighborhoodLabel("al-takhassusi", "en") === "Al Takhassusi",
  "EN Al Takhassusi",
);
assert(
  browseNeighborhoodLabel("al-takhassusi", "ar") === "التخصصي",
  "AR التخصصي",
);

const shops = listBrowseDirectoryShops();
const rowsEn = listNeighborhoodRows("en", shops);
const rowsAr = listNeighborhoodRows("ar", shops);
const live = directoryNeighborhoods(shops);

assert(
  rowsEn.length === live.length,
  "view-all lists every live-with-shops district",
);
assert(rowsAr.length === live.length, "AR view-all lists the same live districts");
assert(
  rowsEn.every((row) => NEIGHBORHOOD_IDS.includes(row.id) && row.cafeCount > 0),
  "view-all rows stay on live catalog ids",
);
assert(
  EMPTY_DICTIONARY_DISTRICTS.every(
    (id) => !rowsEn.some((row) => row.id === id),
  ),
  "0-shop dictionary districts stay out of live browse",
);
assert(
  live.every((id) => rowsEn.some((row) => row.id === id)),
  "view-all still includes every live-with-shops district",
);
assert(
  NEW_POPULAR_DISTRICTS.every((id) => rowsEn.some((row) => row.id === id)),
  "new Popular districts appear on View All",
);
assert(
  !rowsEn.some((row) => /jeddah|obhur|salamah|al marwa|faisaliyah/i.test(row.label)),
  "Jeddah layout names are not live rows",
);
assert(
  rowsEn.every((row) => !("icon" in row)),
  "view-all rows are text-first (no icon field)",
);

for (const row of rowsEn) {
  assert(
    row.cafeCount === neighborhoodCafeCount(row.id, shops),
    `${row.id} count matches catalog`,
  );
  if ((WAVE1_CATALOG_DISTRICTS as readonly string[]).includes(row.id)) {
    const expected = row.id === "al-takhassusi" ? 7 : row.id === "al-ghadeer" ? 9 : 8;
    assert(
      row.cafeCount === expected,
      `${row.id} Wave 1 catalog has ${expected} cafes, got ${row.cafeCount}`,
    );
  } else if ((WADI_REFILL_DISTRICTS as readonly string[]).includes(row.id)) {
    assert(
      row.cafeCount === 3,
      `${row.id} Wadi refill has 3 cafes, got ${row.cafeCount}`,
    );
  } else if ((MURUJ_REFILL_DISTRICTS as readonly string[]).includes(row.id)) {
    assert(
      row.cafeCount === 6,
      `${row.id} Muruj refill has 6 cafes, got ${row.cafeCount}`,
    );
  } else if ((MOH_REFILL_DISTRICTS as readonly string[]).includes(row.id)) {
    assert(
      row.cafeCount === 4,
      `${row.id} Mohammadiyah refill has 4 cafes, got ${row.cafeCount}`,
    );
  } else if ((MALAZ_REFILL_DISTRICTS as readonly string[]).includes(row.id)) {
    assert(
      row.cafeCount === 5,
      `${row.id} Malaz refill has 5 cafes, got ${row.cafeCount}`,
    );
  } else {
    assert(row.cafeCount > 0, `${row.id} has at least one cafe`);
  }
  assert(
    row.href === districtPath(row.id, "en"),
    `${row.id} EN href is the live district route`,
  );
  if (row.centroid) {
    assert(
      Number.isFinite(row.centroid.lat) && Number.isFinite(row.centroid.lng),
      `${row.id} centroid is a real pin`,
    );
  }
}
for (const row of rowsAr) {
  assert(
    row.href === districtPath(row.id, "ar"),
    `${row.id} AR href is the live district route`,
  );
}

const popularEn = sortNeighborhoodRows(rowsEn, "popular", null, "en");
const popularAr = sortNeighborhoodRows(rowsAr, "popular", null, "ar");
const popularLeadEn = popularEn.slice(0, 29);
const popularLeadAr = popularAr.slice(0, 29);
assert(popularLeadEn.length === 29, "Popular lead is exactly Amjad's 29 districts");
assert(popularLeadAr.length === 29, "AR Popular lead is exactly Amjad's 29 districts");
assert(
  popularLeadEn.map((row) => row.id).join(",") === AMJAD_POPULAR,
  "Popular follows Amjad's locked order",
);
assert(
  popularLeadAr.map((row) => row.id).join(",") === AMJAD_POPULAR,
  "AR Popular uses the same locked ids",
);
assert(
  popularLeadEn.every((row) =>
    (RIYADH_POPULAR_NEIGHBORHOODS as readonly NeighborhoodId[]).includes(row.id),
  ),
  "Popular lead contains no unranked districts",
);
assert(popularEn[0]?.id === "hittin", "Popular lead is Hittin");
assert(popularEn[2]?.id === "al-takhassusi", "Popular #3 is Al Takhassusi");
assert(popularEn[5]?.id === "al-nakheel", "Popular #6 is An Nakheel");
assert(popularEn[16]?.id === "diplomatic-quarter", "Popular #17 is Diplomatic Quarter");
assert(popularEn[28]?.id === "al-wurud", "Popular #29 is Al Wurud");
assert(
  popularEn.some((row) => row.id === "al-mathar"),
  "Popular tail includes live al-mathar",
);
assert(
  popularAr.some((row) => row.id === "al-mathar"),
  "AR Popular tail includes المعذر",
);
assert(
  popularEn.some((row) => row.id === "at-taawun"),
  "Popular tail includes live at-taawun",
);
assert(
  popularAr.some((row) => row.id === "at-taawun"),
  "AR Popular tail includes التعاون",
);
assert(
  rowsEn.some((row) => row.id === "al-mathar"),
  "view-all rows include al-mathar",
);
assert(
  rowsEn.some((row) => row.id === "at-taawun"),
  "view-all rows include at-taawun",
);
assert(
  rowsAr.some((row) => row.label === "التعاون"),
  "AR view-all label is التعاون",
);
assert(
  rowsAr.some((row) => row.label === "المعذر"),
  "AR view-all label is المعذر",
);

const az = sortNeighborhoodRows(rowsEn, "az", null, "en");
assert(
  az.every((row, index) => {
    const next = az[index + 1];
    if (!next) return true;
    return row.label.localeCompare(next.label, "en") <= 0;
  }),
  "A–Z sort is alphabetical",
);
assert(az.length === rowsEn.length, "A–Z still lists every catalog district");
assert(
  az.some((row) => row.id === "kafd"),
  "unranked districts remain on A–Z",
);
assert(
  az.some((row) => row.id === "al-mathar"),
  "A–Z includes al-mathar",
);
assert(
  az.some((row) => row.id === "at-taawun"),
  "A–Z includes at-taawun",
);
assert(
  az.some((row) => row.id === "al-mursalat"),
  "A–Z includes al-mursalat",
);
assert(
  az.some((row) => row.id === "al-murabba"),
  "A–Z includes al-murabba",
);
assert(az.some((row) => row.id === "as-salam"), "A–Z includes as-salam");
assert(az.some((row) => row.id === "badr"), "A–Z includes badr");
assert(az.some((row) => row.id === "al-janadriyyah"), "A–Z includes al-janadriyyah");
assert(az.some((row) => row.id === "namar"), "A–Z includes namar");
assert(az.some((row) => row.id === "kkia"), "A–Z includes kkia");
assert(az.some((row) => row.id === "al-jazirah"), "A–Z includes al-jazirah");
assert(az.some((row) => row.id === "an-nasim-ash-sharqi"), "A–Z includes an-nasim-ash-sharqi");
assert(az.some((row) => row.id === "an-nasim"), "A–Z includes an-nasim");
assert(az.some((row) => row.id === "shubra"), "A–Z includes shubra");
assert(az.some((row) => row.id === "manfuha"), "A–Z includes manfuha");
assert(az.some((row) => row.id === "tuwaiq"), "A–Z includes tuwaiq");
assert(
  !az.some((row) => row.id === "as-suwaidi"),
  "A–Z excludes 0-shop as-suwaidi",
);
assert(az.length === live.length, "A–Z is the live-with-shops districts");
assert(az.length === 66, "A–Z is the 66 live catalog districts");

const nearbyNoOrigin = sortNeighborhoodRows(rowsEn, "nearby", null, "en");
assert(
  nearbyNoOrigin.map((row) => row.id).join(",") ===
    az.map((row) => row.id).join(","),
  "Nearby without a real origin is A–Z, not Popular",
);
assert(
  nearbyNoOrigin.slice(0, 5).map((row) => row.id).join(",") !==
    popularEn.slice(0, 5).map((row) => row.id).join(","),
  "Nearby first five must not copy Popular first five",
);

const withCentroid = rowsEn.find((row) => row.id === "al-hamra" && row.centroid) ??
  rowsEn.find((row) => row.centroid);
if (withCentroid?.centroid) {
  const far = { lat: withCentroid.centroid.lat + 0.4, lng: withCentroid.centroid.lng };
  const nearby = sortNeighborhoodRows(rowsEn, "nearby", withCentroid.centroid, "en");
  const farSort = sortNeighborhoodRows(rowsEn, "nearby", far, "en");
  assert(nearby[0]?.id === withCentroid.id, "Nearby sort uses real centroids");
  assert(
    nearby.slice(0, 5).map((row) => row.id).join(",") !==
      popularEn.slice(0, 5).map((row) => row.id).join(","),
    "real Nearby first five must not copy Popular",
  );
  assert(
    neighborhoodDistanceKm(withCentroid, withCentroid.centroid) === 0,
    "distance at the centroid is zero",
  );
  assert(
    neighborhoodDistanceKm(withCentroid, null) === null,
    "no fake distance without origin",
  );
  assert(farSort[0]?.id === withCentroid.id || farSort.length === nearby.length, "nearby stays complete");
}

const hittinCount = neighborhoodCafeCount("hittin", shops);
assert(
  neighborhoodCafeCountLabel(hittinCount, "en").includes("café"),
  "EN count uses café",
);
assert(
  neighborhoodCafeCountLabel(hittinCount, "ar").includes("قهاوي") ||
    neighborhoodCafeCountLabel(1, "ar") === "قهوة واحدة",
  "AR count uses قهاوي",
);

assert(
  filterNeighborhoodRows(rowsEn, "takhassusi").some(
    (row) => row.id === "al-takhassusi",
  ),
  "search finds Al Takhassusi",
);
assert(
  filterNeighborhoodRows(rowsAr, "التخصصي").some(
    (row) => row.id === "al-takhassusi",
  ),
  "search finds التخصصي",
);
assert(
  filterNeighborhoodRows(rowsEn, "olaya").some((row) => row.id === "olaya"),
  "search finds Olaya",
);
assert(
  filterNeighborhoodRows(rowsAr, "حطين").some((row) => row.id === "hittin"),
  "search finds حطين",
);
assert(
  filterNeighborhoodRows(rowsEn, "mathar").some((row) => row.id === "al-mathar"),
  "search finds Al Mathar",
);
assert(
  filterNeighborhoodRows(rowsAr, "المعذر").some((row) => row.id === "al-mathar"),
  "search finds المعذر",
);
assert(
  filterNeighborhoodRows(rowsEn, "taawun").some((row) => row.id === "at-taawun"),
  "search finds At Taawun",
);
assert(
  filterNeighborhoodRows(rowsAr, "التعاون").some((row) => row.id === "at-taawun"),
  "search finds التعاون",
);
assert(
  filterNeighborhoodRows(rowsEn, "zzzz-not-a-hood").length === 0,
  "unknown search is empty",
);

assert(copy.browseNeighborhoods.ar === "تصفح حسب الحي", "locked AR heading");
assert(
  copy.browseNeighborhoodsHint.ar === "اكتشف القهاوي حولك، حي بحي.",
  "locked AR subtitle",
);
assert(copy.viewAllNeighborhoods.ar === "عرض الكل", "locked AR view-all CTA");
assert(copy.browseNeighborhoods.en === "Browse by Neighborhood", "locked EN heading");
assert(
  copy.browseNeighborhoodsHint.en ===
    "Coffee around Riyadh, neighborhood by neighborhood.",
  "locked EN subtitle",
);
assert(copy.viewAllNeighborhoods.en === "View all", "locked EN view-all CTA");
assert(copy.neighborhoodsSearch.en === "Search neighborhoods...", "locked EN search");
assert(copy.neighborhoodsSearch.ar === "ابحث عن الأحياء...", "locked AR search");
assert(copy.neighborhoodsSortNearby.en === "Nearby", "EN Nearby sort");
assert(copy.neighborhoodsSortNearby.ar === "الأقرب إليك", "AR Nearby sort");
assert(copy.neighborhoodsSortPopular.en === "Popular", "EN Popular sort");
assert(copy.neighborhoodsSortPopular.ar === "الأكثر شيوعاً", "AR Popular sort");
assert(copy.neighborhoodsSortAz.en === "A–Z", "EN A–Z sort");
assert(copy.neighborhoodsSortAz.ar === "أ–ي", "AR A–Y sort");
assert(
  neighborhoodsIndexHeading("en") === "Riyadh Neighborhoods",
  "view-all heading is city-dynamic Riyadh",
);
assert(
  neighborhoodsIndexHeading("ar") === "أحياء الرياض",
  "AR view-all heading is أحياء الرياض",
);
assert(
  NEIGHBORHOOD_SORTS.join(",") === "nearby,popular,az",
  "sort order is Nearby / Popular / A–Z",
);
assert(
  !/Jeddah|جدة/.test(
    [
      copy.neighborhoodsIndex.ar,
      copy.neighborhoodsIndex.en,
      copy.neighborhoodsIndexHint.ar,
      copy.neighborhoodsIndexHint.en,
      copy.browseNeighborhoodsHint.en,
    ].join(" "),
  ),
  "copy stays Riyadh until Jeddah is live",
);

const homeLanding = readRepo("components/home-landing.tsx");
assert(
  homeLanding.includes("BrowseNeighborhoods") && homeLanding.includes("bareHome"),
  "bare home mounts Browse by Neighborhood",
);
assert(
  homeLanding.includes("DocumentLocale"),
  "home pins html lang/dir so /en cannot inherit RTL",
);
assert(
  !homeLanding.includes("Soft Places") && !homeLanding.includes("ثلاث الليلة"),
  "Soft Places stays parked on home landing",
);

const product = readRepo("lib/product.ts");
const registry = readRepo("lib/discovery-categories.ts");
assert(registry.includes('en: "With friends"'), "home chip label is With friends");
assert(registry.includes('ar: "مع الأصحاب"'), "AR home chip label is مع الأصحاب");
assert(!product.includes("Good for a date"), "date chip label is gone from product");
assert(!registry.includes("Good for a date"), "date chip label is gone from registry");

const directory = readRepo("components/shop-directory.tsx");
assert(
  !directory.includes("allDistricts") &&
    !directory.includes('className="mt-3 flex flex-wrap gap-1.5"') &&
    !directory.includes("districtPath"),
  "Most Popular no longer mounts the old district-chip wrap",
);
assert(
  !readRepo("components/district-page.tsx").includes("allDistricts"),
  "district pages do not resurrect the district-chip wrap",
);

const browse = readRepo("components/browse-neighborhoods.tsx");
assert(browse.includes("overflow-x-auto"), "featured row scrolls");
assert(browse.includes("flex-nowrap"), "featured row does not wrap");
assert(browse.includes("rounded-full"), "featured items are pills");
assert(browse.includes("data-browse-pills"), "homepage strip is the pill band");
assert(browse.includes("data-browse-scroll"), "circular scroll chevron is present");
assert(browse.includes("flex items-center gap-2"), "chevron is a flex sibling of the scroller");
assert(browse.includes("min-w-0 flex-1 overflow-x-auto"), "pills scroll; chevron stays outside overflow");
assert(browse.includes("shrink-0 items-center justify-center rounded-full"), "chevron stays circular and unclipped");
assert(!browse.includes("absolute end-4"), "chevron is not overlayed inside the overflow clip");
assert(
  browse.indexOf("<ViewAllLink language={language} city={trackCity} />") <
    browse.indexOf("browseNeighborhoodsHintForCity(language, resolved.cityId)"),
  "subtitle sits under the title row so EN stays one line",
);
assert(browse.includes('source: "home_pill"') || browse.includes('"home_pill"'), "home pills send source=home_pill");
assert(browse.includes("neighborhoods_view_all"), "View all CTA fires neighborhoods_view_all");
assert(browse.includes("city"), "browse events carry city");
assert(
  browse.includes("resolveHomeNeighborhoods") &&
    browse.includes("useFreshHomeOrigin") &&
    !browse.includes("popularNeighborhoodIds") &&
    !browse.includes("useVisitorLocation("),
  "homepage strip ranks by a fresh fix, not Popular or the shared snapshot",
);
assert(!browse.includes("NeighborhoodIcon"), "homepage strip has no landmark icons");
assert(!browse.includes("aspect-square"), "homepage strip is not the card belt");
assert(!browse.includes("bg-blush"), "no default selected Hittin fill");
assert(!browse.includes("BROWSE_DEMO_SELECTED"), "no demo selected card");
assert(!browse.includes("<img"), "no photos on neighborhood pills");
assert(!/Koofi/i.test(browse), "browse section must not say Koofi");
assert(
  browse.includes('dir={rtl ? "rtl" : "ltr"}'),
  "AR browse section is a true RTL twin",
);
assert(
  browse.includes("border-y border-line"),
  "subtle beige dividers above and below the strip",
);
assert(
  browse.includes('data-view-all-cta={language}') ||
    browse.includes('data-view-all-cta={language}'),
  "view-all is a lightweight text CTA",
);
assert(!browse.includes("rounded-full border border-line bg-foam px-3 py-1.5 text-xs"), "CTA is not the old fat pill");
assert(
  browse.includes('point={rtl ? "left" : "right"}'),
  "EN CTA arrow points right; AR CTA arrow points left",
);
assert(
  browse.indexOf('id="browse-neighborhoods"') <
    browse.indexOf("<ViewAllLink language={language} city={trackCity} />"),
  "heading precedes CTA in DOM; dir places title and View all",
);

const viewAll = readRepo("components/neighborhoods-page.tsx");
assert(
  viewAll.includes('useState<NeighborhoodSort>("az")'),
  "View All defaults to A–Z so al-mathar is on the first paint",
);
assert(viewAll.includes("neighborhood-search"), "view-all has client search");
assert(viewAll.includes("neighborhoodCafeCountLabel"), "view-all uses real counts");
assert(viewAll.includes("data-neighborhood-sorts"), "view-all has sort pills");
assert(viewAll.includes("nearby"), "Nearby sort exists");
assert(viewAll.includes("usePeekVisitorLocation"), "Nearby uses real visitor location");
assert(
  viewAll.includes("sortNeighborhoodRows(filtered, sort, origin, language, city)"),
  "view-all Popular filter is city-keyed",
);
assert(viewAll.includes("formatDistanceKm"), "distance is formatted from real km");
assert(!viewAll.includes("NeighborhoodIcon"), "view-all rows have no icons");
assert(!/Koofi/i.test(viewAll), "view-all must not say Koofi");
assert(!/Jeddah|جدة/.test(viewAll), "view-all UI is not the Jeddah mock names");
assert(
  viewAll.includes('dir={language === "ar" ? "rtl" : "ltr"}'),
  "view-all page is RTL-native on AR",
);
assert(
  viewAll.includes('language === "ar" ? (') &&
    viewAll.includes('<path d="M6 3.2 11.2 8 6 12.8" />'),
  "AR view-all row chevron points left; back control stays",
);
assert(viewAll.includes('source: "view_all"'), "view-all rows send source=view_all");
assert(viewAll.includes("neighborhoods_sort"), "user sort taps fire neighborhoods_sort");
assert(viewAll.includes("trackNeighborhoodsSearch"), "search changes fire neighborhoods_search");
assert(viewAll.includes("400"), "search is debounced ~400ms");
assert(
  !viewAll.includes('trackEvent(\n      "neighborhoods_sort"') ||
    viewAll.indexOf("function pickSort") < viewAll.indexOf("neighborhoods_sort"),
  "sort analytics live on the user pickSort path",
);
assert(
  !viewAll
    .slice(
      viewAll.indexOf("if (visitor.status === \"ready\")"),
      viewAll.indexOf("function pickSort"),
    )
    .includes("neighborhoods_sort"),
  "auto-geo Nearby does not fire neighborhoods_sort",
);

assert(
  readRepo("app/neighborhoods/page.tsx").includes('language="ar"'),
  "AR view-all route",
);
assert(
  readRepo("app/en/neighborhoods/page.tsx").includes('language="en"'),
  "EN view-all route",
);

const chat = readRepo("components/chat.tsx");
assert(chat.includes("MeetHalfwayCard"), "بيننا utility card stays");
assert(chat.includes("VibeChips"), "4×2 vibe chips stay");
assert(
  chat.includes("{selectedChipId !== null ? (") && chat.includes("<VibeChips"),
  "district results do not remount the home 4×2 strip",
);
assert(chat.includes("HomeHero"), "P0 opener stays");
assert(!chat.includes("BrowseNeighborhoods"), "browse is not inside chat chrome");

const featured = new Set<NeighborhoodId>(RIYADH_FEATURED_NEIGHBORHOODS);
assert(featured.size === 6, "featured ids are unique");
const popularSet = new Set<NeighborhoodId>(RIYADH_POPULAR_NEIGHBORHOODS);
assert(popularSet.size === 29, "Popular ids are unique");

const catalog = listRealShops();
for (const id of NEW_POPULAR_DISTRICTS) {
  const place = NEIGHBORHOODS[id];
  assert(place, `${id} has a dictionary row`);
  assert(place.ar !== "هيتين", `${id} must not use هيتين`);
  assert(
    extractPrimaryDistrict(place.en) === id,
    `${id} EN "${place.en}" did not extract`,
  );
  assert(
    extractPrimaryDistrict(place.ar) === id,
    `${id} AR "${place.ar}" did not extract`,
  );
  assert(extractPrimaryDistrict(place.id) === id, `${id} slug did not extract`);
  for (const alias of place.aliases) {
    assert(
      extractPrimaryDistrict(alias) === id,
      `${id} alias "${alias}" did not extract`,
    );
    assert(
      matchCatalogShops(alias, catalog).length === 0,
      `حي alias "${alias}" must not name-match a shop`,
    );
  }
}

assert(HOME_NEIGHBORHOOD_TOP_N === 5, "home proximity shortlist is 5");
assert(
  browseNeighborhoodsHintForCity("en", "riyadh") ===
    "Coffee around Riyadh, neighborhood by neighborhood.",
  "EN subtitle keeps the Riyadh sentence",
);
assert(
  browseNeighborhoodsHintForCity("en", "jeddah") ===
    "Coffee around Jeddah, neighborhood by neighborhood.",
  "EN subtitle city is dynamic",
);
assert(
  browseNeighborhoodsHintForCity("ar", "jeddah") === "اكتشف القهاوي حولك، حي بحي.",
  "AR subtitle stays the locked sentence",
);

const riyadhCandidates = homeNeighborhoodCandidates(shops, "riyadh");
assert(
  riyadhCandidates.length === live.length,
  "home candidates are the live Riyadh districts",
);
assert(
  riyadhCandidates.every((row) => row.city === "riyadh"),
  "home candidates stay on Riyadh",
);
assert(
  riyadhCandidates.filter((row) => row.centroid).length >= HOME_NEIGHBORHOOD_TOP_N,
  "enough official-pin centroids to fill the shortlist",
);
assert(
  !riyadhCandidates.some((row) => row.id === "as-suwaidi"),
  "0-shop districts stay out of the home rail",
);

const hittinRow = riyadhCandidates.find((row) => row.id === "hittin");
const rabwahRow = riyadhCandidates.find((row) => row.id === "al-rabwah");
if (!hittinRow?.centroid || !rabwahRow?.centroid) {
  throw new Error("Hittin and Ar Rabwah have centroids");
}
const hittinArea = {
  lat: hittinRow.centroid.lat + 0.004,
  lng: hittinRow.centroid.lng - 0.003,
};
const rabwahArea = {
  lat: rabwahRow.centroid.lat - 0.004,
  lng: rabwahRow.centroid.lng + 0.003,
};
const nearHittin = resolveHomeNeighborhoods({
  candidates: riyadhCandidates,
  origin: hittinArea,
  locationReady: true,
  selectedCityId: "riyadh",
});
const nearRabwah = resolveHomeNeighborhoods({
  candidates: riyadhCandidates,
  origin: rabwahArea,
  locationReady: true,
  selectedCityId: "riyadh",
});
assert(nearHittin.mode === "proximity" && nearRabwah.mode === "proximity", "GPS uses proximity");
assert(nearHittin.ids.length === HOME_NEIGHBORHOOD_TOP_N, "Hittin-area shortlist is top 5");
assert(nearRabwah.ids.length === HOME_NEIGHBORHOOD_TOP_N, "Rabwah-area shortlist is top 5");
assert(nearHittin.ids[0] === "hittin", "Hittin-area first pill is the nearest live neighborhood");
assert(
  nearRabwah.ids[0] === "al-rabwah",
  "Rabwah-area first pill is Ar Rabwah, not the featured belt",
);
assert(
  nearHittin.ids.join(",") !== nearRabwah.ids.join(","),
  "different Riyadh fixes produce different shortlists",
);
assert(
  nearHittin.ids.join(",") ===
    nearestHomeNeighborhoodIds(riyadhCandidates, "riyadh", hittinArea).join(","),
  "EN and the ranker share one id list",
);
assert(
  resolveHomeNeighborhoods({
    candidates: riyadhCandidates,
    origin: rabwahArea,
    locationReady: true,
    selectedCityId: "riyadh",
  }).ids.join(",") === nearRabwah.ids.join(","),
  "a second resolve keeps the same ids for AR labels",
);
assert(
  nearHittin.ids.every((id, index) => browseNeighborhoodLabel(id, "ar") !== "" && index >= 0),
  "AR labels exist for the same proximity ids",
);
assert(
  nearRabwah.ids.join(",") !==
    featuredNeighborhoodIds("en").slice(0, HOME_NEIGHBORHOOD_TOP_N).join(","),
  "proximity is not the featured belt prefix",
);
assert(
  nearRabwah.ids.join(",") !==
    RIYADH_POPULAR_NEIGHBORHOODS.slice(0, HOME_NEIGHBORHOOD_TOP_N).join(","),
  "proximity is not Popular",
);

const denied = resolveHomeNeighborhoods({
  candidates: riyadhCandidates,
  origin: null,
  locationReady: false,
  selectedCityId: "riyadh",
});
assert(denied.mode === "fallback", "denied location uses the city fallback");
assert(
  denied.ids.join(",") === featuredNeighborhoodIds("en", "riyadh").join(","),
  "fallback keeps the existing featured belt",
);
assert(denied.ids.length === 6, "fallback is not clipped to top 5");
assert(
  resolveHomeNeighborhoods({
    candidates: riyadhCandidates,
    origin: { lat: 51.5, lng: -0.12 },
    locationReady: true,
    selectedCityId: "riyadh",
  }).ids.join(",") === denied.ids.join(","),
  "unusable origin keeps the city fallback",
);

const jeddahPin = { lat: 21.5433, lng: 39.1728 };
const dammamPin = { lat: 26.4207, lng: 50.0888 };
const abhaPin = { lat: 18.2465, lng: 42.5117 };
assert(cityIdFromPin(jeddahPin) === "jeddah", "Jeddah fix maps to Jeddah");
assert(cityIdFromPin(dammamPin) === "dammam", "Dammam fix maps to Dammam");
assert(cityIdFromPin(hittinArea) === "riyadh", "Hittin-area fix maps to Riyadh");
assert(cityIdFromPin(abhaPin) === null, "a KSA fix outside the metros is not Riyadh");
const jeddahGps = resolveHomeNeighborhoods({
  candidates: riyadhCandidates,
  origin: jeddahPin,
  locationReady: true,
  selectedCityId: "riyadh",
});
assert(jeddahGps.cityId === "jeddah" && jeddahGps.mode === "proximity", "Jeddah GPS selects Jeddah");
assert(jeddahGps.ids.length === 0, "Jeddah GPS does not receive Riyadh pills");
assert(
  resolveHomeNeighborhoods({
    candidates: riyadhCandidates,
    origin: dammamPin,
    locationReady: true,
    selectedCityId: "riyadh",
  }).ids.length === 0,
  "Dammam GPS does not receive Riyadh pills",
);
assert(
  resolveHomeNeighborhoods({
    candidates: riyadhCandidates,
    origin: abhaPin,
    locationReady: true,
    selectedCityId: "riyadh",
  }).ids.length === 0,
  "a fix outside every metro does not borrow Riyadh",
);

const jeddahCandidates = [
  {
    id: "hittin" as const,
    city: "jeddah" as const,
    centroid: { lat: 21.55, lng: 39.16 },
  },
  {
    id: "al-rabwah" as const,
    city: "jeddah" as const,
    centroid: { lat: 21.6, lng: 39.3 },
  },
  ...riyadhCandidates,
];
const jeddahSupported = resolveHomeNeighborhoods({
  candidates: jeddahCandidates,
  origin: jeddahPin,
  locationReady: true,
  selectedCityId: "riyadh",
});
assert(
  jeddahSupported.ids[0] === "hittin" &&
    jeddahSupported.ids.length === 2 &&
    jeddahSupported.ids.every((id) =>
      jeddahCandidates.some((row) => row.city === "jeddah" && row.id === id),
    ),
  "when Jeddah has live rows, GPS ranks those rows only",
);
assert(
  !jeddahSupported.ids.some((id) =>
    riyadhCandidates.some((row) => row.id === id) &&
    !jeddahCandidates.some((row) => row.city === "jeddah" && row.id === id),
  ),
  "supported Jeddah does not mix in Riyadh districts",
);

const tied = nearestHomeNeighborhoodIds(
  [
    { id: "olaya", city: "riyadh", centroid: { lat: 24.7, lng: 46.7 } },
    { id: "hittin", city: "riyadh", centroid: { lat: 24.7, lng: 46.7 } },
  ],
  "riyadh",
  { lat: 24.7, lng: 46.7 },
);
assert(tied.join(",") === "hittin,olaya", "equal distance breaks on stable id, not label");

const fresh = readRepo("lib/fresh-visitor-origin.ts");
assert(
  fresh.includes("enableHighAccuracy: true") &&
    fresh.includes("maximumAge: 0") &&
    fresh.includes("isUsableVisitorOrigin") &&
    !fresh.includes("maximumAge: 60_000") &&
    !fresh.includes("shared.lat") &&
    !fresh.includes("snapshot.lat"),
  "home rail reads a fresh GPS fix and does not copy the shared snapshot",
);
assert(fresh.includes("Soft Places stays parked"), "Soft Places stays parked on the fresh read");
assert(
  readRepo("lib/browse-neighborhoods.ts").includes("Soft Places stays parked"),
  "Soft Places stays parked on the home shortlist",
);
assert(
  browse.includes('dir={rtl ? "rtl" : "ltr"}') &&
    browse.includes("districtPath(id, language)") &&
    browse.includes("neighborhoodsPath(language)") &&
    browse.includes("data-browse-scroll") &&
    browse.includes("NeighborhoodRailArrow") &&
    !browse.includes("scrollBy") &&
    !browse.includes('type="button"'),
  "pills open the district route; View all and the circle arrow open the index",
);
assert(
  browse.includes('href={neighborhoodsPath(language)}') &&
    browse.includes("data-browse-scroll") &&
    browse.indexOf("data-browse-scroll") > browse.indexOf("function NeighborhoodRailArrow"),
  "circle arrow links to the neighborhoods index and is not a district",
);
assert(!browse.includes("Soft Places"), "Soft Places stays parked on the home rail");
assert(
  !readRepo("lib/city-geo.ts").includes("Soft Places"),
  "city boxes are not Soft Places",
);

console.log(
  `check-browse-neighborhoods: ok (${rowsEn.length} catalog districts, ${live.length} with cafes, ${hittinCount} Hittin cafes)`,
);
console.log(
  `home proximity smoke: Hittin-area first=${nearHittin.ids.join(" > ")} | Rabwah-area first=${nearRabwah.ids.join(" > ")}`,
);
