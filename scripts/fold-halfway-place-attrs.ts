/**
 * Fold Places sit-down backfill, then Scout manual verdicts, onto
 * existing catalog shops. Scout wins. Never invents cafés. Soft Places parked.
 *
 * Usage: npx tsx scripts/fold-halfway-place-attrs.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import catalogFile from "../data/catalog.json";
import { foldHalfwayPlaceAndScoutAttrs } from "../lib/fold-halfway-place-attrs";
import type { CatalogFile } from "../lib/types";

const PLACES_PACK = join(process.cwd(), "data/places-attrs-2026-09-19.json");
const SCOUT_PACK = join(
  process.cwd(),
  "data/scout-manual-verdicts-2026-09-19.json",
);

const catalog = catalogFile as CatalogFile;
const placesRaw = JSON.parse(readFileSync(PLACES_PACK, "utf8")) as {
  shops?: unknown;
};
const scoutRaw = JSON.parse(readFileSync(SCOUT_PACK, "utf8")) as unknown;
const placeRows = Array.isArray(placesRaw.shops) ? placesRaw.shops : [];
const scoutRows = Array.isArray(scoutRaw) ? scoutRaw : [];

const { shops, applied, scoutApplied, unmatched, missing } =
  foldHalfwayPlaceAndScoutAttrs(
    catalog.shops,
    placeRows as { id: string }[],
    scoutRows as { id: string }[],
  );

if (unmatched.length > 0) {
  console.warn(
    "fold-halfway-place-attrs: ignored ids not in catalog",
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
  placeRows: placeRows.length,
  scoutRows: scoutRows.length,
  scoutApplied: scoutApplied.length,
  missing: missing.length,
  unmatched: unmatched.length,
});
