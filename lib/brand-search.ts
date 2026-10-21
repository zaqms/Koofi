import { CHAIN_BRANDS, isChainBrandId } from "./chain-brands";
import { isListingShop } from "./catalog";
import { shopBrandKey } from "./shop-brand";
import {
  exactShopNames,
  isGenericShopWord,
  shopCoreNames,
  matchedShopAliases,
  normalizeShopText,
  shopNameAliases,
  shopTextIncludesAlias,
} from "./shop-name";
import type { Shop } from "./types";

/**
 * Brand mode: when does a typed ask name one brand (every listed branch),
 * and when is it just a word that happens to sit in some café's name?
 *
 * A group is named when the ask holds a "strong" alias for it:
 *  - 3+ letters (so "dr", "de", "b", «دا» stay a normal pick),
 *  - not made only of everyday words (café, drink, drive, address …),
 *  - carried by that brand alone across the whole catalog
 *    (so "black" / "half" / «فاين» never pull in a second brand),
 *  - or the café's exact full name, which always counts.
 * A strong alias sitting inside a longer strong alias of another brand
 * loses ("java" inside "java time").
 */

export type NamedHit = { shop: Shop; score: number };

/** Words that describe a café, a drink or an ask. Never a brand alone. */
const ASK_GENERIC_WORDS = new Set(
  [
    // café / coffee
    "coffee", "cafe", "café", "cafes", "coffees", "shop", "roastery", "roasters", "roaster",
    "speciality", "specialty", "espresso", "latte", "cappuccino", "mocha", "americano",
    "flat", "white", "cold", "brew", "drip", "v60", "pour", "over", "tea", "matcha",
    "cup", "cups", "mug", "bean", "beans", "bar", "lab", "house", "home", "corner",
    "daily", "art", "black", "half", "million", "mood", "address", "garden", "kitchen",
    "bakery", "dessert", "sweet", "sweets", "cake", "milk", "time", "station", "point",
    // drive-through
    "drive", "through", "thru", "car", "cars",
    // ask words
    "best", "top", "good", "nice", "great", "new", "open", "now", "near", "nearby",
    "riyadh", "in", "the", "a", "an", "of", "for", "with", "and", "or", "me", "my",
    "wifi", "kids", "date", "ladies", "women", "family", "24", "hours", "hour", "late",
    "night", "quiet", "study", "work", "rooftop", "outdoor", "view", "famous", "popular",
    "hello", "hi", "hey", "thanks", "thank", "you", "please", "not", "no", "except",
    // Arabic
    "قهوه", "قهوة", "قهاوي", "مقهى", "مقهي", "كافيه", "كافي", "كافية", "كوفي", "محمصه",
    "محمصة", "مختصه", "مختصة", "بن", "حليب", "هيل", "كوب", "فنجان", "بيت", "مزاج", "عنوان",
    "درايف", "ثرو", "سياره", "سيارة", "سيارات", "افضل", "أفضل", "احسن", "الرياض", "رياض",
    "مشهور", "جديد", "سهر", "عوائل", "بنات", "هادي", "هادئ", "دراسة", "شغل", "قريب", "مني",
    "مود", "تايم", "مرحبا", "هلا", "السلام", "شكرا", "مو", "غير", "بدون", "لاتيه", "اسبريسو", "حلى",
    "حلويات", "فطور", "في", "من", "او", "و",
  ].map((word) => normalizeShopText(word)).filter(Boolean),
);

function letterCount(alias: string): number {
  return Array.from(alias.replace(/[\s\d]/g, "")).length;
}

export function isAskGenericToken(token: string): boolean {
  const norm = normalizeShopText(token);
  if (!norm) return true;
  return ASK_GENERIC_WORDS.has(norm) || isGenericShopWord(norm);
}

/** Every word is café vocabulary, an ask word, a number, or 1–2 letters. */
export function isGenericAsk(raw: string): boolean {
  const tokens = normalizeShopText(raw).split(" ").filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every(
    (token) => isAskGenericToken(token) || /^\d+$/.test(token) || letterCount(token) <= 2,
  );
}

/** Everyday phrases. A drink or a drive-through is not a brand. */
const GENERIC_PHRASES = new Set(
  [
    "drive through", "drive thru", "cold brew", "flat white", "pour over", "open now",
    "24 hours", "specialty coffee", "speciality coffee", "coffee shop", "near me",
    "درايف ثرو", "سيارة درايف", "قهوة مختصة", "قهوه مختصه", "كولد برو", "فلات وايت",
  ].map((phrase) => normalizeShopText(phrase)).filter(Boolean),
);

/**
 * One word: any everyday word. A phrase: a known everyday phrase, or only
 * shop words ("coffee house"). "address mood" / "coffee address" are names.
 */
function aliasIsGeneric(alias: string): boolean {
  const tokens = alias.split(" ").filter(Boolean);
  if (tokens.length <= 1) return tokens.every((token) => isAskGenericToken(token));
  if (GENERIC_PHRASES.has(alias)) return true;
  return tokens.every((token) => isGenericShopWord(token));
}

export function groupKey(shop: Shop): string {
  if (shop.chainBrand && isChainBrandId(shop.chainBrand)) {
    return `chain:${shop.chainBrand}`;
  }
  return `brand:${shopBrandKey(shop)}`;
}

const aliasCache = new Map<string, string[]>();

function aliasesFor(shop: Shop): string[] {
  const cached = aliasCache.get(shop.id);
  if (cached) return cached;
  const aliases = [...shopNameAliases(shop), ...exactShopNames(shop)];
  aliasCache.set(shop.id, aliases);
  return aliases;
}

const ownerCache = new WeakMap<readonly Shop[], Map<string, Set<string>>>();

/** alias → brand groups that carry it, across the whole catalog. */
function aliasOwners(catalog: readonly Shop[]): Map<string, Set<string>> {
  const cached = ownerCache.get(catalog);
  if (cached) return cached;
  const owners = new Map<string, Set<string>>();
  for (const shop of catalog) {
    const key = groupKey(shop);
    for (const alias of aliasesFor(shop)) {
      const set = owners.get(alias) ?? new Set<string>();
      set.add(key);
      owners.set(alias, set);
    }
  }
  ownerCache.set(catalog, owners);
  return owners;
}

function within(inner: string, outer: string): boolean {
  return inner !== outer && ` ${outer} `.includes(` ${inner} `);
}

const coreCache = new WeakMap<readonly Shop[], Map<string, Set<string>>>();

/** group → core names of its shops. */
function groupCores(catalog: readonly Shop[]): Map<string, Set<string>> {
  const cached = coreCache.get(catalog);
  if (cached) return cached;
  const cores = new Map<string, Set<string>>();
  for (const shop of catalog) {
    const key = groupKey(shop);
    const set = cores.get(key) ?? new Set<string>();
    for (const core of shopCoreNames(shop)) set.add(core);
    cores.set(key, set);
  }
  coreCache.set(catalog, cores);
  return cores;
}

function isCoreForEveryOwner(
  alias: string,
  owners: Set<string>,
  catalog: readonly Shop[],
): boolean {
  const cores = groupCores(catalog);
  return [...owners].every((key) => cores.get(key)?.has(alias) ?? false);
}

type GroupMatch = { key: string; hits: NamedHit[]; strong: string[] };

/** Groups the ask names outright. Empty when every hit is a weak word match. */
export function strongNamedGroups(
  raw: string,
  hits: NamedHit[],
  catalog: readonly Shop[],
): GroupMatch[] {
  const hay = normalizeShopText(raw);
  if (!hay || hits.length === 0) return [];
  const owners = aliasOwners(catalog);
  const groups = new Map<string, NamedHit[]>();
  for (const hit of hits) {
    const key = groupKey(hit.shop);
    const list = groups.get(key) ?? [];
    list.push(hit);
    groups.set(key, list);
  }

  const matches: GroupMatch[] = [];
  for (const [key, group] of groups) {
    const strong = new Set<string>();
    for (const hit of group) {
      const exact = new Set(exactShopNames(hit.shop));
      for (const alias of matchedShopAliases(hay, hit.shop)) {
        if (letterCount(alias) < 3) continue;
        if (exact.has(alias)) {
          strong.add(alias);
          continue;
        }
        if (aliasIsGeneric(alias)) continue;
        const owner = owners.get(alias);
        if (owner && owner.size === 1 && owner.has(key)) {
          strong.add(alias);
          continue;
        }
        // Homonyms: «شفل» is the whole name of both Shafel and Shovel.
        if (owner && owner.size <= 3 && isCoreForEveryOwner(alias, owner, catalog)) {
          strong.add(alias);
        }
      }
    }
    if (strong.size > 0) matches.push({ key, hits: group, strong: [...strong] });
  }

  // "java" (Java Cafe) inside "java time" (Java Time): the longer phrase wins.
  return matches.filter(
    (match) =>
      !match.strong.every((alias) =>
        matches.some(
          (other) =>
            other.key !== match.key && other.strong.some((longer) => within(alias, longer)),
        ),
      ),
  );
}

/** Words every branch of the brand shares, plus everyday words. Not a branch word. */
function brandTokens(group: NamedHit[]): Set<string> {
  const sets = group.map((hit) => new Set(aliasesFor(hit.shop)));
  const first = sets[0] ?? new Set<string>();
  const shared = [...first].filter((alias) => sets.every((set) => set.has(alias)));
  const tokens = new Set<string>();
  for (const alias of shared) for (const token of alias.split(" ")) tokens.add(token);
  for (const hit of group) {
    for (const name of [hit.shop.nameEn, hit.shop.nameAr]) {
      for (const token of normalizeShopText(name).split(" ")) {
        // A token in every branch's display name is the brand, not a branch.
        if (
          group.every((row) =>
            `${normalizeShopText(row.shop.nameEn)} ${normalizeShopText(row.shop.nameAr)}`
              .split(" ")
              .includes(token),
          )
        ) {
          tokens.add(token);
        }
      }
    }
  }
  return tokens;
}

function isBranchWord(token: string, brand: Set<string>): boolean {
  return token.length >= 3 && !brand.has(token) && !isAskGenericToken(token);
}

/**
 * "بانوراما" and "panorama" share a consonant skeleton (p folds to b).
 */
function consonantSkeleton(token: string): string {
  if (/[\u0600-\u06FF]/.test(token)) {
    const map: Record<string, string> = {
      ب: "b", پ: "b", ت: "t", ث: "t", ج: "j", ح: "h", خ: "kh", د: "d", ذ: "d",
      ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z", غ: "gh",
      ف: "f", ق: "k", ك: "k", ل: "l", م: "m", ن: "n", ه: "h",
    };
    let out = "";
    for (const ch of token) {
      if (ch === "ا" || ch === "و" || ch === "ي" || ch === "ى" || ch === "ع") continue;
      const mapped = map[ch];
      if (mapped) out += mapped;
    }
    return out;
  }
  return token.replace(/[aeiouy]/g, "").replace(/p/g, "b");
}

function branchTokensMatch(askToken: string, idToken: string): boolean {
  if (askToken.length < 4 || idToken.length < 4) return false;
  if (askToken === idToken) return true;
  const askArabic = /[\u0600-\u06FF]/.test(askToken);
  const idArabic = /[\u0600-\u06FF]/.test(idToken);
  if (askArabic === idArabic) return false;
  const left = consonantSkeleton(askToken);
  const right = consonantSkeleton(idToken);
  return left.length >= 4 && left === right;
}

/**
 * A branch word in the ask ("panorama", «لبن») keeps only those branches.
 * Brand words and everyday words ("coffee", "roastery") never narrow:
 * "Shafel Coffee Roastery" keeps all three Shafel branches.
 * Returns null when nothing narrows.
 */
function narrowGroup(hay: string, group: NamedHit[]): NamedHit[] | null {
  const brand = brandTokens(group);
  let bestAlias = "";
  let bestRows: NamedHit[] = [];
  for (const hit of group) {
    for (const alias of aliasesFor(hit.shop)) {
      if (!alias.split(" ").some((token) => isBranchWord(token, brand))) continue;
      if (!shopTextIncludesAlias(hay, alias)) continue;
      const rows = group.filter((row) => aliasesFor(row.shop).includes(alias));
      if (rows.length === 0 || rows.length === group.length) continue;
      if (alias.length > bestAlias.length) {
        bestAlias = alias;
        bestRows = rows;
      }
    }
  }
  if (bestAlias) return bestRows;

  let bestToken = "";
  for (const token of hay.split(" ")) {
    if (!isBranchWord(token, brand) || token.length < 4) continue;
    const rows = group.filter((hit) =>
      hit.shop.id.split("-").some((part) => branchTokensMatch(token, part)),
    );
    if (rows.length === 0 || rows.length === group.length) continue;
    if (token.length > bestToken.length) {
      bestToken = token;
      bestRows = rows;
    }
  }
  return bestToken ? bestRows : null;
}

/**
 * Rows for each named brand. The whole brand lists its listed branches only
 * (drive-through / pickup rows stay off, so the count matches the listing);
 * a brand with no listed branch keeps its rows. A branch word keeps exactly
 * the branches it names, listed or not.
 */
export function brandRows(
  raw: string,
  groups: GroupMatch[],
  catalog: readonly Shop[],
  areas: readonly string[] = [],
): NamedHit[] {
  const hay = normalizeShopText(raw);
  const rows: NamedHit[] = [];
  for (const match of groups) {
    // Every branch of the brand, not only the rows the ask's words touched.
    const best = Math.max(...match.hits.map((hit) => hit.score));
    const scored = new Map(match.hits.map((hit) => [hit.shop.id, hit.score]));
    const all = catalog
      .filter((shop) => groupKey(shop) === match.key)
      .map((shop) => ({ shop, score: scored.get(shop.id) ?? best }));
    let pool = all.length > 0 ? all : match.hits;
    // A local brand key can join two cafés ("Najd Roastery" and "Najd Alathiah").
    // Keep the rows that carry the longest strong alias the ask holds.
    if (!match.key.startsWith("chain:")) {
      const strong = new Set(match.strong);
      const strength = (shop: Shop) =>
        Math.max(
          0,
          ...matchedShopAliases(hay, shop)
            .filter((alias) => strong.has(alias))
            .map((alias) => alias.length),
        );
      const top = Math.max(0, ...pool.map((hit) => strength(hit.shop)));
      if (top > 0) {
        const anchors = pool.filter((hit) => strength(hit.shop) === top);
        // "Coffee Address (Al Ihsaa)" / «عنوان القهوة (البشور)» start with an
        // anchor's full name, so they are the same café. "Najd Alathiah" is not.
        const anchorNames = anchors.flatMap((hit) => [
          normalizeShopText(hit.shop.nameEn),
          normalizeShopText(hit.shop.nameAr),
        ]);
        pool = pool.filter(
          (hit) =>
            anchors.includes(hit) ||
            [normalizeShopText(hit.shop.nameEn), normalizeShopText(hit.shop.nameAr)].some(
              (name) => anchorNames.some((anchor) => anchor && `${name} `.startsWith(`${anchor} `)),
            ),
        );
      }
    }
    const narrowed = narrowGroup(hay, pool);
    if (narrowed) {
      rows.push(...narrowed);
      continue;
    }
    // The café whose exact name was typed shows even off the listing ("Arabica
    // Cafe" is a drive-through lane), unless a listed branch carries that name.
    const listed = pool.filter((hit) => isListingShop(hit.shop));
    const exact = pool.filter((hit) => exactShopNames(hit.shop).includes(hay));
    const exactOff = exact.some((hit) => isListingShop(hit.shop))
      ? []
      : exact.filter((hit) => !isListingShop(hit.shop));
    const whole = [...exactOff, ...listed];
    // «اقريو الربيع»: the only branch in the asked حي is off the listing. Show it
    // rather than "no AGRIO in Al Rabi".
    if (areas.length > 0 && !whole.some((hit) => areas.includes(hit.shop.neighborhood))) {
      const inArea = pool.filter((hit) => areas.includes(hit.shop.neighborhood));
      if (inArea.length > 0) {
        rows.push(...inArea);
        continue;
      }
    }
    rows.push(...(whole.length > 0 ? whole : pool));
  }
  return rows;
}

/** One name for the away line: the chain, or the words every branch shares. */
export function brandLabel(shops: readonly Shop[]): { en: string; ar: string } {
  const first = shops[0];
  if (!first) return { en: "", ar: "" };
  const chain = first.chainBrand;
  if (chain && isChainBrandId(chain)) {
    return { en: CHAIN_BRANDS[chain].nameEn, ar: CHAIN_BRANDS[chain].nameAr };
  }
  const commonPrefix = (names: string[]): string => {
    const split = names.map((name) => name.trim().split(/\s+/));
    const out: string[] = [];
    for (let i = 0; i < (split[0]?.length ?? 0); i += 1) {
      const word = split[0]![i]!;
      if (split.every((words) => words[i]?.toLowerCase() === word.toLowerCase())) out.push(word);
      else break;
    }
    return out.join(" ").replace(/[|·\-–]+$/, "").trim();
  };
  const en = commonPrefix(shops.map((shop) => shop.nameEn)) || first.nameEn;
  const ar = commonPrefix(shops.map((shop) => shop.nameAr)) || first.nameAr;
  return { en, ar };
}
