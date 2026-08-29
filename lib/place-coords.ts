import type { Pin, Shop } from "./types";

/**
 * Official Google Maps *place* geometry only.
 *
 * Allowed: `!3dLAT!4dLNG` on a real `/maps/place/` link (the same
 * official place the Maps button opens).
 *
 * Not a pin, not allowed:
 * - `/maps/search/` text or `query=lat,lng` / `q=lat,lng` coord-search
 * - `@lat,lng` viewport (even inside Riyadh)
 * - catalog `pin` when the Maps URL is not an official place
 * - CID-only `/place/data=!4m2…` with no place geometry
 */

function asPin(lat: number, lng: number): Pin | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function isOfficialPlacePath(url: string): boolean {
  try {
    const parsed = new URL(url);
    const path = decodeURIComponent(parsed.pathname);
    if (path.includes("/maps/search")) return false;
    return path.includes("/maps/place/");
  } catch {
    return false;
  }
}

/** `!3dLAT!4dLNG` on an official `/maps/place/` URL only. */
export function coordsFromMapsShareUrl(url: string | undefined): Pin | null {
  if (!url || !isOfficialPlacePath(url)) return null;

  const place = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (place?.[1] && place[2]) {
    return asPin(Number(place[1]), Number(place[2]));
  }

  return null;
}

export function officialShopCoords(
  shop: Pick<Shop, "pin" | "mapsShareUrl">,
): Pin | null {
  return coordsFromMapsShareUrl(shop.mapsShareUrl);
}

export function officialCoordsCoverage(
  shops: Pick<Shop, "pin" | "mapsShareUrl">[],
): { withCoords: number; skipped: number } {
  let withCoords = 0;
  let skipped = 0;
  for (const shop of shops) {
    if (officialShopCoords(shop)) withCoords += 1;
    else skipped += 1;
  }
  return { withCoords, skipped };
}
