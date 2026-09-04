import type { NextConfig } from "next";

const sitemapHeaders = [
  { key: "Content-Type", value: "application/xml; charset=utf-8" },
  { key: "Cache-Control", value: "public, max-age=3600" },
];

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
    ];
  },
};

export default nextConfig;
