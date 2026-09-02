import type { MetadataRoute } from "next";
import { sitemapPublicUrls } from "@/lib/sitemap-xml";

/** Public pages only. API routes stay out of the crawl. No Host: (Yandex-only). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: sitemapPublicUrls(),
  };
}
