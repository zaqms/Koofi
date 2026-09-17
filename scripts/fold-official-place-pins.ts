/**
 * Addition-only Scout pin fold. Soft Places parked.
 * Usage (when a pack lands): npx tsx scripts/fold-official-place-pins.ts path/to/pack.json
 * Does nothing without a pack file. Never invents lat/lng.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import catalogFile from "../data/catalog.json";
import {
  foldOfficialPlacePins,
  type OfficialPlacePinPackRow,
} from "../lib/fold-official-place-pins";
import type { CatalogFile } from "../lib/types";

const packPath = process.argv[2];
if (!packPath) {
  console.log(
    "fold-official-place-pins: waiting for a Scout pack. Pass the JSON path to fold addition-only pin.lat/lng.",
  );
  process.exit(0);
}

const catalog = catalogFile as CatalogFile;
const raw = JSON.parse(readFileSync(packPath, "utf8")) as unknown;
const pack = (Array.isArray(raw) ? raw : []) as OfficialPlacePinPackRow[];
const { shops, applied, skipped, rejected } = foldOfficialPlacePins(
  catalog.shops,
  pack,
);

if (applied.length === 0) {
  console.log("fold-official-place-pins: no addition-only pins applied", {
    packRows: pack.length,
    skipped: skipped.length,
    rejected: rejected.map((row) => `${row.id}:${row.reason}`),
  });
  process.exit(0);
}

const next: CatalogFile = { ...catalog, shops };
writeFileSync(
  join(process.cwd(), "data/catalog.json"),
  `${JSON.stringify(next, null, 2)}\n`,
);
console.log("fold-official-place-pins: applied", applied.length, {
  ids: applied.map((row) => row.id),
  skipped: skipped.length,
  rejected: rejected
    .filter((row) => row.reason !== "already-pinned")
    .map((row) => `${row.id}:${row.reason}`),
});
