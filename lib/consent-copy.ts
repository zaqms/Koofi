import type { Language } from "./types";

/**
 * Cookie banner + footer strings (AR/EN). Kept out of lib/copy.ts so this
 * PR doesn't collide with #252. The contact mailbox is privacy@cali.sa
 * (Amjad, 9 Oct 2026). Never put a personal inbox in public copy.
 */
export const CONSENT_CONTACT_EMAIL = "privacy@cali.sa";

export const consentCopy = {
  title: { ar: "الكوكيز في وين", en: "Cookies on Wain" },
  body: {
    ar: "نبي نستخدم أدوات تحليل وإعلانات من Google وX وOpenAI وDataFast وVercel، عشان نفهم كيف ينستخدم الموقع ونقيس إعلاناتنا. ما تشتغل إلا إذا وافقت، والموقع يشتغل عادي لو رفضت. وتقدر تغيّر رأيك أي وقت من «إعدادات الكوكيز» تحت الصفحة.",
    en: "We'd like to use analytics and advertising tools (Google, X, OpenAI, DataFast and Vercel) to understand how the site is used and to measure our ads. They only run if you accept, and the site works the same if you reject. You can change your mind any time from \u201cCookie settings\u201d at the bottom of the page.",
  },
  details: { ar: "التفاصيل في سياسة الخصوصية", en: "Details in the privacy policy" },
  accept: { ar: "أوافق", en: "Accept" },
  reject: { ar: "أرفض", en: "Reject" },
  current: {
    ar: { granted: "اخترت: موافق.", denied: "اخترت: رفض." },
    en: { granted: "Your choice: accepted.", denied: "Your choice: rejected." },
  },
  settingsLink: { ar: "إعدادات الكوكيز", en: "Cookie settings" },
} as const satisfies Record<string, unknown>;

export function consentText<K extends "title" | "body" | "details" | "accept" | "reject" | "settingsLink">(
  key: K,
  language: Language,
): string {
  return consentCopy[key][language];
}
