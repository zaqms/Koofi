import type { MetadataRoute } from "next";
import { sitemapMetadataEntries } from "@/lib/sitemap-xml";

/** Hourly ISR so Vercel serves /sitemap.xml from cache, not a cold function. */
export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapMetadataEntries();
}
