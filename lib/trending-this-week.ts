import { listDirectoryShops } from "./catalog";
import type { DirectoryShop } from "./directory";

/**
 * v1 allowlist. Not derived from data.
 * Window: 2026-09-25 through 2026-10-02.
 *
 * lineAr / lineEn are stored for a later decision. The home section has no
 * line slot, so these lines are NOT rendered. New UI is Amjad's call.
 */
export const TRENDING_THIS_WEEK_WINDOW = {
  from: "2026-09-25",
  to: "2026-10-02",
} as const;

export const TRENDING_THIS_WEEK = [
  {
    id: "namq-al-malqa",
    lineAr:
      "نمق كان أول اسم بقوائم عروض يوم القهوة العالمي، ولو فاتك العرض مرّ فرعهم بالملقا وجرب قهوة اليوم عندهم.",
    lineEn:
      "Namq topped the World Coffee Day offer lists. Missed it? Stop by the Al Malqa branch and try their coffee of the day.",
  },
  {
    id: "waqar-al-aziziyah",
    lineAr:
      "وقار بالعزيزية دخلت على ترند الكوكيز مع الآيسكريم، اطلبه مع قهوتك وخلّه يذوب شوي قبل أول لقمة.",
    lineEn:
      "Waqar in Al Aziziyah jumped on the cookie-on-ice-cream trend. Order it with your coffee and let it melt a little before the first bite.",
  },
] as const;

/** Skip any id that is missing or example. Same rule as New this week. */
export const TRENDING_THIS_WEEK_IDS = TRENDING_THIS_WEEK.map((row) => row.id);

export function listTrendingThisWeekShops(): DirectoryShop[] {
  const byId = new Map(listDirectoryShops().map((shop) => [shop.id, shop]));
  return TRENDING_THIS_WEEK_IDS.flatMap((id) => {
    const shop = byId.get(id);
    return shop ? [shop] : [];
  });
}
