import type { Metadata } from "next";
import { copy } from "./copy";
import { listingOgCopy, listingOgImage } from "./listing-og";
import {
  PRODUCT_NAME,
  SOCIAL_TWITTER_CARD,
  trendingPath,
} from "./product";
import type { Language } from "./types";

export function trendingTitle(language: Language): string {
  return `${copy.trendingThisWeek[language]} · ${PRODUCT_NAME}`;
}

export function trendingDescription(language: Language): string {
  return language === "ar"
    ? "قهاوي الرياض اللي على ترند هالأسبوع."
    : "Riyadh cafés on the list this week.";
}

export function trendingMetadata(language: Language): Metadata {
  const title = trendingTitle(language);
  const description = trendingDescription(language);
  const url = trendingPath(language);
  const ogSpec = { kind: "trending" as const, language };
  const og = listingOgCopy(ogSpec);
  const images = og
    ? [listingOgImage(ogSpec, og.title)]
    : [];

  return {
    title,
    description,
    applicationName: PRODUCT_NAME,
    appleWebApp: { title: PRODUCT_NAME },
    alternates: {
      canonical: url,
      languages: {
        "ar-SA": trendingPath("ar"),
        en: trendingPath("en"),
      },
    },
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
