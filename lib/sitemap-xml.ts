import type { MetadataRoute } from "next";
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

/**
 * MetadataRoute entries for app/sitemap.ts.
 * No alternates / xhtml:link — GSC could not read the prior hreflang urlset.
 */
export function sitemapMetadataEntries(
  lastModified = new Date(),
): MetadataRoute.Sitemap {
  return listSitemapLocs().map((url) => ({
    url,
    lastModified,
    changeFrequency: "weekly",
  }));
}

/** Fixture helper for check scripts. Same locs as sitemapMetadataEntries. */
export function buildSitemapXml(lastmod = new Date().toISOString().slice(0, 10)): string {
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
