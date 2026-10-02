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
  "krispy-kreme": {
    id: "krispy-kreme",
    nameEn: "Krispy Kreme",
    nameAr: "كريسبي كريم",
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
} as const satisfies Record<string, ChainBrand>;

export type ChainBrandId = keyof typeof CHAIN_BRANDS;

export function isChainBrandId(id: string): id is ChainBrandId {
  return Object.prototype.hasOwnProperty.call(CHAIN_BRANDS, id);
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
    latinName.startsWith("krispy kreme") ||
    compact.startsWith("krispykreme")
  ) {
    return "krispy-kreme";
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
