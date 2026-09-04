import { listDirectoryShops, listRealShops } from "./catalog";
import { directoryNeighborhoods } from "./directory";
import {
  aboutPath,
  cardPath,
  districtPath,
  feedbackPath,
  homePath,
  PUBLIC_SITE_URL,
} from "./product";

/** Canonical sitemap URLs for robots.txt and GSC. Apex only. */
export const SITEMAP_PATHS = ["/sitemap.xml", "/sitemap/sitemap.xml"] as const;

export const SITEMAP_CONTENT_TYPE = "application/xml; charset=utf-8";

const SITEMAP_HEADERS = {
  "Content-Type": SITEMAP_CONTENT_TYPE,
  "Cache-Control": "public, max-age=3600",
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/** Homepage keeps the trailing slash. Every other path is slash-free. */
function publicLoc(path: string): string {
  if (path === "/") return `${PUBLIC_SITE_URL}/`;
  return `${PUBLIC_SITE_URL}${path}`;
}

function sitemapPaths(): string[] {
  const paths = [
    homePath("ar"),
    homePath("en"),
    aboutPath("ar"),
    aboutPath("en"),
    feedbackPath("ar"),
    feedbackPath("en"),
  ];

  for (const shop of listRealShops()) {
    if (!shop.id) continue;
    paths.push(cardPath(shop.id, "ar"), cardPath(shop.id, "en"));
  }

  for (const id of directoryNeighborhoods(listDirectoryShops())) {
    paths.push(districtPath(id, "ar"), districtPath(id, "en"));
  }

  return paths;
}

/**
 * Hand-built urlset for Google Search Console.
 * No MetadataRoute, no xhtml/hreflang, http xmlns only, apex https locs.
 */
export function buildSitemapXml(lastmod = new Date().toISOString().slice(0, 10)): string {
  const urls = sitemapPaths().flatMap((path) => {
    const loc = publicLoc(path);
    if (!loc) return [];
    return [
      "  <url>",
      `    <loc>${escapeXml(loc)}</loc>`,
      `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
      "    <changefreq>weekly</changefreq>",
      "  </url>",
    ];
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

export function sitemapPublicUrls(): string[] {
  return SITEMAP_PATHS.map((path) => `${PUBLIC_SITE_URL}${path}`);
}

export function sitemapXmlResponse(): Response {
  return new Response(buildSitemapXml(), {
    status: 200,
    headers: SITEMAP_HEADERS,
  });
}
