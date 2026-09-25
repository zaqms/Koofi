import type { OwnerTokenError } from "./claims-types";
import {
  browseNeighborhoodsHintForCity,
  cityLabel,
  DEFAULT_LIVE_CITY,
  directoryHintForCity,
  neighborhoodsIndexHeadingForCity,
  neighborhoodsIndexHintForCity,
} from "./cities";
import {
  EXAMPLE_BADGE,
  LOCKED_ABOUT,
  LOCKED_CONTACT,
  LOCKED_FEEDBACK,
  LOCKED_HOME_SUPPORT,
  LOCKED_OPENER,
  LOCKED_OPENER_EN,
  MEET_HALFWAY_HOME_SUB,
  VIBE_CHIPS,
} from "./product";
import type { Language } from "./types";

export {
  LOCKED_ABOUT,
  LOCKED_CONTACT,
  LOCKED_FEEDBACK,
  LOCKED_HOME_SUPPORT,
  LOCKED_OPENER,
  LOCKED_OPENER_EN,
  MEET_HALFWAY_HOME_SUB,
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
  homeSupport: LOCKED_HOME_SUPPORT,
  meetHalfwayHomeSub: MEET_HALFWAY_HOME_SUB,
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
  inCity: {
    ar: `في ${cityLabel(DEFAULT_LIVE_CITY, "ar")}`,
    en: `in ${cityLabel(DEFAULT_LIVE_CITY, "en")}`,
  },
  moreCities: {
    ar: "مدن ثانية",
    en: "More cities",
  },
  comingSoon: {
    ar: "قريبًا",
    en: "Coming soon",
  },
  changeCity: {
    ar: "غيّر المدينة",
    en: "Change city",
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
    ar: `أنا هنا للقهوة في ${cityLabel(DEFAULT_LIVE_CITY, "ar")}. ${LOCKED_OPENER}`,
    en: `We're here for coffee in ${cityLabel(DEFAULT_LIVE_CITY, "en")}. ${LOCKED_OPENER_EN}`,
  },
  nearbyNeedsLocation: {
    ar: `قريب يحتاج موقعك. ${LOCKED_OPENER}`,
    en: `Nearby needs your location. ${LOCKED_OPENER_EN}`,
  },
  meetHalfwayMe: {
    ar: "أنت وين؟",
    en: "Where are you?",
  },
  meetHalfwayOther: {
    ar: "صاحبك وين؟",
    en: "Where's your friend?",
  },
  meetHalfwayGo: {
    ar: "دور بينكم",
    en: "Find halfway",
  },
  meetHalfwayHint: {
    ar: "ارمي موقعك واعزم خويك — نلقى لكم الاثنين أنسب قهوة.",
    en: "Drop your pin and invite your friend — we’ll find the fairest spot for both of you.",
  },
  meetHalfwayTagline: {
    ar: "نلقى لكم الاثنين أنسب مكان.",
    en: "Find the fairest spot for both of you.",
  },
  meetHalfwayPinPlaceholder: {
    ar: "رابط مشاركة قوقل ماب…",
    en: "A Google Maps share link…",
  },
  meetHalfwayMyPin: {
    ar: "موقعي",
    en: "My pin",
  },
  meetHalfwayReady: {
    ar: "جاهز",
    en: "Ready",
  },
  meetHalfwayWaitingStatus: {
    ar: "ننتظر",
    en: "Waiting",
  },
  meetHalfwayChange: {
    ar: "غيّر",
    en: "Change",
  },
  meetHalfwayCopyLink: {
    ar: "انسخ الرابط",
    en: "Copy link",
  },
  meetHalfwayNoAccount: {
    ar: "ما يحتاج حساب.",
    en: "No account needed.",
  },
  meetHalfwayClose: {
    ar: "سكّر",
    en: "Close",
  },
  meetHalfwayCity: {
    ar: cityLabel(DEFAULT_LIVE_CITY, "ar"),
    en: cityLabel(DEFAULT_LIVE_CITY, "en"),
  },
  meetHalfwayMapsPin: {
    ar: "دبوس قوقل ماب",
    en: "Maps pin",
  },
  meetHalfwayFairSub: {
    ar: "مسافة عادلة، وقعدة أحلى.",
    en: "A fair distance, a better meet-up.",
  },
  meetHalfwayBestMatch: {
    ar: "الأكثر مناسبة",
    en: "Top Match",
  },
  meetHalfwayOpenMaps: {
    ar: "افتح في ماب",
    en: "Open in Maps",
  },
  meetHalfwayBadPin: {
    ar: "ما قدرت أقرأ الدبوس. حط رابط مشاركة قوقل ماب.",
    en: "Couldn't read that pin. Paste a Google Maps share link.",
  },
  meetHalfwayBadMaps: {
    ar: "رابط المشاركة ما طلع دبوس. جرّب الرابط الكامل.",
    en: "That Maps share link didn’t drop a pin. Try the full link.",
  },
  meetHalfwayLocationOff: {
    ar: "الموقع مقفل على هالجوال. حط رابط قوقل ماب تحت.",
    en: "Location is off on this phone. Paste a Google Maps link below.",
  },
  meetHalfwayThree: {
    ar: "3 قهاوي بينكم",
    en: "3 cafés between you",
  },
  meetHalfwayEmpty: {
    ar: "ما في أكثر بهالمنطقة",
    en: "That's all in this area.",
  },
  meetHalfwayInvite: {
    ar: "اعزم خويك",
    en: "Invite your friend",
  },
  meetHalfwayInviteShare: {
    ar: "بيننا — شارك موقعك مع خويك، ونلقى لكم قهوة بالنص.",
    en: "Halfway — Share your location with your friend, and we’ll find you a café in the middle.",
  },
  meetHalfwayInviteHint: {
    ar: "أرسل الرابط — صاحبك يدبس من جواله.",
    en: "Send the link — your friend drops their pin on their phone.",
  },
  meetHalfwayInviteWaiting: {
    ar: "ننتظر دبوس صاحبك. الثلاث تظهر هنا لحالها.",
    en: "Waiting for your friend’s pin — three cafes will appear here.",
  },
  meetHalfwayInviteJoined: {
    ar: "صاحبك دبّس.",
    en: "Your friend dropped their pin.",
  },
  meetHalfwayInviteGuestHint: {
    ar: "صاحبك دبّس. حط موقعك بس.",
    en: "Your friend already pinned. Drop your location only.",
  },
  meetHalfwayInviteExpired: {
    ar: "هالجولة انتهت.",
    en: "This Halfway expired.",
  },
  meetHalfwayShareResults: {
    ar: "شارك النتائج",
    en: "Share results",
  },
  meetHalfwayStartNew: {
    ar: "ابدأ بيننا جديد",
    en: "Start a new Halfway",
  },
  meetHalfwayMore: {
    ar: "غيرها",
    en: "Others",
  },
  meetHalfwayMoreTitle: {
    ar: "اعرض 3 قهاوي مختلفة",
    en: "Show 3 different cafés",
  },
  meetHalfwayMoreSub: {
    ar: "خلنا نطلع لك ترشيحات جديدة",
    en: "Get a new set of recommendations",
  },
  meetHalfwayNoMore: {
    ar: "ما في أكثر بهالمنطقة",
    en: "That's all in this area.",
  },
  meetHalfwayFeedbackTitle: {
    ar: "هل النتائج كانت مناسبة؟",
    en: "Were these results helpful?",
  },
  meetHalfwayFeedbackSub: {
    ar: "ملاحظتك تساعدنا نحسن بيننا.",
    en: "Your feedback helps us improve.",
  },
  meetHalfwayFeedbackYes: {
    ar: "نعم",
    en: "Yes",
  },
  meetHalfwayFeedbackNo: {
    ar: "مو مرّة",
    en: "Not really",
  },
  meetHalfwayFeedbackThanksYes: {
    ar: "شكراً على ملاحظتك!",
    en: "Thanks for the feedback!",
  },
  meetHalfwayFeedbackThanksNo: {
    ar: "شكراً — كذا تساعدنا نحسن بيننا.",
    en: "Thanks — this helps us improve Halfway.",
  },
  meetHalfwayFeedbackWhy: {
    ar: "وش اللي نقدر نحسّنه؟",
    en: "What could be better?",
  },
  meetHalfwayFeedbackTooFar: {
    ar: "بعيدة",
    en: "Too far",
  },
  meetHalfwayFeedbackVibe: {
    ar: "مو جوي",
    en: "Not my vibe",
  },
  meetHalfwayFeedbackMoreOptions: {
    ar: "أبي خيارات أكثر",
    en: "Need more options",
  },
  meetHalfwayFeedbackOther: {
    ar: "شي ثاني",
    en: "Something else",
  },
  meetHalfwayFeedbackTellMore: {
    ar: "قل لنا أكثر",
    en: "Tell us more",
  },
  resultsFeedbackTitle: {
    ar: "هل ناسبتك هذي النتائج؟",
    en: "Were these results helpful?",
  },
  resultsFeedbackSub: {
    ar: "رأيك يساعدنا نحسّن وين.",
    en: "Your feedback helps us improve.",
  },
  resultsFeedbackYes: {
    ar: "إيه",
    en: "Yes",
  },
  resultsFeedbackNo: {
    ar: "مو مرّة",
    en: "Not really",
  },
  resultsFeedbackWhy: {
    ar: "وش كان ناقص؟",
    en: "What could be better?",
  },
  resultsFeedbackTellMore: {
    ar: "قل لنا أكثر",
    en: "Tell us more",
  },
  resultsFeedbackDone: {
    ar: "تم",
    en: "Done",
  },
  resultsFeedbackThanks: {
    ar: "شكراً — رأيك يساعدنا نحسّن وين.",
    en: "Thanks — this helps us improve.",
  },
  resultsFeedbackTooFar: {
    ar: "بعيدة",
    en: "Too far",
  },
  resultsFeedbackVibe: {
    ar: "مو على جوّي",
    en: "Not my vibe",
  },
  resultsFeedbackNotRelevant: {
    ar: "مو اللي أدور عليه",
    en: "Not relevant",
  },
  resultsFeedbackMoreOptions: {
    ar: "أبغى خيارات أكثر",
    en: "Need more options",
  },
  resultsFeedbackOther: {
    ar: "شيء ثاني",
    en: "Something else",
  },
  resultsFeedbackNotExpected: {
    ar: "مو هذا اللي توقعت",
    en: "Not what I expected",
  },
  resultsFeedbackSearchTitle: {
    ar: "هذي النتائج تطابق اللي تدور عليه؟",
    en: "Did these results match what you were looking for?",
  },
  resultsFeedbackCafeTitle: {
    ar: "معلومات المقهى صحيحة؟",
    en: "Is this café information accurate?",
  },
  resultsFeedbackCafeNo: {
    ar: "فيه شيء غلط",
    en: "Something's wrong",
  },
  resultsFeedbackCafeWhy: {
    ar: "وش يحتاج تعديل؟",
    en: "What needs fixing?",
  },
  resultsFeedbackCafeThanks: {
    ar: "شكراً — بنراجعها.",
    en: "Thanks — we'll review it.",
  },
  resultsFeedbackCafeLocation: {
    ar: "الموقع",
    en: "Location",
  },
  resultsFeedbackCafeHours: {
    ar: "أوقات العمل",
    en: "Opening hours",
  },
  resultsFeedbackCafeSeating: {
    ar: "الجلسات",
    en: "Seating",
  },
  resultsFeedbackCafeCategory: {
    ar: "التصنيف",
    en: "Category",
  },
  resultsFeedbackCafePhotos: {
    ar: "الصور",
    en: "Photos",
  },
  resultsFeedbackZeroTitle: {
    ar: "ما لقيت اللي تبيه؟",
    en: "Couldn't find what you need?",
  },
  resultsFeedbackZeroSub: {
    ar: "كنت تدور على وش؟",
    en: "What were you looking for?",
  },
  resultsFeedbackZeroCloser: {
    ar: "قهاوي أقرب",
    en: "Closer cafés",
  },
  resultsFeedbackZeroMore: {
    ar: "خيارات أكثر",
    en: "More options",
  },
  resultsFeedbackZeroVibe: {
    ar: "جو ثاني",
    en: "Different vibe",
  },
  resultsFeedbackZeroCategory: {
    ar: "تصنيف ثاني",
    en: "Different category",
  },
  exampleBadge: EXAMPLE_BADGE,
  exampleNote: {
    ar: `محل تجريبي — مو قهوة حقيقية في ${cityLabel(DEFAULT_LIVE_CITY, "ar")}.`,
    en: `A demo shop — not a real ${cityLabel(DEFAULT_LIVE_CITY, "en")} cafe.`,
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
  detailStatus: {
    ar: "الحالة",
    en: "Status",
  },
  detailVibe: {
    ar: "التصنيف",
    en: "Vibe",
  },
  detailSeeAll: {
    ar: "عرض الكل",
    en: "See all",
  },
  detailOpenNow: {
    ar: "مفتوح الآن",
    en: "Open now",
  },
  detailClosedNow: {
    ar: "مغلق",
    en: "Closed",
  },
  detailOpensAt: {
    ar: "يفتح الساعة",
    en: "Opens at",
  },
  detailFavorite: {
    ar: "مفضلة",
    en: "Favorite",
  },
  detailPhotosGoogle: {
    ar: "صور · Google",
    en: "Photos · Google",
  },
  detailHeroPrev: {
    ar: "الصورة السابقة",
    en: "Previous photo",
  },
  detailHeroNext: {
    ar: "الصورة التالية",
    en: "Next photo",
  },
  newThisWeek: {
    ar: "جديد هالأسبوع",
    en: "New this week",
  },
  newThisWeekHint: {
    ar: "انضافت للقائمة هالأسبوع.",
    en: "Added to the list this week.",
  },
  trendingThisWeek: {
    ar: "ترند الأسبوع",
    en: "Trending this week",
  },
  directory: {
    ar: "القائمة",
    en: "The list",
  },
  directoryHint: {
    ar: directoryHintForCity("ar"),
    en: directoryHintForCity("en"),
  },
  allDistricts: {
    ar: "كل الأحياء",
    en: "All areas",
  },
  browseNeighborhoods: {
    ar: "تصفح حسب الحي",
    en: "Browse by Neighborhood",
  },
  browseNeighborhoodsHint: {
    ar: browseNeighborhoodsHintForCity("ar"),
    en: browseNeighborhoodsHintForCity("en"),
  },
  viewAllNeighborhoods: {
    ar: "عرض الكل",
    en: "View all",
  },
  neighborhoodsIndex: {
    ar: neighborhoodsIndexHeadingForCity("ar"),
    en: neighborhoodsIndexHeadingForCity("en"),
  },
  neighborhoodsIndexHint: {
    ar: neighborhoodsIndexHintForCity("ar"),
    en: neighborhoodsIndexHintForCity("en"),
  },
  neighborhoodsSearch: {
    ar: "ابحث عن الأحياء...",
    en: "Search neighborhoods...",
  },
  neighborhoodsSortNearby: {
    ar: "الأقرب إليك",
    en: "Nearby",
  },
  neighborhoodsSortPopular: {
    ar: "الأكثر شيوعاً",
    en: "Popular",
  },
  neighborhoodsSortAz: {
    ar: "أ–ي",
    en: "A–Z",
  },
  directorySortNew: {
    ar: "الأحدث",
    en: "New",
  },
  directorySortLabel: {
    ar: "ترتيب القائمة",
    en: "Sort results",
  },
  directorySortNearbyHint: {
    ar: "الأقرب يحتاج موقعك.",
    en: "Nearby needs your location.",
  },
  directoryDistanceUnavailable: {
    ar: "موقع غير متاح",
    en: "Location unavailable",
  },
  neighborhoodsEmpty: {
    ar: "ما فيه حي بهالاسم.",
    en: "No neighborhoods match.",
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
  contactUs: LOCKED_CONTACT,
  sharePack: {
    ar: "شارك",
    en: "Share",
  },
  listingMap: {
    ar: "الخريطة",
    en: "Map",
  },
  listingShare: {
    ar: "مشاركة",
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
  /** Public /c/[id] detail Maps CTA. Other surfaces keep takeMeThere. */
  detailTakeMeThere: {
    ar: "خذني له",
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
  ownerEditTitle: {
    ar: "عدّل الباسبور",
    en: "Edit Passport",
  },
  ownerEditLead: {
    ar: "هذي الخانات لك. الاسم والحي والدبوس ثابتة.",
    en: "These fields are yours. Name, district, and the pin stay locked.",
  },
  ownerEditLocked: {
    ar: "ثابت — وين يمسكه",
    en: "Locked — wain.lol keeps this",
  },
  ownerEditPhotosHint: {
    ar: "أضف روابط، أو ارفع من الجوال. كلها تظهر في كاروسيل الباسبور.",
    en: "Add URLs, or upload from your phone. They all show in the Passport carousel.",
  },
  ownerEditAddUrl: {
    ar: "أضف رابط",
    en: "Add another URL",
  },
  ownerEditUpload: {
    ar: "ارفع من الجوال",
    en: "Upload from phone",
  },
  ownerEditUploading: {
    ar: "يرفع…",
    en: "Uploading…",
  },
  ownerEditNoBlob: {
    ar: "الرفع بعد ما يتضبط على السيرفر. تقدر تحط روابط.",
    en: "Upload is not connected yet. You can still add photo URLs.",
  },
  ownerEditBadPhoto: {
    ar: "حط صور JPG أو PNG أو WebP، مو أكبر من ١٠ ميجا.",
    en: "Use JPG, PNG, or WebP photos under 10 MB.",
  },
  ownerEditPhotosFull: {
    ar: "ما نزيد أكثر من ١٢ صورة.",
    en: "Up to 12 photos.",
  },
  ownerEditHours: {
    ar: "الدوام",
    en: "Hours",
  },
  ownerEditHoursHint: {
    ar: "اختياري. ما نخترع دوام.",
    en: "Optional. We will not invent hours.",
  },
  ownerEditHoursPlaceholder: {
    ar: "مثال: فاتح الحين — لين ٢٣:٠٠",
    en: "Example: Open now — till 23:00",
  },
  ownerEditOffer: {
    ar: "عرض خفيف",
    en: "Thin offer",
  },
  ownerEditPhone: {
    ar: "جوال (اختياري)",
    en: "Phone (optional)",
  },
  ownerEditIg: {
    ar: "إنستغرام (اختياري)",
    en: "Instagram (optional)",
  },
  ownerEditBrewingTitle: {
    ar: "يصبّون الحين",
    en: "Now pouring",
  },
  ownerEditBrewingDetail: {
    ar: "التفاصيل",
    en: "Detail",
  },
  ownerEditBrewingNotes: {
    ar: "نكهات",
    en: "Notes",
  },
  ownerEditBrewingNote: {
    ar: "ملاحظة المالك",
    en: "Owner note",
  },
  ownerEditBrewingExtra: {
    ar: "حبوب ثانية",
    en: "More beans",
  },
  ownerEditAdd: {
    ar: "أضف",
    en: "Add",
  },
  ownerEditRemove: {
    ar: "احذف",
    en: "Remove",
  },
  ownerEditSave: {
    ar: "احفظ",
    en: "Save",
  },
  ownerEditSaved: {
    ar: "انحفظ.",
    en: "Saved.",
  },
  ownerEditUploadDone: {
    ar: "انرفع",
    en: "Uploaded",
  },
  ownerEditUploadFailed: {
    ar: "فشل الرفع",
    en: "Upload failed",
  },
  ownerEditBlobAccess: {
    ar: "مخزن الصور خاص. نعرض صور الكرت من رابط عام بدون كوكيز.",
    en: "The photo store is private. Card photos are served from a public page URL — no signed cookies.",
  },
  ownerEditBlobError: {
    ar: "السيرفر ما قدر يحفظ الصورة. جرّب صورة ثانية أو حط رابط.",
    en: "The server could not store that photo. Try another image or add a URL.",
  },
  ownerEditViewCard: {
    ar: "شوف الكرت",
    en: "View card",
  },
  ownerEditPin: {
    ar: "الدبوس",
    en: "Maps pin",
  },
  ownerEditDenied: {
    ar: "هالرابط ما يشتغل.",
    en: "This link does not work.",
  },
  ownerEditMissing: {
    ar: "الرابط ناقص. اطلب رابط جديد.",
    en: "This link is missing. Ask for a new one.",
  },
  ownerEditInvalid: {
    ar: "هالرابط غلط أو ملغي. اطلب واحد جديد.",
    en: "This link is wrong or revoked. Ask for a new one.",
  },
  ownerEditExpired: {
    ar: "هالرابط انتهى. اطلب واحد جديد.",
    en: "This link has expired. Ask for a new one.",
  },
  ownerEditWrongShop: {
    ar: "هالرابط مو لهالمقهى.",
    en: "This link is not for this cafe.",
  },
  ownerEditNotVerified: {
    ar: "هالمقهى بعد ما تحقق. التعديل مقفل.",
    en: "This cafe is not verified yet. Editing is closed.",
  },
  tonightCard: {
    ar: "بطاقة الليلة",
    en: "Tonight’s card",
  },
  tonightEyebrow: {
    ar: "الليلة",
    en: "tonight",
  },
  tonightHint: {
    ar: "سطر واحد، إذا تبي",
    en: "One line, if you want",
  },
  tonightPlaceholder: {
    ar: "جو الليلة؟",
    en: "tonight’s vibe?",
  },
  tonightMint: {
    ar: "سوّ البطاقة",
    en: "Make the card",
  },
  tonightReady: {
    ar: "بطاقتك جاهزة",
    en: "Card’s ready",
  },
  tonightEphemeral: {
    ar: "هالليلة بس",
    en: "just tonight",
  },
  tonightRateLimited: {
    ar: "مهلك. جرّب بعد شوي.",
    en: "Easy — try again in a bit.",
  },
  tonightShareSystem: {
    ar: "شارك",
    en: "Share",
  },
  tonightShareX: {
    ar: "X",
    en: "X",
  },
  tonightShareIg: {
    ar: "ستوريز",
    en: "Stories",
  },
  tonightShareSnap: {
    ar: "سناب",
    en: "Snap",
  },
  tonightDownload: {
    ar: "نزّل الصورة",
    en: "Download image",
  },
  tonightCopyLink: {
    ar: "انسخ الرابط",
    en: "Copy link",
  },
  tonightClose: {
    ar: "سكّر",
    en: "Close",
  },
  inviteCta: {
    ar: "وين؟",
    en: "wain?",
  },
  inviteTitle: {
    ar: "وين؟",
    en: "wain?",
  },
  inviteHint: {
    ar: "أرسلها للي تبيه معك",
    en: "Send it to whoever should come",
  },
  tonightShareBoth: {
    ar: "الصورة والنص مع بعض",
    en: "Image and text together",
  },
  tonightShareCopy: {
    ar: "النص",
    en: "The copy",
  },
  tonightFallback: {
    ar: "نزّلنا الصورة ونسخنا النص — حطّهم مع بعض",
    en: "Image saved and text copied — post them together",
  },
} as const;

export function ownerEditErrorCopy(
  error: OwnerTokenError,
  language: Language,
): string {
  if (error === "missing") return copy.ownerEditMissing[language];
  if (error === "expired") return copy.ownerEditExpired[language];
  if (error === "wrong_shop") return copy.ownerEditWrongShop[language];
  if (error === "not_verified") return copy.ownerEditNotVerified[language];
  if (error === "no_storage") return copy.ownerNoStorage[language];
  return copy.ownerEditInvalid[language];
}

export function ownerEditUploadProgressCopy(
  done: number,
  total: number,
  language: Language,
): string {
  return language === "ar"
    ? `يرفع ${done} من ${total}`
    : `Uploading ${done} of ${total}`;
}

export function ownerEditSavedCountCopy(
  count: number,
  language: Language,
): string {
  if (count <= 0) return copy.ownerEditSaved[language];
  return language === "ar"
    ? `انحفظ · ${count} صور`
    : `Saved · ${count} photos`;
}

export function ownerPhotoErrorCopy(error: string, language: Language): string {
  if (error === "no_blob") return copy.ownerEditNoBlob[language];
  if (error === "bad_photo") return copy.ownerEditBadPhoto[language];
  if (error === "photos_full") return copy.ownerEditPhotosFull[language];
  if (error === "blob_access") return copy.ownerEditBlobAccess[language];
  if (error === "blob_error") return copy.ownerEditBlobError[language];
  if (error === "rate_limited") return copy.feedbackRateLimited[language];
  return ownerEditErrorCopy(
    error as OwnerTokenError,
    language,
  );
}
