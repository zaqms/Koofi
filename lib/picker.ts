import { listShops } from "./catalog";
import { copy } from "./copy";
import { neighborhoodLabel } from "./neighborhoods";
import { parseIntent } from "./parse-intent";
import {
  cardPath,
  exampleBadge,
  isExampleShop,
  shopDisplayName,
} from "./product";
import type {
  ChatPick,
  Language,
  MomentTag,
  NeighborhoodId,
  PickReason,
  PickResult,
  Shop,
} from "./types";

const TARGET_PICKS = 3;

function editorialWhy(shop: Shop, moments: MomentTag[], language: Language): string {
  const hit = moments.find((moment) => shop.momentTags.includes(moment));
  const neighborhood = neighborhoodLabel(shop.neighborhood, language);

  const reasons: Record<MomentTag, Record<Language, string>> = {
    work: {
      ar: `للشغل في ${neighborhood} — طاولة وهدوء أكثر من ضجيج.`,
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
      ar: `أهدى خيار عندي في ${neighborhood} لهالحين.`,
      en: `The quieter fit I have in ${neighborhood} right now.`,
    },
    late: {
      ar: `لقعدة متأخرة في ${neighborhood}.`,
      en: `For a late sit in ${neighborhood}.`,
    },
  };

  if (hit) return reasons[hit][language];

  return language === "ar"
    ? `تناسب ${neighborhood} بهالأجواء: ${shop.vibeTags.slice(0, 2).join("، ")}.`
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

function sortShops(
  shops: Shop[],
  neighborhoods: NeighborhoodId[],
  moments: MomentTag[],
): Shop[] {
  return [...shops].sort((a, b) => {
    const delta =
      scoreShop(b, neighborhoods, moments) - scoreShop(a, neighborhoods, moments);
    if (delta !== 0) return delta;
    return a.id.localeCompare(b.id);
  });
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
}): PickResult {
  const intent = parseIntent(input.text);
  const been = new Set((input.beenIds ?? []).filter(Boolean));
  const available = listShops().filter((shop) => !been.has(shop.id));

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
    sortShops(pool, intent.neighborhoods, intent.moments),
    intent.moments,
  );

  const picks: PickReason[] = ranked.map((shop) => ({
    shop,
    why: editorialWhy(shop, intent.moments, intent.language),
  }));

  const thinCatalog =
    available.length < TARGET_PICKS ||
    picks.length < TARGET_PICKS ||
    (intent.neighborhoods.length > 0 &&
      neighborhoodMatches.length < TARGET_PICKS);

  return {
    language: intent.language,
    picks,
    thinCatalog,
    askedNeighborhoods: intent.neighborhoods,
    askedMoments: intent.moments,
  };
}

export function formatReply(result: PickResult): string {
  const { language, picks, thinCatalog } = result;

  if (picks.length === 0) return copy.emptyCatalog[language];

  const lines: string[] = [];
  lines.push(
    picks.length === TARGET_PICKS
      ? copy.threePicks[language]
      : copy.fewerPicks[language],
  );
  lines.push("");

  picks.forEach((pick, index) => {
    const name = shopDisplayName(pick.shop, language);
    const place = neighborhoodLabel(pick.shop.neighborhood, language);
    const example = isExampleShop(pick.shop)
      ? ` · ${exampleBadge(language)}`
      : "";
    lines.push(`${index + 1}. ${name} — ${place}${example}`);
    lines.push(`   ${pick.why}`);
  });

  if (thinCatalog) {
    lines.push("");
    lines.push(copy.thinCatalog[language]);
  }

  return lines.join("\n");
}

export function formatWhatsAppReply(
  result: PickResult,
  cardHref: (id: string) => string,
): string {
  const body = formatReply(result);
  if (result.picks.length === 0) return body;

  const extras = result.picks.map((pick) => {
    const label =
      result.language === "ar" ? copy.cardLink.ar : copy.cardLink.en;
    return `${label}: ${cardHref(pick.shop.id)}`;
  });

  return `${body}\n\n${extras.join("\n")}`;
}

export function toChatPicks(result: PickResult): ChatPick[] {
  return result.picks.map((pick) => ({
    id: pick.shop.id,
    nameAr: pick.shop.nameAr,
    nameEn: pick.shop.nameEn,
    neighborhoodLabel: neighborhoodLabel(
      pick.shop.neighborhood,
      result.language,
    ),
    example: isExampleShop(pick.shop),
    why: pick.why,
    cardPath: cardPath(pick.shop.id),
  }));
}
