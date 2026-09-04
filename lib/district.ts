import type { Metadata } from "next";
import { listDirectoryShops } from "./catalog";
import { copy } from "./copy";
import {
  COFFEE_SHOPS_CATEGORY,
  categoryDistrictHeading,
  coffeeShopsInDistrict,
  type DirectoryCategoryId,
} from "./directory-category";
import { directoryNeighborhoods } from "./directory";
import { isNeighborhoodId, neighborhoodLabel } from "./neighborhoods";
import {
  categoryDistrictPath,
  PRODUCT_NAME,
  SOCIAL_SHARE_IMAGE,
  SOCIAL_TWITTER_CARD,
} from "./product";
import type { Language, NeighborhoodId } from "./types";

export function resolveDistrictSlug(slug: string): NeighborhoodId | null {
  return isNeighborhoodId(slug) ? slug : null;
}

export function categoryDistrictStaticParams(): {
  category: DirectoryCategoryId;
  slug: NeighborhoodId;
}[] {
  return directoryNeighborhoods(listDirectoryShops()).map((slug) => ({
    category: COFFEE_SHOPS_CATEGORY,
    slug,
  }));
}

export function districtTitle(
  id: NeighborhoodId,
  language: Language,
  category: DirectoryCategoryId = COFFEE_SHOPS_CATEGORY,
): string {
  return `${categoryDistrictHeading(category, id, language)} · ${PRODUCT_NAME}`;
}

export function districtDescription(
  id: NeighborhoodId,
  language: Language,
  category: DirectoryCategoryId = COFFEE_SHOPS_CATEGORY,
): string {
  const name = neighborhoodLabel(id, language);
  const hint = copy.directoryHint[language];
  if (category === COFFEE_SHOPS_CATEGORY) {
    return `${coffeeShopsInDistrict(name, language)} · ${hint}`;
  }
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

  return {
    title,
    description,
    applicationName: PRODUCT_NAME,
    appleWebApp: { title: PRODUCT_NAME },
    openGraph: {
      title,
      description,
      siteName: PRODUCT_NAME,
      locale: language === "en" ? "en_US" : "ar_SA",
      type: "website",
      url,
      images: [SOCIAL_SHARE_IMAGE],
    },
    twitter: {
      card: SOCIAL_TWITTER_CARD,
      title,
      description,
      images: [SOCIAL_SHARE_IMAGE],
    },
  };
}
