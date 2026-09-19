import type { Shop } from "./types";

/** Places attrs backfill row (19 Sep 2026). Never creates catalog shops. */
export type HalfwayPlaceAttrRow = {
  id: string;
  dine_in?: boolean | null;
  outdoor_seating?: boolean | null;
  place_id?: string | null;
  status?: string;
};

export type HalfwayPlaceAttrFold = {
  id: string;
  dineIn: boolean | null;
  outdoorSeating: boolean | null;
  placeId?: string;
};

function asTriState(value: unknown): boolean | null {
  if (value === true) return true;
  if (value === false) return false;
  return null;
}

function asPlaceId(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function attrsFromHalfwayPlaceRow(
  row: HalfwayPlaceAttrRow,
): HalfwayPlaceAttrFold {
  const placeId = asPlaceId(row.place_id);
  return {
    id: row.id,
    dineIn: asTriState(row.dine_in),
    outdoorSeating: asTriState(row.outdoor_seating),
    ...(placeId ? { placeId } : {}),
  };
}

/**
 * Insert durable Halfway fields before `example`, keeping other keys as-is.
 * Missing backfill rows stay `null` (fail-closed). Does not add shops.
 */
export function shopWithHalfwayPlaceAttrs(
  shop: Shop,
  attrs: Pick<HalfwayPlaceAttrFold, "dineIn" | "outdoorSeating" | "placeId">,
): Shop {
  const next: Record<string, unknown> = {};
  let inserted = false;
  for (const [key, value] of Object.entries(shop)) {
    if (key === "dineIn" || key === "outdoorSeating" || key === "placeId") {
      continue;
    }
    if (key === "example") {
      if (attrs.placeId) next.placeId = attrs.placeId;
      next.dineIn = attrs.dineIn;
      next.outdoorSeating = attrs.outdoorSeating;
      inserted = true;
    }
    next[key] = value;
  }
  if (!inserted) {
    if (attrs.placeId) next.placeId = attrs.placeId;
    next.dineIn = attrs.dineIn;
    next.outdoorSeating = attrs.outdoorSeating;
  }
  return next as Shop;
}

/**
 * Fold Places sit-down attrs onto existing catalog shops only.
 * Soft Places parked. Never invents café rows.
 */
export function foldHalfwayPlaceAttrs(
  shops: readonly Shop[],
  rows: readonly HalfwayPlaceAttrRow[],
): {
  shops: Shop[];
  applied: HalfwayPlaceAttrFold[];
  unmatched: string[];
  missing: string[];
} {
  const byId = new Map<string, HalfwayPlaceAttrFold>();
  for (const row of rows) {
    if (!row?.id) continue;
    byId.set(row.id, attrsFromHalfwayPlaceRow(row));
  }

  const applied: HalfwayPlaceAttrFold[] = [];
  const missing: string[] = [];
  const next = shops.map((shop) => {
    const attrs = byId.get(shop.id);
    if (!attrs) {
      missing.push(shop.id);
      return shopWithHalfwayPlaceAttrs(shop, {
        dineIn: null,
        outdoorSeating: null,
      });
    }
    applied.push(attrs);
    return shopWithHalfwayPlaceAttrs(shop, attrs);
  });

  const catalogIds = new Set(shops.map((shop) => shop.id));
  const unmatched = [...byId.keys()].filter((id) => !catalogIds.has(id));

  return { shops: next, applied, unmatched, missing };
}
