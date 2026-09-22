import type { Metadata } from "next";
import { copy } from "./copy";
import { listingOgCopy, listingOgImage } from "./listing-og";
import { pageAlternates } from "./locale";
import {
  MEET_HALFWAY_CHIP,
  PRODUCT_NAME,
  SOCIAL_SHARE_IMAGE,
  SOCIAL_TWITTER_CARD,
  chipSharePath,
  discoveryCategoryLabel,
  vibeChipLabel,
} from "./product";
import type { Language } from "./types";

function chipLabel(chipId: string, language: Language): string {
  if (chipId === MEET_HALFWAY_CHIP.id) {
    return vibeChipLabel(MEET_HALFWAY_CHIP, language);
  }
  return discoveryCategoryLabel(chipId, language) ?? PRODUCT_NAME;
}

/** Thin share metadata. Chip label + locked opener. No Soft Places copy. */
export function chipPageMetadata(
  chipId: string,
  language: Language,
): Metadata {
  const label = chipLabel(chipId, language);
  const title = `${label} · ${PRODUCT_NAME}`;
  const description = language === "en" ? copy.openerEn : copy.opener;
  const url = chipSharePath(chipId, language);
  const ogSpec =
    chipId === "popular"
      ? ({ kind: "popular", language } as const)
      : ({ kind: "chip", language, id: chipId } as const);
  const og = listingOgCopy(ogSpec);
  const images = og ? [listingOgImage(ogSpec, og.title)] : [SOCIAL_SHARE_IMAGE];

  return {
    title,
    description,
    applicationName: PRODUCT_NAME,
    appleWebApp: { title: PRODUCT_NAME },
    alternates: pageAlternates(
      url,
      chipSharePath(chipId, "ar"),
      chipSharePath(chipId, "en"),
    ),
    openGraph: {
      title,
      description,
      siteName: PRODUCT_NAME,
      locale: language === "en" ? "en_US" : "ar_SA",
      type: "website",
      url,
      images,
    },
    twitter: {
      card: SOCIAL_TWITTER_CARD,
      title,
      description,
      images,
    },
  };
}

export function halfwayPageMetadata(language: Language): Metadata {
  return chipPageMetadata(MEET_HALFWAY_CHIP.id, language);
}
