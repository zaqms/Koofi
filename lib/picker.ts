import { CHAIN_BRANDS, isChainBrandId } from "./chain-brands";
import { listRealShops, selectCatalogShops } from "./catalog";
import { DEFAULT_LIVE_CITY } from "./cities";
import { shopToChatPick } from "./chat-pick";
import { copy } from "./copy";
import {
  districtPageHidden,
  extractPrimaryDistrict,
  isExactDistrictAsk,
} from "./district-dictionary";
import { rankByPopularity, rankInDistrict } from "./district-rank";
import { fuzzyNameHit } from "./fuzzy-name";
import { isMeetHalfwayChipAsk } from "./meet-halfway";
import { coffeeShopsInDistrict } from "./directory-category";
import { haversineKm } from "./distance";
import { neighborhoodTightShops } from "./neighborhood-tight";
import { neighborhoodLabel } from "./neighborhoods";
import { officialShopCoords } from "./place-coords";
import { parseIntent } from "./parse-intent";
import {
  PUBLIC_SITE_URL,
  districtPath,
  exampleBadge,
  isExampleShop,
  packSharePath,
  shopDisplayName,
} from "./product";
import { decorateChatPicks } from "./places";
import { shopLocation, shopMapsHref } from "./public-url";
import { dedupeSameBrand, shopBrandKey } from "./shop-brand";
import { encodePackId } from "./pack";
import {
  normalizeShopText,
  scoreCatalogShops,
  shopNameAliases,
  shopTextIncludesAlias,
} from "./shop-name";
import type {
  ChatPick,
  City,
  Language,
  MomentTag,
  NameSuggestion,
  Intent,
  NeighborhoodId,
  PickReason,
  PickResult,
  Pin,
  Shop,
} from "./types";
import { shopsWithUniqueWhy, uniqueWhyLines } from "./why-line";

/** Vibe chips, popular, and district asks stay a three-pack. */
const TARGET_PICKS = 3;

/** Named search returns every matching branch, then stops. Two brands still fit. */
const SEARCH_MATCH_CAP = 40;

/** WhatsApp lists a short page, then a link to the rest. */
const WHATSAPP_LIST_CAP = 8;

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

/**
 * Words that ask for a suggestion, not a shop name.
 * "وين اروح" stays a normal three-pack. "nearby" / "قريب مني" are the
 * distance list below. "drops" is an ordinary word, not a café name.
 */
const RECOMMENDATION_WORDS = new Set(
  [
    "nearby",
    "near",
    "me",
    "please",
    "somewhere",
    "where",
    "go",
    "something",
    "anything",
    "drops",
    "قريب",
    "مني",
    "وين",
    "اروح",
    "ابي",
    "ابغى",
    "ابغا",
    "ودي",
    "مكان",
    "من",
    "في",
    "او",
    "أو",
    "or",
    "and",
  ].map((word) => normalizeShopText(word)),
);

export function isRecommendationAsk(raw: string): boolean {
  const hay = normalizeShopText(raw);
  if (!hay) return false;
  const tokens = hay.split(" ").filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => RECOMMENDATION_WORDS.has(token));
}

/**
 * Proximity asks. "coffee" and "مقاهي" are filler, so "coffee near me" and
 * "nearby cafes" are the same distance list as "nearby". A brand token
 * ("Starbucks near me") stays a name search.
 */
const NEARBY_FILLERS = new Set(
  [
    "me",
    "near",
    "cafe",
    "cafes",
    "café",
    "coffee",
    "قهوة",
    "قهاوي",
    "مقاهي",
    "مقهى",
    "كافيه",
    "كوفي",
    "كوفيه",
    "مني",
    "من",
  ].map((word) => normalizeShopText(word)),
);

function isNearbyAsk(raw: string): boolean {
  const hay = normalizeShopText(raw);
  const tokens = hay.split(" ").filter(Boolean);
  if (tokens.length === 0) return false;
  const qareeb = normalizeShopText("قريب");
  const qareeba = normalizeShopText("قريبة");
  const proximity =
    tokens.includes("nearby") ||
    tokens.includes(qareeb) ||
    tokens.includes(qareeba) ||
    (tokens.includes("near") && tokens.includes("me"));
  if (!proximity) return false;
  return tokens.every(
    (token) =>
      token === "nearby" ||
      token === qareeb ||
      token === qareeba ||
      NEARBY_FILLERS.has(token),
  );
}

function groupKey(shop: Shop): string {
  if (shop.chainBrand && isChainBrandId(shop.chainBrand)) {
    return `chain:${shop.chainBrand}`;
  }
  return `brand:${shopBrandKey(shop)}`;
}

type NamedHit = { shop: Shop; score: number };

function aliasesForShop(shop: Shop, cache: Map<string, string[]>): string[] {
  const cached = cache.get(shop.id);
  if (cached) return cached;
  const aliases = shopNameAliases(shop);
  cache.set(shop.id, aliases);
  return aliases;
}

/** Aliases every shop in the group carries. One shared word is not a brand. */
function sharedGroupAliases(group: NamedHit[], cache: Map<string, string[]>): string[] {
  const aliasSets = group.map((hit) => new Set(aliasesForShop(hit.shop, cache)));
  const first = aliasSets[0];
  if (!first) return [];
  return [...first].filter(
    (alias) => alias.length >= 4 && aliasSets.every((set) => set.has(alias)),
  );
}

/**
 * "بانوراما" and "panorama" share a consonant skeleton (p folds to b).
 * Vowels drop. Same-script typos stay on the alias list, not here.
 */
function consonantSkeleton(token: string): string {
  if (/[\u0600-\u06FF]/.test(token)) {
    const map: Record<string, string> = {
      ب: "b",
      پ: "b",
      ت: "t",
      ث: "t",
      ج: "j",
      ح: "h",
      خ: "kh",
      د: "d",
      ذ: "d",
      ر: "r",
      ز: "z",
      س: "s",
      ش: "sh",
      ص: "s",
      ض: "d",
      ط: "t",
      ظ: "z",
      غ: "gh",
      ف: "f",
      ق: "k",
      ك: "k",
      ل: "l",
      م: "m",
      ن: "n",
      ه: "h",
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
 * Generic words sit in brand names ("Costa Coffee") and in some branch ids.
 * They are not a branch. "panorama" still is.
 */
const GENERIC_BRANCH_TOKENS = new Set(
  ["coffee", "cafe", "café", "قهوة", "كافيه", "كوفي", "roastery", "محمصة"].map((word) =>
    normalizeShopText(word),
  ),
);

/**
 * A branch word may live only in the shop id ("panorama"), including the
 * other script ("بانوراما"). A token every branch carries is the brand.
 */
function narrowByBranchToken(hay: string, group: NamedHit[]): NamedHit[] | null {
  const askTokens = hay
    .split(" ")
    .filter((token) => token.length >= 4 && !GENERIC_BRANCH_TOKENS.has(token));
  let bestToken = "";
  let bestRows: NamedHit[] = [];
  for (const token of askTokens) {
    const rows = group.filter((hit) =>
      hit.shop.id.split("-").some(
        (part) => !GENERIC_BRANCH_TOKENS.has(part) && branchTokensMatch(token, part),
      ),
    );
    if (rows.length === 0 || rows.length === group.length) continue;
    if (token.length > bestToken.length) {
      bestToken = token;
      bestRows = rows;
    }
  }
  return bestToken ? bestRows : null;
}

function narrowGroup(hay: string, group: NamedHit[], cache: Map<string, string[]>): NamedHit[] {
  const shared = sharedGroupAliases(group, cache).filter((alias) =>
    shopTextIncludesAlias(hay, alias),
  );
  let bestAlias = "";
  let bestRows: NamedHit[] = [];
  const seenAlias = new Set<string>();
  for (const hit of group) {
    for (const alias of aliasesForShop(hit.shop, cache)) {
      if (alias.length < 3 || shared.includes(alias) || seenAlias.has(alias)) continue;
      if (!shopTextIncludesAlias(hay, alias)) continue;
      seenAlias.add(alias);
      const rows = group.filter((row) => aliasesForShop(row.shop, cache).includes(alias));
      if (rows.length === 0 || rows.length === group.length) continue;
      if (alias.length > bestAlias.length) {
        bestAlias = alias;
        bestRows = rows;
      }
    }
  }
  if (bestAlias) return bestRows;
  return narrowByBranchToken(hay, group) ?? group;
}

/**
 * A brand plus extra words ("Starbucks near me", "ستاربكس او دكتور كيف") keeps
 * every branch of each named brand. A branch word ("panorama", "بانوراما")
 * still narrows. One shared word ("half", "drip") does not pull in a second brand.
 */
/** "black" sits inside "black wolf". The longer phrase is the brand. */
function aliasContainedIn(shorter: string, longer: string): boolean {
  if (!shorter || shorter === longer) return false;
  return ` ${longer} `.includes(` ${shorter} `);
}

/**
 * A one-word overlap is not a second brand. Black Wolf keeps Black Wolf.
 * Black Stamp stays out unless the ask is Black Stamp.
 */
function dropSubsetBrands(
  hits: NamedHit[],
  hay: string,
  cache: Map<string, string[]>,
): NamedHit[] {
  const groups = new Map<string, NamedHit[]>();
  for (const hit of hits) {
    const key = groupKey(hit.shop);
    const list = groups.get(key) ?? [];
    list.push(hit);
    groups.set(key, list);
  }
  const matched = new Map<string, string[]>();
  for (const [key, group] of groups) {
    matched.set(
      key,
      sharedGroupAliases(group, cache).filter((alias) => shopTextIncludesAlias(hay, alias)),
    );
  }
  const drop = new Set<string>();
  for (const [key, aliases] of matched) {
    if (aliases.length === 0) continue;
    const kept = aliases.some(
      (alias) =>
        ![...matched.entries()].some(
          ([otherKey, others]) =>
            otherKey !== key && others.some((longer) => aliasContainedIn(alias, longer)),
        ),
    );
    if (!kept) drop.add(key);
  }
  if (drop.size === 0) return hits;
  return hits.filter((hit) => !drop.has(groupKey(hit.shop)));
}

function narrowNamedHits(raw: string, hits: NamedHit[]): NamedHit[] {
  const hay = normalizeShopText(raw);
  const groups = new Map<string, NamedHit[]>();
  for (const hit of hits) {
    const key = groupKey(hit.shop);
    const list = groups.get(key) ?? [];
    list.push(hit);
    groups.set(key, list);
  }

  const cache = new Map<string, string[]>();
  const ownerCount = new Map<string, number>();
  const sharedByGroup = new Map<string, string[]>();
  for (const [key, group] of groups) {
    const shared = sharedGroupAliases(group, cache);
    sharedByGroup.set(key, shared);
    for (const alias of shared) ownerCount.set(alias, (ownerCount.get(alias) ?? 0) + 1);
  }

  const namedKeys: string[] = [];
  for (const [key, shared] of sharedByGroup) {
    const distinctive = shared.some(
      (alias) => shopTextIncludesAlias(hay, alias) && ownerCount.get(alias) === 1,
    );
    if (distinctive) namedKeys.push(key);
  }

  if (namedKeys.length > 0) {
    return dropSubsetBrands(
      namedKeys.flatMap((key) => narrowGroup(hay, groups.get(key) ?? [], cache)),
      hay,
      cache,
    );
  }

  if (hits.length === 0) return [];
  const best = Math.max(...hits.map((hit) => hit.score));
  const selected: NamedHit[] = [];
  for (const [key, group] of groups) {
    if (!group.some((hit) => hit.score === best)) continue;
    const sharedInAsk = (sharedByGroup.get(key) ?? []).some((alias) =>
      shopTextIncludesAlias(hay, alias),
    );
    if (sharedInAsk) {
      selected.push(...narrowGroup(hay, group, cache));
      continue;
    }
    selected.push(...group.filter((hit) => hit.score === best));
  }
  return dropSubsetBrands(selected, hay, cache);
}

function outsideAreaLabel(
  shops: readonly Shop[],
  areaId: NeighborhoodId,
): NonNullable<PickResult["outsideArea"]> {
  const brands = new Map<string, { en: string; ar: string }>();
  for (const shop of shops) {
    const id = shop.chainBrand;
    if (id && isChainBrandId(id)) {
      const brand = CHAIN_BRANDS[id];
      brands.set(id, { en: brand.nameEn, ar: brand.nameAr });
      continue;
    }
    const key = shopBrandKey(shop);
    if (!brands.has(key)) brands.set(key, { en: shop.nameEn, ar: shop.nameAr });
  }
  const rows = [...brands.values()];
  return {
    nameEn: rows.map((row) => row.en).join(" and ") || "that café",
    nameAr: rows.map((row) => row.ar).join(" و ") || "هذي",
    areaEn: neighborhoodLabel(areaId, "en"),
    areaAr: neighborhoodLabel(areaId, "ar"),
  };
}

function sortSearchHits(
  hits: { shop: Shop; score: number }[],
  origin?: Pin,
): Shop[] {
  return [...hits]
    .sort((a, b) => {
      if (origin) {
        const aCoords = officialShopCoords(a.shop);
        const bCoords = officialShopCoords(b.shop);
        const aKm = aCoords ? haversineKm(origin, aCoords) : Number.POSITIVE_INFINITY;
        const bKm = bCoords ? haversineKm(origin, bCoords) : Number.POSITIVE_INFINITY;
        if (aKm !== bKm) return aKm - bKm;
      }
      if (b.score !== a.score) return b.score - a.score;
      return 0;
    })
    .map((hit) => hit.shop);
}

function isPopularAsk(moments: readonly MomentTag[]): boolean {
  return moments.includes("popular");
}

export { rankByPopularity } from "./district-rank";

function pickReasonsForPopular(
  shops: Shop[],
  language: Language,
  moments: MomentTag[],
): PickReason[] {
  const ranked = dedupeSameBrand(rankByPopularity(shops)).slice(0, TARGET_PICKS);
  const whys = uniqueWhyLines(ranked, language, moments);
  return ranked.map((shop, index) => ({
    shop,
    why: whys[index] ?? shop.neighborhoodAr,
  }));
}

/** District-named ask: top 3 in that حي only, effective popularityIndex. */
function pickReasonsForDistrict(
  shops: Shop[],
  district: NeighborhoodId,
  language: Language,
  moments: MomentTag[],
): PickReason[] {
  const ranked = dedupeSameBrand(rankInDistrict(shops, district)).slice(
    0,
    TARGET_PICKS,
  );
  const whys = uniqueWhyLines(ranked, language, moments);
  return ranked.map((shop, index) => ({
    shop,
    why: whys[index] ?? shop.neighborhoodAr,
  }));
}

function scoreShop(
  shop: Shop,
  neighborhoods: NeighborhoodId[],
  moments: MomentTag[],
): number {
  let score = isExampleShop(shop) ? 0 : 8;

  if (neighborhoods.length === 0) {
    score += 1;
  } else if (neighborhoods.includes(shop.neighborhood)) {
    score += 6;
  }

  for (const moment of moments) {
    if (shop.momentTags.includes(moment)) score += 3;
  }

  if (moments.length === 0) score += 1;
  return score;
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = next[i];
    next[i] = next[j] as T;
    next[j] = current as T;
  }
  return next;
}

/** Score first. Shuffle equal scores so generic asks are not stuck on the same three ids. */
function rankShops(
  shops: Shop[],
  neighborhoods: NeighborhoodId[],
  moments: MomentTag[],
): Shop[] {
  const buckets = new Map<number, Shop[]>();
  for (const shop of shops) {
    const score = scoreShop(shop, neighborhoods, moments);
    const bucket = buckets.get(score);
    if (bucket) bucket.push(shop);
    else buckets.set(score, [shop]);
  }

  return [...buckets.keys()]
    .sort((a, b) => b - a)
    .flatMap((score) => shuffle(buckets.get(score) ?? []));
}

function diversify(shops: Shop[], moments: MomentTag[]): Shop[] {
  if (shops.length <= TARGET_PICKS) return shops;

  const chosen: Shop[] = [];
  const usedMoments = new Set<MomentTag>();
  const usedNeighborhoods = new Set<NeighborhoodId>();

  for (const shop of shops) {
    const momentOverlap = shop.momentTags.filter((tag) => usedMoments.has(tag));
    const neighborhoodUsed = usedNeighborhoods.has(shop.neighborhood);
    const redundant =
      chosen.length > 0 &&
      neighborhoodUsed &&
      (moments.length === 0 || momentOverlap.length === shop.momentTags.length);

    if (redundant && chosen.length < TARGET_PICKS) continue;
    chosen.push(shop);
    shop.momentTags.forEach((tag) => usedMoments.add(tag));
    usedNeighborhoods.add(shop.neighborhood);
    if (chosen.length === TARGET_PICKS) break;
  }

  if (chosen.length < TARGET_PICKS) {
    for (const shop of shops) {
      if (!chosen.includes(shop)) chosen.push(shop);
      if (chosen.length === TARGET_PICKS) break;
    }
  }

  return chosen.slice(0, TARGET_PICKS);
}

function searchResult(input: {
  text: string;
  hits: { shop: Shop; score: number }[];
  language: Language;
  intent: Intent;
  origin?: Pin;
  didYouMean?: NameSuggestion;
}): PickResult {
  let pool = narrowNamedHits(input.text, input.hits);
  let outsideArea: PickResult["outsideArea"];
  if (input.intent.neighborhoods.length > 0) {
    const inArea = pool.filter((hit) =>
      input.intent.neighborhoods.includes(hit.shop.neighborhood),
    );
    if (inArea.length > 0) {
      pool = inArea;
    } else if (pool.length > 0) {
      const areaId = input.intent.neighborhoods[0];
      if (areaId) outsideArea = outsideAreaLabel(pool.map((hit) => hit.shop), areaId);
    }
  }

  const avoided = new Set(input.intent.avoidedNeighborhoods);
  const kept = pool.filter((hit) => !avoided.has(hit.shop.neighborhood));
  if (kept.length > 0) pool = kept;

  const shops = sortSearchHits(pool, input.origin);
  const capped = shops.slice(0, SEARCH_MATCH_CAP);
  // Keep every branch. A shared why-line must not drop a second café in the same حي.
  const whys = uniqueWhyLines(capped, input.language, input.intent.moments);
  const picks = capped.map((shop, index) => ({
    shop,
    why: whys[index] ?? shop.neighborhoodAr,
  }));
  return {
    language: input.language,
    picks,
    thinCatalog: false,
    mode: "search",
    matchCount: shops.length,
    ...(outsideArea ? { outsideArea } : {}),
    ...(input.didYouMean ? { didYouMean: input.didYouMean } : {}),
    askedNeighborhoods: input.intent.neighborhoods,
    avoidedNeighborhoods: input.intent.avoidedNeighborhoods,
    askedMoments: input.intent.moments,
  };
}

export function pickCafes(input: {
  text: string;
  beenIds?: string[];
  language?: Language;
  city?: City;
  /**
   * Fixture override. Live callers omit this and read the catalog.
   * Chains stay out of the generic pool; a named brand still matches `real`.
   */
  shops?: readonly Shop[];
  /** Visitor pin, when one is already known. Sorts a name search by distance. */
  origin?: Pin;
}): PickResult {
  const city = input.city ?? DEFAULT_LIVE_CITY;
  const intent = parseIntent(input.text, city);
  const language = input.language ?? intent.language;
  if (isMeetHalfwayChipAsk(input.text)) {
    return {
      language,
      picks: [],
      thinCatalog: false,
      askedNeighborhoods: intent.neighborhoods,
      avoidedNeighborhoods: intent.avoidedNeighborhoods,
      askedMoments: intent.moments,
    };
  }
  const been = new Set((input.beenIds ?? []).filter(Boolean));
  const avoided = new Set(intent.avoidedNeighborhoods);
  const real = input.shops
    ? input.shops.filter((shop) => shop.city === city && !isExampleShop(shop))
    : listRealShops(city);
  // Generic three-picks use the discovery view. A chain is never specialty.
  const catalog = selectCatalogShops(real, "discovery");
  const namedHits = scoreCatalogShops(input.text, real);
  const citywide = catalog.filter(
    (shop) => !been.has(shop.id) && !avoided.has(shop.neighborhood),
  );
  const matchedDistrict = extractPrimaryDistrict(input.text, city);
  const exactDistrict = isExactDistrictAsk(input.text, city);
  const asked: Pick<
    PickResult,
    "askedNeighborhoods" | "avoidedNeighborhoods" | "askedMoments"
  > = {
    askedNeighborhoods: intent.neighborhoods,
    avoidedNeighborhoods: intent.avoidedNeighborhoods,
    askedMoments: intent.moments,
  };

  if (isNearbyAsk(input.text)) {
    const origin = input.origin;
    const ranked = origin
      ? [...citywide].sort((a, b) => {
          const aCoords = officialShopCoords(a);
          const bCoords = officialShopCoords(b);
          const aKm = aCoords ? haversineKm(origin, aCoords) : Number.POSITIVE_INFINITY;
          const bKm = bCoords ? haversineKm(origin, bCoords) : Number.POSITIVE_INFINITY;
          if (aKm !== bKm) return aKm - bKm;
          return a.id.localeCompare(b.id);
        })
      : [
          ...rankByPopularity(citywide),
          ...citywide
            .filter((shop) => shop.popularityIndex == null)
            .slice()
            .sort((a, b) => a.id.localeCompare(b.id)),
        ];
    const shops = dedupeSameBrand(ranked).slice(0, TARGET_PICKS);
    const whys = uniqueWhyLines(shops, language, intent.moments);
    return {
      language,
      picks: shops.map((shop, index) => ({
        shop,
        why: whys[index] ?? shop.neighborhoodAr,
      })),
      thinCatalog: shops.length < TARGET_PICKS,
      mode: "browse",
      ...(origin ? { distanceSorted: true } : {}),
      ...asked,
    };
  }

  if (namedHits.length > 0 && !exactDistrict) {
    return searchResult({
      text: input.text,
      hits: namedHits,
      language,
      intent,
      origin: input.origin,
    });
  }

  // A vibe word ("quiet", "coffee") stays a three-pack. A bare misspelling does not.
  if (!exactDistrict && intent.moments.length === 0 && !isRecommendationAsk(input.text)) {
    const fuzzy = fuzzyNameHit(input.text, real);
    if (fuzzy?.kind === "excluded") {
      return {
        language,
        picks: [],
        thinCatalog: false,
        mode: "none",
        noMatch: true,
        matchCount: 0,
        excludedBrand: { nameEn: fuzzy.nameEn, nameAr: fuzzy.nameAr },
        ...asked,
      };
    }
    if (fuzzy?.kind === "listed") {
      const corrected = scoreCatalogShops(fuzzy.lookup, real);
      if (corrected.length > 0) {
        return searchResult({
          text: fuzzy.lookup,
          hits: corrected,
          language,
          intent,
          origin: input.origin,
          ...(fuzzy.distance > 0
            ? {
                didYouMean: { nameEn: fuzzy.nameEn, nameAr: fuzzy.nameAr },
              }
            : {}),
        });
      }
    }
  }

  if (matchedDistrict && (namedHits.length === 0 || exactDistrict)) {
    const inDistrict = citywide.filter(
      (shop) => shop.neighborhood === matchedDistrict,
    );
    const picks = pickReasonsForDistrict(
      inDistrict,
      matchedDistrict,
      language,
      intent.moments,
    );
    return {
      language,
      picks,
      thinCatalog:
        inDistrict.length < TARGET_PICKS || picks.length < TARGET_PICKS,
      mode: "browse",
      ...asked,
      matchedDistrict,
    };
  }

  if (
    namedHits.length === 0 &&
    !matchedDistrict &&
    intent.moments.length === 0 &&
    intent.neighborhoods.length === 0 &&
    !isRecommendationAsk(input.text)
  ) {
    return {
      language,
      picks: [],
      thinCatalog: false,
      mode: "none",
      noMatch: true,
      matchCount: 0,
      suggestions: pickReasonsForPopular(citywide, language, ["popular"]),
      ...asked,
    };
  }

  const available =
    intent.neighborhoods.length > 0
      ? neighborhoodTightShops(citywide, intent.neighborhoods)
      : citywide;

  const neighborhoodMatches = available.filter(
    (shop) =>
      intent.neighborhoods.length === 0 ||
      intent.neighborhoods.includes(shop.neighborhood),
  );

  const popularAsk = isPopularAsk(intent.moments);
  // Popular is a citywide rank, not a momentTag. Zero shops carry "popular".
  const momentMatches = popularAsk
    ? neighborhoodMatches
    : neighborhoodMatches.filter(
        (shop) =>
          intent.moments.length === 0 ||
          shop.momentTags.some((tag) => intent.moments.includes(tag)),
      );

  let pool = momentMatches;
  if (pool.length < TARGET_PICKS) pool = neighborhoodMatches;
  if (pool.length < TARGET_PICKS && intent.neighborhoods.length === 0) {
    pool = available;
  }
  if (pool.length < TARGET_PICKS) pool = available;

  const picks: PickReason[] = popularAsk
    ? pickReasonsForPopular(pool, language, intent.moments)
    : shopsWithUniqueWhy(
        diversify(
          dedupeSameBrand(rankShops(pool, intent.neighborhoods, intent.moments)),
          intent.moments,
        ),
        language,
        intent.moments,
      );

  const thinCatalog =
    available.length < TARGET_PICKS ||
    picks.length < TARGET_PICKS ||
    (intent.neighborhoods.length > 0 &&
      neighborhoodMatches.length < TARGET_PICKS);

  return {
    language,
    picks,
    thinCatalog,
    mode: "browse",
    askedNeighborhoods: intent.neighborhoods,
    avoidedNeighborhoods: intent.avoidedNeighborhoods,
    askedMoments: intent.moments,
  };
}

export function searchCountHeading(language: Language, count: number): string {
  if (count <= 1) return copy.searchMatchOne[language];
  if (count === 2) return copy.searchMatchTwo[language];
  const template =
    count <= 10 ? copy.searchMatchFew[language] : copy.searchMatchMany[language];
  return fill(template, { count: String(count) });
}

function excludedHeading(result: PickResult): string | null {
  const brand = result.excludedBrand;
  if (!brand) return null;
  if (brand.nameEn === "Dunkin'" || brand.nameAr === "دانكن") {
    return copy.brandNotListedDonut[result.language];
  }
  const name = result.language === "ar" ? brand.nameAr : brand.nameEn;
  return fill(copy.brandNotListed[result.language], { name });
}

export function headingForPicks(result: PickResult): string {
  const excluded = excludedHeading(result);
  if (excluded) return excluded;
  if (result.noMatch) return copy.noMatch[result.language];
  if (result.outsideArea && result.mode === "search") {
    const area = result.outsideArea;
    const name = result.language === "ar" ? area.nameAr : area.nameEn;
    const place = result.language === "ar" ? area.areaAr : area.areaEn;
    return fill(copy.searchOutsideArea[result.language], { name, area: place });
  }
  const count = result.matchCount ?? result.picks.length;
  if (result.didYouMean && result.mode === "search") {
    const name =
      result.language === "ar"
        ? result.didYouMean.nameAr
        : result.didYouMean.nameEn;
    const template =
      count <= 1
        ? copy.didYouMeanOne[result.language]
        : count <= 10
          ? copy.didYouMeanFew[result.language]
          : copy.didYouMeanMany[result.language];
    return fill(template, { name, count: String(count) });
  }
  if (result.mode === "search") return searchCountHeading(result.language, count);
  if (result.picks.length === 0) return copy.emptyCatalog[result.language];
  if (result.distanceSorted) {
    return result.picks.length === TARGET_PICKS
      ? copy.closestPicks[result.language]
      : copy.closestFewer[result.language];
  }
  return result.picks.length === TARGET_PICKS
    ? copy.threePicks[result.language]
    : copy.fewerPicks[result.language];
}

export function formatReply(result: PickResult, spoken?: string): string {
  const { language, picks, thinCatalog } = result;

  if (picks.length === 0) return headingForPicks(result);

  const lines: string[] = [];
  lines.push(spoken?.trim() || headingForPicks(result));
  lines.push("");

  picks.forEach((pick, index) => {
    const name = shopDisplayName(pick.shop, language);
    const place = neighborhoodLabel(pick.shop.neighborhood, language);
    const example = isExampleShop(pick.shop)
      ? ` · ${exampleBadge(language)}`
      : "";
    lines.push(`${index + 1}. ${name} — ${place}${example}`);
    lines.push(`   ${pick.why}`);
    lines.push(`   ${copy.maps[language]}: ${shopMapsHref(pick.shop)}`);
  });

  if (result.matchedDistrict && !districtPageHidden(result.matchedDistrict)) {
    const name = neighborhoodLabel(result.matchedDistrict, language);
    const href = `${PUBLIC_SITE_URL}${districtPath(result.matchedDistrict, language)}`;
    lines.push("");
    lines.push(`${coffeeShopsInDistrict(name, language)}: ${href}`);
  }

  if (thinCatalog) {
    lines.push("");
    lines.push(copy.thinCatalog[language]);
  }

  return lines.join("\n");
}

export function formatWhatsAppReply(
  result: PickResult,
  spoken?: string,
  ask = "",
): string {
  if (result.mode !== "search" || result.picks.length <= WHATSAPP_LIST_CAP) {
    return formatReply(result, spoken);
  }
  const listed = {
    ...result,
    picks: result.picks.slice(0, WHATSAPP_LIST_CAP),
  };
  const more = result.picks.length - WHATSAPP_LIST_CAP;
  const packId = encodePackId({
    locale: result.language,
    shopIds: result.picks.map((pick) => pick.shop.id),
    ask,
    search: true,
  });
  const href = `${PUBLIC_SITE_URL}${packSharePath(packId)}`;
  return [
    formatReply(listed, spoken),
    "",
    fill(copy.whatsAppMore[result.language], { count: String(more), url: href }),
  ].join("\n");
}

/** The cafés WhatsApp actually lists. The heading still uses matchCount. */
export function listedResultForWhatsApp(result: PickResult): PickResult {
  if (result.picks.length <= WHATSAPP_LIST_CAP) return result;
  return { ...result, picks: result.picks.slice(0, WHATSAPP_LIST_CAP) };
}

export function whatsAppLocations(result: PickResult) {
  return result.picks
    .map((pick) => shopLocation(pick.shop))
    .filter((location): location is NonNullable<typeof location> =>
      Boolean(location),
    );
}

export function toChatPicks(result: PickResult): ChatPick[] {
  return result.picks.map((pick) =>
    shopToChatPick(pick.shop, result.language, pick.why),
  );
}

export function toSuggestionPicks(result: PickResult): ChatPick[] {
  return (result.suggestions ?? []).map((pick) =>
    shopToChatPick(pick.shop, result.language, pick.why),
  );
}

export async function toChatPicksWithPlaces(
  result: PickResult,
): Promise<ChatPick[]> {
  return decorateChatPicks(
    toChatPicks(result),
    result.picks.map((pick) => pick.shop),
    result.language,
  );
}
