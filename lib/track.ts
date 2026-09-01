import type { Language } from "./types";

export type AnalyticsEventName =
  | "three_pick_shown"
  | "share_pack"
  | "share_packet_copy"
  | "share_listing"
  | "share_inbound"
  | "maps_click"
  | "feedback_add"
  | "feedback_vote";

export type MapsClickSource = "pack" | "list" | "card";
export type ShareInboundKind = "pack" | "listing";
export type ListingShareSource = "list" | "card";

export type AnalyticsParams = {
  locale?: Language;
  shop_ids?: string | string[];
  shop_id?: string;
  pack_id?: string;
  from?: string;
  kind?: ShareInboundKind;
  source?: MapsClickSource | ListingShareSource;
  text_length?: number;
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

/**
 * Push a named event to the GTM dataLayer. No-op during SSR.
 * Never send a full user message — text_length only.
 */
export function trackEvent(
  name: AnalyticsEventName,
  params?: AnalyticsParams,
  options?: { dedupeKey?: string },
): void {
  if (typeof window === "undefined") return;

  const dedupeKey =
    options?.dedupeKey ?? `${name}:${JSON.stringify(params ?? {})}`;
  if (shouldDedupe(dedupeKey)) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
}
