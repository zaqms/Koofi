import type { Language } from "./types";

const ARABIC_LETTER = /[\u0600-\u06FF]/;

export function detectLanguage(text: string): Language {
  const arabic = (text.match(new RegExp(ARABIC_LETTER, "g")) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  if (arabic === 0 && latin === 0) return "ar";
  return arabic >= latin ? "ar" : "en";
}
