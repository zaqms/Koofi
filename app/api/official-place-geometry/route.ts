import { listRealShops } from "@/lib/catalog";
import { followGoogleRedirects } from "@/lib/maps-url";
import {
  coordsFromMapsShareUrl,
  needsOfficialPlacePin,
} from "@/lib/place-coords";
import { fetchOfficialPlaceGeometry } from "@/lib/places";
import { ENV_KEYS, readEnv } from "@/lib/env";
import type { Pin, Shop } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH = 6;

async function mapInBatches<T, R>(
  items: T[],
  size: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    out.push(...(await Promise.all(chunk.map(fn))));
  }
  return out;
}

async function coordsFromOfficialRedirect(
  url: string | undefined,
): Promise<Pin | null> {
  if (!url) return null;
  const resolved = await followGoogleRedirects(url);
  return coordsFromMapsShareUrl(resolved);
}

type Row =
  | { id: string; pin: Pin; source: "places" | "official-redirect" }
  | { id: string; failed: true };

/**
 * One-time official-place geometry lookup for CID-only `/maps/place/` shops.
 * Uses Places CID/details when GOOGLE_PLACES_API_KEY is set; otherwise tries
 * !3d/!4d on the official place URL's redirect Location.
 */
export async function GET() {
  const shops = listRealShops().filter(needsOfficialPlacePin);
  const placesReady = Boolean(readEnv(ENV_KEYS.GOOGLE_PLACES_API_KEY));

  const rows = await mapInBatches(shops, BATCH, async (shop: Shop): Promise<Row> => {
    if (placesReady) {
      const pin = await fetchOfficialPlaceGeometry(shop);
      if (pin) return { id: shop.id, pin, source: "places" };
      return { id: shop.id, failed: true };
    }

    const pin = await coordsFromOfficialRedirect(shop.mapsShareUrl);
    if (pin) return { id: shop.id, pin, source: "official-redirect" };
    return { id: shop.id, failed: true };
  });

  const written = rows.flatMap((row) =>
    "failed" in row ? [] : [{ id: row.id, lat: row.pin.lat, lng: row.pin.lng, source: row.source }],
  );
  const failed = rows.flatMap((row) => ("failed" in row ? [row.id] : []));

  return Response.json({
    placesReady,
    candidates: shops.length,
    writtenCount: written.length,
    failedCount: failed.length,
    written,
    failed,
  });
}
