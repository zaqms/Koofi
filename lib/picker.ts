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
import { fuzzyNameHit, isNonWordLookup } from "./fuzzy-name";
import { isMeetHalfwayChipAsk } from "./meet-halfway";
import { coffeeShopsInDistrict } from "./directory-category";
import { haversineKm } from "./distance";
import { neighborhoodTightShops } from "./neighborhood-tight";
import { neighborhoodLabel, streetShopIdsForAsk } from "./neighborhoods";
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
  brandLabel,
  brandRows,
  groupKey,
  strongNamedGroups,
} from "./brand-search";
import {
  negatedChainBrandIds,
  normalizeShopText,
  scoreCatalogShops,
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

/** Named search lists every matching branch up to 30, the share-pack limit too. */
export const SEARCH_MATCH_CAP = 30;

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

export function isNearbyAsk(raw: string): boolean {
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

type NamedHit = { shop: Shop; score: number };

function outsideAreaLabel(
  shops: readonly Shop[],
  areaId: NeighborhoodId,
): NonNullable<PickResult["outsideArea"]> {
  const byGroup = new Map<string, Shop[]>();
  for (const shop of shops) {
    const key = groupKey(shop);
    const list = byGroup.get(key) ?? [];
    list.push(shop);
    byGroup.set(key, list);
  }
  // The brand, never one branch's full name ("Hjeen", not "Hjeen Roaster Factory").
  const rows = [...byGroup.values()].map((group) => brandLabel(group));
  return {
    nameEn: rows.map((row) => row.en).join(" and ") || "that café",
    nameAr: rows.map((row) => row.ar).join(" و ") || "هذي",
    areaEn: neighborhoodLabel(areaId, "en"),
    areaAr: neighborhoodLabel(areaId, "ar"),
  };
}

/** Score order only. Distance sorting happens on the visitor's device. */
function sortSearchHits(hits: NamedHit[]): Shop[] {
  return [...hits]
    .sort((a, b) => b.score - a.score)
    .map((hit) => hit.shop);
}

function preferAskedNeighborhood(
  shops: Shop[],
  neighborhoods: NeighborhoodId[],
): Shop[] {
  if (neighborhoods.length === 0) return shops;
  const inArea = shops.filter((shop) => neighborhoods.includes(shop.neighborhood));
  const rest = shops.filter((shop) => !neighborhoods.includes(shop.neighborhood));
  return [...inArea, ...rest];
}

/** Nearby / similar catalog shops around a named hit. No invented listings. */
function companionsForNamed(
  named: Shop,
  pool: Shop[],
  moments: MomentTag[],
): Shop[] {
  const origin = officialShopCoords(named);
  const buckets = new Map<number, Shop[]>();

  for (const shop of pool) {
    if (shop.id === named.id) continue;
    let score = isExampleShop(shop) ? 0 : 8;
    if (shop.neighborhood === named.neighborhood) score += 10;
    const coords = officialShopCoords(shop);
    if (origin && coords) {
      const km = haversineKm(origin, coords);
      if (km <= 2) score += 8;
      else if (km <= 5) score += 5;
      else if (km <= 10) score += 2;
    }
    for (const moment of moments) {
      if (shop.momentTags.includes(moment)) score += 3;
    }
    const shared = shop.momentTags.filter((tag) =>
      named.momentTags.includes(tag),
    ).length;
    score += Math.min(shared, 4);

    const bucket = buckets.get(score);
    if (bucket) bucket.push(shop);
    else buckets.set(score, [shop]);
  }

  return [...buckets.keys()]
    .sort((a, b) => b - a)
    .flatMap((score) => shuffle(buckets.get(score) ?? []));
}

/**
 * A word that only sits inside a café's name ("espresso", "address", "dr")
 * is not brand mode. Same as before search: pin the named café, add two
 * companions near it, and keep the three-cafés heading.
 */
function pickAroundNamedShops(
  named: Shop[],
  fillPool: Shop[],
  moments: MomentTag[],
): Shop[] {
  const pinned = named.slice(0, TARGET_PICKS);
  const companions = pinned[0]
    ? companionsForNamed(pinned[0], fillPool, moments)
    : fillPool;
  return diversify(
    dedupeSameBrand([...pinned, ...companions]),
    moments,
  );
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
  rows: NamedHit[];
  language: Language;
  intent: Intent;
  didYouMean?: NameSuggestion;
}): PickResult {
  let pool = input.rows;
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

  const sorted = sortSearchHits(pool);
  const shown = sorted.slice(0, SEARCH_MATCH_CAP);
  // Keep every branch. A shared why-line must not drop a second café in the same حي.
  const whys = uniqueWhyLines(shown, input.language, input.intent.moments);
  const picks = shown.map((shop, index) => ({
    shop,
    why: whys[index] ?? shop.neighborhoodAr,
  }));
  return {
    language: input.language,
    picks,
    thinCatalog: false,
    mode: "search",
    // The heading counts the cards on screen. Past the cap it also says how
    // many match, so 30 cards never pass for the whole list.
    matchCount: picks.length,
    ...(sorted.length > picks.length ? { matchTotal: sorted.length } : {}),
    ...(outsideArea ? { outsideArea } : {}),
    ...(input.didYouMean ? { didYouMean: input.didYouMean } : {}),
    askedNeighborhoods: input.intent.neighborhoods,
    avoidedNeighborhoods: input.intent.avoidedNeighborhoods,
    askedMoments: input.intent.moments,
  };
}

/** Brand mode when the ask names a brand outright; null for a weak word match. */
function brandSearch(input: {
  text: string;
  hits: NamedHit[];
  real: readonly Shop[];
  language: Language;
  intent: Intent;
  didYouMean?: NameSuggestion;
}): PickResult | null {
  const groups = strongNamedGroups(input.text, input.hits, input.real);
  if (groups.length === 0) return null;
  const rows = brandRows(input.text, groups, input.real, input.intent.neighborhoods);
  if (rows.length === 0) return null;
  return searchResult({
    rows,
    language: input.language,
    intent: input.intent,
    ...(input.didYouMean ? { didYouMean: input.didYouMean } : {}),
  });
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

  // Typed "nearby" is the Nearby chip on the device (the pin never leaves it).
  // If it reaches the server, it is a popular three-pack.
  if (isNearbyAsk(input.text)) {
    const ranked = [
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
      ...asked,
    };
  }

  if (namedHits.length > 0 && !exactDistrict) {
    const brand = brandSearch({
      text: input.text,
      hits: namedHits,
      real,
      language,
      intent,
    });
    if (brand) return brand;
  }

  const streetIds = streetShopIdsForAsk(input.text);
  // A failed café-name lookup is the only empty state. Set below.
  let nameLookupFailed = false;

  // A vibe word ("quiet", "coffee") stays a three-pack. A bare misspelling does not.
  if (
    namedHits.length === 0 &&
    !exactDistrict &&
    !streetIds &&
    intent.moments.length === 0 &&
    !isRecommendationAsk(input.text)
  ) {
    const fuzzy = fuzzyNameHit(input.text, real);
    if (fuzzy?.kind === "ambiguous") nameLookupFailed = true;
    if (fuzzy?.kind === "excluded") {
      return {
        language,
        picks: [],
        thinCatalog: false,
        mode: "none",
        noMatch: true,
        matchCount: 0,
        excludedBrand: {
          nameEn: fuzzy.nameEn,
          nameAr: fuzzy.nameAr,
          ...(fuzzy.donut ? { donut: true } : {}),
        },
        ...asked,
      };
    }
    if (fuzzy?.kind === "listed") {
      const corrected = scoreCatalogShops(fuzzy.lookup, real);
      const brand = corrected.length
        ? brandSearch({
            text: fuzzy.lookup,
            hits: corrected,
            real,
            language,
            intent,
            ...(fuzzy.distance > 0
              ? { didYouMean: { nameEn: fuzzy.nameEn, nameAr: fuzzy.nameAr } }
              : {}),
          })
        : null;
      if (brand) return brand;
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

  if (!matchedDistrict && streetIds) {
    const allowed = new Set(streetIds);
    const pool = citywide.filter((shop) => allowed.has(shop.id));
    if (pool.length > 0) {
      const picks: PickReason[] = shopsWithUniqueWhy(
        diversify(
          dedupeSameBrand(rankShops(pool, [], intent.moments)),
          intent.moments,
        ),
        language,
        intent.moments,
      );
      return {
        language,
        picks,
        thinCatalog: pool.length < TARGET_PICKS || picks.length < TARGET_PICKS,
        mode: "browse",
        askedNeighborhoods: intent.neighborhoods,
        avoidedNeighborhoods: intent.avoidedNeighborhoods,
        askedMoments: intent.moments,
      };
    }
  }

  // Weak name match ("espresso", "address", "dr"): the pre-search behaviour.
  // A moment ask ("drive through", «درايف ثرو») stays a moment three-pack.
  if (namedHits.length > 0 && intent.moments.length === 0) {
    const named = preferAskedNeighborhood(
      namedHits.map((hit) => hit.shop),
      intent.neighborhoods,
    );
    const pinned = named.filter((shop) => !avoided.has(shop.neighborhood));
    const lead = pinned.length > 0 ? pinned : named;
    const fillPool = citywide.filter(
      (shop) => !lead.some((hit) => hit.id === shop.id),
    );
    const nearbyFill =
      intent.neighborhoods.length > 0
        ? neighborhoodTightShops(fillPool, intent.neighborhoods)
        : fillPool;
    const ranked = pickAroundNamedShops(
      lead,
      nearbyFill.length >= TARGET_PICKS - 1 ? nearbyFill : fillPool,
      intent.moments,
    );
    const picks: PickReason[] = shopsWithUniqueWhy(ranked, language, intent.moments);
    const availableForThin = citywide.length > 0 ? citywide : catalog;
    return {
      language,
      picks,
      thinCatalog:
        availableForThin.length < TARGET_PICKS || picks.length < TARGET_PICKS,
      mode: "browse",
      ...asked,
    };
  }

  // Nothing names a café. Only a failed name lookup gets the no-match reply:
  // a whole-ask near-miss on two names, or a non-word ("xyzcafe123").
  // Everything else («كابتشينو», "cheap", «مفتوح الحين», ☕) is main's three-pack.
  if (
    namedHits.length === 0 &&
    !matchedDistrict &&
    !streetIds &&
    intent.moments.length === 0 &&
    intent.neighborhoods.length === 0 &&
    negatedChainBrandIds(input.text).size === 0 &&
    (nameLookupFailed || isNonWordLookup(input.text))
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
  if (brand.donut) return fill(copy.brandNotListedDonutNamed[result.language], { name });
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
  const total = result.matchTotal ?? 0;
  if (result.mode === "search" && total > count) {
    const values = { count: String(count), total: String(total) };
    if (result.didYouMean) {
      const name =
        result.language === "ar"
          ? result.didYouMean.nameAr
          : result.didYouMean.nameEn;
      return fill(copy.didYouMeanCapped[result.language], { ...values, name });
    }
    return fill(copy.searchMatchCapped[result.language], values);
  }
  if (result.didYouMean && result.mode === "search") {
    const name =
      result.language === "ar"
        ? result.didYouMean.nameAr
        : result.didYouMean.nameEn;
    const template =
      count <= 1
        ? copy.didYouMeanOne[result.language]
        : count === 2
          ? copy.didYouMeanTwo[result.language]
          : count <= 10
          ? copy.didYouMeanFew[result.language]
          : copy.didYouMeanMany[result.language];
    return fill(template, { name, count: String(count) });
  }
  if (result.mode === "search") return searchCountHeading(result.language, count);
  if (result.picks.length === 0) return copy.emptyCatalog[result.language];
  // Unused until the owner signs off on retiring the locked heading; nothing sets distanceSorted.
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

/** The cafés WhatsApp actually lists. The heading counts every card in the result. */
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
