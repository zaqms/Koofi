import type { MetadataRoute } from "next";
import { sitemapPublicUrl } from "@/lib/sitemap-xml";

/**
 * Public pages stay crawlable. Private APIs stay out.
 * /api/shops and /api/mcp are the public catalog for agents — more specific Allow wins.
 * No Host: (Yandex-only).
 * One Sitemap line only — GSC's sitemap fetcher is unreliable with duplicates.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/api/shops", "/api/shops/", "/api/mcp", "/mcp", "/llms.txt"],
      disallow: ["/api/", "/ops/", "/owner/edit", "/en/owner/edit"],
    },
    sitemap: sitemapPublicUrl(),
  };
}
