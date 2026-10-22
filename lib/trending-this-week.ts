import { listDirectoryShops } from "./catalog";
import type { DirectoryShop } from "./directory";
import type { Language } from "./types";

/**
 * v1 allowlist. Not derived from data.
 * Window: 2026-10-15 through 2026-10-22.
 * Organic only (listing policy 6): each row has 3+ distinct organic X accounts in the window.
 *
 * lineAr / lineEn render on the Trending page, under each café card.
 * The home tiles have no line slot, so the lines are not rendered there.
 */
export const TRENDING_THIS_WEEK_WINDOW = {
  from: "2026-10-15",
  to: "2026-10-22",
} as const;

const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;

const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function windowParts(iso: string): { day: number; month: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`trending window date must be YYYY-MM-DD, got ${iso}`);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`trending window date is out of range: ${iso}`);
  }
  return { day, month };
}

/** Small header line. Built from TRENDING_THIS_WEEK_WINDOW, not a fixed string. */
export function trendingWindowLabel(language: Language): string {
  const from = windowParts(TRENDING_THIS_WEEK_WINDOW.from);
  const to = windowParts(TRENDING_THIS_WEEK_WINDOW.to);
  const months = language === "ar" ? AR_MONTHS : EN_MONTHS;
  return `${from.day} ${months[from.month - 1]} – ${to.day} ${months[to.month - 1]}`;
}

export const TRENDING_THIS_WEEK = [
  {
    id: "kultura-as-suwaidi-al-gharbi",
    lineAr: "كولتورا بالسويدي الغربي خلّص الافتتاح التجريبي وفتح رسميًا، والناس بالرياض قاعدين ينزّلون عنه.",
    lineEn:
      "Kultúra in As Suwaidi Al Gharbi went from soft opening to official opening, and people across Riyadh have been posting about it.",
  },
  {
    id: "espresso-culture-al-mursalat",
    lineAr: "أكثر من شخص نزّل صور قهوته من إسبريسو كالتشر بالمرسلات هالأسبوع.",
    lineEn: "Several people shared photos of their coffee at Espresso Culture in Al Mursalat this week.",
  },
  {
    id: "hjeen-roasters-at-taawun",
    lineAr: "هجين كمّل عشر سنين ونزّل محصول «عشرة عمر» هالأسبوع.",
    lineEn: "Hjeen marked ten years this week with its new Ashrat Omr crop.",
  },
] as const;

/** Skip any id that is missing or example. Same rule as New this week. */
export const TRENDING_THIS_WEEK_IDS = TRENDING_THIS_WEEK.map((row) => row.id);

export type TrendingThisWeekRow = {
  shop: DirectoryShop;
  lineAr: string;
  lineEn: string;
};

export function listTrendingThisWeekRows(): TrendingThisWeekRow[] {
  const byId = new Map(listDirectoryShops().map((shop) => [shop.id, shop]));
  return TRENDING_THIS_WEEK.flatMap((row) => {
    const shop = byId.get(row.id);
    return shop ? [{ shop, lineAr: row.lineAr, lineEn: row.lineEn }] : [];
  });
}

export function listTrendingThisWeekShops(): DirectoryShop[] {
  return listTrendingThisWeekRows().map((row) => row.shop);
}
