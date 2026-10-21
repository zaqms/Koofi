import { listRealShops } from "../lib/catalog";
import { copy } from "../lib/copy";
import { headingForPicks, pickCafes } from "../lib/picker";
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

console.log("check-search-quality: ok");
console.log(
  `starbucks ${starbucks.length}, dr.CAFE ${drCafe.length}, al mathar ${matharIds.length}`,
);
