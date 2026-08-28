import type { Language, MomentTag } from "./types";

/** People-facing English name. The npm package stays `koofi`. */
export const PRODUCT_NAME = "Wain";

/** People-facing Arabic name in sentences and the footer. Wordmark stays Latin. */
export const PRODUCT_NAME_AR = "وين";

/** Public host visitors see. Lowercase. */
export const PUBLIC_SITE_HOST = "wain.lol";

export const PUBLIC_SITE_URL = `https://${PUBLIC_SITE_HOST}`;

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
  { id: "popular", ar: "اللي عليها طلب", en: "Most Popular", momentTag: "popular" },
  { id: "coffee", ar: "أفضل قهوة", en: "Best Coffee", momentTag: "qahwa" },
  { id: "pastry", ar: "أفضل معجنات", en: "Best Pastries", momentTag: "pastry" },
  { id: "roaster", ar: "أفضل محامص", en: "Best Roasteries", momentTag: "roaster" },
  { id: "specialty", ar: "قهوة مختصة", en: "Specialty coffee", momentTag: "roaster" },
  { id: "quiet", ar: "جلسة هادية", en: "Cozy and Quiet", momentTag: "quiet" },
  { id: "work", ar: "قعدة شغل", en: "Best for Work", momentTag: "work" },
  { id: "study", ar: "قعدة مذاكرة", en: "Best for Studies", momentTag: "study" },
  { id: "late", ar: "مفتوح لآخر الليل", en: "Open late", momentTag: "late" },
  { id: "outdoor", ar: "جلسة برا", en: "Outdoor seating", momentTag: "outdoor" },
  { id: "date", ar: "لموعد", en: "Good for a date", momentTag: "date" },
] as const satisfies readonly VibeChip[];

export type VibeChipId = (typeof VIBE_CHIPS)[number]["id"];

export function vibeChipLabel(
  chip: Pick<VibeChip, "ar" | "en">,
  language: Language,
): string {
  return language === "ar" ? chip.ar : chip.en;
}

/** Catalog flag. Live shops are `false`. Do not use `true` to fill chips or picks. */
export const EXAMPLE_FLAG = "example" as const;

export const EXAMPLE_BADGE = {
  ar: "مثال",
  en: "Example",
} as const;

export const CARD_PATH_PREFIX = "/c";

export function homePath(language: Language = "ar"): string {
  return language === "en" ? "/en" : "/";
}

export function aboutPath(language: Language = "ar"): string {
  return language === "en" ? "/en/about" : "/about";
}

/** Locked About copy. Spoken Riyadh/Najdi on AR. Do not polish or expand. */
export const LOCKED_ABOUT = {
  lead: {
    ar: "وين مسويه واحد في الرياض يحب القهوة، ويحب الذكاء الاصطناعي بعد. الموقع كله مسويه الذكاء الاصطناعي، ما فيه أحد قعد يبرمج بيده.",
    en: "Wain is made by a coffee lover who lives in Riyadh, and apparently loves AI too. The whole site is built by AI. No human sat and coded it.",
  },
  note: {
    ar: "إذا عندك ملاحظة، ارسل aj@cali.sa. البوت يقراها أول، وبعدين توصل لشخص إذا احتجنا.",
    en: "If something’s off, email aj@cali.sa. A bot reads it first, then a person if it needs one.",
  },
} as const;

export const FEEDBACK_MAIL = "aj@cali.sa";

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
