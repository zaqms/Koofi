import { EXAMPLE_BADGE, LOCKED_OPENER, PRODUCT_NAME } from "@/lib/product";
import type { Language } from "@/lib/types";

export { LOCKED_OPENER, PRODUCT_NAME };

export function t<T extends Record<Language, string>>(
  language: Language,
  table: T,
): string {
  return table[language];
}

export const copy = {
  opener: LOCKED_OPENER,
  cityOnly: {
    ar: "الرياض فقط",
    en: "Riyadh only",
  },
  placeholder: {
    ar: "حي، أو قعدة شغل، أو قهوة متأخرة…",
    en: "A neighborhood, a work table, or a late qahwa…",
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
    ar: "ثلاث قهاوي تناسب هالحين:",
    en: "Three cafes for right now:",
  },
  fewerPicks: {
    ar: "هذي اللي أقدر أقترحها الحين:",
    en: "This is what I can suggest right now:",
  },
  thinCatalog: {
    ar: "القائمة عندي لسه صغيرة — هذي اللي أقدر أقترحها، بدون ما ألف أسماء.",
    en: "The list is still small — this is what I can suggest, without inventing names.",
  },
  emptyCatalog: {
    ar: "ما عندي قهوة تناسب هالطلب في القائمة الحين. القائمة الحقيقية لسه جايه.",
    en: "I don't have a cafe for that on the list yet. The real list is still coming.",
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
  cardLink: {
    ar: "بطاقة المكان",
    en: "Cafe card",
  },
  directions: {
    ar: "افتح الموقع في الخرائط",
    en: "Open in maps",
  },
  noPin: {
    ar: "ما فيه موقع بعد.",
    en: "No pin yet.",
  },
  noHours: {
    ar: "ما نحط ساعات إلا من مصدر رسمي.",
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
    ar: "الأجواء",
    en: "Vibe",
  },
  neighborhood: {
    ar: "الحي",
    en: "Neighborhood",
  },
  backToChat: {
    ar: "ارجع للدردشة",
    en: "Back to chat",
  },
  shareHint: {
    ar: "رابط، مو تطبيق.",
    en: "A link, not an app.",
  },
  error: {
    ar: "صار خلل بسيط. جرّب مرة ثانية.",
    en: "Something slipped. Try again.",
  },
} as const;
