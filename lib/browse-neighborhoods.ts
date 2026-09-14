import { directoryNeighborhoods, type DirectoryShop } from "./directory";
import { NEIGHBORHOODS, neighborhoodLabel } from "./neighborhoods";
import { districtPath, neighborhoodsPath, PRODUCT_NAME } from "./product";
import type { Language, NeighborhoodId } from "./types";

/**
 * Locked Riyadh featured row (Amjad / Ajz refs).
 * EN and AR are separate lists — do not share one DOM and hope dir flips it.
 * EN LTR visual: Hittin (left, selected) → Malqa → Nakheel → Yasmin → Olaya → Sulaymaniyah.
 * AR RTL DOM: Hittin first so dir=rtl puts حطين on the right; peek on the left.
 * Dynamic-by-city later.
 */
export const RIYADH_FEATURED_NEIGHBORHOODS = [
  "hittin",
  "al-malqa",
  "al-nakheel",
  "al-yasmin",
  "olaya",
  "sulimaniyah",
] as const satisfies readonly NeighborhoodId[];

/** EN `/en` LTR paint order. First visible full card must be Hittin. */
export const EN_FEATURED_LTR = RIYADH_FEATURED_NEIGHBORHOODS;

/**
 * AR `/` RTL DOM. First in this list is the RTL start (rightmost).
 * Do not reverse this for English.
 */
export const AR_FEATURED_RTL_DOM = RIYADH_FEATURED_NEIGHBORHOODS;

export type FeaturedNeighborhoodId =
  (typeof RIYADH_FEATURED_NEIGHBORHOODS)[number];

/** Home carousel demo selected state from the refs. */
export const BROWSE_DEMO_SELECTED: FeaturedNeighborhoodId = "hittin";

/**
 * EN labels for this section. Catalog `en` stays shorter
 * (Olaya, Sulimaniyah); the refs use the Al … forms.
 */
const BROWSE_EN_LABELS: Partial<Record<NeighborhoodId, string>> = {
  sulimaniyah: "Al Sulaymaniyah",
  olaya: "Al Olaya",
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
};

export type NeighborhoodRow = {
  id: NeighborhoodId;
  href: string;
  label: string;
  cafeCount: number;
  icon: NeighborhoodIconKind;
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
  language: Language,
): readonly FeaturedNeighborhoodId[] {
  return language === "en" ? EN_FEATURED_LTR : AR_FEATURED_RTL_DOM;
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

export function listNeighborhoodRows(
  language: Language,
  shops: readonly DirectoryShop[],
): NeighborhoodRow[] {
  return directoryNeighborhoods([...shops])
    .map((id) => ({
      id,
      href: districtPath(id, language),
      label: browseNeighborhoodLabel(id, language),
      cafeCount: neighborhoodCafeCount(id, shops),
      icon: neighborhoodIconKind(id),
    }))
    .sort((a, b) => {
      if (b.cafeCount !== a.cafeCount) return b.cafeCount - a.cafeCount;
      return a.label.localeCompare(b.label, language === "ar" ? "ar" : "en");
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

export function neighborhoodsIndexTitle(language: Language): string {
  return language === "ar"
    ? `أحياء الرياض · ${PRODUCT_NAME}`
    : `Riyadh Neighborhoods · ${PRODUCT_NAME}`;
}

export function neighborhoodsIndexDescription(language: Language): string {
  return language === "ar"
    ? "استكشف القهاوي في الرياض."
    : "Explore coffee spots across Riyadh.";
}

export function neighborhoodsIndexUrl(language: Language): string {
  return neighborhoodsPath(language);
}
