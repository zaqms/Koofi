import type { Language, MomentTag } from "./types";

/**
 * Single source of truth for Wain discovery categories (vibe chips).
 *
 * Live set = homepage 4×2 + dedicated chip URLs + catalog filters already
 * shipping. Do not invent categories. Soft Places stays parked. Dating
 * slugs (`date` / `for-two` / `good-for-a-date`) are 308 redirects only —
 * they are not rows here.
 *
 * Arabic labels are locked product copy. Never runtime-translate.
 */

export type DiscoveryEligibility =
  | { rule: "popularity-index" }
  | { rule: "moment-tag"; momentTag: MomentTag }
  | { rule: "drive-through-tagged"; momentTag: "drive-through" }
  | { rule: "nearby-haversine" };

export type DiscoveryDirectoryKind =
  | "static-list"
  | "three-pick"
  | "chip-filter"
  | "nearby-geo";

export type DiscoverySurface = "home" | "off-home";

export type DiscoveryCategory = {
  /** Stable catalog / analytics / chip_tap id. */
  id: string;
  /**
   * Public `/coffee-shops/{slug}` segment. `popular` uses `most-popular`
   * via chipSharePath — slug stays null here so we never emit /coffee-shops/popular.
   */
  slug: string | null;
  label: { ar: string; en: string };
  /** Icon key for ChipIcon — matches the live SVG case. */
  icon: string;
  enabled: boolean;
  /** 1-based homepage grid rank. Null = not a home tile. */
  homeRank: number | null;
  surface: DiscoverySurface;
  directoryKind: DiscoveryDirectoryKind;
  /** Matcha + Drive-through result-page sorter. */
  resultSort: boolean;
  eligibility: DiscoveryEligibility;
  /**
   * Picker / parse-intent moment. Nearby has none. Specialty shares
   * `roaster` with Best Roasteries — that is live behavior, not a merge.
   */
  momentTag: MomentTag | null;
  /** VIBE_CHIPS display order. Null = not a vibe chip (Nearby). */
  vibeOrder: number | null;
  /** COFFEE_SHOP_CHIP_SLUGS order. Null = no coffee-shops slug. */
  slugOrder: number | null;
  /** OFF_HOME_CHIP_IDS order. Null = not an off-home share URL. */
  offHomeOrder: number | null;
};

/**
 * Approved live set as of Sep 2026 (homepage + share URLs).
 * Home grid is the 8-tile order (pastry stays on its share URL, off the grid).
 * Off-home rows (roaster / specialty / study / late / quiet) stay enabled
 * because their dedicated URLs already ship — they are not leftover
 * district arrays. After PR #164, districts use this same registry via
 * Chat → VibeChips → homeSurfaceChips().
 */
export const DISCOVERY_CATEGORIES = [
  {
    id: "popular",
    slug: null,
    label: { ar: "الأكثر شعبية", en: "Most Popular" },
    icon: "popular",
    enabled: true,
    homeRank: 1,
    surface: "home",
    directoryKind: "static-list",
    resultSort: false,
    eligibility: { rule: "popularity-index" },
    momentTag: "popular",
    vibeOrder: 1,
    slugOrder: null,
    offHomeOrder: null,
  },
  {
    id: "coffee",
    slug: "coffee",
    label: { ar: "أفضل قهوة", en: "Best Coffee" },
    icon: "coffee",
    enabled: true,
    homeRank: 4,
    surface: "home",
    directoryKind: "chip-filter",
    resultSort: false,
    eligibility: { rule: "moment-tag", momentTag: "qahwa" },
    momentTag: "qahwa",
    vibeOrder: 2,
    slugOrder: 2,
    offHomeOrder: null,
  },
  {
    id: "pastry",
    slug: "pastry",
    label: { ar: "قهوة وحلى", en: "Coffee and sweets" },
    icon: "pastry",
    enabled: true,
    homeRank: null,
    surface: "home",
    directoryKind: "chip-filter",
    resultSort: false,
    eligibility: { rule: "moment-tag", momentTag: "pastry" },
    momentTag: "pastry",
    vibeOrder: 3,
    slugOrder: 3,
    offHomeOrder: null,
  },
  {
    id: "matcha",
    slug: "matcha",
    label: { ar: "ماتشا", en: "Matcha" },
    icon: "matcha",
    enabled: true,
    homeRank: 3,
    surface: "home",
    directoryKind: "static-list",
    resultSort: true,
    eligibility: { rule: "moment-tag", momentTag: "matcha" },
    momentTag: "matcha",
    vibeOrder: 4,
    slugOrder: 4,
    offHomeOrder: null,
  },
  {
    id: "drive-through",
    slug: "drive-through",
    label: { ar: "طلبات السيارة", en: "Drive-through" },
    icon: "drive-through",
    enabled: true,
    homeRank: 8,
    surface: "home",
    directoryKind: "static-list",
    resultSort: true,
    eligibility: {
      rule: "drive-through-tagged",
      momentTag: "drive-through",
    },
    momentTag: "drive-through",
    vibeOrder: 5,
    slugOrder: 5,
    offHomeOrder: null,
  },
  {
    id: "roaster",
    slug: "roaster",
    label: { ar: "أفضل محامص", en: "Best Roasteries" },
    icon: "roaster",
    enabled: true,
    homeRank: null,
    surface: "off-home",
    directoryKind: "three-pick",
    resultSort: false,
    eligibility: { rule: "moment-tag", momentTag: "roaster" },
    momentTag: "roaster",
    vibeOrder: 6,
    slugOrder: 6,
    offHomeOrder: 1,
  },
  {
    id: "specialty",
    slug: "specialty",
    label: { ar: "قهوة مختصة", en: "Specialty coffee" },
    icon: "specialty",
    enabled: true,
    homeRank: null,
    surface: "off-home",
    directoryKind: "three-pick",
    resultSort: false,
    eligibility: { rule: "moment-tag", momentTag: "roaster" },
    momentTag: "roaster",
    vibeOrder: 7,
    slugOrder: 7,
    offHomeOrder: 2,
  },
  {
    id: "quiet",
    slug: "quiet",
    label: { ar: "هادي ورايق", en: "Cozy and Quiet" },
    icon: "quiet",
    enabled: true,
    homeRank: null,
    surface: "off-home",
    directoryKind: "three-pick",
    resultSort: false,
    eligibility: { rule: "moment-tag", momentTag: "quiet" },
    momentTag: "quiet",
    vibeOrder: 8,
    slugOrder: 8,
    offHomeOrder: 5,
  },
  {
    id: "work",
    slug: "work",
    label: { ar: "للشغل", en: "Best for Work" },
    icon: "work",
    enabled: true,
    homeRank: 5,
    surface: "home",
    directoryKind: "chip-filter",
    resultSort: false,
    eligibility: { rule: "moment-tag", momentTag: "work" },
    momentTag: "work",
    vibeOrder: 9,
    slugOrder: 9,
    offHomeOrder: null,
  },
  {
    id: "study",
    slug: "study",
    label: { ar: "قعدة مذاكرة", en: "Best for Studies" },
    icon: "study",
    enabled: true,
    homeRank: null,
    surface: "off-home",
    directoryKind: "three-pick",
    resultSort: false,
    eligibility: { rule: "moment-tag", momentTag: "study" },
    momentTag: "study",
    vibeOrder: 10,
    slugOrder: 10,
    offHomeOrder: 3,
  },
  {
    id: "late",
    slug: "late",
    label: { ar: "مفتوح لآخر الليل", en: "Open late" },
    icon: "late",
    enabled: true,
    homeRank: null,
    surface: "off-home",
    directoryKind: "three-pick",
    resultSort: false,
    eligibility: { rule: "moment-tag", momentTag: "late" },
    momentTag: "late",
    vibeOrder: 11,
    slugOrder: 11,
    offHomeOrder: 4,
  },
  {
    id: "outdoor",
    slug: "outdoor",
    label: { ar: "جلسات خارجية", en: "Outdoor seating" },
    icon: "outdoor",
    enabled: true,
    homeRank: 7,
    surface: "home",
    directoryKind: "chip-filter",
    resultSort: false,
    eligibility: { rule: "moment-tag", momentTag: "outdoor" },
    momentTag: "outdoor",
    vibeOrder: 12,
    slugOrder: 12,
    offHomeOrder: null,
  },
  {
    id: "with-friends",
    slug: "with-friends",
    label: { ar: "مع الأصحاب", en: "With friends" },
    icon: "with-friends",
    enabled: true,
    homeRank: 6,
    surface: "home",
    directoryKind: "chip-filter",
    resultSort: false,
    eligibility: { rule: "moment-tag", momentTag: "with-friends" },
    momentTag: "with-friends",
    vibeOrder: 13,
    slugOrder: 13,
    offHomeOrder: null,
  },
  {
    id: "nearby",
    slug: "nearby",
    label: { ar: "قريب مني", en: "Nearby" },
    icon: "nearby",
    enabled: true,
    homeRank: 2,
    surface: "home",
    directoryKind: "nearby-geo",
    resultSort: false,
    eligibility: { rule: "nearby-haversine" },
    momentTag: null,
    vibeOrder: null,
    slugOrder: 1,
    offHomeOrder: null,
  },
] as const satisfies readonly DiscoveryCategory[];

export type DiscoveryCategoryId = (typeof DISCOVERY_CATEGORIES)[number]["id"];

export function getDiscoveryCategory(
  id: string | null | undefined,
): DiscoveryCategory | undefined {
  if (!id) return undefined;
  return DISCOVERY_CATEGORIES.find((row) => row.id === id);
}

export function discoveryCategoryLabel(
  id: string,
  language: Language,
): string | null {
  const row = getDiscoveryCategory(id);
  if (!row) return null;
  return language === "ar" ? row.label.ar : row.label.en;
}

export type VibeChip = {
  id: string;
  ar: string;
  en: string;
  momentTag: MomentTag;
};

function vibeChipsFromRegistry(): VibeChip[] {
  return DISCOVERY_CATEGORIES.filter((row) => row.vibeOrder != null)
    .slice()
    .sort((a, b) => (a.vibeOrder ?? 0) - (b.vibeOrder ?? 0))
    .map((row) => ({
      id: row.id,
      ar: row.label.ar,
      en: row.label.en,
      momentTag: row.momentTag as MomentTag,
    }));
}

/**
 * Vibe chips (13). Nearby is not a moment tag — see NEARBY_CHIP.
 * Soft Places stays parked. Derived from DISCOVERY_CATEGORIES.
 */
export const VIBE_CHIPS: readonly VibeChip[] = vibeChipsFromRegistry();

export type VibeChipId = (typeof VIBE_CHIPS)[number]["id"];

const nearby = getDiscoveryCategory("nearby");
if (!nearby) throw new Error("nearby chip missing from discovery registry");

export const NEARBY_CHIP = {
  id: "nearby",
  ar: nearby.label.ar,
  en: nearby.label.en,
} as const;

export const HOME_CHIP_IDS = DISCOVERY_CATEGORIES.filter(
  (row) => row.enabled && row.homeRank != null,
)
  .slice()
  .sort((a, b) => (a.homeRank ?? 0) - (b.homeRank ?? 0))
  .map((row) => row.id);

export type HomeChipId = (typeof HOME_CHIP_IDS)[number];

export const OFF_HOME_CHIP_IDS = DISCOVERY_CATEGORIES.filter(
  (row) => row.enabled && row.offHomeOrder != null,
)
  .slice()
  .sort((a, b) => (a.offHomeOrder ?? 0) - (b.offHomeOrder ?? 0))
  .map((row) => row.id);

export type OffHomeChipId = (typeof OFF_HOME_CHIP_IDS)[number];

export function isHomeChipId(id: string): id is HomeChipId {
  return (HOME_CHIP_IDS as readonly string[]).includes(id);
}

export const STATIC_DIRECTORY_CHIP_IDS = DISCOVERY_CATEGORIES.filter(
  (row) => row.enabled && row.directoryKind === "static-list",
)
  .slice()
  .sort((a, b) => (a.vibeOrder ?? 0) - (b.vibeOrder ?? 0))
  .map((row) => row.id);

export function isStaticDirectoryChip(
  id: string | null | undefined,
): boolean {
  const row = getDiscoveryCategory(id);
  return Boolean(row?.enabled && row.directoryKind === "static-list");
}

export function isOffHomeChipId(id: string): id is OffHomeChipId {
  const row = getDiscoveryCategory(id);
  return Boolean(row?.enabled && row.surface === "off-home");
}

export const COFFEE_SHOP_CHIP_SLUGS = DISCOVERY_CATEGORIES.filter(
  (row) => row.enabled && row.slug != null && row.slugOrder != null,
)
  .slice()
  .sort((a, b) => (a.slugOrder ?? 0) - (b.slugOrder ?? 0))
  .map((row) => row.slug as string);

export type CoffeeShopChipSlug = (typeof COFFEE_SHOP_CHIP_SLUGS)[number];

export function isCoffeeShopChipSlug(
  slug: string,
): slug is CoffeeShopChipSlug {
  return COFFEE_SHOP_CHIP_SLUGS.includes(slug);
}

export function coffeeShopChipSlugForId(
  chipId: string,
): CoffeeShopChipSlug | null {
  const row = getDiscoveryCategory(chipId);
  if (row?.enabled && row.slug && isCoffeeShopChipSlug(row.slug)) {
    return row.slug;
  }
  return null;
}

export function chipIdFromCoffeeShopSlug(slug: string): string | null {
  if (!isCoffeeShopChipSlug(slug)) return null;
  const row = DISCOVERY_CATEGORIES.find((cat) => cat.slug === slug);
  return row?.enabled ? row.id : null;
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

export function vibeChipLabel(
  chip: Pick<VibeChip, "ar" | "en">,
  language: Language,
): string {
  return language === "ar" ? chip.ar : chip.en;
}

/**
 * Moment tag that filters the shop directory on a chip share URL.
 * Popular / Nearby stay unfiltered here — they have their own pages.
 */
export function chipDirectoryMoment(
  chipId: string | null | undefined,
): MomentTag | null {
  const row = getDiscoveryCategory(chipId);
  if (!row || !row.enabled) return null;
  if (row.id === "popular" || row.id === NEARBY_CHIP.id) return null;
  if (row.momentTag === "popular") return null;
  return row.momentTag;
}

export function isDriveThroughDirectoryChip(
  chipId: string | null | undefined,
): boolean {
  const row = getDiscoveryCategory(chipId);
  return Boolean(
    row?.enabled && row.eligibility.rule === "drive-through-tagged",
  );
}

export function isDirectoryResultSortChip(
  chipId: string | null | undefined,
): boolean {
  const row = getDiscoveryCategory(chipId);
  return Boolean(row?.enabled && row.resultSort);
}

export const DIRECTORY_RESULT_SORT_CHIPS = DISCOVERY_CATEGORIES.filter(
  (row) => row.enabled && row.resultSort,
).map((row) => row.id);
