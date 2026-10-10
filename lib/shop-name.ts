import {
  CHAIN_BRANDS,
  chainBrandSearchAliases,
  isChainBrandId,
  type ChainBrandId,
} from "./chain-brands";
import { NEIGHBORHOODS } from "./neighborhoods";
import { MEET_HALFWAY_CHIP, NEARBY_CHIP, VIBE_CHIPS } from "./product";
import { shopBrandKey } from "./shop-brand";
import type { Shop } from "./types";

/**
 * Catalog name match for a typed ask. Vibe / حي parsing stays in parse-intent.
 * Only real catalog shops. Never invent a listing.
 */

/** Latin accents fold to the bare letter ("Rémi's" → "remis", "VOÛTE" → "voute"); Arabic is untouched. */
function stripLatinAccents(text: string): string {
  return text
    .replace(/[\u00C0-\u024F]/g, (ch) => ch.normalize("NFD"))
    .replace(/[\u0300-\u036F]/g, "");
}

function normalize(text: string): string {
  return stripLatinAccents(text)
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
    "coffe",
    "cofee",
    "kofi",
    "kofe",
    "koffee",
    "qahwa",
    "qahwah",
    "kahwa",
    "gahwa",
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
    "قهوة",
    "قهاوي",
    "مقهى",
    "محمصه",
    "محامص",
    "كافيه",
    "كافية",
    "كافي",
    // Cafe-type words, not a brand. «كوفي» inside كوستا كوفي / درايف كوفي must not name the chain.
    "كوفي",
    "كوفيه",
    "كوفه",
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

const CHIP_ASKS = new Set(
  [...VIBE_CHIPS, NEARBY_CHIP, MEET_HALFWAY_CHIP]
    .flatMap((chip) => [chip.en, chip.ar])
    .map((label) => normalize(label))
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

/**
 * Extra aliases the listing row does not generate.
 * Looked up by shop.id and by shopBrandKey so every branch of a brand
 * gets the same extras (Breehant Olaya + Yasmin both get بريهانت).
 * Known misspellings / Arabic-script names only. Not a fuzzy ranker.
 */
const EXTRA_ALIASES: Record<string, readonly string[]> = {
  breehant: ["بريهانت", "بريهنت", "breeahant"],
  "percent-arabica": ["percent", "arabica", "%", "ارابيكا"],
  "btw-olaya": ["btw"],
  "one-gram-sulimaniyah": ["one gram"],
  "sand-clock": ["ساعة الرمل"],
  "house-of-matcha": ["هاوس اوف ماتشا"],
  somatcha: ["سو ماتشا", "so matcha"],
  "the-matcha-bar-olaya": ["ذا ماتشا بار"],
  "with-heart-diriyah": ["ويث هارت"],
  "remis-matcha-club-hittin": ["ريمي"],
  "okawa-cafe-al-malqa": ["okawa", "اوكاوا"],
  "okawa-al-narjis": ["okawa", "اوكاوا"],
  "okawa-olaya": ["okawa", "اوكاوا"],
  "okawa-king-fahd": ["okawa", "اوكاوا"],
  "re-matcha-al-hamra": ["ري ماتشا"],
  "flow-matcha-at-taawun": ["فلو"],
  "hokkaido-al-hamra": ["هوكايدو"],
  "happyland-matcha-diriyah": ["هابي لاند"],
  "salam-cafe-al-malqa": ["قهوة سلام", "salam cafe"],
  "dr-cafe": ["د.كيف", "د كيف", "dr cafe", "drcafe", "dr.cafe"],
  // Brand spelling is ايزرت. إسرت is the previous catalog form.
  essert: ["إسرت"],
  // Catalog name is إرا; locals also type ايرا / إيرا (#247 QA L4).
  "era-coffee-as-suwaidi": ["ايرا", "إيرا"],
  // Catalog spelling is اوستريتش. اوستريتيش is the other spelling people type.
  "ostrich-al-falah": ["اوستريتيش"],
  // Batch G: نفل is also the حي token (النفل), so the full name needs to be an explicit alias (same as قهوة سلام).
  "nafel-coffee-an-nafal": ["قهوة نفل", "nafel coffee"],
};

function addAlias(into: Set<string>, raw: string): void {
  const alias = normalize(raw);
  if (!alias || isBlockedAlias(alias)) return;
  if (tokens(alias).every((token) => isBlockedAlias(token))) return;
  into.add(alias);
}

/** Extra aliases may reuse a حي token when the full phrase is the shop name. */
function addExtraAlias(into: Set<string>, raw: string): void {
  const alias = normalize(raw);
  if (!alias) return;
  if (isBlockedAlias(alias) && !alias.includes(" ")) return;
  into.add(alias);
}

/**
 * Single-word name tokens a chain row must not answer to on its own.
 * Java Time: «جافا» / "java" already name Java Cafe (`java`), and "time" / «تايم» are plain words.
 * The full name ("java time", «جافا تايم», "javatime") still matches.
 */
const CHAIN_TOKEN_BLOCK: Partial<Record<ChainBrandId, readonly string[]>> = {
  "java-time": ["java", "جافا", "time", "تايم"],
};

function chainBrandIdForShop(
  shop: Pick<Shop, "id" | "nameEn" | "nameAr" | "chainBrand">,
): ChainBrandId | null {
  if (shop.chainBrand && isChainBrandId(shop.chainBrand)) return shop.chainBrand;
  const key = shopBrandKey(shop);
  return isChainBrandId(key) ? key : null;
}

export function shopNameAliases(
  shop: Pick<Shop, "id" | "nameEn" | "nameAr" | "neighborhood" | "chainBrand">,
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

  for (const extra of EXTRA_ALIASES[shop.id] ?? []) addExtraAlias(aliases, extra);
  for (const extra of EXTRA_ALIASES[shopBrandKey(shop)] ?? []) {
    addExtraAlias(aliases, extra);
  }
  const chainBrand = chainBrandIdForShop(shop);
  if (chainBrand) {
    for (const extra of chainBrandSearchAliases(chainBrand)) {
      addExtraAlias(aliases, extra);
    }
    for (const blocked of CHAIN_TOKEN_BLOCK[chainBrand] ?? []) aliases.delete(normalize(blocked));
  }

  return [...aliases];
}

const CHAIN_NEGATION_MARKERS = [
  "anything but",
  "except",
  "not",
  "no",
  "ما ابي",
  "بدون",
  "غير",
  "إلا",
  "مو",
] as const;

/** Brand ids the ask tells us to leave out, such as "not starbucks". */
export function negatedChainBrandIds(raw: string): Set<ChainBrandId> {
  const haystack = normalize(raw);
  const negated = new Set<ChainBrandId>();
  if (!haystack) return negated;
  for (const id of Object.keys(CHAIN_BRANDS)) {
    if (!isChainBrandId(id)) continue;
    for (const alias of chainBrandSearchAliases(id)) {
      const needle = normalize(alias);
      if (!needle) continue;
      for (const marker of CHAIN_NEGATION_MARKERS) {
        if (includesAlias(haystack, normalize(`${marker} ${needle}`))) negated.add(id);
      }
    }
  }
  return negated;
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
  // Whole-ask حي / chip labels stay vibe+area, even if a shop token sits inside
  // ("ash" from Ash Bloom must not steal "ash shohda").
  if (NEIGHBORHOOD_ALIASES.has(haystack) || CHIP_ASKS.has(haystack)) return [];

  const hits: { shop: T; score: number }[] = [];
  const negated = negatedChainBrandIds(raw);

  for (const shop of shops) {
    const brand = chainBrandIdForShop(shop);
    if (brand && negated.has(brand)) continue;
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
