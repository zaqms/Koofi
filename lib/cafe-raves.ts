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
      reason_ar: "تنذكر كثير.",
      reason_en: "Often mentioned.",
      evidence: "3 sources, same branch (Scout pilot-v2 2026-10-03): google_review 2026-06-16 https://www.google.com/maps/place/Namq+cafe/data=!4m2!3m1!1s0x3e2ee52e9c6656bb:0x649539b72bb6761b ; google_review 2025-08-02 https://exa.ai/library/place/tycsqhhjrtz ; google_review 2025-07-24 https://exa.ai/library/place/tycsqhhjrtz",
    },
  ],
  "bab-al-mohammadiyah": [
    {
      emoji: "🍵",
      name_ar: "ماتشا لاتيه",
      name_en: "Matcha Latte",
      reason_ar: "من المفضلات في المراجعات.",
      reason_en: "A favourite in reviews.",
      evidence: "4 sources, same branch (Scout pilot-v2 2026-10-03): google_review 2026-07-30 https://www.google.com/maps/place/bab/@24.7392724,46.6489027,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee300747e7f87:0x6c346a1fe01e3398!8m2!3d24.7392724!4d46.6489027!16s%2Fg%2F11vt89r2yd ; google_review 2026-05-18 https://www.google.com/maps/place/bab/@24.7392724,46.6489027,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee300747e7f87:0x6c346a1fe01e3398!8m2!3d24.7392724!4d46.6489027!16s%2Fg%2F11vt89r2yd ; google_review 2026-07-31 https://www.google.com/maps/place/bab/@24.7392724,46.6489027,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee300747e7f87:0x6c346a1fe01e3398!8m2!3d24.7392724!4d46.6489027!16s%2Fg%2F11vt89r2yd ; google_review 2025-06-17 https://www.google.com/maps/place/bab/@24.7392724,46.6489027,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee300747e7f87:0x6c346a1fe01e3398!8m2!3d24.7392724!4d46.6489027!16s%2Fg%2F11vt89r2yd",
    },
  ],
  "cherie-al-muruj": [
    {
      emoji: "🥐",
      name_ar: "سينامون رول بالبيكان",
      name_en: "Pecan Cinnamon Roll",
      reason_ar: "ينطلب كثير.",
      reason_en: "People often order it.",
      evidence: "4 sources, same branch (Scout pilot-v2 2026-10-03): google_review 2026-06-12 https://www.google.com/maps/place/Ch%C3%A8rie/@24.7622854,46.6603825,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee3c1855d7fc3:0x9f9b53c13178e828!8m2!3d24.7622854!4d46.6603825!16s%2Fg%2F11l78ly8r0 ; google_review 2026-07-12 https://www.google.com/maps/place/Ch%C3%A8rie/@24.7622854,46.6603825,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee3c1855d7fc3:0x9f9b53c13178e828!8m2!3d24.7622854!4d46.6603825!16s%2Fg%2F11l78ly8r0 ; google_review 2026-05-05 https://www.google.com/maps/place/Ch%C3%A8rie/@24.7622854,46.6603825,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee3c1855d7fc3:0x9f9b53c13178e828!8m2!3d24.7622854!4d46.6603825!16s%2Fg%2F11l78ly8r0 ; google_review 2026-08-15 https://www.google.com/maps/place/Ch%C3%A8rie/@24.7622854,46.6603825,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee3c1855d7fc3:0x9f9b53c13178e828!8m2!3d24.7622854!4d46.6603825!16s%2Fg%2F11l78ly8r0",
    },
  ],
  "okawa-al-narjis": [
    {
      emoji: "🍵",
      name_ar: "ماتشا سن ست",
      name_en: "Sunset Matcha",
      reason_ar: "ينذكر كثير.",
      reason_en: "Mentioned again and again.",
      evidence: "3 sources, same branch (Scout pilot-v2 2026-10-03): google_review 2026-05-09 https://www.google.com/maps/place/OKAWA+Cafe+Al+Narjis/@24.8407563,46.673187,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2efb751afe87a1:0x90435bec78a9e241!8m2!3d24.8407563!4d46.673187!16s%2Fg%2F11qby35x3j ; google_review 2026-05-12 https://www.google.com/maps/place/OKAWA+Cafe+Al+Narjis/@24.8407563,46.673187,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2efb751afe87a1:0x90435bec78a9e241!8m2!3d24.8407563!4d46.673187!16s%2Fg%2F11qby35x3j ; google_review 2026-02-16 https://exa.ai/library/place/3vfyw85c0xb",
    },
  ],
  "nap-al-qirawan": [
    {
      emoji: "🍰",
      name_ar: "تيراميسو",
      name_en: "Tiramisu",
      reason_ar: "يستاهل التجربة.",
      reason_en: "Worth trying.",
      evidence: "4 sources, same branch (Scout pilot-v2 2026-10-03): google_review 2026-02-26 https://www.google.com/maps/place/nap/@24.8235343,46.5981034,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee55f2a614199:0xdd5833210545ac9f!8m2!3d24.8235343!4d46.5981034!16s%2Fg%2F11wbsqxnvd ; google_review 2026-05-18 https://www.google.com/maps/place/nap/@24.8235343,46.5981034,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee55f2a614199:0xdd5833210545ac9f!8m2!3d24.8235343!4d46.5981034!16s%2Fg%2F11wbsqxnvd ; google_review 2026-05-25 https://www.google.com/maps/place/nap/@24.8235343,46.5981034,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee55f2a614199:0xdd5833210545ac9f!8m2!3d24.8235343!4d46.5981034!16s%2Fg%2F11wbsqxnvd ; google_review 2025-12-24 https://www.google.com/maps/place/nap/@24.8235343,46.5981034,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee55f2a614199:0xdd5833210545ac9f!8m2!3d24.8235343!4d46.5981034!16s%2Fg%2F11wbsqxnvd",
    },
  ],
  "ouia-al-qirawan": [
    {
      emoji: "🍰",
      name_ar: "ميلفيه بيكان مع آيسكريم",
      name_en: "Pecan Mille-feuille with Ice Cream",
      reason_ar: "ينمدح كثير في المراجعات.",
      reason_en: "Often praised in reviews.",
      evidence: "5 sources, same branch (Scout pilot-v2 2026-10-03): google_review 2026-01-10 https://www.google.com/maps/place/OUIA/@24.8303379,46.5965801,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee5b88e7d525d:0x3af2bf3f2c58050c!8m2!3d24.8303379!4d46.5965801!16s%2Fg%2F11vlr0m4gh ; google_review 2026-05-17 https://www.google.com/maps/place/OUIA/@24.8303379,46.5965801,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee5b88e7d525d:0x3af2bf3f2c58050c!8m2!3d24.8303379!4d46.5965801!16s%2Fg%2F11vlr0m4gh ; google_review 2026-07-10 https://www.google.com/maps/place/OUIA/@24.8303379,46.5965801,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee5b88e7d525d:0x3af2bf3f2c58050c!8m2!3d24.8303379!4d46.5965801!16s%2Fg%2F11vlr0m4gh ; google_review 2026-07-24 https://www.google.com/maps/place/OUIA/@24.8303379,46.5965801,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee5b88e7d525d:0x3af2bf3f2c58050c!8m2!3d24.8303379!4d46.5965801!16s%2Fg%2F11vlr0m4gh ; google_review 2025-01-04 https://exa.ai/library/place/sg0hjfl8m2q",
    },
    {
      emoji: "🌺",
      name_ar: "آيس كركديه",
      name_en: "Iced Hibiscus",
      reason_ar: "ينصحون فيه كثير.",
      reason_en: "Often recommended.",
      evidence: "3 sources, same branch (Scout pilot-v2 2026-10-03): google_review 2026-01-10 https://www.google.com/maps/place/OUIA/@24.8303379,46.5965801,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee5b88e7d525d:0x3af2bf3f2c58050c!8m2!3d24.8303379!4d46.5965801!16s%2Fg%2F11vlr0m4gh ; google_review 2024-04-12 https://exa.ai/library/place/sg0hjfl8m2q ; google_review 2026-08-24 https://www.google.com/maps/place/OUIA/@24.8303379,46.5965801,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee5b88e7d525d:0x3af2bf3f2c58050c!8m2!3d24.8303379!4d46.5965801!16s%2Fg%2F11vlr0m4gh",
    },
  ],
  "for-coffee-roasters-al-qirawan": [
    {
      emoji: "🍰",
      name_ar: "كيكة السيقنتشر",
      name_en: "FOR Signature Cake",
      reason_ar: "مفضلة عند الزبائن.",
      reason_en: "A favourite with customers.",
      evidence: "3 sources, same branch (Scout pilot-v2 2026-10-03): google_review 2026-03-14 https://www.google.com/maps/place/FOR+COFFEE+ROASTERS/@24.8431301,46.5963817,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee531c4915ebb:0x7b97b8c07e18f93d!8m2!3d24.8431301!4d46.5963817!16s%2Fg%2F11ymc_k30v ; google_review 2026-05-10 https://www.google.com/maps/place/FOR+COFFEE+ROASTERS/@24.8431301,46.5963817,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee531c4915ebb:0x7b97b8c07e18f93d!8m2!3d24.8431301!4d46.5963817!16s%2Fg%2F11ymc_k30v ; google_review 2025-12-22 https://www.google.com/maps/place/FOR+COFFEE+ROASTERS/@24.8431301,46.5963817,17z/data=!3m1!4b1!4m6!3m5!1s0x3e2ee531c4915ebb:0x7b97b8c07e18f93d!8m2!3d24.8431301!4d46.5963817!16s%2Fg%2F11ymc_k30v",
    },
  ],
  "sulalat-coffee-ar-rabwah": [
    {
      emoji: "🍫",
      name_ar: "هوت شوكلت داكن",
      name_en: "Dark Hot Chocolate",
      reason_ar: "يمدحونه الزوار كثير.",
      reason_en: "Visitors keep praising it.",
      evidence: "4 sources, same branch (Scout pilot-v2 2026-10-03): google_review 2025-12-17 https://www.google.com/maps/place/Sulalat+Coffee/data=!4m2!3m1!1s0x3e2f053ded08e019:0x47baea5401db03e8 ; google_review 2025-10-16 https://exa.ai/library/place/wdnxbtnwzxm ; google_review 2026-01-10 https://exa.ai/library/place/wdnxbtnwzxm ; google_review 2026-02-17 https://exa.ai/library/place/wdnxbtnwzxm",
    },
  ],
  "mkth-ghirnatah": [
    {
      emoji: "🍰",
      name_ar: "تشيز كيك مدريد",
      name_en: "Madrid Cheesecake",
      reason_ar: "ينمدح كثير في المراجعات.",
      reason_en: "Often praised in reviews.",
      evidence:
        "3 sources, same branch (batch-02 2026-10-03): google_review 2026-07-02 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2efd82bc3dfa81:0xe2d11f39f26b7f5 ; google_review 2026-06-05 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2efd82bc3dfa81:0xe2d11f39f26b7f5 ; google_review 2026-06-27 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2efd82bc3dfa81:0xe2d11f39f26b7f5",
    },
  ],
  "archi-al-bujairi-diriyah": [
    {
      emoji: "🍞",
      name_ar: "فرنش توست بيكان",
      name_en: "Pecan French Toast",
      reason_ar: "ينصحون فيه كثير.",
      reason_en: "Often recommended.",
      evidence:
        "3 sources, same branch (batch-02 2026-10-03): google_review 2026-02-08 https://www.google.com/maps/place/Archi/data=!4m2!3m1!1s0x3e2ee1256ea46553:0x57b2b39e05a4ac4f ; google_review 2026-01-02 https://www.google.com/maps/place/Archi/data=!4m2!3m1!1s0x3e2ee1256ea46553:0x57b2b39e05a4ac4f ; google_review 2026-03-26 https://www.google.com/maps/place/Archi/data=!4m2!3m1!1s0x3e2ee1256ea46553:0x57b2b39e05a4ac4f",
    },
  ],
  "semi-specialty-cafe-ghirnatah": [
    {
      emoji: "🍵",
      name_ar: "ماتشا لاتيه",
      name_en: "Matcha Latte",
      reason_ar: "من المفضلات في المراجعات.",
      reason_en: "A favourite in reviews.",
      evidence:
        "5 sources, same branch (batch-02 2026-10-03): google_review 2026-04-27 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2efd58923c0c87:0x5d458c2228b6cb1b ; google_review 2026-07-06 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2efd58923c0c87:0x5d458c2228b6cb1b ; google_review 2026-02-20 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2efd58923c0c87:0x5d458c2228b6cb1b ; google_review 2025-07-11 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2efd58923c0c87:0x5d458c2228b6cb1b ; google_review 2023-06-23 https://exa.ai/library/place/2fvjscdpqtw",
    },
  ],
  "dips-plus-diriyah": [
    {
      emoji: "🍋",
      name_ar: "تشيز كيك مدريد",
      name_en: "Madrid Cheesecake",
      reason_ar: "ينصحون فيه كثير.",
      reason_en: "Often recommended.",
      evidence:
        "3 sources, same branch (batch-02 2026-10-03): google_review 2025-05-31 https://exa.ai/library/place/zg3b52gv6kl ; google_review 2025-05-25 https://exa.ai/library/place/zg3b52gv6kl ; google_review 2025-05-17 https://exa.ai/library/place/zg3b52gv6kl",
    },
  ],
  "eya-specialty-coffee-al-wurud": [
    {
      emoji: "🌀",
      name_ar: "سينامون رول",
      name_en: "Cinnamon Roll",
      reason_ar: "ينمدح كثير في المراجعات.",
      reason_en: "Often praised in reviews.",
      evidence:
        "3 sources, same branch (batch-02 2026-10-03): google_review 2026-08-23 https://www.google.com/maps/place/EYA+Specialty+Coffee/@40.1723711,-105.0976375,8z/data=!3m1!4b1!4m6!3m5!1s0x3e2f039614f0eaf7:0xf5e98e2b356e7370!8m2!3d24.7321395!4d46.6776488!16s%2Fg%2F11vb7lsy36 ; google_review 2026-04-14 https://www.google.com/maps/place/EYA+Specialty+Coffee/@40.1723711,-105.0976375,8z/data=!3m1!4b1!4m6!3m5!1s0x3e2f039614f0eaf7:0xf5e98e2b356e7370!8m2!3d24.7321395!4d46.6776488!16s%2Fg%2F11vb7lsy36 ; google_review 2026-08-27 https://www.google.com/maps/place/EYA+Specialty+Coffee/@40.1723711,-105.0976375,8z/data=!3m1!4b1!4m6!3m5!1s0x3e2f039614f0eaf7:0xf5e98e2b356e7370!8m2!3d24.7321395!4d46.6776488!16s%2Fg%2F11vb7lsy36",
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
