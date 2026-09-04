import {
  COFFEE_SHOPS_CATEGORY,
  type DirectoryCategoryId,
} from "./directory-category";
import type { Language, MomentTag, NeighborhoodId } from "./types";

/** Public host visitors see. Also the Latin brand. Lowercase with the dot. */
export const PUBLIC_SITE_HOST = "wain.lol";

export const PUBLIC_SITE_URL = `https://${PUBLIC_SITE_HOST}`;

/** People-facing Latin brand. Exactly `wain.lol`. The npm package stays `koofi`. */
export const PRODUCT_NAME = PUBLIC_SITE_HOST;

/**
 * Site-wide X / Open Graph share image. Static `public/og-v2.jpg` (1200×630 JPEG).
 * New path on purpose so X can recache after the prior `/og.png` scrape.
 * `public/og.png` stays on disk; primary meta must point at v2.
 * Not the 192×192 favicon at `/icon.png` — X large cards need this canvas.
 * Absolute on purpose so live HTML is https://wain.lol/og-v2.jpg, not a relative path.
 */
export const SOCIAL_SHARE_IMAGE = {
  url: `${PUBLIC_SITE_URL}/og-v2.jpg`,
  width: 1200,
  height: 630,
  alt: `${PRODUCT_NAME} — وين القهوة الحين`,
  type: "image/jpeg",
} as const;

/** Large link card. Pair with SOCIAL_SHARE_IMAGE — not `summary` + /icon.png. */
export const SOCIAL_TWITTER_CARD = "summary_large_image" as const;

/** People-facing Arabic name in sentences. Wordmark stays Latin `wain.lol`. */
export const PRODUCT_NAME_AR = "وين";

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

/**
 * Extra chip after the locked vibe row. Not a moment tag — Nearby
 * sorts client-side by official-place haversine only.
 */
export const NEARBY_CHIP = {
  id: "nearby",
  ar: "قريب",
  en: "Nearby",
} as const;

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

/** Retired district prefix. Permanent-redirects to `/{category}/{slug}`. */
export const LEGACY_DISTRICT_PATH_PREFIX = "/n";

/** Three-pack restore. Public, no login. Not a cafe-card `/c/` URL. */
export const PACK_PATH_PREFIX = "/p";

export function homePath(language: Language = "ar"): string {
  return language === "en" ? "/en" : "/";
}

export function packPath(id: string): string {
  return `${PACK_PATH_PREFIX}/${encodeURIComponent(id)}`;
}

export function packSharePath(id: string): string {
  return `${packPath(id)}?from=wa`;
}

export function aboutPath(language: Language = "ar"): string {
  return language === "en" ? "/en/about" : "/about";
}

export function feedbackPath(language: Language = "ar"): string {
  return language === "en" ? "/en/feedback" : "/feedback";
}

/** Locked public feedback board. Spoken Riyadh/Najdi on AR. Do not seed mock rows. */
export const LOCKED_FEEDBACK = {
  title: {
    ar: "أفكاركم",
    en: "Your ideas",
  },
  subtitle: {
    ar: "صوت على فكرة، أو أضف وحدة.",
    en: "Vote on an idea, or add one.",
  },
  placeholder: {
    ar: "...اكتب فكرتك",
    en: "Write your idea...",
  },
  add: {
    ar: "أضف فكرة",
    en: "Add idea",
  },
  empty: {
    ar: "ما فيه أفكار للحين. اكتب وحدة تحت.",
    en: "No ideas yet. Write one below.",
  },
  mapFooter: {
    ar: "للغلط في الخريطة تواصل معنا",
    en: "Map pin wrong? Contact us",
  },
  link: {
    ar: "أفكاركم",
    en: "Ideas",
  },
} as const;

/** Locked About copy. Spoken Riyadh/Najdi on AR. Do not polish or expand. */
export const LOCKED_ABOUT = {
  lead: {
    ar: "وين سوّاها واحد في الرياض يحب القهوة، ويحب الذكاء الاصطناعي بعد.",
    en: "wain.lol is made by a coffee lover who lives in Riyadh, and apparently loves AI too. The whole site is built by AI. No human sat and coded it.",
  },
  /** Second AR paragraph only. EN lead stays one block — Amjad did not send EN. */
  body: {
    ar: "الموقع كله سوّاه الذكاء الاصطناعي، محد برمجه بيده.",
  },
  note: {
    ar: "إذا فيه شيء مو ضابط، تواصل معنا تحت.",
    en: "If something’s off, please contact us below!",
  },
} as const;

/** Locked footer / About contact control. Button opens WhatsApp via wa.me. */
export const LOCKED_CONTACT = {
  ar: "تواصل معنا",
  en: "Contact us",
} as const;

/** Click-to-chat only. Do not use web.whatsapp.com or api.whatsapp.com. */
export const CONTACT_WHATSAPP_HREF = "https://wa.me/966570064331";

export function cardPath(id: string, language: Language = "ar"): string {
  const slug = `${CARD_PATH_PREFIX}/${encodeURIComponent(id)}`;
  return language === "en" ? `/en${slug}` : slug;
}

export function categoryDistrictPath(
  category: DirectoryCategoryId,
  id: NeighborhoodId,
  language: Language = "ar",
): string {
  const path = `/${category}/${encodeURIComponent(id)}`;
  return language === "en" ? `/en${path}` : path;
}

/** Coffee-shops directory for a neighborhood. */
export function districtPath(
  id: NeighborhoodId,
  language: Language = "ar",
): string {
  return categoryDistrictPath(COFFEE_SHOPS_CATEGORY, id, language);
}

export function legacyDistrictPath(
  id: NeighborhoodId,
  language: Language = "ar",
): string {
  const slug = `${LEGACY_DISTRICT_PATH_PREFIX}/${encodeURIComponent(id)}`;
  return language === "en" ? `/en${slug}` : slug;
}

export function cardSharePath(id: string, language: Language = "ar"): string {
  return `${cardPath(id, language)}?from=wa`;
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
