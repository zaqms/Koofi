/**
 * Fold the 19 Sep 2026 Places sit-down backfill onto existing catalog shops.
 * Never invents cafés. Soft Places parked.
 *
 * Usage: npx tsx scripts/fold-halfway-place-attrs.ts [path/to/backfill.json]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import catalogFile from "../data/catalog.json";
import { foldHalfwayPlaceAttrs } from "../lib/fold-halfway-place-attrs";
import type { CatalogFile } from "../lib/types";

const DEFAULT_PACK = join(
  process.cwd(),
  "data/places-attrs-2026-09-19.json",
);

const packPath = process.argv[2] ?? DEFAULT_PACK;
const catalog = catalogFile as CatalogFile;
const raw = JSON.parse(readFileSync(packPath, "utf8")) as {
  shops?: unknown;
};
const rows = Array.isArray(raw.shops) ? raw.shops : [];
const { shops, applied, unmatched, missing } = foldHalfwayPlaceAttrs(
  catalog.shops,
  rows as { id: string }[],
);

if (unmatched.length > 0) {
  console.warn(
    "fold-halfway-place-attrs: ignored backfill ids not in catalog",
    unmatched,
  );
}

const next: CatalogFile = { ...catalog, shops };
writeFileSync(
  join(process.cwd(), "data/catalog.json"),
  `${JSON.stringify(next, null, 2)}\n`,
);

console.log("fold-halfway-place-attrs: applied", applied.length, {
  catalog: shops.length,
  packRows: rows.length,
  missing: missing.length,
  unmatched: unmatched.length,
});
