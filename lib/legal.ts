import type { Language } from "./types";

/**
 * Privacy policy + Terms of use (AR + EN).
 *
 * STATUS (10 Oct 2026, r8): final texts in (Privacy EN v3 + AR, Terms EN + AR,
 * approved by Amjad incl. his 1:45 PM no-accounts rule, post-#252 wording).
 * Dropped in verbatim; the only structural conversions are: numbered
 * sections and lettered subsections become LegalSection (subsection: true
 * renders an h3), lists become bullets (text after a list goes in `after`),
 * the retention table becomes "Information: retention" bullets, and code
 * identifiers are wrapped {{like_this}}.
 *
 * Added by Dev, not in the source texts: the Cookies and consent settings
 * section (COOKIES_AR / COOKIES_EN, /privacy#cookies), placed after
 * section 7, which points to it.
 *
 * r8 (Amjad's Yalla, 10 Oct 5:03 PM): effective date 10 October 2026, the
 * legal-identity caveat dropped from section 1, «أفكاركم» in Arabic. No
 * markers are left, so the pages are indexable and in the sitemap.
 * Never write a personal inbox in this copy, and never the old repo name.
 */
export type LegalSection = {
  /** Anchor id (e.g. "cookies", linked from the cookie banner). */
  id?: string;
  heading: string;
  /** A lettered subsection (A., B. / أ. ب.): rendered as h3. */
  subsection?: boolean;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
  /** Paragraphs that follow the bullet list. */
  after?: readonly string[];
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

/** Cookies and consent: Dev's banner tie-in, fill-in-ready for Shoug's text. */
const COOKIES_AR: LegalSection = {
  id: LEGAL_COOKIES_SECTION_ID,
  heading: "الكوكيز وإعدادات الموافقة",
  paragraphs: [
    "أول ما تفتح وين يطلع لك شريط يسألك إذا توافق على كوكيز التحليل والإعلانات. زر «أوافق» وزر «أرفض» بنفس الوضوح، والموقع يشتغل عادي بأي اختيار.",
    "قبل ما تضغط «أوافق» ما يشتغل Google Tag Manager، ولا الأدوات اللي يشغّلها معه، وهي Google Analytics وGoogle Ads وبكسل X (تويتر) وبكسل OpenAI للإعلانات، ولا DataFast، ولا Vercel Web Analytics. وإعدادات الموافقة في Google (Consent Mode) تبدأ كلها «مرفوضة»: تخزين الإعلانات، وتخزين التحليلات، وبيانات المستخدم للإعلانات، وتخصيص الإعلانات.",
    "إذا ضغطت «أرفض» تبقى كلها طافية، ونحفظ اختيارك في متصفحك ({{wain_consent}}) عشان ما نسألك في كل صفحة.",
    "إذا ضغطت «أوافق» تشتغل هالأدوات، وممكن تحط الكوكيز اللي تحت. ووش توصل له كل أداة بعد موافقتك موضّح في هالسياسة.",
    "تقدر تغيّر رأيك أي وقت من «إعدادات الكوكيز» تحت كل صفحة. إذا سحبت موافقتك نوقف الأدوات، ونمسح الكوكيز اللي حطّتها على wain.lol، ونعيد تحميل الصفحة. أما الكوكيز اللي حطّتها Google أو X أو OpenAI على مواقعها هي (مثل doubleclick.net وtwitter.com وt.co وopenai.com)، فتنمسح من إعدادات متصفحك.",
    "فيه أشياء تشتغل بدون موافقة لأن الموقع يحتاجها: اختيارك نفسه ({{wain_consent}})، وكوكيز {{wain_vid}} اللي ينحط بس لما تصوّت عشان نتذكر أصواتك (حوالي 13 شهر)، والإعدادات اللي تنحفظ في متصفحك (القهاوي اللي علّمت إنك رحتها، وإخفاء السلاسل، والمدينة، والترتيب، وإنك سمحت بالموقع). وكوكيز {{wain_claim_ops}} لفريق وين بس (12 ساعة).",
  ],
  bullets: [
    "Google Analytics: {{_ga}} و{{_ga_EFZZET02TT}}، لمدة أقصاها سنتين (والمتصفحات تقصّرها لحوالي 13 شهر).",
    "Google Ads: {{_gcl_au}} لمدة 90 يوم، و{{IDE}} على doubleclick.net (حوالي 13 شهر)، و{{test_cookie}} على doubleclick.net لمدة 15 دقيقة.",
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
    "You can change your mind at any time from Cookie settings at the bottom of every page. If you withdraw consent, we stop the tools, delete the cookies they set on wain.lol, and reload the page. Cookies that Google, X or OpenAI set on their own domains (such as doubleclick.net, twitter.com, t.co and openai.com) can only be cleared in your browser settings.",
    "Some things work without consent because the site needs them: your choice itself ({{wain_consent}}); the {{wain_vid}} cookie, set only when you vote, which remembers your votes (about 13 months); and settings saved in your browser (cafés you marked as visited, hide chains, city, sort order, and that you allowed location). The {{wain_claim_ops}} cookie is for the Wain team only (12 hours).",
  ],
  bullets: [
    "Google Analytics: {{_ga}} and {{_ga_EFZZET02TT}}, up to 2 years (browsers cap this at about 13 months).",
    "Google Ads: {{_gcl_au}} for 90 days; {{IDE}} on doubleclick.net (about 13 months); and {{test_cookie}} on doubleclick.net for 15 minutes.",
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
  updated: "تاريخ السريان: 10 أكتوبر 2026",
  intro: [],
  sections: [
    {
      heading: "1. عن وين",
      paragraphs: [
        "وين (Wain)، المتاح على {{https://wain.lol}}، منصة سعودية لاكتشاف المقاهي، تساعدك على العثور على المقاهي واستكشاف الأحياء والبحث عن التوصيات، وإيجاد أماكن للالتقاء من خلال ميزة بيننا (Halfway).",
        "تشغّل وين شركة مشاريع كالي (Cali Ventures) على العنوان المذكور أدناه.",
        "للتواصل: {{privacy@cali.sa}}",
        "العنوان: Cali Ventures، العقارية 2، شارع العليا، حي العليا، الرياض 12244، المملكة العربية السعودية.",
      ],
    },
    {
      heading: "2. المعلومات التي نجمعها ونعالجها",
      paragraphs: [
        "لا توجد في وين حسابات للزوار ولا تسجيل دخول. لا تحتاج إلى التسجيل أو الدخول لاستخدامه، ولا يخزّن وين أي كلمات مرور أو بيانات دخول للزوار. ولا يجمع وين عناوين البريد الإلكتروني لنشرة بريدية. وخطوة التحقق الوحيدة هي رمز WhatsApp الذي يتلقاه أصحاب المقاهي عند المطالبة بإدراج مقهاهم، كما هو موضّح أدناه.",
        "وبحسب الميزات التي تستخدمها، قد تُعالَج المعلومات التالية.",
      ],
    },
    {
      heading: "أ. معلومات الموقع",
      subsection: true,
      paragraphs: [
        "عندما تسمح للمتصفح بالوصول إلى موقعك، يستخدم وين موقعك على جهازك لحساب المسافات إلى المقاهي. ولا ترسل ميزة المسافة هذه موقعك الجغرافي (GPS) إلى خادم وين أو إلى خدمات التحليلات مباشرةً.",
        "بالنسبة إلى ميزة بيننا:",
      ],
      bullets: [
        "عندما يستخدم شخصان بيننا على الجهاز نفسه دون رابط دعوة، لا يحفظ وين أي سجل لبيننا في قاعدة بياناته.",
        "عند استخدام رابط دعوة، يخزّن وين الموقعين اللذين اختارهما المضيف والصديق على الخريطة، وثلاثة مقاهٍ مقترحة، ووقتي الإنشاء وانتهاء الصلاحية، واللغة المستخدمة.",
        "تُقرَّب الإحداثيات المخزّنة إلى خمس خانات عشرية، أي بدقة تقارب المتر الواحد.",
        "لا ترتبط سجلات بيننا مباشرةً بحساب مسجّل أو اسم أو عنوان بريد إلكتروني أو رقم هاتف.",
        "تُحذف سجلات بيننا تلقائيًا بعد نحو 24 ساعة من انتهاء صلاحية الرابط (نحو 25 ساعة من الإنشاء إذا لم ينضم أحد، ونحو 72 ساعة بعد عرض النتائج). ويجري الحذف أثناء نشاط لاحق في بيننا، لذا قد يستغرق وقتًا أطول.",
        "تحتوي روابط الدعوة على رمز عشوائي، لا على موقعك. وما دام الرابط صالحًا، يستطيع أي شخص لديه الرابط رؤية الموقعين اللذين اختارهما المشاركان.",
        "تنتهي صلاحية الدعوات عمومًا بعد 45 دقيقة إذا لم ينضم المشارك المدعو. وتبقى الروابط التي ظهرت فيها النتائج متاحة لمدة 48 ساعة.",
        "عند ظهور النتائج، يُرسَل إلى فريق وين بريد إلكتروني يتضمن الموقعين وروابط الخرائط والمقاهي المقترحة ومعلومات اللغة، عبر خدمة أتمتة وخدمة بريد إلكتروني. وقد تحتفظ الإحداثيات المأخوذة من GPS في هذه الرسائل بدقتها الكاملة. وتُحفظ الرسائل إلى أن تُحذف يدويًا.",
      ],
      after: [
        "وقد يبقى الموقع الذي اختاره المضيف أيضًا في علامة التبويب الحالية في المتصفح إلى أن تُغلق.",
        "يُرجى مشاركة روابط بيننا مع من تثق بهم فقط.",
      ],
    },
    {
      heading: "ب. البحث والتفاعل مع الذكاء الاصطناعي",
      subsection: true,
      paragraphs: [
        "عند استخدامك ميزة البحث/المحادثة في وين:",
      ],
      bullets: [
        "يُرسَل نص بحثك إلى خدمة Grok من xAI لإنشاء رد.",
        "تسجّل سجلات خادم وين النص المُدخل، ومعرّفًا عشوائيًا لعلامة التبويب في المتصفح، وثلاثة مقاهٍ مقترحة.",
        "إذا وافقت على كوكيز التحليل، لا يتلقى Google Analytics سوى طول النص الذي تكتبه، لا النص نفسه.",
        "قد تحتوي روابط نتائج البحث المُشارَكة على طلب البحث بصيغة مرمّزة. وقد يتلقى مزوّدو التحليلات والإعلانات عنوان الصفحة.",
      ],
      after: [
        "يُرجى تجنّب إدخال معلومات شخصية سرية أو حساسة أو غير ضرورية في البحث.",
      ],
    },
    {
      heading: "ج. الاقتراحات والتصويت",
      subsection: true,
      paragraphs: [
        "عندما ترسل فكرة عبر «أفكاركم» في وين، يُعرض النص المُرسَل علنًا ويُحتفظ به دون مدة حذف تلقائي محددة.",
        "يستخدم التصويت معرّفًا مستعارًا مشتقًا من كوكيز المتصفح {{wain_vid}}. وتُحفظ سجلات التصويت دون مدة حذف تلقائي محددة، مع مراعاة ما يتوفر من وسائل الإزالة.",
        "وقد يُعالَج عنوان IP مؤقتًا لمنع الرسائل المزعجة دون تخزينه في قاعدة بيانات تطبيق وين لهذا الغرض.",
        "يُرجى عدم تضمين معلومات شخصية خاصة في الاقتراحات المنشورة علنًا.",
      ],
    },
    {
      heading: "د. التحقق من أصحاب المقاهي وطلبات المطالبة",
      subsection: true,
      paragraphs: [
        "إذا طالبت بصفحة مقهى أو أدرتها، فقد يعالج وين:",
      ],
      bullets: [
        "رقم هاتفك الجوال.",
        "المقهى المرتبط بطلبك.",
        "رمز تحقق مُجزّأ (hashed).",
        "روابط تعديل مُجزّأة خاصة بالمالك.",
        "المعلومات والصور التي ترسلها عن مقهاك.",
        "اسم ملف مستند الإثبات الذي اخترته، دون المستند نفسه.",
      ],
      after: [
        "تُرسَل رموز التحقق عبر خدمة WhatsApp التابعة لـ Meta، وتبقى صالحة لمدة 10 دقائق.",
        "تبقى روابط التعديل الخاصة بالمالك صالحة لمدة سبعة أيام.",
        "تُحفظ سجلات المطالبة، بما فيها الطلبات غير المكتملة، حاليًا دون حذف تلقائي. وقد تبقى كذلك سجلات التحقق وروابط التعديل منتهية الصلاحية مخزّنة.",
        "قد تُخزَّن صور المقاهي المُرسَلة باستخدام Vercel. وقد تُعرض المعلومات الخاصة بمقهاك علنًا.",
        "وقد يظهر رقم الهاتف المُرسَل أيضًا في سجلات الخادم.",
      ],
    },
    {
      heading: "هـ. استخدام الموقع والكوكيز والمعلومات التقنية",
      subsection: true,
      paragraphs: [
        "يستخدم وين تقنيات تحليلات وإعلانات قد تعالج:",
      ],
      bullets: [
        "الصفحات التي تزورها وعناوين الصفحات كاملة.",
        "التفاعل مع المقاهي وعمليات البحث والخرائط والمشاركات والتصويت وبيننا.",
        "معلومات المتصفح والجهاز والشاشة واللغة والمنطقة الزمنية.",
        "معرّفات الكوكيز ومعرّفات الزوار المستعارة.",
        "التفاعل مع الإعلانات وأحداث التحويل.",
        "عناوين IP ومعلومات الطلبات التي تعالجها الاستضافة أو البنية التحتية لأطراف ثالثة.",
      ],
      after: [
        "تُزال معاملات الروابط غير المتوقعة قبل تحميل أي أداة تحليلات أو إعلانات. ولا تُحمَّل هذه الأدوات في صفحات دعوات بيننا ولا في صفحات تعديل المالك، ولا يرى Vercel Web Analytics صفحات الدعوة إلا بصيغة \"{{/h/[invite]}}\". أما روابط نتائج البحث المُشارَكة ({{/p/…}}) فما زالت تحتوي على الطلب المرمّز.",
        "لا تحتفظ قاعدة بيانات تطبيق وين حاليًا بقاعدة بيانات عامة لحسابات الزوار تتضمن الأسماء أو عناوين البريد الإلكتروني أو عناوين IP أو بيانات المتصفح. ولا يعني ذلك أن هذه المعلومات غير موجودة في سجلات الاستضافة أو لدى خدمات الأطراف الثالثة.",
      ],
    },
    {
      heading: "3. أسباب معالجة المعلومات",
      paragraphs: [
        "يعالج وين المعلومات لأغراض منها:",
      ],
      bullets: [
        "تقديم خدمة اكتشاف المقاهي والتوصيات.",
        "حساب المسافات إلى المقاهي ونتائج بيننا.",
        "إنشاء ردود البحث بمساعدة الذكاء الاصطناعي.",
        "معالجة الاقتراحات والأصوات.",
        "التحقق من ملكية المقاهي وإتاحة إدارة صفحاتها.",
        "تشغيل الموقع وتأمينه ومعالجة أعطاله.",
        "فهم نشاط الزوار وتحسين الميزات.",
        "قياس أداء الإعلانات والتحويلات.",
        "رصد إساءة الاستخدام ومنع الرسائل المزعجة.",
      ],
      after: [
        "تعتمد التحليلات والإعلانات على موافقتك من خلال شريط الكوكيز. أما المعالجة الأخرى الموضّحة أعلاه فهي لازمة لتقديم الميزات التي تطلبها.",
        "لا تُستخدم تقنيات التحليلات والإعلانات الاختيارية إلا بعد اختيارك «أوافق» في شريط الكوكيز. وإذا اخترت «أرفض» أو لم تختر شيئًا، فلا تُحمَّل. ويمكنك تغيير اختيارك في أي وقت عبر رابط «إعدادات الكوكيز» أسفل كل صفحة.",
      ],
    },
    {
      heading: "4. مزوّدو الخدمات والمشاركة",
      paragraphs: [
        "يستعين وين بمزوّدين خارجيين لدعم عملياته، منهم:",
      ],
      bullets: [
        "Vercel: الاستضافة وسجلات الخادم وتخزين الصور وتحليلات الزوار.",
        "Neon: قاعدة بيانات التطبيق.",
        "xAI (Grok): ردود البحث المُنشأة بالذكاء الاصطناعي.",
        "Google: وظائف الخرائط وAnalytics وTag Manager والإعلانات.",
        "X: قياس الإعلانات.",
        "OpenAI: قياس الإعلانات.",
        "DataFast: تحليلات الزوار وتقارير زواحف الذكاء الاصطناعي.",
        "Meta: إرسال رموز التحقق لأصحاب المقاهي عبر WhatsApp.",
        "مزوّدو الأتمتة والبريد الإلكتروني: إرسال إشعارات نتائج بيننا.",
      ],
      after: [
        "تُشارَك المعلومات مع هذه الخدمات بحسب الميزة المعنية والإعداد التقني.",
        "يستخدم بعض مزوّدي الإعلانات تقنيات مطابقة أو تعريف آلية. ويعالج هؤلاء المزوّدون هذه المعلومات وفق سياسات الخصوصية الخاصة بهم.",
        "لا يستخدم وين حاليًا بكسل إعلانات من Meta/Facebook أو TikTok أو Snapchat أو LinkedIn.",
      ],
    },
    {
      heading: "5. المعالجة الدولية",
      paragraphs: [
        "يستعين وين بمزوّدين يعملون دوليًا.",
        "قاعدة بيانات Neon مُعدّة في الولايات المتحدة، في منطقة US East. وتُخزَّن صور المقاهي في منطقة US East لدى Vercel.",
        "وقد يعالج مزوّدون آخرون المعلومات خارج المملكة العربية السعودية. ولم يتأكد وين من مواقع المعالجة الدقيقة لجميعهم.",
        "تخضع معالجة البيانات الشخصية ونقلها عبر الحدود للمتطلبات النظامية المعمول بها في المملكة العربية السعودية.",
      ],
    },
    {
      heading: "6. مدة الاحتفاظ",
      paragraphs: [
        "تشمل ممارسات الاحتفاظ الحالية:",
      ],
      bullets: [
        "سجلات بيننا في قاعدة البيانات: تُحذف تلقائيًا بعد نحو 24 ساعة من انتهاء صلاحية الرابط",
        "رسائل نتائج بيننا: إلى أن تُحذف يدويًا",
        "الأفكار المنشورة في «أفكاركم»: لا تُحذف تلقائيًا",
        "سجلات التصويت على الاقتراحات: لا تُحذف تلقائيًا",
        "سجلات مطالبات أصحاب المقاهي: لا تُحذف تلقائيًا",
        "سجلات التحقق وروابط التعديل منتهية الصلاحية: قد تبقى مخزّنة بعد انتهاء صلاحيتها",
        "سجلات الخادم: يحدّد المزوّد مدة الاحتفاظ، وتختلف المدة بحسب خطة الاستضافة",
        "سجل تغييرات قاعدة بيانات Neon: حتى نحو ست ساعات",
        "بيانات التحليلات والإعلانات: بحسب إعدادات المزوّدين المعنيين وسياسات الاحتفاظ لديهم",
        "كوكيز المتصفح: تختلف بحسب الكوكيز؛ انظر قسم «الكوكيز وإعدادات الموافقة» في سياسة الخصوصية هذه",
      ],
      after: [
        "انتهاء صلاحية رمز التحقق أو رابط التعديل لا يعني بالضرورة حذف السجل المرتبط به.",
        "ويجوز للأفراد، حيثما ينطبق ذلك، طلب إتلاف بياناتهم الشخصية، مع مراعاة المتطلبات النظامية وإمكانية تحديد المعلومات المعنية والتحقق منها.",
      ],
    },
    {
      heading: "7. الكوكيز وأدوات التتبع",
      paragraphs: [
        "يستخدم وين وظائف أساسية وتقنيات تحليلات وإعلانات.",
        "عند زيارتك الأولى لوين، يتيح لك شريط الكوكيز اختيار «أوافق» أو «أرفض» لتقنيات التحليلات والإعلانات الاختيارية. وإلى أن توافق، لا تُستخدم إلا الوظائف الأساسية. ويمكنك سحب اختيارك أو تغييره في أي وقت عبر «إعدادات الكوكيز»، وسحب الموافقة يمسح الكوكيز المرتبطة بها.",
        "التفاصيل موضّحة في قسم «الكوكيز وإعدادات الموافقة» في سياسة الخصوصية هذه.",
      ],
    },
    COOKIES_AR,
    {
      heading: "8. حقوقك المتعلقة بالخصوصية",
      paragraphs: [
        "وفقًا للأنظمة المعمول بها في المملكة العربية السعودية، قد يحق لك:",
      ],
      bullets: [
        "العلم بمعالجة بياناتك الشخصية.",
        "الوصول إلى بياناتك الشخصية.",
        "طلب نسخة مقروءة منها حيثما ينطبق ذلك.",
        "طلب تصحيح البيانات غير الدقيقة أو استكمالها.",
        "طلب الإتلاف حيثما يجيز النظام ذلك.",
        "سحب الموافقة حين تعتمد المعالجة عليها.",
      ],
      after: [
        "لتقديم طلب، تواصل معنا على {{privacy@cali.sa}}.",
        "بعض السجلات غير مرتبطة باسم أو حساب مسجّل. وقد يحتاج وين إلى معلومات كافية لتحديد السجل المعني والتحقق من أن الطلب مصرّح به.",
        "وقد يحق لك أيضًا تقديم شكوى إلى الجهة السعودية المختصة بحماية البيانات.",
      ],
    },
    {
      heading: "9. الأمان",
      paragraphs: [
        "يستخدم وين تدابير تقنية، مثل رموز التحقق المُجزّأة والروابط المقيّدة لبعض الميزات، في عمليات معيّنة.",
        "ومع ذلك، لا يوجد نظام آمن تمامًا. تستخدم روابط دعوات بيننا رمزًا عشوائيًا ولا تحتوي على موقعك، ولا تُحمَّل أدوات الإعلانات وتحليلات Google في صفحات الدعوة أو صفحات تعديل المالك، ولا يرى Vercel Web Analytics صفحات الدعوة إلا بصيغة \"{{/h/[invite]}}\".",
        "لا تشارك روابط التعديل الخاصة أو روابط بيننا مع غير المقصودين بها.",
      ],
    },
    {
      heading: "10. الأطفال",
      paragraphs: [
        "وين خدمة عامة لاكتشاف المقاهي، وليست مصمّمة خصيصًا لجمع المعلومات الشخصية للأطفال.",
        "وحيثما تُعالَج معلومات عن الأطفال، فإنها تخضع للحماية المقرّرة في الأنظمة السعودية.",
      ],
    },
    {
      heading: "11. التغييرات على هذه السياسة",
      paragraphs: [
        "قد نحدّث هذه السياسة مع تغيّر ميزات وين ومزوّديه وممارساته في التعامل مع البيانات.",
        "وسيُحدَّث تاريخ السريان عند نشر سياسة معدّلة.",
      ],
    },
    {
      heading: "12. تواصل معنا",
      paragraphs: [
        "Cali Ventures — وين (Wain)",
        "العقارية 2، شارع العليا",
        "حي العليا، الرياض 12244",
        "المملكة العربية السعودية",
        "البريد الإلكتروني: {{privacy@cali.sa}}",
      ],
    },
  ],
};

const PRIVACY_EN: LegalDoc = {
  title: "Privacy policy",
  description: "What data Wain (wain.lol) collects, why, where it goes, and how to control cookies.",
  updated: "Effective date: 10 October 2026",
  intro: [],
  sections: [
    {
      heading: "1. About Wain",
      paragraphs: [
        "Wain (وين), available at {{https://wain.lol}}, is a Saudi café discovery platform that helps people find cafés, explore neighborhoods, search for recommendations, and find places to meet through its Halfway (بيننا) feature.",
        "Wain is operated by Cali Ventures (شركة مشاريع كالي) at the address below.",
        "Contact: {{privacy@cali.sa}}",
        "Address: Cali Ventures, Al Akaria 2, Al Olaya Street, Al Olaya, Riyadh 12244, Saudi Arabia.",
      ],
    },
    {
      heading: "2. Information We Collect and Process",
      paragraphs: [
        "Wain has no visitor accounts or logins. You don't sign up or sign in to use it, and Wain stores no visitor passwords or login data. Wain does not collect email addresses for a newsletter. The only verification step is the WhatsApp code café owners receive when they claim a listing, described below.",
        "Depending on the features you use, the following information may be processed.",
      ],
    },
    {
      heading: "A. Location information",
      subsection: true,
      paragraphs: [
        "When you allow browser location access, Wain uses your location on your device to calculate distances to cafés. This distance feature does not send your GPS location to Wain’s server or analytics services directly.",
        "For Halfway (بيننا):",
      ],
      bullets: [
        "When two people use Halfway on the same device without an invitation link, Wain does not save a Halfway record in its database.",
        "When an invitation link is used, Wain stores the host’s and friend’s selected map locations, three suggested cafés, creation and expiry timestamps, and the language used.",
        "Stored coordinates are rounded to five decimal places, approximately metre-level precision.",
        "Halfway records are not directly associated with a registered account, name, email address, or telephone number.",
        "Halfway records are deleted automatically about 24 hours after the link expires (about 25 hours after creation if nobody joins, about 72 hours after results are shown). Deletion runs during later Halfway activity, so it can take longer.",
        "Invitation links contain a random code, not your location. While a link is valid, anyone who has it can see both participants’ selected locations.",
        "Invitations generally expire after 45 minutes if the invited participant does not join. Links with results remain available for 48 hours.",
        "When results are generated, an email containing both locations, map links, suggested cafés, and language information is sent to Wain’s team through an automation and email service. GPS-derived coordinates in those emails may retain full precision. Emails are retained until manually deleted.",
      ],
      after: [
        "The host’s selected location may also remain in the current browser tab until that tab is closed.",
        "Please share Halfway links only with people you trust.",
      ],
    },
    {
      heading: "B. Search and AI interactions",
      subsection: true,
      paragraphs: [
        "When you use Wain’s search/chat functionality:",
      ],
      bullets: [
        "Your search text is sent to xAI’s Grok service to generate a response.",
        "Wain’s server logs record the text entered, a randomly generated browser-tab identifier, and three suggested cafés.",
        "If you accept analytics cookies, Google Analytics receives only the length of the text you type, not the text itself.",
        "Shared search-result URLs may contain the search request in encoded form. The page address may be received by analytics and advertising providers.",
      ],
      after: [
        "Please avoid entering confidential, sensitive, or unnecessary personal information into search.",
      ],
    },
    {
      heading: "C. Feedback and voting",
      subsection: true,
      paragraphs: [
        "When you submit an idea through Wain’s feedback board, the submitted text is publicly displayed and retained without a configured automatic deletion period.",
        "Voting uses a pseudonymous identifier derived from the {{wain_vid}} browser cookie. Voting records are retained without a configured automatic deletion period, subject to available removal functionality.",
        "An IP address may be processed temporarily for spam prevention without being stored in Wain’s application database for that purpose.",
        "Please do not include private personal information in publicly submitted feedback.",
      ],
    },
    {
      heading: "D. Café-owner verification and claims",
      subsection: true,
      paragraphs: [
        "If you claim or manage a café listing, Wain may process:",
      ],
      bullets: [
        "Your mobile telephone number.",
        "The café associated with your claim.",
        "A hashed verification code.",
        "Hashed owner-edit links.",
        "Information and photographs you submit about your café.",
        "The selected proof-document filename, but not the document itself.",
      ],
      after: [
        "Verification codes are delivered using Meta’s WhatsApp service and are valid for 10 minutes.",
        "Owner-edit links remain valid for seven days.",
        "Claim records, including incomplete claims, are currently retained without automatic deletion. Expired verification and edit-link records may also remain stored.",
        "Submitted café photographs may be stored using Vercel. Information about your café may be displayed publicly.",
        "The submitted telephone number may also appear in server logs.",
      ],
    },
    {
      heading: "E. Website usage, cookies and technical information",
      subsection: true,
      paragraphs: [
        "Wain uses analytics and advertising technologies that may process:",
      ],
      bullets: [
        "Pages visited and full page addresses.",
        "Interactions with cafés, searches, maps, shares, votes and Halfway.",
        "Browser, device, screen, language and time-zone information.",
        "Cookie identifiers and pseudonymous visitor identifiers.",
        "Advertising interactions and conversion events.",
        "IP addresses and request information processed by hosting or third-party infrastructure.",
      ],
      after: [
        "Unexpected URL parameters are removed before any analytics or advertising tool loads. These tools don’t load on Halfway invite pages or owner-edit pages, and Vercel Web Analytics sees invite pages only as “{{/h/[invite]}}”. Shared search-result links ({{/p/…}}) still contain the encoded request.",
        "Wain’s application database does not currently maintain a general visitor account database containing names, emails, IP addresses or browser details. This does not mean such information is absent from hosting logs or third-party services.",
      ],
    },
    {
      heading: "3. Why We Process Information",
      paragraphs: [
        "Wain processes information for purposes including:",
      ],
      bullets: [
        "Providing café discovery and recommendations.",
        "Calculating café distances and Halfway results.",
        "Generating AI-assisted search responses.",
        "Processing feedback and votes.",
        "Verifying café ownership and enabling listing management.",
        "Operating, securing and troubleshooting the website.",
        "Understanding visitor activity and improving features.",
        "Measuring advertising performance and conversions.",
        "Detecting abuse and preventing spam.",
      ],
      after: [
        "Analytics and advertising rely on your consent through the cookie banner. The other processing described above is needed to provide the features you ask for.",
        "Optional analytics and advertising technologies are used only after you choose Accept in the cookie banner. If you choose Reject, or make no choice, they are not loaded. You can change your choice at any time through the Cookie settings link at the bottom of every page.",
      ],
    },
    {
      heading: "4. Service Providers and Sharing",
      paragraphs: [
        "Wain uses external providers to support its operations, including:",
      ],
      bullets: [
        "Vercel: hosting, server logs, photo storage and visitor analytics.",
        "Neon: application database.",
        "xAI (Grok): AI-generated search responses.",
        "Google: Maps-related functionality, Analytics, Tag Manager and advertising.",
        "X: advertising measurement.",
        "OpenAI: advertising measurement.",
        "DataFast: visitor analytics and AI-crawler reporting.",
        "Meta: WhatsApp delivery of café-owner verification codes.",
        "Automation and email providers: delivery of Halfway results notifications.",
      ],
      after: [
        "Information is shared with these services according to the relevant feature and technical configuration.",
        "Some advertising providers use automated matching or identification technologies. Those providers process this information under their own privacy policies.",
        "Wain does not currently use a Meta/Facebook, TikTok, Snapchat or LinkedIn advertising pixel.",
      ],
    },
    {
      heading: "5. International Processing",
      paragraphs: [
        "Wain uses providers that operate internationally.",
        "The Neon database is configured in the United States, in the US East region. Café photographs are stored in Vercel’s US East region.",
        "Other providers may process information outside Saudi Arabia. Wain has not confirmed the exact processing locations of all of them.",
        "Cross-border processing and transfers of personal data are subject to applicable Saudi legal requirements.",
      ],
    },
    {
      heading: "6. Retention",
      paragraphs: [
        "Current retention practices include:",
      ],
      bullets: [
        "Halfway database records: Deleted automatically about 24 hours after the link expires",
        "Halfway result emails: Until manually deleted",
        "Public feedback ideas: No automatic deletion",
        "Feedback voting records: No automatic deletion",
        "Café-owner claim records: No automatic deletion",
        "Expired verification/edit-link records: May remain stored after expiry",
        "Server logs: Provider-controlled retention; the period depends on the hosting plan",
        "Neon database change history: Up to approximately six hours",
        "Analytics and advertising data: According to relevant provider settings and retention policies",
        "Browser cookies: Varies by cookie; see “Cookies and consent settings” in this Privacy Policy",
      ],
      after: [
        "The expiry of a verification code or edit link does not necessarily mean that the underlying record has been deleted.",
        "Where applicable, individuals may request destruction of personal data, subject to legal requirements and the ability to locate and verify the relevant information.",
      ],
    },
    {
      heading: "7. Cookies and Tracking",
      paragraphs: [
        "Wain uses essential functionality, analytics, and advertising technologies.",
        "When you first visit Wain, a cookie banner lets you Accept or Reject optional analytics and advertising technologies. Until you accept, only essential functionality is used. You can withdraw or change your choice at any time through Cookie settings, and withdrawing consent clears the related cookies.",
        "Details are provided in the “Cookies and consent settings” section of this Privacy Policy.",
      ],
    },
    COOKIES_EN,
    {
      heading: "8. Your Privacy Rights",
      paragraphs: [
        "Subject to applicable Saudi law, you may have rights to:",
      ],
      bullets: [
        "Be informed about personal-data processing.",
        "Access your personal data.",
        "Request a readable copy where applicable.",
        "Request correction or completion of inaccurate data.",
        "Request destruction where legally applicable.",
        "Withdraw consent where processing relies on consent.",
      ],
      after: [
        "To submit a request, contact {{privacy@cali.sa}}.",
        "Some records are not linked to a name or registered account. Wain may need sufficient information to identify the relevant record and verify that the request is authorized.",
        "You may also have the right to submit a complaint to the competent Saudi data-protection authority.",
      ],
    },
    {
      heading: "9. Security",
      paragraphs: [
        "Wain uses technical measures such as hashed verification codes and restricted feature links for certain operations.",
        "However, no system is completely secure. Halfway invitation links use a random code and don’t contain your location, and advertising and Google analytics tools don’t load on invite or owner-edit pages; Vercel Web Analytics sees invite pages only as “{{/h/[invite]}}”.",
        "Do not share private edit links or Halfway links with unintended recipients.",
      ],
    },
    {
      heading: "10. Children",
      paragraphs: [
        "Wain is a general café-discovery service and is not specifically designed to collect children’s personal information.",
        "Where information about children is processed, it is subject to the protections that apply under Saudi law.",
      ],
    },
    {
      heading: "11. Changes to This Policy",
      paragraphs: [
        "We may update this policy as Wain’s features, providers and data practices change.",
        "The effective date will be updated when a revised policy is published.",
      ],
    },
    {
      heading: "12. Contact",
      paragraphs: [
        "Cali Ventures — Wain (وين)",
        "Al Akaria 2, Al Olaya Street",
        "Al Olaya, Riyadh 12244",
        "Saudi Arabia",
        "Email: {{privacy@cali.sa}}",
      ],
    },
  ],
};

const TERMS_AR: LegalDoc = {
  title: "الشروط والأحكام",
  description: "شروط استخدام وين (wain.lol).",
  updated: "تاريخ السريان: 10 أكتوبر 2026",
  intro: [
    "تنظّم هذه الشروط استخدامك لوين (Wain) على {{https://wain.lol}}. واستخدامك للموقع يعني موافقتك عليها، لذا يُرجى قراءتها أولًا.",
  ],
  sections: [
    {
      heading: "1. من يشغّل وين",
      paragraphs: [
        "تشغّل وين شركة Cali Ventures، العقارية 2، شارع العليا، حي العليا، الرياض 12244، المملكة العربية السعودية.",
      ],
    },
    {
      heading: "2. ما هو وين",
      paragraphs: [
        "وين خدمة لاكتشاف المقاهي وتقديم معلومات عنها، تساعدك على العثور على المقاهي في الرياض واستكشاف الأحياء وإيجاد مكان للالتقاء من خلال بيننا (Halfway). لا نبيع أي شيء، ولا نقبل حجوزات، ولا نوصّل طلبات. ولا توجد في وين حسابات للزوار ولا تسجيل دخول، ولا نخزّن أي كلمات مرور أو بيانات دخول للزوار.",
      ],
    },
    {
      heading: "3. معلومات المقاهي قد تكون غير دقيقة",
      paragraphs: [
        "تأتي تفاصيل المقاهي، مثل الأسماء وأوقات العمل والمواقع والصور وما تقدّمه، من مصادر عامة مثل Google Maps، ومن حسابات المقاهي نفسها، ومن أصحاب المقاهي. وقد تكون ناقصة أو غير دقيقة أو قديمة.",
        "قبل أن تذهب، تأكّد من الأوقات والتفاصيل مع المقهى.",
      ],
    },
    {
      heading: "4. الإجابات والاقتراحات المُنشأة بالذكاء الاصطناعي",
      paragraphs: [
        "يُنشئ الذكاء الاصطناعي بعض إجابات البحث والاقتراحات في وين، وقد تكون خاطئة أو ناقصة. تحقّق من التفاصيل قبل الاعتماد عليها.",
      ],
    },
    {
      heading: "5. المحتوى الذي ترسله",
      paragraphs: [
        "عندما تنشر فكرة في «أفكاركم»، أو تصوّت، أو ترسل معلومات أو صورًا عن مقهى بصفتك صاحبه، فإنك تمنحنا ترخيصًا غير حصري ودون مقابل لتخزين هذا المحتوى وعرضه وتكييفه (مثل تغيير مقاس الصور) لتشغيل وين وتحسينه.",
        "أنت مسؤول عمّا ترسله. ويحق لنا تعديل أي محتوى أو إزالته في أي وقت، بما في ذلك المحتوى المخالف لهذه الشروط. تُعرض الأفكار في «أفكاركم» علنًا، فلا تضمّنها معلومات شخصية خاصة.",
      ],
    },
    {
      heading: "6. مطالبات أصحاب المقاهي",
      paragraphs: [
        "لا يجوز لك المطالبة بصفحة مقهى إلا إذا كنت صاحبه أو مخوّلًا بالتصرف نيابةً عنه. وعليك الحرص على دقة المعلومات التي ترسلها.",
        "يحق لنا التحقق من أي مطالبة أو رفضها أو سحبها في أي وقت. كما يحق لنا تعديل أي صفحة مقهى أو إزالتها.",
      ],
    },
    {
      heading: "7. الاستخدام المقبول",
      paragraphs: [
        "عند استخدامك وين، لا يجوز لك:",
      ],
      bullets: [
        "سحب البيانات (scraping) أو تنزيلها بكميات كبيرة أو الوصول إلى الموقع ببرامج آلية، إلا عبر الواجهات العامة التي نوفّرها لهذا الغرض وفي حدودها.",
        "محاولة إثقال الموقع أو اختراقه أو تجاوز حدود الطلبات فيه.",
        "الهندسة العكسية لشيفرة الموقع أو أنظمته أو فكّها أو نسخها.",
        "إرسال رسائل مزعجة أو أصوات وهمية أو معلومات كاذبة أو محتوى مسيء أو مخالف للأنظمة أو بيانات شخصية لغيرك.",
        "المطالبة بمقهى لا تملكه أو غير مخوّل بإدارته، أو انتحال شخصية غيرك.",
        "استخدام الموقع بأي طريقة تخالف أنظمة المملكة العربية السعودية.",
      ],
      after: [
        "يحق لنا تقييد وصول من يخالف هذه القواعد أو حظره.",
      ],
    },
    {
      heading: "8. روابط وخدمات الأطراف الثالثة",
      paragraphs: [
        "تفتح بعض الروابط والميزات خدماتٍ لا نديرها أو تعتمد عليها، مثل Google Maps وWhatsApp وحسابات المقاهي نفسها. وتخضع هذه الخدمات لشروطها وسياسات الخصوصية الخاصة بها، ولسنا مسؤولين عنها.",
      ],
    },
    {
      heading: "9. لا ضمانات",
      paragraphs: [
        "يُقدَّم وين «كما هو» و«حسب توفّره»، دون أي ضمانات من أي نوع، بما في ذلك دقة المعلومات أو توفّر الموقع دائمًا. ويحق لنا تغيير أي ميزة أو إيقافها في أي وقت.",
      ],
    },
    {
      heading: "10. حدود المسؤولية",
      paragraphs: [
        "في الحدود التي يسمح بها النظام، لا نتحمّل المسؤولية عن الخسائر غير المباشرة أو التبعية، أو مشوار ضاع، أو مقهى وجدته مغلقًا، أو قرارات اتُّخذت بناءً على إجابات الذكاء الاصطناعي أو معلومات صفحات المقاهي، أو تصرفات الأطراف الثالثة. ولا يوجد في هذه الشروط ما يستبعد مسؤولية لا يجوز استبعادها بموجب الأنظمة المعمول بها.",
      ],
    },
    {
      heading: "11. الكوكيز",
      paragraphs: [
        "لا يلزمك قبول كوكيز التحليل والإعلانات لاستخدام وين. وكيفية استخدامنا للكوكيز وطريقة تغيير اختيارك موضّحة في قسم «الكوكيز وإعدادات الموافقة» في سياسة الخصوصية.",
      ],
    },
    {
      heading: "12. التغييرات على هذه الشروط",
      paragraphs: [
        "قد نحدّث هذه الشروط. وسنغيّر تاريخ السريان في الأعلى، واستمرارك في استخدام الموقع بعد التحديث يعني موافقتك على الشروط الجديدة.",
      ],
    },
    {
      heading: "13. النظام المطبّق",
      paragraphs: [
        "تخضع هذه الشروط لأنظمة المملكة العربية السعودية، وتختص محاكم الرياض بالنظر في أي نزاع.",
      ],
    },
    {
      heading: "14. تواصل معنا",
      paragraphs: [
        "Cali Ventures — وين (Wain)",
        "العقارية 2، شارع العليا",
        "حي العليا، الرياض 12244",
        "المملكة العربية السعودية",
        "البريد الإلكتروني: {{privacy@cali.sa}}",
      ],
    },
  ],
};

const TERMS_EN: LegalDoc = {
  title: "Terms and conditions",
  description: "The terms for using Wain (wain.lol).",
  updated: "Effective date: 10 October 2026",
  intro: [
    "These terms cover your use of Wain (وين) at {{https://wain.lol}}. By using the site you agree to them, so please read them first.",
  ],
  sections: [
    {
      heading: "1. Who runs Wain",
      paragraphs: [
        "Wain is operated by Cali Ventures, Al Akaria 2, Al Olaya Street, Al Olaya, Riyadh 12244, Saudi Arabia.",
      ],
    },
    {
      heading: "2. What Wain is",
      paragraphs: [
        "Wain is a café discovery and information service that helps you find cafés in Riyadh, explore neighbourhoods, and find a place to meet through Halfway (بيننا). We don't sell anything, take bookings, or deliver orders. Wain has no visitor accounts or logins, and we store no visitor passwords or login data.",
      ],
    },
    {
      heading: "3. Café information may be inaccurate",
      paragraphs: [
        "Café details, such as names, opening hours, locations, photos and what they serve, come from public sources such as Google Maps, from the cafés' own accounts, and from café owners. They may be incomplete, inaccurate or out of date.",
        "Before you go, check the hours and details with the café.",
      ],
    },
    {
      heading: "4. AI-generated answers and suggestions",
      paragraphs: [
        "Some search answers and suggestions on Wain are generated by AI. They may be wrong or incomplete. Check the details before you rely on them.",
      ],
    },
    {
      heading: "5. Your content",
      paragraphs: [
        "When you post an idea on the feedback board, vote, or submit information or photos about a café as its owner, you give us a non-exclusive, royalty-free licence to store, display and adapt that content (for example, resizing photos) to operate and improve Wain.",
        "You are responsible for what you submit. We may edit or remove any content at any time, including content that breaks these terms. Feedback ideas are shown publicly, so don't include private personal information.",
      ],
    },
    {
      heading: "6. Café-owner claims",
      paragraphs: [
        "You may claim a café listing only if you are its owner or are authorised to act for the owner. You must keep the information you submit accurate.",
        "We may verify a claim, refuse it, or withdraw it at any time. We may also edit or remove any listing.",
      ],
    },
    {
      heading: "7. Acceptable use",
      paragraphs: [
        "When you use Wain, don't:",
      ],
      bullets: [
        "Scrape, bulk-download, or access the site with automated tools, except through public interfaces we provide for that purpose and within their limits.",
        "Try to overload or break into the site, or get around its request limits.",
        "Reverse engineer, decompile or copy the site's code or systems.",
        "Send spam, fake votes, false information, abusive or unlawful content, or other people's personal details.",
        "Claim a café you don't own or aren't authorised to manage, or pretend to be someone else.",
        "Use the site in any way that breaks the laws of Saudi Arabia.",
      ],
      after: [
        "We may limit or block access for anyone who breaks these rules.",
      ],
    },
    {
      heading: "8. Third-party links and services",
      paragraphs: [
        "Some links and features open or use services we don't run, such as Google Maps, WhatsApp and cafés' own accounts. Those services are governed by their own terms and privacy policies, and we aren't responsible for them.",
      ],
    },
    {
      heading: "9. No warranties",
      paragraphs: [
        "Wain is provided as is and as available, without warranties of any kind, including that the information is accurate or that the site will always be available. We may change or stop any feature at any time.",
      ],
    },
    {
      heading: "10. Limitation of liability",
      paragraphs: [
        "To the extent permitted by law, we aren't liable for indirect or consequential losses, a wasted trip, a café you found closed, decisions made on AI answers or listing information, or what third parties do. Nothing in these terms excludes liability that cannot be excluded under applicable law.",
      ],
    },
    {
      heading: "11. Cookies",
      paragraphs: [
        "You don't have to accept analytics or advertising cookies to use Wain. How we use cookies, and how to change your choice, is explained in the \"Cookies and consent settings\" section of our Privacy Policy.",
      ],
    },
    {
      heading: "12. Changes to these terms",
      paragraphs: [
        "We may update these terms. We'll change the effective date at the top, and if you keep using the site after an update, you accept the new terms.",
      ],
    },
    {
      heading: "13. Governing law",
      paragraphs: [
        "These terms are governed by the laws of the Kingdom of Saudi Arabia. The courts of Riyadh have jurisdiction over any dispute.",
      ],
    },
    {
      heading: "14. Contact",
      paragraphs: [
        "Cali Ventures — Wain (وين)",
        "Al Akaria 2, Al Olaya Street",
        "Al Olaya, Riyadh 12244",
        "Saudi Arabia",
        "Email: {{privacy@cali.sa}}",
      ],
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
      ...(section.subsection ? { subsection: true } : {}),
      ...(section.paragraphs ? { paragraphs: section.paragraphs.map(joinPrefixes) } : {}),
      ...(section.bullets ? { bullets: section.bullets.map(joinPrefixes) } : {}),
      ...(section.after ? { after: section.after.map(joinPrefixes) } : {}),
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
      ...(section.after ?? []),
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
