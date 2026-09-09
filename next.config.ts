import type { NextConfig } from "next";
import { TEMPORARY_DEFAULT_LANDING_MOST_POPULAR } from "./lib/landing-experiment";

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
 * TEMPORARY experiment (Amjad): `/` + `/en` 308 to Most Popular.
 * Clear landing path for bounce-rate analytics. Flip the flag to revert.
 */
const defaultLandingRedirects = TEMPORARY_DEFAULT_LANDING_MOST_POPULAR
  ? [
      {
        source: "/",
        destination: "/coffee-shops/most-popular",
        statusCode: 308,
      },
      {
        source: "/en",
        destination: "/en/coffee-shops/most-popular",
        statusCode: 308,
      },
    ]
  : [];

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
      ...defaultLandingRedirects,
    ];
  },
};

export default nextConfig;
