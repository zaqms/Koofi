import type { Pin, Shop } from "./types";

/**
 * Official Google Maps *place* geometry only, in this order:
 * 1. `!3dLAT!4dLNG` on a real `/maps/place/` URL
 * 2. catalog `pin` only when `mapsShareUrl` is that official place
 *    (including CID-only `/maps/place/data=!4m2…1s0x…`)
 *
 * Not allowed:
 * - `/maps/search/` text or `query=lat,lng` / `q=lat,lng` coord-search
 * - `@lat,lng` viewport
 * - catalog `pin` when the Maps URL is not an official `/maps/place/` link
 * - invented / geocoded / neighborhood-center coords
 */

function asPin(lat: number, lng: number): Pin | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

export function isOfficialMapsPlaceUrl(url: string | undefined): boolean {
  if (!url) return false;
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
  if (!isOfficialMapsPlaceUrl(url) || !url) return null;

  const place = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (place?.[1] && place[2]) {
    return asPin(Number(place[1]), Number(place[2]));
  }

  return null;
}

export function officialShopCoords(
  shop: Pick<Shop, "pin" | "mapsShareUrl">,
): Pin | null {
  const fromPlaceUrl = coordsFromMapsShareUrl(shop.mapsShareUrl);
  if (fromPlaceUrl) return fromPlaceUrl;
  if (isOfficialMapsPlaceUrl(shop.mapsShareUrl) && shop.pin) {
    return asPin(shop.pin.lat, shop.pin.lng);
  }
  return null;
}

/** Official `/maps/place/` shop with no usable !3d/!4d or official-place pin. */
export function needsOfficialPlacePin(
  shop: Pick<Shop, "pin" | "mapsShareUrl">,
): boolean {
  return isOfficialMapsPlaceUrl(shop.mapsShareUrl) && !officialShopCoords(shop);
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
