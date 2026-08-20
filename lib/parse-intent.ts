import { detectLanguage } from "./language";
import { NEIGHBORHOODS } from "./neighborhoods";
import type { Intent, MomentTag, NeighborhoodId } from "./types";

const MOMENT_ALIASES: Record<MomentTag, string[]> = {
  work: [
    "شغل",
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
    "مختصة",
    "مختصه",
    "فلتر",
    "روستر",
    "roaster",
    "filter",
    "pour over",
    "specialty",
  ],
  quiet: [
    "هادئ",
    "هادي",
    "هدوء",
    "أقرأ",
    "اقرا",
    "quiet",
    "calm",
    "silent",
    "read",
  ],
  late: [
    "بالليل",
    "متأخر",
    "متأخرة",
    "سهران",
    "آخر الليل",
    "اخر الليل",
    "late",
    "night",
    "evening",
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

export function parseIntent(raw: string): Intent {
  const haystack = normalize(raw);
  const neighborhoods: NeighborhoodId[] = [];

  for (const place of Object.values(NEIGHBORHOODS)) {
    if (place.aliases.some((alias) => includesAlias(haystack, alias))) {
      neighborhoods.push(place.id);
    }
  }

  const moments: MomentTag[] = [];
  for (const [moment, aliases] of Object.entries(MOMENT_ALIASES) as [
    MomentTag,
    string[],
  ][]) {
    if (aliases.some((alias) => includesAlias(haystack, alias))) {
      moments.push(moment);
    }
  }

  return {
    language: detectLanguage(raw),
    neighborhoods,
    moments,
    raw,
  };
}
