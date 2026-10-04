import type { Language } from "./types";

/**
 * Privacy policy + Terms of use copy (AR + EN). Written from a code audit,
 * 4 Oct 2026. Draft for Amjad's legal review: anything the code cannot
 * prove is a visible [AMJAD TO CONFIRM: …] / [للتأكيد من أمجد: …] marker.
 * Arabic is its own text, not a translation. Never write the old repo name.
 */
export type LegalSection = {
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
 * GTM-W3TM4552 container version the copy was checked against (4 Oct 2026).
 * Everything this page says about what Google Tag Manager forwards (which
 * event params reach GA4, that `feedback_text` and the dataLayer
 * `cafes` array are not forwarded, `pack_id` on 8 events) is true for
 * this version only. When the container is republished, re-check the
 * analytics and بيننا sections against the new version, then bump this
 * number and the "version 13" sentence in AR + EN. scripts/check-legal.ts
 * asserts the copy names this version, and fails if LEGAL_GTM_LIVE_VERSION
 * is set to a different number.
 */
export const LEGAL_GTM_CONTAINER_VERSION = 13;

/**
 * QA r2 M4: the Google tag's automatic user-provided data collection
 * (email / phone / address typed into forms, sent hashed for ad
 * measurement) is on in the gtag config. Amjad decides:
 * - "pending": the M4 marker stays in the Google Ads paragraph (AR + EN).
 * - "off": he turned it off in the Google tag settings; delete the marker,
 *   no sentence is needed.
 * - "kept": replace the marker with the disclosure sentence it quotes and
 *   add the same point to the summary and the sharing list.
 * scripts/check-legal.ts enforces the copy that matches this value.
 */
export const LEGAL_GOOGLE_USER_DATA: "pending" | "off" | "kept" = "pending";

/** Visible review markers. The page highlights any text in this shape. */
export const LEGAL_PLACEHOLDER_PATTERN =
  /(\[(?:AMJAD TO CONFIRM|للتأكيد من أمجد):[^\]]*\])/;

/**
 * Latin identifiers (cookie names, tag IDs, paths) are written {{like_this}}.
 * The page renders them as <bdi dir="ltr"> so they don't reorder inside
 * Arabic text (e.g. _ga_<ID> or GTM-W3TM4552). Never use it in title or
 * description: those go to <head> as plain text.
 */
export const LEGAL_LTR_PATTERN = /\{\{([^}]+)\}\}/;

const UPDATED = {
  ar: "آخر تحديث: 4 أكتوبر 2026",
  en: "Last updated: 4 October 2026",
} as const;

const CONTACT_EMAIL = {
  ar: "[للتأكيد من أمجد: {{privacy@wain.lol}}]",
  en: "[AMJAD TO CONFIRM: {{privacy@wain.lol}}]",
} as const;

/** Same mailbox as privacy for now (placeholder 1); Amjad may pick another. */
const TERMS_CONTACT_EMAIL = {
  ar: "[للتأكيد من أمجد: {{privacy@wain.lol}}، أو إيميل ثاني لأسئلة الشروط]",
  en: "[AMJAD TO CONFIRM: {{privacy@wain.lol}}, or a separate address for questions about the terms]",
} as const;

const CONTROLLER = {
  ar: "[للتأكيد من أمجد: شركة مشاريع كالي (Cali Ventures)، سجل تجاري رقم 7049682987، والعنوان المسجّل]",
  en: "[AMJAD TO CONFIRM: Cali Ventures (شركة مشاريع كالي), CR 7049682987, and its registered address]",
} as const;

const PRIVACY_AR: LegalDoc = {
  title: "سياسة الخصوصية",
  description:
    "وش البيانات اللي يجمعها وين (wain.lol)، ليش، ووين تروح، وحقوقك حسب نظام حماية البيانات الشخصية في السعودية.",
  updated: UPDATED.ar,
  intro: [
    "هذي الصفحة توضّح وش البيانات اللي ممكن نعرفها عنك لما تستخدم وين (wain.lol)، ليش نحتاجها، وين تروح، وكيف تتحكم فيها. كتبناها من اللي يسويه الموقع فعلًا، ومع مراعاة نظام حماية البيانات الشخصية في المملكة العربية السعودية.",
  ],
  sections: [
    {
      heading: "مين حنا",
      paragraphs: [
        `وين يديره ${CONTROLLER.ar}، وهي الجهة المسؤولة (المتحكّم) عن البيانات الشخصية المذكورة هنا.`,
        `للتواصل في أي شي يخص الخصوصية: ${CONTACT_EMAIL.ar}. وتقدر كمان تضغط «تواصل معنا» تحت الصفحة، ويفتح لك محادثة واتساب معنا.`,
      ],
    },
    {
      heading: "باختصار",
      bullets: [
        "ما فيه حسابات ولا تسجيل. ما نطلب اسمك ولا إيميلك ولا رقم جوالك عشان تستخدم وين.",
        "نستخدم أدوات تحليل (Google Analytics عن طريق Google Tag Manager، وVercel Web Analytics، وDataFast) عشان نفهم كيف ينستخدم الموقع، وهذا يشمل اللي تكتبه في خانة البحث.",
        "موقعك ما ناخذه إلا إذا سمحت فيه، والمتصفح يسألك أول ما تفتح صفحة فيها قهاوي. في «قريب مني» وترتيب المسافة، يبقى موقعك في جهازك. في «بيننا» تنرسل النقاط اللي تحددها لخادمنا، والتفاصيل تحت.",
        "الموقع ما يعرض إعلانات. لكن نستخدم أدوات إعلانية من Google (Google Ads) وX (تويتر) وOpenAI تسجّل زياراتك للصفحات ولما يطلع لك «بيننا» بنتائج، عشان نقيس تسويقنا. وGoogle Ads يستخدم الزيارات كمان لإعادة الاستهداف (يعني يعرض إعلاناتنا لاحقًا للي زاروا الموقع)، وبكسل OpenAI يقدر يلتقط إيميل أو رقم جوال مكتوب في نموذج بالصفحة. التفاصيل تحت.",
        "رابط دعوة «بيننا» فيه نقطتك، ويوصل لـ Google Analytics وأدوات القياس الإعلاني. التفاصيل في قسم «بيننا».",
      ],
    },
    {
      heading: "التحليلات وقياس الاستخدام",
      paragraphs: [
        "في كل صفحة يشتغل Google Tag Manager (الحاوية {{GTM-W3TM4552}})، وهو اللي يمرّر الأحداث لـ Google Analytics 4 ({{G-EFZZET02TT}}). ويسجّل Google Analytics عادةً الصفحات اللي تزورها، ونوع الجهاز والمتصفح، والموقع التقريبي من عنوان IP، والصفحة اللي جيت منها، ويحط كوكيز مثل {{_ga}} و{{_ga_<ID>}}. [للتأكيد من أمجد: إعدادات GA4 مثل التعامل مع IP وGoogle signals والربط الإعلاني]",
        "من الأحداث اللي نرسلها لـ Google Analytics: لما تطلع لك 3 اقتراحات، أو تفتح الخريطة، أو تشارك، أو تعطي إعجاب لقهوة، أو تختار حي، أو تبحث أو ترتّب في صفحة كل الأحياء، أو تستخدم «بيننا»، أو تقيّم النتائج. وتشمل أشياء مثل معرّف القهوة عندنا، والحي، واللغة، وفي «بيننا» معرّف الدعوة (التفاصيل في قسم «بيننا»). وGoogle Analytics يسجّل كمان بعض الأحداث تلقائيًا، مثل التمرير والضغط على روابط خارجية.",
        "اللي يمرّره Google Tag Manager لأدوات التحليل والإعلان، زي ما هو موصوف في هالصفحة، هو حسب النسخة 13 من الحاوية (فحصناها في 4 أكتوبر 2026).",
        "اللي تكتبه في خانة الشات، واللي تبحث عنه في صفحة كل الأحياء، ينرسل كنص لـ Google Analytics. لا تكتب فيها معلومات شخصية.",
        "لما تقيّم النتائج وتقول إنها ما فادتك، تقدر تختار «شي ثاني» وتضيف ملاحظة قصيرة. الملاحظة تنرسل لـ Google Tag Manager داخل الصفحة، لكن إعداداتنا الحالية ما ترسلها لـ Google Analytics ولا لأي أداة ثانية، وما نحفظها في قاعدة بياناتنا.",
        "Vercel Web Analytics يحسب زيارات الصفحات.",
        "DataFast ({{datafa.st}}) أداة تحليل تسجّل الصفحات، والمصدر اللي جيت منه، والمتصفح والجهاز، والدولة. [للتأكيد من أمجد: هل DataFast يحط كوكيز أو معرّف للزائر؛ ما شفنا له كوكيز في فحص 4 أكتوبر] وتوصل لـ DataFast كمان معلومة عن الطلب لما يفتح صفحة برنامج زحف معروف تابع لذكاء اصطناعي، مو الزوار العاديين.",
        "Google Ads: نفس وسم Google يشغّل كمان Google Ads (الحساب {{AW-18418378883}}). نستخدمه لقياس إعلاناتنا ولإعادة الاستهداف (remarketing)، يعني يسجّل زيارتك عشان Google يقدر يعرض إعلاناتنا لاحقًا للناس اللي زاروا الموقع. ويحط كوكيز {{_gcl_au}}، ويحفظ {{_gcl_ls}} في متصفحك. وGoogle Analytics مربوط بأدوات Google الإعلانية (DoubleClick). [للتأكيد من أمجد: نخلي جمع بيانات المستخدم التلقائي في وسم Google أو نطفّيه. الخيار مفعّل الحين: الوسم يقدر يلتقط إيميل أو رقم جوال أو عنوان مكتوب في نموذج بالصفحة. (أ) إذا طفّيناه من إعدادات وسم Google: نحذف هذي الملاحظة بس، وما نحتاج نضيف جملة. (ب) إذا خلّيناه: نحط مكان هذي الملاحظة «ووسم Google مفعّل فيه الجمع التلقائي للبيانات اللي يدخلها المستخدم: يقدر يلتقط إيميل أو رقم جوال أو عنوان مكتوب في نموذج بالصفحة، ويرسله لـ Google كبصمة رقمية ما تنعكس (hash) لقياس الإعلانات.»، ونضيف نفس النقطة في «باختصار» وفي قائمة «مع مين نشارك البيانات»]",
        "القياس الإعلاني من X وOpenAI: كمان يحمّل Google Tag Manager بكسل X (تويتر) وبكسل OpenAI للقياس الإعلاني. يسجّلون زيارات الصفحات ولما يطلع بحث «بيننا» بنتائج، وبكسل X يسجّل كمان لما تطوّل في صفحة. ويحطون كوكيز خاصة فيهم، مثل {{_twpid}} و{{_twsid}} من X و{{__obref}} من OpenAI، وكوكيز على نطاقاتهم هم، وبكسل OpenAI يحفظ {{oaiq_cs:…}} في تبويب المتصفح. هذي الجهات تستخدم البيانات حسب سياساتها. [للتأكيد من أمجد: الغرض من بكسلات X وOpenAI، وهل نحتاج موافقة قبل تشغيلها]",
        "بكسل OpenAI مفعّل فيه «المطابقة المتقدّمة التلقائية» (automatic advanced matching). هذا يخليه يقدر يلتقط إيميل أو رقم جوال مكتوب في نموذج بالصفحة، ويرسله لـ OpenAI كبصمة رقمية ما تنعكس (hash). في فحص 4 أكتوبر ما شفناه أرسل شي (وما كتبنا بيانات في أي نموذج)، لكن الخيار مفعّل. [للتأكيد من أمجد: نخلي المطابقة المتقدّمة في بكسل OpenAI أو نطفّيها في GTM]",
        "مدة الاحتفاظ: Google Analytics [للتأكيد من أمجد: مدة الاحتفاظ المضبوطة في GA4]، DataFast [للتأكيد من أمجد: مدة احتفاظ DataFast]، Vercel Web Analytics حسب إعدادات Vercel [للتأكيد من أمجد: مدة احتفاظ Vercel Analytics].",
      ],
    },
    {
      heading: "خانة الشات والبحث",
      paragraphs: [
        "اللي تكتبه يروح لخادمنا عشان نختار لك 3 قهاوي. ويحفظ الخادم سجل تعلّم داخلي بسيط فيه: نصك، ومعرّفات القهاوي الـ3، واللغة، ومعرّف جلسة عشوائي محفوظ في تبويب متصفحك. نفس الشي لما تفتح أحد الاقتراحات في الخريطة. هذا السجل يكون في سجلات الخادم وتخزين مؤقت. [للتأكيد من أمجد: مدة الاحتفاظ بسجلات الخادم وسجل التعلّم]",
        "عشان نكتب الجملة القصيرة اللي فوق الاقتراحات، ممكن يرسل الخادم نصك، وأسماء القهاوي اللي اخترناها والحي اللي فيه كل وحدة منها، لـ xAI (مزوّد الذكاء الاصطناعي). ما نرسل معها موقعك ولا أي رقم يعرّف فيك. [للتأكيد من أمجد: هل ردّ xAI شغّال على الموقع الحين]",
        "القهاوي اللي علّمت إنك رحتها تنحفظ في متصفحك، وتنرسل مع كل طلب عشان ما نكررها عليك. ما نحفظها عندنا.",
      ],
    },
    {
      heading: "اقتراح قهوة",
      paragraphs: [
        "إذا لصقت رابط Google Maps عشان تقترح قهوة، نحفظ الرابط، والاسم والحي اللي نطلّعهم منه، ووقت الاقتراح، في سجلات الخادم وتخزين مؤقت. خادمنا يفتح الرابط على Google Maps عشان يعرف الاسم والحي.",
        "قائمة الاقتراحات (الرابط، والاسم، والحي، والوقت) يقدر أي أحد يشوفها على عنوان عام في الموقع ({{/api/suggest}}) طول ما هي محفوظة عندنا. وممكن ينحفظ الاقتراح كمهمة في متتبّع المهام العام عندنا على GitHub. [للتأكيد من أمجد: هل إرسال الاقتراحات لـ GitHub مفعّل]",
        "الاقتراح يحتاج الرابط بس، فلا تضيف معه معلومات شخصية.",
      ],
    },
    {
      heading: "صفحة الأفكار والإعجابات",
      paragraphs: [
        "الأفكار اللي تكتبها في صفحة الأفكار تنحفظ في قاعدة بياناتنا (Neon) وتطلع للكل مع عدد الأصوات. ما ينحفظ معها اسم ولا إيميل ولا رابط الصفحة اللي كنت فيها. لا تكتب فيها معلومات شخصية. [للتأكيد من أمجد: مدة الاحتفاظ بالأفكار، الكود ما يحذفها]",
        "لما تصوّت على فكرة أو تعطي إعجاب لقهوة، نحط كوكيز اسمه {{wain_vid}} فيه رقم عشوائي (لمدة أقصاها 400 يوم). ونحفظ مع صوتك بصمة رقمية ما تنعكس (hash) من هذا الرقم بس، عشان ما ينحسب الصوت مرتين. إذا شلت الإعجاب عن قهوة ينحذف سجله.",
        "عشان نوقف الإزعاج، نتحقق مؤقتًا من عنوان IP في ذاكرة الخادم (حد للطلبات)، وما نحفظه في قاعدة البيانات.",
      ],
    },
    {
      heading: "موقعك (قريب مني والمسافة)",
      paragraphs: [
        "ما نعرف موقعك إلا إذا سمحت للمتصفح. أول ما تفتح الصفحة الرئيسية أو صفحة قهوة أو قائمة قهاوي (مثل صفحة حي)، يطلب وين من المتصفح مكانك على طول، مو بس لما تضغط «قريب مني». وإذا ما قد اخترت قبل، يطلع لك المتصفح طلب الإذن وقتها.",
        "إذا سمحت، نستخدم موقعك داخل متصفحك عشان نرتّب القهاوي حسب القرب ونوريك كم تبعد. لهذي الميزات ما ينرسل موقعك لخادمنا ولا لأي طرف ثاني.",
        "نحفظ في متصفحك بس إنك سمحت بالموقع (نعم أو لا)، وما نحفظ الإحداثيات أبد.",
        "تقدر توقف إذن الموقع أي وقت من إعدادات المتصفح.",
      ],
    },
    {
      heading: "بيننا (نص المسافة)",
      paragraphs: [
        "تقدر تحدد نقطتك من موقعك، أو بإحداثيات، أو برابط Google Maps. نقرّب النقطة لدقة تقارب مترًا واحدًا.",
        "النقاط تروح لخادمنا عشان نلقى قهاوي في النص بينكم. وإذا لصقت رابط Maps، خادمنا يسأل Google Maps عن مكانه.",
        "لما ترسل دعوة للشخص اللي بتقابله، نقطتك تكون داخل رابط الدعوة ({{/h/…}}). أي أحد عنده الرابط يقدر يعرف هالنقطة، فشاركه بس معه.",
        "«بيننا» ما يطلب إيميلك. لكن معرّف الدعوة فيه نقطتك، ويوصل لـ Google Analytics وأدوات القياس الإعلاني لما تنشئ رابط الدعوة أو تفتحه. [للتأكيد من أمجد: هل ينصلح هذا قبل النشر؛ فيه تعديل جاري (معرّف دعوة عشوائي، أو إخفاء روابط {{/h/}} عن أدوات التحليل والبكسلات)، ولما ينعتمد تتغيّر هذي الفقرة]",
        "بالتفصيل: Google Analytics يوصله معرّف الدعوة داخل عنوان الصفحة لما ينفتح الرابط، وباسم {{pack_id}} في ما يصل إلى 8 أحداث من «بيننا». واحد منها، {{meet_halfway_invite_share}}، ينرسل من جهازك أنت أول ما تنشئ الرابط، قبل ما أحد يفتحه، وبعدها ينتقل تبويبك لرابط الدعوة. ولما يكون رابط الدعوة مفتوح، يوصل عنوانه كمان لـ Google Ads وX وOpenAI، ويوصل كمان لـ DataFast وVercel Web Analytics، اللي يسجّلون الصفحات اللي تفتحها. حدث النتائج نفسه ما فيه القهاوي ولا مسافاتها: فيه بس اللغة، وعدد القهاوي، وهل البحث جاء من دعوة. لكن إذا فتحت وحدة من القهاوي أو ضغطت «الخريطة» أو شاركتها، يعرف Google Analytics أي قهوة هي: صفحة القهوة اللي فتحتها، ومعرّف القهوة في حدث الخريطة أو المشاركة، ورابطها في Google Maps (ينسجّل كضغطة على رابط خارجي). وفي الدعوة، ممكن تحمل هذي الأحداث عنوان صفحة الدعوة كمان.",
        "عشان تشوفون نفس النتائج، نحفظ نقاط الجلسة والقهاوي الـ3 في قاعدة بياناتنا. الرابط يشتغل 45 دقيقة وأنت تنتظر الشخص اللي بتقابله، و48 ساعة بعد ما تطلع النتائج. [للتأكيد من أمجد: متى تنحذف الجلسات المنتهية من قاعدة البيانات، الكود يوقف عرضها بس ما يحذفها]",
        "لما يطلع بحث «بيننا» بنتائج، يرسل خادمنا ملخص لخدمة أتمتة ترسله بالإيميل لفريق وين. الملخص فيه النقطتين بالإحداثيات الدقيقة وروابط الخريطة، والقهاوي الـ3 ومسافاتها، واللغة، ومعرّف الجلسة. ما فيه اسم ولا إيميل ولا جوال. [للتأكيد من أمجد: مزوّد الأتمتة، الكود يرسل لـ Cursor Automations، ومدة الاحتفاظ بهالإيميلات]",
      ],
    },
    {
      heading: "واتساب وأصحاب القهاوي",
      paragraphs: [
        "زر «تواصل معنا» وزر «تملك هالقهوة؟» يفتحون محادثة واتساب مع رقمنا. اللي تكتبه هناك يخضع لشروط واتساب (Meta) ويشوفه فريقنا. [للتأكيد من أمجد: مدة الاحتفاظ بمحادثات واتساب]",
        "إذا عدّل صاحب القهوة صفحتها عن طريق رابط خاص، نحفظ المعلومات والصور اللي يرسلها في قاعدة بياناتنا وفي Vercel Blob، وتظهر للجميع في صفحة القهوة. [للتأكيد من أمجد: هل توثيق الملكية داخل الموقع مستخدم؛ الكود يدعم رقم جوال ورمز تحقق عبر واتساب وإثبات سجل تجاري، وتنبيه بالإيميل عبر Resend]",
        "[للتأكيد من أمجد: هل رقم واتساب الآلي (WhatsApp Business) شغّال؛ إذا شغّال يستقبل رقم المرسل ونص رسالته ويرد عليه]",
      ],
    },
    {
      heading: "الاستضافة وسجلات الخادم",
      paragraphs: [
        "الموقع مستضاف على Vercel. مثل أي موقع، الخادم يستقبل عنوان IP، ونوع المتصفح، والصفحة المطلوبة، والوقت، وVercel يحتفظ بسجلات. [للتأكيد من أمجد: مدة الاحتفاظ بسجلات Vercel حسب الباقة]",
      ],
    },
    {
      heading: "اللي ينحفظ في متصفحك",
      bullets: [
        "اختيار المدينة، وزر «محلي بس» (إخفاء السلاسل)، والقهاوي اللي علّمت إنك رحتها، وإنك سمحت بالموقع (نعم أو لا).",
        "بيانات مؤقتة للتبويب: الترتيب اللي اخترته، وحالة انتظار «بيننا» (فيها نقطتك أنت)، وتقييمك للنتائج، ومعرّف الجلسة.",
        "الكوكيز: {{wain_vid}} (حقنا، للتصويت)، وكوكيز Google Analytics ({{_ga}} و{{_ga_<ID>}})، وكوكيز Google Ads وX وOpenAI المذكورة فوق ({{_gcl_au}} و{{_twpid}} و{{_twsid}} و{{__obref}}).",
        "تخزين أدوات الإعلان: Google Ads يحفظ {{_gcl_ls}} في التخزين المحلي للمتصفح، وبكسل OpenAI يحفظ {{oaiq_cs:…}} في تخزين التبويب.",
        "تقدر تمسحها كلها أي وقت من إعدادات المتصفح.",
      ],
    },
    {
      heading: "Google Maps وGoogle Places",
      paragraphs: [
        "معلومات القهاوي (الأوقات، الصور، المواقع) نجمعها من مصادر عامة منها Google Maps وGoogle Places. الصور تطلع من موقعنا، ولما يجيب خادمنا صورة من Google ما يرسل معها أي شي عنك.",
        "ما فيه خريطة Google مدمجة في صفحاتنا. لما تضغط «الخريطة» ينفتح لك Google Maps، وهناك تنطبق سياسة خصوصية Google.",
      ],
    },
    {
      heading: "على أي أساس نعالج بياناتك",
      paragraphs: [
        "نعتمد على موافقتك (مثل إذن الموقع، واستخدامك لـ «بيننا»، ونشرك لفكرة)، وعلى مصلحتنا المشروعة في تشغيل الموقع وتحسينه وحمايته (مثل التحليلات وسجلات الأمان). [للتأكيد من أمجد: صياغة الأساس النظامي، وهل نحتاج شريط موافقة على الكوكيز والتحليلات؛ كوكيز التحليل والإعلان تنحط الحين من أول زيارة بدون خطوة موافقة]",
      ],
    },
    {
      heading: "مع مين نشارك البيانات",
      paragraphs: [
        "نشارك البيانات مع هالمزوّدين. بعضهم يشغّل الموقع لنا، وأدوات التحليل والإعلان تستخدم البيانات كمان حسب سياساتها:",
      ],
      bullets: [
        "Google: Tag Manager وAnalytics، وGoogle Ads لقياس الإعلانات وإعادة الاستهداف (عرض إعلاناتنا لاحقًا للي زاروا الموقع)، وGoogle Maps لقراءة الروابط والمواقع.",
        "Vercel: الاستضافة، والسجلات، وWeb Analytics، وتخزين صور أصحاب القهاوي (Blob).",
        "Neon: قاعدة البيانات (الأفكار، والأصوات، وجلسات «بيننا»، وبيانات أصحاب القهاوي).",
        "DataFast: التحليلات.",
        "X (تويتر) وOpenAI: بكسلات القياس الإعلاني (وبكسل OpenAI فيه المطابقة المتقدّمة المذكورة فوق).",
        "xAI: كتابة جملة الرد القصيرة في الشات (نصك، وأسماء القهاوي المختارة وأحياؤها).",
        "خدمة الأتمتة اللي ترسل ملخص «بيننا» بالإيميل [للتأكيد من أمجد: اسم المزوّد].",
        "Meta (واتساب)، وResend للإيميل، وGitHub لمتابعة الاقتراحات (كمهام عامة)، إذا كانت مفعّلة.",
      ],
    },
    {
      heading: "نقل البيانات خارج المملكة",
      paragraphs: [
        "بعض هالمزوّدين، مثل Vercel وGoogle وX وOpenAI، يعالجون البيانات على خوادم برّا السعودية (مثل أمريكا). [للتأكيد من أمجد: مناطق خوادم Vercel وNeon (خادم الموقع على Vercel يشتغل في {{iad1}} شرق أمريكا)، وآلية النقل المعتمدة حسب نظام حماية البيانات الشخصية]",
      ],
    },
    {
      heading: "حماية البيانات",
      paragraphs: [
        "الموقع يشتغل على HTTPS. نحفظ رقم التصويت وروابط أصحاب القهاوي ورموز التحقق كبصمة رقمية ما تنعكس (hash). المفاتيح السرية تبقى في الخادم، وعندنا حد لعدد الطلبات ضد الإزعاج. ومع ذلك، ما فيه نظام آمن 100٪.",
      ],
    },
    {
      heading: "حقوقك",
      paragraphs: ["حسب نظام حماية البيانات الشخصية:"],
      bullets: [
        "تقدر تسألنا وش نجمع عنك وليش (وهذي الصفحة جزء من الجواب).",
        "تقدر تطلب نسخة من بياناتك اللي عندنا.",
        "تقدر تطلب تصحيح أي بيانات غلط.",
        "تقدر تطلب حذف بياناتك إذا ما عاد فيه داعي نحتفظ فيها.",
        "تقدر تسحب موافقتك أي وقت، مثل إنك توقف إذن الموقع أو تمسح الكوكيز.",
        "تقدر ترفع شكوى للهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا) عن طريق {{sdaia.gov.sa}}.",
      ],
    },
    {
      heading: "كيف تطلب حقك",
      paragraphs: [
        `راسلنا على ${CONTACT_EMAIL.ar}، وبنرد على طلبك حسب ما يفرضه النظام. ما عندنا حسابات، فنقدر نتصرف بس في البيانات اللي نقدر نربطها فيك، مثل نص فكرة كتبتها أو رابط دعوة «بيننا»، فساعدنا نلقاها. بيانات أدوات التحليل والإعلان وسجلات الخادم غالبًا ما نقدر نربطها بشخص معيّن. ممكن نطلب منك شي بسيط نتأكد فيه إن الطلب منك.`,
        "نرد عليك خلال [للتأكيد من أمجد: مدة الرد، المقترح 30 يوم].",
      ],
    },
    {
      heading: "الأطفال",
      paragraphs: [
        "وين موجّه للجمهور العام، مو للأطفال تحت [للتأكيد من أمجد: الحد الأدنى للعمر، المقترح 18 سنة]. ما نجمع بيانات الأطفال عن قصد. إذا تشوف إن طفل أرسل لنا بيانات، كلّمنا ونحذف اللي نقدر نلقاه منها.",
      ],
    },
    {
      heading: "تعديل هالسياسة",
      paragraphs: [
        "ممكن نحدّث السياسة إذا تغيّر الموقع أو النظام، وبنغيّر تاريخ «آخر تحديث» فوق.",
      ],
    },
  ],
};

const PRIVACY_EN: LegalDoc = {
  title: "Privacy policy",
  description:
    "What data Wain (wain.lol) collects, why, where it goes, and your rights under Saudi Arabia's Personal Data Protection Law.",
  updated: UPDATED.en,
  intro: [
    "This policy explains what Wain (wain.lol) may learn about you when you use the site, why we need it, where it goes, and how you can control it. We wrote it from what the site's code actually does, with Saudi Arabia's Personal Data Protection Law (PDPL) in mind.",
  ],
  sections: [
    {
      heading: "Who we are",
      paragraphs: [
        `Wain is run by ${CONTROLLER.en}. That entity is the controller of the personal data described here.`,
        `For anything about privacy, email ${CONTACT_EMAIL.en}. You can also tap Contact us at the bottom of the page, which opens a WhatsApp chat with us.`,
      ],
    },
    {
      heading: "The short version",
      bullets: [
        "No accounts and no sign-up. We don't ask for your name, email, or phone number to use Wain.",
        "We use analytics (Google Analytics through Google Tag Manager, Vercel Web Analytics, and DataFast) to understand how the site is used. That includes what you type into the search box.",
        "We only get your location if you allow it, and your browser asks as soon as you open a page with cafés. For Nearby and distance sorting it stays on your device. For بيننا (Halfway) the pins you set are sent to our server, as explained below.",
        "The site shows no ads. But we use ad tools from Google (Google Ads), X (Twitter), and OpenAI. They record your page visits and when بيننا shows you results, to measure our marketing. Google Ads also uses the visits for remarketing (showing our ads later to people who visited the site), and the OpenAI pixel can pick up an email or phone number typed into a form on the page. Details below.",
        "A بيننا invite link contains your pin, and it reaches Google Analytics and the ad-measurement tools. Details in the بيننا section.",
      ],
    },
    {
      heading: "Analytics",
      paragraphs: [
        "Every page loads Google Tag Manager (container {{GTM-W3TM4552}}), which passes events to Google Analytics 4 ({{G-EFZZET02TT}}). Google Analytics typically records the pages you view, your device and browser, an approximate location from your IP address, and the page you came from, and sets cookies such as {{_ga}} and {{_ga_<ID>}}. [AMJAD TO CONFIRM: GA4 settings such as IP handling, Google signals, and ads linking]",
        "Events we send to Google Analytics include: when you see three picks, open Maps, share, upvote a café, choose a district, search or sort the all-districts page, use بيننا, or rate results. They carry details such as our café IDs, the district, the language, and, for بيننا, the invite ID (see the بيننا section). Google Analytics also records some events automatically, such as scrolling and clicks on outside links.",
        "What Google Tag Manager forwards to the analytics and ad tools, as described on this page, reflects version 13 of the container (checked on 4 October 2026).",
        "What you type into the chat box, and into the search on the all-districts page, is sent to Google Analytics as text. Please don't type personal details there.",
        "When you rate a set of results as not helpful, you can pick Something else and add a short note. The note is handed to Google Tag Manager inside the page, but our current setup doesn't forward it to Google Analytics or any other tool, and we don't store it in our database.",
        "Vercel Web Analytics counts page views.",
        "DataFast ({{datafa.st}}) is an analytics tool that records pages, the referring site, browser and device, and country. [AMJAD TO CONFIRM: whether DataFast sets a cookie or visitor ID; none was seen in our 4 October check] DataFast also receives a note about the request when a known AI crawler (a bot) loads a page. This does not happen for normal visitors.",
        "Google Ads: the same Google tag also loads Google Ads (account {{AW-18418378883}}). We use it for ad measurement and for remarketing: it records your visit so Google can show our ads later to people who visited the site. It sets the {{_gcl_au}} cookie and saves {{_gcl_ls}} in your browser. Google Analytics is also linked to Google's advertising tools (DoubleClick). [AMJAD TO CONFIRM: keep or turn off user-provided data collection in the Google tag. It is switched on now: the tag can pick up an email address, phone number, or postal address typed into a form on the page. (a) If we turn it off in the Google tag settings: just delete this marker; no sentence is needed. (b) If we keep it: replace this marker with “The Google tag also has automatic collection of user-provided data switched on: it can pick up an email address, phone number, or postal address typed into a form on the page and send it to Google as a one-way hash for ad measurement.” and add the same point to The short version and to Who we share data with]",
        "Ad measurement by X and OpenAI: Google Tag Manager also loads the X (Twitter) pixel and the OpenAI ads pixel. They record page visits and when a بيننا search shows results, and the X pixel also notes when you stay on a page for a while. They set their own cookies, such as {{_twpid}} and {{_twsid}} (X) and {{__obref}} (OpenAI), plus cookies on their own domains, and the OpenAI pixel keeps {{oaiq_cs:…}} in the tab's session storage. These companies use the data under their own policies. [AMJAD TO CONFIRM: the purpose of the X and OpenAI pixels, and whether consent is needed before they load]",
        "The OpenAI pixel has automatic advanced matching switched on. This lets it pick up an email address or phone number typed into a form on the page and send it to OpenAI as a one-way hash. In our 4 October check we saw none sent (we didn't type details into any form), but the setting is on. [AMJAD TO CONFIRM: keep or turn off OpenAI advanced matching in GTM]",
        "Retention: Google Analytics [AMJAD TO CONFIRM: GA4 data-retention setting], DataFast [AMJAD TO CONFIRM: DataFast retention], Vercel Web Analytics per Vercel's settings [AMJAD TO CONFIRM: Vercel Analytics retention].",
      ],
    },
    {
      heading: "The chat and search box",
      paragraphs: [
        "What you type goes to our server so it can pick three cafés for you. The server also keeps a small internal learning record: your text, the three café IDs, the language, and a random session ID kept in your browser tab. It does the same when you open one of the picks in Maps. This record sits in our server logs and temporary storage. [AMJAD TO CONFIRM: retention for server logs and the learning record]",
        "To write the short line above the picks, the server may send your text, and the names and neighbourhoods of the picked cafés, to xAI, our AI provider. We don't send your location or any ID with it. [AMJAD TO CONFIRM: whether the xAI reply is switched on in production]",
        "Cafés you mark as visited are saved in your browser and sent with each ask so we don't repeat them. We don't store that list on our side.",
      ],
    },
    {
      heading: "Suggesting a café",
      paragraphs: [
        "If you paste a Google Maps link to suggest a café, we keep the link, the name and neighbourhood we work out from it, and the time, in our server logs and temporary storage. Our server opens the link on Google Maps to read the name and neighbourhood.",
        "Anyone can view the list of suggestions (link, name, neighbourhood, and time) at a public address on the site ({{/api/suggest}}) while it's kept on our server. A suggestion may also be filed as a task in our public GitHub tracker. [AMJAD TO CONFIRM: whether filing suggestions to GitHub is switched on]",
        "A suggestion only needs the link, so please don't add personal details.",
      ],
    },
    {
      heading: "The ideas board and upvotes",
      paragraphs: [
        "Ideas you post on the ideas board are stored in our database (Neon) and shown publicly with their vote count. No name, email, or page address is saved with them. Please don't include personal details. [AMJAD TO CONFIRM: how long ideas are kept; the code never deletes them]",
        "When you vote on an idea or upvote a café, we set a cookie called {{wain_vid}} with a random ID (it lasts up to 400 days). With your vote we store only a one-way hash of that ID, so a vote can't be counted twice. Removing a café upvote deletes its record.",
        "To stop spam, our server briefly checks your IP address in memory to limit requests. We don't save it in the database.",
      ],
    },
    {
      heading: "Your location (Nearby and distance)",
      paragraphs: [
        "We only see your location if you allow it in your browser. As soon as you open the home page, a café page, or a list of cafés (such as a district), the site asks your browser for your location, not only when you tap Nearby. If you haven't decided before, your browser shows its permission prompt at that point.",
        "If you allow it, we use your location inside your browser to sort cafés by distance and show how far they are. For these features your location is not sent to our server or anyone else.",
        "We save only whether you allowed location (yes or no) in your browser, never your coordinates.",
        "You can turn location off at any time in your browser settings.",
      ],
    },
    {
      heading: "بيننا (Halfway)",
      paragraphs: [
        "You can set your pin from your location, from coordinates, or from a Google Maps link. We round each pin to about one metre.",
        "Pins are sent to our server to find cafés in the middle. If you paste a Maps link, our server asks Google Maps where it points.",
        "When you send an invite to the person you're meeting, your pin is built into the invite link ({{/h/…}}). Anyone with the link can work out that pin, so share it only with them.",
        "بيننا does not ask for your email. But the invite ID contains your pin, and it reaches Google Analytics and the ad-measurement tools when you create or open an invite link. [AMJAD TO CONFIRM: whether this is fixed before launch; a fix is in progress (a random invite ID, or hiding {{/h/}} links from analytics and the pixels), and this paragraph changes when it lands]",
        "In detail: Google Analytics receives the invite ID in the page address when the link is open, and as {{pack_id}} on up to 8 بيننا events. One of them, {{meet_halfway_invite_share}}, is sent from your own device as soon as you create the link, before anyone opens it, and your tab then moves to the invite link. While an invite link is open, its address also reaches Google Ads, X, and OpenAI, and it also reaches DataFast and Vercel Web Analytics, which record the pages you open. The results event itself doesn't carry the cafés or their distances: it only has the language, the number of cafés, and whether the search came from an invite. But if you open one of the cafés, tap Map, or share it, Google Analytics learns which café it was: the café page you open, the café's ID on the Map or Share event, and its Google Maps link (recorded as a click on an outside link). On an invite, those hits can carry the invite page address too.",
        "So you both see the same results, we store the session's pins and the three cafés in our database. The link works for 45 minutes while you wait for the person you're meeting, and for 48 hours after the results appear. [AMJAD TO CONFIRM: when expired sessions are deleted from the database; the code stops showing them but does not delete them]",
        "When a بيننا search returns results, our server sends a summary to an automation service that emails it to the Wain team. The summary has both pins as exact coordinates and Maps links, the three cafés and their distances, the language, and the session ID. It has no name, email, or phone number. [AMJAD TO CONFIRM: the automation vendor (the code posts to Cursor Automations) and how long these emails are kept]",
      ],
    },
    {
      heading: "WhatsApp and café owners",
      paragraphs: [
        "The Contact us and Own this café? buttons open a WhatsApp chat with our number. What you write there is covered by WhatsApp's (Meta's) terms and read by our team. [AMJAD TO CONFIRM: how long WhatsApp chats are kept]",
        "If a café owner edits their café page through a private link, the details and photos they send are stored in our database and in Vercel Blob storage and shown publicly on the café page. [AMJAD TO CONFIRM: whether in-site ownership verification is in use; the code supports a phone number, a one-time code by WhatsApp, commercial-registration proof, and an email alert through Resend]",
        "[AMJAD TO CONFIRM: whether the automated WhatsApp Business number is live; if it is, it receives the sender's number and message text and replies]",
      ],
    },
    {
      heading: "Hosting and server logs",
      paragraphs: [
        "The site is hosted on Vercel. Like any website, the server receives your IP address, browser type, the page you asked for, and the time, and Vercel keeps logs. [AMJAD TO CONFIRM: Vercel log retention on our plan]",
      ],
    },
    {
      heading: "What's saved in your browser",
      bullets: [
        "Your city choice, the Local only switch (hide chains), cafés you marked as visited, and whether you allowed location (yes or no).",
        "Temporary data for the tab: your sort choice, the بيننا waiting state (which holds your own pin), your results rating, and a session ID.",
        "Cookies: {{wain_vid}} (ours, for voting), Google Analytics cookies ({{_ga}} and {{_ga_<ID>}}), and the Google Ads, X, and OpenAI cookies listed above ({{_gcl_au}}, {{_twpid}}, {{_twsid}}, {{__obref}}).",
        "Ad-tool storage: Google Ads saves {{_gcl_ls}} in your browser's local storage, and the OpenAI pixel saves {{oaiq_cs:…}} in the tab's session storage.",
        "You can clear all of it at any time in your browser settings.",
      ],
    },
    {
      heading: "Google Maps and Google Places",
      paragraphs: [
        "Café details (hours, photos, locations) come from public sources, including Google Maps and Google Places. Photos load from our site, and when our server fetches a photo from Google it sends nothing about you.",
        "We don't embed Google maps in our pages. When you tap Map, Google Maps opens and Google's privacy policy applies there.",
      ],
    },
    {
      heading: "Our legal basis",
      paragraphs: [
        "We rely on your consent (for example, location permission, using بيننا, or posting an idea) and on our legitimate interest in running, improving, and protecting the site (for example, analytics and security logs). [AMJAD TO CONFIRM: legal-basis wording, and whether a cookie and analytics consent banner is needed; analytics and ad cookies are currently set on the first visit with no consent step]",
      ],
    },
    {
      heading: "Who we share data with",
      paragraphs: [
        "We share data with these providers. Some run the site for us; the analytics and ad tools also use the data under their own policies:",
      ],
      bullets: [
        "Google: Tag Manager and Analytics; Google Ads for ad measurement and remarketing (showing our ads later to people who visited the site); and Google Maps for reading links and places.",
        "Vercel: hosting, logs, Web Analytics, and storage for café owners' photos (Blob).",
        "Neon: our database (ideas, votes, بيننا sessions, café owner data).",
        "DataFast: analytics.",
        "X (Twitter) and OpenAI: ad-measurement pixels (the OpenAI pixel with advanced matching, see above).",
        "xAI: writing the short reply line in the chat (your text, and the picked cafés' names and neighbourhoods).",
        "The automation service that emails the بيننا summary [AMJAD TO CONFIRM: vendor name].",
        "Meta (WhatsApp), Resend for email, and GitHub for tracking suggestions (as public tasks), where switched on.",
      ],
    },
    {
      heading: "Transfers outside Saudi Arabia",
      paragraphs: [
        "Some of these providers, such as Vercel, Google, X, and OpenAI, process data on servers outside Saudi Arabia (for example in the US). [AMJAD TO CONFIRM: Vercel and Neon server regions (the site's Vercel functions run in {{iad1}}, US East), and the PDPL transfer mechanism relied on]",
      ],
    },
    {
      heading: "Security",
      paragraphs: [
        "The site runs over HTTPS. Vote IDs, café owner links, and verification codes are stored as one-way hashes. Secret keys stay on the server, and request limits slow down spam. Still, no system is 100% secure.",
      ],
    },
    {
      heading: "Your rights",
      paragraphs: ["Under the PDPL:"],
      bullets: [
        "You can ask what we collect about you and why (this page is part of the answer).",
        "You can ask for a copy of the data we hold about you.",
        "You can ask us to correct data that's wrong.",
        "You can ask us to delete your data when we no longer need it.",
        "You can withdraw your consent at any time, for example by turning off location or clearing cookies.",
        "You can complain to the Saudi Data and AI Authority (SDAIA) at {{sdaia.gov.sa}}.",
      ],
    },
    {
      heading: "How to use your rights",
      paragraphs: [
        `Email us at ${CONTACT_EMAIL.en}, and we'll respond as the law requires. We have no accounts, so we can only act on data we can link to you, such as the text of an idea you posted or a بيننا invite link; please help us find it. Analytics, ad-tool, and server-log data usually can't be traced back to one person. We may ask for something simple to check the request is yours.`,
        "We'll reply within [AMJAD TO CONFIRM: response time, recommended 30 days].",
      ],
    },
    {
      heading: "Children",
      paragraphs: [
        "Wain is for a general audience and is not aimed at children under [AMJAD TO CONFIRM: minimum age, recommended 18]. We don't knowingly collect children's data. If you think a child has sent us data, tell us and we'll delete what we can find.",
      ],
    },
    {
      heading: "Changes to this policy",
      paragraphs: [
        "We may update this policy when the site or the law changes, and we'll change the Last updated date at the top.",
      ],
    },
  ],
};

const TERMS_AR: LegalDoc = {
  title: "الشروط والأحكام",
  description:
    "شروط استخدام وين (wain.lol): دليل معلومات عن القهاوي، وحدود المسؤولية، والاستخدام المقبول، والنظام المطبّق في السعودية.",
  updated: UPDATED.ar,
  intro: [
    "هذي الشروط تنظّم استخدامك لوين (wain.lol). استخدامك للموقع يعني إنك موافق عليها، فاقرأها قبل ما تستخدمه.",
  ],
  sections: [
    {
      heading: "وش هو وين",
      paragraphs: [
        `وين دليل معلومات يساعدك تلقى قهوة في الرياض. ما نبيع شي، وما نحجز، وما نوصّل طلبات. يديره ${CONTROLLER.ar}.`,
      ],
    },
    {
      heading: "المعلومات ممكن تتغيّر",
      paragraphs: [
        "معلومات القهاوي (الاسم، الأوقات، الموقع، الصور، اللي يقدّمونه) نجمعها من مصادر عامة مثل Google Maps وحسابات القهاوي، ومن أصحاب القهاوي أنفسهم. ممكن تكون قديمة أو فيها غلط.",
        "قبل ما تروح، تأكد من الأوقات والتفاصيل مع القهوة نفسها.",
        "الجملة القصيرة اللي فوق الاقتراحات يكتبها ذكاء اصطناعي، وممكن ما تكون دقيقة.",
      ],
    },
    {
      heading: "ما فيه ترتيب مدفوع",
      paragraphs: [
        "وجود قهوة في وين مو معناه إننا نوصي فيها أو نضمنها. القوائم تترتّب حسب المسافة، أو الأحدث إضافة، أو الأبجدية، أو مؤشرات شعبية عامة من Google Maps وInstagram وTikTok. ما فيه شي في الموقع يخلّي أحد يدفع عشان يطلع أول. [للتأكيد من أمجد: ما فيه أي ترتيب مدفوع أو رعاية]",
      ],
    },
    {
      heading: "روابط وخرائط لأطراف ثانية",
      paragraphs: [
        "فيه روابط تفتح Google Maps وواتساب وحسابات القهاوي وغيرها. هذي خدمات مو تابعة لنا، ولها شروطها وسياسات خصوصيتها، وحنا مو مسؤولين عن محتواها.",
      ],
    },
    {
      heading: "الاستخدام المقبول",
      paragraphs: ["لما تستخدم وين، لا:"],
      bullets: [
        "تسحب البيانات (scraping) أو تنزّلها بكميات أو تستخدم برامج آلية، إلا من الواجهات العامة اللي نوفرها لهالغرض وفي حدودها.",
        "تحاول تضغط على الموقع أو تخترقه أو تتجاوز حدود الطلبات.",
        "تسيء استخدام النماذج: إزعاج، أو أصوات وهمية، أو اقتراحات كذب، أو محتوى مسيء أو مخالف للنظام، أو معلومات شخصية عن غيرك.",
        "تدّعي إنك صاحب قهوة وأنت مو صاحبها، أو تنتحل شخصية أحد.",
        "تستخدم الموقع بأي طريقة تخالف أنظمة المملكة.",
      ],
    },
    {
      heading: "اللي ترسله لنا",
      paragraphs: [
        "لما ترسل لنا أفكار أو اقتراحات أو تقييمات، تعطينا الحق إننا نعرضها ونستخدمها ونعدّلها ونحذفها عشان نحسّن وين. أنت مسؤول عن اللي تكتبه، ولنا الحق نشيل أي شي يخالف هذي الشروط.",
        "على صاحب القهوة يتأكد إن المعلومات اللي يرسلها صحيحة، ولنا الحق نعدّلها أو نشيلها.",
      ],
    },
    {
      heading: "الملكية الفكرية والعلامة",
      paragraphs: [
        `اسم «وين» و«Wain»، والشعار، والتصميم، وطريقة ترتيب الدليل، كلها ملك ${CONTROLLER.ar}.`,
        "أسماء القهاوي وشعاراتها ملك أصحابها. لا تستخدم اسمنا أو شعارنا بطريقة توحي إننا ندعمك أو نوصي فيك.",
      ],
    },
    {
      heading: "الخدمة كما هي",
      paragraphs: [
        "نقدّم وين «كما هو» و«حسب توفّره». ممكن نغيّر أو نوقف أي ميزة في أي وقت.",
      ],
    },
    {
      heading: "حدود المسؤولية",
      paragraphs: [
        "في حدود ما تسمح فيه الأنظمة في السعودية، ما نتحمّل أي خسارة غير مباشرة، ولا مشوار ضاع، ولا قهوة لقيتها مسكّرة، ولا تصرّف من طرف ثاني. وما في هذي الشروط شي يلغي مسؤولية ما يجوز إلغاؤها نظامًا.",
      ],
    },
    {
      heading: "النظام المطبّق",
      paragraphs: [
        "هذي الشروط تخضع لأنظمة المملكة العربية السعودية، وأي خلاف يكون عند المحاكم المختصة في [للتأكيد من أمجد: المدينة، المقترح الرياض].",
      ],
    },
    {
      heading: "تعديل الشروط",
      paragraphs: [
        "ممكن نحدّث هذي الشروط. بنغيّر تاريخ «آخر تحديث» فوق، واستمرارك في استخدام الموقع بعد التحديث يعني إنك موافق.",
      ],
    },
    {
      heading: "تواصل معنا",
      paragraphs: [
        `أي سؤال عن هذي الشروط: ${TERMS_CONTACT_EMAIL.ar}، أو زر «تواصل معنا» تحت الصفحة.`,
      ],
    },
  ],
};

const TERMS_EN: LegalDoc = {
  title: "Terms of use",
  description:
    "The terms for using Wain (wain.lol): an informational café directory, limits of liability, acceptable use, and Saudi governing law.",
  updated: UPDATED.en,
  intro: [
    "These terms cover your use of Wain (wain.lol). By using the site you agree to them, so please read them first.",
  ],
  sections: [
    {
      heading: "What Wain is",
      paragraphs: [
        `Wain is an informational directory that helps you find coffee in Riyadh. We don't sell anything, take bookings, or deliver orders. Wain is run by ${CONTROLLER.en}.`,
      ],
    },
    {
      heading: "Information can change",
      paragraphs: [
        "Café details (name, hours, location, photos, what they serve) come from public sources such as Google Maps and the cafés' own accounts, and from café owners. They may be out of date or wrong.",
        "Before you go, check the hours and details with the café.",
        "The short line above the picks is written by AI and may not be accurate.",
      ],
    },
    {
      heading: "No paid ranking",
      paragraphs: [
        "A café being on Wain doesn't mean we recommend or vouch for it. Lists are sorted by distance, newest added, A to Z, or public popularity signals from Google Maps, Instagram, and TikTok. Nothing in the site lets anyone pay to rank higher. [AMJAD TO CONFIRM: there is no paid placement or sponsorship of any kind]",
      ],
    },
    {
      heading: "Third-party links and maps",
      paragraphs: [
        "Some links open Google Maps, WhatsApp, cafés' accounts, and other services. They aren't run by us, they have their own terms and privacy policies, and we aren't responsible for their content.",
      ],
    },
    {
      heading: "Acceptable use",
      paragraphs: ["When you use Wain, please don't:"],
      bullets: [
        "Scrape, bulk-download, or use automated tools on the site, except through the public interfaces we provide for that purpose and within their limits.",
        "Try to overload, break into, or get around the site's request limits.",
        "Misuse the forms: spam, fake votes, false suggestions, offensive or unlawful content, or other people's personal details.",
        "Claim to own a café you don't own, or pretend to be someone else.",
        "Use the site in any way that breaks Saudi law.",
      ],
    },
    {
      heading: "What you send us",
      paragraphs: [
        "When you send ideas, suggestions, or ratings, you let us show, use, edit, and remove them to improve Wain. You're responsible for what you write, and we may remove anything that breaks these terms.",
        "Café owners must make sure the details they send are accurate. We may edit or remove them.",
      ],
    },
    {
      heading: "Intellectual property and the brand",
      paragraphs: [
        `The Wain and وين names, the logo, the design, and the way the directory is put together belong to ${CONTROLLER.en}.`,
        "Café names and logos belong to their owners. Don't use our name or logo in a way that suggests we endorse you.",
      ],
    },
    {
      heading: "The service as it is",
      paragraphs: [
        "Wain is provided as is and as available. We may change or stop any feature at any time.",
      ],
    },
    {
      heading: "Limitation of liability",
      paragraphs: [
        "As far as Saudi law allows, we aren't liable for indirect losses, a wasted trip, a café you found closed, or what third parties do. Nothing in these terms removes liability that the law doesn't allow us to remove.",
      ],
    },
    {
      heading: "Governing law",
      paragraphs: [
        "These terms are governed by the laws of the Kingdom of Saudi Arabia. Any dispute goes to the competent courts in [AMJAD TO CONFIRM: city, recommended Riyadh].",
      ],
    },
    {
      heading: "Changes to these terms",
      paragraphs: [
        "We may update these terms. We'll change the Last updated date at the top, and if you keep using the site after an update, you accept the new terms.",
      ],
    },
    {
      heading: "Contact",
      paragraphs: [
        `Questions about these terms: ${TERMS_CONTACT_EMAIL.en}, or the Contact us button at the bottom of the page.`,
      ],
    },
  ],
};

/**
 * «لـ Google» can break at the space and leave «لـ» alone at the end of a
 * line (QA r2 L-b). Join the prefix to the next word with a no-break space
 * so it wraps together. Applied to the Arabic docs only; check-legal
 * asserts no «لـ» + plain space is left.
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

function docText(doc: LegalDoc): string[] {
  return [
    doc.title,
    doc.description,
    ...doc.intro,
    ...doc.sections.flatMap((section) => [
      section.heading,
      ...(section.paragraphs ?? []),
      ...(section.bullets ?? []),
    ]),
  ];
}

/**
 * True while any [AMJAD TO CONFIRM: …] / [للتأكيد من أمجد: …] marker is
 * left in the copy. While it is true, the 4 legal pages send
 * `robots: noindex, follow` and stay out of the sitemap (lib/sitemap-xml.ts,
 * public/sitemap.xml). It turns false by itself once the last marker is
 * filled in; then add the 4 sitemap entries back and re-pin the sitemap
 * count in scripts/check-trending-this-week.ts.
 */
export const LEGAL_HAS_PLACEHOLDERS: boolean = Object.values(LEGAL_DOCS).some(
  (byLanguage) =>
    Object.values(byLanguage).some((doc) =>
      docText(doc).some((text) => LEGAL_PLACEHOLDER_PATTERN.test(text)),
    ),
);

/** Metadata `robots` for the legal pages: noindex while drafts remain. */
export const LEGAL_ROBOTS = LEGAL_HAS_PLACEHOLDERS
  ? { index: false, follow: true }
  : undefined;
