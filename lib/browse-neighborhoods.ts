import type { DirectoryShop } from "./directory";
import { haversineKm } from "./distance";
import { NEIGHBORHOODS, neighborhoodLabel } from "./neighborhoods";
import { districtPath, neighborhoodsPath, PRODUCT_NAME } from "./product";
import { NEIGHBORHOOD_IDS, type City, type Language, type NeighborhoodId, type Pin } from "./types";

export const DEFAULT_BROWSE_CITY: City = "riyadh";

export const CITY_LABEL: Record<City, Record<Language, string>> = {
  riyadh: { ar: "الرياض", en: "Riyadh" },
};

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
 * EN labels for this section. Catalog `en` stays shorter
 * (Olaya, Sulimaniyah); the refs use the Al … forms.
 */
const BROWSE_EN_LABELS: Partial<Record<NeighborhoodId, string>> = {
  sulimaniyah: "Al Sulaymaniyah",
  olaya: "Al Olaya",
  "al-nakheel": "An Nakheel",
  "as-sahafah": "As Sahafah",
  "al-rabi": "Ar Rabi",
  ghirnatah: "Granada",
  "al-rawdah": "Ar Rawdah",
  "al-yarmouk": "Al Yarmuk",
};

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
  if (language === "en") {
    return BROWSE_EN_LABELS[id] ?? NEIGHBORHOODS[id].en;
  }
  return NEIGHBORHOODS[id].ar;
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
  void city;
  return NEIGHBORHOOD_IDS.map((id) => ({
    id,
    href: districtPath(id, language),
    label: browseNeighborhoodLabel(id, language),
    cafeCount: neighborhoodCafeCount(id, shops),
    centroid: neighborhoodCentroidFromShops(id, shops),
  }));
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
    return [...rows]
      .filter((row) => popularRank(row.id, city) < popularNeighborhoodIds(city).length)
      .sort((a, b) => popularRank(a.id, city) - popularRank(b.id, city));
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
  const cityName = CITY_LABEL[city][language];
  return language === "ar" ? `أحياء ${cityName}` : `${cityName} Neighborhoods`;
}

export function neighborhoodsIndexTitle(
  language: Language,
  city: City = DEFAULT_BROWSE_CITY,
): string {
  return `${neighborhoodsIndexHeading(language, city)} · ${PRODUCT_NAME}`;
}

export function neighborhoodsIndexDescription(language: Language): string {
  return language === "ar"
    ? "استكشف القهاوي في الرياض."
    : "Explore coffee spots across Riyadh.";
}

export function neighborhoodsIndexUrl(language: Language): string {
  return neighborhoodsPath(language);
}
