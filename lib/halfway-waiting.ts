import { decodeHalfwayInviteId } from "./halfway-invite";
import type { Language, Pin } from "./types";

/**
 * Host-only wait after اعزم خويك.
 * The checksummed `/h/{id}` URL still only has Person A's pin.
 * Guest B is written to the invite overlay; this record lets A
 * keep polling after a remount or refresh (no accounts).
 */
export const HALFWAY_WAITING_STORAGE_KEY = "wain.halfwayWaiting.v1";
export const HALFWAY_FRESH_STORAGE_KEY = "wain.halfwayFresh.v1";

export type HalfwayWaitingRecord = {
  id: string;
  locale: Language;
  me: Pin;
};

function isPin(value: unknown): value is Pin {
  if (!value || typeof value !== "object") return false;
  const lat = (value as { lat?: unknown }).lat;
  const lng = (value as { lng?: unknown }).lng;
  return typeof lat === "number" && typeof lng === "number";
}

export function parseHalfwayWaiting(raw: string): HalfwayWaitingRecord | null {
  try {
    const parsed = JSON.parse(raw) as {
      id?: unknown;
      locale?: unknown;
      me?: unknown;
    };
    if (typeof parsed.id !== "string" || !parsed.id.trim()) return null;
    if (parsed.locale !== "ar" && parsed.locale !== "en") return null;
    if (!isPin(parsed.me)) return null;
    if (!decodeHalfwayInviteId(parsed.id)) return null;
    return {
      id: parsed.id,
      locale: parsed.locale,
      me: { lat: parsed.me.lat, lng: parsed.me.lng },
    };
  } catch {
    return null;
  }
}

export function readHalfwayWaiting(): HalfwayWaitingRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(HALFWAY_WAITING_STORAGE_KEY);
    if (!raw) return null;
    const record = parseHalfwayWaiting(raw);
    if (!record) {
      window.sessionStorage.removeItem(HALFWAY_WAITING_STORAGE_KEY);
      return null;
    }
    return record;
  } catch {
    return null;
  }
}

export function writeHalfwayWaiting(record: HalfwayWaitingRecord): void {
  if (typeof window === "undefined") return;
  if (!decodeHalfwayInviteId(record.id)) return;
  try {
    window.sessionStorage.setItem(
      HALFWAY_WAITING_STORAGE_KEY,
      JSON.stringify({
        id: record.id,
        locale: record.locale,
        me: { lat: record.me.lat, lng: record.me.lng },
      }),
    );
  } catch {
    // Private mode / quota — poll still works for this tab session.
  }
}

export function clearHalfwayWaiting(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(HALFWAY_WAITING_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** After Start a new Halfway — home Chat opens a fresh invite, not the old `/h/{id}`. */
export function markHalfwayFresh(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(HALFWAY_FRESH_STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

export function consumeHalfwayFresh(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(HALFWAY_FRESH_STORAGE_KEY);
    if (!raw) return false;
    window.sessionStorage.removeItem(HALFWAY_FRESH_STORAGE_KEY);
    return raw === "1";
  } catch {
    return false;
  }
}
