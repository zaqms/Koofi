import {
  isOfficialMapsPlaceUrl,
  isRiyadhPlacePin,
  officialShopCoords,
} from "./place-coords";
import type { Pin, Shop } from "./types";

/** Scout pack row. Coords must already exist — this never invents lat/lng. */
export type OfficialPlacePinPackRow = {
  id: string;
  pin?: Pin | null;
  lat?: number;
  lng?: number;
};

export type OfficialPlacePinFold = {
  id: string;
  pin: Pin;
};

/**
 * Addition-only official place pins for CID-only Matcha/DT rows.
 * Soft Places parked. Does not change mapsShareUrl, tags, or membership.
 */
export function pinFromScoutPackRow(
  row: OfficialPlacePinPackRow,
): Pin | null {
  const raw = row.pin ??
    (row.lat != null && row.lng != null ? { lat: row.lat, lng: row.lng } : null);
  return isRiyadhPlacePin(raw) ? raw : null;
}

export function foldOfficialPlacePins(
  shops: readonly Shop[],
  pack: readonly OfficialPlacePinPackRow[],
): { shops: Shop[]; applied: OfficialPlacePinFold[]; skipped: string[] } {
  const byId = new Map(pack.map((row) => [row.id, row]));
  const applied: OfficialPlacePinFold[] = [];
  const skipped: string[] = [];

  const next = shops.map((shop) => {
    const row = byId.get(shop.id);
    if (!row) return shop;
    if (officialShopCoords(shop)) {
      skipped.push(shop.id);
      return shop;
    }
    if (!isOfficialMapsPlaceUrl(shop.mapsShareUrl)) {
      skipped.push(shop.id);
      return shop;
    }
    const pin = pinFromScoutPackRow(row);
    if (!pin) {
      skipped.push(shop.id);
      return shop;
    }
    applied.push({ id: shop.id, pin });
    return { ...shop, pin };
  });

  return { shops: next, applied, skipped };
}
