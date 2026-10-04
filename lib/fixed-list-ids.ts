import type { Language } from "./types";

/**
 * The four list-first pages. Slugs stay the live chip URLs.
 * Tile labels stay in the discovery registry. These headings are the page H1s.
 */
export const FIXED_LIST_IDS = ["nearby", "outdoor", "coffee", "work"] as const;

export type FixedListId = (typeof FIXED_LIST_IDS)[number];

export function isFixedListId(id: string | null | undefined): id is FixedListId {
  return !!id && (FIXED_LIST_IDS as readonly string[]).includes(id);
}

/** Nearby shows this many cards, then «عرض المزيد» / Show more adds the same. */
export const FIXED_LIST_NEARBY_PAGE_SIZE = 12;

export const FIXED_LIST_HEADING: Record<FixedListId, { ar: string; en: string }> = {
  nearby: { ar: "قهاوي قريبة منك", en: "Coffee shops near you" },
  outdoor: {
    ar: "قهاوي فيها جلسات خارجية في الرياض",
    en: "Coffee shops with outdoor seating in Riyadh",
  },
  coffee: { ar: "أفضل قهوة في الرياض", en: "Best coffee in Riyadh" },
  work: {
    ar: "قهاوي تنفع للشغل في الرياض",
    en: "Coffee shops to work from in Riyadh",
  },
};

/**
 * One honest line under the H1. Counts live in the meta description, not here.
 * Best coffee uses the Most Popular index (baked Maps + Instagram, plus the
 * TikTok bonus). It is not a count of which cafés visitors open.
 */
export const FIXED_LIST_EXPLAINER: Record<
  FixedListId,
  { ar: string; en: string }
> = {
  nearby: {
    ar: "مرتبة حسب المسافة من موقعك.",
    en: "Sorted by distance from you.",
  },
  outdoor: {
    ar: "اللي ما عندها جلسات خارجية في Google Maps أو بياناتها ناقصة ما تطلع هنا.",
    en: "Cafés without outdoor seating on Google Maps, or with missing data, are left out.",
  },
  coffee: {
    ar: "محامص محلية، مرتبة بنفس ترتيب أشهر القهاوي.",
    en: "Local roasters, ranked the same way as Most Popular.",
  },
  work: {
    ar: "قهاوي اخترناها للشغل والقعدة الطويلة.",
    en: "Cafés we picked for working and staying a while.",
  },
};

/**
 * Nearby's line under the H1 follows the location state, so it never claims a
 * distance sort while the page shows the most-popular fallback. The server
 * render (and every crawler) has no location, so it gets `noLocation`.
 * `located` is the same line as FIXED_LIST_EXPLAINER.nearby (also the OG card).
 */
export type NearbyExplainerState = "noLocation" | "denied" | "located";

export const NEARBY_EXPLAINER: Record<
  NearbyExplainerState,
  { ar: string; en: string }
> = {
  noLocation: {
    ar: "شارك موقعك ونرتبها لك حسب المسافة. للحين هذي أشهر القهاوي في الرياض.",
    en: "Share your location to sort by distance. Until then, these are Riyadh's most popular.",
  },
  denied: {
    ar: "الموقع مقفل، فهذي أشهر القهاوي في الرياض. أو اختر حي من تحت.",
    en: "Location is off, so these are Riyadh's most popular. Or pick a neighborhood below.",
  },
  located: FIXED_LIST_EXPLAINER.nearby,
};

export function nearbyExplainer(
  state: NearbyExplainerState,
  language: Language,
): string {
  return NEARBY_EXPLAINER[state][language];
}

export const FIXED_LIST_ACTION = {
  showMore: { ar: "عرض المزيد", en: "Show more" },
  useLocation: { ar: "استخدم موقعي", en: "Use my location" },
  locationBlocked: {
    ar: "الموقع مقفل من المتصفح",
    en: "Location is blocked in the browser",
  },
} as const;

export function fixedListHeading(id: FixedListId, language: Language): string {
  return FIXED_LIST_HEADING[id][language];
}

export function fixedListExplainer(id: FixedListId, language: Language): string {
  return FIXED_LIST_EXPLAINER[id][language];
}

/** Nearby and Outdoor include listed chains behind Local only. */
export function fixedListAllowsChains(id: FixedListId): boolean {
  return id === "nearby" || id === "outdoor";
}

/** Popular / Nearby sort. The Nearby page itself is distance-only. */
export function fixedListHasSort(id: FixedListId): boolean {
  return id !== "nearby";
}
