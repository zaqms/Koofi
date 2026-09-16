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

/** Locked P0 home headline (Amjad / Shoug AR native). */
export const LOCKED_OPENER = "وين ودّك تروح اليوم؟";

/** English landing opener on `/en`. Arabic opener stays on `/`. */
export const LOCKED_OPENER_EN = "Where do you want to go today?";

/** Support line under the home headline. No eyebrow slogans. */
export const LOCKED_HOME_SUPPORT = {
  ar: "اختر جوّك، أو خلّنا نلقى لكم مكان بالنص.",
  en: "Pick a vibe, or let us find you a place in the middle.",
} as const;

export type VibeChip = {
  id: string;
  ar: string;
  en: string;
  momentTag: MomentTag;
};

/**
 * Locked vibe chips under the opener. Arabic is the default label.
 * The coffee chip maps onto `qahwa` so picker scoring stays consistent.
 * The popular chip (`الأكثر شعبية` / Most Popular) ranks the full catalog
 * by baked `popularityIndex` DESC — it does not require a `popular` momentTag.
 * AR display labels are the P0 home set. Ids stay (`date` filter key).
 * Public date slug is `with-friends`. Soft Places parked.
 */
export const VIBE_CHIPS = [
  { id: "popular", ar: "الأكثر شعبية", en: "Most Popular", momentTag: "popular" },
  { id: "coffee", ar: "أفضل قهوة", en: "Best Coffee", momentTag: "qahwa" },
  { id: "pastry", ar: "قهوة وحلى", en: "Coffee and sweets", momentTag: "pastry" },
  { id: "roaster", ar: "أفضل محامص", en: "Best Roasteries", momentTag: "roaster" },
  { id: "specialty", ar: "قهوة مختصة", en: "Specialty coffee", momentTag: "roaster" },
  { id: "quiet", ar: "هادي ورايق", en: "Cozy and Quiet", momentTag: "quiet" },
  { id: "work", ar: "للشغل", en: "Best for Work", momentTag: "work" },
  { id: "study", ar: "قعدة مذاكرة", en: "Best for Studies", momentTag: "study" },
  { id: "late", ar: "مفتوح لآخر الليل", en: "Open late", momentTag: "late" },
  { id: "outdoor", ar: "جلسات خارجية", en: "Outdoor seating", momentTag: "outdoor" },
  { id: "date", ar: "مع الأصحاب", en: "With friends", momentTag: "date" },
] as const satisfies readonly VibeChip[];

export type VibeChipId = (typeof VIBE_CHIPS)[number]["id"];

/**
 * Extra chip after the locked vibe row. Not a moment tag — Nearby
 * sorts client-side by official-place haversine only.
 */
export const NEARBY_CHIP = {
  id: "nearby",
  ar: "قريب مني",
  en: "Nearby",
} as const;

/**
 * P0 home chip chrome is 4×2 only (RTL R→L in this array order).
 * Off-home ids keep their URLs: roaster, specialty, study, late.
 * بيننا is a utility card above this grid — not a tile.
 */
export const HOME_CHIP_IDS = [
  "popular",
  "coffee",
  "pastry",
  "quiet",
  "nearby",
  "outdoor",
  "date",
  "work",
] as const;

export type HomeChipId = (typeof HOME_CHIP_IDS)[number];

export const OFF_HOME_CHIP_IDS = [
  "roaster",
  "specialty",
  "study",
  "late",
] as const;

export function isHomeChipId(id: string): id is HomeChipId {
  return (HOME_CHIP_IDS as readonly string[]).includes(id);
}

export type OffHomeChipId = (typeof OFF_HOME_CHIP_IDS)[number];

export function isOffHomeChipId(id: string): id is OffHomeChipId {
  return (OFF_HOME_CHIP_IDS as readonly string[]).includes(id);
}

export type HomeSurfaceChip =
  | (typeof VIBE_CHIPS)[number]
  | typeof NEARBY_CHIP;

export function homeSurfaceChips(): readonly HomeSurfaceChip[] {
  return HOME_CHIP_IDS.map((id) => {
    if (id === NEARBY_CHIP.id) return NEARBY_CHIP;
    const vibe = VIBE_CHIPS.find((chip) => chip.id === id);
    if (!vibe) {
      throw new Error(`home chip missing: ${id}`);
    }
    return vibe;
  });
}

/**
 * Meet Halfway (`بيننا`). Not a vibe / Soft Places chip.
 * v1 UI is one share URL `/h/{id}` (EN twin `/en/h/{id}`): invite → waiting → results (two people);
 * ranking is `locations: Location[]` (N≥2). Soft Places stays parked.
 */
export const MEET_HALFWAY_CHIP = {
  id: "meet-halfway",
  ar: "بيننا",
  en: "Halfway",
} as const;

/** P0 بيننا utility-card subtitle. Picker tagline stays in copy.ts. */
export const MEET_HALFWAY_HOME_SUB = {
  ar: "نلقى لكم قهوة بالنص",
  en: "We'll find you coffee in the middle.",
} as const;

/** Locked 3D pins+cup cluster for the بيننا home card. */
export const MEET_HALFWAY_HOME_ART = {
  src: "/brand/baynana-3d.png",
  width: 1177,
  height: 447,
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

/**
 * Digital product shares only. Always both `utm_source` and `utm_medium`.
 * Print/QR hospitality expo stays `utm_medium=card` and is not built here.
 */
export const SHARE_UTM_MEDIUM = "share" as const;

export type ShareFrom = "wa" | "tonight";
export type ShareUtmSource = "card" | "list" | "invite";

/** Cafe-card vs directory-list share. Same `/c/{id}` path; different `utm_source`. */
export type ListingShareSurface = "card" | "list";

/**
 * Append `from=` plus both UTMs so surfaces cannot drift.
 * Never emit `utm_source` without `utm_medium`.
 */
export function buildShareUrl(
  path: string,
  input: {
    from: ShareFrom;
    utmSource: ShareUtmSource;
  },
): string {
  const params = new URLSearchParams();
  params.set("from", input.from);
  params.set("utm_source", input.utmSource);
  params.set("utm_medium", SHARE_UTM_MEDIUM);
  return `${path}?${params.toString()}`;
}

export function packSharePath(id: string): string {
  return buildShareUrl(packPath(id), { from: "wa", utmSource: "list" });
}

/** بيننا session. Public, no login. Waiting 45 min; results freeze 48h. */
export const HALFWAY_INVITE_PATH_PREFIX = "/h";

/** Share + AR default stay `/h/{id}`. EN guests use `/en/h/{id}`. */
export function halfwayInvitePath(id: string, language: Language = "ar"): string {
  const path = `${HALFWAY_INVITE_PATH_PREFIX}/${encodeURIComponent(id)}`;
  return language === "en" ? `/en${path}` : path;
}

/** WhatsApp / packet share is always the AR-default `/h/{id}` URL. */
export function halfwayInviteSharePath(id: string): string {
  return buildShareUrl(halfwayInvitePath(id), {
    from: "wa",
    utmSource: "invite",
  });
}

export function halfwayInviteLocaleHref(
  id: string,
  language: Language,
  from?: string,
): string {
  const path = halfwayInvitePath(id, language === "ar" ? "en" : "ar");
  return from ? `${path}?from=${encodeURIComponent(from)}` : path;
}

export function aboutPath(language: Language = "ar"): string {
  return language === "en" ? "/en/about" : "/about";
}

/** Full Riyadh neighborhood index (view-all). City is Riyadh only. */
export const NEIGHBORHOODS_PATH = "/neighborhoods";

export function neighborhoodsPath(language: Language = "ar"): string {
  return language === "en" ? `/en${NEIGHBORHOODS_PATH}` : NEIGHBORHOODS_PATH;
}

export function feedbackPath(language: Language = "ar"): string {
  return language === "en" ? "/en/feedback" : "/feedback";
}

export function ownerPath(language: Language = "ar"): string {
  return language === "en" ? "/en/owner" : "/owner";
}

export function ownerClaimPath(
  shopId: string,
  language: Language = "ar",
): string {
  return `${ownerPath(language)}?shop=${encodeURIComponent(shopId)}`;
}

export function ownerEditPath(
  shopId: string,
  token: string,
  language: Language = "ar",
): string {
  const path = language === "en" ? "/en/owner/edit" : "/owner/edit";
  return `${path}?shop=${encodeURIComponent(shopId)}&token=${encodeURIComponent(token)}`;
}

/** Token-gated ops only. Not linked from visitor or owner UI. */
export const OPS_CLAIMS_PATH = "/ops/claims";

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

/** Latin slug for the Most Popular directory. Same shape as district slugs. */
export const MOST_POPULAR_SLUG = "most-popular";

/** SEO alias. 308 to the EN coffee-shops path — not a second canonical. */
export const MOST_POPULAR_EN_ALIAS_PATH = "/en/most-popular-cafes-in-riyadh";

/**
 * Locked thin directory H1. District tone is `مقاهي في {حي}` /
 * `Coffee shops in {district}` — citywide popular stays one short line.
 */
export const MOST_POPULAR_HEADING = {
  ar: "أشهر القهاوي في الرياض",
  en: "Most popular coffee shops in Riyadh",
} as const;

export function isMostPopularSlug(slug: string): boolean {
  return slug === MOST_POPULAR_SLUG;
}

/** Most Popular directory. AR keeps the Latin slug, same as districts. */
export function mostPopularPath(language: Language = "ar"): string {
  const path = `/${COFFEE_SHOPS_CATEGORY}/${MOST_POPULAR_SLUG}`;
  return language === "en" ? `/en${path}` : path;
}

/**
 * Shareable بيننا landing. Must stay `/halfway`, never `/h` —
 * `/h/{id}` is the invite session URL after اعزم خويك.
 */
export const HALFWAY_LANDING_PATH = "/halfway";

export function halfwayPath(language: Language = "ar"): string {
  return language === "en"
    ? `/en${HALFWAY_LANDING_PATH}`
    : HALFWAY_LANDING_PATH;
}

/**
 * Ajz-locked coffee-shops slugs for nearby + vibe chips.
 * `popular` stays `most-popular`. `meet-halfway` stays `/halfway`.
 * `date` chip public slug is `with-friends` (15 Sep Amjad + Shoug via Ajz).
 * Other slugs stay. Soft Places stays parked.
 */
export const COFFEE_SHOP_CHIP_SLUGS = [
  "nearby",
  "coffee",
  "pastry",
  "roaster",
  "specialty",
  "quiet",
  "work",
  "study",
  "late",
  "outdoor",
  "with-friends",
] as const;

export type CoffeeShopChipSlug = (typeof COFFEE_SHOP_CHIP_SLUGS)[number];

/** Catalog / home-grid id. Display + public slug can move; this stays. */
export const DATE_CHIP_ID = "date";

/** Public coffee-shops slug for the date chip. */
export const DATE_CHIP_PUBLIC_SLUG = "with-friends" satisfies CoffeeShopChipSlug;

/** Retired public slugs. 308 to `with-friends` so ads / bookmarks do not 404. */
export const LEGACY_DATE_CHIP_SLUGS = ["date", "for-two"] as const;

export const LEGACY_CHIP_REDIRECTS = LEGACY_DATE_CHIP_SLUGS.flatMap((slug) => [
  {
    source: `/${COFFEE_SHOPS_CATEGORY}/${slug}`,
    destination: `/${COFFEE_SHOPS_CATEGORY}/${DATE_CHIP_PUBLIC_SLUG}`,
    statusCode: 308 as const,
  },
  {
    source: `/en/${COFFEE_SHOPS_CATEGORY}/${slug}`,
    destination: `/en/${COFFEE_SHOPS_CATEGORY}/${DATE_CHIP_PUBLIC_SLUG}`,
    statusCode: 308 as const,
  },
]);

/**
 * Retired cafe-card ids. Same 308 pattern as chip slug retags.
 * Sand Clock’s live hex was mis-tagged sulimaniyah; keep the old /c/ URL
 * on the Muruj place so Maps identity does not swap.
 */
export const LEGACY_SHOP_REDIRECTS = [
  {
    source: `${CARD_PATH_PREFIX}/sand-clock-sulimaniyah`,
    destination: `${CARD_PATH_PREFIX}/sand-clock-al-muruj`,
    statusCode: 308 as const,
  },
  {
    source: `/en${CARD_PATH_PREFIX}/sand-clock-sulimaniyah`,
    destination: `/en${CARD_PATH_PREFIX}/sand-clock-al-muruj`,
    statusCode: 308 as const,
  },
  {
    source: `${CARD_PATH_PREFIX}/sand-clock-sulimaniyah/:path*`,
    destination: `${CARD_PATH_PREFIX}/sand-clock-al-muruj/:path*`,
    statusCode: 308 as const,
  },
  {
    source: `/en${CARD_PATH_PREFIX}/sand-clock-sulimaniyah/:path*`,
    destination: `/en${CARD_PATH_PREFIX}/sand-clock-al-muruj/:path*`,
    statusCode: 308 as const,
  },
] as const;

export function isCoffeeShopChipSlug(
  slug: string,
): slug is CoffeeShopChipSlug {
  return (COFFEE_SHOP_CHIP_SLUGS as readonly string[]).includes(slug);
}

/** Public slug for a live chip id. `date` → `with-friends`; other ids match slugs. */
export function coffeeShopChipSlugForId(
  chipId: string,
): CoffeeShopChipSlug | null {
  if (chipId === DATE_CHIP_ID) return DATE_CHIP_PUBLIC_SLUG;
  if (isCoffeeShopChipSlug(chipId)) return chipId;
  return null;
}

/** Route slug → chip id. `with-friends` → `date`; other slugs match ids. */
export function chipIdFromCoffeeShopSlug(slug: string): string | null {
  if (slug === DATE_CHIP_PUBLIC_SLUG) return DATE_CHIP_ID;
  if (isCoffeeShopChipSlug(slug)) return slug;
  return null;
}

export function coffeeShopChipPath(
  slug: CoffeeShopChipSlug,
  language: Language = "ar",
): string {
  const path = `/${COFFEE_SHOPS_CATEGORY}/${encodeURIComponent(slug)}`;
  return language === "en" ? `/en${path}` : path;
}

/** Dedicated shareable path for a live chip. Ajz URL map. */
export function chipSharePath(
  chipId: string,
  language: Language = "ar",
): string {
  if (chipId === MEET_HALFWAY_CHIP.id) return halfwayPath(language);
  if (chipId === "popular") return mostPopularPath(language);
  const slug = coffeeShopChipSlugForId(chipId);
  if (slug) return coffeeShopChipPath(slug, language);
  return mostPopularPath(language);
}

export function mostPopularHeading(language: Language): string {
  return MOST_POPULAR_HEADING[language];
}

/** Filtered directory (Most Popular or a district) sits above New this week. */
export function filterPutsDirectoryFirst(
  listing: "popular" | null | undefined,
  district: NeighborhoodId | null | undefined,
): boolean {
  return listing === "popular" || Boolean(district);
}

export function legacyDistrictPath(
  id: NeighborhoodId,
  language: Language = "ar",
): string {
  const slug = `${LEGACY_DISTRICT_PATH_PREFIX}/${encodeURIComponent(id)}`;
  return language === "en" ? `/en${slug}` : slug;
}

export function cardSharePath(id: string, language: Language = "ar"): string {
  return shopSharePath(id, language, "card");
}

/** Directory list share. Same `/c/{id}` as the card; `utm_source=list`. */
export function listingSharePath(id: string, language: Language = "ar"): string {
  return shopSharePath(id, language, "list");
}

export function shopSharePath(
  id: string,
  language: Language = "ar",
  surface: ListingShareSurface = "card",
): string {
  return buildShareUrl(cardPath(id, language), {
    from: "wa",
    utmSource: surface,
  });
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

/** Absolute public cafe-card URL for claim prefill. */
export function publicCardUrl(id: string, language: Language = "ar"): string {
  return `${PUBLIC_SITE_URL}${cardPath(id, language)}`;
}

/** Visitor claim chat prefill. No phone digits in this text. */
export function claimWhatsAppText(input: {
  language: Language;
  shopName?: string;
  cardUrl?: string;
}): string {
  if (input.shopName && input.cardUrl) {
    return input.language === "ar"
      ? `أبي أطالب بمقهى ${input.shopName} على wain.lol — ${input.cardUrl}`
      : `I want to claim ${input.shopName} on wain.lol — ${input.cardUrl}`;
  }
  return input.language === "ar"
    ? "أبي أطالب بمقهى على wain.lol"
    : "I want to claim a cafe on wain.lol";
}

/** Click-to-chat on the Contact us number. Never WhatsApp Web / QR. */
export function claimWhatsAppHref(input: {
  language: Language;
  shopName?: string;
  cardUrl?: string;
}): string {
  return `${CONTACT_WHATSAPP_HREF}?text=${encodeURIComponent(claimWhatsAppText(input))}`;
}

export function shopClaimWhatsAppHref(
  shop: { id: string; nameAr: string; nameEn: string },
  language: Language,
): string {
  return claimWhatsAppHref({
    language,
    shopName: shopDisplayName(shop, language),
    cardUrl: publicCardUrl(shop.id, language),
  });
}

export function isExampleShop(shop: { [EXAMPLE_FLAG]: boolean }): boolean {
  return shop[EXAMPLE_FLAG] === true;
}

export function exampleBadge(language: Language): string {
  return EXAMPLE_BADGE[language];
}
