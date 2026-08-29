import type { Pin, Shop } from "./types";

/**
 * Official place geometry only — the same pin / mapsShareUrl already on the shop.
 * Do not geocode names, do not call Places, do not invent neighborhood centers.
 */

const RIYADH_LAT = { min: 24.2, max: 25.3 };
const RIYADH_LNG = { min: 46.2, max: 47.4 };

function asPin(lat: number, lng: number): Pin | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function inRiyadhBox(pin: Pin): boolean {
  return (
    pin.lat >= RIYADH_LAT.min &&
    pin.lat <= RIYADH_LAT.max &&
    pin.lng >= RIYADH_LNG.min &&
    pin.lng <= RIYADH_LNG.max
  );
}

/** Prefer `!3dLAT!4dLNG` place geometry over `@lat,lng` viewport. */
export function coordsFromMapsShareUrl(url: string | undefined): Pin | null {
  if (!url) return null;

  const place = url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (place?.[1] && place[2]) {
    const pin = asPin(Number(place[1]), Number(place[2]));
    if (pin) return pin;
  }

  const query = url.match(/[?&](?:query|q)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (query?.[1] && query[2]) {
    const pin = asPin(Number(query[1]), Number(query[2]));
    if (pin) return pin;
  }

  const at = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at?.[1] && at[2]) {
    const pin = asPin(Number(at[1]), Number(at[2]));
    // Skip world/US viewports that are not the official Riyadh place.
    if (pin && inRiyadhBox(pin)) return pin;
  }

  return null;
}

export function officialShopCoords(
  shop: Pick<Shop, "pin" | "mapsShareUrl">,
): Pin | null {
  const fromUrl = coordsFromMapsShareUrl(shop.mapsShareUrl);
  if (fromUrl) return fromUrl;
  if (shop.pin) return asPin(shop.pin.lat, shop.pin.lng);
  return null;
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
