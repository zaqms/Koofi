import type { NeighborhoodId, Shop } from "./types";

/**
 * Locked district-chat popularity. Same weights as the baked
 * `popularityIndex` used by Most Popular — do not change that chip.
 *
 * score = 0.6 × log-norm(Maps reviewCount) + 0.4 × log-norm(IG followers)
 *
 * Catalog shops have no durable `reviewCount` or `igFollowers` fields.
 * Ranking therefore uses the baked index (missing IG already treated as 0
 * at bake time). Do not scrape Instagram. Places reviewCount is display-only.
 */
export const DISTRICT_POPULARITY_WEIGHTS = {
  maps: 0.6,
  ig: 0.4,
} as const;

/** log1p(x) / log1p(max). Missing or 0 → 0 (bottom). */
export function logNorm(
  value: number | null | undefined,
  max: number,
): number {
  const n = value ?? 0;
  if (n <= 0 || max <= 0) return 0;
  return Math.log1p(n) / Math.log1p(max);
}

export function districtPopularityScore(
  reviewCount: number | null | undefined,
  igFollowers: number | null | undefined,
  maxReviewCount: number,
  maxIgFollowers: number,
): number {
  return (
    DISTRICT_POPULARITY_WEIGHTS.maps * logNorm(reviewCount, maxReviewCount) +
    DISTRICT_POPULARITY_WEIGHTS.ig * logNorm(igFollowers, maxIgFollowers)
  );
}

function popularityScore(shop: Shop): number {
  return shop.popularityIndex ?? Number.NEGATIVE_INFINITY;
}

/**
 * In-district only. popularityIndex DESC, id ASC.
 * Does not shuffle. Does not pad neighboring أحياء.
 */
export function rankInDistrict(
  shops: readonly Shop[],
  district: NeighborhoodId,
): Shop[] {
  return shops
    .filter(
      (shop) =>
        shop.neighborhood === district && shop.popularityIndex != null,
    )
    .slice()
    .sort((a, b) => {
      const delta = popularityScore(b) - popularityScore(a);
      if (delta !== 0) return delta;
      return a.id.localeCompare(b.id);
    });
}

/** No catalog shop carries a durable IG follower count. */
export function shopHasIgFollowers(shop: Shop): boolean {
  const extra = shop as Shop & { igFollowers?: number };
  return typeof extra.igFollowers === "number" && extra.igFollowers > 0;
}

export function shopsMissingIgFollowers(shops: readonly Shop[]): Shop[] {
  return shops.filter((shop) => !shopHasIgFollowers(shop));
}
