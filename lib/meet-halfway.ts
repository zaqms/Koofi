import { listRealShops } from "./catalog";
import { shopToChatPick } from "./chat-pick";
import { rankByPopularity, rankInDistrict } from "./district-rank";
import { haversineKm } from "./distance";
import { neighborhoodCentroid } from "./neighborhood-tight";
import { isNeighborhoodId, neighborhoodLabel } from "./neighborhoods";
import { officialShopCoords } from "./place-coords";
import { MEET_HALFWAY_CHIP } from "./product";
import { dedupeSameBrand } from "./shop-brand";
import type { ChatPick, Language, NeighborhoodId, Pin, Shop } from "./types";
import { uniqueWhyLines } from "./why-line";

/**
 * Meet Halfway (`بيننا`).
 *
 * Core ranking is `locations: Location[]` (N≥2). Midpoint is the
 * centroid of the N district centroids — do not hard-code a pair-only
 * algorithm. v1 UI ships exactly two district pickers. A later 3–4
 * friend UI can pass more Location rows without changing this helper.
 *
 * `pin` is reserved for a later Maps/geo phase. v1 does not collect pins.
 */
export type HalfwayLocation = {
  district?: NeighborhoodId;
  pin?: Pin;
};

/** Wire/JSON row from the بيننا picker. v1 sends district only. */
export type HalfwayInput = {
  district?: string;
};

const TARGET_PICKS = 3;
const MIN_BAND_KM = 1.5;
const BAND_FRACTION = 0.35;
const EXPAND_STEPS = [1, 1.5, 2, 3, 4] as const;
const SNAP_POOL = 12;

function normalizeChipAsk(text: string): string {
  return text
    .toLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Exact chip label only — typed `بيننا` / Halfway, not a vibe moment. */
export function isMeetHalfwayChipAsk(text: string): boolean {
  const haystack = normalizeChipAsk(text);
  if (!haystack) return false;
  return (
    haystack === normalizeChipAsk(MEET_HALFWAY_CHIP.ar) ||
    haystack === normalizeChipAsk(MEET_HALFWAY_CHIP.en)
  );
}

export function locationPin(
  location: HalfwayLocation,
  shops: readonly Pick<Shop, "neighborhood" | "pin" | "mapsShareUrl">[],
): Pin | null {
  if (location.pin) return location.pin;
  if (location.district) return neighborhoodCentroid(location.district, shops);
  return null;
}

/** Centroid of N resolved location pins (district centroids in v1). */
export function locationsCentroid(
  locations: readonly HalfwayLocation[],
  shops: readonly Pick<Shop, "neighborhood" | "pin" | "mapsShareUrl">[],
): Pin | null {
  const pins: Pin[] = [];
  for (const location of locations) {
    const pin = locationPin(location, shops);
    if (pin) pins.push(pin);
  }
  if (pins.length === 0) return null;
  let lat = 0;
  let lng = 0;
  for (const pin of pins) {
    lat += pin.lat;
    lng += pin.lng;
  }
  return { lat: lat / pins.length, lng: lng / pins.length };
}

function uniqueDistricts(
  locations: readonly HalfwayLocation[],
): NeighborhoodId[] {
  const ids: NeighborhoodId[] = [];
  for (const location of locations) {
    if (location.district && !ids.includes(location.district)) {
      ids.push(location.district);
    }
  }
  return ids;
}

export function resolveHalfwayLocations(
  rows: readonly HalfwayInput[],
): HalfwayLocation[] {
  const locations: HalfwayLocation[] = [];
  for (const row of rows) {
    if (typeof row.district === "string" && isNeighborhoodId(row.district)) {
      locations.push({ district: row.district });
    }
  }
  return locations;
}

/**
 * Live-catalog shops in a band around the N-location centroid, ranked
 * with locked Most Popular (`popularityIndex`). Never invents shops.
 */
export function pickHalfwayShops(input: {
  locations: readonly HalfwayLocation[];
  beenIds?: string[];
  shops?: readonly Shop[];
  limit?: number;
}): Shop[] {
  const limit = input.limit ?? TARGET_PICKS;
  const been = new Set((input.beenIds ?? []).filter(Boolean));
  const shops = (input.shops ?? listRealShops()).filter(
    (shop) => !been.has(shop.id),
  );
  const { locations } = input;
  if (locations.length < 2) return [];

  const districts = uniqueDistricts(locations);
  if (districts.length === 1) {
    const only = districts[0];
    if (!only) return [];
    return dedupeSameBrand(rankInDistrict(shops, only)).slice(0, limit);
  }

  const midpoint = locationsCentroid(locations, shops);
  if (!midpoint) {
    if (districts.length === 0) return [];
    const inAreas = shops.filter((shop) =>
      districts.includes(shop.neighborhood),
    );
    return dedupeSameBrand(rankByPopularity(inAreas)).slice(0, limit);
  }

  const locationPins: Pin[] = [];
  for (const location of locations) {
    const pin = locationPin(location, shops);
    if (pin) locationPins.push(pin);
  }
  const spreadKm = Math.max(
    0,
    ...locationPins.map((pin) => haversineKm(midpoint, pin)),
  );
  const baseBand = Math.max(MIN_BAND_KM, spreadKm * BAND_FRACTION);

  const withCoords: { shop: Shop; km: number }[] = [];
  for (const shop of shops) {
    const coords = officialShopCoords(shop);
    if (!coords) continue;
    withCoords.push({ shop, km: haversineKm(midpoint, coords) });
  }

  for (const step of EXPAND_STEPS) {
    const bandKm = baseBand * step;
    const inBand = withCoords
      .filter((row) => row.km <= bandKm)
      .map((row) => row.shop);
    const ranked = dedupeSameBrand(rankByPopularity(inBand));
    if (ranked.length >= limit) return ranked.slice(0, limit);
  }

  // Snap to nearest catalog cafes around the N-centroid, then Most Popular.
  withCoords.sort((a, b) => a.km - b.km);
  const nearest = dedupeSameBrand(withCoords.map((row) => row.shop)).slice(
    0,
    Math.max(SNAP_POOL, limit),
  );
  return dedupeSameBrand(rankByPopularity(nearest)).slice(0, limit);
}

export function meetHalfwayChatPicks(input: {
  locations: readonly HalfwayLocation[];
  beenIds?: string[];
  language: Language;
}): ChatPick[] {
  const shops = pickHalfwayShops({
    locations: input.locations,
    beenIds: input.beenIds,
  });
  const whys = uniqueWhyLines(shops, input.language);
  return shops.map((shop, index) =>
    shopToChatPick(shop, input.language, whys[index] ?? ""),
  );
}

export function meetHalfwayAskLabel(
  locations: readonly HalfwayLocation[],
  language: Language,
): string {
  const chip =
    language === "ar" ? MEET_HALFWAY_CHIP.ar : MEET_HALFWAY_CHIP.en;
  const names = locations
    .map((location) =>
      location.district
        ? neighborhoodLabel(location.district, language)
        : "",
    )
    .filter(Boolean);
  return names.length > 0 ? `${chip} · ${names.join(" × ")}` : chip;
}

export function parseHalfwayInputs(value: unknown): HalfwayInput[] | null {
  if (!value || typeof value !== "object") return null;
  const locations = (value as { locations?: unknown }).locations;
  if (!Array.isArray(locations) || locations.length < 2) return null;
  const rows: HalfwayInput[] = [];
  for (const row of locations) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    rows.push({
      district: typeof item.district === "string" ? item.district : undefined,
    });
  }
  return rows.length >= 2 ? rows : null;
}
