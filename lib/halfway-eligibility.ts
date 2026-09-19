import type { Shop } from "./types";

/**
 * بيننا / Halfway sit-down eligibility — Amjad LOCKED 19 Sep 2026.
 *
 * A shop may appear in midpoint results only if:
 * 1. `dineIn === true` OR `outdoorSeating === true`, AND
 * 2. it is not drive-through / pickup-only tagged.
 *
 * Fail-closed: null or missing attrs stay out until Scout resolves.
 * Drive-through tagged shops are always excluded, even when dine-in is true.
 * If the eligible pool is thinner than 3, return what’s left — do not
 * re-open ineligible shops to fill. Soft Places parked. Never invent cafés.
 */

/** Photo-flagged pickup-only until Scout confirms. */
export const HALFWAY_DENY_SHOP_IDS = [
  "kapu-cafe-al-nahdah",
  "shafel-roastery-al-nahdah",
] as const;

const HALFWAY_DENY_SHOP_ID_SET = new Set<string>(HALFWAY_DENY_SHOP_IDS);

/** Drive-through moment tag, plus equivalent pickup-only flags. */
const PICKUP_ONLY_MOMENT_TAGS = new Set(["drive-through"]);

export type HalfwayEligibleShop = Pick<
  Shop,
  "id" | "dineIn" | "outdoorSeating" | "momentTags" | "catalogLane"
>;

export function isHalfwayDenied(id: string): boolean {
  return HALFWAY_DENY_SHOP_ID_SET.has(id);
}

/** Drive-through lane, `drive-through` tag, or equivalent pickup-only flag. */
export function isPickupOnlyTagged(shop: HalfwayEligibleShop): boolean {
  if (shop.catalogLane === "drive-through") return true;
  return shop.momentTags.some((tag) => PICKUP_ONLY_MOMENT_TAGS.has(tag));
}

export function isHalfwaySitDown(shop: HalfwayEligibleShop): boolean {
  return shop.dineIn === true || shop.outdoorSeating === true;
}

export function isHalfwayEligible(shop: HalfwayEligibleShop): boolean {
  if (isHalfwayDenied(shop.id)) return false;
  if (isPickupOnlyTagged(shop)) return false;
  return isHalfwaySitDown(shop);
}

export function filterHalfwayEligible<T extends HalfwayEligibleShop>(
  shops: readonly T[],
): T[] {
  return shops.filter(isHalfwayEligible);
}
