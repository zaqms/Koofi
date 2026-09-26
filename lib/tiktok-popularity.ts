import tiktokFollowersFile from "../data/tiktok-followers.json";

/**
 * TikTok follower bonus on top of the baked popularity index.
 *
 * Counts live in data/tiktok-followers.json. catalog.json rows stay free of
 * follower fields, and data/popularity-index.json is never rewritten, so a
 * refresh cannot compound. The bonus is a sort key only — not shown, and
 * not clamped at 100.
 *
 * Refresh (manual, or about monthly; no scrape, no network, no CI job):
 *   npm run refresh-tiktok-followers -- path/to/scout.json
 *   npm run refresh-tiktok-followers -- path/to/scout.csv
 */

/** Points added when a found account is at or above the follower cap. */
export const TIKTOK_MAX_POINTS = 10;

/** Follower count that earns the full bonus. Larger accounts stay at the cap. */
export const TIKTOK_FOLLOWER_CAP = 50_000;

export const TIKTOK_STATUSES = ["found", "none", "unverified"] as const;
export type TikTokStatus = (typeof TIKTOK_STATUSES)[number];

export type TikTokFollowerRow = {
  handle: string | null;
  followers: number | null;
  status: TikTokStatus;
  dateChecked: string;
  sharedBrandAccount: boolean;
};

export const TIKTOK_FOLLOWERS = tiktokFollowersFile as Record<
  string,
  TikTokFollowerRow
>;

/** log1p scale, capped. 0 followers → 0. At or above the cap → TIKTOK_MAX_POINTS. */
export function tiktokFoundBonus(followers: number): number {
  const scaled = Math.log1p(followers) / Math.log1p(TIKTOK_FOLLOWER_CAP);
  return TIKTOK_MAX_POINTS * Math.min(1, scaled);
}

export function tiktokHandleKey(handle: string): string {
  return handle.trim().replace(/^@+/, "").toLowerCase();
}

/** One follower count per found account. Chains that share a handle count once. */
export function uniqueFoundFollowerCounts(
  rows: Readonly<Record<string, TikTokFollowerRow>>,
): number[] {
  const byHandle = new Map<string, number>();
  for (const row of Object.values(rows)) {
    if (row.status !== "found" || row.followers == null || row.handle == null) {
      continue;
    }
    const key = tiktokHandleKey(row.handle);
    const existing = byHandle.get(key);
    if (existing == null) {
      byHandle.set(key, row.followers);
      continue;
    }
    if (existing !== row.followers) {
      throw new Error(
        `TikTok handle ${key} has conflicting follower counts (${existing} vs ${row.followers})`,
      );
    }
  }
  return [...byHandle.values()];
}

/** Even counts use the mean of the two central values. */
export function medianNumber(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? 0;
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/**
 * Median found-account bonus. none, unverified, and missing rows use this
 * so they are neutral — not zero and not a penalty.
 */
export function neutralBonusFromRows(
  rows: Readonly<Record<string, TikTokFollowerRow>>,
): number {
  const bonuses = uniqueFoundFollowerCounts(rows).map(tiktokFoundBonus);
  return medianNumber(bonuses);
}

export const TIKTOK_NEUTRAL_BONUS = neutralBonusFromRows(TIKTOK_FOLLOWERS);

export function tiktokBonusForRow(
  row: TikTokFollowerRow | undefined,
  neutral: number = TIKTOK_NEUTRAL_BONUS,
): number {
  if (row?.status === "found" && row.followers != null) {
    return tiktokFoundBonus(row.followers);
  }
  return neutral;
}

export function tiktokBonusForShop(shopId: string): number {
  return tiktokBonusForRow(TIKTOK_FOLLOWERS[shopId]);
}

/**
 * Baked index plus the TikTok bonus. No baked index → undefined, so TikTok
 * alone never gives a shop a rank.
 */
export function effectivePopularityIndex(
  base: number | null | undefined,
  shopId: string,
): number | undefined {
  if (base == null || Number.isNaN(base)) return undefined;
  return base + tiktokBonusForShop(shopId);
}

function isStatus(value: unknown): value is TikTokStatus {
  return (
    value === "found" || value === "none" || value === "unverified"
  );
}

export function tiktokFollowerMapErrors(
  rows: Readonly<Record<string, TikTokFollowerRow>>,
  knownShopIds: ReadonlySet<string>,
  options?: { requireComplete?: boolean },
): string[] {
  const errors: string[] = [];
  const requireComplete = options?.requireComplete !== false;
  const seenHandles = new Map<string, number>();

  for (const [shopId, row] of Object.entries(rows)) {
    if (!knownShopIds.has(shopId)) {
      errors.push(`${shopId}: unknown shop id`);
    }
    if (!row || typeof row !== "object") {
      errors.push(`${shopId}: missing row`);
      continue;
    }
    if (!isStatus(row.status)) {
      errors.push(`${shopId}: status must be found, none, or unverified`);
      continue;
    }
    if (typeof row.dateChecked !== "string" || row.dateChecked.trim() === "") {
      errors.push(`${shopId}: dateChecked is required`);
    }
    if (typeof row.sharedBrandAccount !== "boolean") {
      errors.push(`${shopId}: sharedBrandAccount must be boolean`);
    }
    if (row.status === "found") {
      if (typeof row.handle !== "string" || row.handle.trim() === "") {
        errors.push(`${shopId}: found rows need a handle`);
      }
      if (
        typeof row.followers !== "number" ||
        !Number.isInteger(row.followers) ||
        row.followers < 0
      ) {
        errors.push(`${shopId}: found rows need a non-negative integer followers count`);
      } else if (typeof row.handle === "string" && row.handle.trim() !== "") {
        const key = tiktokHandleKey(row.handle);
        const previous = seenHandles.get(key);
        if (previous == null) seenHandles.set(key, row.followers);
        else if (previous !== row.followers) {
          errors.push(
            `${shopId}: handle ${key} followers ${row.followers} disagree with ${previous}`,
          );
        }
      }
      continue;
    }
    if (row.followers != null) {
      errors.push(`${shopId}: ${row.status} rows must not have followers`);
    }
  }

  if (requireComplete) {
    for (const shopId of knownShopIds) {
      if (rows[shopId] == null) errors.push(`${shopId}: missing TikTok row`);
    }
  }

  return errors;
}
