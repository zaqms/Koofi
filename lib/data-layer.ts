declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** Existing GTM bootstrap already creates `window.dataLayer`. */
export function pushDataLayer(
  event: string,
  payload: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  window.dataLayer ??= [];
  window.dataLayer.push({ event, ...payload });
}

export function trackShareClick(cafeId: string, matchedTags: readonly string[]): void {
  pushDataLayer("share_click", {
    cafe_id: cafeId,
    matched_tags: [...matchedTags],
  });
}

export function trackLandedFromShare(cafeId: string): void {
  pushDataLayer("landed_from_share", { cafe_id: cafeId });
}
