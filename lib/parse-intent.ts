import { detectLanguage } from "./language";
import { NEIGHBORHOODS } from "./neighborhoods";
import { VIBE_CHIPS } from "./product";
import type { Intent, MomentTag, NeighborhoodId } from "./types";

const EXTRA_ALIASES: Record<MomentTag, string[]> = {
  work: [
    "مناسب للشغل",
    "شغل",
    "قعدة شغل",
    "أشتغل",
    "اشتغل",
    "أعمل",
    "لابتوب",
    "لاب توب",
    "ميتنق",
    "work",
    "laptop",
    "meeting",
    "office",
  ],
  friend: [
    "أصحاب",
    "اصحاب",
    "قعدة",
    "قعده",
    "صحبي",
    "صديق",
    "friends",
    "friend",
    "hangout",
    "catch up",
  ],
  qahwa: [
    "قهوة",
    "قهوه",
    "فنجان",
    "قهاوي",
    "qahwa",
    "coffee",
    "cafe",
    "café",
  ],
  roaster: [
    "محمصة",
    "محمصه",
    "محامص",
    "مختصة",
    "مختصه",
    "قهوة مختصة",
    "قهوه مختصه",
    "فلتر",
    "روستر",
    "roaster",
    "roastery",
    "roasteries",
    "filter",
    "pour over",
    "specialty",
    "specialty coffee",
  ],
  quiet: [
    "هادئ",
    "هادي",
    "هدوء",
    "دافئ وهادئ",
    "دافئ",
    "جلسة هادية",
    "أقرأ",
    "اقرا",
    "quiet",
    "cozy",
    "calm",
    "silent",
    "read",
  ],
  late: [
    "مفتوح لوقت متأخر",
    "بالليل",
    "متأخر",
    "متأخرة",
    "سهران",
    "آخر الليل",
    "اخر الليل",
    "open late",
    "late",
    "night",
    "evening",
  ],
  popular: [
    "طلبا",
    "مطلوب",
    "الأكثر طلباً",
    "الأكثر طلبا",
    "اللي عليها طلب",
    "ترند",
    "popular",
    "most popular",
    "most requested",
    "trending",
    "trendy",
  ],
  pastry: [
    "معجنات",
    "معجنه",
    "كرواسون",
    "مخبز",
    "أفضل معجنات",
    "pastry",
    "pastries",
    "croissant",
    "bakery",
    "best pastries",
  ],
  study: [
    "مناسب للدراسة",
    "دراسة",
    "ادرس",
    "مذاكرة",
    "مذاكره",
    "study",
    "studies",
    "homework",
  ],
  outdoor: [
    "برا",
    "تيراس",
    "جلسة برا",
    "outdoor",
    "outside",
    "patio",
    "terrace",
  ],
  date: [
    "مناسب لموعد",
    "لموعد",
    "موعد",
    "ديت",
    "date",
    "dating",
    "good for a date",
    "for two",
    "لاثنين",
  ],
  matcha: [
    "ماتشا",
    "ماتشه",
    "matcha",
    "matcha latte",
  ],
  "drive-through": [
    "طلبات السياره",
    "درايف ثرو",
    "drive-through",
    "drive through",
    "drive-thru",
    "drive thru",
    "drivethrough",
  ],
};

function chipAliases(moment: MomentTag): string[] {
  return VIBE_CHIPS.filter((chip) => chip.momentTag === moment).flatMap(
    (chip) => [chip.ar, chip.en],
  );
}

const MOMENT_ALIASES: Record<MomentTag, string[]> = {
  work: [...chipAliases("work"), ...EXTRA_ALIASES.work],
  friend: [...chipAliases("friend"), ...EXTRA_ALIASES.friend],
  qahwa: [...chipAliases("qahwa"), ...EXTRA_ALIASES.qahwa],
  roaster: [...chipAliases("roaster"), ...EXTRA_ALIASES.roaster],
  quiet: [...chipAliases("quiet"), ...EXTRA_ALIASES.quiet],
  late: [...chipAliases("late"), ...EXTRA_ALIASES.late],
  popular: [...chipAliases("popular"), ...EXTRA_ALIASES.popular],
  pastry: [...chipAliases("pastry"), ...EXTRA_ALIASES.pastry],
  study: [...chipAliases("study"), ...EXTRA_ALIASES.study],
  outdoor: [...chipAliases("outdoor"), ...EXTRA_ALIASES.outdoor],
  date: [...chipAliases("date"), ...EXTRA_ALIASES.date],
  matcha: [...chipAliases("matcha"), ...EXTRA_ALIASES.matcha],
  "drive-through": [
    ...chipAliases("drive-through"),
    ...EXTRA_ALIASES["drive-through"],
  ],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/(^|\s)ال(?=\p{L})/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAlias(haystack: string, alias: string): boolean {
  const needle = normalize(alias);
  if (!needle) return false;
  if (needle.includes(" ")) return haystack.includes(needle);
  const pattern = new RegExp(`(^|\\s)${escapeRegExp(needle)}(\\s|$)`, "u");
  return pattern.test(haystack);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function exactChipMoment(haystack: string): MomentTag | null {
  for (const chip of VIBE_CHIPS) {
    if (normalize(chip.ar) === haystack || normalize(chip.en) === haystack) {
      return chip.momentTag;
    }
  }
  return null;
}

const AVOID_MARKERS = [
  "ابعد عن",
  "بعيد عن",
  "away from",
  "stay away from",
  "not in",
  "except",
  "other than",
  "besides",
  "بدون",
  "غير",
  "مو في",
].map((marker) => normalize(marker));

function aliasIndex(haystack: string, alias: string): number {
  const needle = normalize(alias);
  if (!needle) return -1;
  if (needle.includes(" ")) return haystack.indexOf(needle);
  const match = haystack.match(
    new RegExp(`(^|\\s)(${escapeRegExp(needle)})(\\s|$)`, "u"),
  );
  if (!match || match.index == null) return -1;
  return match.index + match[1].length;
}

function isAvoidedMention(haystack: string, alias: string): boolean {
  const index = aliasIndex(haystack, alias);
  if (index < 0) return false;
  const before = haystack.slice(Math.max(0, index - 24), index);
  return AVOID_MARKERS.some((marker) => before.includes(marker));
}

export function parseIntent(raw: string): Intent {
  const haystack = normalize(raw);
  const neighborhoods: NeighborhoodId[] = [];
  const avoidedNeighborhoods: NeighborhoodId[] = [];

  for (const place of Object.values(NEIGHBORHOODS)) {
    const hit = place.aliases.find((alias) => includesAlias(haystack, alias));
    if (!hit) continue;
    if (isAvoidedMention(haystack, hit)) {
      avoidedNeighborhoods.push(place.id);
    } else {
      neighborhoods.push(place.id);
    }
  }

  const exactMoment = exactChipMoment(haystack);
  const moments: MomentTag[] = [];

  if (exactMoment) {
    moments.push(exactMoment);
  } else {
    for (const [moment, aliases] of Object.entries(MOMENT_ALIASES) as [
      MomentTag,
      string[],
    ][]) {
      if (aliases.some((alias) => includesAlias(haystack, alias))) {
        moments.push(moment);
      }
    }
  }

  return {
    language: detectLanguage(raw),
    neighborhoods,
    avoidedNeighborhoods,
    moments,
    raw,
  };
}
