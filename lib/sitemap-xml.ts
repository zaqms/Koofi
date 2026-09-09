import { listDirectoryShops, listRealShops } from "./catalog";
import { directoryNeighborhoods } from "./directory";
import {
  aboutPath,
  cardPath,
  districtPath,
  feedbackPath,
  homePath,
  mostPopularPath,
  PUBLIC_SITE_URL,
} from "./product";

/** Canonical sitemap for robots.txt and GSC. Apex only. */
export const SITEMAP_PATH = "/sitemap.xml" as const;

/** Old Bing / GSC submit path. Redirects to SITEMAP_PATH. */
export const LEGACY_SITEMAP_PATH = "/sitemap/sitemap.xml" as const;

/** Build-time static file served at SITEMAP_PATH. */
export const PUBLIC_SITEMAP_FILE = "public/sitemap.xml" as const;

/** GSC-safe lastmod. Date only — no ISO datetime / milliseconds. */
export const SITEMAP_LASTMOD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
    "/llms.txt",
  ];

  for (const shop of listRealShops()) {
    if (!shop.id) continue;
    paths.push(cardPath(shop.id, "ar"), cardPath(shop.id, "en"));
  }

  for (const id of directoryNeighborhoods(listDirectoryShops())) {
    paths.push(districtPath(id, "ar"), districtPath(id, "en"));
  }

  paths.push(mostPopularPath("ar"), mostPopularPath("en"));

  return paths;
}

/** Same loc set the live sitemap must emit. Catalog-driven; do not invent URLs. */
export function listSitemapLocs(): string[] {
  return sitemapPaths().map((path) => publicLoc(path));
}

export function sitemapPublicUrl(): string {
  return `${PUBLIC_SITE_URL}${SITEMAP_PATH}`;
}

/** Date-only lastmod (`YYYY-MM-DD`). MetadataRoute Date objects emit ISO datetimes. */
export function sitemapLastmodDate(date = new Date()): string {
  const lastmod = date.toISOString().slice(0, 10);
  if (!SITEMAP_LASTMOD_PATTERN.test(lastmod)) {
    throw new Error(`sitemap lastmod must be YYYY-MM-DD, got ${lastmod}`);
  }
  return lastmod;
}

/**
 * Hand-built urlset for public/sitemap.xml.
 * Catalog locs only. No xhtml/hreflang. Date-only lastmod.
 */
export function buildSitemapXml(lastmod = sitemapLastmodDate()): string {
  if (!SITEMAP_LASTMOD_PATTERN.test(lastmod)) {
    throw new Error(`sitemap lastmod must be YYYY-MM-DD, got ${lastmod}`);
  }
  const urls = listSitemapLocs().flatMap((loc) => [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
    "    <changefreq>weekly</changefreq>",
    "  </url>",
  ]);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}
