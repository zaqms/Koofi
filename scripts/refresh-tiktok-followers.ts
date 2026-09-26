import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import catalogFile from "../data/catalog.json";
import {
  neutralBonusFromRows,
  tiktokFollowerMapErrors,
  type TikTokFollowerRow,
  type TikTokStatus,
} from "../lib/tiktok-popularity";
import type { CatalogFile } from "../lib/types";

/**
 * Rewrite data/tiktok-followers.json from a scout export.
 *
 * Manual, or about monthly. No scraping and no network calls — pass a local
 * JSON array or CSV the data scout already produced (same columns:
 * shop_id, tiktok_handle, tiktok_url, followers, date_checked, verified_how,
 * evidence, status, shared_brand_account).
 *
 *   npm run refresh-tiktok-followers -- path/to/tiktok-followers.json
 *   npm run refresh-tiktok-followers -- path/to/tiktok-followers.csv
 *
 * Checks every shop id against the catalog, requires followers on found
 * rows, and rejects followers on none / unverified. Does not edit
 * catalog.json or popularity-index.json. The neutral bonus (median across
 * unique found handles) is computed at load, not stored here.
 */

const OUT = resolve(process.cwd(), "data/tiktok-followers.json");

type ScoutRow = {
  shop_id?: unknown;
  tiktok_handle?: unknown;
  followers?: unknown;
  date_checked?: unknown;
  status?: unknown;
  shared_brand_account?: unknown;
};

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function parseCsv(text: string): Record<string, string>[] {
  const source = text.replace(/^\uFEFF/, "");
  const table: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i] ?? "";
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.length > 0)) table.push(row);
      row = [];
      continue;
    }
    field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.length > 0)) table.push(row);
  }

  const [header, ...body] = table;
  if (!header) fail("CSV has no header");
  return body.map((cells) => {
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key.trim()] = cells[index] ?? "";
    });
    return record;
  });
}

function emptyToNull(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "null") return null;
  return trimmed;
}

function asFollowers(value: unknown, shopId: string): number | null {
  const raw = emptyToNull(value);
  if (raw == null) return null;
  const numeric = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(numeric) || numeric < 0) {
    fail(`${shopId}: followers must be a non-negative integer or empty`);
  }
  return numeric;
}

function asBoolean(value: unknown, shopId: string): boolean {
  const raw = emptyToNull(value);
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") {
    const lower = raw.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }
  fail(`${shopId}: shared_brand_account must be true or false`);
}

function asStatus(value: unknown, shopId: string): TikTokStatus {
  const raw = emptyToNull(value);
  if (raw === "found" || raw === "none" || raw === "unverified") return raw;
  fail(`${shopId}: status must be found, none, or unverified`);
}

function asHandle(value: unknown): string | null {
  const raw = emptyToNull(value);
  if (raw == null) return null;
  if (typeof raw !== "string") return null;
  return raw;
}

function scoutRowsFromFile(path: string): ScoutRow[] {
  const text = readFileSync(path, "utf8");
  if (path.toLowerCase().endsWith(".csv")) {
    return parseCsv(text);
  }
  const parsed: unknown = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    fail("JSON export must be an array of scout rows");
  }
  return parsed as ScoutRow[];
}

function toStoredRow(raw: ScoutRow): { shopId: string; row: TikTokFollowerRow } {
  const shopId = typeof raw.shop_id === "string" ? raw.shop_id.trim() : "";
  if (!shopId) fail("scout row is missing shop_id");
  const status = asStatus(raw.status, shopId);
  const followers = asFollowers(raw.followers, shopId);
  const dateRaw = emptyToNull(raw.date_checked);
  const dateChecked = typeof dateRaw === "string" ? dateRaw : "";
  return {
    shopId,
    row: {
      handle: asHandle(raw.tiktok_handle),
      followers,
      status,
      dateChecked,
      sharedBrandAccount: asBoolean(raw.shared_brand_account, shopId),
    },
  };
}

const exportPath = process.argv[2];
if (!exportPath) {
  fail(
    "usage: npm run refresh-tiktok-followers -- path/to/tiktok-followers.json",
  );
}

const catalog = catalogFile as CatalogFile;
const knownShopIds = new Set(catalog.shops.map((shop) => shop.id));
const stored: Record<string, TikTokFollowerRow> = {};
const seen = new Set<string>();

for (const raw of scoutRowsFromFile(resolve(exportPath))) {
  const { shopId, row } = toStoredRow(raw);
  if (seen.has(shopId)) fail(`${shopId}: duplicate shop id`);
  seen.add(shopId);
  stored[shopId] = row;
}

const errors = tiktokFollowerMapErrors(stored, knownShopIds, {
  requireComplete: true,
});
if (errors.length > 0) {
  const shown = errors.slice(0, 12);
  const extra = errors.length - shown.length;
  fail(
    [...shown, extra > 0 ? `… and ${extra} more` : ""]
      .filter((line) => line.length > 0)
      .join("\n"),
  );
}

const ordered: Record<string, TikTokFollowerRow> = {};
for (const shopId of Object.keys(stored).sort((a, b) => a.localeCompare(b))) {
  const row = stored[shopId];
  if (!row) continue;
  ordered[shopId] = row;
}

writeFileSync(OUT, `${JSON.stringify(ordered, null, 2)}\n`, "utf8");

const found = Object.values(ordered).filter((row) => row.status === "found").length;
const accounts = new Set(
  Object.values(ordered)
    .filter((row) => row.status === "found" && row.handle)
    .map((row) => row.handle!.trim().replace(/^@+/, "").toLowerCase()),
).size;
const neutral = neutralBonusFromRows(ordered);
console.log(
  `refresh-tiktok-followers: wrote data/tiktok-followers.json (${Object.keys(ordered).length} shops, ${found} found, ${accounts} accounts, neutral bonus ${neutral})`,
);
