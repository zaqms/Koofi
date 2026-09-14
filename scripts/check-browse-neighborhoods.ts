import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  BROWSE_DEMO_SELECTED,
  RIYADH_FEATURED_NEIGHBORHOODS,
  browseNeighborhoodLabel,
  featuredNeighborhoodIds,
  filterNeighborhoodRows,
  listNeighborhoodRows,
  neighborhoodCafeCount,
  neighborhoodCafeCountLabel,
  neighborhoodIconKind,
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

assert(
  RIYADH_FEATURED_NEIGHBORHOODS.join(",") ===
    "sulimaniyah,olaya,al-yasmin,al-nakheel,al-malqa,hittin",
  "Riyadh featured ids match the refs",
);
assert(RIYADH_FEATURED_NEIGHBORHOODS.length === 6, "exactly 6 featured cards");
assert(BROWSE_DEMO_SELECTED === "hittin", "Hittin is the demo selected card");

assert(
  featuredNeighborhoodIds("en").join(",") ===
    RIYADH_FEATURED_NEIGHBORHOODS.join(","),
  "EN featured order is LTR visual",
);
assert(
  featuredNeighborhoodIds("ar").join(",") ===
    "hittin,al-malqa,al-nakheel,al-yasmin,olaya,sulimaniyah",
  "AR featured order is RTL reading",
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
assert(
  browseNeighborhoodLabel("sulimaniyah", "ar") === "السليمانية",
  "AR Sulaymaniyah label",
);

assert(neighborhoodIconKind("sulimaniyah") === "fortress", "fortress icon");
assert(neighborhoodIconKind("olaya") === "towers", "towers icon");
assert(neighborhoodIconKind("al-yasmin") === "flower", "flower icon");
assert(neighborhoodIconKind("al-nakheel") === "palm", "palm icon");
assert(neighborhoodIconKind("al-malqa") === "building", "building icon");
assert(neighborhoodIconKind("hittin") === "landmark", "landmark icon");

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
    return row.cafeCount > next.cafeCount ||
      (row.cafeCount === next.cafeCount &&
        row.label.localeCompare(next.label, "en") <= 0);
  }),
  "view-all sorts by real cafe count desc",
);

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

const filtered = filterNeighborhoodRows(rowsEn, "olaya");
assert(
  filtered.some((row) => row.id === "olaya"),
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

assert(copy.browseNeighborhoods.ar === "تصفّح حسب الحي", "locked AR heading");
assert(
  copy.browseNeighborhoodsHint.ar === "اكتشف القهاوي في حيّك.",
  "locked AR subtitle",
);
assert(
  copy.viewAllNeighborhoods.ar === "عرض جميع الأحياء",
  "locked AR view-all pill",
);
assert(copy.browseNeighborhoods.en === "Browse by Neighborhood", "locked EN heading");
assert(
  copy.browseNeighborhoodsHint.en === "Find coffee spots near you.",
  "locked EN subtitle",
);
assert(copy.neighborhoodsIndex.en === "Riyadh Neighborhoods", "view-all is Riyadh");
assert(copy.neighborhoodsIndex.ar === "أحياء الرياض", "AR view-all title is أحياء الرياض");
assert(
  !/Jeddah|جدة/.test(
    [
      copy.neighborhoodsIndex.ar,
      copy.neighborhoodsIndex.en,
      copy.neighborhoodsIndexHint.ar,
      copy.neighborhoodsIndexHint.en,
    ].join(" "),
  ),
  "view-all copy stays Riyadh",
);

const homeLanding = readRepo("components/home-landing.tsx");
assert(
  homeLanding.includes("BrowseNeighborhoods") && homeLanding.includes("bareHome"),
  "bare home mounts Browse by Neighborhood",
);
assert(
  !homeLanding.includes("Soft Places") && !homeLanding.includes("ثلاث الليلة"),
  "Soft Places stays parked on home landing",
);

const directory = readRepo("components/shop-directory.tsx");
assert(
  directory.includes("{district || popular ? ("),
  "home directory drops the old district wrap",
);
assert(
  directory.includes('className="mt-3 flex flex-wrap gap-1.5"'),
  "district/popular pages keep the wrap",
);

const browse = readRepo("components/browse-neighborhoods.tsx");
assert(browse.includes("overflow-x-auto"), "featured row scrolls on small screens");
assert(browse.includes("flex-nowrap"), "featured row does not wrap");
assert(browse.includes("aspect-square"), "cards match the 4×2 vibe-chip square family");
assert(browse.includes("w-[5.15rem]"), "cards use the chip tile width, not taller 4/5 tiles");
assert(!browse.includes("aspect-[4/5]"), "cards are not the oversized 4/5 tiles");
assert(browse.includes("size-7"), "card icons match vibe-chip icon size");
assert(browse.includes("bg-blush"), "Hittin uses dusty rose, not bean brown");
assert(!browse.includes("bg-bean"), "featured cards are not vibe-chip brown");
assert(!browse.includes("<img"), "no photos on neighborhood cards");
assert(!/Koofi/i.test(browse), "browse section must not say Koofi");
assert(
  browse.includes('dir={rtl ? "rtl" : "ltr"}'),
  "AR browse section is a true RTL twin, not forced LTR",
);
assert(
  !browse.includes('dir="ltr"'),
  "AR header must not force LTR (no mirrored Arabic)",
);
assert(!browse.includes("text-end"), "EN heading is not forced to the right");
assert(
  browse.indexOf('id="browse-neighborhoods"') < browse.indexOf("<ViewAllPill"),
  "heading precedes CTA in DOM; dir=rtl/ltr places title and pill",
);
assert(
  browse.includes('id="browse-neighborhoods" className="text-base font-semibold"'),
  "browse heading matches New this week / جديد هالأسبوع typography",
);
assert(
  browse.includes('className="mt-1 text-xs leading-5 text-ink-soft"'),
  "browse subtitle matches New this week secondary scale",
);
assert(
  browse.includes("max-w-md border-t border-line"),
  "browse section chrome matches New this week / The list",
);
assert(
  browse.includes('point="right"') && browse.includes("viewAllNeighborhoods.ar"),
  "AR view-all pill chevron points right",
);
assert(
  browse.includes('point="left"') && browse.includes("viewAllNeighborhoods.en"),
  "EN view-all pill keeps the left chevron",
);

const viewAll = readRepo("components/neighborhoods-page.tsx");
assert(viewAll.includes("neighborhood-search"), "view-all has client search");
assert(viewAll.includes("neighborhoodCafeCountLabel"), "view-all uses real counts");
assert(!/Koofi/i.test(viewAll), "view-all must not say Koofi");
assert(!/Jeddah|جدة/.test(viewAll), "view-all UI is not the Jeddah mock names");
assert(
  viewAll.includes('dir={language === "ar" ? "rtl" : "ltr"}'),
  "view-all page is RTL-native on AR",
);
assert(
  viewAll.includes('language === "ar" ? (') &&
    viewAll.includes('<path d="M6 3.2 11.2 8 6 12.8" />'),
  "AR view-all back chevron points right",
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
assert(chat.includes("HomeHero"), "P0 opener stays");
assert(!chat.includes("BrowseNeighborhoods"), "browse is not inside chat chrome");

const featured = new Set<NeighborhoodId>(RIYADH_FEATURED_NEIGHBORHOODS);
assert(featured.size === 6, "featured ids are unique");

console.log(
  `check-browse-neighborhoods: ok (${rowsEn.length} live districts, ${hittinCount} Hittin cafes)`,
);
