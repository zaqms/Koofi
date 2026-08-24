import type { Language, MomentTag } from "./types";

const ARABIC_SCRIPT = /[\u0600-\u06FF]/;

const VIBE_EN: Record<string, string> = {
  قهوة: "Coffee",
  محمصة: "Roastery",
  معجنات: "Pastry",
  هادئ: "Quiet",
  فلتر: "Filter",
  كاونتر: "Counter",
  طاولات: "Tables",
  لابتوب: "Laptop",
  قعدة: "Hangout",
  متأخر: "Late",
  أصحاب: "Friends",
  كرواسون: "Croissant",
  فنجان: "Cup",
  برا: "Outdoor",
  جلسة: "Seating",
  هواء: "Airy",
  دراسة: "Study",
};

const MOMENT_EN: Record<MomentTag, string> = {
  work: "Work",
  friend: "Friends",
  qahwa: "Coffee",
  roaster: "Roastery",
  quiet: "Quiet",
  late: "Late",
  popular: "Popular",
  pastry: "Pastry",
  study: "Study",
  outdoor: "Outdoor",
  date: "Date",
};

export type VibeSource = {
  vibeTags: string[];
  momentTags?: readonly MomentTag[];
};

function unique(labels: string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const label of labels) {
    if (!label || seen.has(label)) continue;
    seen.add(label);
    next.push(label);
  }
  return next;
}

function englishFromVibeTag(tag: string): string | null {
  const mapped = VIBE_EN[tag];
  if (mapped) return mapped;
  if (ARABIC_SCRIPT.test(tag)) return null;
  return tag;
}

/** Display-time vibe labels. EN never returns Arabic script. */
export function vibeLabels(shop: VibeSource, language: Language): string[] {
  if (language === "ar") {
    return unique(shop.vibeTags).slice(0, 3);
  }

  const fromVibe = unique(
    shop.vibeTags
      .map((tag) => englishFromVibeTag(tag))
      .filter((label): label is string => Boolean(label)),
  );
  if (fromVibe.length > 0) return fromVibe.slice(0, 3);

  const fromMoment = unique(
    (shop.momentTags ?? []).map((moment) => MOMENT_EN[moment]),
  );
  if (fromMoment.length > 0) return fromMoment.slice(0, 3);

  return ["Coffee"];
}

export function vibeLine(shop: VibeSource, language: Language): string {
  return vibeLabels(shop, language).join(" · ");
}
