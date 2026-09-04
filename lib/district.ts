import type { Metadata } from "next";
import { listDirectoryShops } from "./catalog";
import { copy } from "./copy";
import { directoryNeighborhoods } from "./directory";
import { isNeighborhoodId, neighborhoodLabel } from "./neighborhoods";
import {
  districtPath,
  PRODUCT_NAME,
  SOCIAL_SHARE_IMAGE,
} from "./product";
import type { Language, NeighborhoodId } from "./types";

export function resolveDistrictSlug(slug: string): NeighborhoodId | null {
  return isNeighborhoodId(slug) ? slug : null;
}

export function districtStaticParams(): { slug: NeighborhoodId }[] {
  return directoryNeighborhoods(listDirectoryShops()).map((slug) => ({ slug }));
}

export function districtTitle(
  id: NeighborhoodId,
  language: Language,
): string {
  return `${neighborhoodLabel(id, language)} · ${PRODUCT_NAME}`;
}

export function districtDescription(
  id: NeighborhoodId,
  language: Language,
): string {
  return `${copy.directoryHint[language]} · ${neighborhoodLabel(id, language)}`;
}

export function districtMetadata(
  id: NeighborhoodId,
  language: Language,
): Metadata {
  const title = districtTitle(id, language);
  const description = districtDescription(id, language);
  const url = districtPath(id, language);

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
      card: "summary",
      title,
      description,
      images: [SOCIAL_SHARE_IMAGE],
    },
  };
}
