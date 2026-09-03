import { NEIGHBORHOODS } from "./neighborhoods";
import { shopBrandKey } from "./shop-brand";
import type { Shop } from "./types";

/**
 * Catalog name match for a typed ask. Vibe / حي parsing stays in parse-intent.
 * Only real catalog shops. Never invent a listing.
 */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/(^|\s)ال(?=\p{L})/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesAlias(haystack: string, alias: string): boolean {
  if (!alias) return false;
  const pattern = new RegExp(`(^|\\s)${escapeRegExp(alias)}(\\s|$)`, "u");
  return pattern.test(haystack);
}

const GENERIC_ALIASES = new Set(
  [
    "the",
    "a",
    "an",
    "and",
    "و",
    "of",
    "at",
    "in",
    "for",
    "to",
    "by",
    "just",
    "al",
    "el",
    "cafe",
    "café",
    "caffe",
    "caffé",
    "coffee",
    "qahwa",
    "roaster",
    "roastery",
    "roasters",
    "roastry",
    "specialty",
    "speciality",
    "bar",
    "house",
    "factory",
    "downtown",
    "lab",
    "co",
    "company",
    "riyadh",
    "digital",
    "city",
    "boulevard",
    "promenade",
    "sport",
    "estate",
    "plus",
    "one",
    "two",
    "first",
    "good",
    "new",
    "get",
    "up",
    "best",
    "قهوه",
    "قهاوي",
    "مقهى",
    "محمصه",
    "محامص",
    "كافيه",
    "كافي",
    "مختصه",
    "بن",
    "فنجان",
  ].map((token) => normalize(token)).filter(Boolean),
);

const NEIGHBORHOOD_ALIASES = new Set(
  Object.values(NEIGHBORHOODS)
    .flatMap((place) => [place.id, place.en, place.ar, ...place.aliases])
    .map((alias) => normalize(alias))
    .filter(Boolean),
);

function isBlockedAlias(alias: string): boolean {
  if (!alias) return true;
  if (GENERIC_ALIASES.has(alias)) return true;
  if (NEIGHBORHOOD_ALIASES.has(alias)) return true;
  return false;
}

function tokens(text: string): string[] {
  return text.split(/[\s-]+/).filter(Boolean);
}

function distinctiveTokens(text: string): string[] {
  return tokens(text).filter((token) => !isBlockedAlias(token));
}

function stripNeighborhoodSuffix(id: string, neighborhood: string): string {
  const suffix = `-${neighborhood}`;
  return id.endsWith(suffix) ? id.slice(0, -suffix.length) : id;
}

function possessiveBases(name: string): string[] {
  return [...name.matchAll(/[\p{L}\p{N}]+(?=['’]s\b)/giu)].map((match) =>
    normalize(match[0] ?? ""),
  );
}

/** Extra short names that the generator cannot see from the listing row. */
const EXTRA_ALIASES: Record<string, readonly string[]> = {
  "percent-arabica-hittin": ["percent", "arabica", "%", "ارابيكا"],
  "btw-olaya": ["btw"],
  "one-gram-sulimaniyah": ["one gram"],
};

function addAlias(into: Set<string>, raw: string): void {
  const alias = normalize(raw);
  if (!alias || isBlockedAlias(alias)) return;
  if (tokens(alias).every((token) => isBlockedAlias(token))) return;
  into.add(alias);
}

export function shopNameAliases(
  shop: Pick<Shop, "id" | "nameEn" | "nameAr" | "neighborhood">,
): string[] {
  const aliases = new Set<string>();

  addAlias(aliases, shop.nameEn);
  addAlias(aliases, shop.nameAr);
  addAlias(aliases, shop.id.replace(/-/g, " "));
  addAlias(aliases, stripNeighborhoodSuffix(shop.id, shop.neighborhood).replace(/-/g, " "));
  addAlias(aliases, shopBrandKey(shop).replace(/-/g, " "));

  for (const base of possessiveBases(shop.nameEn)) addAlias(aliases, base);

  const english = distinctiveTokens(normalize(shop.nameEn));
  for (const token of english) addAlias(aliases, token);
  if (english.length >= 2) addAlias(aliases, english.slice(0, 2).join(" "));
  if (english.length) addAlias(aliases, english.join(" "));

  const arabic = distinctiveTokens(normalize(shop.nameAr));
  for (const token of arabic) addAlias(aliases, token);
  if (arabic.length >= 2) addAlias(aliases, arabic.slice(0, 2).join(" "));
  if (arabic.length) addAlias(aliases, arabic.join(" "));

  for (const extra of EXTRA_ALIASES[shop.id] ?? []) addAlias(aliases, extra);

  return [...aliases];
}

function aliasScore(
  haystack: string,
  alias: string,
  shop: Pick<Shop, "nameEn" | "nameAr" | "id">,
): number {
  let score = alias.length;
  if (haystack === alias) score += 80;
  if (normalize(shop.nameEn) === alias || normalize(shop.nameAr) === alias) {
    score += 40;
  }
  if (normalize(shop.id.replace(/-/g, " ")) === alias) score += 20;
  return score;
}

/**
 * Whole-ask short names like "wee" / "aim" / "ik" match.
 * Inside a longer ask, require 3+ characters so "in" / "up" stay vibe/area.
 */
function aliasUsableInAsk(haystack: string, alias: string): boolean {
  if (haystack === alias) return true;
  if (alias.includes(" ")) return true;
  if (alias.length >= 3) return true;
  return /\d/.test(alias);
}

export function matchCatalogShops<T extends Shop>(
  raw: string,
  shops: T[],
): T[] {
  const haystack = normalize(raw);
  if (!haystack) return [];

  const hits: { shop: T; score: number }[] = [];

  for (const shop of shops) {
    let best = 0;
    for (const alias of shopNameAliases(shop)) {
      if (!aliasUsableInAsk(haystack, alias)) continue;
      if (!includesAlias(haystack, alias)) continue;
      best = Math.max(best, aliasScore(haystack, alias, shop));
    }
    if (best > 0) hits.push({ shop, score: best });
  }

  hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return 0;
  });

  return hits.map((hit) => hit.shop);
}
