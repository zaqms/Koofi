import {
  isOfficialMapsPlaceUrl,
  isRiyadhPlacePin,
  officialShopCoords,
  placeIdentityKeys,
} from "./place-coords";
import type { Pin, Shop } from "./types";

/** Scout pack row. Coords must already exist — this never invents lat/lng. */
export type OfficialPlacePinPackRow = {
  id: string;
  pin?: Pin | null;
  lat?: number;
  lng?: number;
  mapsShareUrl?: string;
};

export type OfficialPlacePinFold = {
  id: string;
  pin: Pin;
};

export type OfficialPlacePinSkip = {
  id: string;
  reason:
    | "already-pinned"
    | "not-official-url"
    | "no-target"
    | "ambiguous"
    | "url-mismatch"
    | "no-coords"
    | "non-riyadh";
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

function rawPinFromScoutPackRow(
  row: OfficialPlacePinPackRow,
): Pin | null {
  if (row.pin && Number.isFinite(row.pin.lat) && Number.isFinite(row.pin.lng)) {
    return row.pin;
  }
  if (row.lat != null && row.lng != null) {
    return { lat: row.lat, lng: row.lng };
  }
  return null;
}

function identitiesConflict(
  packUrl: string | undefined,
  catalogUrl: string | undefined,
): boolean {
  const packKeys = placeIdentityKeys(packUrl);
  const catalogKeys = placeIdentityKeys(catalogUrl);
  if (packKeys.length === 0 || catalogKeys.length === 0) return false;
  return !packKeys.some((key) => catalogKeys.includes(key));
}

function shopsForPlaceKeys(
  keys: string[],
  byPlaceKey: Map<string, Shop[]>,
): Shop[] {
  const found = new Map<string, Shop>();
  for (const key of keys) {
    for (const shop of byPlaceKey.get(key) ?? []) {
      found.set(shop.id, shop);
    }
  }
  return [...found.values()];
}

function resolveTargetShop(
  row: OfficialPlacePinPackRow,
  packIdCounts: Map<string, number>,
  byId: Map<string, Shop>,
  byPlaceKey: Map<string, Shop[]>,
): { shop: Shop } | { skip: OfficialPlacePinSkip } {
  const packCount = packIdCounts.get(row.id) ?? 0;
  const keys = placeIdentityKeys(row.mapsShareUrl);
  const placeMatches = shopsForPlaceKeys(keys, byPlaceKey);

  if (packCount > 1) {
    if (placeMatches.length === 1) return { shop: placeMatches[0]! };
    return {
      skip: {
        id: row.id,
        reason: placeMatches.length > 1 ? "ambiguous" : "no-target",
      },
    };
  }

  const byExactId = byId.get(row.id);
  if (byExactId) {
    if (identitiesConflict(row.mapsShareUrl, byExactId.mapsShareUrl)) {
      return { skip: { id: row.id, reason: "url-mismatch" } };
    }
    return { shop: byExactId };
  }

  if (placeMatches.length === 1) return { shop: placeMatches[0]! };
  return {
    skip: {
      id: row.id,
      reason: placeMatches.length > 1 ? "ambiguous" : "no-target",
    },
  };
}

export function foldOfficialPlacePins(
  shops: readonly Shop[],
  pack: readonly OfficialPlacePinPackRow[],
): {
  shops: Shop[];
  applied: OfficialPlacePinFold[];
  skipped: string[];
  rejected: OfficialPlacePinSkip[];
} {
  const byId = new Map(shops.map((shop) => [shop.id, shop]));
  const byPlaceKey = new Map<string, Shop[]>();
  for (const shop of shops) {
    for (const key of placeIdentityKeys(shop.mapsShareUrl)) {
      const list = byPlaceKey.get(key) ?? [];
      list.push(shop);
      byPlaceKey.set(key, list);
    }
  }

  const packIdCounts = new Map<string, number>();
  for (const row of pack) {
    packIdCounts.set(row.id, (packIdCounts.get(row.id) ?? 0) + 1);
  }

  const applied: OfficialPlacePinFold[] = [];
  const skipped: string[] = [];
  const rejected: OfficialPlacePinSkip[] = [];
  const appliedIds = new Set<string>();
  const nextById = new Map(shops.map((shop) => [shop.id, shop]));

  for (const row of pack) {
    const resolved = resolveTargetShop(row, packIdCounts, byId, byPlaceKey);
    if ("skip" in resolved) {
      skipped.push(resolved.skip.id);
      rejected.push(resolved.skip);
      continue;
    }

    const shop = nextById.get(resolved.shop.id) ?? resolved.shop;
    if (appliedIds.has(shop.id) || officialShopCoords(shop)) {
      skipped.push(shop.id);
      rejected.push({ id: shop.id, reason: "already-pinned" });
      continue;
    }
    if (!isOfficialMapsPlaceUrl(shop.mapsShareUrl)) {
      skipped.push(shop.id);
      rejected.push({ id: shop.id, reason: "not-official-url" });
      continue;
    }

    const raw = rawPinFromScoutPackRow(row);
    if (!raw) {
      skipped.push(shop.id);
      rejected.push({ id: shop.id, reason: "no-coords" });
      continue;
    }
    const pin = isRiyadhPlacePin(raw) ? raw : null;
    if (!pin) {
      skipped.push(shop.id);
      rejected.push({ id: shop.id, reason: "non-riyadh" });
      continue;
    }

    applied.push({ id: shop.id, pin });
    appliedIds.add(shop.id);
    nextById.set(shop.id, { ...shop, pin });
  }

  return {
    shops: shops.map((shop) => nextById.get(shop.id) ?? shop),
    applied,
    skipped,
    rejected,
  };
}
