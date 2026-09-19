/**
 * بيننا pin-first lock (Amjad). District dropdowns are not the product.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { listDiscoveryShops, listRealShops } from "../lib/catalog";
import { rankByPopularity } from "../lib/district-rank";
import type { Shop } from "../lib/types";
import {
  extractMapsPreviewHref,
  extractMapsUrl,
  isMapsUrl,
} from "../lib/maps-url";
import {
  parseSharedPin,
  looksLikeSharedPin,
  halfwayPinMethod,
  pinFromMapsPreviewPayload,
} from "../lib/shared-pin";
import { shopMapsHref } from "../lib/public-url";
import {
  decodeHalfwayInviteId,
  encodeHalfwayInviteId,
  guestPinFromLocations,
  halfwayInviteHasGuest,
  halfwayInviteSharePath,
  halfwayInviteShareText,
  halfwayResultsShareText,
  inspectHalfwayInviteId,
  parseHalfwayInviteToken,
  HALFWAY_INVITE_TTL_MS,
  HALFWAY_RESULTS_TTL_MS,
} from "../lib/halfway-invite";
import { mergeHalfwayInviteSessionForTest } from "../lib/halfway-invite-store";
import { parseHalfwayWaiting } from "../lib/halfway-waiting";
import {
  estimateDriveMinutes,
  formatHalfwayLocationLine,
  formatHalfwayPlaceLabel,
  formatHalfwayShopMeta,
  nearestNeighborhoodFromPin,
} from "../lib/halfway-place";
import {
  halfwayPinIsReady,
  halfwayPinSurface,
} from "../lib/halfway-pin-ui";
import {
  foldHalfwayPlaceAndScoutAttrs,
  foldHalfwayPlaceAttrs,
  shopWithHalfwayPlaceAttrs,
} from "../lib/fold-halfway-place-attrs";
import {
  filterHalfwayEligible,
  HALFWAY_DENY_SHOP_IDS,
  isHalfwayDenied,
  isHalfwayEligible,
} from "../lib/halfway-eligibility";
import {
  meetHalfwayAskLabel,
  meetHalfwayReply,
  parseHalfwayPinInputs,
  pickHalfwayShops,
  halfwayCandidatePool,
  halfwayPinFailCopy,
  halfwayResultsFooterKind,
  locationsCentroid,
  meetHalfwayChatPicks,
  restoreHalfwayPicks,
} from "../lib/meet-halfway";
import { neighborhoodCentroid } from "../lib/neighborhood-tight";
import {
  MEET_HALFWAY_CHIP,
  VIBE_CHIPS,
  halfwayInviteLocaleHref,
  halfwayInvitePath,
  halfwayPath,
} from "../lib/product";
import {
  HALFWAY_RESULT_PIN_LABELS,
  halfwayResultCafesFromPicks,
  halfwayResultPins,
  pinsMidpoint,
} from "../lib/halfway-results-payload";
import {
  HALFWAY_RESULTS_NOTIFY_EMAIL,
  HALFWAY_RESULTS_WEBHOOK_URL,
  halfwayResultsWebhookBody,
  notifyHalfwayResults,
} from "../lib/halfway-results-webhook";
import {
  meetHalfwayFeedbackParams,
  meetHalfwayResultsParams,
} from "../lib/track";
import { decideVisitorLocationPeek } from "../lib/visitor-location-peek";

const SHOPS = listRealShops();
const repoRoot = join(fileURLToPath(new URL(".", import.meta.url)), "..");

function fail(msg: string): never {
  throw new Error(msg);
}

function assert(cond: unknown, msg: string): void {
  if (!cond) fail(msg);
}

const product = readFileSync(join(repoRoot, "lib/product.ts"), "utf8");
assert(
  product.includes("MEET_HALFWAY_CHIP") &&
    product.includes('id: "meet-halfway"') &&
    product.includes("بيننا"),
  "chip بيننا stays in product.ts",
);
assert(MEET_HALFWAY_CHIP.en === "Halfway", "EN twin is Halfway");
assert(halfwayPath("ar") === "/halfway", "shareable بيننا path is /halfway");
assert(halfwayPath("en") === "/en/halfway", "EN بيننا path is /en/halfway");
assert(
  halfwayPath("ar") !== halfwayInvitePath("halfway"),
  "/halfway does not collide with /h/{id}",
);
assert(
  existsSync(join(repoRoot, "app/halfway/page.tsx")) &&
    existsSync(join(repoRoot, "app/en/halfway/page.tsx")),
  "direct /halfway and /en/halfway pages exist",
);
assert(VIBE_CHIPS.length === 13, "Soft Places stay parked — VIBE_CHIPS stays 13");
const vibeChipIds: readonly string[] = VIBE_CHIPS.map((chip) => chip.id);
assert(
  !vibeChipIds.includes("meet-halfway"),
  "بيننا is not a Soft Places vibe chip",
);

const picker = readFileSync(join(repoRoot, "lib/picker.ts"), "utf8");
assert(
  picker.includes("isMeetHalfwayChipAsk"),
  "typed بيننا ask is not a random vibe pack",
);

const copy = readFileSync(join(repoRoot, "lib/copy.ts"), "utf8");
assert(
  copy.includes("meetHalfwayThree") &&
    copy.includes("3 قهاوي بينكم") &&
    copy.includes("3 cafés between you") &&
    copy.includes("مسافة عادلة، وقعدة أحلى.") &&
    copy.includes("A fair distance, a better meet-up.") &&
    copy.includes("الأكثر مناسبة") &&
    copy.includes("Top Match") &&
    copy.includes("اعرض 3 قهاوي مختلفة") &&
    copy.includes("Show 3 different cafés") &&
    copy.includes("هل النتائج كانت مناسبة؟") &&
    copy.includes("Were these results helpful?") &&
    copy.includes("مو مرّة") &&
    copy.includes("Not really") &&
    !copy.includes("meetHalfwaySave") &&
    !copy.includes("meetHalfwaySaved") &&
    copy.includes("أنت وين؟") &&
    copy.includes("موقعي") &&
    copy.includes("اعزم خويك") &&
    copy.includes("بيننا — شارك موقعك مع خويك، ونلقى لكم قهوة بالنص.") &&
    copy.includes(
      "Halfway — Share your location with your friend, and we’ll find you a café in the middle.",
    ) &&
    !copy.includes("بيننا — اعزم خويك. أنا هنا. وين أنت؟") &&
    !copy.includes("Halfway — I'm here. Where are you?") &&
    copy.includes("غيرها") &&
    copy.includes("ما في أكثر بهالمنطقة") &&
    copy.includes("صاحبك دبّس.") &&
    copy.includes("Your friend dropped their pin.") &&
    copy.includes("Waiting for your friend’s pin — three cafes will appear here.") &&
    copy.includes("meetHalfwayBadMaps") &&
    copy.includes("meetHalfwayLocationOff") &&
    copy.includes("That Maps share link didn’t drop a pin") &&
    copy.includes("Location is off on this phone") &&
    copy.includes("رابط المشاركة ما طلع دبوس") &&
    copy.includes("الموقع مقفل على هالجوال") &&
    copy.includes("نلقى لكم الاثنين أنسب مكان.") &&
    copy.includes("Find the fairest spot for both of you.") &&
    copy.includes("انسخ الرابط") &&
    copy.includes("ما يحتاج حساب.") &&
    copy.includes("هالجولة انتهت.") &&
    copy.includes("This Halfway expired.") &&
    copy.includes("شارك النتائج") &&
    copy.includes("Share results") &&
    copy.includes("ابدأ بيننا جديد") &&
    copy.includes("Start a new Halfway") &&
    !copy.includes("هالرابط انتهى. اطلب رابط جديد.") &&
    !copy.includes("Ask for a new invite.") &&
    !copy.includes("Save for later") &&
    !copy.includes("ثلاث قهاوي أنسب لكم الاثنين") &&
    !copy.includes("3 cafes fair for both of you") &&
    !copy.includes("هيتين") &&
    !copy.includes("lat,lng…") &&
    !copy.includes("إحداثيات"),
  "locked بيننا lines stay; coords stay off the UI",
);
assert(
  !copy.includes("تقدر تحدث الصفحة") && !copy.includes("You can refresh"),
  "host wait copy no longer asks for a manual refresh",
);
assert(
  copy.includes("ننتظر دبوس صاحبك. الثلاث تظهر هنا لحالها.") &&
    copy.includes("Waiting for your friend’s pin — three cafes will appear here."),
  "host wait copy is locked AR + EN (three cafes, not bare the three)",
);
assert(
  !copy.includes("The three show here on their own") &&
    !copy.includes("the three will appear here"),
  "EN wait copy does not use bare the three",
);
assert(!copy.includes("أنا في"), "district label أنا في is gone");
assert(!copy.includes("الثاني"), "district label الثاني is gone");
assert(!copy.includes("ادعُ صاحبك") && !copy.includes("ادع صاحبك"), "old invite CTA is gone");
assert(
  meetHalfwayReply({ shopCount: 0, language: "ar" }) === "ما في أكثر بهالمنطقة",
  "exhausted بيننا is exactly ما في أكثر بهالمنطقة",
);
assert(
  !meetHalfwayReply({ shopCount: 0, language: "ar" }).includes("القائمة عندي") &&
    !meetHalfwayReply({ shopCount: 0, language: "ar" }).includes("ألف أسماء") &&
    !meetHalfwayReply({ shopCount: 0, language: "en" }).includes("still small"),
  "exhausted بيننا is not the thin-catalog disclaimer",
);
assert(
  meetHalfwayReply({ shopCount: 3, language: "ar" }) === "3 قهاوي بينكم",
  "full page stays 3 قهاوي بينكم",
);
assert(
  meetHalfwayReply({ shopCount: 3, language: "en" }) === "3 cafés between you",
  "EN full page stays 3 cafés between you",
);
assert(
  halfwayResultsFooterKind({ halfwayMore: true, paged: false }) === "more",
  "leftover band shows غيرها on first page",
);
assert(
  halfwayResultsFooterKind({ halfwayMore: false, paged: false }) === null,
  "band of exactly 3 hides غيرها and does not paint empty copy",
);
assert(
  halfwayResultsFooterKind({ halfwayMore: false, paged: true }) === "exhausted",
  "empty copy only after paging the leftover to zero",
);
assert(
  halfwayResultsFooterKind({}) === null,
  "non-بيننا messages have no results footer",
);

const ui = readFileSync(join(repoRoot, "components/meet-halfway-picker.tsx"), "utf8");
assert(!ui.includes("<select"), "no district dropdowns as primary UX");
assert(ui.includes("looksLikeSharedPin"), "paste Maps URL / lat-lng");
assert(ui.includes("requestVisitorLocation"), "browser geolocation on first pin");
assert(
  ui.includes("meetHalfwayMe") &&
    ui.includes("meetHalfwayOther") &&
    ui.includes("meetHalfwayMyPin") &&
    ui.includes("meetHalfwayInvite") &&
    ui.includes("meetHalfwayLocationOff") &&
    ui.includes("meetHalfwayCopyLink") &&
    ui.includes("usePeekVisitorLocation") &&
    ui.includes("halfwayPinSurface") &&
    ui.includes("setMe({ text: \"\", pin: { lat: visitor.lat, lng: visitor.lng } })") &&
    ui.includes("MeetHalfwayHero"),
  "invite + waiting use locked pin copy; My pin deny is not silent",
);
assert(
  ui.includes("never seed from the friend's /h/ host pin") &&
    ui.includes("visitorPin") &&
    ui.includes("wantChange") &&
    !ui.includes("setMe(friendPin") &&
    !ui.includes("pinDraftFrom(friendPin"),
  "guest Ready is the visitor pin, not the friend's invite pin",
);
assert(!ui.includes("toFixed(5)"), "Ready card never paints lat,lng");
assert(!ui.includes("directoryNeighborhoods"), "picker is not a district directory");
const hero = readFileSync(
  join(repoRoot, "components/meet-halfway-hero.tsx"),
  "utf8",
);
assert(hero.includes("Pin — cup — pin"), "hero is pin–cup–pin");
assert(
  (hero.match(/CoffeeCupIcon/g) ?? []).length >= 2 &&
    (hero.match(/<CoffeeCupIcon/g) ?? []).length === 1,
  "hero has exactly one coffee cup in the middle",
);

const chips = readFileSync(join(repoRoot, "components/vibe-chips.tsx"), "utf8");
assert(
  !chips.includes("MEET_HALFWAY_CHIP") && !chips.includes("meet-halfway"),
  "بيننا is not a vibe-grid tile",
);
const halfwayCard = readFileSync(
  join(repoRoot, "components/meet-halfway-card.tsx"),
  "utf8",
);
assert(
  halfwayCard.includes("MEET_HALFWAY_CHIP") &&
    halfwayCard.includes("chipSharePath"),
  "بيننا is the P0 utility card linking to /halfway",
);

const chat = readFileSync(join(repoRoot, "app/api/chat/route.ts"), "utf8");
assert(
  chat.includes("halfway") && chat.includes("locations") && chat.includes("pickHalfwayShops"),
  "chat POST accepts locations: Location[]",
);
assert(
  chat.includes("if (halfwayRows)") &&
    chat.indexOf("if (halfwayRows)") < chat.indexOf("if (extractMapsUrl(text))") &&
    chat.includes('halfwayError: "bad_pin"') &&
    chat.includes("halfwayPinFailCopy"),
  "halfway pin body is handled before Maps add-shop",
);

const src = readFileSync(join(repoRoot, "lib/meet-halfway.ts"), "utf8");
assert(
  src.includes("rankByPopularity") && src.includes("locationsCentroid"),
  "reuse locked Most Popular + N-location centroid",
);
assert(
  src.includes("filterHalfwayEligible(input.shops") &&
    src.indexOf("filterHalfwayEligible(input.shops") < src.indexOf("withCoords"),
  "sit-down eligibility filters the pool before midpoint-distance ranking",
);
assert(!src.includes("directoryNeighborhoods"), "district directory is not the UX");

const pinA = parseSharedPin("24.761, 46.604");
const pinB = parseSharedPin("24.687, 46.685");
if (!pinA || !pinB) fail("plain lat,lng must parse");
assert(Math.abs(pinA.lat - 24.761) < 1e-6, "lat");
assert(Math.abs(pinB.lng - 46.685) < 1e-6, "lng");

const atPin = parseSharedPin("https://www.google.com/maps/@24.7136,46.6753,17z");
assert(atPin && Math.abs(atPin.lat - 24.7136) < 1e-4, "@lat,lng Maps URL");

const qPin = parseSharedPin("https://www.google.com/maps/search/?api=1&query=24.75,46.62");
assert(qPin && Math.abs(qPin.lat - 24.75) < 1e-4, "query= lat,lng");

const placePin = parseSharedPin(
  "https://www.google.com/maps/place/Foo/@24.7,46.6,17z/data=!3d24.761!4d46.604",
);
assert(
  placePin && Math.abs(placePin.lat - 24.761) < 1e-4 && Math.abs(placePin.lng - 46.604) < 1e-4,
  "place !3d!4d is the pin, not the camera @",
);
assert(looksLikeSharedPin("24.76,46.60"), "looksLikeSharedPin lat,lng");
assert(looksLikeSharedPin("https://maps.app.goo.gl/abc"), "looksLikeSharedPin short Maps");

const iosShare =
  "https://maps.app.goo.gl/WrfesXqL3DGLUx7c6?g_st=ic";
assert(isMapsUrl(iosShare), "iOS Maps share with g_st=ic is a Maps URL");
assert(extractMapsUrl(iosShare) !== null, "extractMapsUrl keeps g_st=ic shortlinks");
assert(
  extractMapsUrl(`pin: ${iosShare} thanks`)?.includes("WrfesXqL3DGLUx7c6"),
  "shortlink in text is extracted",
);
assert(
  parseSharedPin(iosShare) === null,
  "shortlink has no sync lat,lng — resolve follows redirects",
);
assert(
  looksLikeSharedPin(iosShare) && halfwayPinMethod(iosShare) === "maps_url",
  "iOS share is a maps_url pin, not typed coords",
);

const previewHref = extractMapsPreviewHref(
  `<link href="/maps/preview/place?authuser=0&amp;hl=en&amp;q=RERE3349&amp;pb=%211s0xabc%3A0xdef">`,
);
assert(
  previewHref?.startsWith("/maps/preview/place") &&
    previewHref.includes("RERE3349") &&
    !previewHref.includes("&amp;"),
  "preview href is unescaped from the Maps HTML shell",
);

const previewPin = pinFromMapsPreviewPayload(
  `)]}'\n[null,null,null,null,[[3624.8,46.7364759,24.697133]],null,[null,null,24.697133,46.736476],"0x3e2f03f0f7a50a49:0xfa4ca27cecd04d29"]`,
);
assert(
  previewPin !== null &&
    Math.abs(previewPin.lat - 24.697133) < 1e-5 &&
    Math.abs(previewPin.lng - 46.736476) < 1e-5,
  "preview JSON [null,null,lat,lng] is the shared pin",
);
assert(
  halfwayPinFailCopy("en", [{ text: iosShare }]).includes("Maps share link") &&
    halfwayPinFailCopy("en", [{ text: "not-a-pin" }]).includes("Couldn't read that pin"),
  "Maps paste and bare text get different pin-fail copy",
);
assert(
  halfwayPinFailCopy("ar", [{ text: iosShare }]).includes("رابط المشاركة") &&
    halfwayPinFailCopy("ar", [{ text: "مو دبوس" }]).includes("ما قدرت أقرأ الدبوس") &&
    !halfwayPinFailCopy("en", [{ text: "24.76,46.60" }]).includes("share link didn’t drop"),
  "lat,lng fail is not the Maps-share error",
);

const parsed = parseHalfwayPinInputs({
  locations: [{ text: "24.761, 46.604" }, { text: "24.687, 46.685" }],
});
assert(
  parsed !== null && parsed.length === 2 && parsed[0].text && parsed[1].text,
  "parse two pin strings from locations[]",
);

const two = [
  { pin: { lat: 24.761, lng: 46.604 } },
  { pin: { lat: 24.687, lng: 46.685 } },
];
const threePins = [
  { pin: { lat: 24.76, lng: 46.6 } },
  { pin: { lat: 24.69, lng: 46.68 } },
  { pin: { lat: 24.8, lng: 46.7 } },
];
const c2 = locationsCentroid([threePins[0], threePins[1]], SHOPS);
const c3 = locationsCentroid(threePins, SHOPS);
if (!c2 || !c3) fail("centroids resolve");
assert(
  Math.abs(c3.lat - c2.lat) > 1e-6 || Math.abs(c3.lng - c2.lng) > 1e-6,
  "N=3 centroid is not hardcoded as the N=2 pair",
);

const shops = pickHalfwayShops({ locations: two, shops: SHOPS });
assert(shops.length === 3, `exactly 3 cafes, got ${shops.length}`);
assert(
  shops.every((s) => SHOPS.some((c) => c.id === s.id)),
  "live catalog only — never invent shops",
);
assert(
  shops.every(isHalfwayEligible),
  "first page is sit-down eligible only",
);
assert(
  shops.every((s) => shopMapsHref(s).startsWith("https://")),
  "Maps last click on every card",
);

const ranked = rankByPopularity(shops);
assert(
  ranked.map((s) => s.id).join() === shops.map((s) => s.id).join(),
  "order is locked Most Popular (popularityIndex)",
);

const pool = halfwayCandidatePool({ locations: two, shops: SHOPS });
assert(pool.length >= 3, "midpoint band has a candidate set");
assert(
  shops.map((s) => s.id).join() === pool.slice(0, 3).map((s) => s.id).join(),
  "first three are the top of the same band",
);
const nextThree = pickHalfwayShops({
  locations: two,
  shops: SHOPS,
  beenIds: shops.map((s) => s.id),
});
assert(
  nextThree.every((s) => !shops.some((shown) => shown.id === s.id)),
  "غيرها skips cafes already shown",
);
assert(
  nextThree.map((s) => s.id).join() ===
    pool
      .filter((s) => !shops.some((shown) => shown.id === s.id))
      .slice(0, 3)
      .map((s) => s.id)
      .join(),
  "next three stay on the same Most Popular band",
);
const exhausted = pickHalfwayShops({
  locations: two,
  shops: SHOPS,
  beenIds: pool.map((s) => s.id),
});
assert(exhausted.length === 0, "exhausted band returns nothing");

const samePin = pickHalfwayShops({
  locations: [
    { pin: { lat: 24.7136, lng: 46.6753 } },
    { pin: { lat: 24.7136, lng: 46.6753 } },
  ],
  shops: SHOPS,
});
assert(samePin.length <= 3, "same pin twice still ≤3");
assert(samePin.every((s) => SHOPS.some((c) => c.id === s.id)), "same pin still catalog");
assert(samePin.every(isHalfwayEligible), "same pin still sit-down only");

function fixtureShop(partial: Partial<Shop> & Pick<Shop, "id">): Shop {
  return {
    nameAr: partial.id,
    nameEn: partial.id.replace(/-/g, ""),
    city: "riyadh",
    neighborhood: "olaya",
    neighborhoodAr: "العليا",
    vibeTags: ["قهوة"],
    momentTags: ["qahwa"],
    mapsShareUrl:
      "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f0385060a46a1:0x8aa4df79417558b1",
    example: false,
    dineIn: true,
    outdoorSeating: true,
    ...partial,
  };
}

assert(
  isHalfwayEligible(
    fixtureShop({ id: "sit-down", dineIn: true, outdoorSeating: null }),
  ) &&
    isHalfwayEligible(
      fixtureShop({ id: "patio-only", dineIn: false, outdoorSeating: true }),
    ),
  "dineIn or outdoorSeating true is sit-down",
);
assert(
  !isHalfwayEligible(
    fixtureShop({ id: "unsure", dineIn: null, outdoorSeating: null }),
  ) &&
    !isHalfwayEligible(
      fixtureShop({
        id: "missing-attrs",
        dineIn: undefined,
        outdoorSeating: undefined,
      }),
    ) &&
    !isHalfwayEligible(
      fixtureShop({ id: "takeout-only", dineIn: false, outdoorSeating: false }),
    ),
  "null / missing / no-sit-down attrs fail closed",
);
assert(
  !isHalfwayEligible(
    fixtureShop({
      id: "dt-but-dine-in",
      dineIn: true,
      outdoorSeating: true,
      momentTags: ["drive-through", "qahwa"],
    }),
  ) &&
    !isHalfwayEligible(
      fixtureShop({
        id: "dt-lane",
        dineIn: true,
        catalogLane: "drive-through",
        momentTags: ["qahwa"],
      }),
    ),
  "drive-through tagged or DT-lane is always excluded, even if dineIn true",
);
assert(
  HALFWAY_DENY_SHOP_IDS.includes("kapu-cafe-al-nahdah") &&
    HALFWAY_DENY_SHOP_IDS.includes("shafel-roastery-al-nahdah") &&
    !isHalfwayEligible(
      fixtureShop({
        id: "shafel-roastery-al-nahdah",
        dineIn: true,
        outdoorSeating: false,
        pickupOnly: false,
        baynanaEligible: true,
      }),
    ) &&
    !isHalfwayEligible(
      fixtureShop({
        id: "kapu-cafe-al-nahdah",
        dineIn: true,
        outdoorSeating: true,
        pickupOnly: true,
      }),
    ) &&
    !isHalfwayEligible(
      fixtureShop({
        id: "pickup-flag",
        dineIn: true,
        outdoorSeating: true,
        pickupOnly: true,
      }),
    ),
  "Amjad: Shafel + Kapu Nahdah stay out of بيننا even if Scout sit-down",
);

const midway = { lat: 24.72, lng: 46.64 };
const closeIneligible = fixtureShop({
  id: "close-drive-through",
  dineIn: true,
  outdoorSeating: true,
  momentTags: ["drive-through"],
  pin: midway,
  popularityIndex: 99,
});
const farEligible = [
  fixtureShop({
    id: "far-a",
    pin: { lat: 24.73, lng: 46.65 },
    popularityIndex: 80,
  }),
  fixtureShop({
    id: "far-b",
    pin: { lat: 24.71, lng: 46.63 },
    popularityIndex: 70,
  }),
  fixtureShop({
    id: "far-c",
    pin: { lat: 24.725, lng: 46.655 },
    popularityIndex: 60,
  }),
];
const rankedFromMixed = pickHalfwayShops({
  locations: [
    { pin: { lat: 24.721, lng: 46.641 } },
    { pin: { lat: 24.719, lng: 46.639 } },
  ],
  shops: [closeIneligible, ...farEligible],
});
assert(
  rankedFromMixed.every((s) => s.id !== "close-drive-through") &&
    rankedFromMixed.map((s) => s.id).join() === "far-a,far-b,far-c",
  "closer drive-through is dropped before midpoint ranking",
);

const leftoverPool = pickHalfwayShops({
  locations: [
    { pin: { lat: 24.721, lng: 46.641 } },
    { pin: { lat: 24.719, lng: 46.639 } },
  ],
  shops: [
    closeIneligible,
    fixtureShop({
      id: "only-two-a",
      pin: { lat: 24.73, lng: 46.65 },
      popularityIndex: 50,
    }),
    fixtureShop({
      id: "only-two-b",
      pin: { lat: 24.71, lng: 46.63 },
      popularityIndex: 40,
    }),
    fixtureShop({
      id: "unsure-nearby",
      dineIn: null,
      outdoorSeating: null,
      pin: midway,
      popularityIndex: 90,
    }),
  ],
});
assert(
  leftoverPool.map((s) => s.id).join() === "only-two-a,only-two-b",
  "thinner than 3 returns leftover sit-down shops — does not refill with ineligible",
);
assert(
  meetHalfwayReply({ shopCount: leftoverPool.length, language: "en" }) ===
    "This is what I can suggest right now:",
  "leftover <3 uses fewer-picks copy, not a fill",
);

const livePool = halfwayCandidatePool({ locations: two });
assert(
  livePool.every(isHalfwayEligible),
  "production بيننا pool is sit-down only",
);
assert(
  !livePool.some((s) => isHalfwayDenied(s.id)),
  "deny-list shops never enter the live pool",
);
assert(
  !livePool.some((s) => s.momentTags.includes("drive-through") || s.catalogLane === "drive-through"),
  "drive-through tagged shops never enter the live pool",
);
assert(
  livePool.length >= 3,
  "Olaya midpoint still has at least 3 sit-down cafés",
);
assert(
  filterHalfwayEligible(listDiscoveryShops()).length ===
    listDiscoveryShops().filter(isHalfwayEligible).length,
  "discovery filter is the same sit-down rule Halfway uses",
);

const folded = foldHalfwayPlaceAttrs(
  [
    fixtureShop({ id: "keep-me", dineIn: undefined, outdoorSeating: undefined }),
    fixtureShop({ id: "no-row" }),
  ],
  [
    {
      id: "keep-me",
      dine_in: true,
      outdoor_seating: null,
      place_id: "ChIJKeepMe",
    },
    { id: "invented-cafe", dine_in: true, outdoor_seating: true },
  ],
);
assert(folded.shops.length === 2, "fold never invents catalog shops");
assert(
  folded.unmatched.includes("invented-cafe") && folded.applied.length === 1,
  "backfill ids not in the catalog are ignored",
);
assert(
  folded.shops[0]?.dineIn === true &&
    folded.shops[0]?.outdoorSeating === null &&
    folded.shops[0]?.placeId === "ChIJKeepMe" &&
    folded.shops[1]?.dineIn === null &&
    folded.shops[1]?.outdoorSeating === null,
  "known attrs fold; missing rows stay null (fail-closed)",
);
assert(
  shopWithHalfwayPlaceAttrs(fixtureShop({ id: "order" }), {
    dineIn: true,
    outdoorSeating: false,
    pickupOnly: null,
    placeId: "ChIJOrder",
  }).example === false,
  "attrs sit on the shop record, example flag unchanged",
);

const scoutFold = foldHalfwayPlaceAndScoutAttrs(
  [
    fixtureShop({
      id: "places-then-scout",
      dineIn: null,
      outdoorSeating: null,
    }),
    fixtureShop({ id: "wrong-pin" }),
    fixtureShop({ id: "unclear-shop" }),
  ],
  [
    {
      id: "places-then-scout",
      dine_in: false,
      outdoor_seating: null,
      place_id: "ChIJPlacesOld",
    },
    { id: "wrong-pin", dine_in: true, place_id: "ChIJWrong" },
    { id: "unclear-shop", dine_in: true, outdoor_seating: true },
  ],
  [
    {
      id: "places-then-scout",
      dine_in: true,
      outdoor_seating: false,
      pickup_only: false,
      baynana_eligible: true,
      place_id: "ChIJPlacesOld",
    },
    {
      id: "wrong-pin",
      dine_in: true,
      outdoor_seating: true,
      pickup_only: false,
      baynana_eligible: true,
      wrong_place_match: true,
      place_id: "ChIJWrong",
      correct_place_id: "ChIJCorrect",
    },
    {
      id: "unclear-shop",
      dine_in: "unclear",
      outdoor_seating: "unclear",
      pickup_only: "unclear",
      baynana_eligible: "unclear",
    },
    { id: "invented-scout", dine_in: true, baynana_eligible: true },
  ],
);
assert(scoutFold.shops.length === 3, "Scout fold never invents catalog shops");
assert(
  scoutFold.unmatched.includes("invented-scout"),
  "Scout ids not in the catalog are ignored",
);
assert(
  scoutFold.shops[0]?.dineIn === true &&
    scoutFold.shops[0]?.pickupOnly === false &&
    scoutFold.shops[0]?.baynanaEligible === true &&
    scoutFold.shops[0]?.placeId === "ChIJPlacesOld",
  "Scout dine/pickup/baynana override Places",
);
assert(
  scoutFold.shops[1]?.placeId === "ChIJCorrect" &&
    scoutFold.shops[1]?.baynanaEligible === true,
  "wrong_place_match stores Scout correct_place_id and baynana_eligible",
);
assert(
  scoutFold.shops[2]?.dineIn === null &&
    scoutFold.shops[2]?.outdoorSeating === null &&
    scoutFold.shops[2]?.pickupOnly === null &&
    scoutFold.shops[2]?.baynanaEligible === null &&
    !isHalfwayEligible(scoutFold.shops[2]!),
  "Scout unclear attrs fail closed",
);

const kapu = SHOPS.find((shop) => shop.id === "kapu-cafe-al-nahdah");
const shafel = SHOPS.find((shop) => shop.id === "shafel-roastery-al-nahdah");
const getUp = SHOPS.find((shop) => shop.id === "get-up-coffee-ar-rabwah");
const flow = SHOPS.find((shop) => shop.id === "flow-matcha-at-taawun");
assert(
  kapu?.placeId === "ChIJHZ3CbwCrLz4R9r0bYpDJLmo" &&
    kapu.pickupOnly === true &&
    kapu.baynanaEligible === false &&
    !isHalfwayEligible(kapu),
  "Kapu Nahdah is Scout pickup-only with the corrected place id",
);
assert(
  shafel?.pickupOnly === true &&
    shafel.baynanaEligible === false &&
    !isHalfwayEligible(shafel),
  "Shafel Nahdah is Amjad deny / pickup-ineligible",
);
assert(
  getUp?.baynanaEligible === null &&
    !isHalfwayEligible(getUp!) &&
    flow?.pickupOnly === true &&
    !isHalfwayEligible(flow),
  "Get Up + FLOW Matcha stay fail-closed / pickup-only",
);

const mid = locationsCentroid(two, SHOPS);
assert(mid && Number.isFinite(mid.lat) && Number.isFinite(mid.lng), "band around pin centroid");

assert(meetHalfwayAskLabel("ar") === "بيننا · دبوسين", "ask label is two pins");
assert(meetHalfwayAskLabel("en") === "Halfway · two pins", "EN ask label");

const hittinCenter = neighborhoodCentroid("hittin", SHOPS);
assert(hittinCenter !== null, "Hittin centroid exists");
assert(
  nearestNeighborhoodFromPin(hittinCenter as { lat: number; lng: number }) ===
    "hittin",
  "Hittin pin labels as حطين, not a raw coord",
);
assert(
  formatHalfwayPlaceLabel(hittinCenter, "ar") === "حطين، الرياض" &&
    formatHalfwayPlaceLabel(hittinCenter, "en") === "Hittin, Riyadh" &&
    !formatHalfwayPlaceLabel(hittinCenter, "ar").includes("هيتين") &&
    !formatHalfwayPlaceLabel(hittinCenter, "ar").includes(","),
  "place label is حي + الرياض, never هيتين or lat,lng",
);
const malqaCenter = neighborhoodCentroid("al-malqa", SHOPS);
assert(malqaCenter !== null, "Al Malqa centroid exists");
assert(
  formatHalfwayLocationLine(hittinCenter, malqaCenter, "en") ===
    "Hittin, Riyadh · Al Malqa, Riyadh" &&
    formatHalfwayLocationLine(hittinCenter, malqaCenter, "ar") ===
      "حطين، الرياض • الملقا، الرياض" &&
    formatHalfwayLocationLine(hittinCenter, hittinCenter, "en") ===
      "Hittin, Riyadh",
  "results location line names both submitted areas",
);
assert(
  formatHalfwayShopMeta(
    "Al Rihaniyah",
    { lat: 24.75, lng: 46.62 },
    { lat: 24.75, lng: 46.62 },
    "en",
  ).includes("Al Rihaniyah") &&
    formatHalfwayShopMeta(
      "الرمانية",
      { lat: 24.75, lng: 46.62 },
      { lat: 24.8, lng: 46.7 },
      "ar",
    ).includes("كم") &&
    formatHalfwayShopMeta(
      "الرمانية",
      { lat: 24.75, lng: 46.62 },
      { lat: 24.8, lng: 46.7 },
      "ar",
    ).includes("الرمانية"),
  "result card meta is km · neighborhood",
);
assert(
  estimateDriveMinutes(
    { lat: 24.761, lng: 46.604 },
    { lat: 24.761, lng: 46.604 },
  ) === 1 &&
    estimateDriveMinutes(
      { lat: 24.761, lng: 46.604 },
      { lat: 24.687, lng: 46.685 },
    ) >= 1,
  "drive-time estimate is cheap haversine minutes, not a traffic API",
);

const inviteId = encodeHalfwayInviteId({
  locale: "ar",
  locations: [{ lat: 24.761, lng: 46.604 }],
  now: 1_700_000_000_000,
  ttlMs: 45 * 60 * 1000,
});
if (!inviteId) fail("encode one host pin");
const inviteSeed = decodeHalfwayInviteId(inviteId, 1_700_000_000_000);
if (!inviteSeed?.locations[0]) fail("decode host pin");
assert(inviteSeed.locations.length === 1, "decode one host pin");
assert(
  Math.abs(inviteSeed.locations[0].lat - 24.761) < 1e-4,
  "invite URL carries A's pin",
);
const halfwayShareQuery = "from=wa&utm_source=invite&utm_medium=share";
assert(
  halfwayInvitePath(inviteId).startsWith("/h/") &&
    halfwayInviteSharePath(inviteId).includes("from=wa") &&
    halfwayInviteSharePath(inviteId).includes("utm_source=invite") &&
    halfwayInviteSharePath(inviteId).includes("utm_medium=share"),
  "invite share is /h/{id}?from=wa plus both UTMs",
);
assert(
  halfwayInvitePath(inviteId, "en") === `/en/h/${encodeURIComponent(inviteId)}` &&
    halfwayInviteLocaleHref(inviteId, "ar") ===
      `/en/h/${encodeURIComponent(inviteId)}` &&
    halfwayInviteLocaleHref(inviteId, "en") ===
      `/h/${encodeURIComponent(inviteId)}` &&
    halfwayInviteSharePath(inviteId) ===
      `/h/${encodeURIComponent(inviteId)}?${halfwayShareQuery}`,
  "WhatsApp share stays /h/{id}; EN guests use /en/h/{id}",
);
const nakheelPin = neighborhoodCentroid("al-nakheel", SHOPS);
if (!nakheelPin) fail("al-nakheel centroid");
assert(
  halfwayPinSurface({ pin: nakheelPin }) === "ready" &&
    halfwayPinSurface({ pin: nakheelPin, wantChange: true }) === "paste" &&
    halfwayPinSurface({ text: "" }) === "paste" &&
    halfwayPinIsReady({ pin: nakheelPin }) &&
    !halfwayPinIsReady({ text: "" }),
  "Ready vs paste is pin state, not locale",
);
assert(
  formatHalfwayPlaceLabel(nakheelPin, "ar").includes("النخيل") &&
    formatHalfwayPlaceLabel(nakheelPin, "en").includes("Al Nakheel"),
  "Ready label has locked AR/EN neighborhood copy",
);
const inviteText = halfwayInviteShareText({
  language: "ar",
  url: `https://wain.lol${halfwayInviteSharePath(inviteId)}`,
});
assert(
  inviteText.startsWith("بيننا — شارك موقعك مع خويك، ونلقى لكم قهوة بالنص.") &&
    inviteText.includes("wain.lol/h/") &&
    inviteText.includes("from=wa") &&
    inviteText.includes("utm_source=invite") &&
    inviteText.includes("utm_medium=share") &&
    !inviteText.includes("اعزم خويك. أنا هنا") &&
    !inviteText.includes("maps.google") &&
    !inviteText.includes("ادعُ صاحبك") &&
    !inviteText.includes("ادع صاحبك"),
  "invite packet is Amjad’s locked بيننا share line + /h/{id}",
);
const inviteTextEn = halfwayInviteShareText({
  language: "en",
  url: `https://wain.lol${halfwayInviteSharePath(inviteId)}`,
});
assert(
  inviteTextEn.startsWith(
    "Halfway — Share your location with your friend, and we’ll find you a café in the middle.",
  ) && inviteTextEn.includes("wain.lol/h/"),
  "EN invite packet is the locked Halfway share line + /h/{id}",
);
const expired = inspectHalfwayInviteId(
  inviteId,
  1_700_000_000_000 + 45 * 60 * 1000 + 1,
);
assert(
  !expired.ok && expired.reason === "expired",
  "invite expires inside 30–60 min (45)",
);
assert(
  HALFWAY_INVITE_TTL_MS === 45 * 60 * 1000,
  "waiting TTL stays 45 minutes",
);
assert(
  HALFWAY_RESULTS_TTL_MS === 48 * 60 * 60 * 1000,
  "completed session TTL is 48 hours after results freeze",
);
const parsedPastExpiry = parseHalfwayInviteToken(inviteId);
assert(
  parsedPastExpiry.ok && parsedPastExpiry.seed.exp === 1_700_000_000_000 + HALFWAY_INVITE_TTL_MS,
  "token checksum still parses after waiting TTL so overlay can extend completed sessions",
);
const resultsShare = halfwayResultsShareText({
  language: "ar",
  url: `https://wain.lol${halfwayInviteSharePath(inviteId)}`,
});
assert(
  resultsShare.includes("3 قهاوي بينكم") &&
    resultsShare.includes("wain.lol/h/") &&
    resultsShare.includes("from=wa") &&
    resultsShare.includes("utm_source=invite") &&
    resultsShare.includes("utm_medium=share") &&
    !resultsShare.includes("/p/"),
  "Share results is the same /h/{id}, never a /p/ pack",
);
const frozenFirst = mergeHalfwayInviteSessionForTest({
  existing: null,
  locations: [
    { lat: 24.761, lng: 46.604 },
    { lat: 24.687, lng: 46.685 },
  ],
  expiresAt: 1_700_000_000_000 + HALFWAY_INVITE_TTL_MS,
  shopIds: shops.map((shop) => shop.id),
  freezeResults: true,
  now: 1_700_000_000_000,
});
if (!frozenFirst) fail("first results freeze shop_ids");
assert(
  frozenFirst.shopIds.join() === shops.map((shop) => shop.id).join() &&
    frozenFirst.expiresAt === 1_700_000_000_000 + HALFWAY_RESULTS_TTL_MS,
  "first results freeze shop_ids and extend expires_at to 48h",
);
const frozenAgain = mergeHalfwayInviteSessionForTest({
  existing: frozenFirst,
  locations: [
    { lat: 24.761, lng: 46.604 },
    { lat: 24.687, lng: 46.685 },
  ],
  expiresAt: 1,
  shopIds: ["not-the-same"],
  freezeResults: true,
  now: 1_700_000_000_000 + 60_000,
});
if (!frozenAgain) fail("second freeze keeps shop_ids");
assert(
  frozenAgain.shopIds.join() === frozenFirst.shopIds.join() &&
    frozenAgain.expiresAt === frozenFirst.expiresAt,
  "refresh must not reshuffle frozen shop_ids or rewrite results TTL",
);
const restoredPicks = restoreHalfwayPicks({
  shopIds: frozenFirst.shopIds,
  language: "ar",
});
assert(
  restoredPicks.map((pick) => pick.id).join() === frozenFirst.shopIds.join(),
  "restore paints the same three cafe ids in freeze order",
);
const threeInvite = encodeHalfwayInviteId({
  locale: "en",
  locations: [
    { lat: 24.76, lng: 46.6 },
    { lat: 24.69, lng: 46.68 },
    { lat: 24.8, lng: 46.7 },
  ],
});
const threeSeed = threeInvite ? decodeHalfwayInviteId(threeInvite) : null;
assert(threeSeed !== null && threeSeed.locations.length === 3, "invite payload is N locations, not a pair");

const hostPin = { lat: 24.761, lng: 46.604 };
const friendPin = { lat: 24.687, lng: 46.685 };
assert(
  halfwayInviteHasGuest([hostPin], [hostPin, friendPin]) &&
    !halfwayInviteHasGuest([hostPin], [hostPin]),
  "guest pin is detected only after B joins",
);
const foundGuest = guestPinFromLocations([hostPin], [hostPin, friendPin]);
assert(
  foundGuest !== null &&
    Math.abs(foundGuest.lat - friendPin.lat) < 1e-4 &&
    Math.abs(foundGuest.lng - friendPin.lng) < 1e-4,
  "guest pin is the stored row that is not A's pin",
);
const liveInviteId = encodeHalfwayInviteId({
  locale: "en",
  locations: [hostPin],
});
if (!liveInviteId) fail("encode live host wait token");
const waitingRecord = parseHalfwayWaiting(
  JSON.stringify({
    id: liveInviteId,
    locale: "en",
    me: hostPin,
  }),
);
assert(
  waitingRecord !== null &&
    waitingRecord.id === liveInviteId &&
    waitingRecord.locale === "en",
  "host wait record restores a live invite token",
);
assert(
  parseHalfwayWaiting(JSON.stringify({ id: "bad", locale: "en", me: hostPin })) ===
    null,
  "expired or bad wait records are dropped",
);

const chatUi = readFileSync(join(repoRoot, "components/chat.tsx"), "utf8");
const resultsFooter = readFileSync(
  join(repoRoot, "components/meet-halfway-results-footer.tsx"),
  "utf8",
);
assert(
  decideVisitorLocationPeek({
    snapshotStatus: "pending",
    permission: "granted",
    inflight: false,
    rememberedGranted: false,
  }) === "request" &&
    decideVisitorLocationPeek({
      snapshotStatus: "unavailable",
      permission: "granted",
      inflight: false,
      rememberedGranted: false,
    }) === "request" &&
    decideVisitorLocationPeek({
      snapshotStatus: "pending",
      permission: "prompt",
      inflight: true,
      rememberedGranted: false,
    }) === "await-inflight" &&
    decideVisitorLocationPeek({
      snapshotStatus: "pending",
      permission: "prompt",
      inflight: false,
      rememberedGranted: true,
    }) === "request" &&
    decideVisitorLocationPeek({
      snapshotStatus: "pending",
      permission: "prompt",
      inflight: false,
      rememberedGranted: false,
    }) === "idle" &&
    decideVisitorLocationPeek({
      snapshotStatus: "pending",
      permission: "denied",
      inflight: false,
      rememberedGranted: true,
    }) === "idle" &&
    decideVisitorLocationPeek({
      snapshotStatus: "ready",
      permission: "prompt",
      inflight: false,
      rememberedGranted: false,
    }) === "use-ready",
  "auto-Ready reads only when granted/remembered; prompt/denied stay on My pin",
);

const visitorLocation = readFileSync(
  join(repoRoot, "lib/visitor-location.ts"),
  "utf8",
);
const visitorPeek = readFileSync(
  join(repoRoot, "lib/visitor-location-peek.ts"),
  "utf8",
);
assert(
  visitorLocation.includes("peekReadyVisitorLocation") &&
    visitorLocation.includes("decideVisitorLocationPeek") &&
    visitorLocation.includes("usePeekVisitorLocation") &&
    visitorLocation.includes("retry: true") &&
    visitorLocation.includes("VISITOR_GEO_GRANTED_KEY") &&
    visitorPeek.includes("decideVisitorLocationPeek") &&
    !visitorLocation.includes("lat,lng") &&
    !visitorPeek.includes("lat,lng"),
  "geo peek retries a granted read and never stores coordinates",
);
assert(
  !visitorLocation.includes("/en/h") &&
    !visitorPeek.includes("/en/h") &&
    !visitorLocation.includes("language === ") &&
    !visitorPeek.includes("language === "),
  "auto-Ready peek is not gated on locale or /en/h/",
);
assert(
  !ui.includes("language === \"en\"") &&
    !ui.includes("language === 'en'") &&
    ui.includes("meetHalfwayReady") &&
    ui.includes("meetHalfwayChange") &&
    ui.includes("text-end"),
  "Ready/Change render from locked copy for both locales; RTL keeps the row",
);

assert(
  chatUi.includes("sharePackPacket") &&
    chatUi.includes("inviteHalfwayFriend") &&
    chatUi.includes("router.replace") &&
    chatUi.includes("halfwayInvitePath") &&
    chatUi.includes("halfwayResultsShareText") &&
    chatUi.includes("startNewHalfway") &&
    !chatUi.includes("Save for later"),
  "invite uses the same system share family; host replace onto /h/{id}; results share is not Save for later",
);
assert(
  (chatUi.match(/halfwayInviteShareText\(\{\s*language: landing, url: created\.url \}\)/g) ?? [])
    .length >= 2,
  "اعزم خويك share sheet and انسخ الرابط both use the locked invite packet",
);
assert(
  chatUi.includes("halfwayInvitePath(created.id, landing)") &&
    chatUi.includes("localeHref") &&
    chatUi.includes("copy.switchLanguage[landing]"),
  "host replace keeps path locale; invite can switch /h/ ↔ /en/h/",
);
assert(
  chatUi.includes("showHalfwayPinFail") &&
    chatUi.includes("halfwayPinFailCopy") &&
    chatUi.includes("setMeetHalfwayOpen(true)"),
  "اعزم خويك / pin-read fail keeps pin UI open and speaks Maps vs bare-pin copy",
);
assert(
  chatUi.includes("MeetHalfwayResultsFooter") &&
    chatUi.includes("MeetHalfwayResultCards") &&
    chatUi.includes("formatHalfwayLocationLine") &&
    chatUi.includes("reroll: true") &&
    chatUi.includes("halfwayResultsFooterKind") &&
    chatUi.includes("onShareResults") &&
    chatUi.includes("onStartNew") &&
    resultsFooter.includes("meetHalfwayMoreTitle") &&
    resultsFooter.includes("meetHalfwayMoreSub") &&
    resultsFooter.includes('surface !== "screen"') &&
    resultsFooter.includes("meetHalfwayMore") &&
    resultsFooter.includes("MeetHalfwayFeedback") &&
    resultsFooter.includes("meetHalfwayNoMore") &&
    resultsFooter.includes("meetHalfwayShareResults") &&
    resultsFooter.includes("meetHalfwayStartNew") &&
    !resultsFooter.includes("Save for later"),
  "local two-pin and /h/ guest share one بيننا results footer; Share results + Start a new Halfway",
);
assert(
  chatUi.includes('surface="screen"') &&
    chatUi.includes('surface="thread"') &&
    chatUi.includes("typeof message.halfwayMore === \"boolean\"") &&
    chatUi.includes("!showHalfwayResults") &&
    chatUi.includes("<MeetHalfwayResultCards") &&
    chatUi.includes("data-halfway-results") &&
    chatUi.includes("`halfway-local:${landing}`") &&
    chatUi.includes("`chat:${landing}:${selectedChipId ?? \"home\"}`") &&
    chatUi.includes("meetHalfwayOpen &&") &&
    chatUi.includes("!sessionExpired") &&
    chatUi.includes("const halfwaySurface =") &&
    !chatUi.includes("Boolean(halfwayPicker) && Boolean(halfwayResult"),
  "new بيننا results chrome is screen-only; home/directory keep a separate thread",
);
const homeLanding = readFileSync(
  join(repoRoot, "components/home-landing.tsx"),
  "utf8",
);
const districtPage = readFileSync(
  join(repoRoot, "components/district-page.tsx"),
  "utf8",
);
assert(
  !homeLanding.includes("MeetHalfwayResultCards") &&
    !homeLanding.includes("MeetHalfwayFeedback") &&
    !homeLanding.includes("meetHalfwayMoreTitle") &&
    !districtPage.includes("MeetHalfwayResultCards") &&
    !districtPage.includes("MeetHalfwayFeedback") &&
    !districtPage.includes("meetHalfwayMoreTitle"),
  "home + district do not mount the بيننا results chrome",
);
const homePage = readFileSync(join(repoRoot, "app/page.tsx"), "utf8");
const homePageEn = readFileSync(join(repoRoot, "app/en/page.tsx"), "utf8");
assert(
  homePage.includes("<HomeLanding language=\"ar\" />") &&
    !homePage.includes("meet-halfway") &&
    homePageEn.includes("<HomeLanding language=\"en\" />") &&
    !homePageEn.includes("meet-halfway"),
  "AR/EN home routes stay the directory landing, not بيننا results",
);
const pickList = readFileSync(join(repoRoot, "components/pick-list.tsx"), "utf8");
const resultCards = readFileSync(
  join(repoRoot, "components/meet-halfway-result-cards.tsx"),
  "utf8",
);
const feedbackUi = readFileSync(
  join(repoRoot, "components/meet-halfway-feedback.tsx"),
  "utf8",
);
assert(
  resultCards.includes("meetHalfwayBestMatch") &&
    resultCards.includes("meetHalfwayOpenMaps") &&
    resultCards.includes("formatHalfwayShopMeta") &&
    resultCards.includes("rtl:rotate-180") &&
    !resultCards.includes("meetHalfwaySave") &&
    !resultCards.includes("useSavedShopIds") &&
    !resultCards.includes("BookmarkIcon") &&
    !resultCards.includes("احفظ"),
  "بيننا result cards keep Maps, Top Match, and RTL chevron — no Save without login",
);
assert(
  feedbackUi.includes("meet_halfway_feedback") &&
    feedbackUi.includes('fire("yes")') &&
    feedbackUi.includes('fire("no")') &&
    feedbackUi.includes("fire(\"no\", next)") &&
    feedbackUi.includes("too_far") &&
    feedbackUi.includes("meetHalfwayFeedbackParams") &&
    feedbackUi.includes("meetHalfwayFeedbackTellMore") &&
    !feedbackUi.includes("dataLayer"),
  "results feedback fires meet_halfway_feedback on Yes, No, and No-reason",
);
assert(
  pickList.includes("meetHalfwayBestMatch") &&
    pickList.includes("meetHalfwayOpenMaps") &&
    pickList.includes("HalfwayDriveTimes"),
  "thread pick list still has Maps and fair-for-both extras",
);
const beenButton = readFileSync(join(repoRoot, "components/been-button.tsx"), "utf8");
assert(
  pickList.includes("after:absolute") &&
    pickList.includes("after:inset-0") &&
    pickList.includes("pick.cardPath") &&
    pickList.includes("stopPropagation") &&
    pickList.includes('className="relative z-10"') &&
    pickList.includes("relative z-10 inline-flex") &&
    beenButton.includes("stopPropagation"),
  "whole result tile opens the cafe card; Maps and Been here stay nested controls",
);
assert(
  chatUi.includes("joinHalfwayInvite") &&
    chatUi.includes("[...halfwayInvite.locations, row]") &&
    chatUi.includes("halfwayLocations") &&
    chatUi.includes("halfway: {") &&
    chatUi.includes("locations,") &&
    chatUi.includes("more: more || reroll") &&
    chatUi.includes("initialMe={halfwayGuest ? null : halfwayWaitingMe}") &&
    chatUi.includes("auto: !halfwayInvite && !meetHalfwayOpen"),
  "guest /h/ results keep locations; guest field is not the host pin; no geo prompt on open",
);
assert(
  !chatUi.includes("halfwayLocationsRef.current ?"),
  "غيرها is not gated on a remount-volatile ref",
);
assert(
  chat.includes("halfwayMore") && chat.includes("meetHalfwayReply"),
  "chat API pages the midpoint band and can exhaust it",
);
assert(
  !chat.includes("thinCatalog: shops.length < 3"),
  "بيننا never flags the generic thin-catalog disclaimer",
);
assert(
  !chat.includes("copy.thinCatalog") &&
    !chat.includes("copy.emptyCatalog") &&
    !chat.includes("copy.meetHalfwayEmpty"),
  "بيننا empty path does not use soft/SEO catalog copy",
);
assert(
  chatUi.includes('typeof message.halfwayMore !== "boolean"'),
  "chat UI never paints thinCatalog under بيننا",
);
const invitePage = readFileSync(join(repoRoot, "app/h/[id]/page.tsx"), "utf8");
const invitePageEn = readFileSync(
  join(repoRoot, "app/en/h/[id]/page.tsx"),
  "utf8",
);
const inviteSession = readFileSync(
  join(repoRoot, "components/halfway-invite-session.tsx"),
  "utf8",
);
assert(
  inviteSession.includes("halfwayInvite") &&
    inviteSession.includes('kind="halfway"') &&
    inviteSession.includes("<Chat") &&
    inviteSession.includes("resolveHalfwayInviteSession") &&
    inviteSession.includes("shopIds") &&
    inviteSession.includes("localeHref={halfwayInviteLocaleHref") &&
    inviteSession.includes("landing={language}") &&
    !inviteSession.includes("resolved.seed.locale") &&
    !inviteSession.includes("parsed.seed.locale"),
  "friend lands on /h/{id} with overlay session + frozen shop_ids",
);
assert(
  invitePage.includes('language: "ar"') &&
    invitePage.includes("HalfwayInviteSession") &&
    invitePageEn.includes('language: "en"') &&
    invitePageEn.includes("HalfwayInviteSession") &&
    existsSync(join(repoRoot, "app/en/h/[id]/page.tsx")),
  "AR /h/{id} and EN /en/h/{id} share one invite session",
);
assert(
  chatUi.includes("const showAskComposer = !meetHalfwayOpen") &&
    /showAskComposer \? \(\s*<form/.test(chatUi),
  "host + /h/ guest hide the bottom ask form while بيننا is open",
);
const askFormGate =
  chatUi.match(/showAskComposer \? \(\s*<form[\s\S]*?<\/form>/)?.[0] ?? "";
assert(
  askFormGate.includes("<form") &&
    askFormGate.includes('id="koofi-ask"') &&
    askFormGate.includes("<AddShopButton"),
  "hidden form includes the ask composer + أضف قهوة / Add a coffee shop",
);
assert(
  chatUi.includes("const halfwayPicker = meetHalfwayOpen") &&
    chatUi.includes("showHalfwaySetup") &&
    chatUi.includes("showHalfwayResults") &&
    chatUi.includes("onCopyLink") &&
    !/message\.id === "opener"[\s\S]*<MeetHalfwayPicker/.test(chatUi),
  "host + /h/ guest use first-class invite / waiting / results screens",
);
assert(
  chatUi.includes('result.data.halfwayError === "bad_pin"') &&
    chatUi.includes("setMeetHalfwayOpen(true)") &&
    !/inFlightRef\.current = true;\s*setMeetHalfwayOpen\(false\)/.test(chatUi),
  "parse fail keeps بيننا pin UI open; composer stays hidden",
);
assert(
  chatUi.includes("<AddShopButton") &&
    chatUi.includes('id="koofi-ask"') &&
    chatUi.includes("setMeetHalfwayOpen(false)") &&
    chatUi.includes("setMeetHalfwayOpen(true)"),
  "ask composer and أضف قهوة stay in Chat; they restore when بيننا closes",
);
assert(
  inviteSession.includes("<Chat") &&
    inviteSession.includes("halfwayInvite") &&
    chatUi.includes("showAskComposer") &&
    chatUi.includes('result.data.halfwayError === "bad_pin"'),
  "guest /h/ uses the same Chat composer gate as the host, including after a bad pin",
);
assert(
  !resultsFooter.includes("thinCatalog") &&
    !resultsFooter.includes("copy.thinCatalog"),
  "shared footer is not the thin-catalog disclaimer",
);
const inviteApi = readFileSync(
  join(repoRoot, "app/api/halfway/invite/route.ts"),
  "utf8",
);
assert(
  existsSync(join(repoRoot, "app/api/halfway/invite/route.ts")),
  "optional join overlay for host poll after B pins",
);
assert(
  inviteApi.includes('Cache-Control": "no-store"') &&
    inviteApi.includes('dynamic = "force-dynamic"') &&
    inviteApi.includes("resolveHalfwayInviteSession") &&
    inviteApi.includes("shop_ids"),
  "invite GET is not cached and returns overlay pins + frozen shop_ids",
);
assert(
  chatUi.includes("readHalfwayWaiting") &&
    chatUi.includes("writeHalfwayWaiting") &&
    chatUi.includes("visibilitychange") &&
    chatUi.includes('cache: "no-store"') &&
    chatUi.includes("meet_halfway_invite_joined") &&
    chatUi.includes("setHalfwayJoined") &&
    chatUi.includes("guestPinFromLocations"),
  "host page keeps polling invite state and cues when B pins",
);
assert(
  ui.includes("meetHalfwayInviteJoined") &&
    ui.includes('aria-live={joined || waiting ? "polite" : undefined}'),
  "picker shows a live joined cue",
);

const track = readFileSync(join(repoRoot, "lib/track.ts"), "utf8");
const halfwayEvents = [
  "meet_halfway_open",
  "meet_halfway_pin",
  "meet_halfway_invite_share",
  "meet_halfway_invite_open",
  "meet_halfway_results",
  "meet_halfway_refresh",
  "meet_halfway_empty",
] as const;
for (const name of halfwayEvents) {
  assert(track.includes(`"${name}"`), `track.ts exports ${name}`);
  assert(
    chatUi.includes(`"${name}"`) || invitePage.includes(`"${name}"`),
    `${name} fires from chat or /h/`,
  );
}
assert(ui.includes("onPin") && ui.includes("halfwayPinMethod"), "pin field reports which + method");
assert(chatUi.includes("meet_halfway_pin"), "pin sets push meet_halfway_pin");
assert(
  track.includes('"meet_halfway_invite_joined"') &&
    chatUi.includes("meet_halfway_invite_joined"),
  "additive host-sees-guest-pin event does not replace the GTM v7 seven",
);
const persistentEvents = [
  "meet_halfway_results_share",
  "meet_halfway_start_new",
  "meet_halfway_restore",
  "meet_halfway_expired",
] as const;
for (const name of persistentEvents) {
  assert(track.includes(`"${name}"`), `track.ts exports additive ${name}`);
  assert(
    chatUi.includes(`"${name}"`),
    `${name} fires from chat for persistent session`,
  );
}
assert(
  track.includes('"meet_halfway_feedback"') &&
    track.includes("feedback?: MeetHalfwayFeedbackHelpful") &&
    track.includes("feedback_reason?: MeetHalfwayFeedbackReason") &&
    track.includes("meetHalfwayFeedbackParams") &&
    feedbackUi.includes("meet_halfway_feedback"),
  "meet_halfway_feedback stays on the existing dataLayer helper",
);
const yesLayer = meetHalfwayFeedbackParams({
  locale: "en",
  feedback: "yes",
  source: "host",
  count: 3,
  packId: "session-token",
});
assert(
  yesLayer.feedback === "yes" &&
    yesLayer.helpful === "yes" &&
    yesLayer.source === "host" &&
    yesLayer.count === 3 &&
    yesLayer.pack_id === "session-token" &&
    yesLayer.feedback_reason == null,
  "Yes push is meet_halfway_feedback + feedback=yes",
);
const noReasonLayer = meetHalfwayFeedbackParams({
  locale: "ar",
  feedback: "no",
  feedback_reason: "too_far",
  source: "guest",
  count: 3,
});
assert(
  noReasonLayer.feedback === "no" &&
    noReasonLayer.feedback_reason === "too_far" &&
    noReasonLayer.reason === "too_far" &&
    noReasonLayer.source === "guest",
  "No-reason push keeps a stable English chip id",
);
assert(
  !track.includes('"meet_halfway_freeze"') &&
    !chatUi.includes('"meet_halfway_freeze"'),
  "freeze is server-side; return visits use meet_halfway_restore",
);
assert(
  halfwayPinMethod("24.761,46.604") === "paste" &&
    halfwayPinMethod("https://maps.app.goo.gl/abc") === "maps_url",
  "pin method is paste vs maps_url, never coords",
);
assert(
  !track.includes("lat?:") && !track.includes("lng?:"),
  "dataLayer params do not accept pin coordinates",
);
assert(
  !track.includes("host_pin") &&
    !track.includes("guest_pin") &&
    !track.includes("pins?:"),
  "dataLayer stay pin-free; pins are server webhook only",
);
assert(
  track.includes("cafes?: HalfwayResultCafe[]") &&
    track.includes("meetHalfwayResultsParams"),
  "meet_halfway_results params stay additive with cafes[]",
);
assert(
  chatUi.includes("meetHalfwayResultsParams") &&
    chatUi.includes("trackMeetHalfwayResults") &&
    !chatUi.includes("halfway-results-webhook") &&
    !chatUi.includes("HALFWAY_RESULTS_WEBHOOK_KEY") &&
    !chatUi.includes("api2.cursor.sh"),
  "client results push is enriched; webhook key/url never enter chat.tsx",
);
assert(
  chat.includes("notifyHalfwayResults") &&
    chat.includes("after(") &&
    /notifyHalfwayResults\(\{[\s\S]*?\blocations,/.test(chat) &&
    !chat.includes("HALFWAY_RESULTS_WEBHOOK_KEY"),
  "chat API fire-and-forgets the server webhook after a fresh compute",
);

const resultPicks = meetHalfwayChatPicks({
  locations: two,
  language: "ar",
});
assert(resultPicks.length === 3, "fixture three for payload");
const midpoint = locationsCentroid(two, SHOPS);
const cafes = halfwayResultCafesFromPicks({
  picks: resultPicks,
  midpoint,
});
assert(cafes.length === 3, "payload has three cafes");
const firstCafe = cafes[0];
if (!firstCafe) fail("first cafe");
assert(typeof firstCafe.name_ar === "string" && firstCafe.name_ar.length > 0, "name_ar");
assert(typeof firstCafe.name_en === "string" && firstCafe.name_en.length > 0, "name_en");
assert(typeof firstCafe.district === "string" && firstCafe.district.length > 0, "district");
assert(
  typeof firstCafe.maps_url === "string" && firstCafe.maps_url.startsWith("http"),
  "maps_url is a Maps link",
);
assert(
  firstCafe.distance_km == null || typeof firstCafe.distance_km === "number",
  "distance_km optional number",
);
assert(
  !("lat" in firstCafe) && !("lng" in firstCafe) && !("reviewSnippet" in firstCafe),
  "payload omits coords and Soft Places blurbs",
);

const layer = meetHalfwayResultsParams({
  locale: "ar",
  source: "local",
  picks: resultPicks,
  midpoint,
});
assert(layer.locale === "ar", "dataLayer keeps locale");
assert(layer.count === 3, "dataLayer keeps count");
assert(layer.source === "local", "dataLayer keeps source");
assert(Array.isArray(layer.cafes) && layer.cafes.length === 3, "dataLayer cafes");
assert(layer.pack_id == null, "local run omits pack_id");
assert(layer.session_id == null && layer.invite_id == null, "local run omits session aliases");

const invited = meetHalfwayResultsParams({
  locale: "en",
  source: "invite",
  picks: resultPicks,
  packId: "session-token",
  midpoint,
});
assert(invited.pack_id === "session-token", "invite dataLayer adds pack_id");
assert(invited.session_id === "session-token", "GTM session_id alias");
assert(invited.invite_id === "session-token", "GTM invite_id alias");
assert(invited.source === "invite", "invite source unchanged");

const hookBody = halfwayResultsWebhookBody({
  locale: "ar",
  picks: resultPicks,
  sessionId: "session-token",
  midpoint,
  locations: two,
  source: "invite",
});
assert(hookBody.event === "meet_halfway_results", "webhook event name");
assert(hookBody.notify_email === "aj@cali.sa", "Amjad locked inbox");
assert(
  HALFWAY_RESULTS_NOTIFY_EMAIL === "aj@cali.sa" &&
    !HALFWAY_RESULTS_NOTIFY_EMAIL.startsWith("amjad@"),
  "not amjad@cali.sa",
);
assert(hookBody.locale === "ar", "webhook locale");
assert(hookBody.session_id === "session-token", "webhook session_id");
assert(hookBody.count === 3, "webhook count");
assert(hookBody.cafes.length === 3, "webhook cafes");
assert(
  hookBody.cafes[0] &&
    !("lat" in hookBody.cafes[0]) &&
    !("lng" in hookBody.cafes[0]),
  "café objects stay coord-free",
);
const builtPins = halfwayResultPins(two);
assert(builtPins.length === 2, "payload helper emits host + friend");
assert(
  Array.isArray(hookBody.pins) && hookBody.pins.length === 2,
  "webhook pins[] is host + friend",
);
const hookHost = hookBody.host_pin;
const hookGuest = hookBody.guest_pin;
if (!hookHost || !hookGuest) fail("named host_pin + guest_pin");
assert(hookHost.role === "host", "host role");
assert(hookGuest.role === "guest", "guest role");
assert(
  hookHost.label_ar === HALFWAY_RESULT_PIN_LABELS.host.ar &&
    hookHost.label_en === HALFWAY_RESULT_PIN_LABELS.host.en &&
    hookHost.label_ar === "موضعي" &&
    hookHost.label_en === "My pin",
  "host AR/EN labels",
);
assert(
  hookGuest.label_ar === HALFWAY_RESULT_PIN_LABELS.guest.ar &&
    hookGuest.label_en === HALFWAY_RESULT_PIN_LABELS.guest.en &&
    hookGuest.label_ar === "صديقي" &&
    hookGuest.label_en === "Friend pin",
  "guest AR/EN labels",
);
assert(
  hookHost.lat === two[0]?.pin.lat &&
    hookHost.lng === two[0]?.pin.lng &&
    hookGuest.lat === two[1]?.pin.lat &&
    hookGuest.lng === two[1]?.pin.lng,
  "pin latlng matches resolved locations",
);
assert(
  hookHost.maps_url.startsWith("https://maps.google.com/?q=") &&
    hookGuest.maps_url.startsWith("https://maps.google.com/?q="),
  "pin maps_url is a Maps link",
);
const noLocations = halfwayResultsWebhookBody({
  locale: "ar",
  picks: resultPicks,
  midpoint,
  source: "local",
});
assert(
  noLocations.pins == null &&
    noLocations.host_pin == null &&
    noLocations.guest_pin == null &&
    noLocations.cafes.length === 3,
  "pins are omitted when locations are not passed; cafes stay",
);
assert(
  HALFWAY_RESULTS_NOTIFY_EMAIL === "aj@cali.sa" &&
    HALFWAY_RESULTS_WEBHOOK_URL.includes("api2.cursor.sh/automations/webhook/"),
  "locked notify email + Cursor webhook host",
);

const envFile = readFileSync(join(repoRoot, "lib/env.ts"), "utf8");
const envExample = readFileSync(join(repoRoot, ".env.example"), "utf8");
assert(
  envFile.includes("HALFWAY_RESULTS_WEBHOOK_KEY") &&
    envExample.includes("HALFWAY_RESULTS_WEBHOOK_KEY") &&
    !envExample.includes("NEXT_PUBLIC_HALFWAY"),
  "Vercel env name is documented and not public",
);

assert(
  pinsMidpoint([]) === null &&
    pinsMidpoint([{ lat: 24.76, lng: 46.6 }, { lat: 24.78, lng: 46.62 }]) != null,
  "midpoint helper is pin-only",
);

void (async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.HALFWAY_RESULTS_WEBHOOK_KEY;
  const sent: Array<{ url: string; auth: string | null; body: unknown }> = [];
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    sent.push({
      url: String(url),
      auth:
        init?.headers && typeof init.headers === "object" && "Authorization" in init.headers
          ? String((init.headers as Record<string, string>).Authorization)
          : null,
      body: init?.body ? JSON.parse(String(init.body)) : null,
    });
    return new Response("ok", { status: 200 });
  }) as typeof fetch;
  try {
    delete process.env.HALFWAY_RESULTS_WEBHOOK_KEY;
    const skipped = await notifyHalfwayResults({
      locale: "ar",
      picks: resultPicks,
      midpoint,
      source: "local",
    });
    assert(skipped === "skipped", "missing key stubs");
    assert(sent.length === 0, "stub does not POST");

    process.env.HALFWAY_RESULTS_WEBHOOK_KEY = "test-halfway-webhook-key";
    const posted = await notifyHalfwayResults({
      locale: "en",
      picks: resultPicks,
      sessionId: "session-token",
      midpoint,
      locations: two,
      source: "invite",
    });
    assert(posted === "sent", "Bearer POST reports sent");
    assert(sent.length === 1, "one webhook POST");
    const call = sent[0];
    if (!call) fail("webhook call");
    assert(call.url === HALFWAY_RESULTS_WEBHOOK_URL, "POST hits the Cursor webhook");
    assert(call.auth === "Bearer test-halfway-webhook-key", "Authorization Bearer from env");
    const postedBody = call.body as {
      notify_email?: string;
      cafes?: unknown[];
      event?: string;
      pins?: unknown[];
      host_pin?: { role?: string };
      guest_pin?: { role?: string };
    };
    assert(postedBody.event === "meet_halfway_results", "POST body event");
    assert(postedBody.notify_email === "aj@cali.sa", "POST body inbox");
    assert(
      Array.isArray(postedBody.cafes) && postedBody.cafes.length === 3,
      "POST body cafes",
    );
    assert(
      Array.isArray(postedBody.pins) && postedBody.pins.length === 2,
      "POST body pins",
    );
    assert(postedBody.host_pin?.role === "host", "POST body host_pin");
    assert(postedBody.guest_pin?.role === "guest", "POST body guest_pin");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.HALFWAY_RESULTS_WEBHOOK_KEY;
    else process.env.HALFWAY_RESULTS_WEBHOOK_KEY = previousKey;
  }

  console.log("meet-halfway pin-first lock ok");
})();
