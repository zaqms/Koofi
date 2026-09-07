import type { Metadata } from "next";
import { listDirectoryShops, listRealShops } from "./catalog";
import { copy } from "./copy";
import { COFFEE_SHOPS_CATEGORY, type DirectoryCategoryId } from "./directory-category";
import type { DirectoryShop } from "./directory";
import { categoryDistrictStaticParams } from "./district";
import { rankByPopularity } from "./picker";
import {
  MOST_POPULAR_HEADING,
  MOST_POPULAR_SLUG,
  PRODUCT_NAME,
  SOCIAL_SHARE_IMAGE,
  SOCIAL_TWITTER_CARD,
  mostPopularHeading,
  mostPopularPath,
} from "./product";
import type { Language, Shop } from "./types";

export { MOST_POPULAR_HEADING, mostPopularHeading };

export function mostPopularTitle(language: Language): string {
  return `${mostPopularHeading(language)} · ${PRODUCT_NAME}`;
}

export function mostPopularDescription(language: Language): string {
  return `${mostPopularHeading(language)} · ${copy.directoryHint[language]}`;
}

export function mostPopularMetadata(language: Language): Metadata {
  const title = mostPopularTitle(language);
  const description = mostPopularDescription(language);
  const url = mostPopularPath(language);

  return {
    title,
    description,
    applicationName: PRODUCT_NAME,
    appleWebApp: { title: PRODUCT_NAME },
    alternates: {
      canonical: url,
      languages: {
        "ar-SA": mostPopularPath("ar"),
        en: mostPopularPath("en"),
      },
    },
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

export function categoryListingStaticParams(): {
  category: DirectoryCategoryId;
  slug: string;
}[] {
  return [
    ...categoryDistrictStaticParams(),
    { category: COFFEE_SHOPS_CATEGORY, slug: MOST_POPULAR_SLUG },
  ];
}

/** Full catalog by baked popularityIndex. No brand-dedupe — directory cards. */
export function listPopularDirectoryShops(): DirectoryShop[] {
  const byId = new Map(listDirectoryShops().map((shop) => [shop.id, shop]));
  return rankByPopularity(listRealShops())
    .map((shop) => byId.get(shop.id))
    .filter((shop): shop is DirectoryShop => shop !== undefined);
}

export function listPopularPublicShops(): Shop[] {
  return rankByPopularity(listRealShops());
}
