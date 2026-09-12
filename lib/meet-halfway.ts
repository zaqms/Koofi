import { listRealShops } from "./catalog";
import { shopToChatPick } from "./chat-pick";
import { copy } from "./copy";
import { rankByPopularity, rankInDistrict } from "./district-rank";
import { haversineKm } from "./distance";
import { neighborhoodCentroid } from "./neighborhood-tight";
import { officialShopCoords } from "./place-coords";
import { MEET_HALFWAY_CHIP } from "./product";
import { extractMapsUrl } from "./maps-url";
import { resolveSharedPin } from "./shared-pin";
import { dedupeSameBrand } from "./shop-brand";
import { isNeighborhoodId } from "./neighborhoods";
import type { ChatPick, Language, NeighborhoodId, Pin, Shop } from "./types";
import { uniqueWhyLines } from "./why-line";

/**
 * Meet Halfway (`بيننا`).
 *
 * Core ranking is `locations: Location[]` (N≥2). Midpoint is the
 * centroid of the resolved pins (or district centroids when a row
 * has no pin). Do not hard-code a pair-only algorithm.
 *
 * v1 UI is one `/h/{id}` URL: invite → waiting → results (two people).
 * First-page shop_ids freeze on the overlay so refresh does not reshuffle.
 * A later 3–4 friend UI can pass more Location rows without changing this
 * helper. `district` is an extension/fallback — pins always win.
 */
export type HalfwayLocation = {
  pin?: Pin;
  district?: NeighborhoodId;
};

/** Wire/JSON row from the بيننا picker or a later N-pin UI. */
export type HalfwayPinInput = {
  text?: string;
  lat?: number;
  lng?: number;
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

function asPin(lat: number, lng: number): Pin | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
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

/** Centroid of N resolved location pins. Same mean-lat/lng as district centroids. */
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

export async function resolveHalfwayLocations(
  rows: readonly HalfwayPinInput[],
): Promise<HalfwayLocation[]> {
  const locations: HalfwayLocation[] = [];
  for (const row of rows) {
    const fromCoords = asPin(row.lat ?? Number.NaN, row.lng ?? Number.NaN);
    if (fromCoords) {
      locations.push({ pin: fromCoords });
      continue;
    }
    if (typeof row.text === "string" && row.text.trim()) {
      const pin = await resolveSharedPin(row.text);
      if (pin) {
        locations.push({ pin });
        continue;
      }
    }
    if (typeof row.district === "string" && isNeighborhoodId(row.district)) {
      locations.push({ district: row.district });
    }
  }
  return locations;
}

/**
 * Full Most Popular list for the midpoint band (or snap pool) used by
 * بيننا. `غيرها` pages this same set — do not re-expand after skips.
 */
export function halfwayCandidatePool(input: {
  locations: readonly HalfwayLocation[];
  shops?: readonly Shop[];
}): Shop[] {
  const shops = input.shops ?? listRealShops();
  const { locations } = input;
  if (locations.length < 2) return [];

  const nonePinned = locations.every((location) => !location.pin);
  const districts = uniqueDistricts(locations);
  if (nonePinned && districts.length === 1) {
    const only = districts[0];
    if (!only) return [];
    return dedupeSameBrand(rankInDistrict(shops, only));
  }

  const midpoint = locationsCentroid(locations, shops);
  if (!midpoint) {
    if (districts.length === 0) return [];
    const inAreas = shops.filter((shop) =>
      districts.includes(shop.neighborhood),
    );
    return dedupeSameBrand(rankByPopularity(inAreas));
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
    if (ranked.length >= TARGET_PICKS) return ranked;
  }

  // Snap to nearest catalog pins around the N-centroid, then Most Popular.
  withCoords.sort((a, b) => a.km - b.km);
  const nearest = dedupeSameBrand(withCoords.map((row) => row.shop)).slice(
    0,
    Math.max(SNAP_POOL, TARGET_PICKS),
  );
  return dedupeSameBrand(rankByPopularity(nearest));
}

/**
 * Live-catalog shops in a band around the N-location centroid, ranked
 * with locked Most Popular (`popularityIndex`). Never invents shops.
 * `beenIds` skips cafes already shown this session (`غيرها`).
 */
export function pickHalfwayShops(input: {
  locations: readonly HalfwayLocation[];
  beenIds?: string[];
  shops?: readonly Shop[];
  limit?: number;
}): Shop[] {
  const limit = input.limit ?? TARGET_PICKS;
  const been = new Set((input.beenIds ?? []).filter(Boolean));
  return halfwayCandidatePool({
    locations: input.locations,
    shops: input.shops,
  })
    .filter((shop) => !been.has(shop.id))
    .slice(0, limit);
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

export function meetHalfwayAskLabel(language: Language): string {
  return language === "ar"
    ? `${MEET_HALFWAY_CHIP.ar} · دبوسين`
    : `${MEET_HALFWAY_CHIP.en} · two pins`;
}

/** Exhausted بيننا band — never the generic thin-catalog disclaimer. */
export function meetHalfwayReply(input: {
  shopCount: number;
  language: Language;
}): string {
  if (input.shopCount <= 0) return copy.meetHalfwayNoMore[input.language];
  if (input.shopCount >= 3) return copy.meetHalfwayThree[input.language];
  return copy.fewerPicks[input.language];
}

/**
 * Results footer under بيننا cards (local two-pin and /h/ guest).
 * غيرها only when the same midpoint band still has leftover shops.
 * Empty copy only after paging that leftover to zero — not on a
 * first page whose band is exactly 3.
 */
export type HalfwayResultsFooterKind = "more" | "exhausted" | null;

export function halfwayResultsFooterKind(input: {
  halfwayMore?: boolean;
  paged?: boolean;
}): HalfwayResultsFooterKind {
  if (input.halfwayMore === true) return "more";
  if (input.halfwayMore === false && input.paged) return "exhausted";
  return null;
}

export function halfwayPinFailCopy(
  language: Language,
  rows: readonly HalfwayPinInput[],
): string {
  const usedMaps = rows.some(
    (row) => typeof row.text === "string" && Boolean(extractMapsUrl(row.text)),
  );
  return usedMaps
    ? copy.meetHalfwayBadMaps[language]
    : copy.meetHalfwayBadPin[language];
}

export function parseHalfwaySessionId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const id = (value as { id?: unknown }).id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

export function restoreHalfwayPicks(input: {
  shopIds: readonly string[];
  language: Language;
}): ChatPick[] {
  const shops = input.shopIds.flatMap((id) => {
    const shop = listRealShops().find((row) => row.id === id);
    return shop ? [shop] : [];
  });
  const whys = uniqueWhyLines(shops, input.language);
  return shops.map((shop, index) =>
    shopToChatPick(shop, input.language, whys[index] ?? ""),
  );
}

export function halfwayFrozenMore(input: {
  locations: readonly HalfwayLocation[];
  shopIds: readonly string[];
}): boolean {
  if (input.locations.length < 2 || input.shopIds.length === 0) return false;
  return (
    pickHalfwayShops({
      locations: input.locations,
      beenIds: [...input.shopIds],
      limit: 1,
    }).length > 0
  );
}

export function parseHalfwayPinInputs(value: unknown): HalfwayPinInput[] | null {
  if (!value || typeof value !== "object") return null;
  const locations = (value as { locations?: unknown }).locations;
  if (!Array.isArray(locations) || locations.length < 2) return null;
  const rows: HalfwayPinInput[] = [];
  for (const row of locations) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    rows.push({
      text: typeof item.text === "string" ? item.text : undefined,
      lat: typeof item.lat === "number" ? item.lat : undefined,
      lng: typeof item.lng === "number" ? item.lng : undefined,
      district: typeof item.district === "string" ? item.district : undefined,
    });
  }
  return rows.length >= 2 ? rows : null;
}
