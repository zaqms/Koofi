import { coffeeShopsInDistrict } from "./directory-category";
import {
  GATE_CAFE_ID,
  NEARBY_DISTRICTS,
  shopsInDistrict,
  siblingShops,
} from "./en-content";
import { listDirectoryShops } from "./catalog";
import { neighborhoodLabel } from "./neighborhoods";
import { cardPath, districtPath, PRODUCT_NAME, shopDisplayName } from "./product";
import type { NeighborhoodId, Shop } from "./types";
import { vibeLabels } from "./vibe-labels";

const AR_COUNT_WORDS = [
  "صفر",
  "وحدة",
  "ثنتين",
  "ثلاث",
  "أربع",
  "خمس",
  "ست",
  "سبع",
  "ثمان",
  "تسع",
  "عشر",
  "إحدى عشر",
  "اثنتي عشر",
] as const;

export function countWordAr(n: number): string {
  if (n >= 0 && n < AR_COUNT_WORDS.length) return AR_COUNT_WORDS[n];
  return String(n);
}

export const GATE_FORBIDDEN_CLAIMS_AR = [
  "مواقف",
  "موقف سيارات",
  "واي فاي",
  "وايفاي",
  "جلسة برا",
  "outdoor",
  "parking",
  "wifi",
] as const;

/** Locked 9 Sep 2026. Najdi paraphrase of the EN KAFD gold master. Do not rewrite. */
export const GOLD_MASTER_KAFD_AR = {
  title: `مقاهي في كافد · ${PRODUCT_NAME}`,
  meta: "قائمة قصيرة لقهاوي كافد على wain.lol — سبع أماكن في الرياض، وكل وحدة عليها رابط قوقل ماب.",
  markdown: `# مقاهي في كافد

إذا أنت بكافد وتبي قهوة من غير ما تتمشى بالشاشة طول الوقت، هذي الصفحة لك. هذي قائمتنا للأماكن بهالجزء من الرياض اللي حطيناها على wain.lol للحين.

## وش فيه

فيه **سبع** قهاوي من كافد بالقائمة الحين:

- [١٢ كوب](/c/12-cups-roastery-and-cafe-kafd)
- [كافي تيل](/c/cafe-tale-kafd)
- [كوفي بلانيت](/c/coffee-planet-kafd)
- [درافت](/c/draft-cafe-kafd)
- [هل الكيف](/c/hal-alkeif-kafd)
- [توبيز استيت](/c/tobys-estate-kafd)
- [تريستي](/c/trieste-kafd)

اختار اللي تمشي معك، افتح البطاقة، واضغط **ودّني هناك** إذا جاهز تروح. الساعات والدبوس على قوقل ماب.

## أحياء ثانية قريبة

تستاهل نظرة من هالجوار:

- [مقاهي في الورود](/coffee-shops/al-wurud)
- [مقاهي في الصحافة](/coffee-shops/as-sahafah)
- [مقاهي في العليا](/coffee-shops/olaya)
- [مقاهي في النرجس](/coffee-shops/al-narjis)

## عن وين

wain.lol دليل قهوة صغير في الرياض. تقدر تطلب ثلاث اقتراحات، أو تتفرج على الحي كذا. مو موقع تقييمات ولا تطبيق توصيل — قائمة نظيفة مع الخريطة إذا تبي الطريق. التفاصيل الأطول في [عن وين](/about).

الرياض بس للحين. ناقصك مكان تحبه؟ ارمي رابط قوقل ماب من الموقع.`,
} as const;

/** Locked 9 Sep 2026. Najdi paraphrase of the EN Al Wurud gold master. Do not rewrite. */
export const GOLD_MASTER_AL_WURUD_AR = {
  title: `مقاهي في الورود · ${PRODUCT_NAME}`,
  meta: "أربع قهاوي بالورود على wain.lol — قائمة حي أهدأ في الرياض، مع روابط قوقل ماب.",
  markdown: `# مقاهي في الورود

الورود أكثر شوارع سكنية من أبراج مكاتب — حي بالرياض تقدر تبي فيه قهوة هادية من غير ما تقطع البلد. هذي الصفحة المجموعة الصغيرة من أماكن الورود اللي ضفناها على wain.lol للحين.

## وش فيه

**أربع** قهاوي من الورود بالكتالوج اليوم:

- [قهوة كارڤ](/c/carve-coffee-bar-al-wurud)
- [إيا](/c/eya-specialty-coffee-al-wurud)
- [جو بارل](/c/joe-barrel-al-wurud)
- [The Gate Specialty Coffee](/c/the-gate-specialty-coffee-al-wurud)

قائمة قصيرة عمداً — إطلاق خفيف، بس اللي ضفناه فعلاً. افتح البطاقة إذا واحدة تمشي، بعدين **ودّني هناك** للدبوس والساعات على قوقل ماب.

## أحياء ثانية قريبة

- [مقاهي في كافد](/coffee-shops/kafd)
- [مقاهي في الربوة](/coffee-shops/al-rabwah)
- [مقاهي في الربيع](/coffee-shops/al-rabi)
- [مقاهي في العليا](/coffee-shops/olaya)

## عن وين

wain.lol يساعدك تلقى قهوة بالرياض — اطلب ثلاث اقتراحات، أو افتح قائمة حي كذا. مو موقع تقييمات ومو توصيل. [عن وين](/about) فيه الشرح الأطول.

الرياض بس للحين. تعرف محل ناقصنا؟ ارمي رابط قوقل ماب من الموقع.`,
} as const;

/** Locked 9 Sep 2026. Najdi paraphrase of locked Gate themes. Do not invent nameAr. */
export const GOLD_MASTER_GATE_AR = {
  title: `The Gate Specialty Coffee · الورود · الرياض · ${PRODUCT_NAME}`,
  meta: "The Gate Specialty Coffee بالورود على wain.lol — قهوة مختصة وحلويات جنب كافد؛ افتح قوقل ماب للدبوس والساعات.",
  markdown: `**The Gate Specialty Coffee** بقائمة الورود على wain.lol، بمنطقة مول العليا. الناس غالباً يذكرون القهوة المختصة، التشيزكيك وحلويات ثانية، الطاقم الودود، ومكان هادي وجميل تفك فيه.

الباقي بنفس قائمة الورود:

- [قهوة كارڤ](/c/carve-coffee-bar-al-wurud)
- [إيا](/c/eya-specialty-coffee-al-wurud)
- [جو بارل](/c/joe-barrel-al-wurud)

صفحة الحي كاملة: [مقاهي في الورود](/coffee-shops/al-wurud).`,
} as const;

const GOLD_DISTRICT_AR = {
  kafd: GOLD_MASTER_KAFD_AR,
  "al-wurud": GOLD_MASTER_AL_WURUD_AR,
} as const;

type DistrictLead = {
  lead: string;
  hereIntro?: string;
  hereOutro?: string;
  nearbyIntro?: string;
  about: string;
  meta?: string;
};

const DISTRICT_COPY_AR: Partial<Record<NeighborhoodId, DistrictLead>> = {
  "al-narjis": {
    lead: `النرجس فوق، شمال الرياض. إذا أنت بهالجهة وتبي قهوة من الكتالوج، هذي صفحة النرجس على wain.lol.

ناس يسألون أول عن [كور قهوة ومحمصة](/c/core-coffee-and-roastery-al-narjis) و[كاف لاب](/c/caf-lab-al-narjis) و[محمصة ريبوستري](/c/repository-coffee-roasters-al-narjis). موجودين مع الباقي. ما نرتّبهم.

هذا عدد اللي ضفناه من النرجس. افتح بطاقة إذا الاسم يمشي. خلّها إذا ما يمشي.`,
    hereIntro: `فيه **{count}** قهاوي من النرجس بالكتالوج اليوم:`,
    hereOutro: `الأسماء من الكتالوج مثل ما ضفناها. افتح البطاقة إذا واحدة تمشي، بعدين **ودّني هناك** للدبوس والساعات على قوقل ماب.`,
    nearbyIntro: `إذا النرجس مو الوقف، هالقوائم الشمالية جنبكم بالموقع:`,
    about: `wain.lol دليل قهوة صغير في الرياض. اطلب ثلاث اقتراحات، أو تفرّج على قائمة حي مثل النرجس. مو تقييمات، مو توصيل. [عن وين](/about) فيه الملاحظة الأطول.

الرياض بس للحين. ناقصك مكان؟ ارمي رابط قوقل ماب من الموقع.`,
    meta: "قهاوي النرجس على wain.lol — قائمة شمال الرياض فيها كور وكاف لاب وريبوستري، وكل وحدة عليها رابط قوقل ماب.",
  },
  diriyah: {
    lead: `الدرعية غرب اللفّة الشمالية المعتادة — جاكس، البجيري، البلد القديم. هذي مجموعة الدرعية اللي حطيناها على wain.lol للحين.`,
    hereIntro: `فيه **{count}** قهاوي من الدرعية بالكتالوج اليوم:`,
    hereOutro: `افتح البطاقة إذا الاسم يمشي، بعدين **ودّني هناك** للدبوس. الساعات تبقى على قوقل ماب.`,
    about: `wain.lol يساعدك تلقى قهوة بالرياض — ثلاث اقتراحات، أو قائمة حي مثل الدرعية. [عن وين](/about) فيه الشرح الأطول.

الرياض بس للحين. تعرف محل ناقصنا؟ ارمي رابط قوقل ماب من الموقع.`,
  },
  "al-yasmin": {
    lead: `الياسمين حي شمال الرياض جنب الملقا والنرجس. هذي قهاوي الياسمين اللي ضفناها على wain.lol للحين — بس اللي بالكتالوج فعلاً.`,
    hereIntro: `فيه **{count}** قهاوي من الياسمين بالقائمة الحين:`,
    hereOutro: `اختار اسم، افتح البطاقة، واستخدم **ودّني هناك** إذا تبي الدبوس.`,
    about: `تفرّج على الحي أو اسأل الشات. wain.lol قائمة رياض نظيفة مع الخريطة. المزيد في [عن وين](/about).

الرياض بس للحين. ناقصك مكان تحبه؟ ارمي رابط قوقل ماب من الموقع.`,
  },
  "al-mughrizat": {
    lead: `المغرزات من القوائم القصيرة على wain.lol. نضيف اللي عندنا بس — ما نحشي أسماء عشان الصفحة تبين مشغولة.`,
    hereIntro: `فيه قهوة **{count}** من المغرزات بالكتالوج اليوم:`,
    hereOutro: `هذي المجموعة كلها للحين. افتح البطاقة، بعدين **ودّني هناك** لدبوس قوقل ماب وساعات اليوم.`,
    about: `wain.lol دليل قهوة صغير في الرياض. تقدر تطلب ثلاث اقتراحات، أو تفتح صفحة حي كذا. [عن وين](/about).

الرياض بس للحين. ارمي رابط قوقل ماب من الموقع إذا ناقصنا محل.`,
  },
  "al-rabwah": {
    lead: `الربوة شرق خط العليا–الورود. هذي قهاوي الربوة بالكتالوج اليوم.`,
    hereIntro: `فيه **{count}** قهاوي من الربوة على wain.lol الحين:`,
    hereOutro: `ما نخترع أسماء زيادة. افتح بطاقة، بعدين **ودّني هناك** عشان الخريطة توريك الدبوس والساعات.`,
    about: `wain.lol يساعدك تلقى قهوة بالرياض — اطلب ثلاث اقتراحات، أو افتح قائمة حي مثل الربوة. مو تقييمات ومو توصيل. [عن وين](/about).

الرياض بس للحين. تعرف محل ناقصنا؟ ارمي رابط قوقل ماب من الموقع.`,
  },
  "as-sahafah": {
    lead: `الصحافة شمال الرياض. هذي قهاوي الصحافة اللي ضفناها للحين.`,
    hereIntro: `فيه **{count}** قهاوي من الصحافة بالكتالوج اليوم:`,
    hereOutro: `طول الإطلاق الخفيف. افتح البطاقة إذا واحدة تمشي، بعدين **ودّني هناك** للدبوس. الساعات على قوقل ماب.`,
    about: `wain.lol دليل قهوة صغير في الرياض. ثلاث اقتراحات، أو قائمة حي. [عن وين](/about) فيه الملاحظة الأطول.

الرياض بس للحين. ناقصك مكان؟ ارمي رابط قوقل ماب من الموقع.`,
  },
  ghirnatah: {
    lead: `غرناطة شرق الرياض. هذي قهاوي جهة غرناطة اللي حطيناها على wain.lol للحين.`,
    hereIntro: `فيه **{count}** قهاوي من غرناطة بالقائمة الحين:`,
    hereOutro: `اختار اللي تمشي، افتح البطاقة، واضغط **ودّني هناك** إذا تبي الدبوس.`,
    about: `تفرّج على الحي أو اسأل الشات. wain.lol قائمة رياض نظيفة مع الخريطة. المزيد في [عن وين](/about).

الرياض بس للحين. ارمي رابط قوقل ماب من الموقع إذا ناقصنا محل.`,
  },
  hittin: {
    lead: `حطين من أحياء شمال غرب الرياض بالكتالوج. هذي أماكن حطين اللي ضفناها على wain.lol للحين.`,
    hereIntro: `فيه **{count}** قهاوي من حطين بالقائمة الحين:`,
    hereOutro: `افتح البطاقة إذا واحدة تمشي، بعدين **ودّني هناك** للدبوس والساعات على قوقل ماب.`,
    about: `wain.lol دليل قهوة صغير في الرياض. اطلب ثلاث اقتراحات، أو تفرّج على قائمة حي. [عن وين](/about).

الرياض بس للحين. ناقصك مكان تحبه؟ ارمي رابط قوقل ماب من الموقع.`,
  },
  "al-malqa": {
    lead: `الملقا حي شمال الرياض على wain.lol. هذي مجموعة الملقا من الكتالوج — الأسماء اللي ضفناها.`,
    hereIntro: `فيه **{count}** قهاوي من الملقا بالكتالوج اليوم:`,
    hereOutro: `اختار اسم، افتح البطاقة، واستخدم **ودّني هناك** إذا تبي الدبوس. الساعات تبقى على الخريطة.`,
    about: `wain.lol يساعدك تلقى قهوة بالرياض — ثلاث اقتراحات، أو قائمة كذا. [عن وين](/about).

الرياض بس للحين. تعرف محل ناقصنا؟ ارمي رابط قوقل ماب من الموقع.`,
  },
  "al-nakheel": {
    lead: `صفحة النخيل هي قهاوي النخيل بالقائمة اليوم — حي شمال الرياض.`,
    hereIntro: `فيه **{count}** قهاوي من النخيل على wain.lol الحين:`,
    hereOutro: `بس اللي ضفناه فعلاً. **ودّني هناك** يفتح الخريطة للدبوس وساعات اليوم.`,
    about: `تفرّج على الحي أو اسأل الشات. المزيد في [عن وين](/about).

الرياض بس للحين. ارمي رابط قوقل ماب من الموقع إذا ناقصنا محل.`,
  },
  olaya: {
    lead: `العليا الخط الوسط اللي ناس كثير تعرفه. هذي مجموعة العليا على wain.lol، وكل وحدة عليها رابط خريطة.`,
    hereIntro: `فيه **{count}** قهاوي من العليا بالقائمة الحين:`,
    hereOutro: `افتح البطاقة إذا الاسم يمشي، بعدين **ودّني هناك**. الساعات والدبوس على قوقل ماب.`,
    about: `wain.lol دليل قهوة صغير في الرياض. تقدر تطلب ثلاث اقتراحات، أو تتفرج على حي مثل العليا. [عن وين](/about).

الرياض بس للحين. ناقصك مكان تحبه؟ ارمي رابط قوقل ماب من الموقع.`,
  },
  sulimaniyah: {
    lead: `السليمانية جنب العليا والتحلية. هذي قهاوي السليمانية بالكتالوج للحين.`,
    hereIntro: `فيه **{count}** قهاوي من السليمانية بالكتالوج اليوم:`,
    hereOutro: `اختار واحدة، افتح البطاقة، واضغط **ودّني هناك** إذا جاهز.`,
    about: `wain.lol يساعدك تلقى قهوة بالرياض — اطلب ثلاث اقتراحات، أو افتح قائمة حي. [عن وين](/about).

الرياض بس للحين. تعرف محل ناقصنا؟ ارمي رابط قوقل ماب من الموقع.`,
  },
  "al-rabi": {
    lead: `الربيع قائمة قصيرة اليوم — محل واحد بالكتالوج. ما نحشيها بأسماء ما ضفناها.`,
    hereIntro: `فيه قهوة **{count}** من الربيع على wain.lol الحين:`,
    hereOutro: `هذي المجموعة. افتح البطاقة، بعدين **ودّني هناك** لدبوس الخريطة.`,
    about: `wain.lol دليل قهوة صغير في الرياض. [عن وين](/about).

الرياض بس للحين. ارمي رابط قوقل ماب من الموقع إذا ناقصنا محل.`,
  },
  "al-masif": {
    lead: `المصيف فيه مكان واحد على wain.lol الحين. قصيرة عمداً — بس اللي ضفناه فعلاً.`,
    hereIntro: `فيه قهوة **{count}** من المصيف بالكتالوج اليوم:`,
    hereOutro: `افتح البطاقة، بعدين **ودّني هناك** عشان قوقل ماب يوريك الدبوس والساعات.`,
    about: `تفرّج على الحي أو اسأل الشات. المزيد في [عن وين](/about).

الرياض بس للحين. ناقصك مكان؟ ارمي رابط قوقل ماب من الموقع.`,
  },
  "al-rahmaniyyah": {
    lead: `الرحمانية بالكتالوج بمحل واحد للحين. الصفحة تبقى بهالصراحة.`,
    hereIntro: `فيه قهوة **{count}** من الرحمانية بالقائمة الحين:`,
    hereOutro: `**ودّني هناك** يفتح الخريطة للدبوس.`,
    about: `wain.lol يساعدك تلقى قهوة بالرياض. [عن وين](/about).

الرياض بس للحين. تعرف محل ناقصنا؟ ارمي رابط قوقل ماب من الموقع.`,
  },
  "al-shohda": {
    lead: `الشهداء قائمة شرق الرياض صغيرة — قهوة وحدة ضفناها للحين.`,
    hereIntro: `فيه قهوة **{count}** من الشهداء بالكتالوج اليوم:`,
    hereOutro: `افتح البطاقة إذا تبي الدبوس. **ودّني هناك** يوديك قوقل ماب.`,
    about: `wain.lol دليل قهوة صغير في الرياض. [عن وين](/about).

الرياض بس للحين. ارمي رابط قوقل ماب من الموقع إذا ناقصنا محل.`,
  },
  "al-safa": {
    lead: `الصفا حي شرق الرياض بالقائمة. هذي أماكن الصفا اللي ضفناها.`,
    hereIntro: `فيه **{count}** قهاوي من الصفا على wain.lol الحين:`,
    hereOutro: `افتح البطاقة إذا واحدة تمشي، بعدين **ودّني هناك** للدبوس والساعات على قوقل ماب.`,
    about: `اطلب ثلاث اقتراحات، أو تفرّج على قائمة حي. [عن وين](/about).

الرياض بس للحين. ناقصك مكان تحبه؟ ارمي رابط قوقل ماب من الموقع.`,
  },
  "al-rawdah": {
    lead: `الروضة فيها محل واحد بالكتالوج اليوم. هذي الصفحة كلها — ما نخترع جيران عشان نملا القائمة.`,
    hereIntro: `فيه قهوة **{count}** من الروضة بالكتالوج اليوم:`,
    hereOutro: `افتح البطاقة، بعدين **ودّني هناك**. الساعات تبقى على قوقل ماب.`,
    about: `wain.lol دليل قهوة صغير في الرياض. [عن وين](/about).

الرياض بس للحين. تعرف محل ناقصنا؟ ارمي رابط قوقل ماب من الموقع.`,
  },
  qurtubah: {
    lead: `قرطبة حي شرق الرياض. هذي قهاوي قرطبة على wain.lol — بعد بس اللي بالكتالوج.`,
    hereIntro: `فيه **{count}** قهاوي من قرطبة بالقائمة الحين:`,
    hereOutro: `اختار اسم، افتح البطاقة، واستخدم **ودّني هناك** إذا تبي الدبوس.`,
    about: `wain.lol يساعدك تلقى قهوة بالرياض — ثلاث اقتراحات، أو قائمة حي مثل قرطبة. [عن وين](/about).

الرياض بس للحين. ارمي رابط قوقل ماب من الموقع إذا ناقصنا محل.`,
  },
  "an-nazhah": {
    lead: `النزهة بالكتالوج كقائمة حي لوحدها. هذي الأماكن اللي ضفناها للحين.`,
    hereIntro: `فيه **{count}** قهاوي من النزهة بالكتالوج اليوم:`,
    hereOutro: `افتح البطاقة إذا واحدة تمشي، بعدين **ودّني هناك** لدبوس الخريطة وساعات اليوم.`,
    about: `تفرّج على الحي أو اسأل الشات. المزيد في [عن وين](/about).

الرياض بس للحين. ناقصك مكان؟ ارمي رابط قوقل ماب من الموقع.`,
  },
  "al-hamra": {
    lead: `الحمراء على الحزام الشرقي من الرياض — نفس جهة غرناطة وقرطبة. هذي مجموعة الحمراء على wain.lol: عشر قهاوي ضفناها فعلاً، وكل وحدة عليها دبوس قوقل ماب.

ناس يسألون عن [محمصة سيرين](/c/serene-coffee-roastery) و[قهوة رمثان](/c/rimthan-coffee-al-hamra) و[كوفي حرف](/c/harf-coffee-al-hamra). موجودين مع الباقي. ما نرتّبهم.

عشر بطاقات هذي المجموعة كلها للحين. افتح بطاقة إذا الاسم يمشي. خلّها إذا ما يمشي.`,
    hereIntro: `فيه **{count}** قهاوي من الحمراء بالكتالوج اليوم:`,
    hereOutro: `اختار اسم، افتح البطاقة، واستخدم **ودّني هناك** إذا تبي الدبوس.`,
    nearbyIntro: `إذا الحمراء مو الوقف، هالقوائم شرق الرياض جنبكم بالموقع:`,
    about: `wain.lol دليل قهوة صغير في الرياض. اطلب ثلاث اقتراحات، أو تفرّج على قائمة حي مثل الحمراء. [عن وين](/about).

الرياض بس للحين. ناقصك مكان؟ ارمي رابط قوقل ماب من الموقع.`,
    meta: "عشر قهاوي بالحمراء على wain.lol — قائمة شرق الرياض فيها سيرين ورمثان وحرف، وكل وحدة عليها رابط قوقل ماب.",
  },
  "al-yarmouk": {
    lead: `اليرموك على الجهة الشرقية من الرياض، باتجاه الدائري الشرقي. إذا أنت بهالجهة وتبي قهوة من الكتالوج، هذي مجموعة اليرموك على wain.lol.

ناس يسألون عن [سايلو محمصة وقهوة مختصة](/c/silo-cafe-al-yarmouk) و[نوساوند](/c/nosound-al-yarmouk) و[ريشيو](/c/ratio-speciality-al-yarmouk). موجودين مع السبع الباقية. ما نرتّبهم.

العدد عشر لأن هذا اللي ضفناه من اليرموك.`,
    hereIntro: `فيه **{count}** قهاوي من اليرموك بالكتالوج اليوم:`,
    hereOutro: `افتح البطاقة إذا الاسم يمشي، بعدين **ودّني هناك** للدبوس. الساعات تبقى على قوقل ماب.`,
    nearbyIntro: `إذا اليرموك مو الوقف، هالقوائم شرق الرياض أقرب للموقع:`,
    about: `wain.lol دليل قهوة صغير في الرياض. اطلب ثلاث اقتراحات، أو تفرّج على قائمة حي مثل اليرموك. [عن وين](/about).

الرياض بس للحين. ناقصك مكان؟ ارمي رابط قوقل ماب من الموقع.`,
    meta: "عشر قهاوي باليرموك على wain.lol — قائمة شرق الرياض فيها سايلو ونوساوند وريشيو، وكل وحدة عليها رابط قوقل ماب.",
  },
};

const CNI_BLURBS_AR: Record<string, string> = {
  "core-coffee-and-roastery-al-narjis": `تدور قهوة بالنرجس شمال الرياض؟ **كور قهوة ومحمصة** موجودة بقائمتنا لهالحي — نفس صفحة النرجس مع كاف لاب وريبوستري. إذا تبي اسم ثاني من نفس القائمة الشمالية، الباقي تحت.`,
  "caf-lab-al-narjis": `**كاف لاب** من أماكن النرجس على wain.lol. إذا أنت شمال وتبي هالمحل، أنت بالمكان الصح. باقي أسماء النرجس بالكتالوج مربوطة تحت إذا تبي تنتقل بنفس الحي.`,
  "repository-coffee-roasters-al-narjis": `**محمصة ريبوستري** بالنرجس مع الأسماء الثانية شمال الرياض — نفس قائمة كور وكاف لاب، بطاقتها هي. باقي قائمة النرجس تحت إذا تبي اسم ثاني من نفس الكتالوج.`,
  "jazel-speciality-cafe-diriyah": `**جازل** بقائمة الدرعية على wain.lol — غرب اللفّة الشمالية المعتادة. إذا هذي مو الوقف، أماكن الدرعية الثانية بنفس قائمة الحي مربوطة تحت — بس اللي ضفناه فعلاً.`,
  "qirat-al-yasmin": `**قيراط** من قهاوي الياسمين على wain.lol. إذا تتفرج على هالحي شمال الرياض جنب الملقا والنرجس، هذي البطاقة. باقي أسماء الياسمين بالكتالوج تحت إذا تبي تقارن بنفس القائمة — ما نخترع زيادة.`,
  "cred-al-mughrizat": `المغرزات قائمة قصيرة على wain.lol، و**كريد** القهوة اللي فيها اليوم. نضيف اللي عندنا بس — حي صغير بالقائمة، مو ترتيب. إذا تبي قائمة حي أطول، صفحة الحي تشير لأحياء قريبة نغطيها فعلاً. ما فيه قهوة ثانية بنفس القائمة للحين.`,
  "sulalat-coffee-ar-rabwah": `**سلالات القهوة** بالربوة — شرق خط العليا–الورود، صفحة حي لوحدها. أماكن الربوة الثانية بالكتالوج تحت إذا تبي اسم ثاني من نفس القائمة. هذي مو مقال «أفضل قهاوي».`,
  "taim-specialty-coffee-as-sahafah": `**تَيْم** بقائمة الصحافة على wain.lol. إذا أنت بهالجهة وتبي هالبطاقة، أنت بالمكان الصح. باقي أسماء الصحافة اللي ضفناها مربوطة تحت — قائمة قصيرة، بس اللي بالكتالوج. ما نخترع مجموعة أطول عشان الصفحة تبين مشغولة.`,
  "archi-ghirnatah": `**ارتشي غرناطة** بقائمة غرناطة — شرق الرياض. أماكن جهة غرناطة الثانية على wain.lol تحت إذا تبي تبقى بهالجانب من البلد. القائمة بس اللي بالكتالوج.`,
  "serene-coffee-roastery": `**محمصة سيرين** بقائمة الحمراء على wain.lol — صفحة الحزام الشرقي. وسوم الكتالوج على البطاقة: محمصة. باقي أسماء الحمراء تحت إذا هذي مو الوقف.`,
  "rimthan-coffee-al-hamra": `**قهوة رمثان** من قهاوي الحمراء على wain.lol. إذا أنت بهالجهة الشرقية وتبي هالبطاقة، أنت بالمكان الصح. باقي كتالوج الحمراء مربوط تحت.`,
  "mind-break-al-hamra": `**مايند بريك** بالكتالوج في الحمراء — بطاقتها هي بقائمة الحي، مو ترتيب على مستوى المدينة. باقي أسماء الحمراء اللي ضفناها مربوطة تحت.`,
  "jather-al-hamra": `الحمراء فيها **جذر** بالكتالوج. هذي البطاقة إذا تبي هالاسم من قائمة الحزام الشرقي. الباقي بنفس الحي تحت — بس اللي ضفناه فعلاً.`,
  "harf-coffee-al-hamra": `**كوفي حرف** موجودة بقائمة wain.lol لحي الحمراء بالرياض. نفس صفحة الحي مع سيرين ورمثان، دبوسها هي. انتقل لبطاقات الحمراء الثانية تحت إذا تبي اسم ثاني.`,
  "zeila-al-hamra": `**زَيّلا** بقائمة الحمراء على wain.lol — الحزام الشرقي. أماكن الحمراء الثانية بالكتالوج تحت.`,
  "cord-cafe-al-hamra": `**كورد قهوة يومية** بقائمة الحمراء — بطاقة محمصة بهالصفحة شرق الرياض. وسوم الكتالوج على البطاقة: محمصة. باقي الحمراء مربوط تحت.`,
  "drip-al-hamra": `هذي صفحة **دريب** على wain.lol للحمراء. باقي أسماء الحمراء بالكتالوج تحت إذا تبي تبقى بهالحي.`,
  "coffee-address-al-hamra": `**عنوان القهوة (البشور)** بالكتالوج في الحمراء على wain.lol. إذا هالاسم من الحزام الشرقي هو اللي تبيه، البطاقة هنا. ما نخترع زيادة؛ قهاوي الحمراء الثانية اللي ضفناها مربوطة تحت.`,
  "glint-al-hamra": `الحمراء فيها **جلينت** بالكتالوج. البطاقة هنا إذا تبي دبوس الخريطة من قائمة هالحي. أماكن الحمراء الثانية على wain.lol تحت.`,
  "silo-cafe-al-yarmouk": `**سايلو محمصة وقهوة مختصة** بقائمة اليرموك على wain.lol. وسوم الكتالوج على البطاقة: محمصة. باقي أسماء اليرموك تحت إذا هذي مو الوقف.`,
  "nosound-al-yarmouk": `هذي صفحة **نوساوند** على wain.lol لليرموك. باقي أسماء اليرموك بالكتالوج تحت إذا تبي تبقى بهالحي.`,
  "obo-speciality-al-yarmouk": `**اوبو للقهوة المختصة** بالكتالوج في اليرموك — دبوسها شرق الرياض. باقي أسماء اليرموك اللي ضفناها مربوطة تحت.`,
  "shafel-roastery-al-yarmouk": `**محمصة قهوة شفل** موجودة بقائمة wain.lol لحي اليرموك بالرياض. وسوم الكتالوج على البطاقة: محمصة. نفس صفحة الحي مع سايلو وريشيو، دبوسها هي. انتقل لبطاقات اليرموك الثانية تحت إذا تبي اسم ثاني.`,
  "coffee-address-al-yarmouk": `**عنوان القهوة** بالكتالوج في اليرموك على wain.lol. هذي دبوس اليرموك. ما نخترع زيادة؛ قهاوي اليرموك الثانية اللي ضفناها مربوطة تحت.`,
  "aleel-roastery-al-yarmouk": `اليرموك فيها **محمصة أليل** بالكتالوج. وسوم الكتالوج على البطاقة: محمصة. هذي البطاقة إذا تبي هالاسم من قائمة اليرموك. الباقي بنفس الحي تحت.`,
  "bourbon-al-yarmouk": `**بوربون للقهوة المختصة** من قهاوي اليرموك على wain.lol. إذا أنت باتجاه الدائري الشرقي وتبي هالبطاقة، أنت بالمكان الصح. باقي كتالوج اليرموك مربوط تحت.`,
  "ratio-speciality-al-yarmouk": `**ريشيو** بقائمة اليرموك. أماكن اليرموك الثانية بالكتالوج تحت.`,
  "coffee-zam-al-yarmouk": `**زام البن** موجودة بقائمة wain.lol لحي اليرموك بالرياض. نفس صفحة الحي مع سايلو ونوساوند، دبوسها هي. انتقل لبطاقات اليرموك الثانية تحت إذا تبي اسم ثاني.`,
  "nus-talqimah-al-yarmouk": `اليرموك فيها **نص تلقيمة** بالكتالوج. البطاقة هنا إذا تبي دبوس الخريطة من قائمة هالحي. أماكن اليرموك الثانية على wain.lol تحت.`,
};

const CAFE_OPENERS_AR = [
  (name: string, district: string) =>
    `**${name}** موجودة بقائمة wain.lol لحي ${district} بالرياض.`,
  (name: string, district: string) =>
    `إذا تدور **${name}** بـ${district}، هذي البطاقة اللي عندنا على wain.lol.`,
  (name: string, district: string) =>
    `هذي صفحة **${name}** على wain.lol — من أماكن ${district} بقائمة الرياض.`,
  (name: string, district: string) =>
    `${district} فيها **${name}** بالكتالوج. البطاقة هنا إذا تبي دبوس الخريطة.`,
] as const;

function variantIndex(id: string, modulo: number): number {
  let n = 0;
  for (const ch of id) n = (n + ch.charCodeAt(0)) % modulo;
  return n;
}

function cafeLink(id: string, name: string): string {
  return `[${name}](${cardPath(id, "ar")})`;
}

function districtLink(id: NeighborhoodId): string {
  const name = neighborhoodLabel(id, "ar");
  return `[${coffeeShopsInDistrict(name, "ar")}](${districtPath(id, "ar")})`;
}

function shopListMarkdown(shops: { id: string; nameAr: string; nameEn: string }[]): string {
  return shops
    .map((shop) => `- ${cafeLink(shop.id, shopDisplayName(shop, "ar"))}`)
    .join("\n");
}

function nearbyListMarkdown(district: NeighborhoodId): string {
  const listed = new Set(listDirectoryShops().map((shop) => shop.neighborhood));
  return NEARBY_DISTRICTS[district]
    .filter((id) => listed.has(id) && id !== district)
    .map((id) => `- ${districtLink(id)}`)
    .join("\n");
}

function fillCount(template: string, count: number): string {
  return template.replaceAll("{count}", countWordAr(count));
}

function defaultDistrictCopy(district: NeighborhoodId): DistrictLead {
  const name = neighborhoodLabel(district, "ar");
  return {
    lead: `${name} من أحياء الرياض على wain.lol. هذي الصفحة أماكن ${name} اللي ضفناها للكتالوج للحين.`,
    hereIntro: `فيه **{count}** قهاوي من ${name} بالقائمة الحين:`,
    hereOutro: `افتح البطاقة إذا واحدة تمشي، بعدين **ودّني هناك** للدبوس والساعات على قوقل ماب.`,
    about: `wain.lol دليل قهوة صغير في الرياض. اطلب ثلاث اقتراحات، أو تفرّج على قائمة حي. [عن وين](/about).

الرياض بس للحين. ناقصك مكان تحبه؟ ارمي رابط قوقل ماب من الموقع.`,
  };
}

export function lockedDistrictCopyAr(
  district: NeighborhoodId,
): (typeof GOLD_DISTRICT_AR)[keyof typeof GOLD_DISTRICT_AR] | null {
  if (district === "kafd") return GOLD_MASTER_KAFD_AR;
  if (district === "al-wurud") return GOLD_MASTER_AL_WURUD_AR;
  return null;
}

export function districtArTitle(district: NeighborhoodId): string {
  const locked = lockedDistrictCopyAr(district);
  if (locked) return locked.title;
  return `${coffeeShopsInDistrict(neighborhoodLabel(district, "ar"), "ar")} · ${PRODUCT_NAME}`;
}

export function districtArMeta(district: NeighborhoodId): string {
  const locked = lockedDistrictCopyAr(district);
  if (locked) return locked.meta;
  const custom = DISTRICT_COPY_AR[district];
  if (custom?.meta) return custom.meta;
  const name = neighborhoodLabel(district, "ar");
  const count = shopsInDistrict(district).length;
  const word = countWordAr(count);
  if (count === 1) {
    return `قهوة وحدة بـ${name} على wain.lol — قائمة حي بالرياض، مع رابط قوقل ماب.`;
  }
  return `${word} قهاوي بـ${name} على wain.lol — قائمة حي بالرياض، مع روابط قوقل ماب.`;
}

export function districtArMarkdown(district: NeighborhoodId): string {
  const locked = lockedDistrictCopyAr(district);
  if (locked) return locked.markdown;

  const name = neighborhoodLabel(district, "ar");
  const shops = shopsInDistrict(district);
  const count = shops.length;
  const copy = DISTRICT_COPY_AR[district] ?? defaultDistrictCopy(district);
  const hereDefault =
    count === 1
      ? `فيه قهوة **${countWordAr(count)}** من ${name} بالقائمة الحين:`
      : `فيه **${countWordAr(count)}** قهاوي من ${name} بالقائمة الحين:`;
  const hereIntro = fillCount(copy.hereIntro ?? hereDefault, count);
  const hereOutro =
    copy.hereOutro ??
    `افتح البطاقة إذا واحدة تمشي، بعدين **ودّني هناك** للدبوس والساعات على قوقل ماب.`;
  const nearbyIntro = copy.nearbyIntro ?? "";
  const nearby = nearbyListMarkdown(district);

  return `# ${coffeeShopsInDistrict(name, "ar")}

${copy.lead}

## وش فيه

${hereIntro}

${shopListMarkdown(shops)}

${hereOutro}

## أحياء ثانية قريبة

${nearbyIntro ? `${nearbyIntro}\n\n` : ""}${nearby}

## عن وين

${copy.about}`;
}

export function cafeArTitle(
  shop: Pick<Shop, "id" | "nameAr" | "nameEn" | "neighborhood" | "neighborhoodAr">,
): string {
  if (shop.id === GATE_CAFE_ID) return GOLD_MASTER_GATE_AR.title;
  return `${shopDisplayName(shop, "ar")} · ${shop.neighborhoodAr} · الرياض · ${PRODUCT_NAME}`;
}

export function cafeArMeta(
  shop: Pick<Shop, "id" | "nameAr" | "nameEn" | "neighborhood" | "neighborhoodAr">,
): string {
  if (shop.id === GATE_CAFE_ID) return GOLD_MASTER_GATE_AR.meta;
  const name = shopDisplayName(shop, "ar");
  return `${name} بـ${shop.neighborhoodAr} على wain.lol — افتح قوقل ماب للدبوس والساعات.`;
}

function defaultCafeBlurb(shop: Shop): string {
  const district = neighborhoodLabel(shop.neighborhood, "ar");
  const name = shopDisplayName(shop, "ar");
  const opener = CAFE_OPENERS_AR[variantIndex(shop.id, CAFE_OPENERS_AR.length)];
  const extras = [
    `القائمة خفيفة عمداً: اللي ضفناه من ${district}، مو ترتيب على مستوى المدينة.`,
    `إذا تبي تقارن بنفس الحي، الأسماء الثانية مربوطة تحت — بس اللي بالكتالوج فعلاً.`,
    `هذي من أماكن ${district} اللي ضفناها للحين.`,
    `إذا الاسم يمشي، باقي الحي تحت.`,
  ] as const;
  const extra = extras[variantIndex(shop.id, extras.length)];
  const vibe = vibeLabels(shop, "ar").filter(
    (label) => label !== "برا" && label !== "هواء",
  );
  const vibeLine =
    vibe.length > 0 && vibe[0] !== "قهوة"
      ? ` وسوم الكتالوج على البطاقة: ${vibe.join("، ")}.`
      : "";
  return `${opener(name, district)}${vibeLine} ${extra} الرياض بس للحين. إذا تبي باقي الحي، صفحة الحي مربوطة تحت.`;
}

function cafeSiblingsMarkdown(shop: Shop): string {
  const siblings = siblingShops(shop);
  const district = neighborhoodLabel(shop.neighborhood, "ar");
  if (siblings.length === 0) {
    return `صفحة الحي كاملة: ${districtLink(shop.neighborhood)}.`;
  }
  return `الباقي بنفس قائمة ${district}:

${shopListMarkdown(siblings)}

صفحة الحي كاملة: ${districtLink(shop.neighborhood)}.`;
}

export function cafeArMarkdown(shop: Shop): string {
  if (shop.id === GATE_CAFE_ID) return GOLD_MASTER_GATE_AR.markdown;
  const body = CNI_BLURBS_AR[shop.id] ?? defaultCafeBlurb(shop);
  return `${body}

${cafeSiblingsMarkdown(shop)}`;
}
