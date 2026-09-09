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
  legacyDistrictPath,
  MOST_POPULAR_EN_ALIAS_PATH,
  MOST_POPULAR_HEADING,
  MOST_POPULAR_SLUG,
  mostPopularHeading,
  mostPopularPath,
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
assert(areas.length === 25, `expected 25 districts, got ${areas.length}`);
assert(listRealShops().length === 171, `catalog 161→171, got ${listRealShops().length}`);

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
assert(
  rawdah.some((shop) => shop.id === "hai-coffee-roasters-al-rawdah"),
  "al-rawdah includes hai-coffee-roasters-al-rawdah",
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

assert(
  NEW_THIS_WEEK_IDS.join(",") ===
    "november-coffee-an-nazhah,belong-an-nazhah,elite-cup-roasters-an-nazhah",
  "New this week allowlist is the An Nuzhah trio",
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
    | "al-nahdah";
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
    moments: ["qahwa"],
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
  TEMPORARY_DEFAULT_LANDING_MOST_POPULAR === true,
  "TEMPORARY experiment flag defaults Most Popular landing on",
);
assert(
  /source:\s*"\/"\s*,\s*\n\s*destination:\s*"\/coffee-shops\/most-popular"/.test(
    nextConfig,
  ),
  "TEMPORARY: `/` 308s to AR most-popular",
);
assert(
  /source:\s*"\/en"\s*,\s*\n\s*destination:\s*"\/en\/coffee-shops\/most-popular"/.test(
    nextConfig,
  ),
  "TEMPORARY: `/en` 308s to EN most-popular",
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
  vibeChips.includes("mostPopularPath(language)"),
  "Most Popular chip is a shareable Link",
);
assert(
  readFileSync(join(process.cwd(), "components/chat.tsx"), "utf8").includes(
    'if (chip.id === "popular")',
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

const homeLanding = readFileSync(
  join(process.cwd(), "components/home-landing.tsx"),
  "utf8",
);
assert(
  homeLanding.includes('selectedChipId={popular ? "popular" : undefined}'),
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
    chatSource.includes("selectedId={selectedChipId ?? pickedChipId}"),
  "chat forwards selectedChipId to vibe chips",
);

console.log(`check-district-urls: ok (${areas.length} districts)`);
