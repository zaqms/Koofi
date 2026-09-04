import { listDirectoryShops } from "../lib/catalog";
import { copy } from "../lib/copy";
import {
  districtDescription,
  districtTitle,
  resolveDistrictSlug,
} from "../lib/district";
import {
  directoryNeighborhoods,
  filterDirectoryShops,
} from "../lib/directory";
import { neighborhoodLabel } from "../lib/neighborhoods";
import { districtPath, homePath, PRODUCT_NAME } from "../lib/product";
import { buildSitemapXml } from "../lib/sitemap-xml";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

assert(resolveDistrictSlug("ghirnatah") === "ghirnatah", "ghirnatah resolves");
assert(resolveDistrictSlug("al-shohda") === "al-shohda", "al-shohda resolves");
assert(resolveDistrictSlug("not-a-hood") === null, "unknown slug is null");
assert(resolveDistrictSlug("غرناطة") === null, "Arabic label is not a slug");

assert(districtPath("ghirnatah", "ar") === "/n/ghirnatah", "AR district path");
assert(
  districtPath("al-shohda", "en") === "/en/n/al-shohda",
  "EN district path",
);
assert(homePath("ar") === "/", "AR home");
assert(homePath("en") === "/en", "EN home");

const shops = listDirectoryShops();
const areas = directoryNeighborhoods(shops);
assert(areas.includes("ghirnatah"), "directory includes ghirnatah");
assert(areas.includes("al-shohda"), "directory includes al-shohda");

const granada = filterDirectoryShops(shops, "ghirnatah");
assert(granada.length > 0, "ghirnatah has shops");
assert(
  granada.every((shop) => shop.neighborhood === "ghirnatah"),
  "ghirnatah filter stays in district",
);

const shohda = filterDirectoryShops(shops, "al-shohda");
assert(shohda.length > 0, "al-shohda has shops");
assert(
  shohda.every((shop) => shop.neighborhood === "al-shohda"),
  "al-shohda filter stays in district",
);

assert(
  districtTitle("ghirnatah", "ar") ===
    `${neighborhoodLabel("ghirnatah", "ar")} · ${PRODUCT_NAME}`,
  "AR title is name · wain.lol",
);
assert(
  districtTitle("al-shohda", "en") ===
    `${neighborhoodLabel("al-shohda", "en")} · ${PRODUCT_NAME}`,
  "EN title is name · wain.lol",
);
assert(
  districtDescription("ghirnatah", "ar") ===
    `${copy.directoryHint.ar} · ${neighborhoodLabel("ghirnatah", "ar")}`,
  "AR description stays directoryHint + name",
);
assert(
  districtDescription("al-shohda", "en") ===
    `${copy.directoryHint.en} · ${neighborhoodLabel("al-shohda", "en")}`,
  "EN description stays directoryHint + name",
);

const sitemap = buildSitemapXml("2026-09-04");
for (const id of areas) {
  assert(
    sitemap.includes(`https://wain.lol${districtPath(id, "ar")}<`),
    `sitemap missing ${districtPath(id, "ar")}`,
  );
  assert(
    sitemap.includes(`https://wain.lol${districtPath(id, "en")}<`),
    `sitemap missing ${districtPath(id, "en")}`,
  );
}
assert(!sitemap.includes("/n/not-a-hood"), "sitemap must skip unknown slugs");
assert(!/Koofi/i.test(sitemap), "sitemap must not say Koofi");

console.log(`check-district-urls: ok (${areas.length} districts)`);
