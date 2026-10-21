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

/**
 * Everyday words are not typos of a café. "dessert" is one edit from Essert
 * and "drops" is one edit from Crops; neither is a misspelled name.
 */
const COMMON_WORDS = new Set(
  [
    "dessert",
    "drops",
    "breakfast",
    "brunch",
    "family",
    "friendly",
    "view",
    "nearby",
    "please",
    "coffee",
    "cafe",
    "quiet",
    "study",
    "sweet",
    "cake",
    "food",
    "drink",
    "where",
    "something",
    "فطور",
    "عائلي",
    "اطلاله",
    "قريب",
    "كوفي",
    "وين",
    "حلو",
    "حلويات",
  ].map((word) => normalizeShopText(word)),
);

/**
 * Donut / dessert-led brands outside the listing policy (LISTING-POLICY §1)
 * that are not in the chain registry. They get the not-listed reply.
 */
const NOT_LISTED_DONUT_BRANDS = [
  {
    nameEn: "Krispy Kreme",
    nameAr: "كرسبي كريم",
    names: ["krispy kreme", "krispy creme", "krispy", "كرسبي كريم", "كريسبي كريم", "كرسبي", "كريسبي"],
  },
] as const;

function notListedDonutBrand(raw: string): { nameEn: string; nameAr: string } | null {
  const hay = normalizeShopText(raw);
  if (!hay) return null;
  for (const brand of NOT_LISTED_DONUT_BRANDS) {
    for (const name of brand.names) {
      const needle = normalizeShopText(name);
      if (!needle) continue;
      if (new RegExp(`(^|\\s)${escapeRegExp(needle)}(\\s|$)`, "u").test(hay)) {
        return { nameEn: brand.nameEn, nameAr: brand.nameAr };
      }
    }
  }
  return null;
}

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
  | { kind: "excluded"; nameEn: string; nameAr: string; donut?: boolean }
  | {
      kind: "listed";
      nameEn: string;
      nameAr: string;
      lookup: string;
      distance: number;
    }
  /** The whole ask is one or two edits from two different names. */
  | { kind: "ambiguous" };

type Attempt = { raw: string; norm: string; full: boolean; leadingAlef?: boolean };

function attemptsFor(raw: string): Attempt[] {
  const trimmed = raw.trim();
  const full = normalizeShopText(trimmed);
  const rows: Attempt[] = [];
  if (full) rows.push({ raw: trimmed, norm: full, full: true });
  const fullChars = Array.from(full);
  if (fullChars[0] === "ا" && fullChars.length >= 6) {
    rows.push({
      raw: trimmed,
      norm: fullChars.slice(1).join(""),
      full: true,
      leadingAlef: true,
    });
  }
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
 * Returns null when nothing is close enough. A whole-ask tie between two
 * different names is "ambiguous": a failed name lookup, not a three-pack.
 */
function sharesStart(left: string, right: string): boolean {
  const a = Array.from(left);
  const b = Array.from(right);
  return Boolean(a[0] && a[0] === b[0]);
}

function isCommonAsk(raw: string): boolean {
  const tokens = normalizeShopText(raw).split(" ").filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => COMMON_WORDS.has(token));
}

export function fuzzyNameHit(
  raw: string,
  shops: readonly Shop[],
): FuzzyNameHit | null {
  const attempts = attemptsFor(raw);
  if (attempts.length === 0) return null;

  const donut = notListedDonutBrand(raw);
  if (donut) return { kind: "excluded", ...donut, donut: true };

  const negated = negatedChainBrandIds(raw);
  const pool = candidatesFor(shops).filter(
    (candidate) => !candidate.brandId || !negated.has(candidate.brandId),
  );

  for (const attempt of attempts) {
    const exact = pool.find((candidate) => candidate.norm === attempt.norm);
    if (exact?.brandId && !exact.listed) {
      return { kind: "excluded", nameEn: exact.nameEn, nameAr: exact.nameAr };
    }
  }

  if (isCommonAsk(raw)) return null;

  type Scored = Candidate & { distance: number; attempt: Attempt };
  const ranked: Scored[] = [];

  for (const attempt of attempts) {
    const limit = maxEdits(Array.from(attempt.norm).length);
    if (limit <= 0) continue;
    for (const candidate of pool) {
      if (!attempt.leadingAlef && !sharesStart(attempt.norm, candidate.norm)) continue;
      const lengthGap = Math.abs(
        Array.from(attempt.norm).length - Array.from(candidate.norm).length,
      );
      if (lengthGap > limit) continue;
      let distance = damerauLevenshtein(attempt.norm, candidate.norm);
      if (attempt.leadingAlef && distance === 0) distance = 1;
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
  if (rival) return best.attempt.full ? { kind: "ambiguous" } : null;

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

/**
 * A name-looking ask that is no word at all: letters glued to digits
 * ("xyzcafe123") or a five-plus letter mash with no vowel ("xyzzyq").
 * Times ("24h", "7am") and everyday words are never this.
 */
export function isNonWordLookup(raw: string): boolean {
  const text = raw.trim().toLowerCase();
  if (!text || /\s/.test(text)) return false;
  if (!/^[a-z0-9]+$/.test(text)) return false;
  if (/^\d+(h|hr|hrs|hour|hours|am|pm|min|mins|k|km|m|sar|sr|riyal|riyals)$/.test(text)) {
    return false;
  }
  const letters = text.replace(/\d/g, "");
  if (/\d/.test(text)) return letters.length >= 3;
  return letters.length >= 5 && !/[aeiou]/.test(letters) && /[qxzj]/.test(letters);
}
