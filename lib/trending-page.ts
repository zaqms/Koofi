import type { Metadata } from "next";
import { copy } from "./copy";
import { listingOgCopy, listingOgImage } from "./listing-og";
import {
  PRODUCT_NAME,
  SOCIAL_TWITTER_CARD,
  trendingPath,
} from "./product";
import {
  listTrendingThisWeekRows,
  trendingMetaRange,
} from "./trending-this-week";
import type { Language } from "./types";

export function trendingTitle(language: Language): string {
  return `${copy.trendingThisWeek[language]} · ${PRODUCT_NAME}`;
}

const INDEXED_DESCRIPTION = {
  ar: "قهاوي الرياض اللي على ترند هالأسبوع.",
  en: "Riyadh cafés on the list this week.",
} as const;

/** Empty week: neutral line plus the window. A filled list restores the indexed line. */
export function trendingDescription(
  language: Language,
  rows: { length: number } = listTrendingThisWeekRows(),
): string {
  if (rows.length === 0) {
    const range = trendingMetaRange(language);
    return language === "ar"
      ? `ما في مقهى تجاوز معيار الترند هالأسبوع (${range})، ارجع لنا الأسبوع الجاي.`
      : `No café cleared our trending bar this week (${range}). Check back next week.`;
  }
  return INDEXED_DESCRIPTION[language];
}

/** `noindex, follow` only while the weekly list is empty. */
export function trendingRobots(
  rows: { length: number } = listTrendingThisWeekRows(),
): Metadata["robots"] {
  if (rows.length === 0) return { index: false, follow: true };
  return undefined;
}

export function trendingMetadata(language: Language): Metadata {
  const rows = listTrendingThisWeekRows();
  const title = trendingTitle(language);
  const description = trendingDescription(language, rows);
  const robots = trendingRobots(rows);
  const url = trendingPath(language);
  const ogSpec = { kind: "trending" as const, language };
  const og = listingOgCopy(ogSpec);
  const images = og
    ? [listingOgImage(ogSpec, og.title)]
    : [];

  return {
    title,
    description,
    ...(robots ? { robots } : {}),
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
