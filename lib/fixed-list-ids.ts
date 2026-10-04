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
    en: "Coffee shops good for work in Riyadh",
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
    ar: "جلسات خارجية حسب قائمة Google Maps. اللي بيانها ناقص أو مو صحيح تطلع برا.",
    en: "Outdoor seating from the Google Maps listing. Missing or false stays off.",
  },
  coffee: {
    ar: "محامص محلية، مرتبة بنفس ترتيب أشهر القهاوي.",
    en: "Local roasters, ranked the same way as Most Popular.",
  },
  work: {
    ar: "موسومة للشغل وفيها قعدة حسب Google Maps. محلية بس.",
    en: "Tagged for work, and dine-in on Google Maps. Local cafés only.",
  },
};

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
