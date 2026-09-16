import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getShop, listDirectoryShops, listRealShops } from "../lib/catalog";
import { listNewThisWeekShops, NEW_THIS_WEEK_IDS } from "../lib/new-this-week";
import { copy } from "../lib/copy";
import {
  districtDescription,
  districtMetadata,
  districtTitle,
  resolveDistrictSlug,
} from "../lib/district";
import {
  COFFEE_SHOPS_CATEGORY,
  categoryDistrictHeading,
} from "../lib/directory-category";
import {
  directoryNeighborhoods,
  filterDirectoryShops,
} from "../lib/directory";
import { neighborhoodLabel } from "../lib/neighborhoods";
import { parseIntent } from "../lib/parse-intent";
import {
  listPopularDirectoryShops,
  mostPopularDescription,
  mostPopularMetadata,
  mostPopularTitle,
} from "../lib/most-popular";
import { TEMPORARY_DEFAULT_LANDING_MOST_POPULAR } from "../lib/landing-experiment";
import {
  categoryDistrictPath,
  districtPath,
  filterPutsDirectoryFirst,
  homePath,
  LEGACY_SHOP_REDIRECTS,
  legacyDistrictPath,
  MOST_POPULAR_EN_ALIAS_PATH,
  MOST_POPULAR_HEADING,
  MOST_POPULAR_SLUG,
  mostPopularHeading,
  mostPopularPath,
  neighborhoodsPath,
  PRODUCT_NAME,
} from "../lib/product";
import { rankByPopularity } from "../lib/picker";
import { buildSitemapXml } from "../lib/sitemap-xml";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

assert(resolveDistrictSlug("ghirnatah") === "ghirnatah", "ghirnatah resolves");
assert(resolveDistrictSlug("al-shohda") === "al-shohda", "al-shohda resolves");
assert(resolveDistrictSlug("al-safa") === "al-safa", "al-safa resolves");
assert(resolveDistrictSlug("al-rawdah") === "al-rawdah", "al-rawdah resolves");
assert(resolveDistrictSlug("qurtubah") === "qurtubah", "qurtubah resolves");
assert(resolveDistrictSlug("an-nazhah") === "an-nazhah", "an-nazhah resolves");
assert(resolveDistrictSlug("al-hamra") === "al-hamra", "al-hamra resolves");
assert(resolveDistrictSlug("al-yarmouk") === "al-yarmouk", "al-yarmouk resolves");
assert(resolveDistrictSlug("al-nahdah") === "al-nahdah", "al-nahdah resolves");
assert(resolveDistrictSlug("al-manar") === "al-manar", "al-manar resolves");
assert(resolveDistrictSlug("al-rayyan") === "al-rayyan", "al-rayyan resolves");
assert(resolveDistrictSlug("al-rawabi") === "al-rawabi", "al-rawabi resolves");
assert(resolveDistrictSlug("al-fayha") === "al-fayha", "al-fayha resolves");
assert(resolveDistrictSlug("al-raqban") === "al-raqban", "al-raqban resolves");
assert(resolveDistrictSlug("al-munsiyah") === "al-munsiyah", "al-munsiyah resolves");
assert(resolveDistrictSlug("an-nada") === "an-nada", "an-nada resolves");
assert(resolveDistrictSlug("diplomatic-quarter") === "diplomatic-quarter", "diplomatic-quarter resolves");
assert(resolveDistrictSlug("king-fahd") === "king-fahd", "king-fahd resolves");
assert(resolveDistrictSlug("al-takhassusi") === "al-takhassusi", "al-takhassusi resolves");
assert(resolveDistrictSlug("al-aqiq") === "al-aqiq", "al-aqiq resolves");
assert(resolveDistrictSlug("al-ghadeer") === "al-ghadeer", "al-ghadeer resolves");
assert(resolveDistrictSlug("al-arid") === "al-arid", "al-arid resolves");
assert(resolveDistrictSlug("al-qirawan") === "al-qirawan", "al-qirawan resolves");
assert(resolveDistrictSlug("al-wadi") === "al-wadi", "al-wadi resolves");
assert(resolveDistrictSlug("al-mohammadiyah") === "al-mohammadiyah", "al-mohammadiyah resolves");
assert(resolveDistrictSlug("al-muruj") === "al-muruj", "al-muruj resolves");
assert(resolveDistrictSlug("al-malaz") === "al-malaz", "al-malaz resolves");
assert(resolveDistrictSlug("al-mathar") === "al-mathar", "al-mathar resolves");
assert(resolveDistrictSlug("al-yarmuk") === null, "al-yarmuk is not the catalog slug");
assert(resolveDistrictSlug("al-nahda") === null, "al-nahda is not the catalog slug");
assert(resolveDistrictSlug("not-a-hood") === null, "unknown slug is null");
assert(resolveDistrictSlug("غرناطة") === null, "Arabic label is not a slug");

assert(
  districtPath("al-malqa", "ar") === "/coffee-shops/al-malqa",
  "AR coffee-shops path",
);
assert(
  districtPath("ghirnatah", "en") === "/en/coffee-shops/ghirnatah",
  "EN coffee-shops path",
);
assert(
  categoryDistrictPath(COFFEE_SHOPS_CATEGORY, "al-malqa", "ar") ===
    "/coffee-shops/al-malqa",
  "category helper matches v1",
);
assert(
  legacyDistrictPath("ghirnatah", "ar") === "/n/ghirnatah",
  "legacy AR path kept for redirects",
);
assert(
  legacyDistrictPath("al-shohda", "en") === "/en/n/al-shohda",
  "legacy EN path kept for redirects",
);
assert(homePath("ar") === "/", "AR home");
assert(homePath("en") === "/en", "EN home");
assert(neighborhoodsPath("ar") === "/neighborhoods", "AR view-all neighborhoods");
assert(neighborhoodsPath("en") === "/en/neighborhoods", "EN view-all neighborhoods");

const shops = listDirectoryShops();
const areas = directoryNeighborhoods(shops);
assert(areas.includes("ghirnatah"), "directory includes ghirnatah");
assert(areas.includes("al-shohda"), "directory includes al-shohda");
assert(areas.includes("al-safa"), "directory includes al-safa");
assert(areas.includes("al-rawdah"), "directory includes al-rawdah");
assert(areas.includes("qurtubah"), "directory includes qurtubah");
assert(areas.includes("an-nazhah"), "directory includes an-nazhah");
assert(areas.includes("al-hamra"), "directory includes al-hamra");
assert(areas.includes("al-yarmouk"), "directory includes al-yarmouk");
assert(areas.includes("al-nahdah"), "directory includes al-nahdah");
assert(areas.includes("al-manar"), "directory includes al-manar");
assert(areas.includes("al-rayyan"), "directory includes al-rayyan");
assert(areas.includes("al-rawabi"), "directory includes al-rawabi");
assert(areas.includes("al-fayha"), "directory includes al-fayha");
assert(areas.includes("al-raqban"), "directory includes al-raqban");
assert(areas.includes("al-munsiyah"), "directory includes al-munsiyah");
assert(areas.includes("an-nada"), "directory includes an-nada");
assert(areas.includes("diplomatic-quarter"), "directory includes diplomatic-quarter");
assert(areas.includes("king-fahd"), "directory includes king-fahd");
assert(areas.includes("al-takhassusi"), "directory includes al-takhassusi");
assert(areas.includes("al-aqiq"), "directory includes al-aqiq");
assert(areas.includes("al-ghadeer"), "directory includes al-ghadeer");
assert(areas.includes("al-arid"), "directory includes al-arid");
assert(areas.includes("al-qirawan"), "directory includes al-qirawan");
assert(areas.includes("al-wadi"), "directory includes al-wadi");
assert(areas.includes("al-muruj"), "directory includes al-muruj");
assert(areas.includes("al-mohammadiyah"), "directory includes al-mohammadiyah");
assert(areas.includes("al-malaz"), "directory includes al-malaz");
assert(areas.includes("al-mathar"), "directory includes al-mathar");
assert(areas.length === 44, `expected 44 districts, got ${areas.length}`);
assert(listRealShops().length === 269, `catalog 255→269, got ${listRealShops().length}`);

const granada = filterDirectoryShops(shops, "ghirnatah");
assert(granada.length > 0, "ghirnatah has shops");
assert(
  granada.every((shop) => shop.neighborhood === "ghirnatah"),
  "ghirnatah filter stays in district",
);

const shohda = filterDirectoryShops(shops, "al-shohda");
assert(shohda.length > 0, "al-shohda has shops");
assert(
  shohda.every((shop) => shop.neighborhood === "al-shohda"),
  "al-shohda filter stays in district",
);

const safa = filterDirectoryShops(shops, "al-safa");
assert(safa.length > 0, "al-safa has shops");
assert(
  safa.every((shop) => shop.neighborhood === "al-safa"),
  "al-safa filter stays in district",
);
assert(
  safa.some((shop) => shop.id === "blumen-al-safa"),
  "al-safa includes blumen-al-safa",
);
assert(
  safa.some((shop) => shop.id === "hawaf-al-safa"),
  "al-safa includes hawaf-al-safa",
);
assert(
  safa.some((shop) => shop.id === "recaf-al-safa"),
  "al-safa includes recaf-al-safa",
);
assert(
  safa.some((shop) => shop.id === "raslania-al-safa"),
  "al-safa includes raslania-al-safa",
);
assert(
  safa.some((shop) => shop.id === "dyar-bakery-al-safa"),
  "al-safa includes dyar-bakery-al-safa",
);
assert(
  neighborhoodLabel("al-safa", "ar") === "الصفا",
  "al-safa Arabic label",
);
assert(
  neighborhoodLabel("al-safa", "en") === "Al Safa",
  "al-safa English label",
);
assert(
  districtPath("al-safa", "ar") === "/coffee-shops/al-safa",
  "AR al-safa coffee-shops path",
);

const blumen = shops.find((shop) => shop.id === "blumen-al-safa");
assert(blumen, "blumen-al-safa is in the directory");
assert(
  blumen.mapsHref ===
    "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f07007140839d:0xbbb6a718fc72c7d1",
  "blumen maps href is official place id form",
);
assert(blumen.lat === 24.6705282 && blumen.lng === 46.7810145, "blumen official pin");

const blumenCatalog = getShop("blumen-al-safa");
assert(blumenCatalog, "blumen-al-safa is a real catalog shop");
assert(!("hours" in blumenCatalog), "blumen catalog has no hours field");
assert(blumenCatalog.example === false, "blumen is not an example shop");

for (const ask of ["الصفا", "صفا", "safa", "al safa", "al-safa"]) {
  const intent = parseIntent(ask);
  assert(
    intent.neighborhoods.includes("al-safa"),
    `parseIntent(${ask}) should hit al-safa`,
  );
}

const rabwah = filterDirectoryShops(shops, "al-rabwah");
assert(rabwah.length > 0, "al-rabwah has shops");
assert(
  rabwah.every((shop) => shop.neighborhood === "al-rabwah"),
  "al-rabwah filter stays in district",
);
for (const id of [
  "jazwa-specialty-coffee-ar-rabwah",
  "makhsousa-coffee-ar-rabwah",
  "blog-coffee-ar-rabwah",
  "enzo-coffee-ar-rabwah",
  "window-coffee-ar-rabwah",
  "b-cafe-ar-rabwah",
]) {
  assert(
    rabwah.some((shop) => shop.id === id),
    `al-rabwah includes ${id}`,
  );
}

const rawdah = filterDirectoryShops(shops, "al-rawdah");
assert(rawdah.length > 0, "al-rawdah has shops");
assert(
  rawdah.every((shop) => shop.neighborhood === "al-rawdah"),
  "al-rawdah filter stays in district",
);
assert(rawdah.length === 3, `al-rawdah has 3 shops, got ${rawdah.length}`);
assert(
  rawdah.some((shop) => shop.id === "hai-coffee-roasters-al-rawdah"),
  "al-rawdah includes hai-coffee-roasters-al-rawdah",
);
assert(
  rawdah.some((shop) => shop.id === "on-al-rawdah"),
  "al-rawdah includes on-al-rawdah",
);
assert(
  rawdah.some((shop) => shop.id === "steam-roastery-al-rawdah"),
  "al-rawdah includes steam-roastery-al-rawdah",
);
assert(
  neighborhoodLabel("al-rawdah", "ar") === "الروضة",
  "al-rawdah Arabic label",
);
assert(
  neighborhoodLabel("al-rawdah", "en") === "Al Rawdah",
  "al-rawdah English label",
);
assert(
  districtPath("al-rawdah", "ar") === "/coffee-shops/al-rawdah",
  "AR al-rawdah coffee-shops path",
);
assert(
  districtPath("al-rawdah", "en") === "/en/coffee-shops/al-rawdah",
  "EN al-rawdah coffee-shops path",
);

const rawdahIntentAsks = [
  "الروضة",
  "روضة",
  "rawdah",
  "rawda",
  "al rawdah",
  "al-rawdah",
];
for (const ask of rawdahIntentAsks) {
  const intent = parseIntent(ask);
  assert(
    intent.neighborhoods.includes("al-rawdah"),
    `parseIntent(${ask}) should hit al-rawdah`,
  );
  assert(
    !intent.neighborhoods.includes("al-rabwah"),
    `parseIntent(${ask}) must not hit al-rabwah`,
  );
}

const rabwahIntent = parseIntent("الربوة");
assert(
  rabwahIntent.neighborhoods.includes("al-rabwah"),
  "parseIntent(الربوة) should hit al-rabwah",
);
assert(
  !rabwahIntent.neighborhoods.includes("al-rawdah"),
  "parseIntent(الربوة) must not hit al-rawdah",
);

const qurtubah = filterDirectoryShops(shops, "qurtubah");
assert(qurtubah.length === 12, `qurtubah has 12 shops, got ${qurtubah.length}`);
assert(
  qurtubah.every((shop) => shop.neighborhood === "qurtubah"),
  "qurtubah filter stays in district",
);
for (const id of [
  "coffeehood-qurtubah",
  "obo-qurtubah",
  "lattio-lounge-qurtubah",
  "n5-caffe-qurtubah",
  "cacti-roastery-qurtubah",
  "najd-roastery-qurtubah",
  "najd-alathiah-qurtubah",
  "klatch-qurtubah",
  "nosound-qurtubah",
  "vanilla-coffee-qurtubah",
  "mill-coffee-qurtubah",
  "cofen-qurtubah",
]) {
  assert(
    qurtubah.some((shop) => shop.id === id),
    `qurtubah includes ${id}`,
  );
}
assert(
  neighborhoodLabel("qurtubah", "ar") === "قرطبة",
  "qurtubah Arabic label",
);
assert(
  neighborhoodLabel("qurtubah", "en") === "Qurtubah",
  "qurtubah English label",
);
assert(
  districtPath("qurtubah", "ar") === "/coffee-shops/qurtubah",
  "AR qurtubah coffee-shops path",
);
assert(
  districtPath("qurtubah", "en") === "/en/coffee-shops/qurtubah",
  "EN qurtubah coffee-shops path",
);

const qurtubahIntentAsks = [
  "قرطبة",
  "قرطبه",
  "qurtubah",
  "qurtoba",
  "al qurtubah",
  "al-qurtubah",
];
for (const ask of qurtubahIntentAsks) {
  const intent = parseIntent(ask);
  assert(
    intent.neighborhoods.includes("qurtubah"),
    `parseIntent(${ask}) should hit qurtubah`,
  );
}

const nuzhah = filterDirectoryShops(shops, "an-nazhah");
assert(nuzhah.length === 10, `an-nazhah has 10 shops, got ${nuzhah.length}`);
assert(
  nuzhah.every((shop) => shop.neighborhood === "an-nazhah"),
  "an-nazhah filter stays in district",
);
for (const id of [
  "mud-speciality-coffee-an-nazhah",
  "wathba-an-nazhah",
  "moraq-cafe-an-nazhah",
  "november-coffee-an-nazhah",
  "elite-cup-roasters-an-nazhah",
  "belong-an-nazhah",
  "desired-coffee-an-nazhah",
  "cross-coffee-an-nazhah",
  "kraz-an-nazhah",
  "ghandoura-an-nazhah",
]) {
  assert(
    nuzhah.some((shop) => shop.id === id),
    `an-nazhah includes ${id}`,
  );
}
assert(
  neighborhoodLabel("an-nazhah", "ar") === "النزهة",
  "an-nazhah Arabic label",
);
assert(
  neighborhoodLabel("an-nazhah", "en") === "An Nuzhah",
  "an-nazhah English label",
);
assert(
  districtPath("an-nazhah", "ar") === "/coffee-shops/an-nazhah",
  "AR an-nazhah coffee-shops path",
);
assert(
  districtPath("an-nazhah", "en") === "/en/coffee-shops/an-nazhah",
  "EN an-nazhah coffee-shops path",
);

const nuzhahIntentAsks = [
  "النزهة",
  "نزهة",
  "nuzhah",
  "an nuzhah",
  "an-nazhah",
];
for (const ask of nuzhahIntentAsks) {
  const intent = parseIntent(ask);
  assert(
    intent.neighborhoods.includes("an-nazhah"),
    `parseIntent(${ask}) should hit an-nazhah`,
  );
}

const ghandoura = shops.find((shop) => shop.id === "ghandoura-an-nazhah");
assert(ghandoura, "ghandoura-an-nazhah is in the directory");
assert(
  ghandoura.mapsHref ===
    "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f03424178439d:0x9d0a63b8efe7b615",
  "ghandoura maps href is Amjad corrected place id",
);

const hamra = filterDirectoryShops(shops, "al-hamra");
assert(hamra.length === 10, `al-hamra has 10 shops, got ${hamra.length}`);
assert(
  hamra.every((shop) => shop.neighborhood === "al-hamra"),
  "al-hamra filter stays in district",
);
for (const id of [
  "serene-coffee-roastery",
  "rimthan-coffee-al-hamra",
  "mind-break-al-hamra",
  "jather-al-hamra",
  "harf-coffee-al-hamra",
  "zeila-al-hamra",
  "cord-cafe-al-hamra",
  "drip-al-hamra",
  "coffee-address-al-hamra",
  "glint-al-hamra",
]) {
  assert(
    hamra.some((shop) => shop.id === id),
    `al-hamra includes ${id}`,
  );
}
assert(
  neighborhoodLabel("al-hamra", "ar") === "الحمراء",
  "al-hamra Arabic label",
);
assert(
  neighborhoodLabel("al-hamra", "en") === "Al Hamra",
  "al-hamra English label",
);
assert(
  districtPath("al-hamra", "ar") === "/coffee-shops/al-hamra",
  "AR al-hamra coffee-shops path",
);
assert(
  districtPath("al-hamra", "en") === "/en/coffee-shops/al-hamra",
  "EN al-hamra coffee-shops path",
);

const hamraIntentAsks = [
  "الحمراء",
  "حمراء",
  "hamra",
  "al hamra",
  "al-hamra",
  "alhamra",
  "Al Hamra",
];
for (const ask of hamraIntentAsks) {
  const intent = parseIntent(ask);
  assert(
    intent.neighborhoods.includes("al-hamra"),
    `parseIntent(${ask}) should hit al-hamra`,
  );
}

const dripOlaya = getShop("drip-olaya");
assert(dripOlaya, "drip-olaya stays in the catalog");
assert(dripOlaya.neighborhood === "olaya", "drip-olaya stays Olaya");
assert(
  dripOlaya.mapsShareUrl ===
    "https://www.google.com/maps/place/data=!4m2!3m1!1s0x3e2f037e720ece5b:0x59f110b0efd484fe",
  "drip-olaya maps pin stays untouched",
);
const dripHamra = getShop("drip-al-hamra");
assert(dripHamra, "drip-al-hamra is a distinct catalog shop");
assert(dripHamra.neighborhood === "al-hamra", "drip-al-hamra is Al Hamra");
assert(
  dripHamra.mapsShareUrl !== dripOlaya.mapsShareUrl,
  "drip-al-hamra uses a distinct official place hex",
);

const yarmouk = filterDirectoryShops(shops, "al-yarmouk");
assert(yarmouk.length === 10, `al-yarmouk has 10 shops, got ${yarmouk.length}`);
assert(
  yarmouk.every((shop) => shop.neighborhood === "al-yarmouk"),
  "al-yarmouk filter stays in district",
);
for (const id of [
  "silo-cafe-al-yarmouk",
  "nosound-al-yarmouk",
  "obo-speciality-al-yarmouk",
  "shafel-roastery-al-yarmouk",
  "coffee-address-al-yarmouk",
  "aleel-roastery-al-yarmouk",
  "bourbon-al-yarmouk",
  "ratio-speciality-al-yarmouk",
  "coffee-zam-al-yarmouk",
  "nus-talqimah-al-yarmouk",
]) {
  assert(
    yarmouk.some((shop) => shop.id === id),
    `al-yarmouk includes ${id}`,
  );
}
assert(
  neighborhoodLabel("al-yarmouk", "ar") === "اليرموك",
  "al-yarmouk Arabic label",
);
assert(
  neighborhoodLabel("al-yarmouk", "en") === "Al Yarmouk",
  "al-yarmouk English label",
);
assert(
  districtPath("al-yarmouk", "ar") === "/coffee-shops/al-yarmouk",
  "AR al-yarmouk coffee-shops path",
);
assert(
  districtPath("al-yarmouk", "en") === "/en/coffee-shops/al-yarmouk",
  "EN al-yarmouk coffee-shops path",
);

const yarmoukIntentAsks = [
  "اليرموك",
  "يرموك",
  "yarmouk",
  "al yarmouk",
  "al-yarmouk",
  "alyarmouk",
  "Al Yarmouk",
  "yarmuk",
  "al-yarmuk",
];
for (const ask of yarmoukIntentAsks) {
  const intent = parseIntent(ask);
  assert(
    intent.neighborhoods.includes("al-yarmouk"),
    `parseIntent(${ask}) should hit al-yarmouk`,
  );
}

const addressHamra = getShop("coffee-address-al-hamra");
const addressYarmouk = getShop("coffee-address-al-yarmouk");
assert(addressHamra, "coffee-address-al-hamra stays in the catalog");
assert(addressYarmouk, "coffee-address-al-yarmouk is a distinct catalog shop");
assert(
  addressYarmouk.mapsShareUrl !== addressHamra.mapsShareUrl,
  "coffee-address-al-yarmouk uses a distinct official place hex",
);

const nosoundNarjis = getShop("nosound-al-narjis");
const nosoundQurtubah = getShop("nosound-qurtubah");
const nosoundYarmouk = getShop("nosound-al-yarmouk");
assert(nosoundNarjis && nosoundQurtubah, "other-district NOSOUND pins stay");
assert(nosoundYarmouk, "nosound-al-yarmouk is a distinct catalog shop");
assert(
  nosoundYarmouk.mapsShareUrl !== nosoundNarjis.mapsShareUrl &&
    nosoundYarmouk.mapsShareUrl !== nosoundQurtubah.mapsShareUrl,
  "nosound-al-yarmouk uses a distinct official place hex",
);

const oboQurtubah = getShop("obo-qurtubah");
const oboYarmouk = getShop("obo-speciality-al-yarmouk");
assert(oboQurtubah, "obo-qurtubah stays in the catalog");
assert(oboYarmouk, "obo-speciality-al-yarmouk is a distinct catalog shop");
assert(
  oboYarmouk.mapsShareUrl !== oboQurtubah.mapsShareUrl,
  "obo-speciality-al-yarmouk uses a distinct official place hex",
);

const shovelYasmin = getShop("shovel-al-yasmin");
const shafelYarmouk = getShop("shafel-roastery-al-yarmouk");
assert(shovelYasmin, "shovel-al-yasmin stays in the catalog");
assert(shafelYarmouk, "shafel-roastery-al-yarmouk is a distinct catalog shop");
assert(
  shafelYarmouk.mapsShareUrl !== shovelYasmin.mapsShareUrl,
  "shafel-roastery-al-yarmouk uses a distinct official place hex",
);

const nahdah = filterDirectoryShops(shops, "al-nahdah");
assert(nahdah.length === 10, `al-nahdah has 10 shops, got ${nahdah.length}`);
assert(
  nahdah.every((shop) => shop.neighborhood === "al-nahdah"),
  "al-nahdah filter stays in district",
);
for (const id of [
  "kapu-cafe-al-nahdah",
  "dahal-specialty-al-nahdah",
  "ghazala-cafe-al-nahdah",
  "shafel-roastery-al-nahdah",
  "half-ten-al-nahdah",
  "bon-ferro-al-nahdah",
  "coffee-address-al-nahdah",
  "chord-daily-coffee-al-nahdah",
  "taco-cup-al-nahdah",
  "awj-cafe-al-nahdah",
]) {
  assert(
    nahdah.some((shop) => shop.id === id),
    `al-nahdah includes ${id}`,
  );
}
assert(
  neighborhoodLabel("al-nahdah", "ar") === "النهضة",
  "al-nahdah Arabic label",
);
assert(
  neighborhoodLabel("al-nahdah", "en") === "Al Nahdah",
  "al-nahdah English label",
);
assert(
  districtPath("al-nahdah", "ar") === "/coffee-shops/al-nahdah",
  "AR al-nahdah coffee-shops path",
);
assert(
  districtPath("al-nahdah", "en") === "/en/coffee-shops/al-nahdah",
  "EN al-nahdah coffee-shops path",
);

const nahdahIntentAsks = [
  "النهضة",
  "نهضة",
  "nahdah",
  "al nahdah",
  "al-nahdah",
  "alnahdah",
  "Al Nahdah",
  "nahda",
  "al-nahda",
];
for (const ask of nahdahIntentAsks) {
  const intent = parseIntent(ask);
  assert(
    intent.neighborhoods.includes("al-nahdah"),
    `parseIntent(${ask}) should hit al-nahdah`,
  );
}

const addressNahdah = getShop("coffee-address-al-nahdah");
assert(addressNahdah, "coffee-address-al-nahdah is a distinct catalog shop");
assert(
  addressNahdah.mapsShareUrl !== addressHamra.mapsShareUrl &&
    addressNahdah.mapsShareUrl !== addressYarmouk.mapsShareUrl,
  "coffee-address-al-nahdah uses a distinct official place hex",
);

const shafelNahdah = getShop("shafel-roastery-al-nahdah");
assert(shafelNahdah, "shafel-roastery-al-nahdah is a distinct catalog shop");
assert(
  shafelNahdah.mapsShareUrl !== shafelYarmouk.mapsShareUrl &&
    shafelNahdah.mapsShareUrl !== shovelYasmin.mapsShareUrl,
  "shafel-roastery-al-nahdah uses a distinct official place hex",
);

const cordHamra = getShop("cord-cafe-al-hamra");
const chordNahdah = getShop("chord-daily-coffee-al-nahdah");
assert(cordHamra, "cord-cafe-al-hamra stays in the catalog");
assert(chordNahdah, "chord-daily-coffee-al-nahdah is a distinct catalog shop");
assert(
  chordNahdah.mapsShareUrl !== cordHamra.mapsShareUrl,
  "chord-daily-coffee-al-nahdah uses a distinct official place hex",
);

const manar = filterDirectoryShops(shops, "al-manar");
assert(manar.length === 2, `al-manar has 2 shops, got ${manar.length}`);
for (const id of ["vase-coffee-al-manar", "recaf-al-manar"]) {
  assert(manar.some((shop) => shop.id === id), `al-manar includes ${id}`);
}
assert(neighborhoodLabel("al-manar", "ar") === "المنار", "al-manar Arabic label");
assert(neighborhoodLabel("al-manar", "en") === "Al Manar", "al-manar English label");
for (const ask of ["المنار", "منار", "manar", "al manar", "al-manar"]) {
  assert(parseIntent(ask).neighborhoods.includes("al-manar"), `parseIntent(${ask}) should hit al-manar`);
}
const recafSafa = getShop("recaf-al-safa");
const recafManar = getShop("recaf-al-manar");
assert(recafSafa, "recaf-al-safa stays in the catalog");
assert(recafManar, "recaf-al-manar is a distinct catalog shop");
assert(
  recafManar.mapsShareUrl !== recafSafa.mapsShareUrl,
  "recaf-al-manar uses a distinct official place hex",
);

const rayyan = filterDirectoryShops(shops, "al-rayyan");
assert(rayyan.length === 7, `al-rayyan has 7 shops, got ${rayyan.length}`);
for (const id of [
  "kultura-al-rayyan",
  "da-nonna-al-rayyan",
  "amber-speciality-al-rayyan",
  "floated-al-rayyan",
  "sica-al-rayyan",
  "fabrica-de-cafe-al-rayyan",
  "78-specialty-coffee-al-rayyan",
]) {
  assert(rayyan.some((shop) => shop.id === id), `al-rayyan includes ${id}`);
}
assert(neighborhoodLabel("al-rayyan", "ar") === "الريان", "al-rayyan Arabic label");
assert(neighborhoodLabel("al-rayyan", "en") === "Al Rayyan", "al-rayyan English label");
for (const ask of ["الريان", "ريان", "rayyan", "al rayyan", "ar-rayyan"]) {
  assert(parseIntent(ask).neighborhoods.includes("al-rayyan"), `parseIntent(${ask}) should hit al-rayyan`);
}

const rawabi = filterDirectoryShops(shops, "al-rawabi");
assert(rawabi.length === 2, `al-rawabi has 2 shops, got ${rawabi.length}`);
for (const id of ["the-it-al-rawabi", "essert-al-rawabi"]) {
  assert(rawabi.some((shop) => shop.id === id), `al-rawabi includes ${id}`);
}
assert(neighborhoodLabel("al-rawabi", "ar") === "الروابي", "al-rawabi Arabic label");
assert(neighborhoodLabel("al-rawabi", "en") === "Al Rawabi", "al-rawabi English label");
for (const ask of ["الروابي", "روابي", "rawabi", "al rawabi", "ar-rawabi"]) {
  assert(parseIntent(ask).neighborhoods.includes("al-rawabi"), `parseIntent(${ask}) should hit al-rawabi`);
}

const fayha = filterDirectoryShops(shops, "al-fayha");
assert(fayha.length === 2, `al-fayha has 2 shops, got ${fayha.length}`);
for (const id of ["rukyah-al-fayha", "roof-coffee-al-fayha"]) {
  assert(fayha.some((shop) => shop.id === id), `al-fayha includes ${id}`);
}
assert(neighborhoodLabel("al-fayha", "ar") === "الفيحاء", "al-fayha Arabic label");
assert(neighborhoodLabel("al-fayha", "en") === "Al Fayha", "al-fayha English label");
for (const ask of ["الفيحاء", "فيحاء", "fayha", "al fayha", "al-fayha"]) {
  assert(parseIntent(ask).neighborhoods.includes("al-fayha"), `parseIntent(${ask}) should hit al-fayha`);
}

const raqban = filterDirectoryShops(shops, "al-raqban");
assert(raqban.length === 1, `al-raqban has 1 shop, got ${raqban.length}`);
assert(
  raqban.some((shop) => shop.id === "maqha-mahamasa-al-raqban"),
  "al-raqban includes maqha-mahamasa-al-raqban",
);
assert(neighborhoodLabel("al-raqban", "ar") === "الرقبان", "al-raqban Arabic label");
assert(neighborhoodLabel("al-raqban", "en") === "Al Raqban", "al-raqban English label");
for (const ask of ["الرقبان", "رقبان", "raqban", "al raqban", "al-raqban"]) {
  assert(parseIntent(ask).neighborhoods.includes("al-raqban"), `parseIntent(${ask}) should hit al-raqban`);
}
const haiRawdah = getShop("hai-coffee-roasters-al-rawdah");
const raqbanShop = getShop("maqha-mahamasa-al-raqban");
assert(haiRawdah, "hai-coffee-roasters-al-rawdah stays in the catalog");
assert(raqbanShop, "maqha-mahamasa-al-raqban is a distinct catalog shop");
assert(
  raqbanShop.mapsShareUrl !== haiRawdah.mapsShareUrl,
  "al-raqban cafe uses a distinct official place hex from HAI Rawdah",
);
assert(raqbanShop.neighborhood === "al-raqban", "raqban shop is not folded into al-rawdah");

const munsiyah = filterDirectoryShops(shops, "al-munsiyah");
assert(munsiyah.length === 10, `al-munsiyah has 10 shops, got ${munsiyah.length}`);
assert(
  munsiyah.every((shop) => shop.neighborhood === "al-munsiyah"),
  "al-munsiyah filter stays in district",
);
for (const id of [
  "serb-specialty-al-munsiyah",
  "roasting-stages-al-munsiyah",
  "eagle-coffee-al-munsiyah",
  "najd-roastery-al-munsiyah",
  "cu-specialty-al-munsiyah",
  "45-degrees-al-munsiyah",
  "true-side-al-munsiyah",
  "coffee-address-al-munsiyah",
  "das-mond-al-munsiyah",
  "anotherside-cafe-al-munsiyah",
]) {
  assert(
    munsiyah.some((shop) => shop.id === id),
    `al-munsiyah includes ${id}`,
  );
}
assert(getShop("anotherside-cafe-al-munsiyah"), "ANOTHERSIDE is the 10th Al Munsiyah shop");
assert(
  neighborhoodLabel("al-munsiyah", "ar") === "المونسية",
  "al-munsiyah Arabic label",
);
assert(
  neighborhoodLabel("al-munsiyah", "en") === "Al Munsiyah",
  "al-munsiyah English label",
);
assert(
  districtPath("al-munsiyah", "ar") === "/coffee-shops/al-munsiyah",
  "AR al-munsiyah coffee-shops path",
);
assert(
  districtPath("al-munsiyah", "en") === "/en/coffee-shops/al-munsiyah",
  "EN al-munsiyah coffee-shops path",
);
for (const ask of [
  "المونسية",
  "مونسية",
  "munsiyah",
  "al munsiyah",
  "al-munsiyah",
  "Al Munsiyah",
]) {
  assert(
    parseIntent(ask).neighborhoods.includes("al-munsiyah"),
    `parseIntent(${ask}) should hit al-munsiyah`,
  );
}

const najdQurtubah = getShop("najd-roastery-qurtubah");
const najdMunsiyah = getShop("najd-roastery-al-munsiyah");
assert(najdQurtubah, "najd-roastery-qurtubah stays in the catalog");
assert(najdMunsiyah, "najd-roastery-al-munsiyah is a distinct catalog shop");
assert(
  najdMunsiyah.mapsShareUrl !== najdQurtubah.mapsShareUrl,
  "najd-roastery-al-munsiyah uses a distinct official place hex",
);

const addressMunsiyah = getShop("coffee-address-al-munsiyah");
assert(addressMunsiyah, "coffee-address-al-munsiyah is a distinct catalog shop");
assert(
  addressMunsiyah.mapsShareUrl !== addressHamra.mapsShareUrl &&
    addressMunsiyah.mapsShareUrl !== addressYarmouk.mapsShareUrl &&
    addressMunsiyah.mapsShareUrl !== addressNahdah.mapsShareUrl,
  "coffee-address-al-munsiyah uses a distinct official place hex",
);

const rabi = filterDirectoryShops(shops, "al-rabi");
assert(rabi.length === 2, `al-rabi has 2 shops, got ${rabi.length}`);
assert(
  rabi.some((shop) => shop.id === "piccolo-al-rabi"),
  "al-rabi keeps piccolo-al-rabi",
);
assert(
  rabi.some((shop) => shop.id === "ashjar-cafe-ar-rabi"),
  "al-rabi includes ashjar-cafe-ar-rabi",
);

const nada = filterDirectoryShops(shops, "an-nada");
assert(nada.length === 2, `an-nada has 2 shops, got ${nada.length}`);
assert(
  nada.some((shop) => shop.id === "brew92-an-nada"),
  "an-nada includes brew92-an-nada",
);
assert(
  nada.some((shop) => shop.id === "somatcha-an-nada"),
  "an-nada includes somatcha-an-nada",
);
assert(neighborhoodLabel("an-nada", "ar") === "الندى", "an-nada Arabic label");
assert(neighborhoodLabel("an-nada", "en") === "An Nada", "an-nada English label");
assert(
  districtPath("an-nada", "ar") === "/coffee-shops/an-nada",
  "AR an-nada coffee-shops path",
);
assert(
  districtPath("an-nada", "en") === "/en/coffee-shops/an-nada",
  "EN an-nada coffee-shops path",
);
for (const ask of ["الندى", "ندى", "nada", "an nada", "an-nada", "An Nada"]) {
  assert(
    parseIntent(ask).neighborhoods.includes("an-nada"),
    `parseIntent(${ask}) should hit an-nada`,
  );
}

const dq = filterDirectoryShops(shops, "diplomatic-quarter");
assert(dq.length === 1, `diplomatic-quarter has 1 shop, got ${dq.length}`);
assert(
  dq.some((shop) => shop.id === "jazean-diplomatic-quarter"),
  "diplomatic-quarter includes jazean-diplomatic-quarter",
);
assert(
  neighborhoodLabel("diplomatic-quarter", "ar") === "الحي الدبلوماسي",
  "diplomatic-quarter Arabic label",
);
assert(
  neighborhoodLabel("diplomatic-quarter", "en") === "Diplomatic Quarter",
  "diplomatic-quarter English label",
);
assert(
  districtPath("diplomatic-quarter", "ar") === "/coffee-shops/diplomatic-quarter",
  "AR diplomatic-quarter coffee-shops path",
);
assert(
  districtPath("diplomatic-quarter", "en") ===
    "/en/coffee-shops/diplomatic-quarter",
  "EN diplomatic-quarter coffee-shops path",
);
assert(
  districtPath("al-takhassusi", "ar") === "/coffee-shops/al-takhassusi",
  "AR al-takhassusi coffee-shops path",
);
assert(
  districtPath("al-takhassusi", "en") === "/en/coffee-shops/al-takhassusi",
  "EN al-takhassusi coffee-shops path",
);
assert(
  districtPath("al-nakheel", "en") === "/en/coffee-shops/al-nakheel",
  "An Nakheel keeps existing al-nakheel SEO slug",
);
for (const ask of [
  "الحي الدبلوماسي",
  "الدبلوماسي",
  "diplomatic quarter",
  "Diplomatic Quarter",
  "السفارات",
]) {
  assert(
    parseIntent(ask).neighborhoods.includes("diplomatic-quarter"),
    `parseIntent(${ask}) should hit diplomatic-quarter`,
  );
}

const kingFahd = filterDirectoryShops(shops, "king-fahd");
assert(kingFahd.length === 1, `king-fahd has 1 shop, got ${kingFahd.length}`);
assert(
  kingFahd.some((shop) => shop.id === "markab-king-fahd"),
  "king-fahd includes markab-king-fahd",
);
assert(
  neighborhoodLabel("king-fahd", "ar") === "الملك فهد",
  "king-fahd Arabic label",
);
assert(
  neighborhoodLabel("king-fahd", "en") === "King Fahd",
  "king-fahd English label",
);
assert(
  districtPath("king-fahd", "ar") === "/coffee-shops/king-fahd",
  "AR king-fahd coffee-shops path",
);
assert(
  districtPath("king-fahd", "en") === "/en/coffee-shops/king-fahd",
  "EN king-fahd coffee-shops path",
);
const markab = getShop("markab-king-fahd");
assert(markab, "markab-king-fahd is a distinct catalog shop");
assert(markab.neighborhood === "king-fahd", "Markab is not folded into olaya");
for (const ask of ["الملك فهد", "حي الملك فهد", "king fahd", "King Fahd", "king-fahd"]) {
  assert(
    parseIntent(ask).neighborhoods.includes("king-fahd"),
    `parseIntent(${ask}) should hit king-fahd`,
  );
}

const WAVE1_DISTRICTS: {
  id:
    | "al-takhassusi"
    | "al-aqiq"
    | "al-ghadeer"
    | "al-arid"
    | "al-qirawan";
  ar: string;
  en: string;
  shops: string[];
}[] = [
  {
    id: "al-takhassusi",
    ar: "التخصصي",
    en: "Al Takhassusi",
    shops: [
      "kernel-al-takhassusi",
      "percent-arabica-the-zone-al-takhassusi",
      "idmi-nakheel-takhassusi",
      "groovy-al-takhassusi",
      "dust-and-verse-al-takhassusi",
      "somo-al-takhassusi",
      "glim-al-takhassusi",
    ],
  },
  {
    id: "al-aqiq",
    ar: "العقيق",
    en: "Al Aqiq",
    shops: [
      "sculpture-al-aqiq",
      "ashjar-cafe-al-aqiq",
      "shovel-al-aqiq",
      "out-of-line-al-aqiq",
      "camel-step-al-aqiq",
      "scarf-al-aqiq",
      "the-coffee-kingdom-al-aqiq",
      "file-coffee-al-aqiq",
    ],
  },
  {
    id: "al-ghadeer",
    ar: "الغدير",
    en: "Al Ghadeer",
    shops: [
      "kultura-al-ghadeer",
      "tad-coffee-al-ghadeer",
      "ulica-al-ghadeer",
      "drip-al-ghadeer",
      "blumen-al-ghadeer",
      "brsk-al-ghadeer",
      "drive-al-ghadeer",
      "ghandoura-al-ghadeer",
      "iota-al-ghadeer",
    ],
  },
  {
    id: "al-arid",
    ar: "العارض",
    en: "Al Arid",
    shops: [
      "acres-al-arid",
      "kicksters-lab-al-arid",
      "shovel-al-arid",
      "archi-al-arid",
      "drive-al-arid",
      "roasting-house-al-arid",
      "coffee-address-al-arid",
      "shiro-al-arid",
    ],
  },
  {
    id: "al-qirawan",
    ar: "القيروان",
    en: "Al Qirawan",
    shops: [
      "cypress-al-qirawan",
      "3bean-al-qirawan",
      "ashjar-cafe-al-qirawan",
      "drip-al-qirawan",
      "coffee-side-al-qirawan",
      "caf-lab-al-qirawan",
      "drive-al-qirawan",
      "scout-coffee-al-qirawan",
    ],
  },
];

const WADI_REFILL = {
  id: "al-wadi" as const,
  ar: "الوادي",
  en: "Al Wadi",
  shops: [
    "white-roastery-al-wadi",
    "parole-cafe-al-wadi",
    "wama-coffee-al-wadi",
  ],
};

{
  const rows = filterDirectoryShops(shops, WADI_REFILL.id);
  assert(rows.length === 3, `al-wadi has 3 shops, got ${rows.length}`);
  assert(
    rows.every((shop) => shop.neighborhood === "al-wadi"),
    "al-wadi filter stays in district",
  );
  for (const id of WADI_REFILL.shops) {
    assert(rows.some((shop) => shop.id === id), `al-wadi includes ${id}`);
  }
  assert(
    neighborhoodLabel("al-wadi", "ar") === WADI_REFILL.ar,
    "al-wadi Arabic label",
  );
  assert(
    neighborhoodLabel("al-wadi", "en") === WADI_REFILL.en,
    "al-wadi English label",
  );
  assert(
    districtPath("al-wadi", "ar") === "/coffee-shops/al-wadi",
    "AR al-wadi coffee-shops path",
  );
  assert(
    districtPath("al-wadi", "en") === "/en/coffee-shops/al-wadi",
    "EN al-wadi coffee-shops path",
  );
  for (const ask of ["الوادي", "وادي", "wadi", "al wadi", "al-wadi", "Al Wadi"]) {
    assert(
      parseIntent(ask).neighborhoods.includes("al-wadi"),
      `parseIntent(${ask}) should hit al-wadi`,
    );
  }
}

const MURUJ_REFILL = {
  id: "al-muruj" as const,
  ar: "المروج",
  en: "Al Muruj",
  shops: [
    "sand-clock-al-muruj",
    "parka-coffee-al-muruj",
    "terra-cafe-al-muruj",
    "rabka-al-muruj",
    "quokka-coffee-al-muruj",
    "some-coffee-bar-al-muruj",
  ],
};

{
  const rows = filterDirectoryShops(shops, MURUJ_REFILL.id);
  assert(rows.length === 6, `al-muruj has 6 shops, got ${rows.length}`);
  assert(
    rows.every((shop) => shop.neighborhood === "al-muruj"),
    "al-muruj filter stays in district",
  );
  for (const id of MURUJ_REFILL.shops) {
    assert(rows.some((shop) => shop.id === id), `al-muruj includes ${id}`);
  }
  assert(
    neighborhoodLabel("al-muruj", "ar") === MURUJ_REFILL.ar,
    "al-muruj Arabic label",
  );
  assert(
    neighborhoodLabel("al-muruj", "en") === MURUJ_REFILL.en,
    "al-muruj English label",
  );
  assert(
    districtPath("al-muruj", "ar") === "/coffee-shops/al-muruj",
    "AR al-muruj coffee-shops path",
  );
  assert(
    !getShop("sand-clock-al-muruj")?.nameEn.toLowerCase().includes("wurud") &&
      !getShop("sand-clock-as-sulimaniyah")?.neighborhood.includes("wurud"),
    "Sand Clock has no invented Wurud row",
  );
  for (const ask of ["المروج", "مروج", "muruj", "al muruj", "al-muruj", "Al Muruj"]) {
    assert(
      parseIntent(ask).neighborhoods.includes("al-muruj"),
      `parseIntent(${ask}) should hit al-muruj`,
    );
  }
}

const MOH_REFILL = {
  id: "al-mohammadiyah" as const,
  ar: "المحمدية",
  en: "Al Mohammadiyah",
  shops: [
    "unique-drip-al-mohammadiyah",
    "hjeen-roasters-al-mohammadiyah",
    "hekaya-tale-al-mohammadiyah",
    "house-of-matcha-al-mohammadiyah",
  ],
};

{
  const rows = filterDirectoryShops(shops, MOH_REFILL.id);
  assert(rows.length === 4, `al-mohammadiyah has 4 shops, got ${rows.length}`);
  assert(
    rows.every((shop) => shop.neighborhood === "al-mohammadiyah"),
    "al-mohammadiyah filter stays in district",
  );
  for (const id of MOH_REFILL.shops) {
    assert(rows.some((shop) => shop.id === id), `al-mohammadiyah includes ${id}`);
  }
  assert(
    neighborhoodLabel("al-mohammadiyah", "ar") === MOH_REFILL.ar,
    "al-mohammadiyah Arabic label",
  );
  assert(
    neighborhoodLabel("al-mohammadiyah", "en") === MOH_REFILL.en,
    "al-mohammadiyah English label",
  );
  assert(
    districtPath("al-mohammadiyah", "ar") === "/coffee-shops/al-mohammadiyah",
    "AR al-mohammadiyah coffee-shops path",
  );
  for (const ask of [
    "المحمدية",
    "محمدية",
    "mohammadiyah",
    "muhammadiyah",
    "al mohammadiyah",
    "al-mohammadiyah",
    "Al Mohammadiyah",
  ]) {
    assert(
      parseIntent(ask).neighborhoods.includes("al-mohammadiyah"),
      `parseIntent(${ask}) should hit al-mohammadiyah`,
    );
  }
}

const MALAZ_REFILL = {
  id: "al-malaz" as const,
  ar: "الملز",
  en: "Al Malaz",
  shops: [
    "lasani-cafe-al-malaz",
    "golden-pot-al-malaz",
    "walnut-wood-coffee-al-malaz",
    "hazzah-coffee-al-malaz",
    "canto-al-malaz",
  ],
};

{
  const rows = filterDirectoryShops(shops, MALAZ_REFILL.id);
  assert(rows.length === 5, `al-malaz has 5 shops, got ${rows.length}`);
  assert(
    rows.filter((shop) => shop.id === "lasani-cafe-al-malaz").length === 1,
    "Lasani stays a single Malaz row",
  );
  assert(
    rows.every((shop) => shop.neighborhood === "al-malaz"),
    "al-malaz filter stays in district",
  );
  for (const id of MALAZ_REFILL.shops) {
    assert(rows.some((shop) => shop.id === id), `al-malaz includes ${id}`);
  }
  assert(
    neighborhoodLabel("al-malaz", "ar") === MALAZ_REFILL.ar,
    "al-malaz Arabic label",
  );
  assert(
    neighborhoodLabel("al-malaz", "en") === MALAZ_REFILL.en,
    "al-malaz English label",
  );
  assert(
    districtPath("al-malaz", "ar") === "/coffee-shops/al-malaz",
    "AR al-malaz coffee-shops path",
  );
  for (const ask of ["الملز", "ملز", "malaz", "al malaz", "al-malaz", "Al Malaz"]) {
    assert(
      parseIntent(ask).neighborhoods.includes("al-malaz"),
      `parseIntent(${ask}) should hit al-malaz`,
    );
  }
}

{
  const rows = filterDirectoryShops(shops, "al-mathar");
  assert(rows.length === 1, `al-mathar has 1 shop, got ${rows.length}`);
  assert(
    rows.some((shop) => shop.id === "opinion-al-mathar"),
    "al-mathar includes opinion-al-mathar",
  );
  assert(neighborhoodLabel("al-mathar", "ar") === "المعذر", "al-mathar Arabic label");
  assert(neighborhoodLabel("al-mathar", "en") === "Al Mathar", "al-mathar English label");
  assert(
    districtPath("al-mathar", "ar") === "/coffee-shops/al-mathar",
    "AR al-mathar coffee-shops path",
  );
  for (const ask of ["المعذر", "معذر", "mathar", "al mathar", "al-mathar", "Al Mathar"]) {
    assert(
      parseIntent(ask).neighborhoods.includes("al-mathar"),
      `parseIntent(${ask}) should hit al-mathar`,
    );
  }
}

for (const district of WAVE1_DISTRICTS) {
  const rows = filterDirectoryShops(shops, district.id);
  const expected = district.shops.length;
  assert(
    rows.length === expected,
    `${district.id} has ${expected} shops, got ${rows.length}`,
  );
  assert(
    rows.every((shop) => shop.neighborhood === district.id),
    `${district.id} filter stays in district`,
  );
  for (const id of district.shops) {
    assert(
      rows.some((shop) => shop.id === id),
      `${district.id} includes ${id}`,
    );
  }
  assert(
    neighborhoodLabel(district.id, "ar") === district.ar,
    `${district.id} Arabic label`,
  );
  assert(
    neighborhoodLabel(district.id, "en") === district.en,
    `${district.id} English label`,
  );
  assert(
    districtPath(district.id, "ar") === `/coffee-shops/${district.id}`,
    `AR ${district.id} coffee-shops path`,
  );
  assert(
    districtPath(district.id, "en") === `/en/coffee-shops/${district.id}`,
    `EN ${district.id} coffee-shops path`,
  );
}

function assertDistinctPlaceHex(ids: string[], label: string) {
  const hrefs = ids.map((id) => {
    const shop = getShop(id);
    assert(shop, `${id} is a distinct catalog shop`);
    assert(shop.mapsShareUrl, `${id} has official place hex`);
    return shop.mapsShareUrl;
  });
  assert(new Set(hrefs).size === hrefs.length, `${label} brand twins keep distinct hexes`);
}

assertDistinctPlaceHex(
  ["percent-arabica-hittin", "percent-arabica-the-zone-al-takhassusi"],
  "% Arabica",
);
assertDistinctPlaceHex(
  ["idmi-olaya", "idmi-al-yasmin", "idmi-nakheel-takhassusi"],
  "IDMI",
);
assertDistinctPlaceHex(
  ["ashjar-cafe-ar-rabi", "ashjar-cafe-al-aqiq", "ashjar-cafe-al-qirawan"],
  "Ashjar",
);
assertDistinctPlaceHex(
  ["shovel-al-yasmin", "shovel-al-aqiq", "shovel-al-arid"],
  "Shovel",
);
assertDistinctPlaceHex(
  ["camel-step-hittin", "camel-step-al-rahmaniyyah", "camel-step-al-aqiq"],
  "Camel Step",
);
assertDistinctPlaceHex(
  ["file-coffee-ghirnatah", "file-coffee-al-aqiq"],
  "File Coffee",
);
assertDistinctPlaceHex(
  ["kultura-al-rayyan", "kultura-al-ghadeer", "kultura-hittin", "kultura-al-malqa"],
  "Kultúra",
);
assertDistinctPlaceHex(
  ["house-of-matcha-al-mohammadiyah", "house-of-matcha-sulimaniyah"],
  "House of Matcha",
);
assertDistinctPlaceHex(
  ["opinion-al-mathar", "opinion-hittin"],
  "Opinion",
);
assertDistinctPlaceHex(
  ["quokka-coffee-al-muruj", "quokka-coffee-ghirnatah"],
  "Quokka Coffee",
);
assertDistinctPlaceHex(
  ["drip-olaya", "drip-al-hamra", "drip-al-ghadeer", "drip-al-qirawan"],
  "Drip",
);
assertDistinctPlaceHex(
  ["blumen-al-safa", "blumen-al-ghadeer"],
  "Blumen",
);
assertDistinctPlaceHex(
  ["ghandoura-an-nazhah", "ghandoura-al-ghadeer"],
  "Ghandoura",
);
assertDistinctPlaceHex(
  ["drive-al-ghadeer", "drive-al-arid", "drive-al-qirawan"],
  "Drive Coffee",
);
assertDistinctPlaceHex(
  ["kicksters-al-malqa", "kicksters-lab-al-arid"],
  "Kicksters",
);
assertDistinctPlaceHex(
  ["archi-al-narjis", "archi-al-arid"],
  "ARCHI",
);
assertDistinctPlaceHex(
  ["roasting-house-al-yasmin", "roasting-house-al-masif", "roasting-house-al-arid"],
  "Roasting House",
);
assertDistinctPlaceHex(
  [
    "coffee-address-al-hamra",
    "coffee-address-al-yarmouk",
    "coffee-address-al-nahdah",
    "coffee-address-al-munsiyah",
    "coffee-address-al-arid",
  ],
  "Coffee Address",
);
assertDistinctPlaceHex(
  ["caf-lab-al-narjis", "caf-lab-al-qirawan"],
  "CAF LAB",
);
assertDistinctPlaceHex(
  ["sand-clock-al-muruj", "sand-clock-as-sulimaniyah"],
  "Sand Clock",
);
assertDistinctPlaceHex(
  [
    "hjeen-roaster-factory-al-yasmin",
    "hjeen-roaster-al-narjis",
    "hjeen-roasters-al-mohammadiyah",
  ],
  "Hjeen",
);

assert(
  NEW_THIS_WEEK_IDS.join(",") ===
    "brew92-an-nada,ashjar-cafe-ar-rabi,jazean-diplomatic-quarter,markab-king-fahd",
  "New this week allowlist is the Time Out gap four",
);
assert(
  listNewThisWeekShops()
    .map((shop) => shop.id)
    .join(",") === NEW_THIS_WEEK_IDS.join(","),
  "New this week strip keeps allowlist order",
);
assert(
  copy.newThisWeek.ar === "جديد هالأسبوع" &&
    copy.newThisWeekHint.ar === "انضافت للقائمة هالأسبوع.",
  "New this week Arabic copy stays locked",
);

const scoutPack: {
  id: string;
  hex: string;
  neighborhood:
    | "al-safa"
    | "al-rabwah"
    | "al-rawdah"
    | "qurtubah"
    | "an-nazhah"
    | "al-hamra"
    | "al-yarmouk"
    | "al-nahdah"
    | "al-manar"
    | "al-rayyan"
    | "al-rawabi"
    | "al-fayha"
    | "al-raqban"
    | "al-munsiyah"
    | "an-nada"
    | "al-rabi"
    | "diplomatic-quarter"
    | "king-fahd"
    | "al-takhassusi"
    | "al-aqiq"
    | "al-ghadeer"
    | "al-arid"
    | "al-qirawan"
    | "al-wadi"
    | "al-muruj"
    | "al-mohammadiyah"
    | "al-malaz"
    | "sulimaniyah"
    | "olaya"
    | "diriyah"
    | "hittin"
    | "al-malqa"
    | "ghirnatah"
    | "al-mathar";
  vibe: string[];
  moments: string[];
  logoUrl?: string;
  pin?: { lat: number; lng: number };
}[] = [
  {
    id: "hawaf-al-safa",
    hex: "0x3e2f07006df6335f:0x3936438b95be1845",
    neighborhood: "al-safa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "recaf-al-safa",
    hex: "0x3e2f07002fb65bb5:0x1a082f7cedaa95ea",
    neighborhood: "al-safa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "raslania-al-safa",
    hex: "0x3e2f070018d65cb9:0x38816e21404c5020",
    neighborhood: "al-safa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "dyar-bakery-al-safa",
    hex: "0x3e2f070007651d33:0xad1d729591d9f1d5",
    neighborhood: "al-safa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "jazwa-specialty-coffee-ar-rabwah",
    hex: "0x3e2f0402f4f629ff:0xd1e8b1467fc0cb1e",
    neighborhood: "al-rabwah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "makhsousa-coffee-ar-rabwah",
    hex: "0x3e2f07a81f6a3c47:0x7f418c32999d69fa",
    neighborhood: "al-rabwah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "blog-coffee-ar-rabwah",
    hex: "0x3e2f0707e1c83ec9:0xfcb4b9ffcf765bad",
    neighborhood: "al-rabwah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "enzo-coffee-ar-rabwah",
    hex: "0x3e2f070043130767:0x38b2858e8499a030",
    neighborhood: "al-rabwah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "window-coffee-ar-rabwah",
    hex: "0x3e2f0796e16c8739:0x39d609ba67e96ce7",
    neighborhood: "al-rabwah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "b-cafe-ar-rabwah",
    hex: "0x3e2f070a205cfc67:0x6d57fb46f96a1623",
    neighborhood: "al-rabwah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "hai-coffee-roasters-al-rawdah",
    hex: "0x3e2f01a96357c13d:0x63baca80617c33cb",
    neighborhood: "al-rawdah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
  },
  {
    id: "coffeehood-qurtubah",
    hex: "0x3e2efd4e25de6571:0x7cbe1e16720788e",
    neighborhood: "qurtubah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "obo-qurtubah",
    hex: "0x3e2efd0011e0f765:0x7017733f9730a468",
    neighborhood: "qurtubah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "lattio-lounge-qurtubah",
    hex: "0x3e2efda30ba6b329:0x6fbe069618b289cf",
    neighborhood: "qurtubah",
    vibe: ["قهوة"],
    moments: ["friend", "qahwa"],
  },
  {
    id: "n5-caffe-qurtubah",
    hex: "0x3e2eff5b8b2fe293:0x8add6fb3fc1cb262",
    neighborhood: "qurtubah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "cacti-roastery-qurtubah",
    hex: "0x3e2efde0d2059f1d:0xfca400b51ca140cc",
    neighborhood: "qurtubah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
  },
  {
    id: "najd-roastery-qurtubah",
    hex: "0x3e2efd7e48611c89:0x9f325ee903e4115c",
    neighborhood: "qurtubah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
  },
  {
    id: "najd-alathiah-qurtubah",
    hex: "0x3e2eff55ad144173:0x710215b462af3206",
    neighborhood: "qurtubah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "klatch-qurtubah",
    hex: "0x3e2efd00234d31f9:0xd88d0f80e8a1b945",
    neighborhood: "qurtubah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "nosound-qurtubah",
    hex: "0x3e2efd1bf2459957:0x981f344c0bf6e54f",
    neighborhood: "qurtubah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "vanilla-coffee-qurtubah",
    hex: "0x3e2efd6f6da4d7d7:0x69c591ff5e5e14fb",
    neighborhood: "qurtubah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "mill-coffee-qurtubah",
    hex: "0x3e2efdd75f5d246f:0xbefc1aa83961fc4b",
    neighborhood: "qurtubah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
  },
  {
    id: "cofen-qurtubah",
    hex: "0x3e2efdc31f8a623b:0xa28eba5077113625",
    neighborhood: "qurtubah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "mud-speciality-coffee-an-nazhah",
    hex: "0x3e2f03001edf482d:0x452cfdab603f11",
    neighborhood: "an-nazhah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "wathba-an-nazhah",
    hex: "0x3e2f030008ff9c71:0xd3396682f440e17d",
    neighborhood: "an-nazhah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/wathba-an-nazhah.jpg",
  },
  {
    id: "moraq-cafe-an-nazhah",
    hex: "0x3e2f033f0365e563:0xfaac19beb89d288c",
    neighborhood: "an-nazhah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/moraq-cafe-an-nazhah.jpg",
  },
  {
    id: "november-coffee-an-nazhah",
    hex: "0x3e2f0281cc40f547:0x58e3f0912f2540a8",
    neighborhood: "an-nazhah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/november-coffee-an-nazhah.png",
  },
  {
    id: "elite-cup-roasters-an-nazhah",
    hex: "0x3e2f03a7d5bcbd33:0x9c823b52f06a5685",
    neighborhood: "an-nazhah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/elite-cup-roasters-an-nazhah.png",
  },
  {
    id: "belong-an-nazhah",
    hex: "0x3e2f03cdfb4cd1f1:0x94568f00fa650960",
    neighborhood: "an-nazhah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/belong-an-nazhah.png",
  },
  {
    id: "desired-coffee-an-nazhah",
    hex: "0x3e2f03f28492750f:0x1197315cc9e08e93",
    neighborhood: "an-nazhah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/desired-coffee-an-nazhah.jpg",
  },
  {
    id: "cross-coffee-an-nazhah",
    hex: "0x3e2f03eb18dbbea5:0xf8b637cafb780f46",
    neighborhood: "an-nazhah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/cross-coffee-an-nazhah.jpg",
  },
  {
    id: "kraz-an-nazhah",
    hex: "0x3e2f0300edb717c3:0x1265bf3bb80d0ae3",
    neighborhood: "an-nazhah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/kraz-an-nazhah.jpg",
  },
  {
    id: "ghandoura-an-nazhah",
    hex: "0x3e2f03424178439d:0x9d0a63b8efe7b615",
    neighborhood: "an-nazhah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/ghandoura-an-nazhah.png",
  },
  {
    id: "serene-coffee-roastery",
    hex: "0x3e2effbaf1698ceb:0xda495846c2d4c231",
    neighborhood: "al-hamra",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa", "pastry"],
    logoUrl: "/logos/serene-coffee-roastery.png",
    pin: { lat: 24.7829655, lng: 46.7586255 },
  },
  {
    id: "rimthan-coffee-al-hamra",
    hex: "0x3e2f01c71ac623a3:0x7c502c31b04d0292",
    neighborhood: "al-hamra",
    vibe: ["قهوة"],
    moments: ["qahwa", "matcha"],
    logoUrl: "/logos/rimthan-coffee-mark.png",
    pin: { lat: 24.776146, lng: 46.7756026 },
  },
  {
    id: "mind-break-al-hamra",
    hex: "0x3e2f010eba648ef3:0x962f916a8a3071be",
    neighborhood: "al-hamra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/mind-break.jpg",
    pin: { lat: 24.7694973, lng: 46.7625231 },
  },
  {
    id: "jather-al-hamra",
    hex: "0x3e2f03005afeefe3:0xfb9336e4d0f8a037",
    neighborhood: "al-hamra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/jather.jpg",
    pin: { lat: 24.7634329, lng: 46.7412428 },
  },
  {
    id: "harf-coffee-al-hamra",
    hex: "0x3e2f01002c3f7aa7:0x2ecc757cd9c9f7f8",
    neighborhood: "al-hamra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/harf-coffee.jpg",
    pin: { lat: 24.7777618, lng: 46.7695092 },
  },
  {
    id: "zeila-al-hamra",
    hex: "0x3e2eff1ea23180b9:0x647b98e76654807a",
    neighborhood: "al-hamra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/zeila.jpg",
    pin: { lat: 24.7881246, lng: 46.7599681 },
  },
  {
    id: "cord-cafe-al-hamra",
    hex: "0x3e2eff002d2c105d:0x3ba7f72a62caaee9",
    neighborhood: "al-hamra",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/cord-cafe.jpg",
    pin: { lat: 24.7785386, lng: 46.7628587 },
  },
  {
    id: "drip-al-hamra",
    hex: "0x3e2effad91197a37:0xf0d7eced6ebb0497",
    neighborhood: "al-hamra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/drip-al-hamra.jpg",
    pin: { lat: 24.7878805, lng: 46.7593322 },
  },
  {
    id: "coffee-address-al-hamra",
    hex: "0x3e2efffcecbb3509:0x6fc42bb33821c4f2",
    neighborhood: "al-hamra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/coffee-address-mark.png",
    pin: { lat: 24.7826536, lng: 46.7494331 },
  },
  {
    id: "glint-al-hamra",
    hex: "0x3e2eff9f23a4abe3:0xa01e11a8f5626441",
    neighborhood: "al-hamra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/glint.jpg",
    pin: { lat: 24.7874817, lng: 46.7679309 },
  },
  {
    id: "silo-cafe-al-yarmouk",
    hex: "0x3e2effa506ee527d:0x9ac2482912025e9d",
    neighborhood: "al-yarmouk",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/silo-cafe-al-yarmouk.png",
    pin: { lat: 24.8095657, lng: 46.8010424 },
  },
  {
    id: "nosound-al-yarmouk",
    hex: "0x3e2eff23d99f5617:0xd20e45e1c4986a0d",
    neighborhood: "al-yarmouk",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/nosound-al-yarmouk.png",
    pin: { lat: 24.8099494, lng: 46.7794305 },
  },
  {
    id: "obo-speciality-al-yarmouk",
    hex: "0x3e2eff001111c4b7:0x76241484f7a74634",
    neighborhood: "al-yarmouk",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/obo-speciality-al-yarmouk-ig.jpg",
    pin: { lat: 24.8073428, lng: 46.8013679 },
  },
  {
    id: "shafel-roastery-al-yarmouk",
    hex: "0x3e2effc92f650149:0xe249596174724693",
    neighborhood: "al-yarmouk",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/shafel-roastery-al-yarmouk.png",
    pin: { lat: 24.8202118, lng: 46.7890373 },
  },
  {
    id: "coffee-address-al-yarmouk",
    hex: "0x3e2eff9a4651eac7:0x5fd092bea9a44569",
    neighborhood: "al-yarmouk",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/coffee-address-al-yarmouk.png",
    pin: { lat: 24.8155525, lng: 46.7783003 },
  },
  {
    id: "aleel-roastery-al-yarmouk",
    hex: "0x3e2eff926413248f:0x24fcd150e8760525",
    neighborhood: "al-yarmouk",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/aleel-roastery-al-yarmouk.png",
    pin: { lat: 24.79502, lng: 46.7738079 },
  },
  {
    id: "bourbon-al-yarmouk",
    hex: "0x3e2eff798c639d45:0x375fceb08818b6e5",
    neighborhood: "al-yarmouk",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/bourbon-al-yarmouk.png",
    pin: { lat: 24.8098125, lng: 46.7783419 },
  },
  {
    id: "ratio-speciality-al-yarmouk",
    hex: "0x3e2e55f8cd4e1917:0xbc7c44af66996afe",
    neighborhood: "al-yarmouk",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/ratio-speciality-al-yarmouk.png",
    pin: { lat: 24.8194701, lng: 46.7874456 },
  },
  {
    id: "coffee-zam-al-yarmouk",
    hex: "0x3e2effc4e747b721:0xffd19d8557198519",
    neighborhood: "al-yarmouk",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/coffee-zam-al-yarmouk.png",
    pin: { lat: 24.816499, lng: 46.7847336 },
  },
  {
    id: "nus-talqimah-al-yarmouk",
    hex: "0x3e2effbb7712f5cd:0xf217d75463bb2527",
    neighborhood: "al-yarmouk",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/nus-talqimah-al-yarmouk-ig.jpg",
    pin: { lat: 24.8036476, lng: 46.7823123 },
  },
  {
    id: "kapu-cafe-al-nahdah",
    hex: "0x3e2fab006fc29d1d:0x6a2ec990621bbdf6",
    neighborhood: "al-nahdah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/kapu-cafe-al-nahdah.jpg",
    pin: { lat: 24.7576811, lng: 46.8271043 },
  },
  {
    id: "dahal-specialty-al-nahdah",
    hex: "0x3e2f010fb8f6585f:0xc3e6d2fabf01a46c",
    neighborhood: "al-nahdah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/dahal-specialty-al-nahdah.jpg",
    pin: { lat: 24.7516863, lng: 46.8038631 },
  },
  {
    id: "ghazala-cafe-al-nahdah",
    hex: "0x3e2f01875e38ff97:0xc5979aa1ec438750",
    neighborhood: "al-nahdah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/ghazala-cafe-al-nahdah.jpg",
    pin: { lat: 24.7633626, lng: 46.8013449 },
  },
  {
    id: "shafel-roastery-al-nahdah",
    hex: "0x3e2f013a921c5aef:0x99dcd7909c19c6df",
    neighborhood: "al-nahdah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/shafel-roastery-al-nahdah.png",
    pin: { lat: 24.7530414, lng: 46.80502 },
  },
  {
    id: "half-ten-al-nahdah",
    hex: "0x3e2f016dfa1fc09f:0x5aea401159953cbb",
    neighborhood: "al-nahdah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.7590713, lng: 46.8151485 },
  },
  {
    id: "bon-ferro-al-nahdah",
    hex: "0x3e2f012d4a548e31:0x2d65151db6fc0270",
    neighborhood: "al-nahdah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/bon-ferro-al-nahdah.jpg",
    pin: { lat: 24.7540985, lng: 46.8042991 },
  },
  {
    id: "coffee-address-al-nahdah",
    hex: "0x3e2f012a3960ff87:0x2996eb4bdb39a559",
    neighborhood: "al-nahdah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/coffee-address-al-nahdah.png",
    pin: { lat: 24.7613807, lng: 46.8114104 },
  },
  {
    id: "chord-daily-coffee-al-nahdah",
    hex: "0x3e2f010077857247:0x79a2b6b88582e071",
    neighborhood: "al-nahdah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/chord-daily-coffee-al-nahdah-ig.jpg",
    pin: { lat: 24.7611736, lng: 46.8246659 },
  },
  {
    id: "taco-cup-al-nahdah",
    hex: "0x3e2f01edb9650413:0x2222fd5eaa07f25c",
    neighborhood: "al-nahdah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/taco-cup-al-nahdah-ig.jpg",
    pin: { lat: 24.7579051, lng: 46.814571 },
  },
  {
    id: "awj-cafe-al-nahdah",
    hex: "0x3e2f01000a8944b9:0xae7c66474051ecb7",
    neighborhood: "al-nahdah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.7734201, lng: 46.8175941 },
  },
  {
    id: "vase-coffee-al-manar",
    hex: "0x3e2f01ccc13f3451:0xae3dda615e00c6b3",
    neighborhood: "al-manar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "recaf-al-manar",
    hex: "0x3e2f01929b82eea1:0x89bad8d2f1573463",
    neighborhood: "al-manar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "kultura-al-rayyan",
    hex: "0x3e2f0116f2a31b83:0xbcef7ac8735bbfd1",
    neighborhood: "al-rayyan",
    vibe: ["قهوة"],
    moments: ["qahwa", "matcha"],
  },
  {
    id: "da-nonna-al-rayyan",
    hex: "0x3e2f0100548ec795:0xa6bdf61330fe728d",
    neighborhood: "al-rayyan",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "amber-speciality-al-rayyan",
    hex: "0x3e2f07725742b605:0x8836e0aca4b85d09",
    neighborhood: "al-rayyan",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
  },
  {
    id: "floated-al-rayyan",
    hex: "0x3e2f010072319b5b:0xe1af295792ab646d",
    neighborhood: "al-rayyan",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "sica-al-rayyan",
    hex: "0x3e2f0100484beb45:0x7c300df5671a0f8",
    neighborhood: "al-rayyan",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
  },
  {
    id: "fabrica-de-cafe-al-rayyan",
    hex: "0x3e2f018daa5b6821:0xb89a892653598037",
    neighborhood: "al-rayyan",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "78-specialty-coffee-al-rayyan",
    hex: "0x3e2f0167d7abda79:0x73d51f64c16cc56",
    neighborhood: "al-rayyan",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "the-it-al-rawabi",
    hex: "0x3e2f070d4dd944ed:0xc1e07e729b777b1d",
    neighborhood: "al-rawabi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "essert-al-rawabi",
    hex: "0x3e2f07004f893d2f:0x9a3b291a0c19ec46",
    neighborhood: "al-rawabi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "rukyah-al-fayha",
    hex: "0x3e2f070062c5a10f:0x7cd84702e1e15833",
    neighborhood: "al-fayha",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
  },
  {
    id: "roof-coffee-al-fayha",
    hex: "0x3e2f070047e03f6f:0x5bb80c4447e38ece",
    neighborhood: "al-fayha",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "maqha-mahamasa-al-raqban",
    hex: "0x3e2fa90033b5a43b:0x210c2933359fdb69",
    neighborhood: "al-raqban",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
  },
  {
    id: "on-al-rawdah",
    hex: "0x3e2f01e672a325cd:0x94bc2f1da36aedbf",
    neighborhood: "al-rawdah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
  },
  {
    id: "steam-roastery-al-rawdah",
    hex: "0x3e2f010055c30fb3:0x85b9cfe71ec71819",
    neighborhood: "al-rawdah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
  },
  {
    id: "serb-specialty-al-munsiyah",
    hex: "0x3e2eff8013dd1479:0x1056b156047683c8",
    neighborhood: "al-munsiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/serb-specialty-al-munsiyah-ig.jpg",
    pin: { lat: 24.82489, lng: 46.7505998 },
  },
  {
    id: "roasting-stages-al-munsiyah",
    hex: "0x3e2eff5a7a2fac3f:0x398188763a63fe64",
    neighborhood: "al-munsiyah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/roasting-stages-al-munsiyah.png",
    pin: { lat: 24.8256315, lng: 46.7592872 },
  },
  {
    id: "eagle-coffee-al-munsiyah",
    hex: "0x3e2ee59bb5832bdd:0xc11522a5efa0b5fc",
    neighborhood: "al-munsiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/eagle-coffee-al-munsiyah-ig.jpg",
    pin: { lat: 24.8189761, lng: 46.763994 },
  },
  {
    id: "najd-roastery-al-munsiyah",
    hex: "0x3e2eff00423b29f1:0x8703dd4f4153e5cb",
    neighborhood: "al-munsiyah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/najd-roastery-al-munsiyah.png",
    pin: { lat: 24.8173974, lng: 46.7534432 },
  },
  {
    id: "cu-specialty-al-munsiyah",
    hex: "0x3e2effb0fc87ca03:0x83c58f550d2c5eff",
    neighborhood: "al-munsiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/cu-specialty-al-munsiyah-ig.jpg",
    pin: { lat: 24.8431383, lng: 46.7624001 },
  },
  {
    id: "45-degrees-al-munsiyah",
    hex: "0x3e2effa75faab00b:0xe291f6ba9313c805",
    neighborhood: "al-munsiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/45-degrees-al-munsiyah-ig.jpg",
    pin: { lat: 24.8348614, lng: 46.7739141 },
  },
  {
    id: "true-side-al-munsiyah",
    hex: "0x3e2eff00faea78a1:0x6aef17bb831ee99b",
    neighborhood: "al-munsiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/true-side-al-munsiyah-ig.jpg",
    pin: { lat: 24.8188296, lng: 46.7617362 },
  },
  {
    id: "coffee-address-al-munsiyah",
    hex: "0x3e2eff00786d8df5:0xd0ff3a2c456c840c",
    neighborhood: "al-munsiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/coffee-address-al-munsiyah.png",
    pin: { lat: 24.8245625, lng: 46.7499375 },
  },
  {
    id: "das-mond-al-munsiyah",
    hex: "0x3e2effc1858c2761:0x6d4485abc147505b",
    neighborhood: "al-munsiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/das-mond-al-munsiyah-ig.jpg",
    pin: { lat: 24.8407049, lng: 46.7509581 },
  },
  {
    id: "anotherside-cafe-al-munsiyah",
    hex: "0x3e2eff84e93eee33:0x32fb2f1f77e63982",
    neighborhood: "al-munsiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/anotherside-cafe-al-munsiyah.jpg",
    pin: { lat: 24.8191788, lng: 46.762058 },
  },
  {
    id: "brew92-an-nada",
    hex: "0x3e2efdfd6d3b8419:0x27bd2abaf235982",
    neighborhood: "an-nada",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/brew92-an-nada.png",
    pin: { lat: 24.8169142, lng: 46.6877021 },
  },
  {
    id: "ashjar-cafe-ar-rabi",
    hex: "0x3e2ee30fc7c43677:0x513b46d8aebb6816",
    neighborhood: "al-rabi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/ashjar-cafe-ar-rabi.png",
    pin: { lat: 24.7863116, lng: 46.6587146 },
  },
  {
    id: "jazean-diplomatic-quarter",
    hex: "0x3e2f1da53f6c702b:0x93a74da9cf92504c",
    neighborhood: "diplomatic-quarter",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/jazean-diplomatic-quarter.png",
    pin: { lat: 24.6858552, lng: 46.628366 },
  },
  {
    id: "markab-king-fahd",
    hex: "0x3e2f1d006b44b683:0x2a0dec5a5c37872",
    neighborhood: "king-fahd",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/markab-king-fahd.jpg",
    pin: { lat: 24.7376542, lng: 46.6633059 },
  },
  {
    id: "kernel-al-takhassusi",
    hex: "0x3e2ee3601e4fa885:0x1f8cbed341f62a18",
    neighborhood: "al-takhassusi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/kernel-al-takhassusi.jpg",
  },
  {
    id: "percent-arabica-the-zone-al-takhassusi",
    hex: "0x3e2f1d1c6b289117:0x527881c3e12eddba",
    neighborhood: "al-takhassusi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/percent-arabica-the-zone-al-takhassusi.jpg",
  },
  {
    id: "idmi-nakheel-takhassusi",
    hex: "0x3e2ee30019bc1745:0x224a0ace7b458e3c",
    neighborhood: "al-takhassusi",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/idmi-nakheel-takhassusi.png",
    pin: { lat: 24.7416327, lng: 46.6453441 },
  },
  {
    id: "groovy-al-takhassusi",
    hex: "0x3e2ee3934bcf3d21:0x9ae62a9e1b9587f7",
    neighborhood: "al-takhassusi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/groovy-al-takhassusi.jpg",
  },
  {
    id: "dust-and-verse-al-takhassusi",
    hex: "0x3e2f03ad54c60f81:0x294b74ccebfd0c8d",
    neighborhood: "al-takhassusi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/dust-and-verse-al-takhassusi.jpg",
    pin: { lat: 24.6872518, lng: 46.6739168 },
  },
  {
    id: "somo-al-takhassusi",
    hex: "0x3e2f1d0008ce3c83:0xa8e94e0f1bfb929b",
    neighborhood: "al-takhassusi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/somo-al-takhassusi.jpg",
  },
  {
    id: "glim-al-takhassusi",
    hex: "0x3e2f1d0075b7160f:0xa1bedaec0badf986",
    neighborhood: "al-takhassusi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/glim-al-takhassusi.jpg",
    pin: { lat: 24.712996, lng: 46.6609346 },
  },
  {
    id: "sculpture-al-aqiq",
    hex: "0x3e2ee383bb1713f7:0x3a9e3135e98be6c9",
    neighborhood: "al-aqiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/sculpture-al-aqiq.jpg",
  },
  {
    id: "ashjar-cafe-al-aqiq",
    hex: "0x3e2ee38db0a63301:0xba5d889af803c0a",
    neighborhood: "al-aqiq",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/ashjar-cafe-al-aqiq.png",
  },
  {
    id: "shovel-al-aqiq",
    hex: "0x3e2ee3b974bb7f33:0x1f130924f0566fce",
    neighborhood: "al-aqiq",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/shovel-al-aqiq.jpg",
  },
  {
    id: "out-of-line-al-aqiq",
    hex: "0x3e2ee371efc108ab:0xfffacb4af3830520",
    neighborhood: "al-aqiq",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/out-of-line-al-aqiq.jpg",
  },
  {
    id: "camel-step-al-aqiq",
    hex: "0x3e2ee328730a5219:0x4f0d1eb822dd2d8d",
    neighborhood: "al-aqiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/camel-step-al-aqiq.jpg",
  },
  {
    id: "scarf-al-aqiq",
    hex: "0x3e2ee300741b08ff:0xc58d28584f15cb02",
    neighborhood: "al-aqiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/scarf-al-aqiq.jpg",
  },
  {
    id: "the-coffee-kingdom-al-aqiq",
    hex: "0x3e2ee311440571b5:0x4e012f88748be562",
    neighborhood: "al-aqiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/the-coffee-kingdom-al-aqiq.png",
  },
  {
    id: "file-coffee-al-aqiq",
    hex: "0x3e2ee32fc78236b1:0xbf5069a213ca2514",
    neighborhood: "al-aqiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/file-coffee-al-aqiq.png",
  },
  {
    id: "kultura-al-ghadeer",
    hex: "0x3e2ee3f9efcb182d:0xa81767965e896e7a",
    neighborhood: "al-ghadeer",
    vibe: ["قهوة"],
    moments: ["qahwa", "matcha"],
    logoUrl: "/logos/kultura-al-ghadeer.jpg",
  },
  {
    id: "tad-coffee-al-ghadeer",
    hex: "0x3e2ee390542f4ad3:0xd1f13a566b07ba8a",
    neighborhood: "al-ghadeer",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/tad-coffee-al-ghadeer.jpg",
  },
  {
    id: "ulica-al-ghadeer",
    hex: "0x3e2ee3bd0ad3f463:0x8d3dee05263debed",
    neighborhood: "al-ghadeer",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/ulica-al-ghadeer.jpg",
  },
  {
    id: "drip-al-ghadeer",
    hex: "0x3e2ee33c0aa921d7:0x853fb7054e5e0a7b",
    neighborhood: "al-ghadeer",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/drip-al-ghadeer.jpg",
  },
  {
    id: "blumen-al-ghadeer",
    hex: "0x3e2ee32d61c11661:0xca3685111ed18584",
    neighborhood: "al-ghadeer",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/blumen-al-ghadeer.jpg",
  },
  {
    id: "brsk-al-ghadeer",
    hex: "0x3e2ee3e6292a7867:0x5aa2eb3170848f9f",
    neighborhood: "al-ghadeer",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/brsk-al-ghadeer.jpg",
  },
  {
    id: "drive-al-ghadeer",
    hex: "0x3e2ee3007631ac4b:0x22a7ddce0ec9d709",
    neighborhood: "al-ghadeer",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/drive-al-ghadeer.jpg",
  },
  {
    id: "ghandoura-al-ghadeer",
    hex: "0x3e2ee3bd696afbef:0x111ece2b1f294089",
    neighborhood: "al-ghadeer",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/ghandoura-al-ghadeer.png",
  },
  {
    id: "acres-al-arid",
    hex: "0x3e2ee5d8adeaecd1:0xd80c1f753eed0176",
    neighborhood: "al-arid",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/acres-al-arid.jpg",
    pin: { lat: 24.829435, lng: 46.6168957 },
  },
  {
    id: "kicksters-lab-al-arid",
    hex: "0x3e2eef004378c7f9:0xf86efcebf2b37349",
    neighborhood: "al-arid",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/kicksters-lab-al-arid.jpg",
    pin: { lat: 24.9057371, lng: 46.6021245 },
  },
  {
    id: "shovel-al-arid",
    hex: "0x3e2ee5e231686103:0x6a3d8ab7a14d5023",
    neighborhood: "al-arid",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/shovel-al-arid.jpg",
    pin: { lat: 24.8345725, lng: 46.6105639 },
  },
  {
    id: "archi-al-arid",
    hex: "0x3e2ee50039c8b73d:0xfc743b6081b43408",
    neighborhood: "al-arid",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/archi-al-arid.jpg",
    pin: { lat: 24.8775403, lng: 46.6353921 },
  },
  {
    id: "drive-al-arid",
    hex: "0x3e2eef0056ddc7d1:0xfb336407ddf0d6fd",
    neighborhood: "al-arid",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/drive-al-arid.jpg",
    pin: { lat: 24.8989508, lng: 46.6184764 },
  },
  {
    id: "roasting-house-al-arid",
    hex: "0x3e2eefd495ce4b2d:0x54605d59e8df0a6e",
    neighborhood: "al-arid",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/roasting-house-al-arid.png",
    pin: { lat: 24.897402, lng: 46.6157352 },
  },
  {
    id: "coffee-address-al-arid",
    hex: "0x3e2eef0015c62295:0xf26e879a068bc59f",
    neighborhood: "al-arid",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/coffee-address-al-arid.png",
    pin: { lat: 24.8897609, lng: 46.6075216 },
  },
  {
    id: "shiro-al-arid",
    hex: "0x3e2ee5c1d655ba27:0x91382f61b79eba27",
    neighborhood: "al-arid",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/shiro-al-arid.png",
    pin: { lat: 24.8719327, lng: 46.638051 },
  },
  {
    id: "cypress-al-qirawan",
    hex: "0x3e2ee5d9e9b1c0a1:0xe8bdd1987c8ee36a",
    neighborhood: "al-qirawan",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/cypress-al-qirawan.jpg",
    pin: { lat: 24.8324769, lng: 46.6047769 },
  },
  {
    id: "3bean-al-qirawan",
    hex: "0x3e2ee78c85905ec9:0xfc3a19f12086466e",
    neighborhood: "al-qirawan",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/3bean-al-qirawan.jpg",
    pin: { lat: 24.8250502, lng: 46.5651313 },
  },
  {
    id: "ashjar-cafe-al-qirawan",
    hex: "0x3e2ee70016ffdc11:0xea1ee22b9b23dfc0",
    neighborhood: "al-qirawan",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/ashjar-cafe-al-qirawan.jpg",
    pin: { lat: 24.8287476, lng: 46.5927257 },
  },
  {
    id: "drip-al-qirawan",
    hex: "0x3e2ee5111caa997b:0x8cbb29d5c588f88a",
    neighborhood: "al-qirawan",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/drip-al-qirawan.jpg",
    pin: { lat: 24.8233431, lng: 46.5935748 },
  },
  {
    id: "coffee-side-al-qirawan",
    hex: "0x3e2ee560f5286efd:0x842ef5bde02cb7a1",
    neighborhood: "al-qirawan",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/coffee-side-al-qirawan.jpg",
    pin: { lat: 24.8452215, lng: 46.6008157 },
  },
  {
    id: "caf-lab-al-qirawan",
    hex: "0x3e2ee7c283f1c827:0x7e5fbcf57fcdb504",
    neighborhood: "al-qirawan",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/caf-lab-al-qirawan.jpg",
    pin: { lat: 24.829002, lng: 46.5708462 },
  },
  {
    id: "drive-al-qirawan",
    hex: "0x3e2ee5005d3f77b3:0x3ddaaa1f8ffdf657",
    neighborhood: "al-qirawan",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/drive-al-qirawan.jpg",
    pin: { lat: 24.8458534, lng: 46.6049121 },
  },
  {
    id: "scout-coffee-al-qirawan",
    hex: "0x3e2ee577a4d07853:0x96391b83d246d30b",
    neighborhood: "al-qirawan",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/scout-coffee-al-qirawan.jpg",
    pin: { lat: 24.8238569, lng: 46.5987508 },
  },
  {
    id: "white-roastery-al-wadi",
    hex: "0x3e2efd4c59b8a753:0x815af97d607e977",
    neighborhood: "al-wadi",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/white-roastery-al-wadi.jpg",
    pin: { lat: 24.7957457, lng: 46.6983637 },
  },
  {
    id: "parole-cafe-al-wadi",
    hex: "0x3e2efd0080281c31:0xa85df2eb14e5e64",
    neighborhood: "al-wadi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/parole-cafe-al-wadi.jpg",
    pin: { lat: 24.7862841, lng: 46.703205 },
  },
  {
    id: "wama-coffee-al-wadi",
    hex: "0x3e2efd005e122c09:0x53d74736856dba32",
    neighborhood: "al-wadi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/wama-coffee-al-wadi.jpg",
    pin: { lat: 24.7947623, lng: 46.6874763 },
  },
  {
    id: "sand-clock-al-muruj",
    hex: "0x3e2ee364e66ca44d:0xf72c965ec8ab1103",
    neighborhood: "al-muruj",
    vibe: ["قهوة"],
    moments: ["qahwa", "work", "pastry", "quiet"],
    logoUrl: "/logos/sand-clock-brand.png",
    pin: { lat: 24.75671, lng: 46.65923 },
  },
  {
    id: "sand-clock-as-sulimaniyah",
    hex: "0x3e2f030007019d37:0xa01a5c275f012543",
    neighborhood: "sulimaniyah",
    vibe: ["قهوة"],
    moments: ["qahwa", "work", "pastry", "quiet"],
    logoUrl: "/logos/sand-clock-brand.png",
    pin: { lat: 24.71364, lng: 46.68369 },
  },
  {
    id: "unique-drip-al-mohammadiyah",
    hex: "0x3e2f1df25f5b36c5:0xce078fe5af016279",
    neighborhood: "al-mohammadiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/unique-drip-al-mohammadiyah.jpg",
    pin: { lat: 24.7290199, lng: 46.6419338 },
  },
  {
    id: "hjeen-roasters-al-mohammadiyah",
    hex: "0x3e2f1d0022a32015:0xa1e8c8e53a423eef",
    neighborhood: "al-mohammadiyah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/hjeen-roasters-al-mohammadiyah.png",
    pin: { lat: 24.7339154, lng: 46.6509835 },
  },
  {
    id: "hekaya-tale-al-mohammadiyah",
    hex: "0x3e2ee3c785340ba3:0x1040610befd3aaef",
    neighborhood: "al-mohammadiyah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/hekaya-tale-al-mohammadiyah.png",
    pin: { lat: 24.7236533, lng: 46.645624 },
  },
  {
    id: "parka-coffee-al-muruj",
    hex: "0x3e2efd5f75620101:0x325697b79b162377",
    neighborhood: "al-muruj",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/parka-coffee-al-muruj.jpg",
    pin: { lat: 24.7525344, lng: 46.6737331 },
  },
  {
    id: "terra-cafe-al-muruj",
    hex: "0x3e2ee3000bf1c16f:0x78be0f665472ab19",
    neighborhood: "al-muruj",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/terra-cafe-al-muruj.jpg",
    pin: { lat: 24.7578883, lng: 46.6524653 },
  },
  {
    id: "rabka-al-muruj",
    hex: "0x3e2ee325fa09f273:0x7a10503f421bc047",
    neighborhood: "al-muruj",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/rabka-al-muruj.jpg",
    pin: { lat: 24.7554029, lng: 46.6562724 },
  },
  {
    id: "lasani-cafe-al-malaz",
    hex: "0x3e2f052858ee6daf:0x72a92946ed638cb1",
    neighborhood: "al-malaz",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/lasani-cafe-al-malaz.png",
    pin: { lat: 24.6664954, lng: 46.7225849 },
  },
  {
    id: "golden-pot-al-malaz",
    hex: "0x3e2f059ab00b237f:0x8a38691d19c4d1d4",
    neighborhood: "al-malaz",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/golden-pot-al-malaz.jpg",
    pin: { lat: 24.6615963, lng: 46.7267526 },
  },
  {
    id: "walnut-wood-coffee-al-malaz",
    hex: "0x3e2f05ba44347f55:0xb1841f0e5664d80a",
    neighborhood: "al-malaz",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/walnut-wood-malaz-mark.png",
    pin: { lat: 24.6663848, lng: 46.7242422 },
  },
  {
    id: "hazzah-coffee-al-malaz",
    hex: "0x3e2f05bb7d55715d:0x13592f76325f0de2",
    neighborhood: "al-malaz",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/hazzah-malaz-mark.png",
    pin: { lat: 24.6700884, lng: 46.7389702 },
  },
  {
    id: "canto-al-malaz",
    hex: "0x3e2f05114535986d:0xbb8d0dee4e12d7fe",
    neighborhood: "al-malaz",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/canto-malaz-mark.png",
    pin: { lat: 24.6614598, lng: 46.7443033 },
  },
  {
    id: "house-of-matcha-al-mohammadiyah",
    hex: "0x3e2f1dff7a822ea1:0x8da1607501bf0e7a",
    neighborhood: "al-mohammadiyah",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
  },
  {
    id: "house-of-matcha-sulimaniyah",
    hex: "0x3e2f03cc8803eac7:0x5b8677386f9a894e",
    neighborhood: "sulimaniyah",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
  },
  {
    id: "somatcha-an-nada",
    hex: "0x3e2efdbd42c9ba8d:0x384a8731bf901bab",
    neighborhood: "an-nada",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/somatcha-an-nada.jpg",
  },
  {
    id: "the-matcha-bar-olaya",
    hex: "0x3e2f034e019ea32d:0x8d43d3deac74089d",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
  },
  {
    id: "with-heart-diriyah",
    hex: "0x3e2ee1006cf2209b:0xf3841da23256fe4b",
    neighborhood: "diriyah",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
  },
  {
    id: "kuro-sulimaniyah",
    hex: "0x3e2f03eee2fbbb01:0x8cd39c2698b8e773",
    neighborhood: "sulimaniyah",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/kuro-sulimaniyah.png",
  },
  {
    id: "opinion-al-mathar",
    hex: "0x3e2f1d6cdc2c21b1:0xf7da8c11431eb292",
    neighborhood: "al-mathar",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/opinion-al-mathar.jpg",
  },
  {
    id: "opinion-hittin",
    hex: "0x3e2ee30ff9b8dd79:0x94b71f92f5dc9ecb",
    neighborhood: "hittin",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/opinion-hittin.jpg",
  },
  {
    id: "kultura-hittin",
    hex: "0x3e2ee32fcfefa59f:0x231ad463648767e7",
    neighborhood: "hittin",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/kultura-hittin.jpg",
  },
  {
    id: "kultura-al-malqa",
    hex: "0x3e2ee7a9c0d733a7:0xd2cc3fb5ae36a108",
    neighborhood: "al-malqa",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/kultura-al-malqa.jpg",
  },
  {
    id: "quokka-coffee-al-muruj",
    hex: "0x3e2ee3c250d09213:0xd7b461011cda0655",
    neighborhood: "al-muruj",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/quokka-coffee-al-muruj.png",
  },
  {
    id: "quokka-coffee-ghirnatah",
    hex: "0x3e2eff0005bd450d:0x558e7e8ad5e5be61",
    neighborhood: "ghirnatah",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/quokka-coffee-ghirnatah.png",
  },
  {
    id: "iota-al-ghadeer",
    hex: "0x3e2ee3210b6fff2b:0xfc195ee361241e01",
    neighborhood: "al-ghadeer",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/iota-al-ghadeer.jpg",
  },
  {
    id: "some-coffee-bar-al-muruj",
    hex: "0x3e2ee34e93f6959d:0x43af7bfdcdbd32b7",
    neighborhood: "al-muruj",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/some-coffee-bar-al-muruj.png",
  },
];

for (const row of scoutPack) {
  const shop = getShop(row.id);
  assert(shop, `${row.id} is a real catalog shop`);
  assert(shop.example === false, `${row.id} is not an example shop`);
  assert(shop.neighborhood === row.neighborhood, `${row.id} neighborhood`);
  assert(
    shop.mapsShareUrl ===
      `https://www.google.com/maps/place/data=!4m2!3m1!1s${row.hex}`,
    `${row.id} maps href is official place id form`,
  );
  assert(!("hours" in shop), `${row.id} catalog has no hours field`);
  if (row.logoUrl) {
    assert(shop.logoUrl === row.logoUrl, `${row.id} uses Scout official logo`);
  } else if (row.id === "jazwa-specialty-coffee-ar-rabwah") {
    assert(
      shop.logoUrl === "/logos/jazwa-specialty-coffee-ar-rabwah.jpg",
      "jazwa uses Instagram @Jazwah.sa mark",
    );
  } else {
    assert(!("logoUrl" in shop), `${row.id} catalog has no logoUrl (letter tile)`);
  }
  if (row.pin) {
    assert(shop.pin?.lat === row.pin.lat, `${row.id} official pin lat`);
    assert(shop.pin?.lng === row.pin.lng, `${row.id} official pin lng`);
  } else {
    assert(!("pin" in shop), `${row.id} catalog has no invented pin`);
  }
  assert(
    shop.vibeTags.join(",") === row.vibe.join(","),
    `${row.id} vibeTags`,
  );
  assert(
    shop.momentTags.join(",") === row.moments.join(","),
    `${row.id} momentTags`,
  );
}

assert(
  !getShop("sand-clock-sulimaniyah"),
  "old sand-clock-sulimaniyah id is retired (Muruj hex moved)",
);
assert(
  getShop("sand-clock-al-muruj")?.mapsShareUrl?.includes(
    "0x3e2ee364e66ca44d:0xf72c965ec8ab1103",
  ),
  "Muruj row keeps the original catalog hex",
);
assert(
  LEGACY_SHOP_REDIRECTS.some(
    (row) =>
      row.source === "/c/sand-clock-sulimaniyah" &&
      row.destination === "/c/sand-clock-al-muruj" &&
      row.statusCode === 308,
  ),
  "old AR card slug 308s to sand-clock-al-muruj",
);
assert(
  LEGACY_SHOP_REDIRECTS.some(
    (row) =>
      row.source === "/en/c/sand-clock-sulimaniyah" &&
      row.destination === "/en/c/sand-clock-al-muruj" &&
      row.statusCode === 308,
  ),
  "old EN card slug 308s to sand-clock-al-muruj",
);
assert(
  !listRealShops().some((shop) => shop.neighborhood === "al-wurud" && /sand.?clock|ساعة الرمل|ساند كلوك/i.test(`${shop.id} ${shop.nameEn} ${shop.nameAr}`)),
  "do not invent a Sand Clock Wurud row",
);

const malqaAr = neighborhoodLabel("al-malqa", "ar");
const ghirEn = neighborhoodLabel("ghirnatah", "en");
assert(
  categoryDistrictHeading(COFFEE_SHOPS_CATEGORY, "al-malqa", "ar") ===
    `مقاهي في ${malqaAr}`,
  "AR heading is مقاهي في {district}",
);
assert(
  districtTitle("al-malqa", "ar") === `مقاهي في ${malqaAr} · ${PRODUCT_NAME}`,
  "AR title is مقاهي في {district} · wain.lol",
);
assert(
  districtTitle("ghirnatah", "en") === `Coffee shops in ${ghirEn} · ${PRODUCT_NAME}`,
  "EN title is Coffee shops in {district} · wain.lol",
);
assert(
  districtDescription("al-malqa", "ar").includes(malqaAr),
  "AR malqa description names the district",
);
assert(
  districtDescription("al-malqa", "ar").includes("wain.lol"),
  "AR malqa description names wain.lol",
);
assert(
  districtDescription("ghirnatah", "en").includes("Ghirnatah"),
  "EN ghirnatah description names Ghirnatah",
);
assert(
  districtDescription("ghirnatah", "en").includes("wain.lol"),
  "EN ghirnatah description names wain.lol",
);

const ghirMeta = districtMetadata("ghirnatah", "en");
assert(
  ghirMeta.alternates?.canonical === "/en/coffee-shops/ghirnatah",
  "EN district canonical",
);
assert(
  ghirMeta.alternates?.languages?.["ar-SA"] === "/coffee-shops/ghirnatah",
  "district hreflang ar-SA",
);
assert(
  ghirMeta.alternates?.languages?.en === "/en/coffee-shops/ghirnatah",
  "district hreflang en",
);

const sitemap = buildSitemapXml("2026-09-04");
for (const id of areas) {
  assert(
    sitemap.includes(`https://wain.lol${districtPath(id, "ar")}<`),
    `sitemap missing ${districtPath(id, "ar")}`,
  );
  assert(
    sitemap.includes(`https://wain.lol${districtPath(id, "en")}<`),
    `sitemap missing ${districtPath(id, "en")}`,
  );
}
assert(!sitemap.includes("/n/"), "sitemap must drop retired /n/ paths");
assert(!sitemap.includes("/en/n/"), "sitemap must drop retired /en/n/ paths");
assert(!/Koofi/i.test(sitemap), "sitemap must not say Koofi");

assert(MOST_POPULAR_SLUG === "most-popular", "popular slug stays Latin most-popular");
assert(
  mostPopularPath("ar") === "/coffee-shops/most-popular",
  "AR most-popular path",
);
assert(
  mostPopularPath("en") === "/en/coffee-shops/most-popular",
  "EN most-popular path",
);
assert(
  MOST_POPULAR_EN_ALIAS_PATH === "/en/most-popular-cafes-in-riyadh",
  "EN popular alias path",
);
assert(
  resolveDistrictSlug("most-popular") === null,
  "most-popular is not a district slug",
);
assert(
  mostPopularHeading("ar") === "أشهر القهاوي في الرياض",
  "AR popular H1 stays thin directory tone",
);
assert(
  mostPopularHeading("en") === "Most popular coffee shops in Riyadh",
  "EN popular H1 stays thin directory tone",
);
assert(
  mostPopularTitle("ar") === `${MOST_POPULAR_HEADING.ar} · ${PRODUCT_NAME}`,
  "AR popular title matches district · wain.lol tone",
);
assert(
  mostPopularTitle("en") === `${MOST_POPULAR_HEADING.en} · ${PRODUCT_NAME}`,
  "EN popular title matches district · wain.lol tone",
);
assert(
  mostPopularDescription("ar") ===
    `${MOST_POPULAR_HEADING.ar} · ${copy.directoryHint.ar}`,
  "AR popular description stays heading + directoryHint",
);
assert(
  mostPopularDescription("en") ===
    `${MOST_POPULAR_HEADING.en} · ${copy.directoryHint.en}`,
  "EN popular description stays heading + directoryHint",
);

const popularMeta = mostPopularMetadata("en");
assert(
  popularMeta.alternates?.canonical === "/en/coffee-shops/most-popular",
  "EN popular canonical",
);
assert(
  popularMeta.alternates?.languages?.["ar-SA"] === "/coffee-shops/most-popular",
  "popular hreflang ar-SA",
);
assert(
  popularMeta.alternates?.languages?.en === "/en/coffee-shops/most-popular",
  "popular hreflang en",
);

const popularShops = listPopularDirectoryShops();
const rankedCatalog = rankByPopularity(listRealShops());
assert(
  popularShops.length === listRealShops().length,
  "popular directory lists the full catalog",
);
assert(
  popularShops.map((shop) => shop.id).join(",") ===
    rankedCatalog.map((shop) => shop.id).join(","),
  "popular directory follows popularityIndex DESC",
);
assert(
  popularShops[0]?.id === "namq-al-malqa",
  "popular directory lead is namq-al-malqa",
);
assert(
  popularShops.slice(0, 3).map((shop) => shop.id).join(",") ===
    "namq-al-malqa,urth-caffe-tahlia-sulimaniyah,breehant-al-yasmin",
  "popular directory top 3 matches PR #97 lock",
);
for (let i = 1; i < popularShops.length; i += 1) {
  const prev = rankedCatalog[i - 1];
  const next = rankedCatalog[i];
  assert(prev && next, "popular rank rows exist");
  const prevScore = prev.popularityIndex ?? Number.NEGATIVE_INFINITY;
  const nextScore = next.popularityIndex ?? Number.NEGATIVE_INFINITY;
  assert(
    prevScore > nextScore ||
      (prevScore === nextScore && prev.id.localeCompare(next.id) <= 0),
    `popular sort broke at ${prev.id} -> ${next.id}`,
  );
}

assert(
  sitemap.includes("https://wain.lol/coffee-shops/most-popular<"),
  "sitemap missing AR most-popular",
);
assert(
  sitemap.includes("https://wain.lol/en/coffee-shops/most-popular<"),
  "sitemap missing EN most-popular",
);
assert(
  sitemap.includes("https://wain.lol/neighborhoods<"),
  "sitemap missing AR neighborhoods index",
);
assert(
  sitemap.includes("https://wain.lol/en/neighborhoods<"),
  "sitemap missing EN neighborhoods index",
);
assert(
  !sitemap.includes("most-popular-cafes-in-riyadh"),
  "sitemap must not list the EN alias",
);

const nextConfig = readFileSync(
  join(process.cwd(), "next.config.ts"),
  "utf8",
);
assert(
  nextConfig.includes('source: "/en/most-popular-cafes-in-riyadh"'),
  "next.config has EN popular alias",
);
assert(
  nextConfig.includes('destination: "/en/coffee-shops/most-popular"'),
  "alias points at EN most-popular",
);
assert(nextConfig.includes("statusCode: 308"), "alias is 308");

assert(
  TEMPORARY_DEFAULT_LANDING_MOST_POPULAR === false,
  "P0 home is `/` — Most Popular redirect is off",
);
assert(
  !/source:\s*"\/"\s*,\s*\n\s*destination:\s*"\/coffee-shops\/most-popular"/.test(
    nextConfig,
  ),
  "`/` is the P0 home — no 308 to Most Popular",
);
assert(
  !/source:\s*"\/en"\s*,\s*\n\s*destination:\s*"\/en\/coffee-shops\/most-popular"/.test(
    nextConfig,
  ),
  "`/en` is the EN home — no 308 to Most Popular",
);
assert(
  nextConfig.includes("TEMPORARY_DEFAULT_LANDING_MOST_POPULAR"),
  "TEMPORARY landing redirects stay behind the revert flag",
);

const vibeChips = readFileSync(
  join(process.cwd(), "components/vibe-chips.tsx"),
  "utf8",
);
assert(
  vibeChips.includes("chipSharePath(chip.id, language)"),
  "Most Popular chip is a shareable Link",
);
assert(
  readFileSync(join(process.cwd(), "components/chat.tsx"), "utf8").includes(
    'chipId === "popular"',
  ),
  "chat must not post Most Popular to /api/chat",
);
assert(
  vibeChips.includes("selectedId"),
  "vibe chips take a selectedId",
);
assert(
  vibeChips.includes("border-bean bg-bean") && vibeChips.includes("text-foam"),
  "selected vibe chip reuses directory bean fill",
);
assert(
  vibeChips.includes('aria-current={selected ? "page" : undefined}'),
  "selected popular vibe chip marks the current page",
);
assert(
  vibeChips.includes("homeSurfaceChips") && !vibeChips.includes("meet-halfway"),
  "home chip grid is the 4×2 subset — بيننا is not a tile",
);
assert(
  readFileSync(
    join(process.cwd(), "components/meet-halfway-card.tsx"),
    "utf8",
  ).includes("MEET_HALFWAY_CHIP"),
  "بيننا is a utility card above the chips",
);
assert(
  !vibeChips.includes("ثلاث الليلة") && !vibeChips.includes("ON TONIGHT"),
  "Soft Places chips stay parked",
);

const halfwayPicker = readFileSync(
  join(process.cwd(), "components/meet-halfway-picker.tsx"),
  "utf8",
);
assert(
  halfwayPicker.includes("meetHalfwayMe") &&
    halfwayPicker.includes("looksLikeSharedPin") &&
    halfwayPicker.includes("requestVisitorLocation") &&
    halfwayPicker.includes("usePeekVisitorLocation") &&
    halfwayPicker.includes("MeetHalfwayHero"),
  "بيننا picker is pin–cup–pin invite (Maps URL / geo), coords hidden",
);
assert(!halfwayPicker.includes("<select"), "بيننا has no district dropdowns");
assert(
  !halfwayPicker.includes("toFixed(5)"),
  "بيننا Ready card does not paint lat,lng",
);
assert(
  halfwayPicker.includes("meetHalfwayMyPin") &&
    halfwayPicker.includes("meetHalfwayInvite") &&
    halfwayPicker.includes("meetHalfwayCopyLink") &&
    !halfwayPicker.includes("directoryNeighborhoods"),
  "بيننا asks for pins + اعزم خويك, not districts",
);

const homeLanding = readFileSync(
  join(process.cwd(), "components/home-landing.tsx"),
  "utf8",
);
assert(
  homeLanding.includes("BrowseNeighborhoods"),
  "P0 home mounts Browse by Neighborhood",
);
assert(
  readFileSync(
    join(process.cwd(), "components/shop-directory.tsx"),
    "utf8",
  ).includes("{district || popular ? ("),
  "home drops the old district wrap",
);
assert(
  homeLanding.includes('? "popular"') &&
    homeLanding.includes("selectedChipId={pageChipId}"),
  "most-popular landing selects the popular vibe chip",
);
assert(
  filterPutsDirectoryFirst("popular", null),
  "Most Popular puts the ranked list above New this week",
);
assert(
  filterPutsDirectoryFirst(null, "hittin"),
  "district filter puts the directory above New this week",
);
assert(
  !filterPutsDirectoryFirst(null, null),
  "unfiltered home keeps New this week above the directory",
);

const chatSource = readFileSync(
  join(process.cwd(), "components/chat.tsx"),
  "utf8",
);
assert(
  chatSource.includes("selectedChipId") &&
    chatSource.includes("selectedChipId === undefined") &&
    chatSource.includes("pickedChipId"),
  "chat forwards selectedChipId to vibe chips",
);

console.log(`check-district-urls: ok (${areas.length} districts)`);
