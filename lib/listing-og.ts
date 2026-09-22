import { directoryHintForCity } from "./cities";
import {
  COFFEE_SHOPS_CATEGORY,
  categoryDistrictHeading,
} from "./directory-category";
import { isNeighborhoodId } from "./neighborhoods";
import {
  LOCKED_HOME_SUPPORT,
  LOCKED_OPENER,
  LOCKED_OPENER_EN,
  MEET_HALFWAY_CHIP,
  discoveryCategoryLabel,
  mostPopularHeading,
  vibeChipLabel,
} from "./product";
import type { Language } from "./types";

export const LISTING_OG_SIZE = { width: 1200, height: 630 } as const;
export const LISTING_OG_CONTENT_TYPE = "image/png";

export type ListingOgSpec =
  | { kind: "home" | "popular"; language: Language }
  | { kind: "chip" | "district"; language: Language; id: string };

export type ListingOgCopy = {
  title: string;
  subtitle: string;
  language: Language;
};

/**
 * Page heading painted on the share card. Soft Places stays parked —
 * there is no kind for it.
 */
export function listingOgCopy(spec: ListingOgSpec): ListingOgCopy | null {
  const { language } = spec;
  if (spec.kind === "home") {
    return {
      title: language === "en" ? LOCKED_OPENER_EN : LOCKED_OPENER,
      subtitle: LOCKED_HOME_SUPPORT[language],
      language,
    };
  }
  if (spec.kind === "popular") {
    return {
      title: mostPopularHeading(language),
      subtitle: directoryHintForCity(language),
      language,
    };
  }
  if (spec.kind === "chip") {
    const title =
      spec.id === MEET_HALFWAY_CHIP.id
        ? vibeChipLabel(MEET_HALFWAY_CHIP, language)
        : spec.id === "popular"
          ? mostPopularHeading(language)
          : discoveryCategoryLabel(spec.id, language);
    if (!title) return null;
    return {
      title,
      subtitle: directoryHintForCity(language),
      language,
    };
  }
  if (spec.kind !== "district" || !isNeighborhoodId(spec.id)) return null;
  return {
    title: categoryDistrictHeading(COFFEE_SHOPS_CATEGORY, spec.id, language),
    subtitle: directoryHintForCity(language),
    language,
  };
}

export function listingOgPath(spec: ListingOgSpec): string {
  const locale = spec.language;
  if (spec.kind === "chip" || spec.kind === "district") {
    return `/og/${locale}/${spec.kind}/${encodeURIComponent(spec.id)}`;
  }
  return `/og/${locale}/${spec.kind}`;
}

export function listingOgImage(spec: ListingOgSpec, alt: string) {
  return {
    url: listingOgPath(spec),
    width: LISTING_OG_SIZE.width,
    height: LISTING_OG_SIZE.height,
    alt,
    type: LISTING_OG_CONTENT_TYPE,
  };
}
