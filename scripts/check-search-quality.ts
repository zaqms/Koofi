import { isListingShop, listRealShops } from "../lib/catalog";
import { copy } from "../lib/copy";
import { decodePackId, encodePackId } from "../lib/pack";
import { readFileSync } from "node:fs";
import { haversineKm } from "../lib/distance";
import { officialShopCoords } from "../lib/place-coords";
import {
  formatWhatsAppReply,
  headingForPicks,
  isNearbyAsk,
  listedResultForWhatsApp,
  pickCafes,
} from "../lib/picker";
import { normalizeShopText } from "../lib/shop-name";
import { sortPicksByDistance } from "../lib/search-distance";
import type { ChatPick } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function idsOf(text: string, language: "ar" | "en" = "en") {
  return pickCafes({ text, language });
}

const shops = listRealShops();
// Search lists listed branches only (drive-through / pickup rows stay off the count).
const starbucks = shops.filter((shop) => shop.chainBrand === "starbucks" && isListingShop(shop));
const drCafeAll = shops.filter((shop) => shop.chainBrand === "dr-cafe");
const drCafe = drCafeAll.filter((shop) => isListingShop(shop));
assert(starbucks.length >= 8, `expected the Starbucks branches, got ${starbucks.length}`);
assert(drCafeAll.length >= 22, `expected the dr.CAFE rows, got ${drCafeAll.length}`);
assert(drCafe.length >= 8 && drCafe.length < drCafeAll.length, `dr.CAFE listed ${drCafe.length}`);

function sameIds(resultIds: string[], expected: { id: string }[], label: string) {
  const got = [...resultIds].sort().join(",");
  const want = expected.map((shop) => shop.id).sort().join(",");
  assert(got === want, `${label}\n got ${got}\n want ${want}`);
}

assert(normalizeShopText("قَهْوَة") === "قهوه", "diacritics and ة fold");
assert(normalizeShopText("عَلَى") === "علي", "ى folds to ي");
assert(normalizeShopText("أَإآٱ") === "اااا", "alef variants fold");
assert(normalizeShopText("سـتار") === "ستار", "tatweel is stripped");
assert(
  normalizeShopText("ستار بكس") === "ستار بكس",
  "spacing stays for the alias joiner",
);

for (const ask of ["ستاربكس", "ستار بكس", "starbucks", "سـتاربكس", "ستَاربكس"] as const) {
  const language = ask === "starbucks" ? "en" : "ar";
  const result = idsOf(ask, language);
  sameIds(
    result.picks.map((pick) => pick.shop.id),
    starbucks,
    `${ask} should return every Starbucks branch`,
  );
  assert(result.mode === "search", `${ask} mode`);
  assert(result.matchCount === starbucks.length, `${ask} matchCount`);
  assert(result.noMatch !== true, `${ask} is a match`);
  const heading = headingForPicks(result);
  assert(
    !heading.includes("Three cafes") && !heading.includes("ثلاث قهاوي تناسب اختيارك"),
    `${ask} heading used the three-pick line: ${heading}`,
  );
  assert(heading.includes(String(starbucks.length)), `${ask} heading counts: ${heading}`);
}

const dr = idsOf("dr.CAFE", "en");
sameIds(
  dr.picks.map((pick) => pick.shop.id),
  drCafe,
  "dr.CAFE should return every branch",
);
assert(dr.matchCount === drCafe.length, "dr.CAFE count");

const mathar = idsOf("Starbucks Al Mathar", "en");
const matharIds = starbucks.filter((shop) => shop.neighborhood === "al-mathar");
sameIds(
  mathar.picks.map((pick) => pick.shop.id),
  matharIds,
  "Starbucks Al Mathar should return the Al Mathar branches",
);
assert(
  mathar.picks.every((pick) => pick.shop.chainBrand === "starbucks"),
  "Al Mathar search stays on Starbucks",
);

const matharAr = idsOf("ستاربكس المعذر", "ar");
sameIds(
  matharAr.picks.map((pick) => pick.shop.id),
  matharIds,
  "ستاربكس المعذر should return the Al Mathar branches",
);

const none = idsOf("xyzcafe123", "en");
assert(none.noMatch === true, "xyzcafe123 noMatch");
assert(none.picks.length === 0, "xyzcafe123 returns no picks");
assert(none.matchCount === 0, "xyzcafe123 count");
assert(headingForPicks(none) === copy.noMatch.en, `xyzcafe123 reply: ${headingForPicks(none)}`);
assert((none.suggestions ?? []).length > 0, "xyzcafe123 may suggest popular cafés");
assert(
  (none.suggestions ?? []).every(
    (pick) => !/xyzcafe123/i.test(`${pick.shop.id} ${pick.shop.nameEn}`),
  ),
  "suggestions are real cafés, separate from the empty result",
);

const typo = idsOf("Starbuks", "en");
assert(typo.didYouMean?.nameEn === "Starbucks", `Starbuks didYouMean ${typo.didYouMean?.nameEn}`);
assert(typo.didYouMean?.nameAr === "ستاربكس", "Starbuks Arabic name");
sameIds(
  typo.picks.map((pick) => pick.shop.id),
  starbucks,
  "Starbuks should return every Starbucks branch",
);
assert(
  headingForPicks(typo).includes("Did you mean Starbucks?"),
  `Starbuks heading: ${headingForPicks(typo)}`,
);

const dunkin = idsOf("Dunkn", "en");
assert(dunkin.picks.length === 0, "Dunkn returns no cafés");
assert(dunkin.noMatch === true, "Dunkn is not a match");
assert(dunkin.excludedBrand?.nameEn === "Dunkin'", `Dunkn brand ${dunkin.excludedBrand?.nameEn}`);
assert((dunkin.suggestions ?? []).length === 0, "excluded brand does not pad suggestions");
assert(
  headingForPicks(dunkin).includes("isn't listed on Wain"),
  `Dunkn heading: ${headingForPicks(dunkin)}`,
);
assert(
  headingForPicks(dunkin).toLowerCase().includes("donut"),
  "Dunkn explains the donut-chain policy",
);

const dunkinAr = idsOf("دانكن", "ar");
assert(dunkinAr.excludedBrand?.nameAr === "دانكن", "دانكن is the excluded brand");
assert(headingForPicks(dunkinAr).includes("مو موجودة في وين"), `دانكن heading: ${headingForPicks(dunkinAr)}`);

const malqa = pickCafes({ text: "الملقا", language: "ar" });
assert(malqa.matchedDistrict === "al-malqa", "الملقا still sets districtMatch");
assert(malqa.mode === "browse", "الملقا stays a district three-pack");
assert(malqa.picks.length === 3, `الملقا should return 3, got ${malqa.picks.length}`);
assert(
  malqa.picks.every((pick) => pick.shop.neighborhood === "al-malqa"),
  `الملقا left the district: ${malqa.picks.map((pick) => pick.shop.id).join(",")}`,
);
assert(
  headingForPicks(malqa) === copy.threePicks.ar,
  "district browse may keep the three-pick line",
);

// Privacy: the visitor pin never reaches the server (lib/legal.ts).
const pickerSrc = readFileSync(new URL("../lib/picker.ts", import.meta.url), "utf8");
const routeSrc = readFileSync(new URL("../app/api/chat/route.ts", import.meta.url), "utf8");
const chatSrc = readFileSync(new URL("../components/chat.tsx", import.meta.url), "utf8");
assert(!/origin\?: Pin/.test(pickerSrc), "pickCafes takes no visitor origin");
assert(
  !/\blat\b|\blng\b|parseOrigin|isUsableVisitorOrigin/.test(routeSrc),
  "/api/chat reads no visitor coordinates",
);
const chatPost = chatSrc.slice(
  chatSrc.indexOf('fetch("/api/chat"'),
  chatSrc.indexOf('fetch("/api/chat"') + 700,
);
assert(chatPost.includes("text: trimmed"), "found the /api/chat POST body");
assert(!/\blat\b|\blng\b|visitor/.test(chatPost), "the /api/chat POST body carries no pin");
assert(
  chatSrc.includes("sortPicksByDistance(picks, { lat: pin.lat, lng: pin.lng })"),
  "search branches are sorted by distance on the device",
);
const legalSrc = readFileSync(new URL("../lib/legal.ts", import.meta.url), "utf8");
assert(
  legalSrc.includes("does not send your GPS location"),
  "privacy policy still promises GPS stays on the device",
);
{
  const pinned = starbucks
    .map((shop) => ({ shop, coords: officialShopCoords(shop) }))
    .filter((row) => row.coords);
  assert(pinned.length >= 2, "two Starbucks branches have pins");
  const far = pinned[pinned.length - 1]!;
  const cards = pinned.map((row) => ({ id: row.shop.id, lat: row.coords!.lat, lng: row.coords!.lng })) as unknown as ChatPick[];
  const sorted = sortPicksByDistance(cards, far.coords!);
  assert(sorted[0]?.id === far.shop.id, `device sort leads with the nearest, got ${sorted[0]?.id}`);
  assert(sorted.every((pick, index, all) => index === 0 || haversineKm(far.coords!, { lat: all[index - 1]!.lat!, lng: all[index - 1]!.lng! }) <= haversineKm(far.coords!, { lat: pick.lat!, lng: pick.lng! })), "device sort is nearest first");
  assert(sorted.find((pick) => pick.id === far.shop.id)?.rank === pinned.length - 1, "device sort keeps the server rank for map-click logs");
}

for (const ask of ["Starbucks near me", "ستاربكس قريب", "Starbucks quiet"] as const) {
  const language = ask.startsWith("Starbucks") ? "en" : "ar";
  const result = idsOf(ask, language);
  sameIds(
    result.picks.map((pick) => pick.shop.id),
    starbucks,
    `${ask} should keep every Starbucks branch`,
  );
  assert(result.mode === "search", `${ask} stays a search`);
  assert(!result.didYouMean, `${ask} is not a typo`);
}

const both = idsOf("ستاربكس او دكتور كيف", "ar");
const bothIds = [...starbucks, ...drCafe];
sameIds(
  both.picks.map((pick) => pick.shop.id),
  bothIds,
  "ستاربكس او دكتور كيف should return both brands",
);
assert(
  both.picks.every((pick) => pick.shop.id !== "hal-alkeif-kafd"),
  "هل الكيف is not a dr.CAFE branch",
);

const panorama = idsOf("starbucks panorama", "en");
assert(panorama.picks.length === 1, `starbucks panorama should stay one branch, got ${panorama.picks.length}`);
assert(
  panorama.picks[0]?.shop.id.includes("panorama"),
  `starbucks panorama led with ${panorama.picks[0]?.shop.id}`,
);

for (const ask of [
  "breakfast",
  "brunch",
  "family",
  "family friendly",
  "view",
  "v60",
  "nearby",
  "قريب مني",
  "كوفي",
  "وين اروح",
  "فطور",
  "عائلي",
  "إطلالة",
  "مزدحم",
] as const) {
  const result = pickCafes({ text: ask });
  assert(result.noMatch !== true, `${ask} should be a recommendation, not no-match`);
  assert(result.mode === "browse", `${ask} mode ${result.mode}`);
  assert(!result.didYouMean, `${ask} should not be a did-you-mean`);
  assert(result.picks.length > 0 && result.picks.length <= 3, `${ask} returns a short list`);
}

const howAreYou = idsOf("كيف حالك", "ar");
assert(
  howAreYou.picks.every((pick) => pick.shop.chainBrand !== "dr-cafe"),
  `كيف حالك must not list dr.CAFE: ${howAreYou.picks.map((pick) => pick.shop.id).join(",")}`,
);
assert(howAreYou.mode !== "search" || howAreYou.picks.length === 0, "كيف حالك is not a brand search");

const doctor = idsOf("دكتور كيف", "ar");
sameIds(
  doctor.picks.map((pick) => pick.shop.id),
  drCafe,
  "دكتور كيف should return every dr.CAFE branch and nothing else",
);

const dessert = idsOf("dessert", "en");
assert(dessert.didYouMean?.nameEn !== "Essert", "dessert must not suggest Essert");
assert(dessert.noMatch !== true, "dessert is a recommendation");

const drops = idsOf("drops", "en");
assert(drops.noMatch !== true, "drops stays a recommendation");
assert(!drops.didYouMean, `drops must not suggest ${drops.didYouMean?.nameEn}`);
assert(drops.picks.length === 3, "drops still returns 3 cafés");
assert(
  drops.picks.every(
    (pick) => !/drops/i.test(`${pick.shop.id} ${pick.shop.nameEn} ${pick.shop.nameAr}`),
  ),
  "drops must not invent a Drops listing",
);

const halfMillion = idsOf("Half Million", "en");
assert(
  halfMillion.picks.length > 0 &&
    halfMillion.picks.every((pick) => pick.shop.chainBrand === "half-million"),
  `Half Million pulled in ${halfMillion.picks.map((pick) => pick.shop.id).join(",")}`,
);
assert(
  !halfMillion.picks.some((pick) => pick.shop.id.startsWith("half-ten")),
  "Half Million must not include Half Ten",
);

const drip = idsOf("Drip", "en");
assert(
  drip.picks.length > 0 && drip.picks.every((pick) => pick.shop.id.startsWith("drip-")),
  `Drip pulled in ${drip.picks.map((pick) => pick.shop.id).join(",")}`,
);
assert(
  !drip.picks.some((pick) => pick.shop.id.includes("unique-drip")),
  "Drip must not include Unique Drip",
);

const uniqueDrip = idsOf("Unique Drip", "en");
assert(
  uniqueDrip.picks.length === 1 && uniqueDrip.picks[0]?.shop.id === "unique-drip-al-mohammadiyah",
  `Unique Drip returned ${uniqueDrip.picks.map((pick) => pick.shop.id).join(",")}`,
);

for (const ask of ["ستاربكس Panorama", "Starbucks بانوراما"] as const) {
  const result = idsOf(ask, "ar");
  assert(result.picks.length === 1, `${ask} should be one branch, got ${result.picks.length}`);
  assert(
    result.picks[0]?.shop.id === "starbucks-panorama-al-mathar",
    `${ask} led with ${result.picks[0]?.shop.id}`,
  );
}

const nearbyPlainA = pickCafes({ text: "nearby", language: "en" });
const nearbyPlainB = pickCafes({ text: "nearby", language: "en" });
assert(
  nearbyPlainA.picks.map((pick) => pick.shop.id).join(",") ===
    nearbyPlainB.picks.map((pick) => pick.shop.id).join(","),
  "nearby without a pin must not shuffle",
);
const nearbyArPlainA = pickCafes({ text: "قريب مني", language: "ar" });
const nearbyArPlainB = pickCafes({ text: "قريب مني", language: "ar" });
assert(
  nearbyArPlainA.picks.map((pick) => pick.shop.id).join(",") ===
    nearbyArPlainB.picks.map((pick) => pick.shop.id).join(","),
  "قريب مني without a pin must not shuffle",
);

for (const ask of ["Costa Coffee", "Caribou Coffee", "Veloce Cafe"] as const) {
  const result = idsOf(ask, "en");
  const brand = ask.split(" ")[0]!.toLowerCase();
  assert(result.picks.length === 2, `${ask} should return both branches, got ${result.picks.length}`);
  assert(
    result.picks.every((pick) => pick.shop.chainBrand === brand),
    `${ask} pulled in ${result.picks.map((pick) => pick.shop.id).join(",")}`,
  );
}
assert(
  idsOf("Costa", "en").picks.length === 2 && idsOf("كوستا", "ar").picks.length === 2,
  "Costa without the word coffee still returns both branches",
);

// Proximity asks run the on-device Nearby flow (the pin never goes to the server).
for (const ask of [
  "nearby cafes",
  "cafes nearby",
  "nearby coffee",
  "مقاهي قريبة",
  "near me",
  "coffee near me",
  "قريب",
  "nearby",
  "قريب مني",
] as const) {
  assert(isNearbyAsk(ask), `${ask} is a nearby ask (device Nearby flow)`);
  const language = /[A-Za-z]/.test(ask) ? "en" : "ar";
  const result = pickCafes({ text: ask, language });
  assert(result.noMatch !== true, `${ask} should not be a no-match`);
  assert(result.distanceSorted !== true, `${ask} is never distance-sorted on the server`);
  assert(headingForPicks(result) === copy.threePicks[language], `${ask} without a pin keeps the three-pack line`);
}
assert(!isNearbyAsk("coffee"), "coffee alone is not a nearby ask");
assert(!isNearbyAsk("Starbucks near me"), "Starbucks near me is not the Nearby flow");
const starbucksNear = pickCafes({ text: "Starbucks near me", language: "en" });
assert(starbucksNear.mode === "search", "Starbucks near me stays a brand search");
{
  const chatUi = readFileSync(new URL("../components/chat.tsx", import.meta.url), "utf8");
  assert(chatUi.includes("isNearbyAsk(trimmed)") && chatUi.includes("void sendNearby(trimmed)"), "typed nearby runs on the device");
}

function pickedIds(text: string, language: "ar" | "en" = "en"): string[] {
  return pickCafes({ text, language }).picks.map((pick) => pick.shop.id);
}
function lacks(ids: string[], needle: string, label: string) {
  assert(!ids.some((id) => id.includes(needle)), `${label} included ${ids.filter((id) => id.includes(needle)).join(",")}`);
}
const blackWolf = pickedIds("Black Wolf");
assert(blackWolf.length > 0 && blackWolf.every((id) => id.startsWith("black-wolf")), `Black Wolf: ${blackWolf.join(",")}`);
lacks(blackWolf, "black-stamp", "Black Wolf");
lacks(pickedIds("بلاك وولف", "ar"), "black-stamp", "بلاك وولف");
const pinkCamel = pickedIds("Pink Camel");
assert(pinkCamel.length > 0 && pinkCamel.every((id) => id.startsWith("pink-camel")), `Pink Camel: ${pinkCamel.join(",")}`);
lacks(pinkCamel, "camel-step", "Pink Camel");
const javaTime = pickedIds("Java Time");
assert(javaTime.length > 0 && javaTime.every((id) => id.includes("java-time")), `Java Time: ${javaTime.join(",")}`);
lacks(javaTime, "java-cafe", "Java Time");
lacks(pickedIds("جافا تايم", "ar"), "java-cafe", "جافا تايم");
lacks(pickedIds("Espresso Culture"), "pivot-espresso", "Espresso Culture");
lacks(pickedIds("إسبريسو كالتشر", "ar"), "pivot-espresso", "إسبريسو كالتشر");
lacks(pickedIds("Book of Beans"), "seven-beans", "Book of Beans");
lacks(pickedIds("The Coffee Bean & Tea Leaf"), "specialty-bean", "The Coffee Bean & Tea Leaf");
lacks(pickedIds("illy caffè – Granada Mall"), "bacha-coffee", "illy");
lacks(pickedIds("كافيه مزاج", "ar"), "mezaj-", "كافيه مزاج");
lacks(pickedIds("مقهى ومحمصة وودز", "ar"), "maqha-mahamasa", "مقهى ومحمصة وودز");
assert(pickedIds("Black Stamp").every((id) => id.startsWith("black-stamp")), "Black Stamp is its own full phrase");
assert(pickedIds("Camel Step").every((id) => id.startsWith("camel-step")), "Camel Step is its own full phrase");
assert(pickedIds("Java Cafe").every((id) => id.startsWith("java-cafe")), "Java Cafe is its own full phrase");
assert(pickedIds("Cord").join(",") === "cord-cafe-al-hamra", "Cord is not Chord");
assert(pickedIds("Chord").join(",") === "chord-daily-coffee-al-nahdah", "Chord is not Cord");
const sharedCord = pickedIds("كورد قهوة يومية", "ar").sort().join(",");
assert(
  sharedCord === "chord-daily-coffee-al-nahdah,cord-cafe-al-hamra",
  `both cards use كورد قهوة يومية, got ${sharedCord}`,
);

const spokenList = listedResultForWhatsApp(dr);
assert(spokenList.picks.length === 8, `WhatsApp speech list is ${spokenList.picks.length}`);
assert(spokenList.matchCount === dr.matchCount, "WhatsApp speech keeps the full count");
assert(
  spokenList.picks.every((pick, index) => pick.shop.id === dr.picks[index]?.shop.id),
  "WhatsApp speech list is the cafés that get listed",
);
const waSource = readFileSync(new URL("../lib/whatsapp.ts", import.meta.url), "utf8");
assert(
  waSource.includes("listedResultForWhatsApp(result)") &&
    waSource.includes("result: listed"),
  "WhatsApp sends the LLM only the listed cafés",
);

const malqaSpelling = pickCafes({ text: "الملقى", language: "ar" });
assert(malqaSpelling.matchedDistrict === "al-malqa", "الملقى is Al Malqa");
assert(malqaSpelling.mode === "browse", "الملقى stays a district browse");
assert(
  malqaSpelling.picks.every((pick) => pick.shop.neighborhood === "al-malqa"),
  "الملقى stays inside Al Malqa",
);

const leadingAlef = idsOf("إستاربكس", "ar");
sameIds(
  leadingAlef.picks.map((pick) => pick.shop.id),
  starbucks,
  "إستاربكس should return every Starbucks branch",
);
assert(
  leadingAlef.didYouMean?.nameEn === "Starbucks",
  `إستاربكس did you mean ${leadingAlef.didYouMean?.nameEn}`,
);

const dunkinShort = idsOf("دنكن", "ar");
assert(dunkinShort.picks.length === 0, "دنكن returns no cafés");
assert(dunkinShort.excludedBrand?.nameEn === "Dunkin'", "دنكن is Dunkin'");
assert(
  headingForPicks(dunkinShort).includes("مو موجودة في وين"),
  `دنكن heading: ${headingForPicks(dunkinShort)}`,
);

const olayaShops = starbucks.filter((shop) => shop.neighborhood === "olaya");
assert(olayaShops.length === 0, "the catalog has no Starbucks in Al Olaya");
for (const ask of ["Starbucks Olaya", "ستاربكس العليا"] as const) {
  const language = ask.startsWith("Starbucks") ? "en" : "ar";
  const result = idsOf(ask, language);
  sameIds(
    result.picks.map((pick) => pick.shop.id),
    starbucks,
    `${ask} should show every branch when the district has none`,
  );
  const heading = headingForPicks(result);
  assert(
    language === "en" ? heading.includes("Al Olaya") : heading.includes("العليا"),
    `${ask} should say the district has none: ${heading}`,
  );
  assert(
    language === "en" ? heading.includes("Starbucks") : heading.includes("ستاربكس"),
    `${ask} should name the brand: ${heading}`,
  );
  assert(!heading.includes("Three cafes") && !heading.includes("ثلاث قهاوي تناسب اختيارك"), heading);
}

const packIds = starbucks.map((shop) => shop.id);
const pack = decodePackId(encodePackId({ locale: "en", shopIds: packIds, ask: "Starbucks", search: true }));
assert(pack?.shopIds.join(",") === packIds.join(","), "a search pack keeps every Starbucks branch");
assert(pack?.search === true, "a search pack remembers it was a search");

const wa = formatWhatsAppReply(dr, undefined, "dr.CAFE");
assert(wa.length < 4096, `WhatsApp dr.CAFE reply is ${wa.length} chars`);
const listed = wa.split("\n").filter((line) => /^\d+\./.test(line));
assert(listed.length <= 8, `WhatsApp lists ${listed.length} cafés`);
assert(listed.length < drCafe.length, "WhatsApp does not list every dr.CAFE branch");
assert(wa.includes("wain.lol"), "WhatsApp points at the rest of the list");

// ---- QA r1 regressions (PR #280 r2) ----
const byId = new Map(shops.map((shop) => [shop.id, shop]));
const idList = (result: ReturnType<typeof pickCafes>) => result.picks.map((pick) => pick.shop.id);

// High 2: everyday words never hit the empty state or brand mode.
for (const ask of [
  "مقهى", "مقهي", "كافيه", "كافي", "أفضل مقهى", "افضل", "احسن", "الرياض", "مشهور", "جديد",
  "سهر", "عوائل", "بنات", "بن", "حليب", "هيل", "قهوة", "best", "open", "open now", "riyadh",
  "in riyadh", "latte", "new", "speciality", "roasters", "rooftop", "wifi", "kids", "date",
  "ladies", "women", "24 hours", "house", "home", "good", "nice", "sweet", "garden", "corner",
  "hello", "hi", "thanks", "coffee", "cafe", "café",
] as const) {
  const result = pickCafes({ text: ask });
  assert(result.noMatch !== true, `${ask} must not be no-match`);
  assert(result.mode === "browse", `${ask} must stay a normal pick, got ${result.mode}`);
  assert(result.picks.length === 3, `${ask} returns three cafés, got ${result.picks.length}`);
  assert(
    headingForPicks(result) === copy.threePicks[result.language],
    `${ask} keeps the locked three-cafés heading: ${headingForPicks(result)}`,
  );
}

// High 3: a café's own exact name finds it.
for (const [ask, id] of [
  ["Shafel Coffee Roastery", "shafel-roastery-al-yarmouk"],
  ["محمصة وقهوة نجد", "najd-roastery-al-munsiyah"],
  ["فوت | محمصة وقهوة مختصة", "voute-fot-al-naseem-sharqi"],
  ["ريشيو للقهوة المختصة", "ratio-speciality-tuwaiq"],
  ["A PLUS", "a-plus-as-salam"],
  ["Fill", "fill-umm-al-hamam-ash-sharqi"],
  ["molten", "molten-umm-al-hamam-ash-sharqi"],
  ["Found", "found-ar-rabwah"],
  ["BREATH", "breath-tuwaiq"],
  ["Lihaf", "lihaf-tuwaiq"],
  ["Trace", "trace-al-mursalat"],
] as const) {
  const result = pickCafes({ text: ask });
  assert(byId.has(id), `fixture ${id} exists`);
  assert(result.mode === "search", `${ask} is a name search, got ${result.mode}`);
  assert(idList(result).includes(id), `${ask} must find ${id}: ${idList(result).join(",")}`);
  assert(idList(result)[0] === id || ask === "Shafel Coffee Roastery", `${ask} leads with ${id}`);
}
{
  const shafel = pickCafes({ text: "Shafel Coffee Roastery" });
  sameIds(idList(shafel), shops.filter((shop) => shop.nameEn === "Shafel Coffee Roastery"), "Shafel keeps all three branches");
  const arid = pickCafes({ text: "محمصة قهوة شفل | العارض", language: "ar" });
  assert(idList(arid).join(",") === "shovel-al-arid", `Shovel Al Arid: ${idList(arid).join(",")}`);
  assert(!arid.outsideArea, "Shovel is in Al Arid, so no away line");
}

// High 4: no cross-brand bleed.
const onlyPrefix = (ask: string, prefix: string, count?: number) => {
  const result = pickCafes({ text: ask });
  const ids = idList(result);
  assert(result.mode === "search", `${ask} is a search, got ${result.mode}`);
  assert(ids.length > 0 && ids.every((id) => id.startsWith(prefix)), `${ask} bled: ${ids.join(",")}`);
  if (count != null) assert(ids.length === count, `${ask} count ${ids.length}, want ${count}`);
  assert(result.matchCount === ids.length, `${ask} heading counts what is shown`);
};
onlyPrefix("Black Wolf", "black-wolf", 1);
onlyPrefix("بلاك ولف", "black-wolf", 1);
onlyPrefix("Black Stamp", "black-stamp");
onlyPrefix("بي فاين", "befine-");
onlyPrefix("FYNE", "fyne-");
onlyPrefix("Half Million", "half-million");
onlyPrefix("هاف مليون", "half-million");
onlyPrefix("Half Ten", "half-ten", 1);
onlyPrefix("Coffee Address", "coffee-address");
onlyPrefix("Address Mood", "address-mood", 1);
onlyPrefix("Java Time", "java-time", 1);
onlyPrefix("Java Cafe", "java-cafe");
onlyPrefix("%Arabica", "percent-arabica");
assert(
  pickCafes({ text: "Half Million" }).picks.length === pickCafes({ text: "هاف مليون", language: "ar" }).picks.length,
  "Half Million EN and AR counts match",
);
assert(
  pickCafes({ text: "Coffee Address" }).picks.length === pickCafes({ text: "عنوان القهوة", language: "ar" }).picks.length,
  "Coffee Address EN and AR counts match",
);
onlyPrefix("Najd Roastery", "najd-roastery");
// Brands that share one local key stay apart; an exact name off the listing still shows.
assert(idList(pickCafes({ text: "Arabica Cafe" })).join(",") === "arabica-cafe-ghubairah", "Arabica Cafe is its own café");
assert(idList(pickCafes({ text: "Arabica coffee" })).join(",") === "arabica-coffee-al-wisham", "Arabica coffee is its own café");
assert(idList(pickCafes({ text: "Hjeen Roaster Factory" }))[0] === "hjeen-roaster-factory-al-yasmin", "exact branch name leads");

// High 5: drive words are not Drive Coffee unless it is named.
for (const ask of ["drive", "drive through", "drive thru", "درايف", "درايف ثرو", "سيارة درايف"] as const) {
  const result = pickCafes({ text: ask });
  assert(result.mode === "browse" && result.picks.length === 3, `${ask} is a normal pick, got ${result.mode} ${result.picks.length}`);
  assert(result.picks.filter((pick) => pick.shop.id.startsWith("drive-")).length <= 1, `${ask} dumped Drive Coffee`);
}
for (const ask of ["Drive Coffee", "درايف كوفي"] as const) {
  const result = pickCafes({ text: ask });
  assert(result.mode === "search", `${ask} names Drive Coffee`);
  assert(result.picks.every((pick) => isListingShop(pick.shop) && pick.shop.id.startsWith("drive-")), `${ask} lists listed Drive rows only`);
}

// Medium 6: counts are listed rows only.
for (const [ask, prefix] of [["dr.CAFE", "drcafe-"], ["Coffee Address", "coffee-address"], ["Java Cafe", "java-cafe"], ["AGRIO", "agrio-"]] as const) {
  const result = pickCafes({ text: ask });
  assert(result.picks.every((pick) => isListingShop(pick.shop)), `${ask} lists only listed rows`);
  const listedRows = shops.filter((shop) => shop.id.startsWith(prefix) && isListingShop(shop));
  assert(result.picks.length === listedRows.length, `${ask} ${result.picks.length} vs listed ${listedRows.length}`);
}
{
  // A branch word still finds that exact branch, listed or not.
  assert(idList(pickCafes({ text: "agrio rabi" })).join(",") === "agrio-al-rabi", "agrio rabi finds the Al Rabi lane");
  assert(idList(pickCafes({ text: "اقريو الربيع", language: "ar" })).join(",") === "agrio-al-rabi", "اقريو الربيع finds the Al Rabi lane");
  const unlisted = drCafeAll.find((shop) => !isListingShop(shop) && /drive|kkia|airport/i.test(shop.id + shop.nameEn));
  if (unlisted) {
    const ask = `dr cafe ${unlisted.id.replace(/^drcafe-/, "").replace(/-/g, " ")}`;
    assert(idList(pickCafes({ text: ask })).includes(unlisted.id), `${ask} finds ${unlisted.id}`);
  }
}

// Medium 7: short tokens and drink words are not brand mode (pin + two, as before).
for (const [ask, lead] of [
  ["dr", "drcafe-"], ["de", "fabrica-de-cafe"], ["b", "b-cafe"], ["ma", "ma-specialty"],
  ["ا", ""], ["دا", "da-nonna"], ["espresso", "pivot-espresso"], ["cold brew", ""], ["cup", ""],
  ["كوب", ""], ["بيت", ""], ["mood", ""], ["مزاج", ""], ["black", ""], ["half", ""],
  ["million", ""], ["art", ""], ["daily", ""], ["white", ""], ["address", "coffee-address"], ["عنوان", ""],
] as const) {
  const result = pickCafes({ text: ask });
  assert(result.mode === "browse", `${ask} must not be brand mode, got ${result.mode}`);
  assert(result.picks.length === 3, `${ask} returns three, got ${result.picks.length}`);
  assert(headingForPicks(result) === copy.threePicks[result.language], `${ask} keeps the three-cafés heading`);
  if (lead) assert(idList(result)[0]?.startsWith(lead), `${ask} still pins ${lead}: ${idList(result)[0]}`);
}

// Medium 8: cap 30; heading = cards shown.
{
  const multi = pickCafes({ text: "Starbucks or dr cafe" });
  assert(multi.picks.length <= 30 && multi.matchCount === multi.picks.length, `multi-brand ${multi.picks.length}/${multi.matchCount}`);
  const big = Array.from({ length: 55 }, (_, index) => {
    const base = starbucks[index % starbucks.length]!;
    return { ...base, id: `${base.id}-fixture-${index}` };
  });
  const fixture = pickCafes({ text: "starbucks", shops: big });
  assert(fixture.mode === "search", "55-branch fixture is a search");
  assert(fixture.picks.length <= 30, `cap is 30, got ${fixture.picks.length}`);
  assert(fixture.matchCount === fixture.picks.length, `heading count ${fixture.matchCount} = shown ${fixture.picks.length}`);
  assert(!headingForPicks(fixture).includes("55"), "heading never counts unshown cafés");
  const ids = shops.slice(0, 35).map((shop) => shop.id);
  assert(decodePackId(encodePackId({ locale: "en", shopIds: ids, ask: "x", search: true }))?.shopIds.length === 30, "pack cap is 30");
}

// Medium 9: the away line names the brand.
{
  const hjeen = pickCafes({ text: "hjeen in olaya" });
  assert(headingForPicks(hjeen).startsWith("No Hjeen in "), `hjeen away line: ${headingForPicks(hjeen)}`);
  assert(!headingForPicks(hjeen).includes("Factory"), "away line names the brand, not a branch");
}

// Low 11: Arabic dual.
{
  const dual = { ...pickCafes({ text: "FYNE", language: "ar" }) };
  const two = { ...dual, language: "ar" as const, picks: pickCafes({ text: "Namq" }).picks, matchCount: 2, didYouMean: { nameEn: "Namq", nameAr: "نمق" } };
  assert(headingForPicks(two) === "قصدك نمق؟ لقينا فرعين", `dual: ${headingForPicks(two)}`);
  assert(copy.showMoreOne.ar === "اعرض قهوة وحدة زيادة" && copy.showMoreTwo.ar === "اعرض قهوتين زيادة", "show-more singular/dual");
}

// Low 10: Show more a11y.
{
  const pickList = readFileSync(new URL("../components/pick-list.tsx", import.meta.url), "utf8");
  assert(pickList.includes("aria-expanded={expanded}") && pickList.includes("aria-controls={listId}"), "show more has aria-expanded/controls");
  assert(pickList.includes("copy.showLess[language]"), "show more can collapse");
  assert(pickList.includes('focusAfter.current = expanded ? "toggle" : "revealed"'), "focus moves to the revealed card");
  assert(pickList.includes("pickIndex: pick.rank ?? index"), "map clicks log the server rank");
}

// Low 12: logging covers search lists.
{
  const learn = readFileSync(new URL("../lib/learn.ts", import.meta.url), "utf8");
  assert(learn.includes("LEARN_MAX_PICKS = 30") && !learn.includes("shopIds.length !== 3") && !learn.includes("pickIndex > 2"), "learn logs 1–30 cards");
}

// Low 13: Krispy Kreme and negation.
for (const ask of ["Krispy Kreme", "كرسبي كريم", "krispy"] as const) {
  const result = pickCafes({ text: ask });
  assert(result.picks.length === 0 && result.excludedBrand?.donut === true, `${ask} is a not-listed donut brand`);
  assert((result.suggestions ?? []).length === 0, `${ask} adds no suggestions`);
  assert(headingForPicks(result).includes(result.language === "ar" ? "مو موجودة في وين" : "isn't listed on Wain"), `${ask}: ${headingForPicks(result)}`);
}
assert(
  headingForPicks(pickCafes({ text: "Dunkin" })) === copy.brandNotListedDonut.en &&
    copy.brandNotListedDonut.en === "Dunkin' isn't listed on Wain. The list is coffee, and Dunkin' is a donut and dessert chain." &&
    copy.brandNotListedDonut.ar === "دانكن مو موجودة في وين. القائمة للقهوة، ودانكن سلسلة دونات وحلويات.",
  "Dunkin' copy is unchanged",
);
for (const ask of ["مو ستاربكس", "not starbucks"] as const) {
  const result = pickCafes({ text: ask });
  assert(result.noMatch !== true && result.mode === "browse" && result.picks.length === 3, `${ask} is a normal pick`);
  assert(result.picks.every((pick) => pick.shop.chainBrand !== "starbucks"), `${ask} keeps Starbucks out`);
}
assert(pickCafes({ text: "xyzzyq" }).noMatch === true, "a name-looking unknown still gets no-match");

console.log("check-search-quality: ok");
console.log(
  `starbucks ${starbucks.length}, dr.CAFE ${drCafe.length}, al mathar ${matharIds.length}`,
);
