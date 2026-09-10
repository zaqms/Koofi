/**
 * بيننا pin-first lock (Amjad). District dropdowns are not the product.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { listRealShops } from "../lib/catalog";
import { rankByPopularity } from "../lib/district-rank";
import { parseSharedPin, looksLikeSharedPin, halfwayPinMethod } from "../lib/shared-pin";
import { shopMapsHref } from "../lib/public-url";
import {
  decodeHalfwayInviteId,
  encodeHalfwayInviteId,
  guestPinFromLocations,
  halfwayInviteHasGuest,
  halfwayInviteSharePath,
  halfwayInviteShareText,
  inspectHalfwayInviteId,
} from "../lib/halfway-invite";
import { parseHalfwayWaiting } from "../lib/halfway-waiting";
import {
  meetHalfwayAskLabel,
  meetHalfwayReply,
  parseHalfwayPinInputs,
  pickHalfwayShops,
  halfwayCandidatePool,
  halfwayResultsFooterKind,
  locationsCentroid,
} from "../lib/meet-halfway";
import { MEET_HALFWAY_CHIP, VIBE_CHIPS, halfwayInvitePath } from "../lib/product";

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
assert(VIBE_CHIPS.length === 11, "Soft Places stay parked — VIBE_CHIPS stays 11");
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
    copy.includes("ثلاث قهاوي بينكم") &&
    copy.includes("أنت وين؟") &&
    copy.includes("موقعي") &&
    copy.includes("اعزم خويك") &&
    copy.includes("غيرها") &&
    copy.includes("ما في أكثر بهالمنطقة") &&
    copy.includes("صاحبك دبّس.") &&
    copy.includes("Your friend dropped their pin."),
  "copy asks for pins, not districts",
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
  meetHalfwayReply({ shopCount: 3, language: "ar" }) === "ثلاث قهاوي بينكم",
  "full page stays ثلاث قهاوي بينكم",
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
    ui.includes("meetHalfwayInvite"),
  "two pin fields plus اعزم خويك",
);
assert(!ui.includes("directoryNeighborhoods"), "picker is not a district directory");

const chips = readFileSync(join(repoRoot, "components/vibe-chips.tsx"), "utf8");
assert(chips.includes("MEET_HALFWAY_CHIP"), "chip stays on existing row");

const chat = readFileSync(join(repoRoot, "app/api/chat/route.ts"), "utf8");
assert(
  chat.includes("halfway") && chat.includes("locations") && chat.includes("pickHalfwayShops"),
  "chat POST accepts locations: Location[]",
);
assert(
  chat.includes("if (halfwayRows)") &&
    chat.indexOf("if (halfwayRows)") < chat.indexOf("if (extractMapsUrl(text))"),
  "halfway pin body is handled before Maps add-shop",
);

const src = readFileSync(join(repoRoot, "lib/meet-halfway.ts"), "utf8");
assert(
  src.includes("rankByPopularity") && src.includes("locationsCentroid"),
  "reuse locked Most Popular + N-location centroid",
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

const mid = locationsCentroid(two, SHOPS);
assert(mid && Number.isFinite(mid.lat) && Number.isFinite(mid.lng), "band around pin centroid");

assert(meetHalfwayAskLabel("ar") === "بيننا · دبوسين", "ask label is two pins");
assert(meetHalfwayAskLabel("en") === "Halfway · two pins", "EN ask label");

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
assert(
  halfwayInvitePath(inviteId).startsWith("/h/") &&
    halfwayInviteSharePath(inviteId).endsWith("?from=wa"),
  "invite share is /h/{id}?from=wa",
);
const inviteText = halfwayInviteShareText({
  language: "ar",
  url: `https://wain.lol${halfwayInviteSharePath(inviteId)}`,
});
assert(
  inviteText.includes("بيننا") &&
    inviteText.includes("اعزم خويك") &&
    inviteText.includes("wain.lol/h/") &&
    inviteText.includes("from=wa") &&
    !inviteText.includes("maps.google") &&
    !inviteText.includes("ادعُ صاحبك") &&
    !inviteText.includes("ادع صاحبك"),
  "invite packet is وين؟-family share text, not a Maps dump",
);
const expired = inspectHalfwayInviteId(
  inviteId,
  1_700_000_000_000 + 45 * 60 * 1000 + 1,
);
assert(
  !expired.ok && expired.reason === "expired",
  "invite expires inside 30–60 min (45)",
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
  chatUi.includes("sharePackPacket") && chatUi.includes("inviteHalfwayFriend"),
  "invite uses the same system share family as وين؟ / packet",
);
assert(
  chatUi.includes("MeetHalfwayResultsFooter") &&
    chatUi.includes("halfwayResultsFooterKind") &&
    resultsFooter.includes("meetHalfwayMore") &&
    resultsFooter.includes("meetHalfwayNoMore"),
  "local two-pin and /h/ guest share one بيننا results footer",
);
assert(
  chatUi.includes("joinHalfwayInvite") &&
    chatUi.includes("[...halfwayInvite.locations, row]") &&
    chatUi.includes("halfwayLocations") &&
    chatUi.includes("halfway: {") &&
    chatUi.includes("locations,") &&
    chatUi.includes("more,"),
  "guest /h/ results keep locations on the message so غيرها survives remount",
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
assert(
  invitePage.includes("halfwayInvite") &&
    invitePage.includes('kind="halfway"') &&
    invitePage.includes("<Chat"),
  "friend lands on /h/{id} with the same Chat results footer",
);
assert(
  chatUi.includes("const showAskComposer = !meetHalfwayOpen") &&
    /showAskComposer \? \(\s*<form/.test(chatUi),
  "host + /h/ guest hide the bottom ask form while بيننا is open",
);
const askFormGate =
  chatUi.match(/showAskComposer \? \(\s*<form[\s\S]*?<\/form>\s*\) : null/)?.[0] ??
  "";
assert(
  askFormGate.includes("<form") &&
    askFormGate.includes('id="koofi-ask"') &&
    askFormGate.includes("<AddShopButton"),
  "hidden form includes the ask composer + أضف قهوة / Add a coffee shop",
);
assert(
  chatUi.includes("<AddShopButton") &&
    chatUi.includes('id="koofi-ask"') &&
    chatUi.includes("setMeetHalfwayOpen(false)") &&
    chatUi.includes("setMeetHalfwayOpen(true)"),
  "ask composer and أضف قهوة stay in Chat; they restore when بيننا closes",
);
assert(
  invitePage.includes("<Chat") && chatUi.includes("showAskComposer"),
  "guest /h/ uses the same Chat composer gate as the host",
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
    inviteApi.includes("halfwayInviteHasGuest"),
  "invite GET is not cached and reports joined",
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
assert(
  halfwayPinMethod("24.761,46.604") === "paste" &&
    halfwayPinMethod("https://maps.app.goo.gl/abc") === "maps_url",
  "pin method is paste vs maps_url, never coords",
);
assert(
  !track.includes("lat?:") && !track.includes("lng?:"),
  "dataLayer params do not accept pin coordinates",
);

console.log("meet-halfway pin-first lock ok");
