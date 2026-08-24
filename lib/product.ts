import type { Language, MomentTag } from "./types";

/** People-facing name. The npm package stays `koofi`. */
export const PRODUCT_NAME = "Koofi";

/** Locked until Amjad picks a GenZ line. */
export const LOCKED_OPENER = "اي قهوة ناوي تروح؟";

/** English landing opener on `/en`. Arabic opener stays on `/`. */
export const LOCKED_OPENER_EN = "Which coffee you heading to?";

export type VibeChip = {
  id: string;
  ar: string;
  en: string;
  momentTag: MomentTag;
};

/**
 * Locked vibe chips under the opener. Arabic is the default label.
 * The coffee chip maps onto `qahwa` so picker scoring stays consistent.
 */
export const VIBE_CHIPS = [
  { id: "popular", ar: "الأكثر طلباً", en: "Most Popular", momentTag: "popular" },
  { id: "coffee", ar: "أفضل قهوة", en: "Best Coffee", momentTag: "qahwa" },
  { id: "pastry", ar: "أفضل معجنات", en: "Best Pastries", momentTag: "pastry" },
  { id: "roaster", ar: "أفضل محامص", en: "Best Roasteries", momentTag: "roaster" },
  { id: "quiet", ar: "دافئ وهادئ", en: "Cozy and Quiet", momentTag: "quiet" },
  { id: "work", ar: "مناسب للشغل", en: "Best for Work", momentTag: "work" },
  { id: "study", ar: "مناسب للدراسة", en: "Best for Studies", momentTag: "study" },
  { id: "late", ar: "مفتوح لوقت متأخر", en: "Open late", momentTag: "late" },
  { id: "outdoor", ar: "جلسة برا", en: "Outdoor seating", momentTag: "outdoor" },
  { id: "date", ar: "مناسب لموعد", en: "Good for a date", momentTag: "date" },
] as const satisfies readonly VibeChip[];

export type VibeChipId = (typeof VIBE_CHIPS)[number]["id"];

export function vibeChipLabel(
  chip: Pick<VibeChip, "ar" | "en">,
  language: Language,
): string {
  return language === "ar" ? chip.ar : chip.en;
}

/** Catalog / API / UI field for fictional demo shops. */
export const EXAMPLE_FLAG = "example" as const;

export const EXAMPLE_BADGE = {
  ar: "مثال",
  en: "Example",
} as const;

export const CARD_PATH_PREFIX = "/c";

export function cardPath(id: string, language: Language = "ar"): string {
  const slug = `${CARD_PATH_PREFIX}/${encodeURIComponent(id)}`;
  return language === "en" ? `/en${slug}` : slug;
}

export function shopDisplayName(
  shop: { nameAr: string; nameEn: string },
  language: Language,
): string {
  const nameAr = shop.nameAr.trim();
  const nameEn = shop.nameEn.trim();
  if (language === "en") return nameEn;
  return nameAr || nameEn;
}

export function isExampleShop(shop: { [EXAMPLE_FLAG]: boolean }): boolean {
  return shop[EXAMPLE_FLAG] === true;
}

export function exampleBadge(language: Language): string {
  return EXAMPLE_BADGE[language];
}
