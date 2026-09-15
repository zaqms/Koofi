import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CITY_LABEL,
  DEFAULT_BROWSE_CITY,
  FEATURED_NEIGHBORHOODS_BY_CITY,
  NEIGHBORHOOD_SORTS,
  RIYADH_FEATURED_NEIGHBORHOODS,
  browseNeighborhoodLabel,
  featuredNeighborhoodIds,
  filterNeighborhoodRows,
  listNeighborhoodRows,
  neighborhoodCafeCount,
  neighborhoodCafeCountLabel,
  neighborhoodDistanceKm,
  neighborhoodsIndexHeading,
  sortNeighborhoodRows,
} from "../lib/browse-neighborhoods";
import { listDirectoryShops } from "../lib/catalog";
import { copy } from "../lib/copy";
import { directoryNeighborhoods } from "../lib/directory";
import { districtPath, neighborhoodsPath } from "../lib/product";
import type { NeighborhoodId } from "../lib/types";

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

assert(
  browseNeighborhoodLabel("sulimaniyah", "en") === "Al Sulaymaniyah",
  "EN Sulimaniyah uses Al Sulaymaniyah",
);
assert(
  browseNeighborhoodLabel("olaya", "en") === "Al Olaya",
  "EN Olaya uses Al Olaya",
);
assert(browseNeighborhoodLabel("hittin", "en") === "Hittin", "EN Hittin label");
assert(browseNeighborhoodLabel("hittin", "ar") === "حطين", "AR Hittin label");

const shops = listDirectoryShops();
const rowsEn = listNeighborhoodRows("en", shops);
const rowsAr = listNeighborhoodRows("ar", shops);
const live = directoryNeighborhoods(shops);

assert(rowsEn.length === live.length, "view-all lists live Riyadh districts");
assert(rowsAr.length === live.length, "AR view-all lists the same districts");
assert(
  rowsEn.every((row) => live.includes(row.id)),
  "view-all rows stay on catalog ids",
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
  assert(row.cafeCount > 0, `${row.id} has at least one cafe`);
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

assert(
  rowsEn.every((row, index) => {
    const next = rowsEn[index + 1];
    if (!next) return true;
    return (
      row.cafeCount > next.cafeCount ||
      (row.cafeCount === next.cafeCount &&
        row.label.localeCompare(next.label, "en") <= 0)
    );
  }),
  "default view-all sort is real cafe count desc",
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

const popularFallback = sortNeighborhoodRows(rowsEn, "nearby", null, "en");
assert(
  popularFallback[0]?.id === rowsEn[0]?.id,
  "Nearby without a real origin falls back to Popular",
);

const withCentroid = rowsEn.find((row) => row.centroid);
if (withCentroid?.centroid) {
  const far = { lat: withCentroid.centroid.lat + 0.4, lng: withCentroid.centroid.lng };
  const nearby = sortNeighborhoodRows(rowsEn, "nearby", withCentroid.centroid, "en");
  const farSort = sortNeighborhoodRows(rowsEn, "nearby", far, "en");
  assert(nearby[0]?.id === withCentroid.id, "Nearby sort uses real centroids");
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
  filterNeighborhoodRows(rowsEn, "olaya").some((row) => row.id === "olaya"),
  "search finds Olaya",
);
assert(
  filterNeighborhoodRows(rowsAr, "حطين").some((row) => row.id === "hittin"),
  "search finds حطين",
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

const directory = readRepo("components/shop-directory.tsx");
assert(
  directory.includes("{popular ? (") &&
    directory.includes('className="mt-3 flex flex-wrap gap-1.5"'),
  "Most Popular keeps the wrap; district pages do not resurrect it",
);

const browse = readRepo("components/browse-neighborhoods.tsx");
assert(browse.includes("overflow-x-auto"), "featured row scrolls");
assert(browse.includes("flex-nowrap"), "featured row does not wrap");
assert(browse.includes("rounded-full"), "featured items are pills");
assert(browse.includes("data-browse-pills"), "homepage strip is the pill band");
assert(browse.includes("data-browse-scroll"), "circular scroll chevron is present");
assert(browse.includes("absolute end-4"), "scroll chevron sits on the trailing edge");
assert(browse.includes("pe-10"), "pills reserve space so the chevron fades the last peek");
assert(
  browse.indexOf("<ViewAllLink language={language} />") <
    browse.indexOf("{copy.browseNeighborhoodsHint[language]}"),
  "subtitle sits under the title row so EN stays one line",
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
    browse.indexOf("<ViewAllLink language={language} />"),
  "heading precedes CTA in DOM; dir places title and View all",
);

const viewAll = readRepo("components/neighborhoods-page.tsx");
assert(viewAll.includes("neighborhood-search"), "view-all has client search");
assert(viewAll.includes("neighborhoodCafeCountLabel"), "view-all uses real counts");
assert(viewAll.includes("data-neighborhood-sorts"), "view-all has sort pills");
assert(viewAll.includes("nearby"), "Nearby sort exists");
assert(viewAll.includes("usePeekVisitorLocation"), "Nearby uses real visitor location");
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

console.log(
  `check-browse-neighborhoods: ok (${rowsEn.length} live districts, ${hittinCount} Hittin cafes)`,
);
