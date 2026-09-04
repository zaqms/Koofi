import { neighborhoodLabel } from "./neighborhoods";
import type { Language, NeighborhoodId } from "./types";

/**
 * Directory category path segments. Neighborhood ids stay category-agnostic.
 * v1 is coffee-shops only — do not invent other live categories here.
 */
export const DIRECTORY_CATEGORIES = ["coffee-shops"] as const;
export type DirectoryCategoryId = (typeof DIRECTORY_CATEGORIES)[number];

export const COFFEE_SHOPS_CATEGORY = "coffee-shops" satisfies DirectoryCategoryId;

export function isDirectoryCategory(
  value: string,
): value is DirectoryCategoryId {
  return (DIRECTORY_CATEGORIES as readonly string[]).includes(value);
}

/** Phrase for the coffee-shops category + a district name. Category-layer copy. */
export function coffeeShopsInDistrict(
  districtName: string,
  language: Language,
): string {
  return language === "ar"
    ? `مقاهي في ${districtName}`
    : `Coffee shops in ${districtName}`;
}

export function categoryDistrictHeading(
  category: DirectoryCategoryId,
  id: NeighborhoodId,
  language: Language,
): string {
  const name = neighborhoodLabel(id, language);
  if (category === COFFEE_SHOPS_CATEGORY) {
    return coffeeShopsInDistrict(name, language);
  }
  return name;
}
