import type { Shop } from "./types";

/**
 * Mass-market brands only. A branch with `isChain` is never specialty.
 * Coffee Address and % Arabica stay specialty and are not in this registry.
 * Logos point at files already in /public/logos, or null. Do not add marks here.
 */
export type ChainBrand = {
  id: string;
  nameEn: string;
  nameAr: string;
  logo: string | null;
};

export const CHAIN_BRANDS = {
  starbucks: {
    id: "starbucks",
    nameEn: "Starbucks",
    nameAr: "ستاربكس",
    logo: null,
  },
  dunkin: {
    id: "dunkin",
    nameEn: "Dunkin'",
    nameAr: "دانكن",
    logo: null,
  },
  mccafe: {
    id: "mccafe",
    nameEn: "McCafe",
    nameAr: "ماك كافيه",
    logo: null,
  },
  barns: {
    id: "barns",
    nameEn: "Barn's",
    nameAr: "بارنز",
    logo: null,
  },
  peets: {
    id: "peets",
    nameEn: "Peet's",
    nameAr: "بيتس",
    logo: null,
  },
  "dr-cafe": {
    id: "dr-cafe",
    nameEn: "dr.CAFE",
    nameAr: "د.كيف",
    logo: "/logos/drcafe-mark.png",
  },
  java: {
    id: "java",
    nameEn: "Java",
    nameAr: "جافا",
    logo: "/logos/java-cafe.png",
  },
  "24cafe": {
    id: "24cafe",
    nameEn: "24cafe",
    nameAr: "24كافيه",
    logo: "/logos/24cafe-mark.png",
  },
  shqaf: {
    id: "shqaf",
    nameEn: "Shqaf",
    nameAr: "شقفه",
    logo: null,
  },
  "coffee-day": {
    id: "coffee-day",
    nameEn: "Coffee Day",
    nameAr: "كوفي داي",
    logo: null,
  },
  kyan: {
    id: "kyan",
    nameEn: "Kyan",
    nameAr: "كيان",
    logo: null,
  },
  dancafe: {
    id: "dancafe",
    nameEn: "Dancafe",
    nameAr: "دان كافيه",
    logo: null,
  },
  drive: {
    id: "drive",
    nameEn: "Drive Coffee",
    nameAr: "درايف كوفي",
    logo: "/logos/drive-coffee-wordmark.png",
  },
  // Batch F (5 Oct 2026): 49 Riyadh pins on Places (Shoug B3 text search, 2 Oct) — mass-market under the 8+ branch rule.
  "half-million": {
    id: "half-million",
    nameEn: "Half Million",
    nameAr: "هاف مليون",
    logo: "/logos/half-million-mark.png",
  },
  // Batch F (5 Oct 2026): 183 KSA branches, 25+ on the Riyadh locator.
  "tim-hortons": {
    id: "tim-hortons",
    nameEn: "Tim Hortons",
    nameAr: "تيم هورتنز",
    logo: "/logos/tim-hortons-wordmark.png",
  },
} as const satisfies Record<string, ChainBrand>;

export type ChainBrandId = keyof typeof CHAIN_BRANDS;

export function isChainBrandId(id: string): id is ChainBrandId {
  return Object.prototype.hasOwnProperty.call(CHAIN_BRANDS, id);
}

/** Names a typed ask can use for a mass-market brand, including partials. */
const CHAIN_BRAND_SEARCH_ALIASES: Record<ChainBrandId, readonly string[]> = {
  starbucks: ["starbucks", "ستاربكس"],
  dunkin: ["dunkin", "دانكن"],
  mccafe: ["mccafe", "mc cafe", "ماك كافيه"],
  barns: ["barns", "barn", "barn s", "بارنز"],
  peets: ["peets", "peet s", "بيتس"],
  "dr-cafe": ["dr cafe", "dr. cafe", "drcafe", "doctor cafe", "د.كيف", "د كيف", "دكتور كيف"],
  java: ["java", "جافا"],
  "24cafe": ["24cafe", "24 cafe", "24كافيه"],
  shqaf: ["shqaf", "shgaf", "شقفة"],
  "coffee-day": ["coffee day", "coffeeday", "كوفي داي"],
  kyan: ["kyan", "كيان"],
  dancafe: ["dancafe", "dan cafe", "دان كافيه"],
  drive: ["drive coffee", "drivecoffee", "درايف كوفي", "درايف كافي"],
  "half-million": ["half million", "halfmillion", "هاف مليون", "هاف ميليون"],
  "tim-hortons": ["tim hortons", "tim horton", "timhortons", "تيم هورتنز", "تيم هورتن", "تيم هورتونز"],
};

export function chainBrandSearchAliases(id: ChainBrandId): readonly string[] {
  const brand = CHAIN_BRANDS[id];
  return [brand.nameEn, brand.nameAr, ...CHAIN_BRAND_SEARCH_ALIASES[id]];
}

export function isChainShop(
  shop: { isChain?: boolean | true },
): boolean {
  return shop.isChain === true;
}

/** Public brand label for a chain row. Unknown ids fall back to the raw key. */
export function chainBrandNameEn(chainBrand: string | undefined): string | undefined {
  if (!chainBrand) return undefined;
  if (isChainBrandId(chainBrand)) return CHAIN_BRANDS[chainBrand].nameEn;
  return chainBrand;
}

/**
 * Same-brand key for mass-market names. Checked before the specialty
 * KNOWN_BRANDS list. Returns null when the name is not one of these brands,
 * so specialty keys (including Java Cafe → `java` and dr.CAFE → `dr-cafe`)
 * stay on their current spelling.
 */
export function chainBrandKeyFromName(latinName: string): string | null {
  const compact = latinName.replace(/\s+/g, "");
  if (
    latinName.startsWith("coffee day") ||
    compact.startsWith("coffeeday")
  ) {
    return "coffee-day";
  }
  if (latinName.startsWith("shqaf") || latinName.startsWith("shgaf")) {
    return "shqaf";
  }
  if (
    latinName.startsWith("dan cafe") ||
    latinName.startsWith("dancafe") ||
    compact.startsWith("dancafe")
  ) {
    return "dancafe";
  }
  if (latinName.startsWith("kyan")) return "kyan";
  if (
    latinName.startsWith("drive coffee") ||
    compact.startsWith("drivecoffee")
  ) {
    return "drive";
  }
  if (
    latinName.startsWith("half million") ||
    compact.startsWith("halfmillion")
  ) {
    return "half-million";
  }
  if (
    latinName.startsWith("tim hortons") ||
    latinName.startsWith("tim horton") ||
    compact.startsWith("timhorton")
  ) {
    return "tim-hortons";
  }
  if (
    latinName.startsWith("barns") ||
    latinName.startsWith("barn s") ||
    compact.startsWith("barns")
  ) {
    return "barns";
  }
  if (
    latinName.startsWith("peets") ||
    latinName.startsWith("peet s") ||
    compact.startsWith("peets")
  ) {
    return "peets";
  }
  if (
    latinName.startsWith("mccafe") ||
    latinName.startsWith("mc cafe") ||
    compact.startsWith("mccafe")
  ) {
    return "mccafe";
  }
  if (
    latinName.startsWith("24cafe") ||
    latinName.startsWith("24 cafe") ||
    compact.startsWith("24cafe")
  ) {
    return "24cafe";
  }
  if (latinName.startsWith("dunkin")) return "dunkin";
  if (latinName.startsWith("starbucks")) return "starbucks";
  if (latinName.startsWith("java")) return "java";
  if (latinName.startsWith("dr cafe") || compact === "drcafe") return "dr-cafe";
  return null;
}

export function shopChainBrand(
  shop: Pick<Shop, "isChain" | "chainBrand">,
): ChainBrand | null {
  if (!isChainShop(shop) || !shop.chainBrand) return null;
  if (!isChainBrandId(shop.chainBrand)) return null;
  return CHAIN_BRANDS[shop.chainBrand];
}
