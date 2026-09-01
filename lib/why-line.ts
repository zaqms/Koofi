import { neighborhoodLabel } from "./neighborhoods";
import type { Language, MomentTag, Shop } from "./types";

/** Why-line sources Amjad locked. Hours are never invented. */
const WHY_MOMENTS = [
  "roaster",
  "outdoor",
  "late",
  "pastry",
  "date",
  "work",
  "study",
  "quiet",
] as const satisfies readonly MomentTag[];

type WhyMoment = (typeof WHY_MOMENTS)[number];

const WHY_LINES: Record<WhyMoment, Record<Language, readonly [string, string]>> =
  {
    roaster: {
      ar: ["للمحمص، إذا تبي البن", "محمصة لو تبي فلتر"],
      en: ["For the roastery, if you want beans", "A roaster if you want filter"],
    },
    outdoor: {
      ar: ["جلسة برا", "جلسة برا ومكان هادي"],
      en: ["Outdoor seating", "Outdoor seating, quieter outside"],
    },
    late: {
      ar: ["للأمسية", "لقعدة متأخرة"],
      en: ["For the evening", "For a late sit"],
    },
    pastry: {
      ar: ["للمعجنات مع القهوة", "إذا تبي معجنات"],
      en: ["Pastry with the coffee", "If you want pastry"],
    },
    date: {
      ar: ["لموعد هادي", "لموعد، مو زحمة"],
      en: ["For a quiet date", "For a date, not the rush"],
    },
    work: {
      ar: ["لقعدة شغل", "طاولة ولابتوب"],
      en: ["For a work sit", "A table and a laptop"],
    },
    study: {
      ar: ["للمذاكرة", "أهدى للمذاكرة"],
      en: ["For studying", "Quieter for studying"],
    },
    quiet: {
      ar: ["جلسة هادية", "مكان هادي"],
      en: ["A quiet sit", "A calmer room"],
    },
  };

function isWhyMoment(tag: MomentTag): tag is WhyMoment {
  return (WHY_MOMENTS as readonly string[]).includes(tag);
}

function vibeWhyMoments(shop: Pick<Shop, "vibeTags">): WhyMoment[] {
  const extra: WhyMoment[] = [];
  for (const tag of shop.vibeTags) {
    if (tag === "محمصة" || tag === "فلتر") extra.push("roaster");
    if (tag === "برا" || tag === "هواء" || tag === "جلسة") extra.push("outdoor");
    if (tag === "معجنات" || tag === "كرواسون") extra.push("pastry");
    if (tag === "لابتوب" || tag === "كاونتر" || tag === "طاولات") extra.push("work");
    if (tag === "هادئ" || tag === "هادي" || tag === "دراسة") {
      extra.push(tag === "دراسة" ? "study" : "quiet");
    }
    if (tag === "متأخر") extra.push("late");
  }
  return extra;
}

function shopWhyMoments(
  shop: Pick<Shop, "momentTags" | "vibeTags">,
  asked: readonly MomentTag[],
): WhyMoment[] {
  const ordered: WhyMoment[] = [];
  const add = (moment: WhyMoment) => {
    if (!ordered.includes(moment)) ordered.push(moment);
  };

  for (const moment of asked) {
    if (isWhyMoment(moment) && shop.momentTags.includes(moment)) add(moment);
  }
  for (const moment of WHY_MOMENTS) {
    if (shop.momentTags.includes(moment)) add(moment);
  }
  for (const moment of vibeWhyMoments(shop)) add(moment);
  return ordered;
}

function neighborhoodWhy(
  shop: Pick<Shop, "neighborhood">,
  language: Language,
): string {
  const area = neighborhoodLabel(shop.neighborhood, language);
  return language === "ar" ? `في ${area}` : `In ${area}`;
}

/**
 * One short why-line per shop, unique inside the pack, from real tags only.
 * If two shops would share a sentence, the next real tag is used.
 * If nothing distinctive remains, the weaker shop is dropped by the caller
 * when `unique` cannot be satisfied — this helper still returns a last-resort
 * neighborhood line rather than inventing hours.
 */
export function uniqueWhyLines(
  shops: Pick<Shop, "neighborhood" | "momentTags" | "vibeTags">[],
  language: Language,
  asked: readonly MomentTag[] = [],
): string[] {
  const used = new Set<string>();
  const usedMoments = new Set<WhyMoment>();
  return shops.map((shop) => {
    const moments = shopWhyMoments(shop, asked);
    for (const moment of moments) {
      if (usedMoments.has(moment)) continue;
      for (const line of WHY_LINES[moment][language]) {
        if (used.has(line)) continue;
        used.add(line);
        usedMoments.add(moment);
        return line;
      }
    }
    for (const moment of moments) {
      for (const line of WHY_LINES[moment][language]) {
        if (used.has(line)) continue;
        used.add(line);
        return line;
      }
    }
    const fallback = neighborhoodWhy(shop, language);
    if (!used.has(fallback)) {
      used.add(fallback);
      return fallback;
    }
    const vibe = shop.vibeTags.find((tag) => tag && !used.has(tag));
    if (vibe) {
      const line =
        language === "ar" ? `${fallback} — ${vibe}` : `${fallback} — ${vibe}`;
      if (!used.has(line)) {
        used.add(line);
        return line;
      }
    }
    return fallback;
  });
}

export function shopsWithUniqueWhy<T extends Shop>(
  shops: T[],
  language: Language,
  asked: readonly MomentTag[] = [],
): { shop: T; why: string }[] {
  if (shops.length === 0) return [];

  let chosen = shops;
  let whys = uniqueWhyLines(chosen, language, asked);

  while (chosen.length > 1) {
    const seen = new Set<string>();
    const clash = whys.findIndex((why) => {
      if (seen.has(why)) return true;
      seen.add(why);
      return false;
    });
    if (clash === -1) break;
    chosen = chosen.filter((_, index) => index !== clash);
    whys = uniqueWhyLines(chosen, language, asked);
  }

  return chosen.map((shop, index) => ({
    shop,
    why: whys[index] ?? neighborhoodWhy(shop, language),
  }));
}
