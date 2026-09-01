import { officialShopCoords } from "./place-coords";
import type { NeighborhoodId, Pin, Shop } from "./types";
import { haversineKm } from "./distance";

/**
 * Pad an asked حي only with shops that sit near that حي's official pins.
 * الملقا must not be filled with الدرعية. Hittin may still take النخيل.
 */
export const NEIGHBORHOOD_PAD_KM = 6;

const centroidCache = new Map<NeighborhoodId, Pin | null>();

export function neighborhoodCentroid(
  id: NeighborhoodId,
  shops: Pick<Shop, "neighborhood" | "pin" | "mapsShareUrl">[],
): Pin | null {
  if (centroidCache.has(id)) return centroidCache.get(id) ?? null;

  let lat = 0;
  let lng = 0;
  let n = 0;
  for (const shop of shops) {
    if (shop.neighborhood !== id) continue;
    const coords = officialShopCoords(shop);
    if (!coords) continue;
    lat += coords.lat;
    lng += coords.lng;
    n += 1;
  }

  const pin = n > 0 ? { lat: lat / n, lng: lng / n } : null;
  centroidCache.set(id, pin);
  return pin;
}

export function isNearAskedNeighborhood(
  shop: Pick<Shop, "neighborhood" | "pin" | "mapsShareUrl">,
  asked: NeighborhoodId[],
  catalog: Pick<Shop, "neighborhood" | "pin" | "mapsShareUrl">[],
  maxKm = NEIGHBORHOOD_PAD_KM,
): boolean {
  if (asked.length === 0) return true;
  if (asked.includes(shop.neighborhood)) return true;

  const coords = officialShopCoords(shop);
  if (!coords) return false;

  for (const area of asked) {
    const center = neighborhoodCentroid(area, catalog);
    if (center && haversineKm(center, coords) <= maxKm) return true;
  }
  return false;
}

export function neighborhoodTightShops<T extends Shop>(
  shops: T[],
  asked: NeighborhoodId[],
): T[] {
  if (asked.length === 0) return shops;
  return shops.filter((shop) => isNearAskedNeighborhood(shop, asked, shops));
}
