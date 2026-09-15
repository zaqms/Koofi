import type { NextConfig } from "next";
import { TEMPORARY_DEFAULT_LANDING_MOST_POPULAR } from "./lib/landing-experiment";
import { LEGACY_CHIP_REDIRECTS } from "./lib/product";

void TEMPORARY_DEFAULT_LANDING_MOST_POPULAR;

const sitemapHeaders = [
  { key: "Content-Type", value: "application/xml; charset=utf-8" },
  // public/sitemap.xml is a static file. Vercel can attach
  // Content-Disposition: attachment on .xml — GSC then reports
  // "Sitemap could not be read" even when URL Inspection succeeds.
  { key: "Content-Disposition", value: "inline" },
  {
    key: "Cache-Control",
    value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
  },
];

/**
 * P0 home (Amjad GREENLIGHT): `/` and `/en` render the native chrome.
 * TEMPORARY_DEFAULT_LANDING_MOST_POPULAR stays in lib/landing-experiment.ts
 * as the revert hook — do not re-add a root 308 here in this PR.
 */
const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/sitemap.xml", headers: sitemapHeaders }];
  },
  async redirects() {
    return [
      {
        source: "/sitemap/sitemap.xml",
        destination: "/sitemap.xml",
        statusCode: 301,
      },
      {
        source: "/n/:slug",
        destination: "/coffee-shops/:slug",
        statusCode: 301,
      },
      {
        source: "/en/n/:slug",
        destination: "/en/coffee-shops/:slug",
        statusCode: 301,
      },
      {
        source: "/en/most-popular-cafes-in-riyadh",
        destination: "/en/coffee-shops/most-popular",
        statusCode: 308,
      },
      ...LEGACY_CHIP_REDIRECTS,
    ];
  },
};

export default nextConfig;
