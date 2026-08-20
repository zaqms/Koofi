import { ENV_KEYS, readEnv } from "./env";
import { isAllowedMapsHost, parseHttpUrl } from "./maps-url";

/**
 * Optional Place Photo lookup. No key → do nothing.
 * Never scrapes Maps, reviews, or usercontent into the repo.
 */
export async function fetchPlacePhotoUrl(shop: {
  photoUrl?: string;
  mapsShareUrl?: string;
}): Promise<string | undefined> {
  if (shop.photoUrl) return shop.photoUrl;

  const key = readEnv(ENV_KEYS.GOOGLE_PLACES_API_KEY);
  if (!key) return undefined;

  const placeId = shop.mapsShareUrl
    ? await placeIdFromMapsUrl(shop.mapsShareUrl)
    : undefined;
  if (!placeId) return undefined;

  const details = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json",
  );
  details.searchParams.set("place_id", placeId);
  details.searchParams.set("fields", "photo");
  details.searchParams.set("key", key);

  try {
    const response = await fetch(details, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return undefined;
    const data = (await response.json()) as {
      result?: { photos?: { photo_reference?: string }[] };
    };
    const photoRef = data.result?.photos?.[0]?.photo_reference;
    if (!photoRef) return undefined;

    const photo = new URL(
      "https://maps.googleapis.com/maps/api/place/photo",
    );
    photo.searchParams.set("maxwidth", "128");
    photo.searchParams.set("photo_reference", photoRef);
    photo.searchParams.set("key", key);
    return photo.toString();
  } catch {
    return undefined;
  }
}

async function placeIdFromMapsUrl(mapsUrl: string): Promise<string | undefined> {
  const parsed = parseHttpUrl(mapsUrl);
  if (!parsed || !isAllowedMapsHost(parsed.host)) return undefined;

  const queryPlace = parsed.searchParams.get("query_place_id");
  if (queryPlace) return queryPlace;

  try {
    const response = await fetch(mapsUrl, {
      method: "GET",
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    const location = response.headers.get("location");
    if (!location) return undefined;
    const next = new URL(location, mapsUrl);
    if (!isAllowedMapsHost(next.host)) return undefined;
    return next.searchParams.get("query_place_id") ?? undefined;
  } catch {
    return undefined;
  }
}
