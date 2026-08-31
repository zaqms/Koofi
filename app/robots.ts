import type { MetadataRoute } from "next";
import { PUBLIC_SITE_HOST, PUBLIC_SITE_URL } from "@/lib/product";

/** Public pages only. API routes stay out of the crawl. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${PUBLIC_SITE_URL}/sitemap.xml`,
    host: PUBLIC_SITE_HOST,
  };
}
