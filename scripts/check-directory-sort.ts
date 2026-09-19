import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  listDirectoryShops,
  listDriveThroughDirectoryShops,
  listRealShops,
} from "../lib/catalog";
import { copy } from "../lib/copy";
import { filterDirectoryShopsByMoment } from "../lib/directory";
import {
  DIRECTORY_RESULT_SORTS,
  DIRECTORY_SORT_COPY,
  effectiveDirectorySort,
  isDirectoryResultSortChip,
  shopDistanceKm,
  sortDirectoryShops,
} from "../lib/directory-sort";
import {
  coordsFromMapsShareUrl,
  isOfficialMapsPlaceUrl,
  officialShopCoords,
} from "../lib/place-coords";
import { shopDisplayName } from "../lib/product";
import { shopDistanceDisplay } from "../lib/shop-distance-label";
import type { Pin } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const repo = process.cwd();
const read = (rel: string) => readFileSync(join(repo, rel), "utf8");

assert(
  DIRECTORY_RESULT_SORTS.join(",") === "nearby,new,az",
  "sort order is Nearby / New / A–Z",
);
assert(copy.neighborhoodsSortNearby.en === "Nearby", "EN Nearby");
assert(copy.neighborhoodsSortNearby.ar === "الأقرب إليك", "AR Nearby");
assert(copy.directorySortNew.en === "New", "EN New");
assert(copy.directorySortNew.ar === "الأحدث", "AR New uses existing الأحدث");
assert(copy.neighborhoodsSortAz.en === "A–Z", "EN A–Z");
assert(copy.neighborhoodsSortAz.ar === "أ–ي", "AR A–Z reuses أ–ي");
assert(copy.directorySortNearbyHint.en === "Nearby needs your location.", "EN geo hint");
assert(copy.directorySortNearbyHint.ar === "الأقرب يحتاج موقعك.", "AR geo hint");
assert(
  copy.directoryDistanceUnavailable.en === "Location unavailable",
  "EN missing-pin fallback",
);
assert(
  copy.directoryDistanceUnavailable.ar === "موقع غير متاح",
  "AR missing-pin fallback",
);
assert(DIRECTORY_SORT_COPY.nearby === copy.neighborhoodsSortNearby, "Nearby reuses copy");
assert(DIRECTORY_SORT_COPY.az === copy.neighborhoodsSortAz, "A–Z reuses copy");
assert(DIRECTORY_SORT_COPY.new === copy.directorySortNew, "New copy is directorySortNew");
assert(isDirectoryResultSortChip("matcha"), "Matcha results get the shared sorter");
assert(isDirectoryResultSortChip("drive-through"), "DT results get the shared sorter");
assert(!isDirectoryResultSortChip("popular"), "Most Popular stays unsorted");
assert(!isDirectoryResultSortChip("coffee"), "other chips stay unsorted");

const dt = listDriveThroughDirectoryShops();
assert(dt.length === 78, `DT directory stays 78 shops, got ${dt.length}`);
assert(
  dt.every((shop) => shop.momentTags.includes("drive-through")),
  "sort does not change the DT filter",
);

const newestDt = [...dt].sort((a, b) => b.catalogIndex - a.catalogIndex)[0];
assert(newestDt, "DT has a newest row");
const ulica = dt.find((shop) => shop.id === "ulica-al-ghadeer");
const lastLane = dt.find((shop) => shop.id === "drcafe-as-suwaidi");
assert(ulica && lastLane, "ULICA TAG and latest DT-lane row are in the directory");
assert(
  lastLane.catalogIndex > ulica.catalogIndex,
  "New uses Wain catalog-added order, not store opening date",
);

const newSorted = sortDirectoryShops(dt, "new", null, "en");
assert(newSorted[0]?.id === newestDt.id, "New puts latest catalog add first");
assert(
  newSorted.findIndex((shop) => shop.id === lastLane.id) <
    newSorted.findIndex((shop) => shop.id === ulica.id),
  "recently cataloged DT-lane rows beat older TAG shops on New",
);
assert(
  newSorted.every((shop, index, rows) => {
    if (index === 0) return true;
    return rows[index - 1]!.catalogIndex >= shop.catalogIndex;
  }),
  "New is catalogIndex DESC",
);

const azEn = sortDirectoryShops(dt, "az", null, "en");
const azEnNames = azEn.map((shop) => shopDisplayName(shop, "en"));
const azEnCopy = [...azEnNames].sort((a, b) =>
  a.localeCompare(b, "en", { sensitivity: "base" }),
);
assert(
  azEnNames.join("\0") === azEnCopy.join("\0"),
  "EN A–Z is cafe name alphabetical",
);

const azAr = sortDirectoryShops(dt, "az", null, "ar");
const azArNames = azAr.map((shop) => shopDisplayName(shop, "ar"));
const azArCopy = [...azArNames].sort((a, b) =>
  a.localeCompare(b, "ar", { sensitivity: "base" }),
);
assert(
  azArNames.join("\0") === azArCopy.join("\0"),
  "AR A–Z uses Arabic name + EN fallback",
);

const origin: Pin = { lat: 24.753476, lng: 46.6906575 };
const nearby = sortDirectoryShops(dt, "nearby", origin, "en");
assert(nearby[0]?.id === "camel-step-al-mursalat", "Nearby ASC from a DT pin");
assert(
  effectiveDirectorySort("nearby", origin) === "nearby",
  "Nearby stays Nearby when location is ready",
);
assert(
  effectiveDirectorySort("nearby", null) === "new",
  "Nearby without location is catalog order, not A–Z",
);

const nearbyNoOrigin = sortDirectoryShops(dt, "nearby", null, "en");
assert(
  nearbyNoOrigin.slice(0, 5).map((shop) => shop.id).join(",") ===
    newSorted.slice(0, 5).map((shop) => shop.id).join(","),
  "Nearby without geo uses New/catalog order",
);
assert(
  nearbyNoOrigin.slice(0, 5).map((shop) => shop.id).join(",") !==
    azEn.slice(0, 5).map((shop) => shop.id).join(","),
  "Nearby without geo must not silently equal A–Z first-five",
);
assert(
  nearby.slice(0, 5).map((shop) => shop.id).join(",") !==
    azEn.slice(0, 5).map((shop) => shop.id).join(","),
  "Nearby with geo first-five differs from A–Z",
);

const matcha = filterDirectoryShopsByMoment(listDirectoryShops(), "matcha");
assert(matcha.length === 25, "Matcha list content stays 25 tagged shops");
const matchaAz = sortDirectoryShops(matcha, "az", null, "en");
const matchaNearbyNoGeo = sortDirectoryShops(matcha, "nearby", null, "en");
const matchaNew = sortDirectoryShops(matcha, "new", null, "en");
assert(
  matchaNearbyNoGeo.slice(0, 5).map((shop) => shop.id).join(",") !==
    matchaAz.slice(0, 5).map((shop) => shop.id).join(","),
  "Matcha Nearby without geo first-five differs from A–Z",
);
assert(
  matchaNearbyNoGeo[0]?.id === matchaNew[0]?.id,
  "Matcha Nearby without geo matches New",
);

const directory = read("components/shop-directory.tsx");
assert(
  directory.includes("isDirectoryResultSortChip") &&
    directory.includes("DirectoryResultSortPills") &&
    directory.includes("sortDirectoryShops"),
  "Matcha and Drive-through mount the same sort pills",
);
assert(
  directory.includes("nearbyAvailable") &&
    directory.includes("showNearbyHint") &&
    directory.includes("requestVisitorLocation") &&
    directory.includes("isUsableVisitorOrigin"),
  "Nearby is honest when geolocation is missing or non-KSA",
);
assert(
  directory.includes("filterDirectoryShopsByMoment") &&
    directory.includes("filterDirectoryShops"),
  "directory filter helpers stay",
);
assert(
  directory.includes("{district || popular || vibe ? ("),
  "directory heading wrap stays",
);

const pills = read("components/directory-result-sort.tsx");
assert(pills.includes("bg-bean") && pills.includes("text-foam"), "selected terracotta");
assert(pills.includes("bg-paper") && pills.includes("border-line"), "inactive Paper");
assert(pills.includes("h-8 rounded-full") && pills.includes("text-[13px]"), "pill type");
assert(pills.includes("flex flex-wrap gap-2"), "pill spacing");
assert(pills.includes("DIRECTORY_SORT_COPY"), "pills reuse shared copy");
assert(
  pills.includes("nearbyAvailable") &&
    pills.includes("data-nearby-blocked") &&
    pills.includes("data-directory-sort-nearby-hint"),
  "Nearby without geo is blocked and labeled",
);

const landing = read("components/home-landing.tsx");
assert(
  landing.includes("isDriveThroughDirectoryChip(pageChipId)") &&
    landing.includes("listDriveThroughDirectoryShops()"),
  "DT landing still uses the branch-level DT directory",
);
assert(
  landing.includes("chipDirectoryMoment") && landing.includes("moment={chipMoment}"),
  "moment filter wiring is unchanged",
);

const chips = read("components/vibe-chips.tsx");
assert(
  chips.includes('case "drive-through"') &&
    chips.includes("{/* car + pickup cup */}") &&
    chips.includes('viewBox="0 0 512 512"'),
  "DT home icon is unchanged",
);
assert(
  chips.includes('case "matcha"') && chips.includes("{/* bowl + whisk */}"),
  "Matcha home icon is unchanged",
);
assert(
  !/Soft Places/i.test(directory) && !/Soft Places/i.test(pills),
  "Soft Places stay parked",
);

const originForLabel: Pin = { lat: 24.7136, lng: 46.6753 };
const kmDisplay = shopDistanceDisplay({
  origin: originForLabel,
  coords: { lat: 24.753476, lng: 46.6906575 },
  language: "ar",
});
assert(
  kmDisplay.kind === "km" &&
    kmDisplay.label.includes("كم") &&
    kmDisplay.km < 80,
  "ready geo + pin → city-scale km",
);
assert(
  shopDistanceDisplay({
    origin: originForLabel,
    coords: { lat: 24.753476, lng: 46.6906575 },
    language: "en",
  }).kind === "km",
  "EN km when pin exists",
);
assert(
  shopDistanceDisplay({ origin: null, coords: null, language: "ar" }).kind ===
    "hidden",
  "no visitor geo still hides the slot",
);
const missingAr = shopDistanceDisplay({
  origin: originForLabel,
  coords: null,
  language: "ar",
});
const missingEn = shopDistanceDisplay({
  origin: originForLabel,
  coords: null,
  language: "en",
});
assert(
  missingAr.kind === "missing" && missingAr.label === "موقع غير متاح",
  "ready geo + no pin → AR fallback, not silent omit",
);
assert(
  missingEn.kind === "missing" && missingEn.label === "Location unavailable",
  "ready geo + no pin → EN fallback, not silent omit",
);
assert(
  shopDistanceDisplay({
    origin: { lat: 0, lng: 0 },
    coords: { lat: 24.753476, lng: 46.6906575 },
    language: "en",
  }).kind === "missing",
  "Null Island visitor + shop pin → fallback, not ~12k km",
);

const byId = new Map(listRealShops().map((shop) => [shop.id, shop]));
function missingCoordRows(rows: typeof matcha) {
  return rows.filter((shop) => shop.lat == null || shop.lng == null);
}

const matchaMissing = missingCoordRows(matcha);
const dtMissing = missingCoordRows(dt);
assert(matchaMissing.length === 0, `Matcha CID-only gap should be folded, got ${matchaMissing.length}`);
assert(dtMissing.length === 0, `DT CID-only gap should be folded, got ${dtMissing.length}`);
assert(
  matcha.every((shop) => shop.lat != null && shop.lng != null),
  "every Matcha directory row has official Riyadh lat/lng after Scout fold",
);
assert(
  dt.every((shop) => shop.lat != null && shop.lng != null),
  "every DT directory row has official Riyadh lat/lng after Scout fold",
);

for (const row of [...matcha, ...dt]) {
  const shop = byId.get(row.id);
  assert(shop, `${row.id} is in the live catalog`);
  assert(
    isOfficialMapsPlaceUrl(shop.mapsShareUrl),
    `${row.id} is an official /maps/place/ URL`,
  );
  assert(officialShopCoords(shop), `${row.id} officialShopCoords is usable`);
  const km = shopDistanceKm(row, origin);
  assert(km != null && km < 80, `${row.id} Nearby km from Riyadh pin is city-scale, got ${km}`);
}

const card = read("components/directory-card.tsx");
const distanceUi = read("components/shop-distance.tsx");
const distanceLabel = read("lib/shop-distance-label.ts");
assert(
  card.includes("shopDistanceDisplay") &&
    card.includes('data-shop-distance={display.kind}') &&
    card.includes("data-shop-distance-km") &&
    distanceLabel.includes("shopDistanceDisplay") &&
    distanceUi.includes("shopDistanceDisplay") &&
    distanceUi.includes('data-shop-distance="missing"') &&
    distanceUi.includes('data-shop-distance="km"') &&
    distanceUi.includes("data-shop-distance-km"),
  "Matcha + DT cards share one distance slot with km or fallback",
);
assert(
  !/Soft Places/i.test(distanceUi) && !/Soft Places/i.test(card),
  "Soft Places stay parked on the distance slot",
);

console.log("check-directory-sort: ok");
console.log("matcha-without-coords:", matchaMissing.length);
console.log("dt-without-coords:", dtMissing.length);
