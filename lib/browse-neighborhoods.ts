import { cityIdFromPin } from "./city-geo";
import {
  CITY_LABEL,
  DEFAULT_BROWSE_CITY,
  cityLabel,
  isCatalogCity,
  neighborhoodsIndexHeadingForCity,
  neighborhoodsIndexHintForCity,
  type CityId,
} from "./cities";
import { districtsInCity } from "./district-city";
import type { DirectoryShop } from "./directory";
import { haversineKm } from "./distance";
import { NEIGHBORHOODS, neighborhoodLabel } from "./neighborhoods";
import { isUsableVisitorOrigin } from "./place-coords";
import { districtPath, neighborhoodsPath, PRODUCT_NAME } from "./product";
import type { City, Language, NeighborhoodId, Pin } from "./types";

export { CITY_LABEL, DEFAULT_BROWSE_CITY, cityLabel };

/**
 * City-keyed featured strip. Riyadh is live; add a Jeddah key when that
 * catalog lands — do not hardcode Jeddah names until then.
 */
export const FEATURED_NEIGHBORHOODS_BY_CITY = {
  riyadh: [
    "hittin",
    "al-malqa",
    "al-nakheel",
    "al-yasmin",
    "olaya",
    "sulimaniyah",
  ],
} as const satisfies Record<City, readonly NeighborhoodId[]>;

export const RIYADH_FEATURED_NEIGHBORHOODS =
  FEATURED_NEIGHBORHOODS_BY_CITY.riyadh;

export type FeaturedNeighborhoodId =
  (typeof RIYADH_FEATURED_NEIGHBORHOODS)[number];

/**
 * Amjad’s locked View All Popular order. Separate from the north-belt
 * featured pill strip — do not reuse this to reorder home.
 */
export const POPULAR_NEIGHBORHOODS_BY_CITY = {
  riyadh: [
    "hittin",
    "al-malqa",
    "al-takhassusi",
    "olaya",
    "al-yasmin",
    "al-nakheel",
    "al-aqiq",
    "as-sahafah",
    "al-narjis",
    "al-ghadeer",
    "al-arid",
    "al-qirawan",
    "al-rabi",
    "al-wadi",
    "qurtubah",
    "ghirnatah",
    "diplomatic-quarter",
    "diriyah",
    "sulimaniyah",
    "al-mohammadiyah",
    "al-muruj",
    "al-masif",
    "al-mughrizat",
    "al-rawdah",
    "al-hamra",
    "al-yarmouk",
    "al-munsiyah",
    "al-malaz",
    "al-wurud",
  ],
} as const satisfies Record<City, readonly NeighborhoodId[]>;

export const RIYADH_POPULAR_NEIGHBORHOODS =
  POPULAR_NEIGHBORHOODS_BY_CITY.riyadh;

export type PopularNeighborhoodId =
  (typeof RIYADH_POPULAR_NEIGHBORHOODS)[number];

export type NeighborhoodSort = "nearby" | "popular" | "az";

export const NEIGHBORHOOD_SORTS: readonly NeighborhoodSort[] = [
  "nearby",
  "popular",
  "az",
];

/**
 * Browse EN uses the locked district dictionary (`NEIGHBORHOODS.en`).
 * Shoug sheet 21 Sep 2026 is the only EN overlay.
 */

export type NeighborhoodIconKind =
  | "fortress"
  | "towers"
  | "flower"
  | "palm"
  | "building"
  | "landmark"
  | "waves"
  | "tree"
  | "dome"
  | "diamond"
  | "pin"
  | "sail";

const NEIGHBORHOOD_ICONS: Record<NeighborhoodId, NeighborhoodIconKind> = {
  sulimaniyah: "fortress",
  olaya: "towers",
  "al-yasmin": "flower",
  "al-nakheel": "palm",
  "al-malqa": "building",
  hittin: "landmark",
  "al-wurud": "flower",
  "al-rabwah": "tree",
  "al-rabi": "flower",
  "al-masif": "tree",
  "al-rahmaniyyah": "dome",
  "as-sahafah": "building",
  kafd: "towers",
  diriyah: "fortress",
  "al-narjis": "flower",
  "al-mughrizat": "pin",
  ghirnatah: "diamond",
  "al-shohda": "dome",
  "al-safa": "building",
  "al-rawdah": "waves",
  qurtubah: "building",
  "an-nazhah": "tree",
  "al-hamra": "landmark",
  "al-yarmouk": "building",
  "al-nahdah": "palm",
  "al-manar": "landmark",
  "al-rayyan": "palm",
  "al-rawabi": "tree",
  "al-fayha": "flower",
  "al-raqban": "pin",
  "al-munsiyah": "sail",
  "an-nada": "tree",
  "diplomatic-quarter": "landmark",
  "king-fahd": "towers",
  "al-takhassusi": "building",
  "al-aqiq": "diamond",
  "al-ghadeer": "waves",
  "al-arid": "tree",
  "al-qirawan": "dome",
  "al-wadi": "tree",
  "al-mohammadiyah": "building",
  "al-muruj": "flower",
  "al-malaz": "pin",
  "al-mathar": "building",
  "at-taawun": "building",
  "al-mursalat": "pin",
  "al-murabba": "building",
  "as-salam": "landmark",
  ghubairah: "pin",
  "al-wisham": "building",
  badr: "diamond",
  "al-aziziyah": "tree",
  "al-hazm": "pin",
  "al-andalus": "fortress",
  "al-khaleej": "waves",
  "an-nasim-al-gharbi": "tree",
  "ar-rimal": "palm",
  "al-janadriyyah": "landmark",
  namar: "tree",
  kkia: "landmark",
  "al-jazirah": "waves",
  "an-nasim-ash-sharqi": "tree",
  "an-nasim": "tree",
  shubra: "building",
  manfuha: "pin",
  tuwaiq: "diamond",
  "as-suwaidi": "building",
};

export type NeighborhoodRow = {
  id: NeighborhoodId;
  href: string;
  label: string;
  cafeCount: number;
  /** Mean of official shop pins in this حي. Null when none are real. */
  centroid: Pin | null;
};

export function browseNeighborhoodLabel(
  id: NeighborhoodId,
  language: Language,
): string {
  return neighborhoodLabel(id, language);
}

export function neighborhoodIconKind(id: NeighborhoodId): NeighborhoodIconKind {
  return NEIGHBORHOOD_ICONS[id];
}

export function featuredNeighborhoodIds(
  _language: Language,
  city: City = DEFAULT_BROWSE_CITY,
): readonly NeighborhoodId[] {
  return FEATURED_NEIGHBORHOODS_BY_CITY[city];
}

/**
 * Homepage proximity shortlist length.
 *
 * The rail is one horizontal scroller. The reference shows about four
 * pills before the overflow arrow; the featured fallback belt is six,
 * not four. Five is the single ranked count: nearest five live
 * neighborhoods. The no-location fallback keeps the full featured belt
 * and does not use this cap.
 */
export const HOME_NEIGHBORHOOD_TOP_N = 5;

export type HomeNeighborhoodMode = "proximity" | "fallback";

/** Live حي plus the mean of its official shop pins. Soft Places stays parked. */
export type HomeNeighborhoodCandidate = {
  id: NeighborhoodId;
  city: CityId;
  /**
   * Arithmetic mean of official shop pins in this حي
   * (`neighborhoodCentroidFromShops` → `officialShopCoords`).
   * Null when the district has cafés but no official pin.
   * Not one café pin and not a name-derived coordinate.
   */
  centroid: Pin | null;
};

export type HomeNeighborhoodResolution = {
  ids: NeighborhoodId[];
  cityId: CityId;
  mode: HomeNeighborhoodMode;
};

/**
 * Candidates for the home rail: live districts only (at least one catalog
 * café). Centroid is the mean of official pins already stored on the
 * browse row. Language does not change the id or the point.
 */
export function homeNeighborhoodCandidates(
  shops: readonly DirectoryShop[],
  city: City,
): HomeNeighborhoodCandidate[] {
  return listNeighborhoodRows("en", shops, city).map((row) => ({
    id: row.id,
    city,
    centroid: row.centroid,
  }));
}

function liveIdsInCity(
  candidates: readonly HomeNeighborhoodCandidate[],
  cityId: CityId,
): Set<NeighborhoodId> {
  const ids = new Set<NeighborhoodId>();
  for (const row of candidates) {
    if (row.city === cityId) ids.add(row.id);
  }
  return ids;
}

function fallbackHomeNeighborhoodIds(
  cityId: CityId,
  candidates: readonly HomeNeighborhoodCandidate[],
): NeighborhoodId[] {
  if (!isCatalogCity(cityId)) return [];
  const live = liveIdsInCity(candidates, cityId);
  return featuredNeighborhoodIds("en", cityId).filter((id) => live.has(id));
}

/**
 * Nearest live neighborhoods in one city. Proximity to the district
 * representative only — not Nearby café ranking, not Popular, not A–Z.
 * Ties break on stable id so EN and AR share one order.
 * Districts without a centroid stay out. Soft Places stays parked.
 */
export function nearestHomeNeighborhoodIds(
  candidates: readonly HomeNeighborhoodCandidate[],
  cityId: CityId,
  origin: Pin,
  topN: number = HOME_NEIGHBORHOOD_TOP_N,
): NeighborhoodId[] {
  const ranked = candidates.filter(
    (row): row is HomeNeighborhoodCandidate & { centroid: Pin } =>
      row.city === cityId && row.centroid != null,
  );
  ranked.sort((a, b) => {
    const da = haversineKm(origin, a.centroid);
    const db = haversineKm(origin, b.centroid);
    if (da !== db) return da - db;
    if (a.id < b.id) return -1;
    if (a.id > b.id) return 1;
    return 0;
  });
  return ranked.slice(0, topN).map((row) => row.id);
}

/**
 * Home “Browse by Neighborhood” ids.
 *
 * Location allowed and inside a registry city: that city’s nearest
 * `HOME_NEIGHBORHOOD_TOP_N` live neighborhoods. A Jeddah (or other)
 * fix never receives Riyadh ids, even when Riyadh is the only catalog.
 * A usable fix outside every metro box yields an empty rail.
 * Denied, unavailable, timeout, or an unusable fix: the selected city’s
 * existing featured belt, still only live districts.
 */
export function resolveHomeNeighborhoods(input: {
  candidates: readonly HomeNeighborhoodCandidate[];
  origin: Pin | null;
  locationReady: boolean;
  selectedCityId: CityId;
}): HomeNeighborhoodResolution {
  const usable =
    input.locationReady &&
    input.origin != null &&
    isUsableVisitorOrigin(input.origin);

  if (!usable || !input.origin) {
    return {
      ids: fallbackHomeNeighborhoodIds(input.selectedCityId, input.candidates),
      cityId: input.selectedCityId,
      mode: "fallback",
    };
  }

  const gpsCity = cityIdFromPin(input.origin);
  if (!gpsCity) {
    return {
      ids: [],
      cityId: input.selectedCityId,
      mode: "proximity",
    };
  }

  return {
    ids: nearestHomeNeighborhoodIds(input.candidates, gpsCity, input.origin),
    cityId: gpsCity,
    mode: "proximity",
  };
}

export function popularNeighborhoodIds(
  city: City = DEFAULT_BROWSE_CITY,
): readonly NeighborhoodId[] {
  return POPULAR_NEIGHBORHOODS_BY_CITY[city];
}

function popularRank(id: NeighborhoodId, city: City): number {
  const list = POPULAR_NEIGHBORHOODS_BY_CITY[city] as readonly NeighborhoodId[];
  const index = list.indexOf(id);
  return index === -1 ? list.length : index;
}

export function neighborhoodCafeCount(
  id: NeighborhoodId,
  shops: readonly Pick<DirectoryShop, "neighborhood">[],
): number {
  return shops.filter((shop) => shop.neighborhood === id).length;
}

export function neighborhoodCafeCountLabel(
  count: number,
  language: Language,
): string {
  if (language === "ar") {
    return count === 1 ? "قهوة واحدة" : `${count} قهاوي`;
  }
  return count === 1 ? "1 café" : `${count} cafés`;
}

export function neighborhoodCentroidFromShops(
  id: NeighborhoodId,
  shops: readonly Pick<DirectoryShop, "neighborhood" | "lat" | "lng">[],
): Pin | null {
  let lat = 0;
  let lng = 0;
  let n = 0;
  for (const shop of shops) {
    if (shop.neighborhood !== id) continue;
    if (shop.lat == null || shop.lng == null) continue;
    lat += shop.lat;
    lng += shop.lng;
    n += 1;
  }
  return n > 0 ? { lat: lat / n, lng: lng / n } : null;
}

export function neighborhoodDistanceKm(
  row: Pick<NeighborhoodRow, "centroid">,
  origin: Pin | null,
): number | null {
  if (!origin || !row.centroid) return null;
  const km = haversineKm(origin, row.centroid);
  return Number.isFinite(km) ? km : null;
}

export function listNeighborhoodRows(
  language: Language,
  shops: readonly DirectoryShop[],
  city: City = DEFAULT_BROWSE_CITY,
): NeighborhoodRow[] {
  return districtsInCity(city)
    .map((id) => ({
      id,
      href: districtPath(id, language),
      label: browseNeighborhoodLabel(id, language),
      cafeCount: neighborhoodCafeCount(id, shops),
      centroid: neighborhoodCentroidFromShops(id, shops),
    }))
    .filter((row) => row.cafeCount > 0);
}

function compareAz(a: NeighborhoodRow, b: NeighborhoodRow, language: Language): number {
  return a.label.localeCompare(b.label, language === "ar" ? "ar" : "en");
}

export function sortNeighborhoodRows(
  rows: readonly NeighborhoodRow[],
  sort: NeighborhoodSort,
  origin: Pin | null,
  language: Language,
  city: City = DEFAULT_BROWSE_CITY,
): NeighborhoodRow[] {
  if (sort === "popular") {
    const ranked = [...rows]
      .filter((row) => popularRank(row.id, city) < popularNeighborhoodIds(city).length)
      .sort((a, b) => popularRank(a.id, city) - popularRank(b.id, city));
    const tail = [...rows]
      .filter(
        (row) =>
          popularRank(row.id, city) >= popularNeighborhoodIds(city).length &&
          row.cafeCount > 0,
      )
      .sort((a, b) => compareAz(a, b, language));
    return [...ranked, ...tail];
  }
  const copy = [...rows];
  if (sort === "az" || (sort === "nearby" && !origin)) {
    return copy.sort((a, b) => compareAz(a, b, language));
  }
  return copy.sort((a, b) => {
    const da = neighborhoodDistanceKm(a, origin);
    const db = neighborhoodDistanceKm(b, origin);
    if (da == null && db == null) return compareAz(a, b, language);
    if (da == null) return 1;
    if (db == null) return -1;
    if (da !== db) return da - db;
    return compareAz(a, b, language);
  });
}

export function filterNeighborhoodRows(
  rows: readonly NeighborhoodRow[],
  query: string,
): NeighborhoodRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...rows];
  return rows.filter((row) => {
    const hood = NEIGHBORHOODS[row.id];
    const haystack = [
      row.label,
      hood.ar,
      hood.en,
      neighborhoodLabel(row.id, "en"),
      ...hood.aliases,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function neighborhoodsIndexHeading(
  language: Language,
  city: City = DEFAULT_BROWSE_CITY,
): string {
  return neighborhoodsIndexHeadingForCity(language, city);
}

export function neighborhoodsIndexTitle(
  language: Language,
  city: City = DEFAULT_BROWSE_CITY,
): string {
  return `${neighborhoodsIndexHeading(language, city)} · ${PRODUCT_NAME}`;
}

export function neighborhoodsIndexDescription(
  language: Language,
  city: City = DEFAULT_BROWSE_CITY,
): string {
  return neighborhoodsIndexHintForCity(language, city);
}

export function neighborhoodsIndexUrl(language: Language): string {
  return neighborhoodsPath(language);
}
