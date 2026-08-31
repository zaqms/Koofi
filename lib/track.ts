import type { Language } from "./types";

export type AnalyticsEventName =
  | "ask_sent"
  | "chip_tap"
  | "cafe_open"
  | "maps_click";

export type MapsClickSource = "card" | "chat" | "list";

export type AnalyticsParams = {
  locale?: Language;
  text_length?: number;
  chip_id?: string;
  shop_id?: string;
  source?: MapsClickSource;
};

const DEDUPE_MS = 400;
let lastDedupeKey = "";
let lastDedupeAt = 0;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function shouldDedupe(key: string): boolean {
  const now = Date.now();
  if (key === lastDedupeKey && now - lastDedupeAt < DEDUPE_MS) return true;
  lastDedupeKey = key;
  lastDedupeAt = now;
  return false;
}

/** Push a named event to the GTM dataLayer. No-op during SSR. */
export function trackEvent(
  name: AnalyticsEventName,
  params?: AnalyticsParams,
  options?: { dedupeKey?: string },
): void {
  if (typeof window === "undefined") return;

  const dedupeKey = options?.dedupeKey ?? `${name}:${JSON.stringify(params ?? {})}`;
  if (shouldDedupe(dedupeKey)) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
}
