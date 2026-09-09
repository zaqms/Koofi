import {
  extractMapsUrl,
  followGoogleRedirects,
} from "./maps-url";
import type { Pin } from "./types";

/**
 * Friend / visitor pins for Meet Halfway — not official shop geometry.
 * Catalog shops still use `officialShopCoords` (place `!3d!4d` only).
 */
const LAT_LNG =
  /^\s*(-?\d+(?:\.\d+)?)\s*[,/\s]\s*(-?\d+(?:\.\d+)?)\s*$/;

function asPin(lat: number, lng: number): Pin | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

function pinFromLatLngText(text: string): Pin | null {
  const pair = text.match(LAT_LNG);
  if (!pair?.[1] || !pair[2]) return null;
  return asPin(Number(pair[1]), Number(pair[2]));
}

/** Sync parse: lat,lng, place `!3d!4d`, `@lat,lng`, or `q`/`query`/`ll`. */
export function parseSharedPin(raw: string): Pin | null {
  const text = raw.trim();
  if (!text) return null;

  const direct = pinFromLatLngText(text);
  if (direct) return direct;

  const place = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (place?.[1] && place[2]) {
    return asPin(Number(place[1]), Number(place[2]));
  }

  const at = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at?.[1] && at[2]) {
    return asPin(Number(at[1]), Number(at[2]));
  }

  try {
    const url = new URL(text);
    for (const key of ["q", "query", "ll"] as const) {
      const value = url.searchParams.get(key);
      if (!value) continue;
      const fromQuery = pinFromLatLngText(value);
      if (fromQuery) return fromQuery;
    }
  } catch {
    // not a URL
  }

  return null;
}

export function looksLikeSharedPin(raw: string): boolean {
  const text = raw.trim();
  if (!text) return false;
  if (parseSharedPin(text)) return true;
  return Boolean(extractMapsUrl(text));
}

/** Follow Google short links, then parse. Server-only (no CORS). */
export async function resolveSharedPin(raw: string): Promise<Pin | null> {
  const direct = parseSharedPin(raw);
  if (direct) return direct;
  const maps = extractMapsUrl(raw);
  if (!maps) return null;
  const resolved = await followGoogleRedirects(maps);
  return parseSharedPin(resolved);
}
