import { listDirectoryShops } from "./catalog";
import type { DirectoryShop } from "./directory";

/**
 * v1 allowlist — catalog shops have no addedAt/createdAt.
 * These ids were added this week (Al Sahafah, 2026-08-24).
 * Skip any id that is missing or example.
 */
export const NEW_THIS_WEEK_IDS = [
  "taim-specialty-coffee-as-sahafah",
  "y97-specialty-coffee-as-sahafah",
  "hakwah-speciality-coffee-as-sahafah",
] as const;

export function listNewThisWeekShops(): DirectoryShop[] {
  const byId = new Map(listDirectoryShops().map((shop) => [shop.id, shop]));
  return NEW_THIS_WEEK_IDS.flatMap((id) => {
    const shop = byId.get(id);
    return shop ? [shop] : [];
  });
}
