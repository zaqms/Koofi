import type { Language } from "./types";

export type AnalyticsEventName =
  | "three_pick_shown"
  | "share_pack"
  | "share_packet_copy"
  | "share_listing"
  | "share_inbound"
  | "maps_click"
  | "feedback_add"
  | "feedback_vote"
  | "chip_tap"
  | "district_select"
  | "chat_query";

export type MapsClickSource = "pack" | "list" | "card";
export type ShareInboundKind = "pack" | "listing";
export type ListingShareSource = "list" | "card";
export type ChatQueryVia = "typed" | "chip";

export type AnalyticsParams = {
  locale?: Language;
  shop_ids?: string | string[];
  shop_id?: string;
  pack_id?: string;
  from?: string;
  kind?: ShareInboundKind;
  source?: MapsClickSource | ListingShareSource;
  text_length?: number;
  chip_id?: string;
  chip_label?: string;
  district_id?: string;
  district_ar?: string;
  district_en?: string;
  query_text?: string;
  via?: ChatQueryVia;
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
 * Params for a submitted chat ask. Null for empty / whitespace-only text.
 * Used only from the send path — opener render and chip UI do not call this.
 */
export function chatQueryParams(input: {
  text: string;
  locale: Language;
  via?: ChatQueryVia;
}): AnalyticsParams | null {
  const query_text = input.text.trim();
  if (!query_text) return null;
  return {
    query_text,
    locale: input.locale,
    via: input.via ?? "typed",
    text_length: query_text.length,
  };
}

/** Fire chat_query once per submitted ask. No-op for empty text or SSR. */
export function trackChatQuery(input: {
  text: string;
  locale: Language;
  via?: ChatQueryVia;
}): boolean {
  const params = chatQueryParams(input);
  if (!params || !params.query_text) return false;
  trackEvent("chat_query", params, {
    dedupeKey: `chat_query:${params.via}:${params.query_text}`,
  });
  return true;
}

/**
 * Push a named event to the GTM dataLayer. No-op during SSR.
 * chat_query sends the exact submitted ask (cafe / neighborhood text).
 * Do not send assistant replies, session ids, or other personal identifiers.
 */
export function trackEvent(
  name: AnalyticsEventName,
  params?: AnalyticsParams,
  options?: { dedupeKey?: string },
): void {
  const browserWindow = globalThis.window;
  if (!browserWindow) return;

  const dedupeKey =
    options?.dedupeKey ?? `${name}:${JSON.stringify(params ?? {})}`;
  if (shouldDedupe(dedupeKey)) return;

  browserWindow.dataLayer = browserWindow.dataLayer || [];
  browserWindow.dataLayer.push({ event: name, ...params });
}
