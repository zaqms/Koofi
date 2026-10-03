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
      emoji: "🍰",
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
      emoji: "🥐",
      name_ar: "سينامون رول",
      name_en: "Cinnamon Roll",
      reason_ar: "ينمدح كثير في المراجعات.",
      reason_en: "Often praised in reviews.",
      evidence:
        "3 sources, same branch (batch-02 2026-10-03): google_review 2026-08-23 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f039614f0eaf7:0xf5e98e2b356e7370 ; google_review 2026-04-14 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f039614f0eaf7:0xf5e98e2b356e7370 ; google_review 2026-08-27 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f039614f0eaf7:0xf5e98e2b356e7370",
    },
  ],
  "essert-al-rawabi": [
    {
      emoji: "🍰",
      name_ar: "تشيز كيك تيراميسو",
      name_en: "Tiramisu Cheesecake",
      reason_ar: "ينمدح كثير في المراجعات.",
      reason_en: "Often praised in reviews.",
      evidence:
        "6 sources, same branch (batch-03 2026-10-03): google_review 2025-08-15 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f07004f893d2f:0x9a3b291a0c19ec46 ; google_review 2026-07-22 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f07004f893d2f:0x9a3b291a0c19ec46 ; google_review 2026-06-17 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f07004f893d2f:0x9a3b291a0c19ec46 ; google_review 2026-07-04 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f07004f893d2f:0x9a3b291a0c19ec46 ; google_review 2026-07-08 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f07004f893d2f:0x9a3b291a0c19ec46 ; google_review 2025-10-25 https://exa.ai/library/place/13ww6xqg3tw",
    },
  ],
  "essert-al-arid": [
    {
      emoji: "🍰",
      name_ar: "تشيز كيك تيراميسو",
      name_en: "Tiramisu Cheesecake",
      reason_ar: "ينمدح في المراجعات.",
      reason_en: "Praised in reviews.",
      evidence:
        "4 sources, same branch (batch-03 2026-10-03): google_review 2026-08-02 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee519b340b15b:0x544e83e2ea999fb7 ; google_review 2026-06-28 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee519b340b15b:0x544e83e2ea999fb7 ; google_review 2026-09-02 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee519b340b15b:0x544e83e2ea999fb7 ; google_review 2026-08-17 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee519b340b15b:0x544e83e2ea999fb7",
    },
  ],
  "iota-al-ghadeer": [
    {
      emoji: "🍵",
      name_ar: "ماتشا لاتيه",
      name_en: "Matcha Latte",
      reason_ar: "من أبرز الطلبات في المراجعات.",
      reason_en: "A standout in reviews.",
      evidence:
        "5 sources, same branch (batch-03 2026-10-03): press 2023-12-05 https://www.arabnews.com/food-health/where-we-are-going-today-iota-coffee-shop-in-riyadh-2420836 ; google_review 2026-05-28 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee3210b6fff2b:0xfc195ee361241e01 ; google_review 2026-06-11 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee3210b6fff2b:0xfc195ee361241e01 ; google_review 2025-11-22 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee3210b6fff2b:0xfc195ee361241e01 ; google_review 2024-11-24 https://exa.ai/library/place/ltgx8t4g48m",
    },
  ],
  "oromiffa-al-olaya": [
    {
      emoji: "🍵",
      name_ar: "ماتشا لاتيه",
      name_en: "Matcha Latte",
      reason_ar: "محبوبة في المراجعات.",
      reason_en: "Well liked in reviews.",
      evidence:
        "5 sources, same branch (batch-03 2026-10-03): google_review 2026-06-01 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f033d6baac479:0x3055158d4554e1db ; google_review 2026-04-18 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f033d6baac479:0x3055158d4554e1db ; google_review 2026-05-12 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f033d6baac479:0x3055158d4554e1db ; google_review 2025-10-12 https://exa.ai/library/place/8bkjwwtsplw ; google_review 2025-12-01 https://exa.ai/library/place/8bkjwwtsplw",
    },
  ],
  "carve-coffee-bar-al-wurud": [
    {
      emoji: "🍌",
      name_ar: "بودينق موز",
      name_en: "Banana Pudding",
      reason_ar: "الزوار يذكرونه كثير.",
      reason_en: "Often mentioned by visitors.",
      evidence:
        "4 sources, same branch (batch-03 2026-10-03): google_review 2026-03-26 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f03f29ecc644d:0x7dd172c26784c870 ; google_review 2026-03-28 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f03f29ecc644d:0x7dd172c26784c870 ; google_review 2025-09-17 https://exa.ai/library/place/8w2fxpswnz5 ; google_review 2025-01-02 https://exa.ai/library/place/8w2fxpswnz5",
    },
  ],
  "moff-ghirnatah": [
    {
      emoji: "🍮",
      name_ar: "بودينق تمر",
      name_en: "Date Pudding",
      reason_ar: "الزوار يمدحونه كثير.",
      reason_en: "Often praised by visitors.",
      evidence:
        "4 sources, same branch (batch-03 2026-10-03): google_review 2026-07-28 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2effcc20be29f5:0xd0883a18ee9a503 ; google_review 2026-07-09 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2effcc20be29f5:0xd0883a18ee9a503 ; google_review 2026-02-23 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2effcc20be29f5:0xd0883a18ee9a503 ; google_review 2026-02-19 https://exa.ai/library/place/1rdk6rrtvwb",
    },
  ],
  "rex-king-salman": [
    {
      emoji: "🍮",
      name_ar: "ديت بروليه",
      name_en: "Date Brûlée",
      reason_ar: "حلا يتكلمون عنه.",
      reason_en: "A dessert people talk about.",
      evidence:
        "4 sources, same branch (batch-03 2026-10-03): google_review 2026-09-01 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f036014130825:0xbfcdd0ecff6c8d02 ; google_review 2026-09-04 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f036014130825:0xbfcdd0ecff6c8d02 ; google_review 2026-04-10 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f036014130825:0xbfcdd0ecff6c8d02 ; google_review 2026-02-11 https://exa.ai/library/place/8lt6fbwmmh3",
    },
  ],
  "nosound-al-narjis": [
    {
      emoji: "🥤",
      name_ar: "كمبوتشا",
      name_en: "Kombucha",
      reason_ar: "من الطلبات المحبوبة هنا.",
      reason_en: "A popular pick here.",
      evidence:
        "4 sources, same branch (batch-03 2026-10-03): google_review 2026-04-06 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2fabff69afccd5:0x47f58a1dd2433bd1 ; google_review 2026-02-14 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2fabff69afccd5:0x47f58a1dd2433bd1 ; google_review 2026-03-30 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2fabff69afccd5:0x47f58a1dd2433bd1 ; google_review 2026-02-01 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2fabff69afccd5:0x47f58a1dd2433bd1",
    },
  ],
  "atea-al-rabi": [
    {
      emoji: "🥐",
      name_ar: "سينامون رول",
      name_en: "Cinnamon Roll",
      reason_ar: "كثير يقولون إنه لذيذ.",
      reason_en: "Often called delicious.",
      evidence:
        "3 sources, same branch (batch-03 2026-10-03): google_review 2026-05-11 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee333ac56baa3:0x632e286d7c2502be ; google_review 2026-02-26 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee333ac56baa3:0x632e286d7c2502be ; google_review 2025-12-13 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee333ac56baa3:0x632e286d7c2502be",
    },
  ],
  "percent-arabica-hittin": [
    {
      emoji: "🍫",
      name_ar: "براوني",
      name_en: "Brownie",
      reason_ar: "عجب المراجعين.",
      reason_en: "Reviewers enjoyed it.",
      evidence:
        "3 sources, same branch (batch-04 2026-10-03): google_review 2026-03-02 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee3a860ee67a7:0x757ee5e74a69274b ; google_review 2026-03-03 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee3a860ee67a7:0x757ee5e74a69274b ; google_review 2026-09-01 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee3a860ee67a7:0x757ee5e74a69274b",
    },
  ],
  "good-neighbor-olaya": [
    {
      emoji: "🍨",
      name_ar: "آيس كريم ساندويتش",
      name_en: "Ice Cream Sandwich",
      reason_ar: "من الحلا اللي ينذكر هنا.",
      reason_en: "One of the desserts people mention.",
      evidence:
        "3 sources, same branch (batch-04 2026-10-03): google_review 2026-07-19 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f03fcd238f7e5:0x42c413083e9df746 ; google_review 2026-06-06 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f03fcd238f7e5:0x42c413083e9df746 ; press 2026-08-29 https://www.arabnews.com/food-health/where-we-are-going-today-good-neighbor-cafe-in-riyadh-2656250",
    },
  ],
  "peaks-digital-city-al-nakheel": [
    {
      emoji: "🥪",
      name_ar: "ساندويتش بوراتا",
      name_en: "Burrata Sandwich",
      reason_ar: "الزوار يمدحونه.",
      reason_en: "Visitors speak well of it.",
      evidence:
        "3 sources, same branch (batch-04 2026-10-03): google_review 2026-02-16 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee380585f0151:0xab784cd32a1e3d85 ; google_review 2025-06-23 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee380585f0151:0xab784cd32a1e3d85 ; google_review 2025-12-24 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2ee380585f0151:0xab784cd32a1e3d85",
    },
  ],
  "jather-al-hamra": [
    {
      emoji: "🍵",
      name_ar: "ماتشا لاتيه",
      name_en: "Matcha Latte",
      reason_ar: "تقييمها زين في المراجعات.",
      reason_en: "Rated well in reviews.",
      evidence:
        "3 sources, same branch (batch-04 2026-10-03): google_review 2026-05-02 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f03005afeefe3:0xfb9336e4d0f8a037 ; google_review 2025-08-08 https://exa.ai/library/place/cdl60lk9yhy ; google_review 2025-01-18 https://exa.ai/library/place/cdl60lk9yhy",
    },
  ],
  "one-gram-sulimaniyah": [
    {
      emoji: "🍰",
      name_ar: "تشيز كيك بيكان",
      name_en: "Pecan Cheesecake",
      reason_ar: "توصفه المراجعات بإنه لذيذ.",
      reason_en: "Described as tasty in reviews.",
      evidence:
        "4 sources, same branch (batch-04 2026-10-03): google_review 2026-04-11 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f0300779b6af3:0x8cfcba3b84b71d7f ; google_review 2026-04-17 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f0300779b6af3:0x8cfcba3b84b71d7f ; google_review 2026-05-11 https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f0300779b6af3:0x8cfcba3b84b71d7f ; google_review 2026-02-16 https://exa.ai/library/place/3slp805sz5k",
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
