import { listDirectoryShops } from "./catalog";
import type { DirectoryShop } from "./directory";

/**
 * v1 allowlist. Not derived from catalog addedAt.
 * Skip any id that is missing or example.
 */
export const NEW_THIS_WEEK_IDS = [
  "brew92-an-nada",
  "ashjar-cafe-ar-rabi",
  "jazean-diplomatic-quarter",
  "markab-king-fahd",
] as const;

export function listNewThisWeekShops(): DirectoryShop[] {
  const byId = new Map(listDirectoryShops().map((shop) => [shop.id, shop]));
  return NEW_THIS_WEEK_IDS.flatMap((id) => {
    const shop = byId.get(id);
    return shop ? [shop] : [];
  });
}
