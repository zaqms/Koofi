/**
 * Bake Places hours + heroes batch 4 (50 shops after PRs #178–#180).
 * Soft Places stays parked — catalog + public/cafe-heroes only.
 * Does not invent hours. Does not overwrite batch 1–3 heroes.
 *
 * Reads:
 *   - catalog-hours-patch.json (48 shops)
 *   - catalog-heroes-manifest.json (50 shops)
 *   - photos/{id}/1..4.*
 * Writes:
 *   - data/catalog.json openingHours for those 48 ids only
 *   - public/cafe-heroes/{id}/ from photos on disk
 *   - data/cafe-heroes.json merged (batch 1–3 kept, batch 4 upserted)
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MISSING_HOURS = new Set([
  "the-it-al-rawabi",
  "maqha-mahamasa-al-raqban",
]);

function firstExisting(paths) {
  return paths.find((path) => existsSync(path));
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function point(value) {
  if (!value || typeof value !== "object") return null;
  const day = Number(value.day);
  const hour = Number(value.hour);
  const minute = Number(value.minute);
  if (![day, hour, minute].every(Number.isInteger)) return null;
  if (day < 0 || day > 6 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return { day, hour, minute };
}

function cleanOpeningHours(raw) {
  if (!raw || typeof raw !== "object") return null;
  const weekdayDescriptions = Array.isArray(raw.weekdayDescriptions)
    ? raw.weekdayDescriptions.filter((row) => typeof row === "string")
    : [];
  const periods = [];
  for (const row of Array.isArray(raw.periods) ? raw.periods : []) {
    const open = point(row?.open);
    if (!open) continue;
    const period = { open };
    if (row && "close" in row) {
      const close = point(row.close);
      if (!close) continue;
      period.close = close;
    }
    periods.push(period);
  }
  if (periods.length === 0) return null;
  return weekdayDescriptions.length > 0
    ? { weekdayDescriptions, periods }
    : { periods };
}

function withOpeningHours(shop, openingHours) {
  const next = {};
  let inserted = false;
  for (const [key, value] of Object.entries(shop)) {
    if (key === "example" && !inserted) {
      next.openingHours = openingHours;
      inserted = true;
    }
    if (key === "openingHours") continue;
    next[key] = value;
  }
  if (!inserted) next.openingHours = openingHours;
  return next;
}

function photoIndex(name) {
  const match = /^([1-4])\.(jpe?g|png|webp)$/i.exec(name);
  return match ? Number(match[1]) : 0;
}

const resultsPath = firstExisting([
  join(root, "wain-places-fill-batch4/results.json"),
  "/home/ubuntu/.cursor/projects/workspace/uploads/results_981a.json",
]);
const hoursPatchPath = firstExisting([
  join(root, "wain-places-fill-batch4/catalog-hours-patch.json"),
  "/home/ubuntu/.cursor/projects/workspace/uploads/catalog-hours-patch_7bfa.json",
]);
const heroesManifestPath = firstExisting([
  join(root, "wain-places-fill-batch4/catalog-heroes-manifest.json"),
  "/home/ubuntu/.cursor/projects/workspace/uploads/catalog-heroes-manifest_f938.json",
]);
const photosRoot = firstExisting([
  join(root, "wain-places-fill-batch4/photos"),
  join(root, "photos"),
]);

if (!resultsPath || !hoursPatchPath || !heroesManifestPath) {
  throw new Error("results, hours patch, or heroes manifest not found");
}

const results = readJson(resultsPath);
const hoursPatch = readJson(hoursPatchPath);
const heroesManifest = readJson(heroesManifestPath);
const resultIds = Array.isArray(results?.places)
  ? results.places.map((row) => row.id)
  : [];

if (resultIds.length !== 50) {
  throw new Error(`results must list 50 shops, got ${resultIds.length}`);
}
if (!Array.isArray(hoursPatch) || hoursPatch.length !== 48) {
  throw new Error(`hours patch must be 48 shops, got ${hoursPatch?.length}`);
}
if (!Array.isArray(heroesManifest) || heroesManifest.length !== 50) {
  throw new Error(`heroes manifest must be 50 shops, got ${heroesManifest?.length}`);
}

const allowedIds = new Set(resultIds);
if (allowedIds.size !== 50) throw new Error("batch-4 ids must be unique");
for (const id of MISSING_HOURS) {
  if (!allowedIds.has(id)) throw new Error(`missing-hours id ${id} is outside batch 4`);
}

const catalogPath = join(root, "data/catalog.json");
const catalog = readJson(catalogPath);
const byId = new Map(catalog.shops.map((shop) => [shop.id, shop]));

const hoursById = new Map();
for (const row of hoursPatch) {
  if (!allowedIds.has(row.id)) {
    throw new Error(`hours patch id ${row.id} is outside the batch-4 set`);
  }
  if (MISSING_HOURS.has(row.id)) {
    throw new Error(`${row.id} must not receive invented hours`);
  }
  if (!byId.has(row.id)) throw new Error(`hours patch shop missing from catalog: ${row.id}`);
  const openingHours = cleanOpeningHours(row.openingHours);
  if (!openingHours) throw new Error(`${row.id} has no usable periods`);
  hoursById.set(row.id, openingHours);
}

if (hoursById.size !== 48) throw new Error("expected 48 baked hour shops");

catalog.shops = catalog.shops.map((shop) => {
  if (!allowedIds.has(shop.id)) return shop;
  if (!hoursById.has(shop.id)) {
    if (!("openingHours" in shop)) return shop;
    const { openingHours: _drop, ...rest } = shop;
    return rest;
  }
  return withOpeningHours(shop, hoursById.get(shop.id));
});

writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

const heroesPath = join(root, "data/cafe-heroes.json");
const heroesOut = existsSync(heroesPath) ? readJson(heroesPath) : {};
if (!heroesOut || typeof heroesOut !== "object" || Array.isArray(heroesOut)) {
  throw new Error("data/cafe-heroes.json must be a shop-id map");
}

const heroIds = new Set();
for (const row of heroesManifest) {
  if (!allowedIds.has(row.id)) {
    throw new Error(`heroes manifest id ${row.id} is outside the batch-4 set`);
  }
  if (heroIds.has(row.id)) throw new Error(`duplicate heroes manifest id ${row.id}`);
  heroIds.add(row.id);
}
if (heroIds.size !== 50) throw new Error("expected 50 unique hero shops");

let copiedSets = 0;
if (photosRoot) {
  for (const row of heroesManifest) {
    const srcDir = join(photosRoot, row.id);
    if (!existsSync(srcDir)) continue;
    const destDir = join(root, "public/cafe-heroes", row.id);
    mkdirSync(destDir, { recursive: true });
    const files = readdirSync(srcDir)
      .filter((name) => photoIndex(name))
      .sort((a, b) => photoIndex(a) - photoIndex(b));
    const photos = [];
    for (const name of files.slice(0, 4)) {
      const destName = name.replace(/\.(jpeg)$/i, ".jpg");
      copyFileSync(join(srcDir, name), join(destDir, destName));
      const attr = row.attributions?.[photoIndex(destName) - 1];
      const photo = { src: `/cafe-heroes/${row.id}/${destName}` };
      const displayName =
        typeof attr?.displayName === "string" ? attr.displayName.trim() : "";
      const uri = typeof attr?.uri === "string" ? attr.uri.trim() : "";
      if (displayName) {
        photo.attribution = uri ? { displayName, uri } : { displayName };
      }
      photos.push(photo);
    }
    if (photos.length) {
      heroesOut[row.id] = photos;
      copiedSets += 1;
    }
  }
}

writeFileSync(heroesPath, `${JSON.stringify(heroesOut, null, 2)}\n`);

const bakedHours = catalog.shops.filter(
  (shop) => allowedIds.has(shop.id) && shop.openingHours?.periods?.length,
).length;
const hiddenHours = [...MISSING_HOURS].filter((id) => {
  const shop = catalog.shops.find((row) => row.id === id);
  return shop && !shop.openingHours;
});
console.log(
  `bake-places-batch4: ${bakedHours} batch-4 shops with openingHours, ${hiddenHours.length} Status-hidden, ${copiedSets} hero sets copied, ${Object.keys(heroesOut).length} hero shops total`,
);
