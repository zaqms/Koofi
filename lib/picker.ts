import { listRealShops } from "./catalog";
import { shopToChatPick } from "./chat-pick";
import { copy } from "./copy";
import { neighborhoodLabel } from "./neighborhoods";
import { parseIntent } from "./parse-intent";
import {
  exampleBadge,
  isExampleShop,
  shopDisplayName,
} from "./product";
import { decorateChatPicks } from "./places";
import { shopLocation, shopMapsHref } from "./public-url";
import type {
  ChatPick,
  Language,
  MomentTag,
  NeighborhoodId,
  PickReason,
  PickResult,
  Shop,
} from "./types";

/** Always aim for three cards. Never collapse to a single pick when three shops exist. */
const TARGET_PICKS = 3;

function editorialWhy(shop: Shop, moments: MomentTag[], language: Language): string {
  const hit = moments.find((moment) => shop.momentTags.includes(moment));
  const neighborhood = neighborhoodLabel(shop.neighborhood, language);

  const reasons: Record<MomentTag, Record<Language, string>> = {
    work: {
      ar: `لقعدة شغل في ${neighborhood} — طاولة وهدوء، مو زحمة.`,
      en: `For work in ${neighborhood} — a table and quiet over buzz.`,
    },
    friend: {
      ar: `قعدة مع أحد في ${neighborhood}، مو عشان قائمة أفضل قهوة.`,
      en: `A hangout in ${neighborhood}, not a "best of Riyadh" list.`,
    },
    qahwa: {
      ar: `فنجان في ${neighborhood} بهالوقت، على مزاج القهوة مو التقييم.`,
      en: `A cup in ${neighborhood} right now — reason over rating.`,
    },
    roaster: {
      ar: `محمصة في ${neighborhood} لو تبي فلتر وتتكلم قهوة.`,
      en: `A roaster in ${neighborhood} if you want filter and coffee talk.`,
    },
    quiet: {
      ar: `أهدى وحدة عندي في ${neighborhood} لهالحين.`,
      en: `The quieter fit I have in ${neighborhood} right now.`,
    },
    late: {
      ar: `لقعدة متأخرة في ${neighborhood}.`,
      en: `For a late sit in ${neighborhood}.`,
    },
    popular: {
      ar: `من اللي عليها طلب عندي في ${neighborhood} بهالحين.`,
      en: `Among the more asked-for fits I have in ${neighborhood} right now.`,
    },
    pastry: {
      ar: `لو تبي معجنات مع القهوة في ${neighborhood}.`,
      en: `If you want pastry with the coffee in ${neighborhood}.`,
    },
    study: {
      ar: `لقعدة مذاكرة في ${neighborhood} — أهدى من الزحمة.`,
      en: `For studying in ${neighborhood} — quieter than the rush.`,
    },
    outdoor: {
      ar: `جلسة برا في ${neighborhood}.`,
      en: `Outdoor seating in ${neighborhood}.`,
    },
    date: {
      ar: `لموعد هادي في ${neighborhood}.`,
      en: `For a date in ${neighborhood}.`,
    },
  };

  if (hit) return reasons[hit][language];

  return language === "ar"
    ? `تمشي مع ${neighborhood} بهالجو: ${shop.vibeTags.slice(0, 2).join("، ")}.`
    : `Fits ${neighborhood} for this moment.`;
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

export function pickCafes(input: {
  text: string;
  beenIds?: string[];
  language?: Language;
}): PickResult {
  const intent = parseIntent(input.text);
  const language = input.language ?? intent.language;
  const been = new Set((input.beenIds ?? []).filter(Boolean));
  const avoided = new Set(intent.avoidedNeighborhoods);
  const available = listRealShops().filter(
    (shop) => !been.has(shop.id) && !avoided.has(shop.neighborhood),
  );

  const neighborhoodMatches = available.filter(
    (shop) =>
      intent.neighborhoods.length === 0 ||
      intent.neighborhoods.includes(shop.neighborhood),
  );

  const momentMatches = neighborhoodMatches.filter(
    (shop) =>
      intent.moments.length === 0 ||
      shop.momentTags.some((tag) => intent.moments.includes(tag)),
  );

  let pool = momentMatches;
  if (pool.length < TARGET_PICKS) pool = neighborhoodMatches;
  if (pool.length < TARGET_PICKS) pool = available;

  const ranked = diversify(
    rankShops(pool, intent.neighborhoods, intent.moments),
    intent.moments,
  );

  const picks: PickReason[] = ranked.map((shop) => ({
    shop,
    why: editorialWhy(shop, intent.moments, language),
  }));

  const thinCatalog =
    available.length < TARGET_PICKS ||
    picks.length < TARGET_PICKS ||
    (intent.neighborhoods.length > 0 &&
      neighborhoodMatches.length < TARGET_PICKS);

  return {
    language,
    picks,
    thinCatalog,
    askedNeighborhoods: intent.neighborhoods,
    avoidedNeighborhoods: intent.avoidedNeighborhoods,
    askedMoments: intent.moments,
  };
}

export function headingForPicks(result: PickResult): string {
  if (result.picks.length === 0) return copy.emptyCatalog[result.language];
  return result.picks.length === TARGET_PICKS
    ? copy.threePicks[result.language]
    : copy.fewerPicks[result.language];
}

export function formatReply(result: PickResult, spoken?: string): string {
  const { language, picks, thinCatalog } = result;

  if (picks.length === 0) return copy.emptyCatalog[language];

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

export async function toChatPicksWithPlaces(
  result: PickResult,
): Promise<ChatPick[]> {
  return decorateChatPicks(
    toChatPicks(result),
    result.picks.map((pick) => pick.shop),
    result.language,
  );
}
