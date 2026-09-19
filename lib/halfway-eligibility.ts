import type { Shop } from "./types";

/**
 * بيننا / Halfway sit-down eligibility — Amjad LOCKED 19 Sep 2026.
 *
 * Merge: Scout verdict when present, else Places backfill.
 * A shop may appear in midpoint results only if:
 * 1. `dineIn === true` OR `outdoorSeating === true` (or Scout
 *    `baynanaEligible === true`), AND
 * 2. it is not drive-through tagged and not `pickupOnly`.
 *
 * Fail-closed: null / unclear / missing attrs stay out.
 * Drive-through tagged or pickup-only shops are always excluded,
 * even when dine-in is true. Soft Places parked. Never invent cafés.
 */

/** Seed override: Kapu Nahdah stays out (Scout pickup-only). */
export const HALFWAY_DENY_SHOP_IDS = ["kapu-cafe-al-nahdah"] as const;

const HALFWAY_DENY_SHOP_ID_SET = new Set<string>(HALFWAY_DENY_SHOP_IDS);

/** Drive-through moment tag, plus equivalent pickup-only flags. */
const PICKUP_ONLY_MOMENT_TAGS = new Set(["drive-through"]);

export type HalfwayEligibleShop = Pick<
  Shop,
  | "id"
  | "dineIn"
  | "outdoorSeating"
  | "pickupOnly"
  | "baynanaEligible"
  | "momentTags"
  | "catalogLane"
>;

export function isHalfwayDenied(id: string): boolean {
  return HALFWAY_DENY_SHOP_ID_SET.has(id);
}

/** Drive-through lane, `drive-through` tag, or Scout `pickupOnly`. */
export function isPickupOnlyTagged(shop: HalfwayEligibleShop): boolean {
  if (shop.pickupOnly === true) return true;
  if (shop.catalogLane === "drive-through") return true;
  return shop.momentTags.some((tag) => PICKUP_ONLY_MOMENT_TAGS.has(tag));
}

export function isHalfwaySitDown(shop: HalfwayEligibleShop): boolean {
  return shop.dineIn === true || shop.outdoorSeating === true;
}

export function isHalfwayEligible(shop: HalfwayEligibleShop): boolean {
  if (isHalfwayDenied(shop.id)) return false;
  if (isPickupOnlyTagged(shop)) return false;
  if (shop.baynanaEligible === false) return false;
  if (shop.baynanaEligible === true) return true;
  return isHalfwaySitDown(shop);
}

export function filterHalfwayEligible<T extends HalfwayEligibleShop>(
  shops: readonly T[],
): T[] {
  return shops.filter(isHalfwayEligible);
}
