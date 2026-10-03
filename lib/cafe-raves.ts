import type { Language } from "./types";

/**
 * What people mention about a café, keyed by catalog slug (`data/catalog.json` id).
 * Entries come from verified research only.
 * `evidence` is an internal source note: never render it, and never put it in HTML, JSON-LD, meta, or client JS.
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

export const cafeRaves: Record<string, readonly CafeRave[]> = {
  "namq-al-malqa": [
    {
      emoji: "🍫",
      name_ar: "كيكة نمق",
      name_en: "Namq Cake",
      reason_ar: "الكل يذكرها.",
      reason_en: "The one everyone keeps mentioning.",
      evidence: "4 sources, same branch (Scout pilot 2026-10-03, Ajz QA): google_review 2026-06-16 maps:0x3e2ee52e9c6656bb:0x649539b72bb6761b ; blog https://saudiarestaurants.com/%D9%86%D9%85%D9%82-%D9%83%D8%A7%D9%81%D9%8A%D9%87/ ; google_review 2025-08-02 https://exa.ai/library/place/tycsqhhjrtz ; google_review 2025-07-24 https://exa.ai/library/place/tycsqhhjrtz",
    },
  ],
  "asfoura-al-malqa": [
    {
      emoji: "🍪",
      name_ar: "كوكيز",
      name_en: "Cookies",
      reason_ar: "الزوار يذكرونها كثير.",
      reason_en: "Visitors keep mentioning them.",
      evidence: "3 sources, same branch (Scout pilot 2026-10-03, Ajz QA): google_review 2026-04-04 maps:0x3e2ee55483715681:0x535c9c8273f81454 ; google_review 2026-04-15 maps:0x3e2ee55483715681:0x535c9c8273f81454 ; google_review 2025-12-19 https://exa.ai/library/place/nz5yb38gyw7",
    },
  ],
  "bab-al-mohammadiyah": [
    {
      emoji: "🍵",
      name_ar: "ماتشا لاتيه",
      name_en: "Matcha Latte",
      reason_ar: "الكل يذكرها.",
      reason_en: "The one everyone keeps mentioning.",
      evidence: "4 sources, same branch (Scout pilot 2026-10-03, Ajz QA): google_review 2026-07-30 maps:0x3e2ee300747e7f87:0x6c346a1fe01e3398 ; google_review 2026-05-18 maps:0x3e2ee300747e7f87:0x6c346a1fe01e3398 ; google_review 2026-07-31 maps:0x3e2ee300747e7f87:0x6c346a1fe01e3398 ; google_review 2025-06-17 maps:0x3e2ee300747e7f87:0x6c346a1fe01e3398",
    },
  ],
  "cherie-al-muruj": [
    {
      emoji: "🥐",
      name_ar: "سينابون بيكان",
      name_en: "Cinnabon Pecan",
      reason_ar: "الكل يذكره.",
      reason_en: "The one everyone keeps mentioning.",
      evidence: "4 sources, same branch (Scout pilot 2026-10-03, Ajz QA): google_review 2026-06-12 maps:0x3e2ee3c1855d7fc3:0x9f9b53c13178e828 ; google_review 2026-07-12 maps:0x3e2ee3c1855d7fc3:0x9f9b53c13178e828 ; google_review 2026-05-05 maps:0x3e2ee3c1855d7fc3:0x9f9b53c13178e828 ; google_review 2026-08-15 maps:0x3e2ee3c1855d7fc3:0x9f9b53c13178e828",
    },
  ],
  "da-nonna-al-nakheel": [
    {
      emoji: "☕",
      name_ar: "V60",
      name_en: "V60",
      reason_ar: "الزوار يمدحونها.",
      reason_en: "Visitors keep praising it.",
      evidence: "3 sources, same branch (Scout pilot 2026-10-03, Ajz QA): google_review 2024-11-26 https://exa.ai/library/place/nhtl8vnwmnt ; google_review 2023-01-10 https://exa.ai/library/place/nhtl8vnwmnt ; google_review 2023-03-06 https://exa.ai/library/place/nhtl8vnwmnt",
    },
  ],
  "okawa-al-narjis": [
    {
      emoji: "🍵",
      name_ar: "ماتشا سنست",
      name_en: "Sunset Matcha",
      reason_ar: "ينذكر كثير.",
      reason_en: "Mentioned again and again.",
      evidence: "3 sources, same branch (Scout pilot 2026-10-03, Ajz QA): google_review 2026-05-09 maps:0x3e2efb751afe87a1:0x90435bec78a9e241 ; google_review 2026-05-12 maps:0x3e2efb751afe87a1:0x90435bec78a9e241 ; google_review 2026-02-16 https://exa.ai/library/place/3vfyw85c0xb",
    },
  ],
  "nap-al-qirawan": [
    {
      emoji: "🍰",
      name_ar: "تيراميسو",
      name_en: "Tiramisu",
      reason_ar: "الكل يذكره.",
      reason_en: "The one everyone keeps mentioning.",
      evidence: "4 sources, same branch (Scout pilot 2026-10-03, Ajz QA): google_review 2026-02-26 maps:0x3e2ee55f2a614199:0xdd5833210545ac9f ; google_review 2026-05-18 maps:0x3e2ee55f2a614199:0xdd5833210545ac9f ; google_review 2026-05-25 maps:0x3e2ee55f2a614199:0xdd5833210545ac9f ; google_review 2025-12-24 maps:0x3e2ee55f2a614199:0xdd5833210545ac9f",
    },
  ],
  "ouia-al-qirawan": [
    {
      emoji: "🍰",
      name_ar: "ميلفيه بيكان مع آيسكريم",
      name_en: "Pecan Mille-feuille with Ice Cream",
      reason_ar: "الكل يذكره.",
      reason_en: "The one everyone keeps mentioning.",
      evidence: "5 sources, same branch (Scout pilot 2026-10-03, Ajz QA): google_review 2026-01-10 maps:0x3e2ee5b88e7d525d:0x3af2bf3f2c58050c ; google_review 2026-05-17 maps:0x3e2ee5b88e7d525d:0x3af2bf3f2c58050c ; google_review 2026-07-10 maps:0x3e2ee5b88e7d525d:0x3af2bf3f2c58050c ; google_review 2026-07-24 maps:0x3e2ee5b88e7d525d:0x3af2bf3f2c58050c ; google_review 2025-01-04 https://exa.ai/library/place/sg0hjfl8m2q",
    },
    {
      emoji: "🌺",
      name_ar: "آيس كركديه",
      name_en: "Iced Hibiscus",
      reason_ar: "ينصحون فيه كثير.",
      reason_en: "Often recommended.",
      evidence: "3 sources, same branch (Scout pilot 2026-10-03, Ajz QA): google_review 2026-01-10 maps:0x3e2ee5b88e7d525d:0x3af2bf3f2c58050c ; google_review 2024-04-12 https://exa.ai/library/place/sg0hjfl8m2q ; google_review 2026-08-24 maps:0x3e2ee5b88e7d525d:0x3af2bf3f2c58050c",
    },
  ],
  "for-coffee-roasters-al-qirawan": [
    {
      emoji: "🍰",
      name_ar: "كيكة فور سيقنتشر",
      name_en: "FOR Signature Cake",
      reason_ar: "الكل يذكرها.",
      reason_en: "The one everyone keeps mentioning.",
      evidence: "3 sources, same branch (Scout pilot 2026-10-03, Ajz QA): google_review 2026-03-14 maps:0x3e2ee531c4915ebb:0x7b97b8c07e18f93d ; google_review 2026-05-10 maps:0x3e2ee531c4915ebb:0x7b97b8c07e18f93d ; google_review 2025-12-22 maps:0x3e2ee531c4915ebb:0x7b97b8c07e18f93d",
    },
  ],
  "sulalat-coffee-ar-rabwah": [
    {
      emoji: "🍫",
      name_ar: "هوت شوكلت 70%",
      name_en: "70% Hot Chocolate",
      reason_ar: "الكل يذكره.",
      reason_en: "The one everyone keeps mentioning.",
      evidence: "4 sources, same branch (Scout pilot 2026-10-03, Ajz QA): google_review 2025-12-17 maps:0x3e2f053ded08e019:0x47baea5401db03e8 ; google_review 2025-10-16 https://exa.ai/library/place/wdnxbtnwzxm ; google_review 2026-01-10 https://exa.ai/library/place/wdnxbtnwzxm ; google_review 2026-02-17 https://exa.ai/library/place/wdnxbtnwzxm",
    },
  ],
  "woods-olaya": [
    {
      emoji: "☕",
      name_ar: "V60",
      name_en: "V60",
      reason_ar: "الزوار يمدحونها.",
      reason_en: "Visitors keep praising it.",
      evidence: "3 sources, same branch (Scout pilot 2026-10-03, Ajz QA): blog https://cafesriyadh.com/2022/%d9%85%d9%82%d9%87%d9%89-%d9%88%d9%85%d8%ad%d9%85%d8%b5%d8%a9-%d9%88%d9%88%d8%af%d8%b2-%d8%a7%d9%84%d8%b1%d9%8a%d8%a7%d8%b6/ ; blog https://cafesriyadh.com/2022/%d9%85%d9%82%d9%87%d9%89-%d9%88%d9%85%d8%ad%d9%85%d8%b5%d8%a9-%d9%88%d9%88%d8%af%d8%b2-%d8%a7%d9%84%d8%b1%d9%8a%d8%a7%d8%b6/ ; google_review 2026-01-01 https://exa.ai/library/place/jnthmj2tbb0",
    },
  ],
  "idmi-olaya": [
    {
      emoji: "☕",
      name_ar: "فلات وايت",
      name_en: "Flat White",
      reason_ar: "الكل يذكره.",
      reason_en: "The one everyone keeps mentioning.",
      evidence: "4 sources, same branch (Scout pilot 2026-10-03, Ajz QA): blog https://cafesriyadh.com/2020/%D9%85%D8%AD%D9%85%D8%B5%D8%A9-%D9%88%D9%85%D9%82%D9%87%D9%89-%D8%A5%D8%AF%D9%85%D9%8A/ ; blog https://cafesriyadh.com/2020/%D9%85%D8%AD%D9%85%D8%B5%D8%A9-%D9%88%D9%85%D9%82%D9%87%D9%89-%D8%A5%D8%AF%D9%85%D9%8A/ ; blog https://cafesriyadh.com/2020/%D9%85%D8%AD%D9%85%D8%B5%D8%A9-%D9%88%D9%85%D9%82%D9%87%D9%89-%D8%A5%D8%AF%D9%85%D9%8A/ ; google_review 2021-01-26 https://exa.ai/library/place/6d4wfq5sj1v",
    },
  ],
};

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
