import { ENV_KEYS, readEnv } from "./env";
import { fetchPlacePhotoReference } from "./places";
import type { Shop } from "./types";

/**
 * Optional Place Photo lookup. No key → do nothing.
 * Never scrapes Maps, reviews, or usercontent into the repo.
 */
export async function fetchPlacePhotoUrl(
  shop: Shop,
): Promise<string | undefined> {
  if (shop.photoUrl) return shop.photoUrl;

  const key = readEnv(ENV_KEYS.GOOGLE_PLACES_API_KEY);
  if (!key) return undefined;

  const photoRef = await fetchPlacePhotoReference(shop);
  if (!photoRef) return undefined;

  const photo = new URL("https://maps.googleapis.com/maps/api/place/photo");
  photo.searchParams.set("maxwidth", "128");
  photo.searchParams.set("photo_reference", photoRef);
  photo.searchParams.set("key", key);
  return photo.toString();
}
