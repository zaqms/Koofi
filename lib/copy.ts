import {
  EXAMPLE_BADGE,
  LOCKED_ABOUT,
  LOCKED_CONTACT,
  LOCKED_OPENER,
  LOCKED_OPENER_EN,
  VIBE_CHIPS,
} from "./product";
import type { Language } from "./types";

export {
  LOCKED_ABOUT,
  LOCKED_CONTACT,
  LOCKED_OPENER,
  LOCKED_OPENER_EN,
  PRODUCT_NAME,
  VIBE_CHIPS,
} from "./product";

export function t<T extends Record<Language, string>>(
  language: Language,
  table: T,
): string {
  return table[language];
}

export const copy = {
  opener: LOCKED_OPENER,
  openerEn: LOCKED_OPENER_EN,
  chips: VIBE_CHIPS,
  pickVibe: {
    ar: "اختار جو",
    en: "Pick a vibe",
  },
  switchLanguage: {
    ar: "EN",
    en: "عربي",
  },
  addShop: {
    ar: "أضف قهوة",
    en: "Add a coffee shop",
  },
  askMaps: {
    ar: "ارمي رابط قوقل ماب للمكان.",
    en: "Drop the Google Maps link for the shop.",
  },
  suggestThanks: {
    ar: "وصلت. نشوفها، وإذا مشت مع القائمة نضيفها.",
    en: "Got it. We’ll look at it, and add it if it fits the list.",
  },
  suggestBad: {
    ar: "أبي رابط قوقل ماب بس — maps.app.goo.gl أو خريطة قوقل.",
    en: "Just a Google Maps link — maps.app.goo.gl or a Google Maps URL.",
  },
  mapsPlaceholder: {
    ar: "رابط قوقل ماب…",
    en: "A Google Maps link…",
  },
  cityOnly: {
    ar: "الرياض بس",
    en: "Riyadh only",
  },
  placeholder: {
    ar: "حي، أو قعدة شغل، أو قهوة متأخرة…",
    en: "Neighborhood, work table, or late qahwa…",
  },
  send: {
    ar: "أرسل",
    en: "Send",
  },
  looking: {
    ar: "أدور لك…",
    en: "Looking…",
  },
  threePicks: {
    ar: "ثلاث قهاوي تناسب اختيارك",
    en: "Three cafes that suit your choice:",
  },
  fewerPicks: {
    ar: "هذي اللي أقدر أقترحها الحين:",
    en: "This is what I can suggest right now:",
  },
  thinCatalog: {
    ar: "القائمة عندي بعد صغيرة — هذي اللي أقدر أقترحها، من غير ما ألف أسماء.",
    en: "The list is still small — this is what I can suggest, without inventing names.",
  },
  emptyCatalog: {
    ar: "ما عندي قهوة تمشي مع هالطلب في القائمة الحين. القائمة الحقيقية بعد جايه.",
    en: "I don't have a cafe for that on the list yet. The real list is still coming.",
  },
  offTopic: {
    ar: `أنا هنا للقهوة في الرياض. ${LOCKED_OPENER}`,
    en: `We're here for coffee in Riyadh. ${LOCKED_OPENER_EN}`,
  },
  nearbyNeedsLocation: {
    ar: `قريب يحتاج موقعك. ${LOCKED_OPENER}`,
    en: `Nearby needs your location. ${LOCKED_OPENER_EN}`,
  },
  exampleBadge: EXAMPLE_BADGE,
  exampleNote: {
    ar: "محل تجريبي — مو قهوة حقيقية في الرياض.",
    en: "A demo shop — not a real Riyadh cafe.",
  },
  beenHere: {
    ar: "كنت هنا",
    en: "Been here",
  },
  beenMarked: {
    ar: "ما راح أجيبها كجديدة",
    en: "Won't offer this as new",
  },
  maps: {
    ar: "الخريطة",
    en: "Maps",
  },
  sendThisSpot: {
    ar: "أرسل هالمكان",
    en: "Send this spot",
  },
  reviews: {
    ar: "تقييم",
    en: "reviews",
  },
  cardLink: {
    ar: "بطاقة المكان",
    en: "Cafe card",
  },
  directions: {
    ar: "الخريطة",
    en: "Maps",
  },
  noPin: {
    ar: "ما فيه موقع للحين.",
    en: "No pin yet.",
  },
  noHours: {
    ar: "ما نحط ساعات إلا يجي مصدر رسمي.",
    en: "Hours stay empty until we have a legal source.",
  },
  hours: {
    ar: "الساعات",
    en: "Hours",
  },
  site: {
    ar: "الموقع الرسمي",
    en: "Official site",
  },
  vibe: {
    ar: "الجو",
    en: "Vibe",
  },
  neighborhood: {
    ar: "الحي",
    en: "Neighborhood",
  },
  newThisWeek: {
    ar: "جديد هالأسبوع",
    en: "New this week",
  },
  newThisWeekHint: {
    ar: "انضافت للقائمة هالأسبوع.",
    en: "Added to the list this week.",
  },
  directory: {
    ar: "القائمة",
    en: "The list",
  },
  directoryHint: {
    ar: "من الكتالوج. الخريطة آخر ضغطة.",
    en: "From the catalog. Maps is the last click.",
  },
  allDistricts: {
    ar: "كل الأحياء",
    en: "All areas",
  },
  backToChat: {
    ar: "ارجع للشات",
    en: "Back to chat",
  },
  about: {
    ar: "عن وين",
    en: "About",
  },
  aboutLead: LOCKED_ABOUT.lead,
  aboutBody: LOCKED_ABOUT.body,
  aboutNote: LOCKED_ABOUT.note,
  contactUs: LOCKED_CONTACT,
  shareHint: {
    ar: "رابط، مو تطبيق.",
    en: "A link, not an app.",
  },
  error: {
    ar: "صار خلل بسيط. جرّب مرة ثانية.",
    en: "Something slipped. Try again.",
  },
} as const;
