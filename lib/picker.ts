import {
  chainBrandSearchAliases,
  isChainBrandId,
  isChainShop,
} from "./chain-brands";
import { isDriveThroughLane, listRealShops } from "./catalog";
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
import { NEIGHBORHOODS, neighborhoodLabel } from "./neighborhoods";
import { officialShopCoords } from "./place-coords";
import { parseIntent } from "./parse-intent";
import {
  PUBLIC_SITE_URL,
  districtPath,
  exampleBadge,
  isExampleShop,
  shopDisplayName,
} from "./product";
import { decorateChatPicks } from "./places";
import { shopLocation, shopMapsHref } from "./public-url";
import { dedupeSameBrand, shopBrandKey } from "./shop-brand";
import { normalizeShopText, scoreCatalogShops } from "./shop-name";
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

/** Named search returns every matching branch, then stops. dr.CAFE is the long list. */
const SEARCH_MATCH_CAP = 30;

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripNeighborhoodWords(
  normalized: string,
  ids: readonly NeighborhoodId[],
): string {
  let hay = normalized;
  const aliases = ids
    .flatMap((id) => {
      const place = NEIGHBORHOODS[id];
      return [place.id, place.en, place.ar, ...place.aliases];
    })
    .map((alias) => normalizeShopText(alias))
    .filter((alias) => alias.length >= 3)
    .sort((a, b) => b.length - a.length);
  for (const alias of aliases) {
    const pattern = new RegExp(
      `(^|\\s)${escapeRegExp(alias)}(\\s|$)`,
      "gu",
    );
    hay = hay.replace(pattern, " ");
  }
  return hay.replace(/\s+/g, " ").trim();
}

function compactLetters(text: string): string {
  return text.replace(/[\s-]+/g, "");
}

function sameAlias(left: string, right: string): boolean {
  if (!left || !right) return false;
  if (left === right) return true;
  const compactLeft = compactLetters(left);
  const compactRight = compactLetters(right);
  return compactRight.length >= 4 && compactLeft === compactRight;
}

/** "ستاربكس" / "ستار بكس" / "Starbucks Al Mathar" name the brand. "starbucks panorama" names one branch. */
function isBrandWideAsk(
  raw: string,
  hits: readonly { shop: Shop }[],
  neighborhoods: readonly NeighborhoodId[],
): boolean {
  const stripped = stripNeighborhoodWords(
    normalizeShopText(raw),
    neighborhoods,
  );
  if (!stripped) return false;
  const shops = hits.map((hit) => hit.shop);
  const brandIds = new Set(
    shops.flatMap((shop) =>
      shop.chainBrand && isChainBrandId(shop.chainBrand)
        ? [shop.chainBrand]
        : [],
    ),
  );
  if (brandIds.size === 1) {
    const id = [...brandIds][0];
    if (id && isChainBrandId(id)) {
      for (const alias of chainBrandSearchAliases(id)) {
        if (sameAlias(stripped, normalizeShopText(alias))) return true;
      }
    }
  }
  const keys = new Set(shops.map((shop) => shopBrandKey(shop)));
  if (keys.size !== 1) return false;
  const key = [...keys][0]?.replace(/-/g, " ") ?? "";
  if (sameAlias(stripped, normalizeShopText(key))) return true;
  const namesEn = new Set(shops.map((shop) => normalizeShopText(shop.nameEn)));
  const namesAr = new Set(shops.map((shop) => normalizeShopText(shop.nameAr)));
  if (namesEn.size === 1 && sameAlias(stripped, [...namesEn][0] ?? "")) {
    return true;
  }
  if (namesAr.size === 1 && sameAlias(stripped, [...namesAr][0] ?? "")) {
    return true;
  }
  return false;
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
  let pool = input.hits;
  const brandWide = isBrandWideAsk(
    input.text,
    pool,
    input.intent.neighborhoods,
  );
  if (input.intent.neighborhoods.length > 0) {
    const inArea = pool.filter((hit) =>
      input.intent.neighborhoods.includes(hit.shop.neighborhood),
    );
    if (inArea.length > 0) pool = inArea;
  }
  if (!brandWide && pool.length > 0) {
    const best = Math.max(...pool.map((hit) => hit.score));
    pool = pool.filter((hit) => hit.score === best);
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
  // Generic three-picks stay local. A chain is never specialty.
  const catalog = real.filter(
    (shop) => !isDriveThroughLane(shop) && !isChainShop(shop),
  );
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
  if (!exactDistrict && intent.moments.length === 0) {
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
    intent.neighborhoods.length === 0
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
  if (result.mode === "search") {
    if (count <= 1) return copy.searchMatchOne[result.language];
    if (count === 2) return copy.searchMatchTwo[result.language];
    const template =
      count <= 10 ? copy.searchMatchFew[result.language] : copy.searchMatchMany[result.language];
    return fill(template, { count: String(count) });
  }
  if (result.picks.length === 0) return copy.emptyCatalog[result.language];
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
): string {
  return formatReply(result, spoken);
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
