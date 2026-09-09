import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  buildSitemapXml,
  listSitemapLocs,
  PUBLIC_SITEMAP_FILE,
  sitemapLastmodDate,
} from "../lib/sitemap-xml";

/**
 * Write public/sitemap.xml from listSitemapLocs().
 * Run when the catalog grows (`npm run generate-sitemap`).
 * Also hooked as prebuild so Vercel deploys stay in sync.
 */
const lastmod = sitemapLastmodDate();
const xml = buildSitemapXml(lastmod);
const out = join(process.cwd(), PUBLIC_SITEMAP_FILE);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, xml, "utf8");
console.log(
  `generate-sitemap: wrote ${PUBLIC_SITEMAP_FILE} (${listSitemapLocs().length} locs, lastmod ${lastmod})`,
);
