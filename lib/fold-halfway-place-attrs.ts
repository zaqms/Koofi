import type { Shop } from "./types";

/** Places attrs backfill row (19 Sep 2026). Never creates catalog shops. */
export type HalfwayPlaceAttrRow = {
  id: string;
  dine_in?: boolean | null;
  outdoor_seating?: boolean | null;
  place_id?: string | null;
  status?: string;
};

/** Scout manual verdict. Booleans or `"unclear"`. Never creates shops. */
export type HalfwayScoutVerdictRow = {
  id: string;
  dine_in?: boolean | null | "unclear";
  outdoor_seating?: boolean | null | "unclear";
  pickup_only?: boolean | null | "unclear";
  baynana_eligible?: boolean | null | "unclear";
  place_id?: string | null;
  wrong_place_match?: boolean;
  correct_place_id?: string | null;
};

export type HalfwayPlaceAttrFold = {
  id: string;
  dineIn: boolean | null;
  outdoorSeating: boolean | null;
  pickupOnly: boolean | null;
  baynanaEligible?: boolean | null;
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
    pickupOnly: null,
    ...(placeId ? { placeId } : {}),
  };
}

export function attrsFromHalfwayScoutRow(
  row: HalfwayScoutVerdictRow,
): HalfwayPlaceAttrFold {
  const correctId = asPlaceId(row.correct_place_id);
  const matchedId = asPlaceId(row.place_id);
  const placeId = correctId ?? (row.wrong_place_match ? undefined : matchedId);
  return {
    id: row.id,
    dineIn: asTriState(row.dine_in),
    outdoorSeating: asTriState(row.outdoor_seating),
    pickupOnly: asTriState(row.pickup_only),
    baynanaEligible: asTriState(row.baynana_eligible),
    ...(placeId ? { placeId } : {}),
  };
}

/**
 * Scout wins when present. Places fills the rest. Unclear → null.
 * Wrong-pin rows keep Scout `correct_place_id` when Scout sent one.
 */
export function mergeHalfwayPlaceAndScoutAttrs(
  places: HalfwayPlaceAttrFold | undefined,
  scout: HalfwayPlaceAttrFold | undefined,
): Omit<HalfwayPlaceAttrFold, "id"> {
  const base = places ?? {
    dineIn: null,
    outdoorSeating: null,
    pickupOnly: null,
  };
  if (!scout) {
    return {
      dineIn: base.dineIn,
      outdoorSeating: base.outdoorSeating,
      pickupOnly: base.pickupOnly ?? null,
      ...(base.placeId ? { placeId: base.placeId } : {}),
    };
  }
  return {
    dineIn: scout.dineIn,
    outdoorSeating: scout.outdoorSeating,
    pickupOnly: scout.pickupOnly,
    baynanaEligible: scout.baynanaEligible ?? null,
    ...(scout.placeId || base.placeId
      ? { placeId: scout.placeId ?? base.placeId }
      : {}),
  };
}

const ATTR_KEYS = [
  "dineIn",
  "outdoorSeating",
  "pickupOnly",
  "baynanaEligible",
  "placeId",
] as const;

/**
 * Insert durable Halfway fields before `example`, keeping other keys as-is.
 * Missing backfill rows stay `null` (fail-closed). Does not add shops.
 */
export function shopWithHalfwayPlaceAttrs(
  shop: Shop,
  attrs: Omit<HalfwayPlaceAttrFold, "id">,
): Shop {
  const next: Record<string, unknown> = {};
  let inserted = false;
  for (const [key, value] of Object.entries(shop)) {
    if ((ATTR_KEYS as readonly string[]).includes(key)) continue;
    if (key === "example") {
      if (attrs.placeId) next.placeId = attrs.placeId;
      next.dineIn = attrs.dineIn;
      next.outdoorSeating = attrs.outdoorSeating;
      next.pickupOnly = attrs.pickupOnly;
      if (attrs.baynanaEligible !== undefined) {
        next.baynanaEligible = attrs.baynanaEligible;
      }
      inserted = true;
    }
    next[key] = value;
  }
  if (!inserted) {
    if (attrs.placeId) next.placeId = attrs.placeId;
    next.dineIn = attrs.dineIn;
    next.outdoorSeating = attrs.outdoorSeating;
    next.pickupOnly = attrs.pickupOnly;
    if (attrs.baynanaEligible !== undefined) {
      next.baynanaEligible = attrs.baynanaEligible;
    }
  }
  return next as Shop;
}

function indexPlaceRows(
  rows: readonly HalfwayPlaceAttrRow[],
): Map<string, HalfwayPlaceAttrFold> {
  const byId = new Map<string, HalfwayPlaceAttrFold>();
  for (const row of rows) {
    if (!row?.id) continue;
    byId.set(row.id, attrsFromHalfwayPlaceRow(row));
  }
  return byId;
}

function indexScoutRows(
  rows: readonly HalfwayScoutVerdictRow[],
): Map<string, HalfwayPlaceAttrFold> {
  const byId = new Map<string, HalfwayPlaceAttrFold>();
  for (const row of rows) {
    if (!row?.id) continue;
    byId.set(row.id, attrsFromHalfwayScoutRow(row));
  }
  return byId;
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
  return foldHalfwayPlaceAndScoutAttrs(shops, rows, []);
}

/**
 * Places first, then Scout overrides. Existing catalog ids only.
 */
export function foldHalfwayPlaceAndScoutAttrs(
  shops: readonly Shop[],
  placeRows: readonly HalfwayPlaceAttrRow[],
  scoutRows: readonly HalfwayScoutVerdictRow[] = [],
): {
  shops: Shop[];
  applied: HalfwayPlaceAttrFold[];
  scoutApplied: string[];
  unmatched: string[];
  missing: string[];
} {
  const placesById = indexPlaceRows(placeRows);
  const scoutById = indexScoutRows(scoutRows);
  const applied: HalfwayPlaceAttrFold[] = [];
  const scoutApplied: string[] = [];
  const missing: string[] = [];

  const next = shops.map((shop) => {
    const places = placesById.get(shop.id);
    const scout = scoutById.get(shop.id);
    if (!places && !scout) {
      missing.push(shop.id);
      return shopWithHalfwayPlaceAttrs(shop, {
        dineIn: null,
        outdoorSeating: null,
        pickupOnly: null,
      });
    }
    if (scout) scoutApplied.push(shop.id);
    const merged = { id: shop.id, ...mergeHalfwayPlaceAndScoutAttrs(places, scout) };
    applied.push(merged);
    return shopWithHalfwayPlaceAttrs(shop, merged);
  });

  const catalogIds = new Set(shops.map((shop) => shop.id));
  const unmatched = [...new Set([...placesById.keys(), ...scoutById.keys()])].filter(
    (id) => !catalogIds.has(id),
  );

  return { shops: next, applied, scoutApplied, unmatched, missing };
}
