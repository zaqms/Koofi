import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isNeighborhoodId } from "./neighborhoods";
import type { NeighborhoodId } from "./types";

/**
 * Shoug EN+AR sheet locked 21 Sep 2026. Names live in the registry;
 * live discovery still requires real catalog shops — same idea as
 * city Coming soon (#169). Do not invent shops for dictionary_only rows.
 */
export const DISTRICT_LOCK_DATE = "2026-09-21" as const;
export const DISTRICT_LOCK_SOURCE = "shoug_locked_2026-09-21" as const;

export const DISTRICT_LOCK_STATUS = ["live", "dictionary_only"] as const;
export type DistrictLockStatus = (typeof DISTRICT_LOCK_STATUS)[number];

export type LockedDistrictRow = {
  stableId: string;
  nameEn: string;
  nameAr: string;
  cityId: string;
  seoSlug: string;
  shopCountLive: number;
  enSource: string;
  status: DistrictLockStatus;
  notes: string;
};

const TSV_PATH = join(process.cwd(), "data/districts-en-ar-bulk.tsv");
const RENAMES_PATH = join(process.cwd(), "data/en-renames-2026-09-21.json");

let cachedRows: LockedDistrictRow[] | null = null;
let cachedRenames: Record<string, string> | null = null;

function parseTsv(): LockedDistrictRow[] {
  if (cachedRows) return cachedRows;
  const raw = readFileSync(TSV_PATH, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
  const header = lines.shift();
  if (
    header !==
    "stable_id\tname_en\tname_ar\tcity_id\tseo_slug\tshop_count_live\ten_source\tstatus\tnotes"
  ) {
    throw new Error("district lock TSV header mismatch");
  }
  cachedRows = lines.map((line) => {
    const [
      stableId,
      nameEn,
      nameAr,
      cityId,
      seoSlug,
      shopCountLive,
      enSource,
      status,
      notes,
    ] = line.split("\t");
    if (!stableId || !nameEn || !nameAr || !seoSlug) {
      throw new Error(`district lock row missing fields: ${line}`);
    }
    if (status !== "live" && status !== "dictionary_only") {
      throw new Error(`district lock ${stableId} has status ${status}`);
    }
    return {
      stableId,
      nameEn,
      nameAr,
      cityId: cityId ?? "riyadh",
      seoSlug,
      shopCountLive: shopCountLive ? Number(shopCountLive) : 0,
      enSource: enSource ?? "",
      status,
      notes: notes ?? "",
    };
  });
  return cachedRows;
}

export function lockedDistrictRows(): LockedDistrictRow[] {
  return parseTsv();
}

export function lockedEnRenames(): Record<string, string> {
  if (cachedRenames) return cachedRenames;
  cachedRenames = JSON.parse(readFileSync(RENAMES_PATH, "utf8")) as Record<
    string,
    string
  >;
  return cachedRenames;
}

/**
 * Product ids that already exist keep their slug even when the sheet
 * spelling differs (al-janadriyyah / manfuha). Do not break URLs.
 */
const LOCK_ID_TO_PRODUCT: Record<string, NeighborhoodId> = {
  "al-janadriyah": "al-janadriyyah",
  manfuhah: "manfuha",
};

export function productIdForLockedId(stableId: string): NeighborhoodId | null {
  const mapped = LOCK_ID_TO_PRODUCT[stableId];
  if (mapped) return mapped;
  return isNeighborhoodId(stableId) ? stableId : null;
}

export function lockedNameEnForProductId(id: NeighborhoodId): string | null {
  const rows = lockedDistrictRows();
  const direct = rows.find((row) => productIdForLockedId(row.stableId) === id);
  return direct?.nameEn ?? null;
}
