import type { Language } from "./types";

/**
 * What people mention about a café, keyed by catalog slug (`data/catalog.json` id).
 * Entries come from verified research only.
 * `evidence` is an internal source note: never render it, and never put it in HTML, JSON-LD, or meta.
 */
export type CafeRave = {
  emoji: string;
  name_ar: string;
  name_en: string;
  reason_ar: string;
  reason_en: string;
  evidence: string;
};

export type CafeRaveLine = {
  emoji: string;
  name: string;
  reason: string;
};

export const cafeRaves: Record<string, readonly CafeRave[]> = {};

/** Display lines only. `evidence` is dropped here and must not be rendered. */
export function toCafeRaveLines(
  items: readonly CafeRave[] | undefined,
  language: Language,
): CafeRaveLine[] {
  return (items ?? []).slice(0, 3).map((item) => ({
    emoji: item.emoji,
    name: language === "ar" ? item.name_ar : item.name_en,
    reason: language === "ar" ? item.reason_ar : item.reason_en,
  }));
}

export function cafeRaveLines(slug: string, language: Language): CafeRaveLine[] {
  return toCafeRaveLines(cafeRaves[slug], language);
}
