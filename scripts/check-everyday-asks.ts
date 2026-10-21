/**
 * QA r2 H2: the empty state is for a failed café-name lookup only.
 * QA's 172 everyday asks (wain-qa-pr280 r2 probe q2.json) must match main
 * 1102248c: no empty state, and every non-name ask is main's three-pack under
 * the locked heading. The nine exact café names below stay a search on purpose
 * (QA r1 High 3: the name typed alone finds the café).
 */
import { readFileSync } from "node:fs";
import {
  catalogViewFromQuery,
  isListingShop,
  listRealShops,
  listShops,
  selectCatalogShops,
} from "../lib/catalog";
import { copy } from "../lib/copy";
import { isNonWordLookup } from "../lib/fuzzy-name";
import { headingForPicks, pickCafes } from "../lib/picker";
import type { Language } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const langOf = (text: string): Language => (/[\u0600-\u06FF]/.test(text) ? "ar" : "en");

const EVERYDAY_172 = [
  "drive through",
  "drive-thru",
  "drive thru",
  "درايف",
  "درايف ثرو",
  "سيارة درايف",
  "Drive Coffee",
  "درايف كوفي",
  "black",
  "white",
  "brown",
  "house",
  "home",
  "cup",
  "bean",
  "beans",
  "roasters",
  "garden",
  "corner",
  "lab",
  "box",
  "time",
  "address",
  "million",
  "half",
  "good",
  "nice",
  "coffee bar",
  "coffee house",
  "coffee shop",
  "cafe near me",
  "specialty coffee",
  "sweet",
  "mood",
  "daily",
  "art",
  "urban",
  "عنوان",
  "بيت",
  "ركن",
  "حديقة",
  "بن",
  "فنجان",
  "كوب",
  "مزاج",
  "يومي",
  "فن",
  "هيل",
  "سكر",
  "حليب",
  "night",
  "24 hours",
  "24/7",
  "late",
  "study cafe",
  "wifi",
  "work",
  "quiet cafe",
  "kids",
  "family",
  "date",
  "ladies",
  "women",
  "men",
  "rooftop",
  "garden cafe",
  "outdoor seating",
  "جلسات خارجية",
  "دراسة",
  "شغل",
  "سهر",
  "بنات",
  "عوائل",
  "رووف",
  "هادئ",
  "مزدحم",
  "ترند",
  "trending",
  "popular",
  "مشهور",
  "جديد",
  "أفضل مقهى",
  "مقهى",
  "كافيه",
  "best",
  "open",
  "riyadh",
  "الرياض",
  "latte",
  "speciality",
  "espresso",
  "cold brew",
  "dr",
  "de",
  "b",
  "ma",
  "ا",
  "دا",
  "hello",
  "vibe",
  "table",
  "menu",
  "price",
  "cheap",
  "رخيص",
  "سعر",
  "parking",
  "مواقف",
  "quiet",
  "هادي",
  "pretty",
  "aesthetic",
  "instagram",
  "تصوير",
  "coffee with view",
  "قهوة مع اطلالة",
  "moka",
  "mocha",
  "موكا",
  "flat white",
  "cortado",
  "كورتادو",
  "cappuccino",
  "كابتشينو",
  "tea",
  "شاي",
  "juice",
  "عصير",
  "cake",
  "كيك",
  "cookies",
  "بسكويت",
  "croissant",
  "كرواسون",
  "sandwich",
  "ساندويتش",
  "breakfast",
  "فطور",
  "lunch",
  "غداء",
  "dinner",
  "عشاء",
  "open late",
  "مفتوح الحين",
  "24 ساعة",
  "ramadan",
  "رمضان",
  "eid",
  "عيد",
  "the best",
  "the",
  "a cafe",
  "any cafe",
  "أي مقهى",
  "مقهى قريب",
  "coffee in olaya",
  "قهوة في العليا",
  "best cafe in malqa",
  "افضل كافيه في الملقا",
  "not starbucks",
  "مو ستاربكس",
  "without chains",
  "بدون سلاسل",
  "local",
  "محلي",
  "found",
  "lihaf",
  "لحاف",
  "breath",
  "fill",
  "trace",
  "molten",
] as const;

/** The 49 asks r2 wrongly sent to the empty state (QA r2 H2). */
const QA_R2_EMPTY_49 = [
  "brown",
  "box",
  "urban",
  "ركن",
  "حديقة",
  "يومي",
  "سكر",
  "men",
  "vibe",
  "table",
  "menu",
  "price",
  "cheap",
  "رخيص",
  "سعر",
  "parking",
  "مواقف",
  "pretty",
  "aesthetic",
  "instagram",
  "تصوير",
  "moka",
  "موكا",
  "cortado",
  "كورتادو",
  "كابتشينو",
  "شاي",
  "juice",
  "عصير",
  "كيك",
  "cookies",
  "بسكويت",
  "sandwich",
  "ساندويتش",
  "lunch",
  "غداء",
  "dinner",
  "عشاء",
  "مفتوح الحين",
  "24 ساعة",
  "ramadan",
  "رمضان",
  "eid",
  "عيد",
  "without chains",
  "بدون سلاسل",
  "local",
  "محلي",
  "لحاف",
] as const;

/** Named in the r3 task next to the 49. */
const ALSO_EVERYDAY = [
  "molten cake",
  "molten chocolate",
  "lost and found",
  "fill up",
  "take a breath",
  "trace of cardamom",
  "☕",
  "24h",
  "7am",
  "24hours",
  "rhythm",
  "asdfgh",
  "مقهى",
  "best",
  "wifi",
  "not starbucks",
  "قهوة",
] as const;

/** Exact café names typed alone: a search, never the empty state. */
const EXACT_NAME_SEARCHES = new Set<string>(["Drive Coffee", "درايف كوفي", "رووف", "found", "lihaf", "breath", "fill", "trace", "molten"]);

assert(EVERYDAY_172.length === 172, `172 asks, got ${EVERYDAY_172.length}`);
assert(QA_R2_EMPTY_49.length === 49, `49 probes, got ${QA_R2_EMPTY_49.length}`);
const locked = (language: Language) => copy.threePicks[language];
assert(copy.threePicks.ar === "ثلاث قهاوي تناسب اختيارك", "locked AR heading unchanged");

function threePack(ask: string, label: string) {
  const language = langOf(ask);
  const result = pickCafes({ text: ask, language });
  assert(result.noMatch !== true, `${label}: ${ask} must not be the empty state`);
  assert(result.mode === "browse", `${label}: ${ask} is a three-pack, got ${result.mode}`);
  assert(result.picks.length === 3, `${label}: ${ask} shows 3, got ${result.picks.length}`);
  const heading = headingForPicks(result);
  assert(heading === locked(language), `${label}: ${ask} heading ${heading}`);
}

let searches = 0;
for (const ask of EVERYDAY_172) {
  if (EXACT_NAME_SEARCHES.has(ask)) {
    const result = pickCafes({ text: ask, language: langOf(ask) });
    assert(result.noMatch !== true && result.mode === "search" && result.picks.length > 0, `${ask} finds the café`);
    searches += 1;
    continue;
  }
  threePack(ask, "everyday");
}
assert(searches === EXACT_NAME_SEARCHES.size, "every exact-name search is in the 172");
for (const ask of QA_R2_EMPTY_49) threePack(ask, "QA r2 H2");
for (const ask of ALSO_EVERYDAY) threePack(ask, "everyday extra");

// Typed nearby on the server (the pin stays on the device) is a three-pack too.
for (const ask of ["قريب مني", "nearby"]) {
  const result = pickCafes({ text: ask, language: langOf(ask) });
  assert(result.noMatch !== true && result.picks.length === 3, `${ask} is a three-pack`);
}

// A failed name lookup is still the empty state.
for (const ask of ["xyzcafe123", "xyzzyq", "cafe2024"]) {
  const result = pickCafes({ text: ask, language: "en" });
  assert(result.noMatch === true && result.picks.length === 0, `${ask} is a failed name lookup`);
  assert(headingForPicks(result) === copy.noMatch.en, `${ask}: ${headingForPicks(result)}`);
}
for (const ask of ["xyzcafe123", "xyzzyq", "abc123"]) assert(isNonWordLookup(ask), `${ask} is a non-word`);
for (const ask of ["24h", "7am", "30sar", "rhythm", "nymph", "cheap", "lunch", "كابتشينو", "☕", "24 ساعة"]) {
  assert(!isNonWordLookup(ask), `${ask} is not a non-word`);
}
// A whole-ask near-miss on two names (a chain and a café) is the empty state.
{
  const real = listRealShops();
  const base = real.find((shop) => !shop.chainBrand)!;
  const fixture = [...real, { ...base, id: "fx-starbacks", nameEn: "Starbacks", nameAr: "ستارباكس" }];
  const tie = pickCafes({ text: "Starbicks", language: "en", shops: fixture });
  assert(tie.noMatch === true && tie.picks.length === 0, "Starbicks ties Starbucks and Starbacks");
  const typo = pickCafes({ text: "Starbuks", language: "en" });
  assert(typo.mode === "search" && typo.didYouMean?.nameEn === "Starbucks", "a one-name typo still corrects");
}

// Cap: 30 cards, and the heading says how many match (QA r2 Low 3).
{
  const result = pickCafes({ text: "Starbucks dr.CAFE Coffee Address", language: "en" });
  assert(result.picks.length === 30 && result.matchCount === 30, `cap shows 30, got ${result.picks.length}`);
  assert((result.matchTotal ?? 0) > 30, `cap keeps the total, got ${result.matchTotal}`);
  const heading = headingForPicks(result);
  assert(heading === `${result.matchTotal} cafés match your search. Showing the first 30`, heading);
  const ar = headingForPicks({ ...result, language: "ar" });
  assert(ar === `لقينا ${result.matchTotal} قهوة تناسب بحثك، هذي أول 30`, ar);
  const dym = headingForPicks({ ...result, didYouMean: { nameEn: "Starbucks", nameAr: "ستاربكس" } });
  assert(dym.includes(`${result.matchTotal} branches match. Showing the first 30`), dym);
  const small = pickCafes({ text: "Starbucks", language: "en" });
  assert(small.matchTotal === undefined, "under the cap there is no total");
  assert(headingForPicks(small) === `${small.picks.length} cafés match your search`, headingForPicks(small));
  for (const language of ["ar", "en"] as const) {
    assert(copy.searchMatchCapped[language].includes("{total}") && copy.searchMatchCapped[language].includes("{count}"), "capped copy");
    assert(copy.didYouMeanCapped[language].includes("{total}"), "capped did-you-mean copy");
  }
}

// The public catalog query helper is listed-only (QA r2 Low 5).
{
  const all = listShops();
  const unlisted = selectCatalogShops(all, "pages").filter((shop) => !isListingShop(shop));
  assert(unlisted.length > 0, "the catalog has drive-through / pickup-only rows");
  for (const value of [undefined, null, "", "pages", "all", "drive-through", "listing", "LISTING", "x"]) {
    const view = catalogViewFromQuery(value);
    assert(view === "listing", `${String(value)} maps to listing, got ${view}`);
  }
  assert(catalogViewFromQuery("discovery") === "discovery", "discovery stays");
  for (const value of ["pages", "all", "drive-through", undefined, "discovery"]) {
    const rows = selectCatalogShops(all, catalogViewFromQuery(value));
    assert(rows.every((shop) => isListingShop(shop)), `${String(value)} exposes no unlisted row`);
  }
}

// Typed nearby clears the composer (QA r2 Low 1).
{
  const chat = readFileSync(new URL("../components/chat.tsx", import.meta.url), "utf8");
  const start = chat.indexOf("isNearbyAsk(trimmed)) {");
  const block = chat.slice(start, chat.indexOf("return;", start));
  assert(start > 0 && block.includes('setDraft("")') && block.includes("sendNearby(trimmed)"), "typed nearby clears the input");
  assert(!block.includes("lat") && !block.includes("lng"), "typed nearby sends no pin");
}

console.log(`check-everyday-asks: ok (${EVERYDAY_172.length} everyday, ${QA_R2_EMPTY_49.length} QA probes)`);
