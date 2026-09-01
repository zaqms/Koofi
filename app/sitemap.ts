import type { MetadataRoute } from "next";
import { listRealShops } from "@/lib/catalog";
import {
  aboutPath,
  cardPath,
  feedbackPath,
  homePath,
  PUBLIC_SITE_URL,
} from "@/lib/product";

/** Canonical production origin only. Preview hosts stay out of the sitemap. */
function publicUrl(path: string): string {
  return `${PUBLIC_SITE_URL}${path === "/" ? "/" : path}`;
}

function languagePair(arPath: string, enPath: string) {
  return {
    languages: {
      ar: publicUrl(arPath),
      en: publicUrl(enPath),
    },
  };
}

function localeUrls(
  arPath: string,
  enPath: string,
  changeFrequency: "weekly" | "monthly",
): MetadataRoute.Sitemap {
  const alternates = languagePair(arPath, enPath);
  return [
    { url: publicUrl(arPath), changeFrequency, alternates },
    { url: publicUrl(enPath), changeFrequency, alternates },
  ];
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...localeUrls(homePath("ar"), homePath("en"), "weekly"),
    ...localeUrls(aboutPath("ar"), aboutPath("en"), "weekly"),
    ...localeUrls(feedbackPath("ar"), feedbackPath("en"), "weekly"),
    ...listRealShops().flatMap((shop) =>
      localeUrls(cardPath(shop.id, "ar"), cardPath(shop.id, "en"), "monthly"),
    ),
  ];
}
