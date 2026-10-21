import { listRealShops } from "../lib/catalog";
import { copy } from "../lib/copy";
import { decodePackId, encodePackId } from "../lib/pack";
import { formatWhatsAppReply, headingForPicks, pickCafes } from "../lib/picker";
import { officialShopCoords } from "../lib/place-coords";
import { normalizeShopText } from "../lib/shop-name";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function idsOf(text: string, language: "ar" | "en" = "en") {
  return pickCafes({ text, language });
}

const shops = listRealShops();
const starbucks = shops.filter((shop) => shop.chainBrand === "starbucks");
const drCafe = shops.filter((shop) => shop.chainBrand === "dr-cafe");
assert(starbucks.length >= 8, `expected the Starbucks branches, got ${starbucks.length}`);
assert(drCafe.length >= 22, `expected the dr.CAFE branches, got ${drCafe.length}`);

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

const anchor = starbucks
  .map((shop) => ({ shop, coords: officialShopCoords(shop) }))
  .find((row) => row.coords);
assert(anchor?.coords, "a Starbucks branch has a pin");
const nearest = pickCafes({
  text: "starbucks",
  language: "en",
  origin: anchor!.coords!,
});
assert(
  nearest.picks[0]?.shop.id === anchor!.shop.id,
  `distance sort should lead with ${anchor!.shop.id}, got ${nearest.picks[0]?.shop.id}`,
);
sameIds(
  nearest.picks.map((pick) => pick.shop.id),
  starbucks,
  "distance sort still returns every Starbucks branch",
);

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
assert(drops.noMatch === true, "drops is not a match");
assert(!drops.didYouMean, `drops must not suggest ${drops.didYouMean?.nameEn}`);
assert(drops.picks.length === 0, "drops returns no picks");

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

console.log("check-search-quality: ok");
console.log(
  `starbucks ${starbucks.length}, dr.CAFE ${drCafe.length}, al mathar ${matharIds.length}`,
);
