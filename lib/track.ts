import {
  halfwayResultCafesFromPicks,
  type HalfwayResultCafe,
} from "./halfway-results-payload";
import type { ViralShareChannel } from "./tonight";
import type { ChatPick, City, Language, Pin } from "./types";

export type { ViralShareChannel } from "./tonight";

export type AnalyticsEventName =
  | "three_pick_shown"
  | "share_pack"
  | "share_packet_copy"
  | "share_listing"
  | "share_inbound"
  | "maps_click"
  | "feedback_add"
  | "feedback_vote"
  | "cafe_upvote"
  | "cafe_unvote"
  | "chip_tap"
  | "district_select"
  | "neighborhoods_view_all"
  | "neighborhoods_search"
  | "neighborhoods_sort"
  | "directory_sort"
  | "district_match"
  | "chat_query"
  | "tonight_card_open"
  | "tonight_card_mint"
  | "tonight_card_share"
  | "invite_open"
  | "invite_share"
  | "meet_halfway_open"
  | "meet_halfway_pin"
  | "meet_halfway_invite_share"
  | "meet_halfway_invite_open"
  | "meet_halfway_invite_joined"
  | "meet_halfway_results"
  | "meet_halfway_refresh"
  | "meet_halfway_empty"
  | "meet_halfway_results_share"
  | "meet_halfway_start_new"
  | "meet_halfway_restore"
  | "meet_halfway_expired"
  | "meet_halfway_feedback";

export type MapsClickSource = "pack" | "list" | "card";
export type ShareInboundKind = "pack" | "listing" | "halfway";
export type ListingShareSource = "list" | "card";
export type DistrictSelectSource = "home_pill" | "view_all";
export type NeighborhoodsSortId = "nearby" | "popular" | "az";
export type DirectorySortId = "nearby" | "new" | "az";
export type ChatQueryVia = "typed" | "chip";
export type MeetHalfwayPinWhich = "a" | "b" | "self";
export type MeetHalfwayPinMethod = "geolocation" | "paste" | "maps_url";
export type MeetHalfwayResultSource = "local" | "invite";
export type MeetHalfwayStartSource = "results" | "expired";
export type MeetHalfwayFeedbackSource = "local" | "invite" | "host" | "guest";
export type MeetHalfwayFeedbackHelpful = "yes" | "no";
export type MeetHalfwayFeedbackReason =
  | "too_far"
  | "vibe"
  | "more_options"
  | "other";
/** Screen that painted the shared results-feedback master. */
export type ResultsFeedbackSource =
  | "halfway_results"
  | "chat_results"
  | "search_results"
  | "category_results"
  | "cafe_detail"
  | "zero_results";
export type ResultsFeedbackReason =
  | MeetHalfwayFeedbackReason
  | "not_relevant"
  | "not_expected"
  | "location"
  | "hours"
  | "seating"
  | "category"
  | "photos"
  | "closer"
  | "different_vibe"
  | "different_category";
export type ResultsFeedbackFeature =
  | "halfway"
  | "chat"
  | "search"
  | "category"
  | "cafe_detail"
  | "zero_results";

export type AnalyticsParams = {
  locale?: Language;
  shop_ids?: string | string[];
  shop_id?: string;
  pack_id?: string;
  from?: string;
  kind?: ShareInboundKind;
  source?:
    | MapsClickSource
    | ListingShareSource
    | MeetHalfwayResultSource
    | MeetHalfwayStartSource
    | MeetHalfwayFeedbackSource
    | ResultsFeedbackSource
    | DistrictSelectSource;
  /** Structured placement — Halfway GA still reads `source` as host/guest/local. */
  feedback_source?: ResultsFeedbackSource;
  feature?: ResultsFeedbackFeature;
  /** Alias of locale for the shared results-feedback payload. */
  language?: Language;
  /** Optional free-text after Something else. */
  feedback_text?: string;
  /** True when this push is the optional note, not the Yes/No count. */
  feedback_note?: boolean;
  timestamp?: string;
  category_id?: string;
  category_slug?: string;
  city?: City;
  sort?: NeighborhoodsSortId | DirectorySortId;
  text_length?: number;
  chip_id?: string;
  chip_label?: string;
  district_id?: string;
  district_ar?: string;
  district_en?: string;
  district_slug?: string;
  query_text?: string;
  via?: ChatQueryVia;
  channel?: ViralShareChannel;
  which?: MeetHalfwayPinWhich;
  method?: MeetHalfwayPinMethod;
  count?: number;
  page?: number;
  /** Additive بيننا results cafés for GTM Preview / a GTM webhook tag. */
  cafes?: HalfwayResultCafe[];
  /** Same `/h/{id}` token as pack_id — GTM-friendly alias. */
  session_id?: string;
  /** Same `/h/{id}` token as pack_id — GTM-friendly alias. */
  invite_id?: string;
  /** بيننا results feedback — yes / no. GTM/GA4 primary. */
  feedback?: MeetHalfwayFeedbackHelpful;
  /** Stable English chip id after Not really. */
  feedback_reason?: ResultsFeedbackReason;
  /** Alias of feedback — keep for existing GTM Preview notes. */
  helpful?: MeetHalfwayFeedbackHelpful;
  /** Alias of feedback_reason. */
  reason?: ResultsFeedbackReason;
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

export function neighborhoodsSearchParams(input: {
  query: string;
  locale: Language;
  city: City;
}): AnalyticsParams | null {
  const query_text = input.query.trim();
  if (!query_text) return null;
  return { query_text, locale: input.locale, city: input.city };
}

/** Fire neighborhoods_search after the View All search debounce. Skip empty. */
export function trackNeighborhoodsSearch(input: {
  query: string;
  locale: Language;
  city: City;
}): boolean {
  const params = neighborhoodsSearchParams(input);
  if (!params?.query_text) return false;
  trackEvent("neighborhoods_search", params, {
    dedupeKey: `neighborhoods_search:${params.locale}:${params.city}:${params.query_text}`,
  });
  return true;
}

/** Fire district_match when a typed ask resolved to a live حي. */
export function districtMatchParams(input: {
  district_slug: string;
  locale: Language;
}): AnalyticsParams | null {
  const district_slug = input.district_slug.trim();
  if (!district_slug) return null;
  return { district_slug, locale: input.locale };
}

export function resultsFeedbackParams(input: {
  locale: Language;
  feedback: MeetHalfwayFeedbackHelpful;
  feedback_reason?: ResultsFeedbackReason;
  feedback_text?: string;
  feedback_note?: boolean;
  source: ResultsFeedbackSource;
  halfwaySource?: MeetHalfwayFeedbackSource;
  feature: ResultsFeedbackFeature;
  count?: number;
  packId?: string;
  shopIds?: string[];
  shopId?: string;
  queryText?: string;
  categoryId?: string;
  categorySlug?: string;
}): AnalyticsParams {
  const halfway = input.source === "halfway_results";
  const shop_ids =
    input.shopIds && input.shopIds.length > 0
      ? input.shopIds.join(",")
      : undefined;
  return {
    locale: input.locale,
    language: input.locale,
    feature: input.feature,
    feedback_source: input.source,
    feedback: input.feedback,
    helpful: input.feedback,
    timestamp: new Date().toISOString(),
    ...(halfway
      ? input.halfwaySource
        ? { source: input.halfwaySource }
        : {}
      : { source: input.source }),
    ...(input.feedback_reason
      ? {
          feedback_reason: input.feedback_reason,
          reason: input.feedback_reason,
        }
      : {}),
    ...(input.feedback_text ? { feedback_text: input.feedback_text } : {}),
    ...(input.feedback_note ? { feedback_note: true } : {}),
    ...(typeof input.count === "number" ? { count: input.count } : {}),
    ...(input.packId
      ? {
          pack_id: input.packId,
          session_id: input.packId,
          invite_id: input.packId,
        }
      : {}),
    ...(shop_ids ? { shop_ids } : {}),
    ...(input.shopId ? { shop_id: input.shopId } : {}),
    ...(input.queryText ? { query_text: input.queryText } : {}),
    ...(input.categoryId ? { category_id: input.categoryId } : {}),
    ...(input.categorySlug
      ? { category_slug: input.categorySlug, district_slug: input.categorySlug }
      : {}),
  };
}

export function meetHalfwayFeedbackParams(input: {
  locale: Language;
  feedback: MeetHalfwayFeedbackHelpful;
  feedback_reason?: MeetHalfwayFeedbackReason;
  source?: MeetHalfwayFeedbackSource;
  count?: number;
  packId?: string;
  shopIds?: string[];
}): AnalyticsParams {
  return resultsFeedbackParams({
    locale: input.locale,
    feedback: input.feedback,
    feedback_reason: input.feedback_reason,
    source: "halfway_results",
    halfwaySource: input.source,
    feature: "halfway",
    count: input.count,
    packId: input.packId,
    shopIds: input.shopIds,
  });
}

export function meetHalfwayResultsParams(input: {
  locale: Language;
  source: MeetHalfwayResultSource;
  picks: readonly ChatPick[];
  packId?: string;
  midpoint?: Pin | null;
}): AnalyticsParams {
  return {
    locale: input.locale,
    count: input.picks.length,
    source: input.source,
    ...(input.packId
      ? {
          pack_id: input.packId,
          session_id: input.packId,
          invite_id: input.packId,
        }
      : {}),
    cafes: halfwayResultCafesFromPicks({
      picks: input.picks,
      midpoint: input.midpoint,
    }),
  };
}

export function trackDistrictMatch(input: {
  district_slug: string;
  locale: Language;
}): boolean {
  const params = districtMatchParams(input);
  if (!params || !params.district_slug) return false;
  trackEvent("district_match", params, {
    dedupeKey: `district_match:${params.district_slug}:${params.locale}`,
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
