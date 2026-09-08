import type { NextConfig } from "next";
import { TEMPORARY_DEFAULT_LANDING_MOST_POPULAR } from "./lib/landing-experiment";

const sitemapHeaders = [
  { key: "Content-Type", value: "application/xml; charset=utf-8" },
  { key: "Cache-Control", value: "public, max-age=3600" },
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
    return [
      { source: "/sitemap.xml", headers: sitemapHeaders },
      { source: "/sitemap/sitemap.xml", headers: sitemapHeaders },
    ];
  },
  async redirects() {
    return [
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
