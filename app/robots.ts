import type { MetadataRoute } from "next";
import { sitemapPublicUrls } from "@/lib/sitemap-xml";

/**
 * Public pages stay crawlable. Private APIs stay out.
 * /api/shops and /api/mcp are the public catalog for agents — more specific Allow wins.
 * No Host: (Yandex-only).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/shops", "/api/shops/", "/api/mcp", "/mcp", "/llms.txt"],
      disallow: "/api/",
    },
    sitemap: sitemapPublicUrls(),
  };
}
