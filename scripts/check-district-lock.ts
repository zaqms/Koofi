/**
 * Shoug EN+AR district lock — 21 Sep 2026.
 * HOLD until Amjad says Yalla. Soft Places stays parked.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listNeighborhoodRows } from "../lib/browse-neighborhoods";
import { listBrowseDirectoryShops, listRealShops } from "../lib/catalog";
import {
  listLiveCatalogDistrictIds,
  listLiveDistrictIds,
} from "../lib/district-dictionary";
import {
  DISTRICT_LOCK_DATE,
  lockedDistrictRows,
  lockedEnRenames,
  lockedNameEnForProductId,
  productIdForLockedId,
} from "../lib/district-lock";
import { NEIGHBORHOODS, neighborhoodLabel } from "../lib/neighborhoods";
import { districtPath } from "../lib/product";
import { listSitemapLocs } from "../lib/sitemap-xml";
import type { NeighborhoodId } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function readRepo(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

assert(DISTRICT_LOCK_DATE === "2026-09-21", "lock date");

const rows = lockedDistrictRows();
assert(rows.length === 130, `expected 130 locked rows, got ${rows.length}`);
assert(
  rows.filter((row) => row.status === "live").length === 47,
  "sheet live count stays 47",
);
assert(
  rows.filter((row) => row.status === "dictionary_only").length === 83,
  "sheet dictionary_only count stays 83",
);

const industrial = rows.find((row) => row.stableId === "al-industrial-new");
assert(industrial, "al-industrial-new is in the lock");
assert(industrial.seoSlug === "al-industrial-new", "industrial slug is fixed");
assert(
  !rows.some((row) => row.stableId === "al-ndustrial-new" || row.seoSlug === "al-ndustrial-new"),
  "typo slug al-ndustrial-new is gone from the lock",
);
assert(
  !readRepo("lib/types.ts").includes("al-ndustrial-new") &&
    !readRepo("lib/neighborhoods.ts").includes("al-ndustrial-new") &&
    !readRepo("data/catalog.json").includes("al-ndustrial-new"),
  "typo slug al-ndustrial-new is not in product",
);

const sharqi = rows.find((row) => row.stableId === "an-nasim-ash-sharqi");
const gharbi = rows.find((row) => row.stableId === "an-nasim-al-gharbi");
assert(sharqi?.nameEn === "An Nasim Ash Sharqi", "Naseem East EN");
assert(sharqi?.nameAr === "النسيم الشرقي", "Naseem East AR");
assert(gharbi?.nameEn === "An Nasim Al Gharbi", "Naseem West EN");
assert(gharbi?.nameAr === "النسيم الغربي", "Naseem West AR");
assert(NEIGHBORHOODS["an-nasim-ash-sharqi"], "Naseem East is in the dictionary");
assert(NEIGHBORHOODS["an-nasim-al-gharbi"], "Naseem West is in the dictionary");
assert(
  neighborhoodLabel("an-nasim-ash-sharqi", "en") === "An Nasim Ash Sharqi",
  "product EN An Nasim Ash Sharqi",
);
assert(
  neighborhoodLabel("an-nasim-al-gharbi", "en") === "An Nasim Al Gharbi",
  "product EN An Nasim Al Gharbi",
);
assert(
  neighborhoodLabel("an-nasim-ash-sharqi", "ar") === "النسيم الشرقي",
  "product AR النسيم الشرقي",
);
assert(
  neighborhoodLabel("an-nasim-al-gharbi", "ar") === "النسيم الغربي",
  "product AR النسيم الغربي",
);

const naseemEastShops = listRealShops().filter(
  (shop) => shop.neighborhood === "an-nasim-ash-sharqi",
);
const naseemWestShops = listRealShops().filter(
  (shop) => shop.neighborhood === "an-nasim-al-gharbi",
);
assert(naseemEastShops.length >= 7, "Naseem East keeps #187 shops");
assert(naseemWestShops.length >= 3, "Naseem West keeps #187 shops");

const renames = lockedEnRenames();
assert(renames.sulimaniyah === "As Sulimaniyah", "Sulimaniyah lock is As Sulimaniyah");
assert(neighborhoodLabel("sulimaniyah", "en") === "As Sulimaniyah", "product Sulimaniyah EN");
assert(neighborhoodLabel("olaya", "en") === "Al Olaya", "product Olaya EN");
assert(neighborhoodLabel("al-nakheel", "en") === "An Nakheel", "product Nakheel EN");
assert(neighborhoodLabel("al-narjis", "en") === "An Narjis", "product Narjis EN");
assert(neighborhoodLabel("al-ghadeer", "en") === "Al Ghadir", "product Ghadir EN");
assert(neighborhoodLabel("al-yarmouk", "en") === "Al Yarmuk", "product Yarmuk EN");
assert(neighborhoodLabel("al-shohda", "en") === "Ash Shuhada", "product Shuhada EN");
assert(
  neighborhoodLabel("king-fahd", "en") === "King Fahd District",
  "product King Fahd District EN",
);

for (const [id, name] of Object.entries(renames)) {
  const productId = id as NeighborhoodId;
  assert(
    neighborhoodLabel(productId, "en") === name,
    `${id} EN display is ${name}, got ${neighborhoodLabel(productId, "en")}`,
  );
}

for (const row of rows) {
  const productId = productIdForLockedId(row.stableId);
  if (!productId) continue;
  const expected = lockedNameEnForProductId(productId);
  if (!expected) continue;
  assert(
    neighborhoodLabel(productId, "en") === expected,
    `${productId} EN must match locked ${expected}`,
  );
  assert(
    neighborhoodLabel(productId, "ar") === row.nameAr,
    `${productId} AR must match locked ${row.nameAr}`,
  );
}

const liveCatalog = listLiveCatalogDistrictIds();
assert(liveCatalog.length === 66, `expected 66 live catalog districts, got ${liveCatalog.length}`);
assert(!liveCatalog.includes("as-suwaidi"), "as-suwaidi has 0 shops");
assert(listLiveDistrictIds().every((id) => liveCatalog.includes(id)), "specialty live ⊆ catalog live");

const browse = listNeighborhoodRows("en", listBrowseDirectoryShops());
assert(
  browse.every((row) => row.cafeCount > 0),
  "browse has no 0-shop destinations",
);
assert(
  browse.length === liveCatalog.length,
  "browse rows match live catalog districts",
);
assert(
  !browse.some((row) => row.id === "as-suwaidi"),
  "As Suwaidi stays out of the neighborhood index",
);

const sitemap = listSitemapLocs().join("\n");
for (const id of liveCatalog) {
  assert(
    sitemap.includes(`https://wain.lol${districtPath(id, "ar")}`),
    `sitemap missing ${id} AR`,
  );
  assert(
    sitemap.includes(`https://wain.lol${districtPath(id, "en")}`),
    `sitemap missing ${id} EN`,
  );
}
assert(
  !sitemap.includes("/coffee-shops/as-suwaidi") &&
    !sitemap.includes("/en/coffee-shops/as-suwaidi"),
  "sitemap excludes 0-shop as-suwaidi",
);
assert(
  !sitemap.includes("al-ndustrial-new") && !sitemap.includes("al-industrial-new"),
  "sitemap does not invent industrial-new as a live destination",
);
assert(!sitemap.includes("soft-places"), "Soft Places stays parked in sitemap");

const izdihar = rows.find((row) => row.stableId === "al-izdihar");
assert(izdihar?.status === "dictionary_only", "Izdihar stays dictionary_only");
assert(!liveCatalog.includes("al-izdihar" as NeighborhoodId), "do not invent Izdihar shops");

assert(
  !readRepo("lib/browse-neighborhoods.ts").includes("BROWSE_EN_LABELS"),
  "browse EN comes from the locked dictionary, not a label overlay",
);
assert(
  !readRepo("components/district-page.tsx").includes("ثلاث الليلة") &&
    !readRepo("components/home-landing.tsx").includes("Soft Places"),
  "Soft Places stays parked",
);

const changed: string[] = [];
for (const [id, name] of Object.entries(renames)) {
  changed.push(`${id}: ${name}`);
}
console.log(
  `check-district-lock: ok (${rows.length} locked, ${liveCatalog.length} live catalog, ${browse.length} browse rows)`,
);
console.log(`EN renames applied: ${changed.join("; ")}`);
