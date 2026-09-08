import { fetchPlaceSocial, type PlaceSocial } from "./places";
import type { Language, Shop } from "./types";

export type { PlaceSocial };

/** Cached Places rating only. Null if no key or lookup fails — never invent. */
export async function loadPassportSocial(
  shop: Shop,
  language: Language,
): Promise<PlaceSocial | null> {
  try {
    return await fetchPlaceSocial(shop, language);
  } catch {
    return null;
  }
}
