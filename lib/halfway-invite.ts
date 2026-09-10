import { halfwayInvitePath, halfwayInviteSharePath } from "./product";
import type { Language, Pin } from "./types";

/**
 * بيننا invite token — stateless URL (same checksum family as `/p/`).
 *
 * Payload is `locations: Pin[]` (N≥1) plus locale + expiry. v1 share
 * encodes Person A's pin; a later 3–4 friend link can encode more rows
 * without changing the shape. Guest adds one pin on `/h/{id}`.
 *
 * TTL is 45 minutes (inside the 30–60 lock). No accounts.
 * Optional Neon/memory overlay (`lib/halfway-invite-store.ts`) lets
 * Person A see the friend's pin without a page refresh. Friend B
 * never needs it — A's pin is already in the URL.
 */
export const HALFWAY_INVITE_TTL_MS = 45 * 60 * 1000;
export const HALFWAY_INVITE_MAX_PINS = 4;

export type HalfwayInviteSeed = {
  locale: Language;
  locations: Pin[];
  exp: number;
};

function checksum(body: string): string {
  let hash = 2166136261;
  for (let i = 0; i < body.length; i += 1) {
    hash ^= body.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function utf8ToBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToUtf8(text: string): string {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function roundHalfwayPin(lat: number, lng: number): Pin | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return {
    lat: Math.round(lat * 1e5) / 1e5,
    lng: Math.round(lng * 1e5) / 1e5,
  };
}

function cleanPins(rows: readonly { lat?: number; lng?: number }[]): Pin[] {
  const pins: Pin[] = [];
  for (const row of rows) {
    if (row.lat == null || row.lng == null) continue;
    const pin = roundHalfwayPin(row.lat, row.lng);
    if (!pin) continue;
    if (pins.some((existing) => sameHalfwayPin(existing, pin))) continue;
    pins.push(pin);
    if (pins.length >= HALFWAY_INVITE_MAX_PINS) break;
  }
  return pins;
}

export function sameHalfwayPin(a: Pin, b: Pin): boolean {
  return Math.abs(a.lat - b.lat) < 1e-4 && Math.abs(a.lng - b.lng) < 1e-4;
}

/** First stored pin that is not already in the host/URL seed. */
export function guestPinFromLocations(
  host: readonly Pin[],
  locations: readonly Pin[],
): Pin | null {
  for (const pin of locations) {
    if (!host.some((row) => sameHalfwayPin(row, pin))) return pin;
  }
  return locations.length >= 2 ? (locations[1] ?? null) : null;
}

export function halfwayInviteHasGuest(
  host: readonly Pin[],
  locations: readonly Pin[],
): boolean {
  return locations.length >= 2 && guestPinFromLocations(host, locations) !== null;
}

export function encodeHalfwayInviteId(input: {
  locale: Language;
  locations: readonly { lat: number; lng: number }[];
  now?: number;
  ttlMs?: number;
}): string | null {
  const locations = cleanPins(input.locations);
  if (locations.length < 1) return null;
  const now = input.now ?? Date.now();
  const payload = JSON.stringify({
    v: 1,
    l: input.locale === "en" ? "e" : "a",
    p: locations.map((pin) => [pin.lat, pin.lng]),
    e: now + (input.ttlMs ?? HALFWAY_INVITE_TTL_MS),
  });
  const body = utf8ToBase64Url(payload);
  return `${body}.${checksum(body)}`;
}

export function inspectHalfwayInviteId(
  id: string,
  now = Date.now(),
):
  | { ok: true; seed: HalfwayInviteSeed }
  | { ok: false; reason: "bad" | "expired" } {
  const trimmed = id.trim();
  const dot = trimmed.lastIndexOf(".");
  if (dot < 2) return { ok: false, reason: "bad" };
  const body = trimmed.slice(0, dot);
  const sig = trimmed.slice(dot + 1);
  if (!body || !sig || checksum(body) !== sig) return { ok: false, reason: "bad" };
  if (!/^[A-Za-z0-9_-]+$/.test(body)) return { ok: false, reason: "bad" };

  try {
    const parsed = JSON.parse(base64UrlToUtf8(body)) as {
      v?: unknown;
      l?: unknown;
      p?: unknown;
      e?: unknown;
    };
    if (parsed.v !== 1) return { ok: false, reason: "bad" };
    if (parsed.l !== "a" && parsed.l !== "e") return { ok: false, reason: "bad" };
    if (!Array.isArray(parsed.p) || typeof parsed.e !== "number") {
      return { ok: false, reason: "bad" };
    }
    const locations = cleanPins(
      parsed.p.flatMap((row) => {
        if (!Array.isArray(row) || row.length < 2) return [];
        const lat = row[0];
        const lng = row[1];
        if (typeof lat !== "number" || typeof lng !== "number") return [];
        return [{ lat, lng }];
      }),
    );
    if (locations.length < 1) return { ok: false, reason: "bad" };
    if (parsed.e <= now) return { ok: false, reason: "expired" };
    return {
      ok: true,
      seed: {
        locale: parsed.l === "e" ? "en" : "ar",
        locations,
        exp: parsed.e,
      },
    };
  } catch {
    return { ok: false, reason: "bad" };
  }
}

export function decodeHalfwayInviteId(
  id: string,
  now = Date.now(),
): HalfwayInviteSeed | null {
  const inspected = inspectHalfwayInviteId(id, now);
  return inspected.ok ? inspected.seed : null;
}

export function halfwayInviteShareText(input: {
  language: Language;
  url: string;
}): string {
  const line =
    input.language === "ar"
      ? "بيننا — اعزم خويك. أنا هنا. وين أنت؟"
      : "Halfway — I'm here. Where are you?";
  return `${line}\n\n${input.url}`;
}

export { halfwayInvitePath, halfwayInviteSharePath };
