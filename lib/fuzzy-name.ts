import {
  CHAIN_BRANDS,
  chainBrandSearchAliases,
  isChainBrandId,
  type ChainBrandId,
} from "./chain-brands";
import { negatedChainBrandIds, normalizeShopText } from "./shop-name";
import type { Shop } from "./types";

/**
 * Misspellings only. Exact names stay on matchCatalogShops.
 * Short asks get one edit ("Dunkn"); longer asks get two ("Starbuks").
 * "drops" is two edits from "drip" and must not become a suggestion.
 */
const MIN_FUZZY_LENGTH = 5;

function maxEdits(length: number): number {
  if (length < MIN_FUZZY_LENGTH) return 0;
  if (length <= 7) return 1;
  return 2;
}

function codePoints(text: string): string[] {
  return Array.from(text);
}

/** Damerau–Levenshtein. One adjacent transposition counts as a single edit. */
export function damerauLevenshtein(aRaw: string, bRaw: string): number {
  const a = codePoints(aRaw);
  const b = codePoints(bRaw);
  const n = a.length;
  const m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;
  if (Math.abs(n - m) > 2 && Math.abs(n - m) > maxEdits(Math.max(n, m))) {
    return Math.abs(n - m);
  }

  const prev2 = new Array<number>(m + 1).fill(0);
  const prev1 = new Array<number>(m + 1).fill(0);
  const row = new Array<number>(m + 1).fill(0);
  for (let j = 0; j <= m; j += 1) prev1[j] = j;

  for (let i = 1; i <= n; i += 1) {
    row[0] = i;
    for (let j = 1; j <= m; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(prev1[j]! + 1, row[j - 1]! + 1, prev1[j - 1]! + cost);
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        best = Math.min(best, prev2[j - 2]! + 1);
      }
      row[j] = best;
    }
    for (let j = 0; j <= m; j += 1) {
      prev2[j] = prev1[j]!;
      prev1[j] = row[j]!;
    }
  }
  return prev1[m]!;
}

const GENERIC_NORMS = new Set(
  ["coffee", "cafe", "qahwa", "the", "قهوه", "كوفي", "كافيه"].map((token) =>
    normalizeShopText(token),
  ),
);

type Candidate = {
  norm: string;
  nameEn: string;
  nameAr: string;
  lookup: string;
  brandId: ChainBrandId | null;
  listed: boolean;
};

function listedBrandIds(shops: readonly Shop[]): Set<ChainBrandId> {
  const listed = new Set<ChainBrandId>();
  for (const shop of shops) {
    if (shop.chainBrand && isChainBrandId(shop.chainBrand)) {
      listed.add(shop.chainBrand);
    }
  }
  return listed;
}

function candidatesFor(shops: readonly Shop[]): Candidate[] {
  const listed = listedBrandIds(shops);
  const seen = new Set<string>();
  const rows: Candidate[] = [];

  const push = (row: Candidate) => {
    if (!row.norm || row.norm.length < 4 || GENERIC_NORMS.has(row.norm)) return;
    const key = `${row.brandId ?? ""}:${row.listed ? "1" : "0"}:${row.norm}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  };

  for (const id of Object.keys(CHAIN_BRANDS)) {
    if (!isChainBrandId(id)) continue;
    const brand = CHAIN_BRANDS[id];
    for (const alias of chainBrandSearchAliases(id)) {
      push({
        norm: normalizeShopText(alias),
        nameEn: brand.nameEn,
        nameAr: brand.nameAr,
        lookup: brand.nameEn,
        brandId: id,
        listed: listed.has(id),
      });
    }
  }

  for (const shop of shops) {
    for (const raw of [shop.nameEn, shop.nameAr]) {
      push({
        norm: normalizeShopText(raw),
        nameEn: shop.nameEn,
        nameAr: shop.nameAr,
        lookup: shop.nameEn,
        brandId:
          shop.chainBrand && isChainBrandId(shop.chainBrand)
            ? shop.chainBrand
            : null,
        listed: true,
      });
    }
  }

  return rows;
}

export type FuzzyNameHit =
  | { kind: "excluded"; nameEn: string; nameAr: string }
  | {
      kind: "listed";
      nameEn: string;
      nameAr: string;
      lookup: string;
      distance: number;
    };

type Attempt = { raw: string; norm: string; full: boolean };

function attemptsFor(raw: string): Attempt[] {
  const trimmed = raw.trim();
  const full = normalizeShopText(trimmed);
  const rows: Attempt[] = [];
  if (full) rows.push({ raw: trimmed, norm: full, full: true });
  for (const token of trimmed.split(/\s+/)) {
    const norm = normalizeShopText(token);
    if (!norm || norm === full) continue;
    rows.push({ raw: token, norm, full: false });
  }
  return rows;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Closest catalog or excluded-brand name for a misspelling.
 * Returns null when nothing is close enough, or when two different names tie.
 */
export function fuzzyNameHit(
  raw: string,
  shops: readonly Shop[],
): FuzzyNameHit | null {
  const attempts = attemptsFor(raw).filter(
    (attempt) => maxEdits(Array.from(attempt.norm).length) > 0,
  );
  if (attempts.length === 0) return null;

  const negated = negatedChainBrandIds(raw);
  const pool = candidatesFor(shops).filter(
    (candidate) => !candidate.brandId || !negated.has(candidate.brandId),
  );

  type Scored = Candidate & { distance: number; attempt: Attempt };
  const ranked: Scored[] = [];

  for (const attempt of attempts) {
    const limit = maxEdits(Array.from(attempt.norm).length);
    if (limit <= 0) continue;
    for (const candidate of pool) {
      const lengthGap = Math.abs(
        Array.from(attempt.norm).length - Array.from(candidate.norm).length,
      );
      if (lengthGap > limit) continue;
      const distance = damerauLevenshtein(attempt.norm, candidate.norm);
      if (distance > limit) continue;
      ranked.push({ ...candidate, distance, attempt });
    }
  }

  ranked.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    // The brand itself beats one branch that shares its name.
    const aBrand = a.brandId && a.lookup === a.nameEn ? 0 : 1;
    const bBrand = b.brandId && b.lookup === b.nameEn ? 0 : 1;
    if (aBrand !== bBrand) return aBrand - bBrand;
    return b.norm.length - a.norm.length;
  });

  const best = ranked[0];
  if (!best) return null;
  const rival = ranked.find(
    (row) =>
      row.distance === best.distance &&
      row.nameEn !== best.nameEn &&
      row.brandId !== best.brandId,
  );
  if (rival) return null;

  if (best.brandId && !best.listed) {
    return { kind: "excluded", nameEn: best.nameEn, nameAr: best.nameAr };
  }

  const lookup = best.attempt.full
    ? best.lookup
    : best.attempt.raw.length > 0
      ? raw.replace(
          new RegExp(escapeRegExp(best.attempt.raw), "i"),
          best.lookup,
        )
      : best.lookup;

  return {
    kind: "listed",
    nameEn: best.nameEn,
    nameAr: best.nameAr,
    lookup: lookup.trim() || best.lookup,
    distance: best.distance,
  };
}
