import { CONSENT_CONTACT_EMAIL } from "./consent-copy";
import type { Language } from "./types";

/**
 * Privacy policy + Terms of use (AR + EN).
 *
 * STATUS (9 Oct 2026): the body is AWAITING SHOUG TEXT. Shoug Alzuhair is
 * writing the Privacy Policy and the T&C. Her text is the base; Dev adds
 * only what it lacks (the cookie banner section below and AR/EN parity).
 * The body slots are visible [AWAITING SHOUG TEXT: …] markers, so the
 * pages stay noindex and out of the sitemap until her text is in.
 * Drop-in procedure: SHOUG-DROP-IN.md in the #251 package.
 *
 * Ready to ship now, for her text to absorb:
 * - the Cookies and consent section (what the banner does), AR + EN;
 * - the contact address, privacy@cali.sa (Amjad, 9 Oct 2026).
 * Never write a personal inbox in this copy, and never the old repo name.
 * Arabic is its own text, not a translation.
 */
export type LegalSection = {
  /** Anchor id (e.g. "cookies", linked from the cookie banner). */
  id?: string;
  heading: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
};

export type LegalDoc = {
  title: string;
  description: string;
  updated: string;
  intro: readonly string[];
  sections: readonly LegalSection[];
};

export type LegalKind = "privacy" | "terms";

/**
 * Visible markers. The page highlights any text in this shape and keeps
 * the pages noindex while one is left:
 * - [AWAITING SHOUG TEXT: …] / [بانتظار نص شوق: …]: a slot for her text;
 * - [AMJAD TO CONFIRM: …] / [للتأكيد من أمجد: …]: a fact only Amjad can confirm.
 */
export const LEGAL_PLACEHOLDER_PATTERN =
  /(\[(?:AMJAD TO CONFIRM|للتأكيد من أمجد|AWAITING SHOUG TEXT|بانتظار نص شوق):[^\]]*\])/;

/** Only the Shoug slots (check-legal counts them separately). */
export const LEGAL_AWAITING_PATTERN = /(\[(?:AWAITING SHOUG TEXT|بانتظار نص شوق):[^\]]*\])/;

/**
 * Latin identifiers (cookie names, tag IDs, paths, the mailbox) are written
 * {{like_this}}. The page renders them as <bdi dir="ltr"> so they don't
 * reorder inside Arabic text. Never use it in title or description.
 */
export const LEGAL_LTR_PATTERN = /\{\{([^}]+)\}\}/;

/** The section id the cookie banner links to (/privacy#cookies). */
export const LEGAL_COOKIES_SECTION_ID = "cookies";

const UPDATED = {
  ar: "آخر تحديث: [بانتظار نص شوق: تاريخ النشر]",
  en: "Last updated: [AWAITING SHOUG TEXT: publication date]",
} as const;

/** privacy@cali.sa, isolated LTR inside Arabic. */
const EMAIL = `{{${CONSENT_CONTACT_EMAIL}}}`;

/** Cookies and consent: Dev's banner tie-in, fill-in-ready for Shoug's text. */
const COOKIES_AR: LegalSection = {
  id: LEGAL_COOKIES_SECTION_ID,
  heading: "الكوكيز وإعدادات الموافقة",
  paragraphs: [
    "أول ما تفتح وين يطلع لك شريط يسألك إذا توافق على كوكيز التحليل والإعلانات. زر «أوافق» وزر «أرفض» بنفس الوضوح، والموقع يشتغل عادي بأي اختيار.",
    "قبل ما تضغط «أوافق» ما يشتغل Google Tag Manager، ولا الأدوات اللي يشغّلها معه، وهي Google Analytics وGoogle Ads وبكسل X (تويتر) وبكسل OpenAI للإعلانات، ولا DataFast، ولا Vercel Web Analytics. وإعدادات الموافقة في Google (Consent Mode) تبدأ كلها «مرفوضة»: تخزين الإعلانات، وتخزين التحليلات، وبيانات المستخدم للإعلانات، وتخصيص الإعلانات.",
    "إذا ضغطت «أرفض» تبقى كلها طافية، ونحفظ اختيارك في متصفحك ({{wain_consent}}) عشان ما نسألك في كل صفحة.",
    "إذا ضغطت «أوافق» تشتغل هالأدوات، وممكن تحط الكوكيز اللي تحت. ووش توصل له كل أداة بعد موافقتك موضّح في هالسياسة.",
    "تقدر تغيّر رأيك أي وقت من «إعدادات الكوكيز» تحت كل صفحة. إذا سحبت موافقتك نوقف الأدوات، ونمسح الكوكيز اللي حطّتها على wain.lol، ونعيد تحميل الصفحة. أما الكوكيز اللي حطّتها X أو OpenAI على مواقعها هي، فتنمسح من إعدادات متصفحك.",
    "فيه أشياء تشتغل بدون موافقة لأن الموقع يحتاجها: اختيارك نفسه ({{wain_consent}})، وكوكيز {{wain_vid}} اللي ينحط بس لما تصوّت عشان نتذكر أصواتك (حوالي 13 شهر)، والإعدادات اللي تنحفظ في متصفحك (القهاوي اللي علّمت إنك رحتها، وإخفاء السلاسل، والمدينة، والترتيب، وإنك سمحت بالموقع). وكوكيز {{wain_claim_ops}} لفريق وين بس (12 ساعة).",
  ],
  bullets: [
    "Google Analytics: {{_ga}} و{{_ga_EFZZET02TT}}، لمدة أقصاها سنتين (والمتصفحات تقصّرها لحوالي 13 شهر).",
    "Google Ads: {{_gcl_au}} لمدة 90 يوم، و{{test_cookie}} على doubleclick.net لمدة 15 دقيقة.",
    "X (تويتر): {{_twpid}} و{{_twsid}} على wain.lol (حوالي 13 شهر)، و{{guest_id}} و{{guest_id_ads}} و{{guest_id_marketing}} و{{personalization_id}} على twitter.com و{{muc_ads}} على t.co (لمدة أقصاها سنتين، وتنقصر لحوالي 13 شهر).",
    "OpenAI: {{__obref}} لمدة سنة.",
    "DataFast: {{datafast_visitor_id}} و{{datafast_visitor_first_seen_at}} و{{datafast_visitor_session_count}} لمدة سنة، و{{datafast_session_id}} لمدة 30 دقيقة.",
    "حماية من البوتات عند OpenAI وX: {{__cf_bm}} و{{_cfuvid}} (30 دقيقة أو لين تسكّر المتصفح).",
    "Vercel Web Analytics ما يحط كوكيز.",
  ],
};

const COOKIES_EN: LegalSection = {
  id: LEGAL_COOKIES_SECTION_ID,
  heading: "Cookies and consent settings",
  paragraphs: [
    "When you first open Wain, a banner asks whether you accept analytics and advertising cookies. Accept and Reject are equally easy to choose, and the site works the same either way.",
    "Until you tap Accept, none of these tools load: Google Tag Manager, and through it Google Analytics 4, Google Ads, the X (Twitter) pixel and the OpenAI ads pixel; DataFast; and Vercel Web Analytics. Google's consent settings (Consent Mode) also start as denied for ad storage, analytics storage, ad user data and ad personalisation.",
    "If you tap Reject, they all stay off, and we remember your choice in your browser ({{wain_consent}}) so we don't ask on every page.",
    "If you tap Accept, these tools load and may set the cookies below. What each tool receives once you accept is explained in this policy.",
    "You can change your mind at any time from Cookie settings at the bottom of every page. If you withdraw consent, we stop the tools, delete the cookies they set on wain.lol, and reload the page. Cookies that X or OpenAI set on their own domains can only be cleared in your browser settings.",
    "Some things work without consent because the site needs them: your choice itself ({{wain_consent}}); the {{wain_vid}} cookie, set only when you vote, which remembers your votes (about 13 months); and settings saved in your browser (cafés you marked as visited, hide chains, city, sort order, and that you allowed location). The {{wain_claim_ops}} cookie is for the Wain team only (12 hours).",
  ],
  bullets: [
    "Google Analytics: {{_ga}} and {{_ga_EFZZET02TT}}, up to 2 years (browsers cap this at about 13 months).",
    "Google Ads: {{_gcl_au}} for 90 days, and {{test_cookie}} on doubleclick.net for 15 minutes.",
    "X (Twitter): {{_twpid}} and {{_twsid}} on wain.lol (about 13 months); {{guest_id}}, {{guest_id_ads}}, {{guest_id_marketing}} and {{personalization_id}} on twitter.com, and {{muc_ads}} on t.co (up to 2 years, capped at about 13 months).",
    "OpenAI: {{__obref}} for 1 year.",
    "DataFast: {{datafast_visitor_id}}, {{datafast_visitor_first_seen_at}} and {{datafast_visitor_session_count}} for 1 year; {{datafast_session_id}} for 30 minutes.",
    "Bot protection at OpenAI and X: {{__cf_bm}} and {{_cfuvid}} (30 minutes or the browser session).",
    "Vercel Web Analytics sets no cookies.",
  ],
};

const PRIVACY_AR: LegalDoc = {
  title: "سياسة الخصوصية",
  description: "وش البيانات اللي يجمعها وين (wain.lol)، ليش، ووين تروح، وكيف تتحكم في الكوكيز.",
  updated: UPDATED.ar,
  intro: ["[بانتظار نص شوق: مقدمة سياسة الخصوصية]"],
  sections: [
    {
      heading: "نص السياسة",
      paragraphs: [
        "[بانتظار نص شوق: نص سياسة الخصوصية كامل. يلزم يطابق POLICY-FACTS.md (8 أكتوبر 2026)، ويوصف إيميل نتائج «بيننا» إنه يروح لفريق وين بدون ذكر أي إيميل شخصي]",
      ],
    },
    COOKIES_AR,
    {
      heading: "تواصل معنا",
      paragraphs: [`لأي سؤال أو طلب يخص الخصوصية أو الكوكيز: ${EMAIL}.`],
    },
  ],
};

const PRIVACY_EN: LegalDoc = {
  title: "Privacy policy",
  description: "What data Wain (wain.lol) collects, why, where it goes, and how to control cookies.",
  updated: UPDATED.en,
  intro: ["[AWAITING SHOUG TEXT: privacy policy introduction]"],
  sections: [
    {
      heading: "Policy text",
      paragraphs: [
        "[AWAITING SHOUG TEXT: the full privacy policy. It must match POLICY-FACTS.md (8 Oct 2026) and describe the بيننا results email as going to the Wain team, with no personal inbox named]",
      ],
    },
    COOKIES_EN,
    {
      heading: "Contact us",
      paragraphs: [`For any question or request about privacy or cookies: ${EMAIL}.`],
    },
  ],
};

const TERMS_AR: LegalDoc = {
  title: "الشروط والأحكام",
  description: "شروط استخدام وين (wain.lol).",
  updated: UPDATED.ar,
  intro: ["[بانتظار نص شوق: مقدمة الشروط والأحكام]"],
  sections: [
    {
      heading: "نص الشروط",
      paragraphs: ["[بانتظار نص شوق: نص الشروط والأحكام كامل]"],
    },
    {
      heading: "الكوكيز",
      paragraphs: [
        "استخدام وين ما يحتاج توافق على كوكيز التحليل والإعلانات. تختار من الشريط أول ما تفتح الموقع، أو من «إعدادات الكوكيز» تحت كل صفحة، والتفاصيل في سياسة الخصوصية.",
      ],
    },
    {
      heading: "تواصل معنا",
      paragraphs: [`لأي سؤال عن هالشروط: ${EMAIL}.`],
    },
  ],
};

const TERMS_EN: LegalDoc = {
  title: "Terms and conditions",
  description: "The terms for using Wain (wain.lol).",
  updated: UPDATED.en,
  intro: ["[AWAITING SHOUG TEXT: terms and conditions introduction]"],
  sections: [
    {
      heading: "Terms text",
      paragraphs: ["[AWAITING SHOUG TEXT: the full terms and conditions]"],
    },
    {
      heading: "Cookies",
      paragraphs: [
        "You don't have to accept analytics or advertising cookies to use Wain. You choose in the banner when you first open the site, or from Cookie settings at the bottom of every page. The privacy policy has the details.",
      ],
    },
    {
      heading: "Contact us",
      paragraphs: [`Questions about these terms: ${EMAIL}.`],
    },
  ],
};

/**
 * «لـ Google» can break at the space and leave «لـ» alone at the end of a
 * line. Join the prefix to the next word with a no-break space. Arabic
 * docs only; check-legal asserts no «لـ» + plain space is left.
 */
const NO_BREAK_SPACE = "\u00A0";
const STRANDABLE_PREFIX = /([لب]ـ) /g;

function joinPrefixes(text: string): string {
  return text.replace(STRANDABLE_PREFIX, `$1${NO_BREAK_SPACE}`);
}

function withJoinedPrefixes(doc: LegalDoc): LegalDoc {
  return {
    ...doc,
    title: joinPrefixes(doc.title),
    description: joinPrefixes(doc.description),
    intro: doc.intro.map(joinPrefixes),
    sections: doc.sections.map((section) => ({
      ...(section.id ? { id: section.id } : {}),
      heading: joinPrefixes(section.heading),
      ...(section.paragraphs ? { paragraphs: section.paragraphs.map(joinPrefixes) } : {}),
      ...(section.bullets ? { bullets: section.bullets.map(joinPrefixes) } : {}),
    })),
  };
}

export const LEGAL_DOCS: Record<LegalKind, Record<Language, LegalDoc>> = {
  privacy: { ar: withJoinedPrefixes(PRIVACY_AR), en: PRIVACY_EN },
  terms: { ar: withJoinedPrefixes(TERMS_AR), en: TERMS_EN },
};

export function legalDoc(kind: LegalKind, language: Language): LegalDoc {
  return LEGAL_DOCS[kind][language];
}

export function legalDocText(doc: LegalDoc): string[] {
  return [
    doc.title,
    doc.description,
    doc.updated,
    ...doc.intro,
    ...doc.sections.flatMap((section) => [
      section.heading,
      ...(section.paragraphs ?? []),
      ...(section.bullets ?? []),
    ]),
  ];
}

/**
 * True while any marker is left. While true, the 4 legal pages send
 * `robots: noindex, follow` and stay out of the sitemap. It turns false by
 * itself once the last marker is filled in; then add the 4 URLs to
 * lib/sitemap-xml.ts and re-pin the sitemap count checks.
 */
export const LEGAL_HAS_PLACEHOLDERS: boolean = Object.values(LEGAL_DOCS).some((byLanguage) =>
  Object.values(byLanguage).some((doc) =>
    legalDocText(doc).some((text) => LEGAL_PLACEHOLDER_PATTERN.test(text)),
  ),
);

/** True while any Shoug slot is left (never merge in this state). */
export const LEGAL_AWAITING_SHOUG: boolean = Object.values(LEGAL_DOCS).some((byLanguage) =>
  Object.values(byLanguage).some((doc) =>
    legalDocText(doc).some((text) => LEGAL_AWAITING_PATTERN.test(text)),
  ),
);

/** Metadata `robots` for the legal pages: noindex while markers remain. */
export const LEGAL_ROBOTS = LEGAL_HAS_PLACEHOLDERS ? { index: false, follow: true } : undefined;
