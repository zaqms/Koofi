import type { Metadata } from "next";
import { copy } from "./copy";
import {
  COFFEE_SHOPS_CATEGORY,
  categoryDistrictHeading,
  type DirectoryCategoryId,
} from "./directory-category";
import { districtArMeta, districtArTitle } from "./ar-content";
import { districtEnMeta, districtEnTitle } from "./en-content";
import { listingOgCopy, listingOgImage } from "./listing-og";
import { pageAlternates } from "./locale";
import { isNeighborhoodId, neighborhoodLabel } from "./neighborhoods";
import {
  categoryDistrictPath,
  PRODUCT_NAME,
  SOCIAL_SHARE_IMAGE,
  SOCIAL_TWITTER_CARD,
} from "./product";
import { NEIGHBORHOOD_IDS, type Language, type NeighborhoodId } from "./types";

export function resolveDistrictSlug(slug: string): NeighborhoodId | null {
  return isNeighborhoodId(slug) ? slug : null;
}

export function categoryDistrictStaticParams(): {
  category: DirectoryCategoryId;
  slug: NeighborhoodId;
}[] {
  return NEIGHBORHOOD_IDS.map((slug) => ({
    category: COFFEE_SHOPS_CATEGORY,
    slug,
  }));
}

export function districtTitle(
  id: NeighborhoodId,
  language: Language,
  category: DirectoryCategoryId = COFFEE_SHOPS_CATEGORY,
): string {
  if (language === "en" && category === COFFEE_SHOPS_CATEGORY) {
    return districtEnTitle(id);
  }
  if (language === "ar" && category === COFFEE_SHOPS_CATEGORY) {
    return districtArTitle(id);
  }
  return `${categoryDistrictHeading(category, id, language)} · ${PRODUCT_NAME}`;
}

export function districtDescription(
  id: NeighborhoodId,
  language: Language,
  category: DirectoryCategoryId = COFFEE_SHOPS_CATEGORY,
): string {
  if (language === "en" && category === COFFEE_SHOPS_CATEGORY) {
    return districtEnMeta(id);
  }
  if (language === "ar" && category === COFFEE_SHOPS_CATEGORY) {
    return districtArMeta(id);
  }
  const name = neighborhoodLabel(id, language);
  const hint = copy.directoryHint[language];
  return `${hint} · ${name}`;
}

export function districtMetadata(
  id: NeighborhoodId,
  language: Language,
  category: DirectoryCategoryId = COFFEE_SHOPS_CATEGORY,
): Metadata {
  const title = districtTitle(id, language, category);
  const description = districtDescription(id, language, category);
  const url = categoryDistrictPath(category, id, language);
  const ogSpec = { kind: "district" as const, language, id };
  const og = listingOgCopy(ogSpec);
  const images = og ? [listingOgImage(ogSpec, og.title)] : [SOCIAL_SHARE_IMAGE];

  return {
    title,
    description,
    applicationName: PRODUCT_NAME,
    appleWebApp: { title: PRODUCT_NAME },
    alternates: pageAlternates(
      url,
      categoryDistrictPath(category, id, "ar"),
      categoryDistrictPath(category, id, "en"),
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
