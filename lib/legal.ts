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

/** Visible review markers. The page highlights any text in this shape. */
export const LEGAL_PLACEHOLDER_PATTERN =
  /(\[(?:AMJAD TO CONFIRM|للتأكيد من أمجد):[^\]]*\])/;

const UPDATED = {
  ar: "آخر تحديث: 4 أكتوبر 2026",
  en: "Last updated: 4 October 2026",
} as const;

const CONTACT_EMAIL = {
  ar: "[للتأكيد من أمجد: privacy@wain.lol]",
  en: "[AMJAD TO CONFIRM: privacy@wain.lol]",
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
    "هذي الصفحة توضّح وش البيانات اللي ممكن نعرفها عنك لما تستخدم وين (wain.lol)، ليش نحتاجها، وين تروح، وكيف تتحكم فيها. كتبناها من اللي يسويه الموقع فعلًا، وتمشي على نظام حماية البيانات الشخصية في المملكة العربية السعودية.",
  ],
  sections: [
    {
      heading: "مين حنا",
      paragraphs: [
        `وين يديره ${CONTROLLER.ar}، وهي الجهة المسؤولة (المتحكّم) عن البيانات الشخصية المذكورة هنا.`,
        `للتواصل في أي شي يخص الخصوصية: ${CONTACT_EMAIL.ar}. وتقدر بعد تضغط «تواصل معنا» تحت الصفحة، ويفتح لك محادثة واتساب معنا.`,
      ],
    },
    {
      heading: "باختصار",
      bullets: [
        "ما فيه حسابات ولا تسجيل. ما نطلب اسمك ولا إيميلك ولا رقم جوالك عشان تستخدم وين.",
        "نستخدم أدوات تحليل (Google Analytics عن طريق Google Tag Manager، وVercel Web Analytics، وDataFast) عشان نفهم كيف ينستخدم الموقع، ومنها اللي تكتبه في خانة البحث.",
        "موقعك ما ناخذه إلا إذا سمحت فيه. في «قريب مني» وترتيب المسافة يبقى في جهازك. في «بيننا» تنرسل النقاط اللي تحددها لخادمنا، والتفاصيل تحت.",
        "الموقع ما يعرض إعلانات. لكن عشان نقيس تسويقنا، نستخدم أدوات قياس إعلاني من Google وX (تويتر) وOpenAI، تسجّل زياراتك للصفحات ولما يطلع لك «بيننا» بنتائج.",
      ],
    },
    {
      heading: "التحليلات وقياس الاستخدام",
      paragraphs: [
        "يتحمّل في كل صفحة Google Tag Manager (الحاوية GTM-W3TM4552)، وهو يمرّر الأحداث لـ Google Analytics 4. عادةً Google Analytics يسجّل الصفحات اللي تزورها، نوع الجهاز والمتصفح، الموقع التقريبي من عنوان IP، والصفحة اللي جيت منها، ويحط كوكيز مثل _ga و_ga_<ID>. [للتأكيد من أمجد: إعدادات GA4 مثل التعامل مع IP وGoogle signals والربط الإعلاني]",
        "الأحداث اللي نرسلها: لما تطلع لك 3 اقتراحات، أو تفتح الخريطة، أو تشارك، أو تعطي إعجاب لقهوة، أو تفلتر وترتّب، أو تختار حي، أو تستخدم «بيننا»، أو تقيّم النتائج. تشمل أشياء مثل رقم القهوة عندنا، الحي، اللغة، وطريقة المشاركة.",
        "اللي تكتبه في خانة الشات، واللي تبحث عنه في صفحة كل الأحياء، ينرسل كنص لـ Google Analytics. لا تكتب فيها معلومات شخصية.",
        "لما تقيّم النتائج (فادتك أو لا) تقدر تضيف ملاحظة قصيرة. هذي الملاحظة تروح لـ Google Analytics بس، وما نحفظها في قاعدة بياناتنا.",
        "Vercel Web Analytics يحسب زيارات الصفحات.",
        "DataFast (datafa.st) أداة تحليل تسجّل الصفحات، المصدر اللي جيت منه، المتصفح والجهاز، والدولة. [للتأكيد من أمجد: هل DataFast يحط كوكيز أو معرّف للزائر؛ ما شفنا له كوكيز في فحص 4 أكتوبر] وتوصل لـ DataFast بعد معلومة عن الطلب لما يفتح صفحة برنامج زحف معروف تابع لذكاء اصطناعي، مو الزوار العاديين.",
        "أدوات القياس الإعلاني: Google Tag Manager يحمّل بعد بكسل X (تويتر) وبكسل OpenAI للقياس الإعلاني، ويسجّلون زيارات الصفحات ولما يطلع بحث «بيننا» بنتائج. وGoogle Analytics مربوط بأدوات Google الإعلانية (DoubleClick). هذي الجهات تحط كوكيز خاصة فيها، مثل _gcl_au من Google، و_twpid و_twsid من X، و__obref من OpenAI، وكوكيز على نطاقاتها هي، وتستخدم البيانات حسب سياساتها. [للتأكيد من أمجد: الغرض من بكسلات X وOpenAI، وهل نحتاج موافقة قبل تشغيلها]",
        "مدة الاحتفاظ: Google Analytics [للتأكيد من أمجد: مدة الاحتفاظ المضبوطة في GA4]، DataFast [للتأكيد من أمجد: مدة احتفاظ DataFast]، Vercel Web Analytics حسب إعدادات Vercel [للتأكيد من أمجد: مدة احتفاظ Vercel Analytics].",
      ],
    },
    {
      heading: "خانة الشات والبحث",
      paragraphs: [
        "اللي تكتبه يروح لخادمنا عشان نختار لك 3 قهاوي. ويحفظ الخادم سجل تعلّم داخلي بسيط فيه: نصك، أرقام القهاوي الـ3، اللغة، ورقم جلسة عشوائي محفوظ في تبويب متصفحك. نفس الشي لما تفتح أحد الاقتراحات في الخريطة. هذا السجل يكون في سجلات الخادم وتخزين مؤقت. [للتأكيد من أمجد: مدة الاحتفاظ بسجلات الخادم وسجل التعلّم]",
        "عشان نكتب الجملة القصيرة اللي فوق الاقتراحات، ممكن يرسل الخادم نصك وأسماء القهاوي اللي اخترناها لـ xAI (مزوّد الذكاء الاصطناعي). ما نرسل معها موقعك ولا أي رقم يعرّف فيك. [للتأكيد من أمجد: هل ردّ xAI شغّال على الموقع الحين]",
        "القهاوي اللي علّمت إنك رحتها تنحفظ في متصفحك، وتنرسل مع كل طلب عشان ما نكررها عليك. ما نحفظها عندنا.",
      ],
    },
    {
      heading: "اقتراح قهوة",
      paragraphs: [
        "إذا لصقت رابط Google Maps عشان تقترح قهوة، نحفظ الرابط، والاسم اللي نقرأه منه، ووقت الاقتراح. خادمنا يفتح الرابط على Google Maps عشان يعرف الاسم. وممكن ينحفظ الاقتراح كمهمة في متتبّع المهام عندنا على GitHub. [للتأكيد من أمجد: هل إرسال الاقتراحات لـ GitHub مفعّل]",
        "الاقتراح فيه الرابط بس، فلا تضيف معه معلومات شخصية.",
      ],
    },
    {
      heading: "صفحة الأفكار والإعجابات",
      paragraphs: [
        "الأفكار اللي تكتبها في صفحة الأفكار تنحفظ في قاعدة بياناتنا (Neon) وتطلع للكل مع عدد الأصوات. ما ينحفظ معها اسم ولا إيميل ولا رابط الصفحة اللي كنت فيها. لا تكتب فيها معلومات شخصية. [للتأكيد من أمجد: مدة الاحتفاظ بالأفكار، الكود ما يحذفها]",
        "لما تصوّت على فكرة أو تعطي إعجاب لقهوة، نحط كوكيز اسمه wain_vid فيه رقم عشوائي (يبقى لين 400 يوم). ونحفظ مع صوتك نسخة مشفّرة باتجاه واحد (hash) من هذا الرقم بس، عشان ما ينحسب الصوت مرتين. إذا شلت الإعجاب عن قهوة ينحذف سجله.",
        "عشان نوقف الإزعاج، نشيك على عنوان IP لفترة قصيرة في ذاكرة الخادم (حد للطلبات)، وما نحفظه في قاعدة البيانات.",
      ],
    },
    {
      heading: "موقعك (قريب مني والمسافة)",
      paragraphs: [
        "ما نعرف موقعك إلا إذا سمحت للمتصفح. نستخدمه داخل متصفحك عشان نرتّب القهاوي حسب القرب ونوريك كم تبعد. لهذي الميزات ما ينرسل موقعك لخادمنا ولا لأي طرف ثاني.",
        "نحفظ في متصفحك بس إنك سمحت بالموقع (نعم أو لا)، وما نحفظ الإحداثيات أبد.",
        "تقدر توقف إذن الموقع أي وقت من إعدادات المتصفح.",
      ],
    },
    {
      heading: "بيننا (نص المسافة)",
      paragraphs: [
        "تقدر تحدد نقطتك من موقعك، أو بإحداثيات، أو برابط Google Maps. نقرّب النقطة لحدود متر تقريبًا.",
        "النقاط تروح لخادمنا عشان نلقى قهاوي في النص بينكم. وإذا لصقت رابط Maps، خادمنا يسأل Google Maps عن مكانه.",
        "لما تعزم خويك، نقطتك تكون داخل رابط الدعوة (/h/…). أي أحد عنده الرابط يقدر يعرف هالنقطة، فشاركه بس مع اللي بتقابله. وبما إن النقطة جزء من الرابط، أدوات التحليل والقياس الإعلاني في الصفحة (Google وX وOpenAI وDataFast) يوصلها الرابط لما ينفتح، وتقدر تقنيًا تقرأ النقطة منه. [للتأكيد من أمجد: هل بنعدّل هذا قبل النشر، مثلًا نخفي روابط /h/ عن أدوات التحليل أو نخلي رقم الدعوة عشوائي]",
        "عشان تشوفون نفس النتائج، نحفظ نقاط الجلسة والقهاوي الـ3 في قاعدة بياناتنا. الرابط يشتغل 45 دقيقة وأنت تنتظر خويك، و48 ساعة بعد ما تطلع النتائج. [للتأكيد من أمجد: متى تنحذف الجلسات المنتهية من قاعدة البيانات، الكود يوقف عرضها بس ما يحذفها]",
        "لما يطلع بحث «بيننا» بنتائج، يرسل خادمنا ملخص لخدمة أتمتة ترسله بالإيميل لفريق وين. الملخص فيه النقطتين بالإحداثيات الدقيقة وروابط الخريطة، والقهاوي الـ3 ومسافاتها، واللغة، ورقم الجلسة. ما فيه اسم ولا إيميل ولا جوال. [للتأكيد من أمجد: مزوّد الأتمتة، الكود يرسل لـ Cursor Automations، ومدة الاحتفاظ بهالإيميلات]",
        "«بيننا» ما يطلب إيميلك. والتحليلات توصلها القهاوي والمسافات، مو إحداثياتك.",
      ],
    },
    {
      heading: "واتساب وأصحاب القهاوي",
      paragraphs: [
        "زر «تواصل معنا» وزر «تملك هالقهوة؟» يفتحون محادثة واتساب مع رقمنا. اللي تكتبه هناك يمشي على شروط واتساب (Meta) ويشوفه فريقنا. [للتأكيد من أمجد: مدة الاحتفاظ بمحادثات واتساب]",
        "صاحب القهوة اللي يعدّل صفحة قهوته برابط خاص، المعلومات والصور اللي يرسلها تنحفظ في قاعدة بياناتنا وفي Vercel Blob وتطلع للكل في صفحة القهوة. [للتأكيد من أمجد: هل توثيق الملكية داخل الموقع مستخدم؛ الكود يدعم رقم جوال ورمز تحقق عبر واتساب وإثبات سجل تجاري، وتنبيه بالإيميل عبر Resend]",
        "[للتأكيد من أمجد: هل رقم واتساب الآلي (WhatsApp Business) شغّال؛ إذا شغّال يستقبل رقم المرسل ونص رسالته ويرد عليه]",
      ],
    },
    {
      heading: "الاستضافة وسجلات الخادم",
      paragraphs: [
        "الموقع مستضاف على Vercel. مثل أي موقع، الخادم يستقبل عنوان IP، نوع المتصفح، الصفحة المطلوبة، والوقت، وVercel يحتفظ بسجلات. [للتأكيد من أمجد: مدة الاحتفاظ بسجلات Vercel حسب الباقة]",
      ],
    },
    {
      heading: "اللي ينحفظ في متصفحك",
      bullets: [
        "اختيار المدينة، وزر «محلي بس» (إخفاء السلاسل)، والقهاوي اللي علّمت إنك رحتها، وإنك سمحت بالموقع (نعم أو لا).",
        "بيانات مؤقتة للتبويب: الترتيب اللي اخترته، حالة انتظار «بيننا» (فيها نقطتك أنت)، تقييمك للنتائج، ورقم الجلسة.",
        "الكوكيز: wain_vid (حقنا، للتصويت)، وكوكيز Google Analytics (_ga و_ga_<ID>)، وكوكيز القياس الإعلاني من Google وX وOpenAI المذكورة فوق.",
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
        "نعتمد على موافقتك (مثل إذن الموقع، واستخدامك لـ «بيننا»، ونشرك لفكرة)، وعلى مصلحتنا المشروعة في تشغيل الموقع وتحسينه وحمايته (مثل التحليلات وسجلات الأمان). [للتأكيد من أمجد: صياغة الأساس النظامي، وهل نحتاج شريط موافقة على الكوكيز والتحليلات]",
      ],
    },
    {
      heading: "مع مين نشارك البيانات",
      paragraphs: [
        "نشارك بس اللي يلزم لتشغيل الموقع، مع مزوّدين يخدموننا:",
      ],
      bullets: [
        "Google: Tag Manager وAnalytics، وGoogle Maps لقراءة الروابط والمواقع.",
        "Vercel: الاستضافة، والسجلات، وWeb Analytics، وتخزين صور أصحاب القهاوي (Blob).",
        "Neon: قاعدة البيانات (الأفكار، الأصوات، جلسات «بيننا»، بيانات أصحاب القهاوي).",
        "DataFast: التحليلات.",
        "X (تويتر) وOpenAI: بكسلات القياس الإعلاني.",
        "xAI: كتابة جملة الرد القصيرة في الشات.",
        "خدمة الأتمتة اللي ترسل ملخص «بيننا» بالإيميل [للتأكيد من أمجد: اسم المزوّد].",
        "Meta (واتساب)، وResend للإيميل، وGitHub لمتابعة الاقتراحات، إذا كانت مفعّلة.",
      ],
    },
    {
      heading: "نقل البيانات خارج المملكة",
      paragraphs: [
        "بعض هالمزوّدين، مثل Vercel وGoogle وX وOpenAI، يعالجون البيانات على خوادم برّا السعودية (مثل أمريكا وأوروبا). ننقل البيانات بالقدر اللازم وحسب أحكام النقل في نظام حماية البيانات الشخصية. [للتأكيد من أمجد: مناطق خوادم Vercel وNeon، وآلية النقل المعتمدة]",
      ],
    },
    {
      heading: "حماية البيانات",
      paragraphs: [
        "الموقع يشتغل على HTTPS. رقم التصويت ورموز أصحاب القهاوي ورموز التحقق ننحفظها مشفّرة باتجاه واحد (hash). المفاتيح السرية تبقى في الخادم، وعندنا حد لعدد الطلبات ضد الإزعاج. ومع ذلك، ما فيه نظام آمن 100٪.",
      ],
    },
    {
      heading: "حقوقك",
      paragraphs: ["حسب نظام حماية البيانات الشخصية، من حقك:"],
      bullets: [
        "تعرف وش نجمع عنك وليش (وهذي الصفحة جزء من هالشي).",
        "تطلب نسخة من بياناتك اللي عندنا.",
        "تطلب تصحيح أي بيانات غلط.",
        "تطلب حذف بياناتك إذا ما عاد فيه داعي نحتفظ فيها.",
        "تسحب موافقتك أي وقت، مثل إنك توقف إذن الموقع أو تمسح الكوكيز.",
        "ترفع شكوى للهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا) عن طريق sdaia.gov.sa.",
      ],
    },
    {
      heading: "كيف تطلب حقك",
      paragraphs: [
        `راسلنا على ${CONTACT_EMAIL.ar}. ما عندنا حسابات، فساعدنا نلقى بياناتك: مثلًا نص الفكرة اللي كتبتها، أو رابط دعوة «بيننا». ممكن نطلب منك شي بسيط نتأكد فيه إن الطلب منك.`,
        "نرد عليك خلال [للتأكيد من أمجد: مدة الرد، المقترح 30 يوم].",
      ],
    },
    {
      heading: "الأطفال",
      paragraphs: [
        "وين موجّه للجمهور العام، مو للأطفال تحت [للتأكيد من أمجد: الحد الأدنى للعمر، المقترح 18 سنة]. ما نجمع بيانات الأطفال وحنا عارفين. إذا تشوف إن طفل أرسل لنا بيانات، كلّمنا ونحذفها.",
      ],
    },
    {
      heading: "تعديل هالسياسة",
      paragraphs: [
        "ممكن نحدّث السياسة إذا تغيّر الموقع أو النظام. بنغيّر تاريخ «آخر تحديث» فوق، وإذا التغيير كبير بننبّه عليه في الموقع.",
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
    "This policy explains what Wain (wain.lol) may learn about you when you use the site, why we need it, where it goes, and how you can control it. We wrote it from what the site's code actually does. It follows Saudi Arabia's Personal Data Protection Law (PDPL).",
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
        "We only get your location if you allow it. For Nearby and distance sorting it stays on your device. For بيننا (Halfway) the pins you set are sent to our server, as explained below.",
        "The site shows no ads. But to measure our own marketing, we use ad-measurement tools from Google, X (Twitter), and OpenAI. They record your page visits and when بيننا shows you results.",
      ],
    },
    {
      heading: "Analytics",
      paragraphs: [
        "Every page loads Google Tag Manager (container GTM-W3TM4552), which passes events to Google Analytics 4. Google Analytics typically records the pages you view, your device and browser, an approximate location from your IP address, and the page you came from, and sets cookies such as _ga and _ga_<ID>. [AMJAD TO CONFIRM: GA4 settings such as IP handling, Google signals, and ads linking]",
        "Events we send: when you see three picks, open Maps, share, upvote a café, filter or sort, choose a district, use بيننا, or rate results. They carry details such as our café ID, the district, the language, and the share channel.",
        "What you type into the chat box, and into the search on the all-districts page, is sent to Google Analytics as text. Please don't type personal details there.",
        "When you rate a set of results (helpful or not) you can add a short note. That note goes to Google Analytics only. We don't store it in our database.",
        "Vercel Web Analytics counts page views.",
        "DataFast (datafa.st) is an analytics tool that records pages, the referring site, browser and device, and country. [AMJAD TO CONFIRM: whether DataFast sets a cookie or visitor ID; none was seen in our 4 October check] DataFast also receives a note about the request when a known AI crawler (a bot) loads a page. This does not happen for normal visitors.",
        "Ad measurement: Google Tag Manager also loads the X (Twitter) pixel and the OpenAI ads pixel. They record page visits and when a بيننا search shows results. Google Analytics is also linked to Google's advertising tools (DoubleClick). These companies set their own cookies, such as _gcl_au (Google), _twpid and _twsid (X), and __obref (OpenAI), plus cookies on their own domains, and use the data under their own policies. [AMJAD TO CONFIRM: the purpose of the X and OpenAI pixels, and whether consent is needed before they load]",
        "Retention: Google Analytics [AMJAD TO CONFIRM: GA4 data-retention setting], DataFast [AMJAD TO CONFIRM: DataFast retention], Vercel Web Analytics per Vercel's settings [AMJAD TO CONFIRM: Vercel Analytics retention].",
      ],
    },
    {
      heading: "The chat and search box",
      paragraphs: [
        "What you type goes to our server so it can pick three cafés for you. The server also keeps a small internal learning record: your text, the three café IDs, the language, and a random session ID kept in your browser tab. It does the same when you open one of the picks in Maps. This record sits in our server logs and temporary storage. [AMJAD TO CONFIRM: retention for server logs and the learning record]",
        "To write the short line above the picks, the server may send your text and the names of the picked cafés to xAI, our AI provider. We don't send your location or any ID with it. [AMJAD TO CONFIRM: whether the xAI reply is switched on in production]",
        "Cafés you mark as visited are saved in your browser and sent with each ask so we don't repeat them. We don't store that list on our side.",
      ],
    },
    {
      heading: "Suggesting a café",
      paragraphs: [
        "If you paste a Google Maps link to suggest a café, we keep the link, the name we read from it, and the time. Our server opens the link on Google Maps to read the name. The suggestion may also be filed as a task in our GitHub tracker. [AMJAD TO CONFIRM: whether filing suggestions to GitHub is switched on]",
        "A suggestion only needs the link, so please don't add personal details.",
      ],
    },
    {
      heading: "The ideas board and upvotes",
      paragraphs: [
        "Ideas you post on the ideas board are stored in our database (Neon) and shown publicly with their vote count. No name, email, or page address is saved with them. Please don't include personal details. [AMJAD TO CONFIRM: how long ideas are kept; the code never deletes them]",
        "When you vote on an idea or upvote a café, we set a cookie called wain_vid with a random ID (it lasts up to 400 days). With your vote we store only a one-way hash of that ID, so a vote can't be counted twice. Removing a café upvote deletes its record.",
        "To stop spam, our server briefly checks your IP address in memory to limit requests. We don't save it in the database.",
      ],
    },
    {
      heading: "Your location (Nearby and distance)",
      paragraphs: [
        "We only see your location if you allow it in your browser. We use it inside your browser to sort cafés by distance and show how far they are. For these features your location is not sent to our server or anyone else.",
        "We save only whether you allowed location (yes or no) in your browser, never your coordinates.",
        "You can turn location off at any time in your browser settings.",
      ],
    },
    {
      heading: "بيننا (Halfway)",
      paragraphs: [
        "You can set your pin from your location, from coordinates, or from a Google Maps link. We round each pin to about one metre.",
        "Pins are sent to our server to find cafés in the middle. If you paste a Maps link, our server asks Google Maps where it points.",
        "When you invite a friend, your pin is built into the invite link (/h/…). Anyone with the link can work out that pin, so share it only with the person you're meeting. Because the pin is part of the link, the analytics and ad-measurement tools on the page (Google, X, OpenAI, and DataFast) receive the link when it opens, and could technically read the pin from it. [AMJAD TO CONFIRM: whether this is changed before launch, for example by hiding /h/ links from analytics or using a random invite ID]",
        "So you both see the same results, we store the session's pins and the three cafés in our database. The link works for 45 minutes while you wait for your friend, and for 48 hours after the results appear. [AMJAD TO CONFIRM: when expired sessions are deleted from the database; the code stops showing them but does not delete them]",
        "When a بيننا search returns results, our server sends a summary to an automation service that emails it to the Wain team. The summary has both pins as exact coordinates and Maps links, the three cafés and their distances, the language, and the session ID. It has no name, email, or phone number. [AMJAD TO CONFIRM: the automation vendor (the code posts to Cursor Automations) and how long these emails are kept]",
        "بيننا does not ask for your email. Analytics receive the cafés and distances, not your coordinates.",
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
        "Cookies: wain_vid (ours, for voting), Google Analytics cookies (_ga and _ga_<ID>), and the Google, X, and OpenAI ad-measurement cookies listed above.",
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
        "We rely on your consent (for example, location permission, using بيننا, or posting an idea) and on our legitimate interest in running, improving, and protecting the site (for example, analytics and security logs). [AMJAD TO CONFIRM: legal-basis wording, and whether a cookie and analytics consent banner is needed]",
      ],
    },
    {
      heading: "Who we share data with",
      paragraphs: ["We share only what's needed to run the site, with providers that work for us:"],
      bullets: [
        "Google: Tag Manager and Analytics, and Google Maps for reading links and places.",
        "Vercel: hosting, logs, Web Analytics, and storage for café owners' photos (Blob).",
        "Neon: our database (ideas, votes, بيننا sessions, café owner data).",
        "DataFast: analytics.",
        "X (Twitter) and OpenAI: ad-measurement pixels.",
        "xAI: writing the short reply line in the chat.",
        "The automation service that emails the بيننا summary [AMJAD TO CONFIRM: vendor name].",
        "Meta (WhatsApp), Resend for email, and GitHub for tracking suggestions, where switched on.",
      ],
    },
    {
      heading: "Transfers outside Saudi Arabia",
      paragraphs: [
        "Some of these providers, such as Vercel, Google, X, and OpenAI, process data on servers outside Saudi Arabia (for example in the US and Europe). We transfer only what's needed and follow the PDPL's transfer rules. [AMJAD TO CONFIRM: Vercel and Neon server regions, and the transfer mechanism relied on]",
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
      paragraphs: ["Under the PDPL you have the right to:"],
      bullets: [
        "Know what we collect about you and why (this page is part of that).",
        "Ask for a copy of the data we hold about you.",
        "Ask us to correct data that's wrong.",
        "Ask us to delete your data when we no longer need it.",
        "Withdraw your consent at any time, for example by turning off location or clearing cookies.",
        "Complain to the Saudi Data and AI Authority (SDAIA) at sdaia.gov.sa.",
      ],
    },
    {
      heading: "How to use your rights",
      paragraphs: [
        `Email us at ${CONTACT_EMAIL.en}. We have no accounts, so help us find your data: for example, the text of an idea you posted, or a بيننا invite link. We may ask for something simple to check the request is yours.`,
        "We'll reply within [AMJAD TO CONFIRM: response time, recommended 30 days].",
      ],
    },
    {
      heading: "Children",
      paragraphs: [
        "Wain is for a general audience and is not aimed at children under [AMJAD TO CONFIRM: minimum age, recommended 18]. We don't knowingly collect children's data. If you think a child has sent us data, tell us and we'll delete it.",
      ],
    },
    {
      heading: "Changes to this policy",
      paragraphs: [
        "We may update this policy when the site or the law changes. We'll change the Last updated date at the top, and flag big changes on the site.",
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
    "هذي الشروط تنظّم استخدامك لوين (wain.lol). استخدامك للموقع يعني إنك موافق عليها، فاقرأها قبل.",
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
        "الأفكار والاقتراحات والتقييمات اللي ترسلها، تعطينا الحق نعرضها ونستخدمها ونعدّلها ونحذفها عشان نحسّن وين. أنت مسؤول عن اللي تكتبه، ولنا الحق نشيل أي شي يخالف هذي الشروط.",
        "صاحب القهوة لازم تكون المعلومات اللي يرسلها صحيحة، ولنا الحق نعدّلها أو نشيلها.",
      ],
    },
    {
      heading: "الملكية الفكرية والعلامة",
      paragraphs: [
        `اسم «وين» و«Wain»، والشعار، والتصميم، وطريقة ترتيب الدليل، كلها ملك ${CONTROLLER.ar}.`,
        "أسماء القهاوي وشعاراتها ملك أصحابها. لا تستخدم اسمنا أو شعارنا بطريقة توحي إننا نتبنّاك أو نوصي فيك.",
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
        `أي سؤال عن هذي الشروط: ${CONTACT_EMAIL.ar}، أو زر «تواصل معنا» تحت الصفحة.`,
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
        `Questions about these terms: ${CONTACT_EMAIL.en}, or the Contact us button at the bottom of the page.`,
      ],
    },
  ],
};

export const LEGAL_DOCS: Record<LegalKind, Record<Language, LegalDoc>> = {
  privacy: { ar: PRIVACY_AR, en: PRIVACY_EN },
  terms: { ar: TERMS_AR, en: TERMS_EN },
};

export function legalDoc(kind: LegalKind, language: Language): LegalDoc {
  return LEGAL_DOCS[kind][language];
}
