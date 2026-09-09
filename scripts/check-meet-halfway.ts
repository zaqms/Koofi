/**
 * بيننا pin-first lock (Amjad). District dropdowns are not the product.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { listRealShops } from "../lib/catalog";
import { rankByPopularity } from "../lib/district-rank";
import { parseSharedPin, looksLikeSharedPin } from "../lib/shared-pin";
import { shopMapsHref } from "../lib/public-url";
import {
  decodeHalfwayInviteId,
  encodeHalfwayInviteId,
  halfwayInviteSharePath,
  halfwayInviteShareText,
  inspectHalfwayInviteId,
} from "../lib/halfway-invite";
import {
  meetHalfwayAskLabel,
  parseHalfwayPinInputs,
  pickHalfwayShops,
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
    copy.includes("ادعُ صاحبك"),
  "copy asks for pins, not districts",
);
assert(!copy.includes("أنا في"), "district label أنا في is gone");
assert(!copy.includes("الثاني"), "district label الثاني is gone");

const ui = readFileSync(join(repoRoot, "components/meet-halfway-picker.tsx"), "utf8");
assert(!ui.includes("<select"), "no district dropdowns as primary UX");
assert(ui.includes("looksLikeSharedPin"), "paste Maps URL / lat-lng");
assert(ui.includes("requestVisitorLocation"), "browser geolocation on first pin");
assert(
  ui.includes("meetHalfwayMe") &&
    ui.includes("meetHalfwayOther") &&
    ui.includes("meetHalfwayMyPin") &&
    ui.includes("meetHalfwayInvite"),
  "two pin fields plus ادعُ صاحبك",
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
    inviteText.includes("wain.lol/h/") &&
    inviteText.includes("from=wa") &&
    !inviteText.includes("maps.google"),
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

const chatUi = readFileSync(join(repoRoot, "components/chat.tsx"), "utf8");
assert(
  chatUi.includes("sharePackPacket") && chatUi.includes("inviteHalfwayFriend"),
  "invite uses the same system share family as وين؟ / packet",
);
const invitePage = readFileSync(join(repoRoot, "app/h/[id]/page.tsx"), "utf8");
assert(
  invitePage.includes("halfwayInvite") && invitePage.includes('kind="halfway"'),
  "friend lands on /h/{id} with guest pin only",
);
assert(
  existsSync(join(repoRoot, "app/api/halfway/invite/route.ts")),
  "optional join overlay for A refresh",
);

console.log("meet-halfway pin-first lock ok");
