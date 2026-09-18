import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PUBLIC_SITEMAP_FILE } from "../lib/sitemap-xml";

/**
 * The live sitemap is the committed Replit urlset in public/sitemap.xml.
 * Do not regenerate from the catalog — GSC could not fetch that approach.
 * prebuild only verifies the committed file so Vercel cannot overwrite it.
 */
const FORBIDDEN = [
  "good-for-a-date",
  "/coffee-shops/for-two",
  "/coffee-shops/date<",
  "/en/coffee-shops/date<",
  "soft-places",
  "chipId=date",
];
const REQUIRED = [
  "https://wain.lol/coffee-shops/with-friends",
  "https://wain.lol/coffee-shops/matcha",
  "https://wain.lol/coffee-shops/drive-through",
];
const EXPECTED_LOCS = 294;

const out = join(process.cwd(), PUBLIC_SITEMAP_FILE);
if (!existsSync(out)) {
  throw new Error(`generate-sitemap: missing ${PUBLIC_SITEMAP_FILE}`);
}

const xml = readFileSync(out, "utf8");
if (!xml.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
  throw new Error("generate-sitemap: committed file must be a sitemap 0.9 urlset");
}

const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (locs.length !== EXPECTED_LOCS) {
  throw new Error(
    `generate-sitemap: expected ${EXPECTED_LOCS} locs, got ${locs.length}`,
  );
}
if (locs.some((loc) => !loc.startsWith("https://wain.lol"))) {
  throw new Error("generate-sitemap: every loc must be an https://wain.lol URL");
}

for (const needle of FORBIDDEN) {
  if (xml.includes(needle)) {
    throw new Error(`generate-sitemap: forbidden sitemap token ${needle}`);
  }
}
for (const loc of REQUIRED) {
  if (!xml.includes(`${loc}<`)) {
    throw new Error(`generate-sitemap: missing ${loc}`);
  }
}

console.log(
  `generate-sitemap: keeping committed Replit ${PUBLIC_SITEMAP_FILE} (${locs.length} locs)`,
);
