import type { Language } from "./types";

export type ListingLocationOrder = "distance-first" | "neighborhood-first";

/** EN: `9.8 km · District`. AR: `الحي · 9.8 كم` (RTL reading order). */
export function listingLocationOrder(
  language: Language,
): ListingLocationOrder {
  return language === "ar" ? "neighborhood-first" : "distance-first";
}
