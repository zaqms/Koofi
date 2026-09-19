import type { Language, Shop } from "./types";

/**
 * Catalog hero frames only. Logos stay on the floating tile — they are
 * not stretched into the 16:9 photo. No Places / invented interiors.
 */
export function cafeDetailHeroPhotos(
  shop: Pick<Shop, "photoUrl">,
): string[] {
  const photo = shop.photoUrl?.trim();
  return photo ? [photo] : [];
}

/**
 * Short identity line. Catalog has no verified description field —
 * return null rather than SEO filler or AI copy.
 */
export function cafeDetailDescription(
  shop: Pick<Shop, "id">,
): string | null {
  void shop;
  return null;
}

export type CafeDetailHoursStatus =
  | { kind: "open"; label: string }
  | { kind: "closed"; label: string }
  | { kind: "opens"; label: string };

/**
 * Open / Closed / Opens at… only from a reliable source.
 * Catalog `hours` and Places defaults are not shown.
 */
export function cafeDetailHoursStatus(
  shop: Pick<Shop, "id" | "hours">,
  language: Language,
): CafeDetailHoursStatus | null {
  void shop;
  void language;
  return null;
}

/** `{Neighborhood} cafés` / `قهاوي {الحي}` — catalog district name only. */
export function neighborhoodCafesHeading(
  neighborhood: string,
  language: Language,
): string {
  const name = neighborhood.trim();
  if (!name) return "";
  return language === "ar" ? `قهاوي ${name}` : `${name} cafés`;
}
