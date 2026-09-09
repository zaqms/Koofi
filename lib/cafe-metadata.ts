import type { Metadata } from "next";
import { cafeArMeta, cafeArTitle } from "./ar-content";
import {
  cafeEnMeta,
  cafeEnTitle,
  cafeOgImagePath,
} from "./en-content";
import { pageAlternates } from "./locale";
import { neighborhoodLabel } from "./neighborhoods";
import {
  cardPath,
  PRODUCT_NAME,
  SOCIAL_TWITTER_CARD,
} from "./product";
import type { Language, Shop } from "./types";

export { cafeArMeta, cafeArTitle } from "./ar-content";

export function cafePageMetadata(shop: Shop, language: Language): Metadata {
  const title =
    language === "en" ? cafeEnTitle(shop) : cafeArTitle(shop);
  const description =
    language === "en" ? cafeEnMeta(shop) : cafeArMeta(shop);
  const url = cardPath(shop.id, language);
  const ogImage = {
    url: cafeOgImagePath(shop.id, language),
    width: 1200,
    height: 630,
    alt: `${shop.nameEn} · ${neighborhoodLabel(shop.neighborhood, "en")} · ${PRODUCT_NAME}`,
  };

  return {
    title,
    description,
    applicationName: PRODUCT_NAME,
    appleWebApp: { title: PRODUCT_NAME },
    alternates: pageAlternates(
      url,
      cardPath(shop.id, "ar"),
      cardPath(shop.id, "en"),
    ),
    openGraph: {
      title,
      description,
      siteName: PRODUCT_NAME,
      locale: language === "en" ? "en_US" : "ar_SA",
      type: "website",
      url,
      images: [ogImage],
    },
    twitter: {
      card: SOCIAL_TWITTER_CARD,
      title,
      description,
      images: [ogImage.url],
    },
  };
}

export function cafeMissingMetadata(language: Language): Metadata {
  return {
    title:
      language === "en"
        ? `${PRODUCT_NAME} · Cafe card`
        : `${PRODUCT_NAME} · البطاقة`,
  };
}
