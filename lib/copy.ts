import {
  EXAMPLE_BADGE,
  LOCKED_ABOUT,
  LOCKED_CONTACT,
  LOCKED_FEEDBACK,
  LOCKED_OPENER,
  LOCKED_OPENER_EN,
  VIBE_CHIPS,
} from "./product";
import type { Language } from "./types";

export {
  LOCKED_ABOUT,
  LOCKED_CONTACT,
  LOCKED_FEEDBACK,
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
    ar: "قهوة نحبها في الرياض.",
    en: "Cafes we like in Riyadh.",
  },
  allDistricts: {
    ar: "كل الأحياء",
    en: "All areas",
  },
  districtMissing: {
    ar: "هالحي مو موجود",
    en: "This area isn’t on the list",
  },
  districtMissingHint: {
    ar: "يمكن الرابط غلط، أو الحي بعد ما انضاف للقائمة.",
    en: "The link may be wrong, or this neighborhood isn’t on the list yet.",
  },
  backToChat: {
    ar: "ارجع للشات",
    en: "Back to chat",
  },
  passportBack: {
    ar: "رجوع للشات",
    en: "Back to chat",
  },
  cardNo: {
    ar: "CARD N°",
    en: "CARD N°",
  },
  reviewsTab: {
    ar: "تقييمات",
    en: "Reviews",
  },
  reviewsEmpty: {
    ar: "ما فيه تقييمات على wain.lol للحين.",
    en: "No reviews on wain.lol yet.",
  },
  googleOn: {
    ar: "في Google",
    en: "on Google",
  },
  photosEmpty: {
    ar: "ما فيه صور من المالك للحين.",
    en: "No owner photos yet.",
  },
  brewingEmpty: {
    ar: "ما حدّثوا وش يصبّون للحين.",
    en: "Nothing pouring listed yet.",
  },
  quietWood: {
    ar: "خشب هادي",
    en: "Quiet wood",
  },
  about: {
    ar: "عن وين",
    en: "About",
  },
  aboutLead: LOCKED_ABOUT.lead,
  aboutBody: LOCKED_ABOUT.body,
  aboutNote: LOCKED_ABOUT.note,
  contactUs: LOCKED_CONTACT,
  sharePack: {
    ar: "شارك",
    en: "Share",
  },
  packetCopied: {
    ar: "تم النسخ",
    en: "Copied",
  },
  error: {
    ar: "صار خلل بسيط. جرّب مرة ثانية.",
    en: "Something slipped. Try again.",
  },
  feedbackTitle: LOCKED_FEEDBACK.title,
  feedbackSubtitle: LOCKED_FEEDBACK.subtitle,
  feedbackPlaceholder: LOCKED_FEEDBACK.placeholder,
  feedbackAdd: LOCKED_FEEDBACK.add,
  feedbackEmpty: LOCKED_FEEDBACK.empty,
  feedbackMapFooter: LOCKED_FEEDBACK.mapFooter,
  feedbackLink: LOCKED_FEEDBACK.link,
  shopUpvote: {
    ar: "أعجبني",
    en: "Upvote",
  },
  shopUpvoteNoStorage: {
    ar: "التصويت بعد ما اشتغل على السيرفر. جرّب بعد شوي.",
    en: "Voting is not connected yet. Try again later.",
  },
  feedbackVote: {
    ar: "صوّت",
    en: "Upvote",
  },
  feedbackVoted: {
    ar: "صوّت عليها",
    en: "Voted",
  },
  feedbackTooLong: {
    ar: "قصّرها شوي — سطر واحد يكفي.",
    en: "Keep it to one short line.",
  },
  feedbackEmptyInput: {
    ar: "اكتب الفكرة أولاً.",
    en: "Write the idea first.",
  },
  feedbackRateLimited: {
    ar: "مهلك. جرّب بعد شوي.",
    en: "Easy — try again in a bit.",
  },
  feedbackNoStorage: {
    ar: "البورد بعد ما اشتغل على السيرفر. جرّب بعد شوي.",
    en: "The board is not connected yet. Try again later.",
  },
  listedOn: {
    ar: "معروض على wain.lol",
    en: "Listed on wain.lol",
  },
  ownThisCafe: {
    ar: "تملك المقهى؟",
    en: "Own this cafe?",
  },
  ownerTitle: {
    ar: "هالمقهى لك؟",
    en: "Own this cafe?",
  },
  ownerLead: {
    ar: "كمّل المطالبة على واتساب.",
    en: "Continue the claim on WhatsApp.",
  },
  ownerChatWhatsApp: {
    ar: "كلّمنا على واتساب",
    en: "Chat on WhatsApp",
  },
  ownerConfirmed: {
    ar: "هالمقهى",
    en: "This cafe",
  },
  ownerStepCafe: {
    ar: "المقهى",
    en: "The cafe",
  },
  ownerStepWhatsapp: {
    ar: "واتساب",
    en: "WhatsApp",
  },
  ownerStepProof: {
    ar: "إثبات",
    en: "Proof",
  },
  ownerSearch: {
    ar: "دور على المقهى…",
    en: "Search the list…",
  },
  ownerContinue: {
    ar: "كمّل",
    en: "Continue",
  },
  ownerPhone: {
    ar: "رقم الواتساب",
    en: "WhatsApp number",
  },
  ownerPhonePlaceholder: {
    ar: "05xxxxxxxx",
    en: "05xxxxxxxx",
  },
  ownerSendCode: {
    ar: "أرسل الرمز",
    en: "Send the code",
  },
  ownerOtp: {
    ar: "الرمز اللي وصلك",
    en: "The code you got",
  },
  ownerOtpStub: {
    ar: "واتساب بعد ما تضبط. هذي تجربة — استخدم الرمز التجريبي.",
    en: "WhatsApp is not configured. Stub mode — use the preview code.",
  },
  ownerStubCodeHint: {
    ar: "الرمز التجريبي: 000000",
    en: "Preview code: 000000",
  },
  ownerProofCr: {
    ar: "صورة السجل التجاري",
    en: "Commercial registration photo",
  },
  ownerProofHint: {
    ar: "ارفع صورة السجل التجاري.",
    en: "Upload a commercial registration (CR) photo.",
  },
  ownerProofFile: {
    ar: "صورة السجل التجاري",
    en: "CR photo",
  },
  ownerSubmit: {
    ar: "أرسل الطلب",
    en: "Submit the claim",
  },
  ownerUnderReview: {
    ar: "طلبك تحت المراجعة. بنتحقق إن المقهى لك.",
    en: "Under review. We’ll verify your claim.",
  },
  ownerAlreadyPending: {
    ar: "هالمقهى تحت المراجعة.",
    en: "This cafe is already under review.",
  },
  ownerAlreadyVerified: {
    ar: "هالمقهى مُتحقق.",
    en: "This cafe is already verified.",
  },
  ownerBadPhone: {
    ar: "حط رقم واتساب صحيح.",
    en: "Use a valid WhatsApp number.",
  },
  ownerBadOtp: {
    ar: "الرمز غلط أو انتهى. اطلب واحد جديد.",
    en: "That code is wrong or expired. Request a new one.",
  },
  ownerNoStorage: {
    ar: "الطلب بعد ما اشتغل على السيرفر. جرّب بعد شوي.",
    en: "Claims are not connected yet. Try again later.",
  },
  ownerBadProof: {
    ar: "ارفع صورة السجل التجاري.",
    en: "Upload a CR photo.",
  },
  verified: {
    ar: "معتمد",
    en: "Verified",
  },
  takeMeThere: {
    ar: "ودّني هناك",
    en: "Take me there",
  },
  nowPouring: {
    ar: "يصبّون الحين",
    en: "Now pouring",
  },
  brewingTab: {
    ar: "وش يصبّون",
    en: "What's brewing",
  },
  photosTab: {
    ar: "صور",
    en: "Photos",
  },
  thinOffer: {
    ar: "عرض",
    en: "Offer",
  },
  instagram: {
    ar: "إنستغرام",
    en: "Instagram",
  },
  callShop: {
    ar: "اتصل",
    en: "Call",
  },
} as const;
