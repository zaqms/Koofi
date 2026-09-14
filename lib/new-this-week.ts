import { listDirectoryShops } from "./catalog";
import type { DirectoryShop } from "./directory";

/**
 * v1 allowlist — catalog shops have no addedAt/createdAt.
 * Skip any id that is missing or example.
 */
export const NEW_THIS_WEEK_IDS = [
  "serb-specialty-al-munsiyah",
  "roasting-stages-al-munsiyah",
  "eagle-coffee-al-munsiyah",
] as const;

export function listNewThisWeekShops(): DirectoryShop[] {
  const byId = new Map(listDirectoryShops().map((shop) => [shop.id, shop]));
  return NEW_THIS_WEEK_IDS.flatMap((id) => {
    const shop = byId.get(id);
    return shop ? [shop] : [];
  });
}
