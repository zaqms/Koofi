import type { Language, Shop } from "./types";

/**
 * Shop-id sample frames for the new detail hero. Only ids listed here
 * get extra slides. Other cafés stay photoUrl-only — no invented interiors,
 * no Places photos, no logos stretched into the 16:9 well.
 */
export const CAMEL_STEP_RAHMANIYYAH_HERO_PHOTOS = [
  "/cafe-heroes/camel-step-al-rahmaniyyah/1.jpg",
  "/cafe-heroes/camel-step-al-rahmaniyyah/2.jpg",
  "/cafe-heroes/camel-step-al-rahmaniyyah/3.jpg",
] as const;

const CAFE_DETAIL_HERO_BY_ID: Record<string, readonly string[]> = {
  "camel-step-al-rahmaniyyah": CAMEL_STEP_RAHMANIYYAH_HERO_PHOTOS,
};

export function cafeDetailHeroPhotos(
  shop: Pick<Shop, "id" | "photoUrl">,
): string[] {
  const sample = shop.id ? CAFE_DETAIL_HERO_BY_ID[shop.id] : undefined;
  if (sample && sample.length > 0) return [...sample];
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
