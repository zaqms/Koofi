import type { Language } from "./types";

/** People-facing name. The npm package stays `koofi`. */
export const PRODUCT_NAME = "Koofi";

/** Locked until Amjad picks a GenZ line. */
export const LOCKED_OPENER = "اي قهوة ناوي تروح؟";

/** Catalog / API / UI field for fictional demo shops. */
export const EXAMPLE_FLAG = "example" as const;

export const EXAMPLE_BADGE = {
  ar: "مثال",
  en: "Example",
} as const;

export const CARD_PATH_PREFIX = "/c";

export function cardPath(id: string): string {
  return `${CARD_PATH_PREFIX}/${encodeURIComponent(id)}`;
}

export function shopDisplayName(
  shop: { nameAr: string; nameEn: string },
  language: Language,
): string {
  return language === "ar" ? shop.nameAr : shop.nameEn;
}

export function isExampleShop(shop: { [EXAMPLE_FLAG]: boolean }): boolean {
  return shop[EXAMPLE_FLAG] === true;
}

export function exampleBadge(language: Language): string {
  return EXAMPLE_BADGE[language];
}
