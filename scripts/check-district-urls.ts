import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  getShop,
  listDirectoryShops,
  listDirectoryShopsForDistrict,
  listDiscoveryShops,
  isDriveThroughLane,
  listDriveThroughDirectoryShops,
  listRealShops,
} from "../lib/catalog";
import { listNewThisWeekShops, NEW_THIS_WEEK_IDS } from "../lib/new-this-week";
import {
  listTrendingThisWeekShops,
  TRENDING_THIS_WEEK_IDS,
} from "../lib/trending-this-week";
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
  filterDirectoryShopsByMoment,
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
  chipDirectoryMoment,
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
  LEGACY_DISTRICT_REDIRECTS,
} from "../lib/product";
import { listingCardTags } from "../lib/listing-tags";
import { officialShopCoords } from "../lib/place-coords";
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
assert(resolveDistrictSlug("al-raqban") === null, "al-raqban is no longer a district slug (308 to as-salam)");
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
assert(resolveDistrictSlug("at-taawun") === "at-taawun", "at-taawun resolves");
assert(resolveDistrictSlug("al-mursalat") === "al-mursalat", "al-mursalat resolves");
assert(resolveDistrictSlug("al-murabba") === "al-murabba", "al-murabba resolves");
assert(resolveDistrictSlug("as-salam") === "as-salam", "as-salam resolves");
assert(resolveDistrictSlug("ghubairah") === "ghubairah", "ghubairah resolves");
assert(resolveDistrictSlug("al-wisham") === "al-wisham", "al-wisham resolves");
assert(resolveDistrictSlug("badr") === "badr", "badr resolves");
assert(resolveDistrictSlug("al-aziziyah") === "al-aziziyah", "al-aziziyah resolves");
assert(resolveDistrictSlug("al-hazm") === "al-hazm", "al-hazm resolves");
assert(resolveDistrictSlug("al-andalus") === "al-andalus", "al-andalus resolves");
assert(resolveDistrictSlug("al-khaleej") === "al-khaleej", "al-khaleej resolves");
assert(resolveDistrictSlug("an-nasim-al-gharbi") === "an-nasim-al-gharbi", "an-nasim-al-gharbi resolves");
assert(resolveDistrictSlug("ar-rimal") === "ar-rimal", "ar-rimal resolves");
assert(resolveDistrictSlug("al-janadriyyah") === "al-janadriyyah", "al-janadriyyah resolves");
assert(resolveDistrictSlug("namar") === "namar", "namar resolves");
assert(resolveDistrictSlug("kkia") === "kkia", "kkia resolves");
assert(resolveDistrictSlug("al-jazirah") === "al-jazirah", "al-jazirah resolves");
assert(resolveDistrictSlug("an-nasim-ash-sharqi") === "an-nasim-ash-sharqi", "an-nasim-ash-sharqi resolves");
assert(resolveDistrictSlug("an-nasim") === "an-nasim", "an-nasim resolves");
assert(resolveDistrictSlug("shubra") === "shubra", "shubra resolves");
assert(resolveDistrictSlug("manfuha") === "manfuha", "manfuha resolves");
assert(resolveDistrictSlug("tuwaiq") === "tuwaiq", "tuwaiq resolves");
assert(resolveDistrictSlug("as-suwaidi") === "as-suwaidi", "as-suwaidi resolves");
assert(resolveDistrictSlug("king-khalid-international-airport") === null, "KKIA airport slug is not a live district");
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
assert(!(areas as string[]).includes("al-raqban"), "directory drops al-raqban (folded into as-salam)");
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
assert(areas.includes("at-taawun"), "directory includes at-taawun");
assert(areas.includes("shubra"), "directory includes shubra (Batch F)");
assert(areas.includes("an-nasim-ash-sharqi"), "directory includes an-nasim-ash-sharqi");
assert(areas.includes("an-nasim-al-gharbi"), "directory includes an-nasim-al-gharbi");
assert(areas.includes("al-falah"), "directory includes al-falah");
assert(areas.includes("al-izdihar"), "directory includes al-izdihar");
assert(areas.includes("dhahrat-al-badiah"), "directory includes dhahrat-al-badiah");
assert(areas.includes("al-aziziyah"), "directory includes al-aziziyah");
for (const id of ["umm-al-hamam-al-gharbi", "an-nafal", "king-salman", "as-suwaidi"] as const) {
  assert(areas.includes(id), `directory includes ${id} (Bisat batch)`);
}
assert(areas.length === 65, `expected 65 districts (Al Raqban folded into As Salam, 21 Oct; 62 + Shubra, Batch F + As Salam, Batch J THE HAT + Umm Al Hamam Ash Sharqi, Batch L + Al Mursalat, Trace AJ add), got ${areas.length}`);
assert(listDiscoveryShops().length === 544, `specialty discovery is 544 (10 trending adds 21 Oct + − 2 Namq now chain, 21 Oct; 7 Batch SD1 Al Shohda local + 6 Batch S As Salam local + 3 Batch R Al Qadisiyah local + 7 trending adds 18 Oct + 1 Trace Al Mursalat AJ add + 9 Batch Q Ash Shifa local + 14 Batch P Tuwaiq local + 2 Batch O Namar local + 1 Found Ar Rabwah AJ add + 403 + 9 Batch E At Taawun local + 7 Batch F Shubra local + 12 Batch G An Nafal local + 7 Batch H Al Izdihar local + 4 Batch I Ar Rahmaniyyah local + 4 Batch J Al Mathar local + 4 Batch J other adds + 11 Batch K Umm Al Hamam Al Gharbi local + 3 Batch L Umm Al Hamam Ash Sharqi local + 9 Batch M Diplomatic Quarter local + 13 Batch N Dhahrat Laban local; Veloce is a chain), got ${listDiscoveryShops().length}`);
assert(listRealShops().length === 647, `catalog is 647 after the 21 Oct trending adds (10), Batch SD1 (14 Al Shohda), Batch S (6 As Salam), Batch R (8 Al Qadisiyah), the 18 Oct trending adds (7), Trace Al Mursalat (AJ add), Batch Q (12 Ash Shifa), Batch P (14 Tuwaiq), Batch O (4 Namar), Found Ar Rabwah (AJ add), D1, D2, D3, Batch E, Batch F, Batch G, Batch H (7 Al Izdihar), Batch I (6 Ar Rahmaniyyah), Batch J (8 Al Mathar + 4 other adds), Batch K (12 Umm Al Hamam Al Gharbi), Batch L (3 Umm Al Hamam Ash Sharqi) and Batch M (13 Diplomatic Quarter) and Batch N (15 Dhahrat Laban), got ${listRealShops().length}`);

const granada = filterDirectoryShops(shops, "ghirnatah");
assert(granada.length === 4, `ghirnatah keeps the 4 east-Ghirnatah rows after 6 moved to al-shohda (21 Oct), got ${granada.length}`);
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
  neighborhoodLabel("al-safa", "en") === "As Safa",
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
  "hjeen-roaster-saudi-90s-ar-rabwah",
  "on-move-ar-rabwah",
  "claz-ar-rabwah",
  "coffee-address-ar-rabwah",
  "coffee-address-ar-rabwah-ihsaa",
  "somatcha-ar-rabwah",
  "jaam-coffee-ar-rabwah",
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
assert(rawdah.length === 4, `al-rawdah has 4 shops (Robusta Bake, Batch J r2), got ${rawdah.length}`);
assert(rawdah.some((shop) => shop.id === "robusta-bake-al-rawdah"), "al-rawdah includes robusta-bake-al-rawdah");
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
  neighborhoodLabel("al-rawdah", "en") === "Ar Rawdah",
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
assert(qurtubah.length === 11, `qurtubah has 11 shops, got ${qurtubah.length}`);
assert(
  !getShop("vanilla-coffee-qurtubah"),
  "Vanilla Coffee Qurtubah stays dropped — food truck, not a specialty café",
);
for (const locale of ["", "/en"]) {
  assert(
    LEGACY_SHOP_REDIRECTS.some(
      (row) =>
        row.source === `${locale}/c/vanilla-coffee-qurtubah` &&
        row.destination === `${locale}/coffee-shops/qurtubah` &&
        row.statusCode === 308,
    ),
    `${locale}/c/vanilla-coffee-qurtubah 308s to the Qurtubah district page`,
  );
}
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
assert(hamra.length === 13, `al-hamra has 13 shops, got ${hamra.length}`);
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
  "re-matcha-al-hamra",
  "hokkaido-al-hamra",
  "orkt-al-hamra",
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
  neighborhoodLabel("al-yarmouk", "en") === "Al Yarmuk",
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
  neighborhoodLabel("al-nahdah", "en") === "An Nahdah",
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
assert(manar.length === 3, `al-manar has 3 shops, got ${manar.length}`);
for (const id of ["vase-coffee-al-manar", "recaf-al-manar", "on-off-coffee-al-manar"]) {
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
assert(rayyan.length === 8, `al-rayyan has 8 shops (7 + Sample Roastery, trending add 21 Oct), got ${rayyan.length}`);
for (const id of [
  "sample-roastery-al-rayyan",
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
assert(neighborhoodLabel("al-rayyan", "en") === "Ar Rayyan", "al-rayyan English label");
for (const ask of ["الريان", "ريان", "rayyan", "al rayyan", "ar-rayyan"]) {
  assert(parseIntent(ask).neighborhoods.includes("al-rayyan"), `parseIntent(${ask}) should hit al-rayyan`);
}

const rawabi = filterDirectoryShops(shops, "al-rawabi");
assert(rawabi.length === 4, `al-rawabi has 4 shops, got ${rawabi.length}`);
for (const id of ["the-it-al-rawabi", "essert-al-rawabi", "bala-al-rawabi", "torre-al-rawabi"]) {
  assert(rawabi.some((shop) => shop.id === id), `al-rawabi includes ${id}`);
}
assert(neighborhoodLabel("al-rawabi", "ar") === "الروابي", "al-rawabi Arabic label");
assert(neighborhoodLabel("al-rawabi", "en") === "Ar Rawabi", "al-rawabi English label");
for (const ask of ["الروابي", "روابي", "rawabi", "al rawabi", "ar-rawabi"]) {
  assert(parseIntent(ask).neighborhoods.includes("al-rawabi"), `parseIntent(${ask}) should hit al-rawabi`);
}

const fayha = filterDirectoryShops(shops, "al-fayha");
assert(fayha.length === 3, `al-fayha has 3 shops (+ in row, trending add 18 Oct), got ${fayha.length}`);
for (const id of ["rukyah-al-fayha", "roof-coffee-al-fayha", "in-row-al-fayha"]) {
  assert(fayha.some((shop) => shop.id === id), `al-fayha includes ${id}`);
}
assert(neighborhoodLabel("al-fayha", "ar") === "الفيحاء", "al-fayha Arabic label");
assert(neighborhoodLabel("al-fayha", "en") === "Al Fayha", "al-fayha English label");
for (const ask of ["الفيحاء", "فيحاء", "fayha", "al fayha", "al-fayha"]) {
  assert(parseIntent(ask).neighborhoods.includes("al-fayha"), `parseIntent(${ask}) should hit al-fayha`);
}

// 21 Oct 2026 (Amjad via Ajz): Al Raqban is a street inside As Salam. Its one café lists under As Salam
// (café URL unchanged) and the old district URLs 308 to the As Salam page.
assert(
  filterDirectoryShops(shops, "as-salam").some((shop) => shop.id === "maqha-mahamasa-al-raqban"),
  "as-salam includes maqha-mahamasa-al-raqban",
);
for (const ask of ["الرقبان", "رقبان", "raqban", "al raqban", "al-raqban"]) {
  assert(parseIntent(ask).neighborhoods.includes("as-salam"), `parseIntent(${ask}) should hit as-salam`);
}
{
  const want = new Map([
    ["/coffee-shops/al-raqban", "/coffee-shops/as-salam"],
    ["/en/coffee-shops/al-raqban", "/en/coffee-shops/as-salam"],
    ["/n/al-raqban", "/coffee-shops/as-salam"],
    ["/en/n/al-raqban", "/en/coffee-shops/as-salam"],
    ["/al-raqban", "/coffee-shops/as-salam"],
    ["/en/al-raqban", "/en/coffee-shops/as-salam"],
  ]);
  assert(LEGACY_DISTRICT_REDIRECTS.length === want.size, "6 al-raqban redirects");
  for (const row of LEGACY_DISTRICT_REDIRECTS) {
    assert(want.get(row.source) === row.destination && row.statusCode === 308, `${row.source} 308s to ${want.get(row.source)}`);
  }
}
const haiRawdah = getShop("hai-coffee-roasters-al-rawdah");
const raqbanShop = getShop("maqha-mahamasa-al-raqban");
assert(haiRawdah, "hai-coffee-roasters-al-rawdah stays in the catalog");
assert(raqbanShop, "maqha-mahamasa-al-raqban is a distinct catalog shop");
assert(
  raqbanShop.mapsShareUrl !== haiRawdah.mapsShareUrl,
  "al-raqban cafe uses a distinct official place hex from HAI Rawdah",
);
assert(raqbanShop.neighborhood === "as-salam", "raqban shop lists under as-salam (not folded into al-rawdah)");

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

const naseemSharqi = filterDirectoryShops(shops, "an-nasim-ash-sharqi");
assert(naseemSharqi.length === 7, `an-nasim-ash-sharqi has 7 shops, got ${naseemSharqi.length}`);
assert(
  naseemSharqi.every((shop) => shop.neighborhood === "an-nasim-ash-sharqi"),
  "an-nasim-ash-sharqi filter stays in district",
);
for (const id of [
  "voute-fot-al-naseem-sharqi",
  "jaro-cafe-al-naseem-sharqi",
  "tamper-speciality-al-naseem-sharqi",
  "luxo-coffee-al-naseem-sharqi",
  "ma-specialty-al-naseem-sharqi",
  "get-up-coffee-al-naseem-sharqi",
  "public-al-naseem-sharqi",
]) {
  assert(
    naseemSharqi.some((shop) => shop.id === id),
    `an-nasim-ash-sharqi includes ${id}`,
  );
}
assert(
  neighborhoodLabel("an-nasim-ash-sharqi", "ar") === "النسيم الشرقي",
  "an-nasim-ash-sharqi Arabic label",
);
assert(
  neighborhoodLabel("an-nasim-ash-sharqi", "en") === "An Nasim Ash Sharqi",
  "an-nasim-ash-sharqi English label",
);
assert(
  districtPath("an-nasim-ash-sharqi", "ar") === "/coffee-shops/an-nasim-ash-sharqi",
  "AR an-nasim-ash-sharqi coffee-shops path",
);
assert(
  districtPath("an-nasim-ash-sharqi", "en") === "/en/coffee-shops/an-nasim-ash-sharqi",
  "EN an-nasim-ash-sharqi coffee-shops path",
);
for (const ask of [
  "النسيم الشرقي",
  "East Naseem",
  "al-naseem-sharqi",
  "An Nasim Ash Sharqi",
]) {
  assert(
    parseIntent(ask).neighborhoods.includes("an-nasim-ash-sharqi"),
    `parseIntent(${ask}) should hit an-nasim-ash-sharqi`,
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
assert(rabi.length === 11, `al-rabi has 11 shops, got ${rabi.length}`);
for (const id of [
  "kava-al-rabi",
  "sociable-al-rabi",
  "orne-cafe-al-rabi",
  "atea-al-rabi",
  "arco-al-rabi",
  "diplab-al-rabi",
  "and-coffee-al-rabi",
  "wacafe-al-rabi",
  "3bean-al-rabi",
]) {
  assert(rabi.some((shop) => shop.id === id), `al-rabi includes ${id}`);
}
assert(
  rabi.some((shop) => shop.id === "piccolo-al-rabi"),
  "al-rabi keeps piccolo-al-rabi",
);
assert(
  rabi.some((shop) => shop.id === "ashjar-cafe-ar-rabi"),
  "al-rabi includes ashjar-cafe-ar-rabi",
);

const nada = filterDirectoryShops(shops, "an-nada");
assert(nada.length === 3, `an-nada has 3 shops, got ${nada.length}`);
assert(
  nada.some((shop) => shop.id === "century-cafe-an-nada"),
  "an-nada includes century-cafe-an-nada (Batch D3)",
);
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
assert(dq.length === 10, `diplomatic-quarter has 10 specialty shops (Jazean + 9 Batch M local; the 4 Batch M chains are not in the directory filter), got ${dq.length}`);
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
assert(kingFahd.length === 2, `king-fahd has 2 shops, got ${kingFahd.length}`);
assert(kingFahd.some((shop) => shop.id === "okawa-king-fahd"), "king-fahd includes okawa-king-fahd");
assert(
  kingFahd.some((shop) => shop.id === "markab-king-fahd"),
  "king-fahd includes markab-king-fahd",
);
assert(
  neighborhoodLabel("king-fahd", "ar") === "الملك فهد",
  "king-fahd Arabic label",
);
assert(
  neighborhoodLabel("king-fahd", "en") === "King Fahd District",
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
      "nahl-al-aqiq",
      "kaffo-al-aqiq",
    ],
  },
  {
    id: "al-ghadeer",
    ar: "الغدير",
    en: "Al Ghadir",
    shops: [
      "kultura-al-ghadeer",
      "tad-coffee-al-ghadeer",
      "ulica-al-ghadeer",
      "drip-al-ghadeer",
      "blumen-al-ghadeer",
      "brsk-al-ghadeer",
      "ghandoura-al-ghadeer",
      "iota-al-ghadeer",
      "mid-sajj-al-ghadeer",
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
      "roasting-house-al-arid",
      "coffee-address-al-arid",
      "shiro-al-arid",
      "rex-al-arid",
      "essert-al-arid",
      "hearth-al-arid",
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
      "scout-coffee-al-qirawan",
      "ract-al-qirawan",
      "nap-al-qirawan",
      "ouia-al-qirawan",
      "shml-al-qirawan",
      "for-coffee-roasters-al-qirawan",
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
    "little-henri-al-muruj",
    "otto-al-muruj",
    "behind-al-muruj",
    "cherie-al-muruj",
    "savura-al-muruj",
  ],
};

{
  const rows = filterDirectoryShops(shops, MURUJ_REFILL.id);
  assert(rows.length === 11, `al-muruj has 11 shops (10 + Savura, trending add 21 Oct), got ${rows.length}`);
  assert(rows.some((shop) => shop.id === "savura-al-muruj"), "al-muruj includes savura-al-muruj");
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
  en: "Al Muhammadiyah",
  shops: [
    "unique-drip-al-mohammadiyah",
    "hjeen-roasters-al-mohammadiyah",
    "hekaya-tale-al-mohammadiyah",
    "house-of-matcha-al-mohammadiyah",
    "bab-al-mohammadiyah",
  ],
};

{
  const rows = filterDirectoryShops(shops, MOH_REFILL.id);
  assert(rows.length === 6, `al-mohammadiyah has 6 shops (5 + Shal, trending add 18 Oct), got ${rows.length}`);
  assert(rows.some((shop) => shop.id === "shal-al-mohammadiyah"), "al-mohammadiyah includes shal-al-mohammadiyah");
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
  // Batch J (11 Oct): 4 local adds; Peet's and the 3 Starbucks are chains (listing/directory only, not discovery).
  assert(rows.length === 5, `al-mathar has 5 local shops, got ${rows.length}`);
  assert(
    rows.map((shop) => shop.id).sort().join(",") ===
      "leto-caffe-al-mathar,opinion-al-mathar,richony-cafe-al-mathar,urth-caffe-al-mathar,waynes-coffee-al-mathar",
    "al-mathar local set is Opinion plus Richony, L'ETO, Urth and Wayne's",
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

{
  const rows = filterDirectoryShops(shops, "at-taawun");
  assert(rows.length === 11, `at-taawun has 11 specialty shops (Batch E r2 10 + Hjeen, trending add 21 Oct; Veloce is a chain), got ${rows.length}`);
  const pageRows = listDirectoryShopsForDistrict("at-taawun");
  assert(
    pageRows.length === 12 &&
      pageRows.filter((shop) => shop.isChain).map((shop) => shop.id).join(",") === "veloce-cafe-at-taawun",
    `at-taawun page lists 12 rows: 11 local + Veloce behind Local only, got ${pageRows.map((shop) => shop.id + (shop.isChain ? "{chain}" : "")).join(",")}`,
  );
  assert(
    rows.some((shop) => shop.id === "flow-matcha-at-taawun"),
    "at-taawun includes flow-matcha-at-taawun",
  );
  assert(neighborhoodLabel("at-taawun", "ar") === "التعاون", "at-taawun Arabic label");
  assert(neighborhoodLabel("at-taawun", "en") === "At Taawun", "at-taawun English label");
  assert(
    districtPath("at-taawun", "ar") === "/coffee-shops/at-taawun",
    "AR at-taawun coffee-shops path",
  );
  for (const ask of [
    "التعاون",
    "تعاون",
    "taawun",
    "at taawun",
    "at-taawun",
    "At Taawun",
  ]) {
    assert(
      parseIntent(ask).neighborhoods.includes("at-taawun"),
      `parseIntent(${ask}) should hit at-taawun`,
    );
  }
}

{
  // Batch F (5 Oct 2026): Shubra lists 7 local cafés + Half Million and Tim Hortons; dr.CAFE Shubra stays on the drive-through lane only.
  const rows = listDirectoryShopsForDistrict("shubra");
  assert(
    rows.map((shop) => shop.id).sort().join(",") ===
      "address-mood-shubra,coffee-address-shubra,eco-cup-shubra,half-million-shubra,jadeel-coffee-shubra,mhj-cafe-shubra,nasaq-shubra,samus-shubra,tim-hortons-shubra",
    `shubra lists the 9 Batch F rows, got ${rows.map((shop) => shop.id).join(",")}`,
  );
  assert(!rows.some((shop) => shop.id === "drcafe-shubra"), "drcafe-shubra stays off the Shubra page (drive-through lane)");
  assert(
    listDriveThroughDirectoryShops().some((shop) => shop.id === "drcafe-shubra") &&
      listDriveThroughDirectoryShops().some((shop) => shop.id === "tim-hortons-shubra"),
    "drcafe-shubra and tim-hortons-shubra are on the Drive-through directory",
  );
  assert(neighborhoodLabel("shubra", "ar") === "شبرا", "shubra Arabic label");
  assert(neighborhoodLabel("shubra", "en") === "Shubra", "shubra English label");
  assert(districtPath("shubra", "ar") === "/coffee-shops/shubra", "AR shubra coffee-shops path");
  for (const ask of ["شبرا", "shubra", "shobra", "Shubra"]) {
    assert(parseIntent(ask).neighborhoods.includes("shubra"), `parseIntent(${ask}) should hit shubra`);
  }
}

{
  const rows = listDirectoryShopsForDistrict("al-mursalat");
  // AJ add + trending add (18 Oct 2026): Trace and Espresso Culture are specialty, so the DT-lane fallback (Camel Step) no longer fills the page.
  assert(rows.length === 2, `al-mursalat has 2 specialty shops (Trace, Espresso Culture), got ${rows.length}`);
  assert(
    ["trace-al-mursalat", "espresso-culture-al-mursalat"].every((id) => rows.some((shop) => shop.id === id)),
    "al-mursalat lists Trace and Espresso Culture",
  );
  assert(
    !rows.some((shop) => shop.id === "camel-step-al-mursalat"),
    "camel-step-al-mursalat (DT lane) drops off once al-mursalat has specialty",
  );
  assert(neighborhoodLabel("al-mursalat", "ar") === "المرسلات", "al-mursalat Arabic label");
  assert(neighborhoodLabel("al-mursalat", "en") === "Al Mursalat", "al-mursalat English label");
  for (const ask of ["المرسلات", "مرسلات", "mursalat", "al mursalat", "Al Mursalat"]) {
    assert(
      parseIntent(ask).neighborhoods.includes("al-mursalat"),
      `parseIntent(${ask}) should hit al-mursalat`,
    );
  }
}

{
  const rows = listDirectoryShopsForDistrict("al-murabba");
  assert(rows.length === 1, `al-murabba has 1 DT-lane shop, got ${rows.length}`);
  assert(
    rows.some((shop) => shop.id === "coffee-address-al-murabba"),
    "al-murabba includes coffee-address-al-murabba",
  );
  assert(neighborhoodLabel("al-murabba", "ar") === "المربع", "al-murabba Arabic label");
  assert(neighborhoodLabel("al-murabba", "en") === "Al Murabba", "al-murabba English label");
  for (const ask of ["المربع", "مربع", "murabba", "al murabba", "Al Murabba"]) {
    assert(
      parseIntent(ask).neighborhoods.includes("al-murabba"),
      `parseIntent(${ask}) should hit al-murabba`,
    );
  }
}

{
  // Batch SD1 (21 Oct 2026): Al Shohda becomes a mixed district — Camel Step + 7 local + 7 sit-down chains.
  const rows = listDirectoryShopsForDistrict("al-shohda");
  // 21 Oct 2026: + 6 local rows re-tagged from Ghirnatah (pins inside the Al Shohda polygon).
  assert(rows.length === 21, `al-shohda has 21 shops, got ${rows.length}`);
  assert(rows.filter((row) => !row.isChain).length === 14, "al-shohda keeps 14 local cafés (Camel Step + 7 Batch SD1 + 6 from Ghirnatah)");
  assert(rows.some((row) => row.id === "camel-step-granada-business"), "al-shohda keeps Camel Step Granada Business");
  assert(rows.every((row) => row.neighborhood === "al-shohda"), "al-shohda rows stay in district");
}

{
  const rows = listDirectoryShopsForDistrict("as-salam");
  // Batch J: THE HAT is As Salam's first specialty café, so the page lists it and the A PLUS drive-through fallback steps back
  // (A PLUS stays live on the drive-through directory).
  // Batch S (20 Oct 2026): 6 more As Salam specialty cafés; THE HAT stays first, A PLUS still steps back.
  // 21 Oct 2026: + Cafe & Roastery (Al Raqban street, folded in); Namq As Salam is now a chain row (hidden by Local only).
  assert(rows.length === 8, `as-salam has 8 shops, got ${rows.length}`);
  assert(rows.filter((row) => !row.isChain).length === 7, "as-salam keeps 7 local cafés");
  assert(rows.some((row) => row.id === "the-hat-as-salam") && !rows.some((row) => row.id === "a-plus-as-salam"), "as-salam lists the-hat-as-salam (DT fallback a-plus steps back)");
  assert(neighborhoodLabel("as-salam", "ar") === "السلام", "as-salam Arabic label");
  assert(neighborhoodLabel("as-salam", "en") === "As Salam", "as-salam English label");
  for (const ask of ["السلام", "as salam", "As Salam"]) {
    assert(
      parseIntent(ask).neighborhoods.includes("as-salam"),
      `parseIntent(${ask}) should hit as-salam`,
    );
  }
}

{
  const rows = listDirectoryShopsForDistrict("badr");
  assert(rows.length === 2, `badr has 2 shops, got ${rows.length}`);
  assert(rows.some((shop) => shop.id === "soliz-badr"), "badr specialty page includes soliz-badr");
  assert(
    rows.some((shop) => shop.id === "shubak-al-bun-badr"),
    "badr specialty page includes shubak-al-bun-badr",
  );
  const badrDriveThrough = listDriveThroughDirectoryShops().filter(
    (shop) => shop.neighborhood === "badr",
  );
  for (const id of ["drive-badr", "drive-badr-2", "drcafe-badr"]) {
    assert(
      badrDriveThrough.some((shop) => shop.id === id),
      `badr drive-through directory includes ${id}`,
    );
  }
  assert(neighborhoodLabel("badr", "ar") === "بدر", "badr Arabic label");
  assert(neighborhoodLabel("badr", "en") === "Badr", "badr English label");
}

{
  const rows = listDirectoryShopsForDistrict("al-aziziyah");
  assert(rows.length === 2, `al-aziziyah has 2 specialty shops, got ${rows.length}`);
  assert(rows.some((shop) => shop.id === "sama-cafe-al-aziziyah"), "al-aziziyah specialty page includes sama-cafe-al-aziziyah");
  assert(
    rows.some((shop) => shop.id === "waqar-al-aziziyah"),
    "al-aziziyah specialty page includes waqar-al-aziziyah",
  );
  const aziziyahDriveThrough = listDriveThroughDirectoryShops().filter(
    (shop) => shop.neighborhood === "al-aziziyah",
  );
  for (const id of ["drive-al-aziziyah", "drcafe-al-aziziyah"]) {
    assert(
      aziziyahDriveThrough.some((shop) => shop.id === id),
      `al-aziziyah drive-through directory includes ${id}`,
    );
  }
  assert(neighborhoodLabel("al-aziziyah", "ar") === "العزيزية", "al-aziziyah Arabic label");
  assert(neighborhoodLabel("al-aziziyah", "en") === "Al Aziziyah", "al-aziziyah English label");
}

{
  const dt = listDriveThroughDirectoryShops();
  assert(dt.length === 75, `Drive-through directory (moment tag) is 75 (71 + Coffee Address and dr.CAFE As Suwaidi + Tim Hortons Shubra + Starbucks Tamimi Al Qadisiyah), got ${dt.length}`);
  assert(
    listRealShops().filter(isDriveThroughLane).length === 54,
    `DT lane (catalogLane === "drive-through") is 54, got ${listRealShops().filter(isDriveThroughLane).length}`,
  );
  assert(
    dt.every((shop) => shop.momentTags.includes("drive-through")),
    "Drive-through directory is tagged only",
  );
  assert(
    dt.filter((shop) => shop.id.startsWith("drcafe-")).length === 19,
    "19 hex-verified dr.CAFE rows are on the Drive-through directory (18 + As Suwaidi, Batch D1)",
  );
  // Batch D1 (4 Oct 2026): the earlier drop came from a wrong 19 Sep Places
  // match (dr.CAFE Al Qasr, ChIJC9-F2ogPLz4Rh0O4S3P3PDA, CLOSED_PERMANENTLY).
  // The hex place itself (ChIJ9aMBGQARLz4RopSzjbuxdK8) is OPERATIONAL, so it is back.
  assert(
    getShop("drcafe-as-suwaidi")?.placeId === "ChIJ9aMBGQARLz4RopSzjbuxdK8" &&
      getShop("drcafe-as-suwaidi")?.isChain === true,
    "dr.CAFE As Suwaidi is the operational hex place, tagged as a chain",
  );
  assert(
    listDirectoryShopsForDistrict("as-suwaidi").map((shop) => shop.id).join(",") ===
      "alwaal-albari-as-suwaidi,coffee-address-as-suwaidi,drcafe-as-suwaidi,era-coffee-as-suwaidi,hot-sip-as-suwaidi,naham-specialty-as-suwaidi,plant-cafe-as-suwaidi,seen-cafe-as-suwaidi",
    "as-suwaidi lists Alwaal Albari plus the 7 Batch D1 cafés",
  );
  assert(
    !getShop("voom-al-masif"),
    "CLOSED_PERMANENTLY Voom Al Masif stays dropped",
  );
  // placeId fix 2026-10-02: these 7 were not in Al Rabi (real branches in
  // Al Qadisiyyah, Tuwaiq, Al Falah, Uhud, Utaiqah, Al Mursalat, Al Aqiq).
  // Dropped until Scout re-adds them under real-district slugs.
  for (const id of [
    "n5-caffe-al-rabi",
    "n5-caffe-al-rabi-2",
    "drive-al-rabi",
    "drive-al-rabi-2",
    "drive-al-rabi-3",
    "drive-al-rabi-4",
    "drive-al-rabi-5",
  ]) {
    assert(!getShop(id), `${id} stays dropped (wrong district)`);
    for (const locale of ["", "/en"]) {
      assert(
        LEGACY_SHOP_REDIRECTS.some(
          (row) => row.source === `${locale}/c/${id}` && row.statusCode === 308,
        ),
        `${locale}/c/${id} 308s after the drop`,
      );
    }
  }
  assert(
    listDirectoryShopsForDistrict("al-rabi").length === 11,
    "al-rabi specialty directory stays 11 (the dropped rows were DT lane)",
  );
  assert(
    listDirectoryShopsForDistrict("al-masif").length === 10,
    "al-masif specialty directory is 10 after the closed Voom drop",
  );
  // 16 Sep scope: no Starbucks row carries the drive-through tag or chip.
  // Sit-down Starbucks (Tala Mall, Batch G) stays. Most popular, بيننا, and trending
  // still leave chains out the way those lists already do.
  // Batch R (19 Oct 2026) AJ carve-out: Starbucks Tamimi Al Qadisiyah has indoor seating
  // and a drive-through lane, so it is the one sit-down Starbucks with the moment tag
  // (no catalogLane, not DT-only). Every other Starbucks row keeps the ban.
  const STARBUCKS_DT_CARVE_OUT = "starbucks-tamimi-al-qadisiyah";
  const DRIVE_THROUGH_CHIP = /drive-through|طلبات السيار|درايف ثرو/i;
  const tamimi = getShop(STARBUCKS_DT_CARVE_OUT);
  assert(
    tamimi?.chainBrand === "starbucks" && tamimi.dineIn === true && tamimi.catalogLane !== "drive-through" &&
      tamimi.momentTags.includes("drive-through") && !tamimi.vibeTags.some((tag) => DRIVE_THROUGH_CHIP.test(tag)),
    "Starbucks Tamimi is sit-down with the drive-through moment tag only (no lane, no DT vibe tag)",
  );
  const starbucksRows = listRealShops().filter(
    (shop) =>
      shop.id !== STARBUCKS_DT_CARVE_OUT &&
      (shop.chainBrand === "starbucks" ||
        /starbucks|ستاربكس/i.test(`${shop.id} ${shop.nameEn} ${shop.nameAr}`)),
  );
  assert(starbucksRows.length > 0, "a sit-down Starbucks row is in the catalog");
  assert(
    starbucksRows.every((shop) => {
      const chips = [...listingCardTags(shop, "en"), ...listingCardTags(shop, "ar")];
      return (
        shop.catalogLane !== "drive-through" &&
        !shop.momentTags.includes("drive-through") &&
        !shop.vibeTags.some((tag) => DRIVE_THROUGH_CHIP.test(tag)) &&
        !chips.some((tag) => DRIVE_THROUGH_CHIP.test(tag))
      );
    }),
    "no Starbucks row carries the drive-through tag or chip",
  );
  const namar = listDirectoryShopsForDistrict("namar");
  assert(
    namar.map((shop) => shop.id).sort().join(",") === "coffee-bean-tea-leaf-namar,drcafe-namar,freedom-coffee-namar,java-cafe-namar,on-off-coffee-namar,pandemic-coffee-namar",
    "namar lists the dine-in dr.CAFE and ON OFF Coffee (Batch D3) plus Batch O's Pandemic, Freedom, Java Cafe and The Coffee Bean & Tea Leaf",
  );
  assert(
    listDriveThroughDirectoryShops().some((shop) => shop.id === "drcafe-namar"),
    "drcafe-namar stays on the Drive-through directory",
  );
  const jazirah = listDirectoryShopsForDistrict("al-jazirah");
  assert(jazirah.length === 0, "al-jazirah district page omits drive-through chains");
  assert(
    ["drcafe-al-jazirah", "drcafe-al-jazirah-2"].every((id) =>
      listDriveThroughDirectoryShops().some((shop) => shop.id === id),
    ),
    "both Al Jazirah dr.CAFE rows stay on the Drive-through directory",
  );
  const aziziyah = listDirectoryShopsForDistrict("al-aziziyah");
  assert(
    aziziyah.length === 2 &&
      aziziyah.some((shop) => shop.id === "waqar-al-aziziyah") &&
      aziziyah.some((shop) => shop.id === "sama-cafe-al-aziziyah") &&
      listDriveThroughDirectoryShops().some((shop) => shop.id === "drcafe-al-aziziyah"),
    "al-aziziyah page is specialty Waqar and SAMA; drcafe-al-aziziyah stays on the Drive-through directory",
  );
  const gharbi = listDirectoryShopsForDistrict("an-nasim-al-gharbi");
  assert(
    gharbi.length === 3 &&
      gharbi.every((shop) => shop.neighborhood === "an-nasim-al-gharbi") &&
      [
        "trivali-roaster-al-naseem-gharbi",
        "gusn-coffee-al-naseem-gharbi",
        "be-such-al-naseem-gharbi",
      ].every((id) => gharbi.some((shop) => shop.id === id)) &&
      !gharbi.some((shop) => shop.id === "drcafe-an-nasim-al-gharbi") &&
      listDriveThroughDirectoryShops().some((shop) => shop.id === "drcafe-an-nasim-al-gharbi"),
    "an-nasim-al-gharbi lists the Scout-3; the kiosk dr.CAFE stays on Drive-through",
  );
  assert(
    listDirectoryShopsForDistrict("kkia").length === 0 &&
      listDriveThroughDirectoryShops().some((shop) => shop.id === "drcafe-kkia") &&
      !listRealShops().some((shop) => shop.id === "a-plus-kkia"),
    "kkia page omits the drive-through chain; open dr.CAFE stays on Drive-through",
  );
  const drcafe = listRealShops().filter((shop) => shop.id.startsWith("drcafe-"));
  assert(drcafe.length === 23, `23 dr.CAFE rows (20 + Dhahrat Laban Park, Batch N + Ash Shuhada and Granada Mall, Batch SD1), got ${drcafe.length}`);
  assert(
    drcafe.every((shop) => shop.logoUrl === "/logos/drcafe-mark.png"),
    "all 23 dr.CAFE rows use the official mark",
  );
  assert(
    getShop("threes-al-yasmin")?.logoUrl === "/logos/threes-mark.png",
    "Threes al-yasmin uses threes-mark",
  );
  assert(
    getShop("three-sulimaniyah")?.logoUrl === "/logos/three-mark.png",
    "Three sulimaniyah uses three-mark",
  );
  assert(
    getShop("threes-al-yasmin")?.logoUrl !== getShop("three-sulimaniyah")?.logoUrl,
    "Threes and Three stay distinct marks",
  );
  for (const id of ["24cafe-al-wadi", "24cafe-al-yasmin", "24cafe-al-rabi"]) {
    assert(
      getShop(id)?.logoUrl === "/logos/24cafe-mark.png",
      `${id} uses the official 24Cafe mark`,
    );
  }
  for (const file of [
    "public/logos/drcafe-mark.png",
    "public/logos/threes-mark.png",
    "public/logos/24cafe-mark.png",
    "public/logos/three-mark.png",
  ]) {
    assert(existsSync(join(process.cwd(), file)), `missing ${file}`);
  }
  assert(
    !listDirectoryShops().some((shop) => shop.id === "java-cafe-al-malaz"),
    "listed Java Malaz stays out of the specialty directory",
  );
  assert(
    listDirectoryShops().some((shop) => shop.id === "ulica-al-ghadeer"),
    "TAG ULICA stays on specialty directory",
  );
  const ulica = getShop("ulica-al-ghadeer");
  assert(
    ulica?.momentTags.includes("drive-through"),
    "TAG ULICA is drive-through tagged",
  );
}

{
  assert(chipDirectoryMoment("matcha") === "matcha", "matcha chip filters matcha tags");
  assert(chipDirectoryMoment("popular") === null, "popular chip is not a moment filter");
  assert(chipDirectoryMoment("nearby") === null, "nearby chip is not a moment filter");
  const matchaRows = filterDirectoryShopsByMoment(shops, "matcha");
  assert(matchaRows.length === 29, `Matcha directory is 29 tagged shops, got ${matchaRows.length}`);
  assert(
    matchaRows.every((shop) => shop.momentTags.includes("matcha")),
    "Matcha directory is matcha-tagged only",
  );
  const harvestLogos: Record<string, string> = {
    "house-of-matcha-al-mohammadiyah": "/logos/house-of-matcha-al-mohammadiyah.png",
    "house-of-matcha-sulimaniyah": "/logos/house-of-matcha-sulimaniyah.png",
    "the-matcha-bar-olaya": "/logos/the-matcha-bar-olaya.jpg",
    "with-heart-diriyah": "/logos/with-heart-diriyah.jpg",
    "opinion-al-mathar": "/logos/opinion-al-mathar.png",
    "opinion-hittin": "/logos/opinion-hittin.png",
    "remis-matcha-club-hittin": "/logos/remis-matcha-club-hittin.png",
    // #239 QA: Al Malqa uses the shared Ōkawa logo (its own file was 100px and is gone).
    "okawa-cafe-al-malqa": "/logos/okawa-al-narjis.jpg",
    "re-matcha-al-hamra": "/logos/re-matcha-al-hamra.jpg",
    "flow-matcha-at-taawun": "/logos/flow-matcha-at-taawun.jpg",
    "hokkaido-al-hamra": "/logos/hokkaido-al-hamra.png",
    "happyland-matcha-diriyah": "/logos/happyland-matcha-diriyah.jpg",
    "somatcha-ar-rabwah": "/logos/somatcha-ar-rabwah-ig.jpg",
  };
  for (const [id, logoUrl] of Object.entries(harvestLogos)) {
    const shop = matchaRows.find((row) => row.id === id);
    assert(shop, `${id} is on the Matcha directory`);
    assert(shop.logoUrl === logoUrl, `${id} keeps the harvested mark`);
  }
}

// Drive Coffee is a chain (4 Oct 2026): out of the specialty directory above.
// Ghadeer and Qirawan list it as a {chain} row (dine-in true); Arid's row has
// dine-in unknown, so it stays off the district list like other chains.
for (const id of ["drive-al-ghadeer", "drive-al-arid", "drive-al-qirawan"]) {
  assert(!shops.some((shop) => shop.id === id), `${id} is not in specialty discovery (chain)`);
  assert(getShop(id)?.isChain === true && getShop(id)?.chainBrand === "drive", `${id} is tagged drive`);
}
assert(
  listDirectoryShopsForDistrict("al-ghadeer").some((shop) => shop.id === "drive-al-ghadeer" && shop.isChain) &&
    listDirectoryShopsForDistrict("al-qirawan").some((shop) => shop.id === "drive-al-qirawan" && shop.isChain),
  "Al Ghadeer and Al Qirawan list Drive Coffee as a chain row",
);
assert(
  !listDirectoryShopsForDistrict("al-arid").some((shop) => shop.id === "drive-al-arid"),
  "Al Arid drops Drive Coffee (chain, dine-in unknown)",
);

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
  ["las-cafe-al-malqa", "las-cafe-al-olaya"],
  "LAS CAFE",
);
assert(
  getShop("las-cafe-al-malqa")?.placeId !== getShop("lasani-cafe-al-malaz")?.placeId &&
    getShop("las-cafe-al-malqa")?.logoUrl !== getShop("lasani-cafe-al-malaz")?.logoUrl &&
    getShop("lasani-cafe-al-malaz")?.nameEn === "Lasani Cafe",
  "LAS CAFE stays a different brand from Lasani Cafe",
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
    "coffee-address-al-rabwah",
    "coffee-address-ar-rabwah",
    "coffee-address-ar-rabwah-ihsaa",
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
assert(
  !getShop("get-up-coffee-ar-rabwah"),
  "wrong Get Up Ar Rabwah listing stays dropped — not a café",
);
assert(
  getShop("get-up-coffee-al-naseem-sharqi")?.placeId ===
    "ChIJc_6fwjIHLz4Ra7l6xNArkUM" &&
    getShop("get-up-coffee-al-naseem-sharqi")?.neighborhood ===
      "an-nasim-ash-sharqi",
  "Nasim GET UP COFFEE stays a different shop",
);
assert(
  !listDirectoryShopsForDistrict("al-rabwah").some(
    (shop) => shop.id === "get-up-coffee-ar-rabwah",
  ),
  "al-rabwah directory must not keep the wrong Get Up listing",
);
assertDistinctPlaceHex(
  [
    "hjeen-roaster-factory-al-yasmin",
    "hjeen-roaster-al-narjis",
    "hjeen-roasters-al-mohammadiyah",
    "hjeen-roaster-saudi-90s-ar-rabwah",
  ],
  "Hjeen",
);
assertDistinctPlaceHex(
  ["somatcha-an-nada", "somatcha-ar-rabwah"],
  "SoMatcha",
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
  TRENDING_THIS_WEEK_IDS.join(",") ===
    "kultura-as-suwaidi-al-gharbi,espresso-culture-al-mursalat,veni-al-nakheel" &&
    listTrendingThisWeekShops()
      .map((shop) => shop.id)
      .join(",") === TRENDING_THIS_WEEK_IDS.join(",") &&
    listTrendingThisWeekShops()
      .map((shop) => shop.id)
      .join(",") !== NEW_THIS_WEEK_IDS.join(","),
  "Trending this week is its own allowlist, not New this week",
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
    | "as-suwaidi-al-gharbi"
    | "as-salam"
    | "al-munsiyah"
    | "al-qadisiyah"
    | "al-shohda"
    | "an-nasim-ash-sharqi"
    | "an-nasim-al-gharbi"
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
    | "as-sahafah"
    | "al-falah"
    | "al-mughrizat"
    | "al-izdihar"
    | "al-rahmaniyyah"
    | "ghirnatah"
    | "al-mathar"
    | "at-taawun"
    | "shubra"
    | "al-narjis"
    | "badr"
    | "dhahrat-al-badiah"
    | "al-aziziyah"
    | "al-nakheel"
    | "umm-al-hamam-al-gharbi"
    | "umm-al-hamam-ash-sharqi"
    | "dhahrat-laban"
    | "namar"
    | "tuwaiq"
    | "ash-shifa"
    | "al-mursalat"
    | "an-nafal"
    | "king-salman"
    | "as-suwaidi";
  vibe: string[];
  moments: string[];
  logoUrl?: string;
  pin?: { lat: number; lng: number };
  /** #190 form: `/maps/place/` hex plus `!3d!4d` so officialShopCoords reads the URL. */
  coordsInUrl?: boolean;
  placeId?: string;
  dineIn?: boolean | null;
  outdoorSeating?: boolean | null;
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
    // Logo landed after the Scout pack; placeId + seating are the
    // share-link place (2026-10-02 placeId fix), not the searchText hit.
    logoUrl: "/logos/makhsousa-coffee-ar-rabwah.jpg",
    placeId: "ChIJRzxqH6gHLz4R-mmdmTKMQX8",
    dineIn: null,
    outdoorSeating: null,
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
    // Logo landed after the Scout pack; placeId + seating are the
    // share-link place (2026-10-02 placeId fix), not the searchText hit.
    logoUrl: "/logos/lattio-lounge-qurtubah.jpg",
    placeId: "ChIJKbOmC6P9Lj4Rz4myGJYGvm8",
    dineIn: true,
    outdoorSeating: null,
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
    moments: ["roaster", "qahwa", "pastry", "drive-through"],
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
    logoUrl: "/logos/drip-tuwaiq-v2.jpg",
    pin: { lat: 24.7878805, lng: 46.7593322 },
  },
  {
    id: "coffee-address-al-hamra",
    hex: "0x3e2efffcecbb3509:0x6fc42bb33821c4f2",
    neighborhood: "al-hamra",
    vibe: ["قهوة"],
    moments: ["qahwa", "drive-through"],
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
    moments: ["qahwa", "drive-through"],
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
    moments: ["qahwa", "drive-through"],
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
    // 21 Oct 2026: Al Raqban is a street inside As Salam; the café lists there (id unchanged).
    neighborhood: "as-salam",
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
    moments: ["qahwa", "drive-through"],
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
    id: "voute-fot-al-naseem-sharqi",
    hex: "0x3e2fab027b7f2d21:0xebe230fac7adf242",
    neighborhood: "an-nasim-ash-sharqi",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/voute-fot-al-naseem-sharqi-ig.jpg",
    pin: { lat: 24.7504252, lng: 46.8280744 },
  },
  {
    id: "jaro-cafe-al-naseem-sharqi",
    hex: "0x3e2fabc5365b85c7:0x5e1b00a4a8227b1f",
    neighborhood: "an-nasim-ash-sharqi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/jaro-cafe-al-naseem-sharqi-ig.jpg",
    pin: { lat: 24.7534071, lng: 46.833024 },
  },
  {
    id: "tamper-speciality-al-naseem-sharqi",
    hex: "0x3e2f017d06f827b7:0x6894dda1256b0876",
    neighborhood: "an-nasim-ash-sharqi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/tamper-speciality-al-naseem-sharqi-ig.jpg",
    pin: { lat: 24.7465091, lng: 46.8309965 },
  },
  {
    id: "luxo-coffee-al-naseem-sharqi",
    hex: "0x3e2fab007ce38971:0xbc7a9fc0bc0b7ddc",
    neighborhood: "an-nasim-ash-sharqi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/luxo-coffee-al-naseem-sharqi-ig.jpg",
    pin: { lat: 24.7451103, lng: 46.8385564 },
  },
  {
    id: "ma-specialty-al-naseem-sharqi",
    hex: "0x3e2fabd6cbad150f:0x959fb366858428b",
    neighborhood: "an-nasim-ash-sharqi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/ma-specialty-al-naseem-sharqi.png",
    pin: { lat: 24.7428996, lng: 46.8284522 },
  },
  {
    id: "get-up-coffee-al-naseem-sharqi",
    hex: "0x3e2f0732c29ffe73:0x43912bd0c47ab96b",
    neighborhood: "an-nasim-ash-sharqi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/get-up-coffee-al-naseem-sharqi-ig.jpg",
    pin: { lat: 24.7303565, lng: 46.8430769 },
  },
  {
    id: "trivali-roaster-al-naseem-gharbi",
    hex: "0x3e2f0100018c985b:0x6fb37bfcb0ce73ef",
    neighborhood: "an-nasim-al-gharbi",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/trivali-roaster-al-naseem-gharbi.png",
    pin: { lat: 24.7246557, lng: 46.8146522 },
  },
  {
    id: "gusn-coffee-al-naseem-gharbi",
    hex: "0x3e2fa992ac83304f:0x6da1e81ab1343d22",
    neighborhood: "an-nasim-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/gusn-coffee-al-naseem-gharbi.png",
    pin: { lat: 24.7248469, lng: 46.8149537 },
  },
  {
    id: "public-al-naseem-sharqi",
    hex: "0x3e2f01d21840475d:0x877536968aa3531c",
    neighborhood: "an-nasim-ash-sharqi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/public-al-naseem-sharqi-ig.jpg",
    pin: { lat: 24.7473125, lng: 46.8233125 },
  },
  {
    id: "be-such-al-naseem-gharbi",
    hex: "0x3e2f010039dd5ca3:0x548af37d115477b7",
    neighborhood: "an-nasim-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/be-such-al-naseem-gharbi-ig.jpg",
    pin: { lat: 24.7433878, lng: 46.8141181 },
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
    moments: ["qahwa", "drive-through"],
    logoUrl: "/logos/ulica-al-ghadeer.jpg",
  },
  {
    id: "drip-al-ghadeer",
    hex: "0x3e2ee33c0aa921d7:0x853fb7054e5e0a7b",
    neighborhood: "al-ghadeer",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/drip-tuwaiq-v2.jpg",
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
    moments: ["qahwa", "drive-through"],
    logoUrl: "/logos/drive-coffee-wordmark.png",
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
    moments: ["qahwa", "drive-through"],
    logoUrl: "/logos/drive-coffee-wordmark.png",
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
    moments: ["qahwa", "drive-through"],
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
    logoUrl: "/logos/drip-tuwaiq-v2.jpg",
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
    moments: ["qahwa", "drive-through"],
    logoUrl: "/logos/drive-coffee-wordmark.png",
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
    logoUrl: "/logos/house-of-matcha-al-mohammadiyah.png",
  },
  {
    id: "house-of-matcha-sulimaniyah",
    hex: "0x3e2f03cc8803eac7:0x5b8677386f9a894e",
    neighborhood: "sulimaniyah",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/house-of-matcha-sulimaniyah.png",
  },
  {
    id: "somatcha-an-nada",
    hex: "0x3e2efdbd42c9ba8d:0x384a8731bf901bab",
    neighborhood: "an-nada",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/somatcha-an-nada.png",
  },
  {
    id: "the-matcha-bar-olaya",
    hex: "0x3e2f034e019ea32d:0x8d43d3deac74089d",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/the-matcha-bar-olaya.jpg",
  },
  {
    id: "with-heart-diriyah",
    hex: "0x3e2ee1006cf2209b:0xf3841da23256fe4b",
    neighborhood: "diriyah",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/with-heart-diriyah.jpg",
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
    logoUrl: "/logos/opinion-al-mathar.png",
  },
  {
    id: "opinion-hittin",
    hex: "0x3e2ee30ff9b8dd79:0x94b71f92f5dc9ecb",
    neighborhood: "hittin",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/opinion-hittin.png",
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
  {
    id: "remis-matcha-club-hittin",
    hex: "0x3e2ee300100e2ae9:0xce0fbc0df4ab9e0c",
    neighborhood: "hittin",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/remis-matcha-club-hittin.png",
  },
  {
    id: "okawa-cafe-al-malqa",
    hex: "0x3e2ee30071d04773:0x211dc03644ad451",
    neighborhood: "al-malqa",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/okawa-al-narjis.jpg",
  },
  {
    id: "re-matcha-al-hamra",
    hex: "0x3e2ee3006ddedd6b:0x8443a773ddde2819",
    neighborhood: "al-hamra",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/re-matcha-al-hamra.jpg",
  },
  {
    id: "flow-matcha-at-taawun",
    hex: "0x3e2efd005e670709:0x7a663d77fd1c55",
    neighborhood: "at-taawun",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/flow-matcha-at-taawun.jpg",
  },
  {
    id: "hokkaido-al-hamra",
    hex: "0x3e2eff0009c4195f:0xc18c64fb62ad5fd2",
    neighborhood: "al-hamra",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/hokkaido-al-hamra.png",
  },
  {
    id: "happyland-matcha-diriyah",
    hex: "0x3e2ee166b1d2df13:0xea2fc2bb49df5296",
    neighborhood: "diriyah",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/happyland-matcha-diriyah.jpg",
  },
  {
    id: "hjeen-roaster-saudi-90s-ar-rabwah",
    hex: "0x3e2f01001ab91f75:0x1807bcf6a4b86169",
    neighborhood: "al-rabwah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/hjeen-roaster-saudi-90s-ar-rabwah.png",
    pin: { lat: 24.6975072, lng: 46.7505095 },
    coordsInUrl: true,
    placeId: "ChIJdR-5GgABLz4RaWG4pPa8Bxg",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "on-move-ar-rabwah",
    hex: "0x3e2f07001b96e433:0xe9e5eee3bede2246",
    neighborhood: "al-rabwah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/on-move-ar-rabwah-ig.jpg",
    pin: { lat: 24.68575, lng: 46.7660278 },
    coordsInUrl: true,
    placeId: "ChIJM-SWGwAHLz4RRiLevuPu5ek",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "claz-ar-rabwah",
    hex: "0x3e2f070003557aab:0x7dfd70736f89f06a",
    neighborhood: "al-rabwah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/claz-ar-rabwah-ig.jpg",
    pin: { lat: 24.6954227, lng: 46.7621402 },
    coordsInUrl: true,
    placeId: "ChIJq3pVAwAHLz4RavCJb3Nw_X0",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "coffee-address-ar-rabwah",
    hex: "0x3e2f070cc7daa507:0x22ae2a7d417f74d0",
    neighborhood: "al-rabwah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/coffee-address-ar-rabwah-mqr6.png",
    pin: { lat: 24.6909538, lng: 46.7602769 },
    coordsInUrl: true,
    placeId: "ChIJB6XaxwwHLz4R0HR_QX0qriI",
    dineIn: null,
    outdoorSeating: null,
  },
  {
    id: "coffee-address-ar-rabwah-ihsaa",
    hex: "0x3e2f034daa093fab:0x90fd79449e66ebb5",
    neighborhood: "al-rabwah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/coffee-address-ar-rabwah-ihsaa.png",
    pin: { lat: 24.6941875, lng: 46.7323125 },
    coordsInUrl: true,
    placeId: "ChIJqz8Jqk0DLz4RtetmnkR5_ZA",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "somatcha-ar-rabwah",
    hex: "0x3e2f070028102e93:0x47d73e8d4304a16a",
    neighborhood: "al-rabwah",
    vibe: ["قهوة"],
    moments: ["matcha", "qahwa"],
    logoUrl: "/logos/somatcha-ar-rabwah-ig.jpg",
    pin: { lat: 24.6970662, lng: 46.7716812 },
    coordsInUrl: true,
    placeId: "ChIJky4QKAAHLz4RaqEEQ40-10c",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "jaam-coffee-ar-rabwah",
    hex: "0x3e2f072dc370deab:0x1db2b31c2e1f28f",
    neighborhood: "al-rabwah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/jaam-coffee-ar-rabwah-ig.jpg",
    pin: { lat: 24.692156, lng: 46.764295 },
    coordsInUrl: true,
    placeId: "ChIJq95wwy0HLz4Rj_LhwjEr2wE",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "hello-cafe-olaya",
    hex: "0x3e2f0300276b035f:0xf8b82d07bc76a353",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/hello-cafe-olaya-ig.jpg",
    pin: { lat: 24.695142, lng: 46.6830591 },
    coordsInUrl: true,
    placeId: "ChIJXwNrJwADLz4RU6N2vActuPg",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "bacha-coffee-solitaire",
    hex: "0x3e2ee335437f23a5:0xaf69a1d8ac95ec91",
    neighborhood: "as-sahafah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/bacha-coffee-solitaire.jpg",
    pin: { lat: 24.8010754, lng: 46.6513757 },
    coordsInUrl: true,
    placeId: "ChIJpSN_QzXjLj4RkeyVrNihaa8",
  },
  {
    id: "mood-masters-al-falah",
    hex: "0x3e2efd5f8fb7a897:0x3b0473a4fd421df0",
    neighborhood: "al-falah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/mood-masters-al-falah.jpg",
    pin: { lat: 24.8013342, lng: 46.7071301 },
    coordsInUrl: true,
    placeId: "ChIJl6i3j1_9Lj4R8B1C_aRzBDs",
  },
  {
    id: "las-cafe-al-malqa",
    hex: "0x3e2ee36d1476d3bd:0x50d860d1525fa4d7",
    neighborhood: "al-malqa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/las-cafe-al-malqa.jpg",
    pin: { lat: 24.7816639, lng: 46.6009635 },
    coordsInUrl: true,
    placeId: "ChIJvdN2FG3jLj4R16RfUtFg2FA",
  },
  {
    id: "las-cafe-al-olaya",
    hex: "0x3e2f0330c46bced9:0xde8ee884837786cb",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/las-cafe-al-olaya.jpg",
    pin: { lat: 24.6962467, lng: 46.6842978 },
    coordsInUrl: true,
    placeId: "ChIJ2c5rxDADLz4Ry4Z3g4Tojt4",
  },
  {
    id: "little-henri-al-muruj",
    hex: "0x3e2ee3006fa06689:0xd39d80b2d2e9dfff",
    neighborhood: "al-muruj",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/little-henri-al-muruj.jpg",
    pin: { lat: 24.7612516, lng: 46.6569467 },
    coordsInUrl: true,
    placeId: "ChIJiWagbwDjLj4R_9_p0rKAndM",
  },
  {
    id: "beitkull-al-olaya",
    hex: "0x3e2f031ab1bae0a3:0xaf7455ed04f85e37",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/beitkull-al-olaya.jpg",
    pin: { lat: 24.6875566, lng: 46.6856358 },
    coordsInUrl: true,
    placeId: "ChIJo-C6sRoDLz4RN174BO1VdK8",
  },
  {
    id: "satr-specialty-coffee-al-mughrizat",
    hex: "0x3e2efd0047252cc7:0xdf1b91675d24ccf2",
    neighborhood: "al-mughrizat",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/satr-specialty-coffee-al-mughrizat.jpg",
    pin: { lat: 24.7718156, lng: 46.721079 },
    coordsInUrl: true,
    placeId: "ChIJxywlRwD9Lj4R8swkXWeRG98",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "covo-artisan-coffee-al-mughrizat",
    hex: "0x3e2f033b7b4e1951:0xc301a658c1532f5b",
    neighborhood: "al-mughrizat",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/covo-artisan-coffee-al-mughrizat.jpg",
    pin: { lat: 24.7578045, lng: 46.718826 },
    coordsInUrl: true,
    placeId: "ChIJURlOezsDLz4RWy9TwVimAcM",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "bunatetu-al-mughrizat",
    hex: "0x3e2f031e134f9b71:0xda100ec939a0ca1d",
    neighborhood: "al-mughrizat",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/bunatetu-al-mughrizat.jpg",
    pin: { lat: 24.7587419, lng: 46.7270237 },
    coordsInUrl: true,
    placeId: "ChIJcZtPEx4DLz4RHcqgOckOENo",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "dune-coffee-al-mughrizat",
    hex: "0x3e2efd006d73d9ef:0xd7edbc70bcb8fa1d",
    neighborhood: "al-mughrizat",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/dune-coffee-al-mughrizat.jpg",
    pin: { lat: 24.7718484, lng: 46.7211227 },
    coordsInUrl: true,
    placeId: "ChIJ79lzbQD9Lj4RHfq4vHC87dc",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "tuxedo-coffee-al-mughrizat",
    hex: "0x3e2f03faa5c8558f:0x7b003ca2f858d5af",
    neighborhood: "al-mughrizat",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/tuxedo-coffee-al-mughrizat.jpg",
    pin: { lat: 24.7563118, lng: 46.7298746 },
    coordsInUrl: true,
    placeId: "ChIJj1XIpfoDLz4Rr9VY-KI8AHs",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "bar-coffee-al-mughrizat",
    hex: "0x3e2efd69e3c4383f:0x4a64c096e8cafa0a",
    neighborhood: "al-mughrizat",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/bar-coffee-al-mughrizat.jpg",
    pin: { lat: 24.7713271, lng: 46.7203141 },
    coordsInUrl: true,
    placeId: "ChIJPzjE42n9Lj4RCvrK6JbAZEo",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "adab-cafe-al-mughrizat",
    hex: "0x3e2efd906ae5ab6b:0xdcf33862e333b438",
    neighborhood: "al-mughrizat",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/adab-cafe-al-mughrizat.jpg",
    pin: { lat: 24.7713919, lng: 46.720106 },
    coordsInUrl: true,
    placeId: "ChIJa6vlapD9Lj4ROLQz42I489w",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "booze-specialty-coffee-bar-al-mughrizat",
    hex: "0x3e2efde761dd5555:0x236fead5004bc60c",
    neighborhood: "al-mughrizat",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/booze-specialty-coffee-bar-al-mughrizat.jpg",
    pin: { lat: 24.7662708, lng: 46.7153749 },
    coordsInUrl: true,
    placeId: "ChIJVVXdYef9Lj4RDMZLANXqbyM",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "latch-al-mughrizat",
    hex: "0x3e2efda55294c451:0x29c17c734846e880",
    neighborhood: "al-mughrizat",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/latch-al-mughrizat.jpg",
    pin: { lat: 24.7717194, lng: 46.7208678 },
    coordsInUrl: true,
    placeId: "ChIJUcSUUqX9Lj4RgOhGSHN8wSk",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "slant-specialty-coffee-al-izdihar",
    hex: "0x3e2efdc71466de0b:0x117ba139fe9f43e3",
    neighborhood: "al-izdihar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/slant-specialty-coffee-al-izdihar.jpg",
    pin: { lat: 24.7728521, lng: 46.7217584 },
    coordsInUrl: true,
    placeId: "ChIJC95mFMf9Lj4R40Of_jmhexE",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "gedeb-al-olaya",
    hex: "0x3e2f036a28809b43:0x3df37ac10ce51d48",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/gedeb-al-olaya.jpg",
    pin: { lat: 24.702485, lng: 46.6809347 },
    coordsInUrl: true,
    placeId: "ChIJQ5uAKGoDLz4RSB3lDMF68z0",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "bossco-roastery-al-olaya",
    hex: "0x3e2f03d0a33345ed:0xedb519677804ff02",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/bossco-roastery-al-olaya.jpg",
    pin: { lat: 24.6951492, lng: 46.6846958 },
    coordsInUrl: true,
    placeId: "ChIJ7UUzo9ADLz4RAv8EeGcZte0",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "lluvia-caffe-al-olaya",
    hex: "0x3e49e934e277304b:0x6fc1d3970cd7f113",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/lluvia-caffe-al-olaya.jpg",
    pin: { lat: 24.6956825, lng: 46.6843802 },
    coordsInUrl: true,
    placeId: "ChIJSzB34jTpST4RE_HXDJfTwW8",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "oromiffa-al-olaya",
    hex: "0x3e2f033d6baac479:0x3055158d4554e1db",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/oromiffa-al-olaya.jpg",
    pin: { lat: 24.7018287, lng: 46.6812624 },
    coordsInUrl: true,
    placeId: "ChIJecSqaz0DLz4R2-FURY0VVTA",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "buljah-al-olaya",
    hex: "0x3e2f0312d8534d33:0x662777891909562",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/buljah-al-olaya.jpg",
    pin: { lat: 24.706567099999997, lng: 46.679316199999995 },
    coordsInUrl: true,
    placeId: "ChIJM01T2BIDLz4RYpWQkXh3YgY",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "19-gram-al-olaya",
    hex: "0x3e2f030fa4d69acb:0xa78a5e20fb251c80",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/19-gram-al-olaya.jpg",
    pin: { lat: 24.7064389, lng: 46.6792442 },
    coordsInUrl: true,
    placeId: "ChIJy5rWpA8DLz4RgBwl-yBeiqc",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "kulma-speciality-coffee-al-olaya",
    hex: "0x3e2f038f2502627f:0xae635ea4481422f4",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/kulma-speciality-coffee-al-olaya.jpg",
    pin: { lat: 24.699968700000003, lng: 46.6804388 },
    coordsInUrl: true,
    placeId: "ChIJf2ICJY8DLz4R9CIUSKReY64",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "morfi-al-olaya",
    hex: "0x3e2f03d310cb94b1:0x6e57fa14b6721dcf",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/morfi-al-olaya.jpg",
    pin: { lat: 24.706527899999998, lng: 46.6792618 },
    coordsInUrl: true,
    placeId: "ChIJsZTLENMDLz4Rzx1ythT6V24",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "jolt-al-olaya",
    hex: "0x3e2f03eec5cd079f:0x5acf526f9dbca3d8",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/jolt-al-olaya.jpg",
    pin: { lat: 24.7118894, lng: 46.6745525 },
    coordsInUrl: true,
    placeId: "ChIJnwfNxe4DLz4R2KO8nW9Sz1o",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "key-cafe-al-olaya",
    hex: "0x3e2f03875e70f481:0x80a5344587f8473f",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/key-cafe-al-olaya.jpg",
    pin: { lat: 24.7078427, lng: 46.6746905 },
    coordsInUrl: true,
    placeId: "ChIJgfRwXocDLz4RP0f4h0U0pYA",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "alwaal-albari-al-olaya",
    hex: "0x3e2f03dbc2f3ecc1:0x31f02d596206fece",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/alwaal-albari-al-olaya.png",
    pin: { lat: 24.6932667, lng: 46.6714903 },
    coordsInUrl: true,
    placeId: "ChIJwezzwtsDLz4Rzv4GYlkt8DE",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "crops-al-narjis",
    hex: "0x3e2efd68665bae8b:0x30c0a30ce0c43e96",
    neighborhood: "al-narjis",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/crops-al-narjis.jpg",
    pin: { lat: 24.841562999999997, lng: 46.6659942 },
    coordsInUrl: true,
    placeId: "ChIJi65bZmj9Lj4Rlj7E4AyjwDA",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "bala-al-rawabi",
    hex: "0x3e2f07c9527d9ca1:0x179e11b5785979ab",
    neighborhood: "al-rawabi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/bala-al-rawabi.jpg",
    pin: { lat: 24.7007403, lng: 46.8030872 },
    coordsInUrl: true,
    placeId: "ChIJoZx9UskHLz4Rq3lZeLURnhc",
    dineIn: null,
    outdoorSeating: null,
  },
  {
    id: "ract-al-qirawan",
    hex: "0x3e2ee7c139e06f69:0x85a9fc52d9cabc89",
    neighborhood: "al-qirawan",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/ract-al-qirawan.jpg",
    pin: { lat: 24.8337927, lng: 46.5890864 },
    coordsInUrl: true,
    placeId: "ChIJaW_gOcHnLj4RibzK2VL8qYU",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "orkt-al-hamra",
    hex: "0x3e2eff35ab2b4ba9:0x2cd1dfc44b969cc5",
    neighborhood: "al-hamra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/orkt-al-hamra.jpg",
    pin: { lat: 24.787708199999997, lng: 46.767900999999995 },
    coordsInUrl: true,
    placeId: "ChIJqUsrqzX_Lj4RxZyWS8Tf0Sw",
    dineIn: null,
    outdoorSeating: null,
  },
  {
    id: "rex-al-arid",
    hex: "0x3e2ee5a422c9a519:0x8568cbd5379a407b",
    neighborhood: "al-arid",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/rex-coffee.jpg",
    pin: { lat: 24.875037499999998, lng: 46.6211406 },
    coordsInUrl: true,
    placeId: "ChIJGaXJIqTlLj4Re0CaN9XLaIU",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "veo-hittin",
    hex: "0x3e2ee3544f6bd36b:0x9f35a339409906e0",
    neighborhood: "hittin",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/veo-hittin.jpg",
    pin: { lat: 24.7727506, lng: 46.607662399999995 },
    coordsInUrl: true,
    placeId: "ChIJa9NrT1TjLj4R4AaZQDmjNZ8",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "essert-al-arid",
    hex: "0x3e2ee519b340b15b:0x544e83e2ea999fb7",
    neighborhood: "al-arid",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/essert.png",
    pin: { lat: 24.861214699999998, lng: 46.6284055 },
    coordsInUrl: true,
    placeId: "ChIJW7FAsxnlLj4Rt5-Z6uKDTlQ",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "otto-al-muruj",
    hex: "0x3e2ee35d465958d1:0xb1577230d15e267a",
    neighborhood: "al-muruj",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/otto-al-muruj.jpg",
    pin: { lat: 24.758682399999998, lng: 46.6671364 },
    coordsInUrl: true,
    placeId: "ChIJ0VhZRl3jLj4ReiZe0TByV7E",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "behind-al-muruj",
    hex: "0x3e2ee3006bbd973f:0xadfceaef61610016",
    neighborhood: "al-muruj",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/behind-al-muruj.jpg",
    pin: { lat: 24.7561514, lng: 46.653934199999995 },
    coordsInUrl: true,
    placeId: "ChIJP5e9awDjLj4RFgBhYe_q_K0",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "shubak-al-bun-badr",
    hex: "0x3e2f0fce21e76aeb:0xc04a9af315f5345d",
    neighborhood: "badr",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/shubak-al-bun-badr.jpg",
    pin: { lat: 24.5404852, lng: 46.698298099999995 },
    coordsInUrl: true,
    placeId: "ChIJ62rnIc4PLz4RXTT1FfOaSsA",
    dineIn: null,
    outdoorSeating: null,
  },
  {
    id: "hearth-al-arid",
    hex: "0x3e2eef8e7a83c7cf:0x87d5b0ef9485ed19",
    neighborhood: "al-arid",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/hearth-al-arid.jpg",
    pin: { lat: 24.8863463, lng: 46.6046896 },
    coordsInUrl: true,
    placeId: "ChIJz8eDeo7vLj4RGe2FlO-w1Yc",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "abeille-al-narjis",
    hex: "0x3e2efb81a632f607:0x76dc92940ecf8dbc",
    neighborhood: "al-narjis",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.8298719, lng: 46.670774099999996 },
    coordsInUrl: true,
    placeId: "ChIJB_YypoH7Lj4RvI3PDpSS3HY",
    dineIn: null,
    outdoorSeating: null,
  },
  {
    id: "way-coffee-dhahrat-al-badiah",
    hex: "0x3e2f1b003158bdf5:0x91847fc7e4f6fc27",
    neighborhood: "dhahrat-al-badiah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/way-coffee-dhahrat-al-badiah-v2.png",
    pin: { lat: 24.599526899999997, lng: 46.6425717 },
    coordsInUrl: true,
    placeId: "ChIJ9b1YMQAbLz4RJ_z25Md_hJE",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "kava-al-rabi",
    hex: "0x3e2efdb9b7726783:0x393a5268ea227e10",
    neighborhood: "al-rabi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.8020465, lng: 46.672229099999996 },
    coordsInUrl: true,
    placeId: "ChIJg2dyt7n9Lj4REH4i6mhSOjk",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "sociable-al-rabi",
    hex: "0x3e2ee38daf8a1875:0x2ba8a611b0c0c96f",
    neighborhood: "al-rabi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/sociable-al-rabi.jpg",
    pin: { lat: 24.7966244, lng: 46.6514974 },
    coordsInUrl: true,
    placeId: "ChIJdRiKr43jLj4Rb8nAsBGmqCs",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "orne-cafe-al-rabi",
    hex: "0x3e2ee3a4fc04d53d:0xcacc2debf99c20b5",
    neighborhood: "al-rabi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/orne-cafe-al-rabi.jpg",
    pin: { lat: 24.7882458, lng: 46.6479978 },
    coordsInUrl: true,
    placeId: "ChIJPdUE_KTjLj4RtSCc-estzMo",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "atea-al-rabi",
    hex: "0x3e2ee333ac56baa3:0x632e286d7c2502be",
    neighborhood: "al-rabi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/atea-al-rabi.jpg",
    pin: { lat: 24.7980923, lng: 46.6666336 },
    coordsInUrl: true,
    placeId: "ChIJo7pWrDPjLj4RvgIlfG0oLmM",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "arco-al-rabi",
    hex: "0x3e2efd7ae2ad82bb:0x403e7005cc9304af",
    neighborhood: "al-rabi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/arco-al-rabi.jpg",
    pin: { lat: 24.79198, lng: 46.672729499999996 },
    coordsInUrl: true,
    placeId: "ChIJu4Kt4nr9Lj4RrwSTzAVwPkA",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "diplab-al-rabi",
    hex: "0x3e2ee3b55fa32465:0xa18563e65670394e",
    neighborhood: "al-rabi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/diplab-al-rabi.jpg",
    pin: { lat: 24.788220300000003, lng: 46.6478262 },
    coordsInUrl: true,
    placeId: "ChIJZSSjX7XjLj4RTjlwVuZjhaE",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "and-coffee-al-rabi",
    hex: "0x3e2ee3968aeea065:0xa32780ba32c88f1b",
    neighborhood: "al-rabi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/and-coffee-al-rabi.jpg",
    pin: { lat: 24.793794, lng: 46.6546812 },
    coordsInUrl: true,
    placeId: "ChIJZaDuipbjLj4RG4_IMrqAJ6M",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "wacafe-al-rabi",
    hex: "0x3e2ee39665d2a067:0xd4fcbbe19975f70d",
    neighborhood: "al-rabi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/wacafe-al-rabi.jpg",
    pin: { lat: 24.7941798, lng: 46.6554988 },
    coordsInUrl: true,
    placeId: "ChIJZ6DSZZbjLj4RDfd1meG7_NQ",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "3bean-al-rabi",
    hex: "0x3e2ee3dbef551423:0xc82874176841baa6",
    neighborhood: "al-rabi",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/3bean-al-qirawan.jpg",
    pin: { lat: 24.791734599999998, lng: 46.6722946 },
    coordsInUrl: true,
    placeId: "ChIJIxRV79vjLj4RprpBaBd0KMg",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "waqar-al-aziziyah",
    hex: "0x3e2f0998d1d32f2b:0x7d22a04b551ef13c",
    neighborhood: "al-aziziyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/waqar-al-aziziyah.jpg",
    pin: { lat: 24.5854079, lng: 46.7714042 },
    coordsInUrl: true,
    placeId: "ChIJKy_T0ZgJLz4RPPEeVUugIn0",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "fav-coffee-room-al-malqa",
    hex: "0x3e2ee7004c6e1c13:0x9d68a23fbbb456f3",
    neighborhood: "al-malqa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/fav-coffee-room-al-malqa.png",
    pin: { lat: 24.8135096, lng: 46.5872023 },
    coordsInUrl: true,
    placeId: "ChIJExxuTADnLj4R81a0uz-iaJ0",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "asfoura-al-malqa",
    hex: "0x3e2ee55483715681:0x535c9c8273f81454",
    neighborhood: "al-malqa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/asfoura-al-malqa.jpg",
    pin: { lat: 24.7986493, lng: 46.6114552 },
    coordsInUrl: true,
    placeId: "ChIJgVZxg1TlLj4RVBT4c4KcXFM",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "bab-al-mohammadiyah",
    hex: "0x3e2ee300747e7f87:0x6c346a1fe01e3398",
    neighborhood: "al-mohammadiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/bab-al-mohammadiyah.jpg",
    pin: { lat: 24.7392724, lng: 46.6489027 },
    coordsInUrl: true,
    placeId: "ChIJh39-dADjLj4RmDMe4B9qNGw",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "cherie-al-muruj",
    hex: "0x3e2ee3c1855d7fc3:0x9f9b53c13178e828",
    neighborhood: "al-muruj",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/cherie-al-muruj.png",
    pin: { lat: 24.7622854, lng: 46.6603825 },
    coordsInUrl: true,
    placeId: "ChIJw39dhcHjLj4RKOh4McFTm58",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "da-nonna-al-nakheel",
    hex: "0x3e2ee3a7dd00f84f:0xd64c48b5838c6af3",
    neighborhood: "al-nakheel",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/da-nonna-al-nakheel.jpg",
    pin: { lat: 24.7511551, lng: 46.6387268 },
    coordsInUrl: true,
    placeId: "ChIJT_gA3afjLj4R82qMg7VITNY",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "okawa-al-narjis",
    hex: "0x3e2efb751afe87a1:0x90435bec78a9e241",
    neighborhood: "al-narjis",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/okawa-al-narjis.jpg",
    pin: { lat: 24.8407563, lng: 46.673187 },
    coordsInUrl: true,
    placeId: "ChIJoYf-GnX7Lj4RQeKpeOxbQ5A",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "nap-al-qirawan",
    hex: "0x3e2ee55f2a614199:0xdd5833210545ac9f",
    neighborhood: "al-qirawan",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/nap-al-qirawan.jpg",
    pin: { lat: 24.8235343, lng: 46.5981034 },
    coordsInUrl: true,
    placeId: "ChIJmUFhKl_lLj4Rn6xFBSEzWN0",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "ouia-al-qirawan",
    hex: "0x3e2ee5b88e7d525d:0x3af2bf3f2c58050c",
    neighborhood: "al-qirawan",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/ouia-al-qirawan.jpg",
    pin: { lat: 24.8303379, lng: 46.5965801 },
    coordsInUrl: true,
    placeId: "ChIJXVJ9jrjlLj4RDAVYLD-_8jo",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "shml-al-qirawan",
    hex: "0x3e2ee55365ec1e99:0xa8f233c114e3ea38",
    neighborhood: "al-qirawan",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/shml-al-qirawan.jpg",
    pin: { lat: 24.8284159, lng: 46.5966631 },
    coordsInUrl: true,
    placeId: "ChIJmR7sZVPlLj4ROOrjFMEz8qg",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "for-coffee-roasters-al-qirawan",
    hex: "0x3e2ee531c4915ebb:0x7b97b8c07e18f93d",
    neighborhood: "al-qirawan",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/for-coffee-roasters-al-qirawan.jpg",
    pin: { lat: 24.8431301, lng: 46.5963817 },
    coordsInUrl: true,
    placeId: "ChIJu16RxDHlLj4RPfkYfsC4l3s",
    dineIn: true,
    outdoorSeating: true,
  },
  // Bisat batch (3 Oct 2026): Places pin, placeId and seating.
  {
    id: "bisat-umm-al-hamam-al-gharbi",
    hex: "0x3e2f1d80fb0e1949:0x3b6f512d10c01bd8",
    neighborhood: "umm-al-hamam-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/bisat-wordmark.png",
    pin: { lat: 24.6977213, lng: 46.6389596 },
    coordsInUrl: true,
    placeId: "ChIJSRkO-4AdLz4R2BvAEC1Rbzs",
    dineIn: true,
    outdoorSeating: null,
  },
  // Bisat batch (3 Oct 2026): Places pin, placeId and seating.
  {
    id: "bisat-an-nafal",
    hex: "0x3e2efd00219bfd13:0x1f202c729870410e",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/bisat-wordmark.png",
    pin: { lat: 24.7794093, lng: 46.6808549 },
    coordsInUrl: true,
    placeId: "ChIJE_2bIQD9Lj4RDkFwmHIsIB8",
    dineIn: true,
    outdoorSeating: true,
  },
  // Bisat batch (3 Oct 2026): Places pin, placeId and seating.
  {
    id: "bisat-hittin",
    hex: "0x3e2ee3dfd6caad95:0x299143306b331e83",
    neighborhood: "hittin",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/bisat-wordmark.png",
    pin: { lat: 24.7646531, lng: 46.6092044 },
    coordsInUrl: true,
    placeId: "ChIJla3K1t_jLj4Rgx4zazBDkSk",
    dineIn: true,
    outdoorSeating: null,
  },
  // Bisat batch (3 Oct 2026): Places pin, placeId and seating.
  {
    id: "veo-al-malqa",
    hex: "0x3e2ee7673a008473:0x281d9b74b7a35bd7",
    neighborhood: "al-malqa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/veo-hittin.jpg",
    pin: { lat: 24.7908988, lng: 46.5881155 },
    coordsInUrl: true,
    placeId: "ChIJc4QAOmfnLj4R11ujt3SbHSg",
    dineIn: true,
    outdoorSeating: true,
  },
  // Bisat batch (3 Oct 2026): Places pin, placeId and seating.
  {
    id: "rex-as-sahafah",
    hex: "0x3e2ee5b6f1c036df:0x114d742b4b7b72ac",
    neighborhood: "as-sahafah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/rex-coffee.jpg",
    pin: { lat: 24.8109014, lng: 46.6460923 },
    coordsInUrl: true,
    placeId: "ChIJ3zbA8bblLj4RrHJ7Syt0TRE",
    dineIn: true,
    outdoorSeating: false,
  },
  // Bisat batch (3 Oct 2026): Places pin, placeId and seating.
  {
    id: "rex-hittin",
    hex: "0x3e2ee13506d9b669:0x29be4e4267f345ad",
    neighborhood: "hittin",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/rex-coffee.jpg",
    pin: { lat: 24.7698977, lng: 46.5851666 },
    coordsInUrl: true,
    placeId: "ChIJabbZBjXhLj4RrUXzZ0JOvik",
    dineIn: true,
    outdoorSeating: false,
  },
  // Bisat batch (3 Oct 2026): Places pin, placeId and seating.
  {
    id: "rex-king-salman",
    hex: "0x3e2f036014130825:0xbfcdd0ecff6c8d02",
    neighborhood: "king-salman",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/rex-coffee.jpg",
    pin: { lat: 24.7371909, lng: 46.6944962 },
    coordsInUrl: true,
    placeId: "ChIJJQgTFGADLz4RAo1s_-zQzb8",
    dineIn: null,
    outdoorSeating: true,
  },
  // Bisat batch (3 Oct 2026): Places pin, placeId and seating.
  {
    id: "alwaal-albari-as-suwaidi",
    hex: "0x3e2f051eb95d150d:0x2c88ad258793b679",
    neighborhood: "as-suwaidi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/alwaal-albari-al-olaya.png",
    pin: { lat: 24.5935137, lng: 46.6780331 },
    coordsInUrl: true,
    placeId: "ChIJDRVduR4FLz4RebaThyWtiCw",
    dineIn: true,
    outdoorSeating: null,
  },
  // Batch D2: Al Falah (4 Oct 2026). Scout pass.csv pins, Places ids and seating; LEO and Towlan are letter tiles.
  {
    id: "rawi-cafe-al-falah",
    hex: "0x3e2efcf06c52c5f1:0xf887a41820776f52",
    neighborhood: "al-falah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/rawi-cafe-al-falah.jpg",
    pin: { lat: 24.801932, lng: 46.7007094 },
    coordsInUrl: true,
    placeId: "ChIJ8cVSbPD8Lj4RUm93IBikh_g",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "ostrich-al-falah",
    hex: "0x3e2efd7ca3ef4e67:0xaf7f9e97fd465cd9",
    neighborhood: "al-falah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/ostrich-al-falah.jpg",
    pin: { lat: 24.7970292, lng: 46.7066944 },
    coordsInUrl: true,
    placeId: "ChIJZ07vo3z9Lj4R2VxG_Zeef68",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "bow-al-falah",
    hex: "0x3e2efd8e60acf2a3:0xe848447c6407af9f",
    neighborhood: "al-falah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/bow-al-falah.jpg",
    pin: { lat: 24.7952973, lng: 46.7037307 },
    coordsInUrl: true,
    placeId: "ChIJo_KsYI79Lj4Rn68HZHxESOg",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "distance-away-al-falah",
    hex: "0x3e2efdfaf64aa75f:0x3f821771e6c4fa1f",
    neighborhood: "al-falah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/distance-away-al-falah.jpg",
    pin: { lat: 24.7959137, lng: 46.7039772 },
    coordsInUrl: true,
    placeId: "ChIJX6dK9vr9Lj4RH_rE5nEXgj8",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "double-three-al-falah",
    hex: "0x3e2efd8b9e965fa7:0x5940b27c979e331b",
    neighborhood: "al-falah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/double-three-al-falah.jpg",
    pin: { lat: 24.8027262, lng: 46.7025622 },
    coordsInUrl: true,
    placeId: "ChIJp1-Wnov9Lj4RGzOel3yyQFk",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "leo-al-falah",
    hex: "0x3e2efdfc8d07a6f9:0x6f701919a4503870",
    neighborhood: "al-falah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.796443, lng: 46.6991377 },
    coordsInUrl: true,
    placeId: "ChIJ-aYHjfz9Lj4RcDhQpBkZcG8",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "filter-roastery-al-falah",
    hex: "0x3e2efd128532da91:0xbfd8fcc8e9deb781",
    neighborhood: "al-falah",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/filter-roastery-al-falah.png",
    pin: { lat: 24.8008975, lng: 46.6981675 },
    coordsInUrl: true,
    placeId: "ChIJkdoyhRL9Lj4Rgbfe6cj82L8",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "tropika-al-falah",
    hex: "0x3e2efd00087aa49f:0xf210d6dceea53c6c",
    neighborhood: "al-falah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/tropika-al-falah.jpg",
    pin: { lat: 24.7955238, lng: 46.7043498 },
    coordsInUrl: true,
    placeId: "ChIJn6R6CAD9Lj4RbDyl7tzWEPI",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "towlan-al-falah",
    hex: "0x3e2efdfca2302e1f:0xb2c4b6fba637aa52",
    neighborhood: "al-falah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.8033144, lng: 46.7039992 },
    coordsInUrl: true,
    placeId: "ChIJHy4wovz9Lj4RUqo3pvu2xLI",
    dineIn: true,
    outdoorSeating: null,
  },
  // Batch E: At Taawun (5 Oct 2026). Scout CLEAN.csv pins, Places ids and seating; Peaks and CAF LAB reuse their brand marks; Glare is a letter tile. r2 (8 Oct): Stranger's cup mark (X @strangerCo_SA), Wooden W mark (wooden.sa), Veloce wordmark (TikTok @veloce_cafe_sa; isChain veloce).
  {
    id: "odd-at-taawun",
    hex: "0x3e2efd68254b6397:0x9f80cb48c8b93789",
    neighborhood: "at-taawun",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/odd-at-taawun.png",
    pin: { lat: 24.7731039, lng: 46.6890095 },
    coordsInUrl: true,
    placeId: "ChIJl2NLJWj9Lj4RiTe5yEjLgJ8",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "jadeel-coffee-at-taawun",
    hex: "0x3e2efdf2c06c3bd7:0x7d19a75dc4c796b",
    neighborhood: "at-taawun",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/jadeel-coffee-at-taawun.png",
    pin: { lat: 24.7693226, lng: 46.691057 },
    coordsInUrl: true,
    placeId: "ChIJ1ztswPL9Lj4Ra3lM3HWa0Qc",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "strangers-coffee-at-taawun",
    hex: "0x3e2efdde124181b5:0xb957e68b5d8848a",
    neighborhood: "at-taawun",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/strangers-coffee-at-taawun.png",
    pin: { lat: 24.7823127, lng: 46.704997600000006 },
    coordsInUrl: true,
    placeId: "ChIJtYFBEt79Lj4RioTYtWh-lQs",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "glare-cafe-at-taawun",
    hex: "0x3e2efd156e3527bb:0x18193deefcdd860b",
    neighborhood: "at-taawun",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.7743684, lng: 46.7032252 },
    coordsInUrl: true,
    placeId: "ChIJuyc1bhX9Lj4RC4bd_O49GRg",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "isla-at-taawun",
    hex: "0x3e2efd4581d3c335:0xb3c73a280734df87",
    neighborhood: "at-taawun",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/isla-at-taawun.png",
    pin: { lat: 24.772243, lng: 46.6976264 },
    coordsInUrl: true,
    placeId: "ChIJNcPTgUX9Lj4Rh980Byg6x7M",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "veloce-cafe-at-taawun",
    hex: "0x3e2efddffe0490bf:0xfee46a40df4179d4",
    neighborhood: "at-taawun",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/veloce-cafe-at-taawun.png",
    pin: { lat: 24.7724127, lng: 46.6976123 },
    coordsInUrl: true,
    placeId: "ChIJv5AE_t_9Lj4R1HlB30Bq5P4",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "wooden-coffee-at-taawun",
    hex: "0x3e2efd00671379bf:0x4e8567b2f923d7ba",
    neighborhood: "at-taawun",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/wooden-coffee-at-taawun.png",
    pin: { lat: 24.772337, lng: 46.6982198 },
    coordsInUrl: true,
    placeId: "ChIJv3kTZwD9Lj4Rutcj-bJnhU4",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "soul-cafe-at-taawun",
    hex: "0x3e2efd56d99dcb53:0xabb86679d03a4e37",
    neighborhood: "at-taawun",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/soul-cafe-at-taawun.png",
    pin: { lat: 24.772149499999998, lng: 46.6975932 },
    coordsInUrl: true,
    placeId: "ChIJU8ud2Vb9Lj4RN0460HlmuKs",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "peaks-at-taawun",
    hex: "0x3e2efda2747d2f57:0x1da305e625f8826d",
    neighborhood: "at-taawun",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/peaks-digital-city-al-nakheel.jpg",
    pin: { lat: 24.7640128, lng: 46.7009587 },
    coordsInUrl: true,
    placeId: "ChIJVy99dKL9Lj4RbYL4JeYFox0",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "caf-lab-at-taawun",
    hex: "0x3e2efd5c13f66ae5:0xaf2c28d83a24db41",
    neighborhood: "at-taawun",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/caf-lab-al-qirawan.jpg",
    pin: { lat: 24.772544099999998, lng: 46.697775 },
    coordsInUrl: true,
    placeId: "ChIJ5Wr2E1z9Lj4RQdskOtgoLK8",
    dineIn: true,
    outdoorSeating: true,
  },  // Batch F: Shubra (5 Oct 2026). Batch F Place Details pins, ids and seating; Coffee Address and Jadeel reuse their brand marks; Half Million and Tim Hortons are chains with registered marks; Eco Cup is a letter tile.
  {
    id: "mhj-cafe-shubra",
    hex: "0x3e2f11f677b002d7:0x43d2c939cffbfd70",
    neighborhood: "shubra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/mhj-cafe-shubra.png",
    pin: { lat: 24.5738582, lng: 46.6699745 },
    coordsInUrl: true,
    placeId: "ChIJ1wKwd_YRLz4RcP37zznJ0kM",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "nasaq-shubra",
    hex: "0x3e2f11002382beb1:0x9a755aec88883678",
    neighborhood: "shubra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/nasaq-shubra.png",
    pin: { lat: 24.5793715, lng: 46.6665406 },
    coordsInUrl: true,
    placeId: "ChIJsb6CIwARLz4ReDaIiOxadZo",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "coffee-address-shubra",
    hex: "0x3e2f1193ec53416b:0xd38fba46711cec23",
    neighborhood: "shubra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/coffee-address-mark.png",
    pin: { lat: 24.57412, lng: 46.662997999999995 },
    coordsInUrl: true,
    placeId: "ChIJa0FT7JMRLz4RI-wccUa6j9M",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "eco-cup-shubra",
    hex: "0x3e2f0fdfa29c15d9:0x123632a425233bf5",
    neighborhood: "shubra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.583849999999998, lng: 46.6765173 },
    coordsInUrl: true,
    placeId: "ChIJ2RWcot8PLz4R9TsjJaQyNhI",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "jadeel-coffee-shubra",
    hex: "0x3e2f11000ebf86ad:0x6942d1f94823a1b8",
    neighborhood: "shubra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/jadeel-coffee-at-taawun.png",
    pin: { lat: 24.5634221, lng: 46.6476548 },
    coordsInUrl: true,
    placeId: "ChIJrYa_DgARLz4RuKEjSPnRQmk",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "samus-shubra",
    hex: "0x3e2f11f6acdeddcf:0x938ccb9c9b7cc081",
    neighborhood: "shubra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/samus-shubra.png",
    pin: { lat: 24.5743692, lng: 46.6634264 },
    coordsInUrl: true,
    placeId: "ChIJz93erPYRLz4RgcB8m5zLjJM",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "address-mood-shubra",
    hex: "0x3e2f11ae4d5760ab:0x4aa5f0787933f421",
    neighborhood: "shubra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/address-mood-shubra.png",
    pin: { lat: 24.573679199999997, lng: 46.663271099999996 },
    coordsInUrl: true,
    placeId: "ChIJq2BXTa4RLz4RIfQzeXjwpUo",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "half-million-shubra",
    hex: "0x3e2f116f99a91f0f:0xd5f9ea42bb1ad314",
    neighborhood: "shubra",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/half-million-mark.png",
    pin: { lat: 24.5689684, lng: 46.6603785 },
    coordsInUrl: true,
    placeId: "ChIJDx-pmW8RLz4RFNMau0Lq-dU",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "tim-hortons-shubra",
    hex: "0x3e2f0f186f8abb07:0x85ae99f1fb9f1a54",
    neighborhood: "shubra",
    vibe: ["طلبات السيارة"],
    moments: ["drive-through"],
    logoUrl: "/logos/tim-hortons-wordmark.png",
    pin: { lat: 24.576440299999998, lng: 46.678114199999996 },
    coordsInUrl: true,
    placeId: "ChIJB7uKbxgPLz4RVBqf-_GZroU",
    dineIn: true,
    outdoorSeating: null,
  },
  // Batch G: An Nafal (8 Oct 2026). Scout CLEAN.csv pins, Places ids and seating (Places only); 7 letter tiles (Nafel, Pivot, Cave, Kaseb, Hatheeth, Percol, Grotta — the G mark stays illegible at 44px); chains Costa, Starbucks and dr.CAFE are sit-down (no drive-through).
  {
    id: "air-speciality-an-nafal",
    hex: "0x3e2efdd141871e29:0xfd9157a95d2f6b0a",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/air-speciality-an-nafal.png",
    pin: { lat: 24.786226199999998, lng: 46.681539199999996 },
    coordsInUrl: true,
    placeId: "ChIJKR6HQdH9Lj4RCmsvXalXkf0",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "black-stamp-an-nafal",
    hex: "0x3e2efd501b71bb19:0x697aff7d69303774",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/black-stamp-an-nafal.png",
    pin: { lat: 24.781727999999998, lng: 46.683722499999995 },
    coordsInUrl: true,
    placeId: "ChIJGbtxG1D9Lj4RdDcwaX3_emk",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "nafel-coffee-an-nafal",
    hex: "0x3e2efd8bcefe2e7f:0x5dd26dd85397e8fa",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.7802603, lng: 46.684233 },
    coordsInUrl: true,
    placeId: "ChIJfy7-zov9Lj4R-uiXU9ht0l0",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "pivot-espresso-an-nafal",
    hex: "0x3e2efd005e56c5d7:0x25d526ba03683437",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.780051, lng: 46.6838127 },
    coordsInUrl: true,
    placeId: "ChIJ18VWXgD9Lj4RNzRoA7om1SU",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "roastree-an-nafal",
    hex: "0x3e2efd19d74abc47:0x598668daefcc7c54",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/roastree-an-nafal.png",
    pin: { lat: 24.789391000000002, lng: 46.671059299999996 },
    coordsInUrl: true,
    placeId: "ChIJR7xK1xn9Lj4RVHzM79pohlk",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "cave-cafe-an-nafal",
    hex: "0x3e2efdc173725853:0x16b146d82ec4f0ea",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.7798335, lng: 46.683313 },
    coordsInUrl: true,
    placeId: "ChIJU1hyc8H9Lj4R6vDELthGsRY",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "kaseb-concept-an-nafal",
    hex: "0x3e2efd386fe66f57:0xb2c13ebb571ef88c",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.7752865, lng: 46.6755259 },
    coordsInUrl: true,
    placeId: "ChIJV2_mbzj9Lj4RjPgeV7s-wbI",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "hatheeth-an-nafal",
    hex: "0x3e2efd006dc3413b:0x9f1a139542c832c",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.779541, lng: 46.6824947 },
    coordsInUrl: true,
    placeId: "ChIJO0HDbQD9Lj4RLIMsVDmh8Qk",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "percol-an-nafal",
    hex: "0x3e2efd61ae7c2aa5:0x565f7818114fff5",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/percol-an-nafal.png",
    pin: { lat: 24.7795223, lng: 46.6824388 },
    coordsInUrl: true,
    placeId: "ChIJpSp8rmH9Lj4R9f8UgYH3ZQU",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "peacock-an-nafal",
    hex: "0x3e2efd00244af7cd:0xfba0b3aa8afb64c6",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/peacock-an-nafal.png",
    pin: { lat: 24.7762891, lng: 46.6751423 },
    coordsInUrl: true,
    placeId: "ChIJzfdKJAD9Lj4RxmT7iqqzoPs",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "grotta-an-nafal",
    hex: "0x3e2ee50485d0d00b:0x37c1166730f59be7",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.7830074, lng: 46.6788141 },
    coordsInUrl: true,
    placeId: "ChIJC9DQhQTlLj4R55v1MGcWwTc",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "btw-an-nafal",
    hex: "0x3e2efd0c7afdb917:0xd5d229ef5423373c",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/btw-an-nafal.png",
    pin: { lat: 24.7772962, lng: 46.68428720000001 },
    coordsInUrl: true,
    placeId: "ChIJF7n9egz9Lj4RPDcjVO8p0tU",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "costa-tala-mall-an-nafal",
    hex: "0x3e2ee3000d5b7105:0xf50d24766cdb30e6",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/costa-mark.png",
    pin: { lat: 24.7711568, lng: 46.669407899999996 },
    coordsInUrl: true,
    placeId: "ChIJBXFbDQDjLj4R5jDbbHYkDfU",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "starbucks-tala-mall-an-nafal",
    hex: "0x3e2ee3ac0af9cdd3:0x8e5a9b39f34563e0",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/starbucks-mark.png",
    pin: { lat: 24.7711814, lng: 46.669083699999995 },
    coordsInUrl: true,
    placeId: "ChIJ0835CqzjLj4R4GNF8zmbWo4",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "drcafe-an-nafal",
    hex: "0x3e2efda72f993adb:0xc0e9f501dc660d54",
    neighborhood: "an-nafal",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/drcafe-mark.png",
    pin: { lat: 24.779096, lng: 46.6797974 },
    coordsInUrl: true,
    placeId: "ChIJ2zqZL6f9Lj4RVA1m3AH16cA",
    dineIn: true,
    outdoorSeating: null,
  },
  // Batch H: Al Izdihar (9 Oct 2026). Scout CLEAN.csv pins, Places ids and seating (Places only); 3 letter tiles (Knoll: Scout's mark is white-on-white line art; KATF; Rakiza); McCafe dropped per Amjad (r3), so Al Izdihar is local-only. Dunkin' x2 and Turkish Wabel are held for Amjad.
  {
    id: "convoy-coffee-al-izdihar",
    hex: "0x3e2efd33713dbfbb:0x857822515b5d85a2",
    neighborhood: "al-izdihar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/convoy-coffee-al-izdihar.png",
    pin: { lat: 24.781153999999997, lng: 46.7068215 },
    coordsInUrl: true,
    placeId: "ChIJu789cTP9Lj4RooVdW1EieIU",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "knoll-al-izdihar",
    hex: "0x3e2efd937fb36ea3:0x1ec2985b7c659803",
    neighborhood: "al-izdihar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/knoll-al-izdihar.png",
    pin: { lat: 24.7768862, lng: 46.72633630000001 },
    coordsInUrl: true,
    placeId: "ChIJo26zf5P9Lj4RA5hlfFuYwh4",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "steam-roastery-al-izdihar",
    hex: "0x3e2efd7884801cdd:0x2eabff39321c57a5",
    neighborhood: "al-izdihar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/steam-roastery-al-izdihar.png",
    pin: { lat: 24.777336899999998, lng: 46.720644899999996 },
    coordsInUrl: true,
    placeId: "ChIJ3RyAhHj9Lj4RpVccMjn_qy4",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "temper-al-izdihar",
    hex: "0x3e2efd002b9b1aa5:0xa8345908cd7b584e",
    neighborhood: "al-izdihar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/temper-al-izdihar.png",
    pin: { lat: 24.7783953, lng: 46.725466499999996 },
    coordsInUrl: true,
    placeId: "ChIJpRqbKwD9Lj4RTlh7zQhZNKg",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "katf-al-izdihar",
    hex: "0x3e2ee1e67cf8ce0d:0x417a3170516277ae",
    neighborhood: "al-izdihar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.7744543, lng: 46.725586299999996 },
    coordsInUrl: true,
    placeId: "ChIJDc74fObhLj4RrndiUXAxekE",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "rakiza-al-izdihar",
    hex: "0x3e2efd325f52c7c7:0x8ad7d8ae47b68ab6",
    neighborhood: "al-izdihar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.782760399999997, lng: 46.7197721 },
    coordsInUrl: true,
    placeId: "ChIJx8dSXzL9Lj4Rtoq2R67Y14o",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "hijana-al-izdihar",
    hex: "0x3e2efd1990a2fe31:0xe603a076ae590a50",
    neighborhood: "al-izdihar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/hijana-al-izdihar.png",
    pin: { lat: 24.782878399999998, lng: 46.720140099999995 },
    coordsInUrl: true,
    placeId: "ChIJMf6ikBn9Lj4RUApZrnagA-Y",
    dineIn: true,
    outdoorSeating: true,
  },
  // Batch I: Ar Rahmaniyyah (10 Oct 2026). Scout CLEAN.csv pins, Places ids and seating (Places only); 1 letter tile (Java Time; Grind Coffee dropped in r2, rule 5); Peaks and November reuse their sibling marks; Starbucks and Java Time are sit-down chains (no drive-through).
  {
    id: "peaks-the-tent-al-rahmaniyyah",
    hex: "0x3e2f1d5c471c936f:0x4e108e85b733eb6f",
    neighborhood: "al-rahmaniyyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/peaks-digital-city-al-nakheel.jpg",
    pin: { lat: 24.7190411, lng: 46.664949799999995 },
    coordsInUrl: true,
    placeId: "ChIJb5McR1wdLz4Rb-szt4WOEE4",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "november-coffee-al-rahmaniyyah",
    hex: "0x3e2f1dbf7ade43cd:0x56ab04a5ea7f8d7f",
    neighborhood: "al-rahmaniyyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/november-coffee-an-nazhah.png",
    pin: { lat: 24.720318499999998, lng: 46.656823 },
    coordsInUrl: true,
    placeId: "ChIJzUPeer8dLz4Rf41_6qUEq1Y",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "sipology-al-rahmaniyyah",
    hex: "0x3e2f1d004b852631:0xe23fc47b6b452658",
    neighborhood: "al-rahmaniyyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/sipology-al-rahmaniyyah.png",
    pin: { lat: 24.716845799999998, lng: 46.659756599999994 },
    coordsInUrl: true,
    placeId: "ChIJMSaFSwAdLz4RWCZFa3vEP-I",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "ramli-cafe-al-rahmaniyyah",
    hex: "0x3e2f1d461858f021:0x2de8495d9ca26331",
    neighborhood: "al-rahmaniyyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/ramli-cafe-al-rahmaniyyah.png",
    pin: { lat: 24.7267157, lng: 46.6628918 },
    coordsInUrl: true,
    placeId: "ChIJIfBYGEYdLz4RMWOinF1J6C0",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "starbucks-the-plaza-al-rahmaniyyah",
    hex: "0x3e2f1d05d2dca9d5:0xe1cb2bdf996f86d3",
    neighborhood: "al-rahmaniyyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/starbucks-mark.png",
    pin: { lat: 24.7207164, lng: 46.6487641 },
    coordsInUrl: true,
    placeId: "ChIJ1anc0gUdLz4R04Zvmd8ry-E",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "java-time-al-rahmaniyyah",
    hex: "0x3e2f1d002582a01d:0x5219686f9b41bd5f",
    neighborhood: "al-rahmaniyyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.7150727, lng: 46.6598696 },
    coordsInUrl: true,
    placeId: "ChIJHaCCJQAdLz4RX71Bm29oGVI",
    dineIn: true,
    outdoorSeating: null,
  },
  // Batch J: Al Mathar (11 Oct 2026). Scout CLEAN.csv pins and Places ids; seating from Places except Starbucks Panorama (Places dineIn false, photo/review-verified sit-down -> seatingVerdict scout). Urth reuses its Tahlia sibling mark; Peet's ships the new peets-mark; Peet's and the 3 Starbucks are sit-down chains (no drive-through).
  {
    id: "richony-cafe-al-mathar",
    hex: "0x3e2f0352b93a8aa7:0x1eb06862335651f9",
    neighborhood: "al-mathar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/richony-cafe-al-mathar.png",
    pin: { lat: 24.6753917, lng: 46.6714109 },
    coordsInUrl: true,
    placeId: "ChIJp4o6uVIDLz4R-VFWM2JosB4",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "leto-caffe-al-mathar",
    hex: "0x3e2f1d4e182d98fb:0x15f76b21ff79cd7b",
    neighborhood: "al-mathar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/leto-caffe-al-mathar.png",
    pin: { lat: 24.6930923, lng: 46.669443199999996 },
    coordsInUrl: true,
    placeId: "ChIJ-5gtGE4dLz4Re815_yFr9xU",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "urth-caffe-al-mathar",
    hex: "0x3e2f1dccc5bdf00f:0xa2854508998ae640",
    neighborhood: "al-mathar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/urth-caffe-tahlia-sulimaniyah.jpg",
    pin: { lat: 24.6927256, lng: 46.6699834 },
    coordsInUrl: true,
    placeId: "ChIJD_C9xcwdLz4RQOaKmQhFhaI",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "waynes-coffee-al-mathar",
    hex: "0x3e2f035191887a33:0xd1ee24b466f2156a",
    neighborhood: "al-mathar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/waynes-coffee-al-mathar.png",
    pin: { lat: 24.6755522, lng: 46.675840799999996 },
    coordsInUrl: true,
    placeId: "ChIJM3qIkVEDLz4RahXyZrQk7tE",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "peets-euromarche-al-mathar",
    hex: "0x3e2f1d006675d1eb:0x6483b162c804ce77",
    neighborhood: "al-mathar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/peets-mark.png",
    pin: { lat: 24.704682599999998, lng: 46.665055699999996 },
    coordsInUrl: true,
    placeId: "ChIJ69F1ZgAdLz4Rd84EyGKxg2Q",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "starbucks-panorama-al-mathar",
    hex: "0x3e2f1dd625b2dddf:0x20e2ea7a255101b4",
    neighborhood: "al-mathar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/starbucks-mark.png",
    pin: { lat: 24.692595999999998, lng: 46.669427 },
    coordsInUrl: true,
    placeId: "ChIJ392yJdYdLz4RtAFRJXrq4iA",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "starbucks-tafaseel-al-mathar",
    hex: "0x3e2f1d41578717a7:0x87b1ca47c75a2b0b",
    neighborhood: "al-mathar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/starbucks-mark.png",
    pin: { lat: 24.6949124, lng: 46.6698309 },
    coordsInUrl: true,
    placeId: "ChIJpxeHV0EdLz4RCytax0fKsYc",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "starbucks-takhassusi-al-mathar",
    hex: "0x3e2f0351a6003689:0x59052d3e776ef19a",
    neighborhood: "al-mathar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/starbucks-mark.png",
    pin: { lat: 24.6763674, lng: 46.676508999999996 },
    coordsInUrl: true,
    placeId: "ChIJiTYAplEDLz4RmvFudz4tBVk",
    dineIn: true,
    outdoorSeating: false,
  },
  // Batch J other adds (11 Oct 2026, Scout verify packs): independent sit-down cafés; seating from photos + reviews (Places dineIn agrees). THE HAT is a letter tile; its Google hours are soft-open (QA-NOTE).
  {
    id: "nafees-as-suwaidi-al-gharbi",
    hex: "0x3e2f11dc8cad355d:0xac81e41e4bb18926",
    neighborhood: "as-suwaidi-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/nafees-as-suwaidi-al-gharbi.png",
    pin: { lat: 24.5661742, lng: 46.6312943 },
    coordsInUrl: true,
    placeId: "ChIJXTWtjNwRLz4RJomxSx7kgaw",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "the-hat-as-salam",
    hex: "0x3e2f079cfed38697:0xe7a0c4a289dea9bc",
    neighborhood: "as-salam",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.703391699999997, lng: 46.8251047 },
    coordsInUrl: true,
    placeId: "ChIJl4bT_pwHLz4RvKneiaLEoOc",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "disam-al-narjis",
    hex: "0x3e2ee3644fcee6e7:0x2870197edc094af1",
    neighborhood: "al-narjis",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/disam-al-narjis.png",
    pin: { lat: 24.811174899999997, lng: 46.6698777 },
    coordsInUrl: true,
    placeId: "ChIJ5-bOT2TjLj4R8UoJ3H4ZcCg",
    dineIn: true,
    outdoorSeating: null,
  },
  // Batch J r2: Robusta Bake (Ar Rawdah), Scout robusta recheck 11 Oct (4 Oct pack Details + photos). Places gives no dineIn/outdoor; indoor seating verified from Places frame idx 0 (tables + chairs), Scout seating notes and reviews -> seatingVerdict {dineIn: true, scout} (torre-al-rawabi precedent); outdoor stays null. Letter tile.
  {
    id: "robusta-bake-al-rawdah",
    hex: "0x3e2f01ac532a591f:0x6c7e715e70eda9a8",
    neighborhood: "al-rawdah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/robusta-bake-al-rawdah.png",
    pin: { lat: 24.740722299999998, lng: 46.757886199999994 },
    coordsInUrl: true,
    placeId: "ChIJH1kqU6wBLz4RqKntcF5xfmw",
    dineIn: true,
    outdoorSeating: null,
  },
  // Batch K (12 Oct 2026, Scout Umm Al Hamam Al Gharbi pack): 11 local sit-down cafés + Starbucks Oruba Square (sit-down chain with a drive-through lane). Seating and dineIn/outdoor are Places values; Java Time dropped (rule 5).
  {
    id: "archi-umm-al-hamam-al-gharbi",
    hex: "0x3e2f1d00644bd23d:0x72398af3ee9be43a",
    neighborhood: "umm-al-hamam-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/archi-diriyah.jpg",
    pin: { lat: 24.6795002, lng: 46.654440699999995 },
    coordsInUrl: true,
    placeId: "ChIJPdJLZAAdLz4ROuSb7vOKOXI",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "book-of-beans-umm-al-hamam-al-gharbi",
    hex: "0x3e2f1d00097c8c2d:0x462733a1c9d8bdea",
    neighborhood: "umm-al-hamam-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.6795722, lng: 46.6532564 },
    coordsInUrl: true,
    placeId: "ChIJLYx8CQAdLz4R6r3YyaEzJ0Y",
    dineIn: true,
  },
  {
    id: "caffeination-umm-al-hamam-al-gharbi",
    hex: "0x3e2f1ddc4fecc7d3:0x843be1ea705d6b31",
    neighborhood: "umm-al-hamam-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/caffeination-umm-al-hamam-al-gharbi.png",
    pin: { lat: 24.693752200000002, lng: 46.6318671 },
    coordsInUrl: true,
    placeId: "ChIJ08fsT9wdLz4RMWtdcOrhO4Q",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "cafe-kitsune-laysen-umm-al-hamam-al-gharbi",
    hex: "0x3e2f1d0027613197:0x4984261d4e7d238a",
    neighborhood: "umm-al-hamam-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/cafe-kitsune-laysen-umm-al-hamam-al-gharbi.png",
    pin: { lat: 24.689811, lng: 46.6339073 },
    coordsInUrl: true,
    placeId: "ChIJlzFhJwAdLz4RiiN9Th0mhEk",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "jaam-coffee-umm-al-hamam-al-gharbi",
    hex: "0x3e2f1d12cad949e7:0x4ed4c350e5a98058",
    neighborhood: "umm-al-hamam-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/jaam-coffee-ar-rabwah-ig.jpg",
    pin: { lat: 24.6894205, lng: 46.634124899999996 },
    coordsInUrl: true,
    placeId: "ChIJ50nZyhIdLz4RWICp5VDD1E4",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "midway-coffee-umm-al-hamam-al-gharbi",
    hex: "0x3e2ee38f48ea7449:0x84564a752fdbee30",
    neighborhood: "umm-al-hamam-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.6924393, lng: 46.63379 },
    coordsInUrl: true,
    placeId: "ChIJSXTqSI_jLj4RMO7bL3VKVoQ",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "malmoum-cafe-umm-al-hamam-al-gharbi",
    hex: "0x3e2f1d79f9cb1823:0xb38b6c9806b478a9",
    neighborhood: "umm-al-hamam-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.700737699999998, lng: 46.646356399999995 },
    coordsInUrl: true,
    placeId: "ChIJIxjL-XkdLz4RqXi0Bphsi7M",
    dineIn: true,
  },
  {
    id: "tobys-estate-laysen-umm-al-hamam-al-gharbi",
    hex: "0x3e2f1d003eec06a5:0xe4e21cd6554c2dba",
    neighborhood: "umm-al-hamam-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/tobys-estate-hittin.png",
    pin: { lat: 24.6931899, lng: 46.6339575 },
    coordsInUrl: true,
    placeId: "ChIJpQbsPgAdLz4Rui1MVdYc4uQ",
    dineIn: true,
  },
  {
    id: "hamasat-coffee-umm-al-hamam-al-gharbi",
    hex: "0x3e2f1d4e7caee089:0x254a11b499013ccd",
    neighborhood: "umm-al-hamam-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.685569299999997, lng: 46.64144100000001 },
    coordsInUrl: true,
    placeId: "ChIJieCufE4dLz4RzTwBmbQRSiU",
    outdoorSeating: true,
  },
  {
    id: "mazaj-cafe-umm-al-hamam-al-gharbi",
    hex: "0x3e2f1ce4c2e9c189:0xbaf4f675b2c21ecb",
    neighborhood: "umm-al-hamam-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.688206700000002, lng: 46.642710799999996 },
    coordsInUrl: true,
    placeId: "ChIJicHpwuQcLz4Ryx7CsnX29Lo",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "shafaq-cafe-umm-al-hamam-al-gharbi",
    hex: "0x3e2f1d47fe57db3b:0x89e6bb6fe21ecdb9",
    neighborhood: "umm-al-hamam-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.6857302, lng: 46.644015499999995 },
    coordsInUrl: true,
    placeId: "ChIJO9tX_kcdLz4Ruc0e4m-75ok",
    dineIn: true,
  },
  {
    id: "starbucks-oruba-square-umm-al-hamam-al-gharbi",
    hex: "0x3e2f1d18ad7c630b:0x4f4e608a98a209a5",
    neighborhood: "umm-al-hamam-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/starbucks-mark.png",
    pin: { lat: 24.702347099999997, lng: 46.6506573 },
    coordsInUrl: true,
    placeId: "ChIJC2N8rRgdLz4RpQmimIpgTk8",
    dineIn: true,
    outdoorSeating: false,
  },
  // Batch L (13 Oct 2026, Scout Umm Al Hamam Ash Sharqi pack): 3 local sit-down cafés; Places dineIn/outdoor. Fill («ملء»; earlier read as Sill) is DRIPORA CAFE on Google (same placeId).
  {
    id: "elixir-bunn-umm-al-hamam-ash-sharqi",
    hex: "0x3e2f1dd878e3ca81:0xa66720d2394375a2",
    neighborhood: "umm-al-hamam-ash-sharqi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/elixir-bunn-al-narjis.jpg",
    pin: { lat: 24.6756459, lng: 46.668079899999995 },
    coordsInUrl: true,
    placeId: "ChIJgcrjeNgdLz4RonVDOdIgZ6Y",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "fill-umm-al-hamam-ash-sharqi",
    hex: "0x3e2f1d866443eadd:0x2843a2db691c23b7",
    neighborhood: "umm-al-hamam-ash-sharqi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.673284499999998, lng: 46.6626701 },
    coordsInUrl: true,
    placeId: "ChIJ3epDZIYdLz4RtyMcaduiQyg",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "molten-umm-al-hamam-ash-sharqi",
    hex: "0x3e2f1cad767a153f:0x55c6f06007f71397",
    neighborhood: "umm-al-hamam-ash-sharqi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/molten-umm-al-hamam-ash-sharqi.png",
    pin: { lat: 24.674384399999997, lng: 46.6683883 },
    coordsInUrl: true,
    placeId: "ChIJPxV6dq0cLz4RlxP3B2DwxlU",
    dineIn: true,
    outdoorSeating: false,
  },
  // Batch M (14 Oct 2026, Scout Diplomatic Quarter pack): 9 local sit-down cafés + 4 sit-down chains (Costa, Caribou, 2 Starbucks); Places dineIn/outdoor, Places pin and placeId.
  {
    id: "ralphs-coffee-diplomatic-quarter",
    hex: "0x3e2f1d000ae3161f:0xb196213d7fab734a",
    neighborhood: "diplomatic-quarter",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/ralphs-coffee-diplomatic-quarter.png",
    pin: { lat: 24.6860033, lng: 46.6281746 },
    coordsInUrl: true,
    placeId: "ChIJHxbjCgAdLz4RSnOrfz0hlrE",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "onda-coffee-diplomatic-quarter",
    hex: "0x3e2f1d13a420d253:0x8799f8bf083fb703",
    neighborhood: "diplomatic-quarter",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/onda-coffee-diplomatic-quarter.png",
    pin: { lat: 24.6907429, lng: 46.6279529 },
    coordsInUrl: true,
    placeId: "ChIJU9IgpBMdLz4RA7c_CL_4mYc",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "draft-cafe-diplomatic-quarter",
    hex: "0x3e2f1da7c381e52f:0xa16b7e7db58c708f",
    neighborhood: "diplomatic-quarter",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/draft-cafe-kafd.jpg",
    pin: { lat: 24.6839911, lng: 46.6242174 },
    coordsInUrl: true,
    placeId: "ChIJL-WBw6cdLz4Rj3CMtX1-a6E",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "wacafe-diplomatic-quarter",
    hex: "0x3e2f1d2081b074e5:0x439509491bcd3c40",
    neighborhood: "diplomatic-quarter",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/wacafe-al-rabi.jpg",
    pin: { lat: 24.680665899999997, lng: 46.6232317 },
    coordsInUrl: true,
    placeId: "ChIJ5XSwgSAdLz4RQDzNG0kJlUM",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "archi-diplomatic-quarter",
    hex: "0x3e2f1d64527b7dbf:0xb44d7405c2e439d3",
    neighborhood: "diplomatic-quarter",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/archi-diriyah.jpg",
    pin: { lat: 24.6747947, lng: 46.6249101 },
    coordsInUrl: true,
    placeId: "ChIJv317UmQdLz4R0znkwgV0TbQ",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "urth-caffe-diplomatic-quarter",
    hex: "0x3e2f1df71d2c08b3:0x5cbbe79f6102b8ef",
    neighborhood: "diplomatic-quarter",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/urth-caffe-tahlia-sulimaniyah.jpg",
    pin: { lat: 24.6750834, lng: 46.624641499999996 },
    coordsInUrl: true,
    placeId: "ChIJswgsHfcdLz4R77gCYZ_nu1w",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "costa-coffee-diplomatic-quarter",
    hex: "0x3e2f014cddc86c6b:0xfb5c8460381064c7",
    neighborhood: "diplomatic-quarter",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/costa-mark.png",
    pin: { lat: 24.684483, lng: 46.6240868 },
    coordsInUrl: true,
    placeId: "ChIJa2zI3UwBLz4Rx2QQOGCEXPs",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "caribou-coffee-diplomatic-quarter",
    hex: "0x3e2f1dc4deb50e49:0x2dc87cbf687e6739",
    neighborhood: "diplomatic-quarter",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/caribou-coffee-diplomatic-quarter.png",
    pin: { lat: 24.680462, lng: 46.623304999999995 },
    coordsInUrl: true,
    placeId: "ChIJSQ613sQdLz4ROWd-aL98yC0",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "nua-diplomatic-quarter",
    hex: "0x3e2f1dfb581f3c43:0xd8088b76a22e40b1",
    neighborhood: "diplomatic-quarter",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/nua-diplomatic-quarter.png",
    pin: { lat: 24.6859188, lng: 46.628523099999995 },
    coordsInUrl: true,
    placeId: "ChIJQzwfWPsdLz4RsUAuonaLCNg",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "pink-camel-diplomatic-quarter",
    hex: "0x3e2f1d93dca4aa8f:0x9780b84556519d47",
    neighborhood: "diplomatic-quarter",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/pink-camel-diplomatic-quarter.png",
    pin: { lat: 24.678976499999997, lng: 46.623295399999996 },
    coordsInUrl: true,
    placeId: "ChIJj6qk3JMdLz4RR51RVkW4gJc",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "starbucks-safarat-diplomatic-quarter",
    hex: "0x3e2f1c5b5f694c2b:0xc1ea22f19166bd18",
    neighborhood: "diplomatic-quarter",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/starbucks-mark.png",
    pin: { lat: 24.6734719, lng: 46.623242399999995 },
    coordsInUrl: true,
    placeId: "ChIJK0xpX1scLz4RGL1mkfEi6sE",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "starbucks-oud-square-diplomatic-quarter",
    hex: "0x3e2f1c5ba739a45f:0xc09b53ce248d3ba3",
    neighborhood: "diplomatic-quarter",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/starbucks-mark.png",
    pin: { lat: 24.675478599999998, lng: 46.624784700000006 },
    coordsInUrl: true,
    placeId: "ChIJX6Q5p1scLz4RozuNJM5Tm8A",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "coffee-table-diplomatic-quarter",
    hex: "0x3e2f1db6d38a42b1:0x796d3a7ea41b3842",
    neighborhood: "diplomatic-quarter",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.6743101, lng: 46.623562199999995 },
    coordsInUrl: true,
    placeId: "ChIJsUKK07YdLz4RQjgbpH46bXk",
    dineIn: true,
    outdoorSeating: true,
  },
  // Batch N (15 Oct 2026, Scout Dhahrat Laban pack): 13 local sit-down cafés + 2 sit-down chains (Veloce, dr.CAFE); Places dineIn/outdoor (Shafel seatingVerdict).
  {
    id: "filter-cafe-dhahrat-laban",
    hex: "0x3e2f1f457bfc6823:0xb4e3fe05450a02ae",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/filter-cafe-dhahrat-laban.png",
    pin: { lat: 24.634499899999998, lng: 46.565118399999996 },
    coordsInUrl: true,
    placeId: "ChIJI2j8e0UfLz4RrgIKRQX-47Q",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "veloce-dhahrat-laban",
    hex: "0x3e2f1f8e5cc8c725:0xdc6b7dd4d190104c",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/veloce-cafe-at-taawun.png",
    pin: { lat: 24.6318612, lng: 46.5651625 },
    coordsInUrl: true,
    placeId: "ChIJJcfIXI4fLz4RTBCQ0dR9a9w",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "nakhat-almashrub-dhahrat-laban",
    hex: "0x3e2f1f5098ee7793:0x2dcf0799a465235e",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/nakhat-almashrub-dhahrat-laban.png",
    pin: { lat: 24.633866299999998, lng: 46.565485599999995 },
    coordsInUrl: true,
    placeId: "ChIJk3fumFAfLz4RXiNlpJkHzy0",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "crete-cafe-dhahrat-laban",
    hex: "0x3e2f1fde609f806d:0x759cd3d6a245af58",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.6396528, lng: 46.5398652 },
    coordsInUrl: true,
    placeId: "ChIJbYCfYN4fLz4RWK9FotbTnHU",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "arco-coffee-dhahrat-laban",
    hex: "0x3e2f1f1f6f368e9b:0x64bc3304d13b3833",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/arco-al-rabi.jpg",
    pin: { lat: 24.6391214, lng: 46.5632563 },
    coordsInUrl: true,
    placeId: "ChIJm442bx8fLz4RMzg70QQzvGQ",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "coffee-address-najd-dhahrat-laban",
    hex: "0x3e2f1f44af52c84b:0x385d2131492a6686",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/coffee-address-mark.png",
    pin: { lat: 24.6341072, lng: 46.5688543 },
    coordsInUrl: true,
    placeId: "ChIJS8hSr0QfLz4RhmYqSTEhXTg",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "angel-coffee-dhahrat-laban",
    hex: "0x3e2f1f1ca9ec623f:0xec15ba407e9f7506",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.632946000000004, lng: 46.554540599999996 },
    coordsInUrl: true,
    placeId: "ChIJP2LsqRwfLz4RBnWffkC6Few",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "ezwa-cafe-dhahrat-laban",
    hex: "0x3e2f1ff8d534d847:0xdd3d85ca60d9ff7",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.643956499999998, lng: 46.5574065 },
    coordsInUrl: true,
    placeId: "ChIJR9g01fgfLz4R958NplzY0w0",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "sidedoor-dhahrat-laban",
    hex: "0x3e2f1f003eca348f:0xaa44b081d8adfb46",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/sidedoor-dhahrat-laban.png",
    pin: { lat: 24.6395625, lng: 46.564187499999996 },
    coordsInUrl: true,
    placeId: "ChIJjzTKPgAfLz4RRvut2IGwRKo",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "portafilter-dhahrat-laban",
    hex: "0x3e2f1fa67b70d5a3:0x2be6ca49e78857bb",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.6276138, lng: 46.5547562 },
    coordsInUrl: true,
    placeId: "ChIJo9Vwe6YfLz4Ru1eI50nK5is",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "qasura-coffee-dhahrat-laban",
    hex: "0x3e2f1f868309d8e3:0xa9cd13fb0452458c",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.6423433, lng: 46.5735246 },
    coordsInUrl: true,
    placeId: "ChIJ49gJg4YfLz4RjEVSBPsTzak",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "shafel-coffee-dhahrat-laban",
    hex: "0x3e2f1f1afb872705:0x148fd96efe18e2f5",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/shafel-roastery-al-nahdah.png",
    pin: { lat: 24.634803299999998, lng: 46.5699701 },
    coordsInUrl: true,
    placeId: "ChIJBSeH-xofLz4R9eIY_m7ZjxQ",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "yabub-coffee-dhahrat-laban",
    hex: "0x3e2f1f885cc36089:0x2238af966eb88748",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.627400599999998, lng: 46.542761299999995 },
    coordsInUrl: true,
    placeId: "ChIJiWDDXIgfLz4RSIe4bpavOCI",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "jadeel-coffee-dhahrat-laban",
    hex: "0x3e2f1f004d4dda01:0x5e4bc5ee53a7086e",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.6533923, lng: 46.570778399999995 },
    coordsInUrl: true,
    placeId: "ChIJAdpNTQAfLz4RbginU-7FS14",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "drcafe-park-dhahrat-laban",
    hex: "0x3e2f1fc6799a9cc5:0x44c65ab402949864",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/drcafe-mark.png",
    pin: { lat: 24.6373125, lng: 46.5544375 },
    coordsInUrl: true,
    placeId: "ChIJxZyaecYfLz4RZJiUArRaxkQ",
    dineIn: true,
    outdoorSeating: null,
  },
  // AJ add (16 Oct 2026): Found Ar Rabwah, letter tile; Places dineIn null (Scout seatingVerdict).
  {
    id: "found-ar-rabwah",
    hex: "0x3e2f03662230790d:0x9128b81fce8e5c",
    neighborhood: "al-rabwah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.6953922, lng: 46.745342199999996 },
    coordsInUrl: true,
    placeId: "ChIJDXkwImYDLz4RXI7OH7gokQA",
    dineIn: true,
    outdoorSeating: null,
  },
  // Batch P (17 Oct 2026, Scout Tuwaiq pack): 14 local sit-down specialty cafés (Ratio, Gedeb, Era reuse sibling marks; 5 letter tiles).
  {
    id: "irlo-tuwaiq",
    hex: "0x3e2f235bf48a757d:0x213dc983b1469c67",
    neighborhood: "tuwaiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/irlo-tuwaiq.png",
    pin: { lat: 24.55716, lng: 46.514824399999995 },
    coordsInUrl: true,
    placeId: "ChIJfXWK9FsjLz4RZ5xGsYPJPSE",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "ratio-speciality-tuwaiq",
    hex: "0x3e2f190044a2f26f:0x2cabbc1b08c7ba8a",
    neighborhood: "tuwaiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/ratio-speciality-al-yarmouk.png",
    pin: { lat: 24.553163599999998, lng: 46.565229099999996 },
    coordsInUrl: true,
    placeId: "ChIJb_KiRAAZLz4RirrHCBu8qyw",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "quba-tuwaiq",
    hex: "0x3e2f19d15c6cc737:0x7b88bd25d43de266",
    neighborhood: "tuwaiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/quba-tuwaiq.png",
    pin: { lat: 24.566426099999997, lng: 46.5541931 },
    coordsInUrl: true,
    placeId: "ChIJN8dsXNEZLz4RZuI91CW9iHs",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "oldlane-tuwaiq",
    hex: "0x3e2f1900535bbb4d:0xf986539ad543c655",
    neighborhood: "tuwaiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/oldlane-tuwaiq.png",
    pin: { lat: 24.566720399999998, lng: 46.5566971 },
    coordsInUrl: true,
    placeId: "ChIJTbtbUwAZLz4RVcZD1ZpThvk",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "gedeb-tuwaiq",
    hex: "0x3e2f19003469db9b:0x1412e28bafe27c5e",
    neighborhood: "tuwaiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/gedeb-al-olaya.jpg",
    pin: { lat: 24.565846699999998, lng: 46.562881499999996 },
    coordsInUrl: true,
    placeId: "ChIJm9tpNAAZLz4RXnzir4viEhQ",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "breath-tuwaiq",
    hex: "0x3e2f192c9e03e047:0xe90c88e191b48306",
    neighborhood: "tuwaiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/breath-tuwaiq.png",
    pin: { lat: 24.558742499999997, lng: 46.571492799999994 },
    coordsInUrl: true,
    placeId: "ChIJR-ADniwZLz4RBoO0keGIDOk",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "lihaf-tuwaiq",
    hex: "0x3e2f19002b04a909:0xd5f12d8bb37e8bf8",
    neighborhood: "tuwaiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/lihaf-tuwaiq.png",
    pin: { lat: 24.5554386, lng: 46.5544705 },
    coordsInUrl: true,
    placeId: "ChIJCakEKwAZLz4R-It-s4st8dU",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "saaf-tuwaiq",
    hex: "0x6e61a31766bca127:0xe8acef3c14b7f5e",
    neighborhood: "tuwaiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.5649615, lng: 46.5732542 },
    coordsInUrl: true,
    placeId: "ChIJJ6G8ZhejYW4RXn9LwfPOig4",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "inverno-tuwaiq",
    hex: "0x3e2f19f48bae7ab5:0xff407c5c5a9dc923",
    neighborhood: "tuwaiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/inverno-tuwaiq.png",
    pin: { lat: 24.5719761, lng: 46.5554321 },
    coordsInUrl: true,
    placeId: "ChIJtXqui_QZLz4RI8mdWlx8QP8",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "era-coffee-tuwaiq",
    hex: "0x3e2f19007915fd89:0x9faee695f1a4cc3b",
    neighborhood: "tuwaiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/era-coffee-as-suwaidi.png",
    pin: { lat: 24.565663500000003, lng: 46.570658699999996 },
    coordsInUrl: true,
    placeId: "ChIJif0VeQAZLz4RO8yk8ZXmrp8",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "haqwa-tuwaiq",
    hex: "0x3e2f19006b700765:0xe7c5fff46c377b23",
    neighborhood: "tuwaiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/haqwa-tuwaiq.png",
    pin: { lat: 24.565387299999998, lng: 46.5682068 },
    coordsInUrl: true,
    placeId: "ChIJZQdwawAZLz4RI3s3bPT_xec",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "taghrid-tuwaiq",
    hex: "0x3e2f19842708118d:0xa1b28c69ca0cbeef",
    neighborhood: "tuwaiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.561359799999998, lng: 46.5341625 },
    coordsInUrl: true,
    placeId: "ChIJjREIJ4QZLz4R774MymmMsqE",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "nv-coffee-tuwaiq",
    hex: "0x3e2f19005b4527d7:0x92ec2483ac14a3a5",
    neighborhood: "tuwaiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.5563623, lng: 46.5738403 },
    coordsInUrl: true,
    placeId: "ChIJ1ydFWwAZLz4RpaMUrIMk7JI",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "shathb-tuwaiq",
    hex: "0x3e2f19003fc72161:0x4316da5e186ee18b",
    neighborhood: "tuwaiq",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.5831095, lng: 46.5763373 },
    coordsInUrl: true,
    placeId: "ChIJYSHHPwAZLz4Ri-FuGF7aFkM",
    dineIn: true,
    outdoorSeating: null,
  },
  // Batch O (16 Oct 2026, Scout Namar pack): 2 local sit-down cafés + 2 sit-down chains (Java Cafe; The Coffee Bean & Tea Leaf, new brand).
  {
    id: "java-cafe-namar",
    hex: "0x3e2f0f7829b3d0f1:0xe8ceed4e7e921359",
    neighborhood: "namar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/java-cafe.png",
    pin: { lat: 24.584281999999998, lng: 46.691123 },
    coordsInUrl: true,
    placeId: "ChIJ8dCzKXgPLz4RWROSfk7tzug",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "pandemic-coffee-namar",
    hex: "0x3e2f110050621189:0x5dd11c40aba108a5",
    neighborhood: "namar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.568403999999997, lng: 46.6637437 },
    coordsInUrl: true,
    placeId: "ChIJiRFiUAARLz4RpQihq0Ac0V0",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "coffee-bean-tea-leaf-namar",
    hex: "0x3e2f1149fd110143:0x90dae8e37b5f580e",
    neighborhood: "namar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/coffee-bean-mark.png",
    pin: { lat: 24.568419, lng: 46.6638178 },
    coordsInUrl: true,
    placeId: "ChIJQwER_UkRLz4RDlhfe-Po2pA",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "freedom-coffee-namar",
    hex: "0x3e2f0fb244bf4a5d:0x9c9089a892d91926",
    neighborhood: "namar",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.5781817, lng: 46.6909327 },
    coordsInUrl: true,
    placeId: "ChIJXUq_RLIPLz4RJhnZkqiJkJw",
    dineIn: true,
    outdoorSeating: true,
  },
  // Batch Q (18 Oct 2026, Scout Ash Shifa pack): 9 local sit-down cafés (Yamm and Coffee Address reuse sibling marks; 5 letter tiles) + 3 sit-down chains (Java Cafe, 2 Half Million).
  {
    id: "yamm-ash-shifa",
    hex: "0x3e2f0f882c5a9fff:0xf91d0b0e572f233f",
    neighborhood: "ash-shifa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/yamm-olaya.jpg",
    pin: { lat: 24.571401899999998, lng: 46.6988322 },
    coordsInUrl: true,
    placeId: "ChIJ_59aLIgPLz4RPyMvVw4LHfk",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "coffee-address-ash-shifa",
    hex: "0x3e2f0f69193aa585:0xb854f9f34dfeadd7",
    neighborhood: "ash-shifa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/coffee-address-mark.png",
    pin: { lat: 24.550152, lng: 46.697235 },
    coordsInUrl: true,
    placeId: "ChIJhaU6GWkPLz4R163-TfP5VLg",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "folk-coffee-ash-shifa",
    hex: "0x3e2f0f3ea08f3caf:0x87d0657d6cda3cfb",
    neighborhood: "ash-shifa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.5704375, lng: 46.693437499999995 },
    coordsInUrl: true,
    placeId: "ChIJrzyPoD4PLz4R-zzabH1l0Ic",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "light-dose-ash-shifa",
    hex: "0x3e2f0f78383688bf:0xa14d3e8365574e58",
    neighborhood: "ash-shifa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.5682922, lng: 46.7034119 },
    coordsInUrl: true,
    placeId: "ChIJv4g2OHgPLz4RWE5XZYM-TaE",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "third-place-ash-shifa",
    hex: "0x3e2f0f00173693ef:0x7ff7462f617fcd7e",
    neighborhood: "ash-shifa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/third-place-ash-shifa.png",
    pin: { lat: 24.5585889, lng: 46.6973917 },
    coordsInUrl: true,
    placeId: "ChIJ75M2FwAPLz4Rfs1_YS9G938",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "butterfly-cafe-ash-shifa",
    hex: "0x3e2f0fe90613637d:0x5ed5aeaefc96610a",
    neighborhood: "ash-shifa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/butterfly-cafe-ash-shifa.png",
    pin: { lat: 24.5757451, lng: 46.697634099999995 },
    coordsInUrl: true,
    placeId: "ChIJfWMTBukPLz4RCmGW_K6u1V4",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "rwy-ash-shifa",
    hex: "0x3e2f0f2e8c0ddad9:0x1972da1f5ad1c9b8",
    neighborhood: "ash-shifa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.554975499999998, lng: 46.7002902 },
    coordsInUrl: true,
    placeId: "ChIJ2doNjC4PLz4RuMnRWh_achk",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "icon-ash-shifa",
    hex: "0x3e2f0f0067b72b79:0xcf9a54f1f1ba1eb4",
    neighborhood: "ash-shifa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.5736225, lng: 46.696957399999995 },
    coordsInUrl: true,
    placeId: "ChIJeSu3ZwAPLz4RtB668fFUms8",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "linor-ash-shifa",
    hex: "0x3e2f0fc1f12c3be7:0xc7a5c10293c1499d",
    neighborhood: "ash-shifa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.561888699999997, lng: 46.6875329 },
    coordsInUrl: true,
    placeId: "ChIJ5zss8cEPLz4RnUnBkwLBpcc",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "java-cafe-ash-shifa",
    hex: "0x3e2f0f4e76b9633b:0xc1f29c37aa0b363e",
    neighborhood: "ash-shifa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/java-cafe.png",
    pin: { lat: 24.569117199999997, lng: 46.6899794 },
    coordsInUrl: true,
    placeId: "ChIJO2O5dk4PLz4RPjYLqjec8sE",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "half-million-ibn-taymiyyah-ash-shifa",
    hex: "0x3e2f0f7019076869:0x2211e2ade084686c",
    neighborhood: "ash-shifa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/half-million-mark.png",
    pin: { lat: 24.556441099999997, lng: 46.7023298 },
    coordsInUrl: true,
    placeId: "ChIJaWgHGXAPLz4RbGiE4K3iESI",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "half-million-tirmidhi-ash-shifa",
    hex: "0x3e2f0f48c5ab90f7:0x7c7afe99ba9bd53d",
    neighborhood: "ash-shifa",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/half-million-mark.png",
    pin: { lat: 24.5685437, lng: 46.7011987 },
    coordsInUrl: true,
    placeId: "ChIJ95CrxUgPLz4RPdWbupn-enw",
    dineIn: true,
    outdoorSeating: true,
  },
  // AJ add (18 Oct 2026): Trace Al Mursalat, letter tile; Places dineIn true.
  {
    id: "trace-al-mursalat",
    hex: "0x3e2f03864359adf7:0xda0ddf2ee8a75ad7",
    neighborhood: "al-mursalat",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.739761500000004, lng: 46.6880974 },
    coordsInUrl: true,
    placeId: "ChIJ961ZQ4YDLz4R11qn6C7fDdo",
    dineIn: true,
    outdoorSeating: null,
  },
  // Trending adds (18 Oct 2026): Scout trending verify; seating from Scout where Places dineIn is null.
  {
    id: "dwell-dhahrat-laban",
    hex: "0x3e2f1fff3633a231:0x1f1c3c32a3036078",
    neighborhood: "dhahrat-laban",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.633279299999998, lng: 46.5559072 },
    coordsInUrl: true,
    placeId: "ChIJMaIzNv8fLz4ReGADozI8HB8",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "in-row-al-fayha",
    hex: "0x3e2f0778085344e9:0xdc17c03d45ed79da",
    neighborhood: "al-fayha",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/in-row-al-fayha.png",
    pin: { lat: 24.6823341, lng: 46.8165098 },
    coordsInUrl: true,
    placeId: "ChIJ6URTCHgHLz4R2nntRT3AF9w",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "veni-al-nakheel",
    hex: "0x3e2ee30066bef1df:0xd8a372a55e45a351",
    neighborhood: "al-nakheel",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.7425367, lng: 46.6204465 },
    coordsInUrl: true,
    placeId: "ChIJ3_G-ZgDjLj4RUaNFXqVyo9g",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "horus-house-olaya",
    hex: "0x3e2ee3425fff5273:0x4b29dc83388e3a7a",
    neighborhood: "olaya",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.6884826, lng: 46.6880691 },
    coordsInUrl: true,
    placeId: "ChIJc1L_X0LjLj4RejqOOIPcKUs",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "espresso-culture-al-mursalat",
    hex: "0x3e2f038c7cab1b79:0x4d5b0212cc5ffded",
    neighborhood: "al-mursalat",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.739974099999998, lng: 46.6917963 },
    coordsInUrl: true,
    placeId: "ChIJeRurfIwDLz4R7f1fzBICW00",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "kultura-as-suwaidi-al-gharbi",
    hex: "0x3e2f115575be1149:0xede8bacfb0f8ab8b",
    neighborhood: "as-suwaidi-al-gharbi",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/kultura-as-suwaidi-al-gharbi.jpg",
    pin: { lat: 24.561901499999998, lng: 46.6431373 },
    coordsInUrl: true,
    placeId: "ChIJSRG-dVURLz4Ri6v4sM-66O0",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "shal-al-mohammadiyah",
    hex: "0x3e2ee32908746d67:0x44151f78df634e6b",
    neighborhood: "al-mohammadiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.735758699999998, lng: 46.6483584 },
    coordsInUrl: true,
    placeId: "ChIJZ210CCnjLj4Ra05j33gfFUQ",
    dineIn: true,
    outdoorSeating: null,
  },

  // Batch R (19 Oct 2026): Al Qadisiyah — 3 local (Tu Momento letter tile) + 5 sit-down chains on the sibling marks.
  {
    id: "tu-momento-al-qadisiyah",
    hex: "0x3e2e55a6c1516a53:0x440a0876d66d7a97",
    neighborhood: "al-qadisiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.820297699999998, lng: 46.8328829 },
    coordsInUrl: true,
    placeId: "ChIJU2pRwaZVLj4Rl3pt1nYICkQ",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "heet-coffee-al-qadisiyah",
    hex: "0x3e2eff965a926fb9:0x2a22367545df6b84",
    neighborhood: "al-qadisiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/heet-coffee-al-qadisiyah.png",
    pin: { lat: 24.8080625, lng: 46.8104375 },
    coordsInUrl: true,
    placeId: "ChIJuW-SWpb_Lj4RhGvfRXU2Iio",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "rewanted-al-qadisiyah",
    hex: "0x3e2e55b4b118cc03:0xaf82c3205bd79404",
    neighborhood: "al-qadisiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/rewanted-al-qadisiyah.png",
    pin: { lat: 24.8160299, lng: 46.834551999999995 },
    coordsInUrl: true,
    placeId: "ChIJA8wYsbRVLj4RBJTXWyDDgq8",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "peets-sheikh-jaber-al-qadisiyah",
    hex: "0x3e2eff0329d3a107:0xb3419d1fde323079",
    neighborhood: "al-qadisiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/peets-mark.png",
    pin: { lat: 24.805823999999998, lng: 46.8120196 },
    coordsInUrl: true,
    placeId: "ChIJB6HTKQP_Lj4ReTAy3h-dQbM",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "half-million-al-qadisiyah",
    hex: "0x3e2eff3d3ec0894d:0xf4d272c025806d4e",
    neighborhood: "al-qadisiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/half-million-mark.png",
    pin: { lat: 24.815109999999997, lng: 46.80512100000001 },
    coordsInUrl: true,
    placeId: "ChIJTYnAPj3_Lj4RTm2AJcBy0vQ",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "starbucks-rakaa-plaza-al-qadisiyah",
    hex: "0x3e2f1da3e6270a17:0xeafad12fed10ece9",
    neighborhood: "al-qadisiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/starbucks-mark.png",
    pin: { lat: 24.817978999999998, lng: 46.803059999999995 },
    coordsInUrl: true,
    placeId: "ChIJFwon5qMdLz4R6ewQ7S_R-uo",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "starbucks-tamimi-al-qadisiyah",
    hex: "0x3e2eff1eba820f5d:0x68bb7bf50b0b9ea1",
    neighborhood: "al-qadisiyah",
    vibe: ["قهوة"],
    moments: ["qahwa", "drive-through"],
    logoUrl: "/logos/starbucks-mark.png",
    pin: { lat: 24.8054431, lng: 46.8122715 },
    coordsInUrl: true,
    placeId: "ChIJXQ-Cuh7_Lj4RoZ4LC_V7u2g",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "tim-hortons-sheikh-jaber-al-qadisiyah",
    hex: "0x3e2eff6863a04cc5:0xede678d52bab4bf4",
    neighborhood: "al-qadisiyah",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/tim-hortons-wordmark.png",
    pin: { lat: 24.804333, lng: 46.812858999999996 },
    coordsInUrl: true,
    placeId: "ChIJxUygY2j_Lj4R9EurK9V45u0",
    dineIn: true,
    outdoorSeating: null,
  },
  // Batch S (20 Oct 2026): As Salam — 6 local specialty (Smpl and Bu'd Art letter tiles; Namq / Breehant reuse catalog marks).
  {
    id: "namq-as-salam",
    hex: "0x3e2fa96624b76f27:0xb299c07ab8fde67f",
    neighborhood: "as-salam",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/namq-al-malqa.jpg",
    pin: { lat: 24.700767, lng: 46.827324999999995 },
    coordsInUrl: true,
    placeId: "ChIJJ2-3JGapLz4Rf-b9uHrAmbI",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "smpl-as-salam",
    hex: "0x3e2f0700713b9afd:0xee12de89e22bb1c3",
    neighborhood: "as-salam",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.7065007, lng: 46.799544999999995 },
    coordsInUrl: true,
    placeId: "ChIJ_Zo7cQAHLz4Rw7Er4oneEu4",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "bud-art-cafe-as-salam",
    hex: "0x3e2f070075c37885:0xa513327dc3fa1f03",
    neighborhood: "as-salam",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.7068667, lng: 46.7993293 },
    coordsInUrl: true,
    placeId: "ChIJhXjDdQAHLz4RAx_6w30yE6U",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "heddah-roaster-as-salam",
    hex: "0x3e2f07dc5ae1b26d:0x4fbf222d72848387",
    neighborhood: "as-salam",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/heddah-roaster-as-salam.png",
    pin: { lat: 24.7205135, lng: 46.812480199999996 },
    coordsInUrl: true,
    placeId: "ChIJbbLhWtwHLz4Rh4OEci0iv08",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "sakaf-as-salam",
    hex: "0x3e2f07a91fc45f5b:0x293676b0436a0f2f",
    neighborhood: "as-salam",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/sakaf-as-salam.png",
    pin: { lat: 24.696947599999998, lng: 46.80711120000001 },
    coordsInUrl: true,
    placeId: "ChIJW1_EH6kHLz4RLw9qQ7B2Nik",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "breehant-as-salam",
    hex: "0x3e2f07631f6c67ed:0x9b60a465a4fddd37",
    neighborhood: "as-salam",
    vibe: ["محمصة", "قهوة"],
    moments: ["roaster", "qahwa"],
    logoUrl: "/logos/breehant-al-yasmin.jpg",
    pin: { lat: 24.7065524, lng: 46.8097911 },
    coordsInUrl: true,
    placeId: "ChIJ7WdsH2MHLz4RN939pGWkYJs",
    dineIn: true,
    outdoorSeating: true,
  },
  // Batch SD1 (21 Oct 2026): Al Shohda — 7 local (Cobee and Tahn letter tiles; BeFine / Arco reuse catalog marks) + 7 sit-down chains on the sibling marks.
  {
    id: "andarena-cafe-al-shohda",
    hex: "0x3e2efd18735ee2db:0x1df41553feb2d438",
    neighborhood: "al-shohda",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/andarena-cafe-al-shohda.png",
    pin: { lat: 24.7884919, lng: 46.733294699999995 },
    coordsInUrl: true,
    placeId: "ChIJ2-Jecxj9Lj4RONSy_lMV9B0",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "befine-coffee-al-shohda",
    hex: "0x3e2efd0038f4e31f:0xd62b1b3077d726c7",
    neighborhood: "al-shohda",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/befine-coffee-al-masif.jpg",
    pin: { lat: 24.786702599999998, lng: 46.7457858 },
    coordsInUrl: true,
    placeId: "ChIJH-P0OAD9Lj4RxybXdzAbK9Y",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "cobee-cafe-al-shohda",
    hex: "0x3e2efd753a95c917:0x5a0414b7a3665826",
    neighborhood: "al-shohda",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.789558099999997, lng: 46.7357461 },
    coordsInUrl: true,
    placeId: "ChIJF8mVOnX9Lj4RJlhmo7cUBFo",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "arco-al-shohda",
    hex: "0x3e2efd61dbfbdda5:0xb77ccda886b960e5",
    neighborhood: "al-shohda",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/arco-al-rabi.jpg",
    pin: { lat: 24.7903315, lng: 46.740176600000005 },
    coordsInUrl: true,
    placeId: "ChIJpd3722H9Lj4R5WC5hqjNfLc",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "tahn-al-shohda",
    hex: "0x3e2efd3f282b09d5:0x784d213630fae89f",
    neighborhood: "al-shohda",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    pin: { lat: 24.790318, lng: 46.743287099999996 },
    coordsInUrl: true,
    placeId: "ChIJ1QkrKD_9Lj4Rn-j6MDYhTXg",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "black-wolf-al-shohda",
    hex: "0x3e2efd7053f23f3b:0xc7eeccaff5343ee0",
    neighborhood: "al-shohda",
    vibe: ["محمصة",  "قهوة"],
    moments: ["roaster",  "qahwa"],
    logoUrl: "/logos/black-wolf-al-shohda.png",
    pin: { lat: 24.789417699999998, lng: 46.735755999999995 },
    coordsInUrl: true,
    placeId: "ChIJOz_yU3D9Lj4R4D409a_M7sc",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "illy-cafe-granada-mall-al-shohda",
    hex: "0x3e2efd85efdba3f9:0x1cb87a6b27d26de0",
    neighborhood: "al-shohda",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/illy-cafe-granada-mall-al-shohda.png",
    pin: { lat: 24.7838125, lng: 46.7305625 },
    coordsInUrl: true,
    placeId: "ChIJ-aPb74X9Lj4R4G3SJ2t6uBw",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "drcafe-ash-shuhada-al-shohda",
    hex: "0x3e2eff5afad247b5:0x84bb199d1c32ffac",
    neighborhood: "al-shohda",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/drcafe-mark.png",
    pin: { lat: 24.783973900000003, lng: 46.7480426 },
    coordsInUrl: true,
    placeId: "ChIJtUfS-lr_Lj4RrP8yHJ0Zu4Q",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "drcafe-granada-mall-al-shohda",
    hex: "0x3e2efd8c4a2d9823:0x6a255627a293fce7",
    neighborhood: "al-shohda",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/drcafe-mark.png",
    pin: { lat: 24.7815574, lng: 46.730621899999996 },
    coordsInUrl: true,
    placeId: "ChIJI5gtSoz9Lj4R5_yToidWJWo",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "peets-granada-mall-al-shohda",
    hex: "0x3e2efdb9ac78f879:0x9d7f0b464ddde5e8",
    neighborhood: "al-shohda",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/peets-mark.png",
    pin: { lat: 24.782891000000003, lng: 46.729825000000005 },
    coordsInUrl: true,
    placeId: "ChIJefh4rLn9Lj4R6OXdTUYLf50",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "starbucks-granada-mall-al-shohda",
    hex: "0x3e2efd733480fb0b:0x6975469e3346095",
    neighborhood: "al-shohda",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/starbucks-mark.png",
    pin: { lat: 24.782574, lng: 46.7304947 },
    coordsInUrl: true,
    placeId: "ChIJC_uANHP9Lj4RlWA042lUlwY",
    dineIn: true,
    outdoorSeating: false,
  },
  {
    id: "half-million-al-shohda",
    hex: "0x3e2efdada16863e1:0x13bd9c8af7c556de",
    neighborhood: "al-shohda",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/half-million-mark.png",
    pin: { lat: 24.780963000000003, lng: 46.740935 },
    coordsInUrl: true,
    placeId: "ChIJ4WNooa39Lj4R3lbF94qcvRM",
    dineIn: true,
    outdoorSeating: null,
  },
  {
    id: "tim-hortons-granada-mall-al-shohda",
    hex: "0x3e2efdc01be2ae1f:0x627fa85877c2ec5f",
    neighborhood: "al-shohda",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/tim-hortons-wordmark.png",
    pin: { lat: 24.7831908, lng: 46.7298155 },
    coordsInUrl: true,
    placeId: "ChIJH67iG8D9Lj4RX-zCd1iof2I",
    dineIn: true,
    outdoorSeating: true,
  },
  {
    id: "caribou-granada-mall-al-shohda",
    hex: "0x3e2efd68e8037217:0xd5ec335f149b0ae5",
    neighborhood: "al-shohda",
    vibe: ["قهوة"],
    moments: ["qahwa"],
    logoUrl: "/logos/caribou-coffee-diplomatic-quarter.png",
    pin: { lat: 24.782840999999998, lng: 46.729898 },
    coordsInUrl: true,
    placeId: "ChIJF3ID6Gj9Lj4R5QqbFF8z7NU",
    dineIn: true,
    outdoorSeating: null,
  },
];

for (const row of scoutPack) {
  const shop = getShop(row.id);
  assert(shop, `${row.id} is a real catalog shop`);
  assert(shop.example === false, `${row.id} is not an example shop`);
  assert(shop.neighborhood === row.neighborhood, `${row.id} neighborhood`);
  const placeHref = `https://www.google.com/maps/place/data=!4m2!3m1!1s${row.hex}`;
  const expectedHref =
    row.coordsInUrl && row.pin
      ? `${placeHref}!8m2!3d${row.pin.lat}!4d${row.pin.lng}`
      : placeHref;
  assert(
    shop.mapsShareUrl === expectedHref,
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
    if (row.coordsInUrl) {
      const coords = officialShopCoords(shop);
      assert(
        coords?.lat === row.pin.lat && coords?.lng === row.pin.lng,
        `${row.id} officialShopCoords matches the locked pin`,
      );
    }
  }
  if (row.placeId) {
    assert(shop.placeId === row.placeId, `${row.id} place id`);
  }
  if ("dineIn" in row) {
    assert(shop.dineIn === row.dineIn, `${row.id} dineIn`);
  }
  if ("outdoorSeating" in row) {
    assert(shop.outdoorSeating === row.outdoorSeating, `${row.id} outdoorSeating`);
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

const helloOlaya = getShop("hello-cafe-olaya");
assert(helloOlaya?.logoUrl === "/logos/hello-cafe-olaya-ig.jpg", "Hello Cafe uses the IG hlo mark");
assert(
  helloOlaya?.openingHours?.weekdayDescriptions?.every(
    (line) => line.endsWith("6:00\u202fAM\u2009–\u20092:00\u202fAM"),
  ) &&
    helloOlaya.openingHours.weekdayDescriptions[4]?.startsWith("Friday:") &&
    helloOlaya.openingHours.periods?.length === 7 &&
    helloOlaya.openingHours.periods.every(
      (period, index) =>
        period.open.day === index &&
        period.open.hour === 6 &&
        period.open.minute === 0 &&
        period.close?.hour === 2 &&
        period.close.minute === 0,
    ),
  "Hello Cafe hours are Amjad's lock: every day 6:00 AM–2:00 AM next day, including Friday",
);
const lasOlaya = getShop("las-cafe-al-olaya");
assert(
  lasOlaya?.openingHours?.weekdayDescriptions?.every((line) =>
    line.endsWith("Open 24 hours"),
  ) &&
    lasOlaya.openingHours.weekdayDescriptions.length === 7 &&
    lasOlaya.openingHours.periods?.length === 1 &&
    lasOlaya.openingHours.periods[0]?.open.day === 0 &&
    lasOlaya.openingHours.periods[0]?.open.hour === 0 &&
    lasOlaya.openingHours.periods[0]?.close == null,
  "LAS CAFE Olaya hours are the Maps 24h lock only",
);
for (const id of [
  "bacha-coffee-solitaire",
  "mood-masters-al-falah",
  "las-cafe-al-malqa",
  "little-henri-al-muruj",
  "beitkull-al-olaya",
  "satr-specialty-coffee-al-mughrizat",
  "covo-artisan-coffee-al-mughrizat",
  "bunatetu-al-mughrizat",
  "dune-coffee-al-mughrizat",
  "tuxedo-coffee-al-mughrizat",
  "bar-coffee-al-mughrizat",
  "adab-cafe-al-mughrizat",
  "booze-specialty-coffee-bar-al-mughrizat",
  "latch-al-mughrizat",
  "slant-specialty-coffee-al-izdihar",
  "gedeb-al-olaya",
  "bossco-roastery-al-olaya",
  "lluvia-caffe-al-olaya",
  "oromiffa-al-olaya",
  "buljah-al-olaya",
  "19-gram-al-olaya",
  "kulma-speciality-coffee-al-olaya",
  "morfi-al-olaya",
  "jolt-al-olaya",
  "key-cafe-al-olaya",
  "alwaal-albari-al-olaya",
  "hearth-al-arid",
]) {
  assert(!getShop(id)?.openingHours, `${id} has no invented weekly hours`);
}

function assertPlacesHours(
  id: string,
  weekdayDescriptions: readonly string[],
  periods: readonly (readonly [number, number, number, number, number, number])[],
) {
  const hours = getShop(id)?.openingHours;
  const actual = (hours?.periods ?? []).map((period) => [
    period.open.day,
    period.open.hour,
    period.open.minute,
    period.close?.day,
    period.close?.hour,
    period.close?.minute,
  ]);
  assert(
    JSON.stringify(hours?.weekdayDescriptions) === JSON.stringify(weekdayDescriptions) &&
      JSON.stringify(actual) === JSON.stringify(periods),
    `${id} keeps the Places weekly hours`,
  );
}

assertPlacesHours(
  "crops-al-narjis",
  [
    "Monday: 6:00\u202fAM\u2009\u2013\u200912:00\u202fAM",
    "Tuesday: 6:00\u202fAM\u2009\u2013\u200912:00\u202fAM",
    "Wednesday: 6:00\u202fAM\u2009\u2013\u200912:00\u202fAM",
    "Thursday: 6:00\u202fAM\u2009\u2013\u200912:00\u202fAM",
    "Friday: 6:00\u202fAM\u2009\u2013\u200912:00\u202fAM",
    "Saturday: 6:00\u202fAM\u2009\u2013\u200912:00\u202fAM",
    "Sunday: 6:00\u202fAM\u2009\u2013\u200912:00\u202fAM",
  ],
  [
    [0, 6, 0, 1, 0, 0],
    [1, 6, 0, 2, 0, 0],
    [2, 6, 0, 3, 0, 0],
    [3, 6, 0, 4, 0, 0],
    [4, 6, 0, 5, 0, 0],
    [5, 6, 0, 6, 0, 0],
    [6, 6, 0, 0, 0, 0],
  ],
);
assertPlacesHours(
  "bala-al-rawabi",
  [
    "Monday: 12:00\u202fPM\u2009\u2013\u200912:00\u202fAM",
    "Tuesday: 12:00\u202fPM\u2009\u2013\u200912:00\u202fAM",
    "Wednesday: 12:00\u202fPM\u2009\u2013\u200912:00\u202fAM",
    "Thursday: 12:00\u202fPM\u2009\u2013\u20091:00\u202fAM",
    "Friday: 12:00\u202fPM\u2009\u2013\u20091:00\u202fAM",
    "Saturday: 12:00\u202fPM\u2009\u2013\u200912:00\u202fAM",
    "Sunday: 12:00\u202fPM\u2009\u2013\u200912:00\u202fAM",
  ],
  [
    [0, 12, 0, 1, 0, 0],
    [1, 12, 0, 2, 0, 0],
    [2, 12, 0, 3, 0, 0],
    [3, 12, 0, 4, 0, 0],
    [4, 12, 0, 5, 1, 0],
    [5, 12, 0, 6, 1, 0],
    [6, 12, 0, 0, 0, 0],
  ],
);
assertPlacesHours(
  "ract-al-qirawan",
  [
    "Monday: 4:00\u202fPM\u2009\u2013\u200912:00\u202fAM",
    "Tuesday: 4:00\u202fPM\u2009\u2013\u200912:00\u202fAM",
    "Wednesday: 4:00\u202fPM\u2009\u2013\u200912:00\u202fAM",
    "Thursday: 4:00\u202fPM\u2009\u2013\u20091:00\u202fAM",
    "Friday: 4:00\u202fPM\u2009\u2013\u20091:00\u202fAM",
    "Saturday: 4:00\u202fPM\u2009\u2013\u200912:00\u202fAM",
    "Sunday: 4:00\u202fPM\u2009\u2013\u200912:00\u202fAM",
  ],
  [
    [0, 16, 0, 1, 0, 0],
    [1, 16, 0, 2, 0, 0],
    [2, 16, 0, 3, 0, 0],
    [3, 16, 0, 4, 0, 0],
    [4, 16, 0, 5, 1, 0],
    [5, 16, 0, 6, 1, 0],
    [6, 16, 0, 0, 0, 0],
  ],
);
assertPlacesHours(
  "orkt-al-hamra",
  [
    "Monday: 7:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Tuesday: 7:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Wednesday: 7:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Thursday: 7:00\u202fAM\u2009\u2013\u200912:00\u202fAM",
    "Friday: 1:00\u202fPM\u2009\u2013\u20092:00\u202fAM",
    "Saturday: 1:00\u202fPM\u2009\u2013\u20092:00\u202fAM",
    "Sunday: 7:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
  ],
  [
    [0, 7, 0, 1, 1, 0],
    [1, 7, 0, 2, 1, 0],
    [2, 7, 0, 3, 1, 0],
    [3, 7, 0, 4, 1, 0],
    [4, 7, 0, 5, 0, 0],
    [5, 13, 0, 6, 2, 0],
    [6, 13, 0, 0, 2, 0],
  ],
);
assertPlacesHours(
  "rex-al-arid",
  [
    "Monday: 6:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Tuesday: 6:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Wednesday: 6:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Thursday: 6:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Friday: 12:00\u202fPM\u2009\u2013\u20091:00\u202fAM",
    "Saturday: 8:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Sunday: 6:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
  ],
  [
    [0, 6, 0, 1, 1, 0],
    [1, 6, 0, 2, 1, 0],
    [2, 6, 0, 3, 1, 0],
    [3, 6, 0, 4, 1, 0],
    [4, 6, 0, 5, 1, 0],
    [5, 12, 0, 6, 1, 0],
    [6, 8, 0, 0, 1, 0],
  ],
);
assertPlacesHours(
  "veo-hittin",
  [
    "Monday: 6:00\u202fAM\u2009\u2013\u20092:00\u202fAM",
    "Tuesday: 6:00\u202fAM\u2009\u2013\u20092:00\u202fAM",
    "Wednesday: 6:00\u202fAM\u2009\u2013\u20092:00\u202fAM",
    "Thursday: 6:00\u202fAM\u2009\u2013\u20092:00\u202fAM",
    "Friday: 12:30\u202fPM\u2009\u2013\u20092:00\u202fAM",
    "Saturday: 6:00\u202fAM\u2009\u2013\u20092:00\u202fAM",
    "Sunday: 6:00\u202fAM\u2009\u2013\u20092:00\u202fAM",
  ],
  [
    [0, 6, 0, 1, 2, 0],
    [1, 6, 0, 2, 2, 0],
    [2, 6, 0, 3, 2, 0],
    [3, 6, 0, 4, 2, 0],
    [4, 6, 0, 5, 2, 0],
    [5, 12, 30, 6, 2, 0],
    [6, 6, 0, 0, 2, 0],
  ],
);
assertPlacesHours(
  "essert-al-arid",
  [
    "Monday: 6:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Tuesday: 6:00\u202fAM\u2009\u2013\u200912:30\u202fAM",
    "Wednesday: 6:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Thursday: 6:00\u202fAM\u2009\u2013\u20092:00\u202fAM",
    "Friday: 8:00\u202fAM\u2009\u2013\u20092:00\u202fAM",
    "Saturday: 6:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Sunday: 6:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
  ],
  [
    [0, 6, 0, 1, 1, 0],
    [1, 6, 0, 2, 1, 0],
    [2, 6, 0, 3, 0, 30],
    [3, 6, 0, 4, 1, 0],
    [4, 6, 0, 5, 2, 0],
    [5, 8, 0, 6, 2, 0],
    [6, 6, 0, 0, 1, 0],
  ],
);
assertPlacesHours(
  "otto-al-muruj",
  [
    "Monday: 4:00\u2009\u2013\u200911:00\u202fPM",
    "Tuesday: 4:00\u2009\u2013\u200911:00\u202fPM",
    "Wednesday: 4:00\u2009\u2013\u200911:00\u202fPM",
    "Thursday: 4:00\u2009\u2013\u200911:00\u202fPM",
    "Friday: 12:30\u2009\u2013\u200911:30\u202fPM",
    "Saturday: 4:00\u2009\u2013\u200911:00\u202fPM",
    "Sunday: 4:00\u2009\u2013\u200911:00\u202fPM",
  ],
  [
    [0, 16, 0, 0, 23, 0],
    [1, 16, 0, 1, 23, 0],
    [2, 16, 0, 2, 23, 0],
    [3, 16, 0, 3, 23, 0],
    [4, 16, 0, 4, 23, 0],
    [5, 12, 30, 5, 23, 30],
    [6, 16, 0, 6, 23, 0],
  ],
);
assertPlacesHours(
  "behind-al-muruj",
  [
    "Monday: 1:00\u2009\u2013\u200911:00\u202fPM",
    "Tuesday: 1:00\u2009\u2013\u200911:00\u202fPM",
    "Wednesday: 1:00\u2009\u2013\u200911:00\u202fPM",
    "Thursday: 1:00\u2009\u2013\u200911:00\u202fPM",
    "Friday: 1:00\u2009\u2013\u200911:00\u202fPM",
    "Saturday: 1:00\u2009\u2013\u200911:00\u202fPM",
    "Sunday: 1:00\u2009\u2013\u200911:00\u202fPM",
  ],
  [
    [0, 13, 0, 0, 23, 0],
    [1, 13, 0, 1, 23, 0],
    [2, 13, 0, 2, 23, 0],
    [3, 13, 0, 3, 23, 0],
    [4, 13, 0, 4, 23, 0],
    [5, 13, 0, 5, 23, 0],
    [6, 13, 0, 6, 23, 0],
  ],
);
assertPlacesHours(
  "shubak-al-bun-badr",
  [
    "Monday: 2:00\u202fPM\u2009\u2013\u20092:00\u202fAM",
    "Tuesday: 2:00\u202fPM\u2009\u2013\u20092:00\u202fAM",
    "Wednesday: 2:00\u202fPM\u2009\u2013\u20092:00\u202fAM",
    "Thursday: 2:00\u202fPM\u2009\u2013\u200912:00\u202fAM",
    "Friday: 2:00\u202fPM\u2009\u2013\u20092:00\u202fAM",
    "Saturday: 2:00\u202fPM\u2009\u2013\u200912:00\u202fAM",
    "Sunday: 2:00\u202fPM\u2009\u2013\u20092:00\u202fAM",
  ],
  [
    [0, 14, 0, 1, 2, 0],
    [1, 14, 0, 2, 2, 0],
    [2, 14, 0, 3, 2, 0],
    [3, 14, 0, 4, 2, 0],
    [4, 14, 0, 5, 0, 0],
    [5, 14, 0, 6, 2, 0],
    [6, 14, 0, 0, 0, 0],
  ],
);
assertPlacesHours(
  "abeille-al-narjis",
  [
    "Monday: 8:00\u202fAM\u2009\u2013\u200912:00\u202fAM",
    "Tuesday: 8:00\u202fAM\u2009\u2013\u200912:00\u202fAM",
    "Wednesday: 8:00\u202fAM\u2009\u2013\u200912:00\u202fAM",
    "Thursday: 8:00\u202fAM\u2009\u2013\u200912:00\u202fAM",
    "Friday: 12:00\u202fPM\u2009\u2013\u200912:00\u202fAM",
    "Saturday: 8:00\u202fAM\u2009\u2013\u200912:00\u202fAM",
    "Sunday: 8:00\u202fAM\u2009\u2013\u200912:00\u202fAM",
  ],
  [
    [0, 8, 0, 1, 0, 0],
    [1, 8, 0, 2, 0, 0],
    [2, 8, 0, 3, 0, 0],
    [3, 8, 0, 4, 0, 0],
    [4, 8, 0, 5, 0, 0],
    [5, 12, 0, 6, 0, 0],
    [6, 8, 0, 0, 0, 0],
  ],
);
assertPlacesHours(
  "way-coffee-dhahrat-al-badiah",
  [
    "Monday: 6:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Tuesday: 6:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Wednesday: 6:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Thursday: 6:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Friday: 1:00\u202fPM\u2009\u2013\u20091:00\u202fAM",
    "Saturday: 6:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
    "Sunday: 6:00\u202fAM\u2009\u2013\u20091:00\u202fAM",
  ],
  [
    [0, 6, 0, 1, 1, 0],
    [1, 6, 0, 2, 1, 0],
    [2, 6, 0, 3, 1, 0],
    [3, 6, 0, 4, 1, 0],
    [4, 6, 0, 5, 1, 0],
    [5, 13, 0, 6, 1, 0],
    [6, 6, 0, 0, 1, 0],
  ],
);

const canonicalNames: Record<string, { nameEn: string; nameAr: string }> = {
  "bacha-coffee-solitaire": {
    nameEn: "Bacha Coffee Solitaire Mall",
    nameAr: "باشا",
  },
  "mood-masters-al-falah": {
    nameEn: "Mood Masters",
    nameAr: "محمصة ومقهى مود ماسترز للقهوة المختصة",
  },
  "las-cafe-al-malqa": { nameEn: "LAS CAFE", nameAr: "لاس كافيه" },
  "las-cafe-al-olaya": { nameEn: "LAS CAFE Olaya", nameAr: "لاس كافيه" },
  "little-henri-al-muruj": { nameEn: "Little Henri", nameAr: "ليتل هنري" },
  "beitkull-al-olaya": { nameEn: "Beitkull", nameAr: "قهوة بيت كُلْ" },
  "satr-specialty-coffee-al-mughrizat": {
    nameEn: "Satr Specialty Coffee",
    nameAr: "سَطر | قهوة مختصة",
  },
  "covo-artisan-coffee-al-mughrizat": {
    nameEn: "COVO Artisan Coffee",
    nameAr: "كوفو",
  },
  "bunatetu-al-mughrizat": { nameEn: "BUNATETU", nameAr: "بوناتيتو" },
  "dune-coffee-al-mughrizat": { nameEn: "Dune Coffee", nameAr: "كافي دون" },
  "tuxedo-coffee-al-mughrizat": { nameEn: "TUXEDO Coffee", nameAr: "توكسيدو كوفي" },
  "bar-coffee-al-mughrizat": { nameEn: "Bar Coffee", nameAr: "بار كافيه" },
  "adab-cafe-al-mughrizat": { nameEn: "ADAB Cafe", nameAr: "مقهى أدب" },
  "booze-specialty-coffee-bar-al-mughrizat": {
    nameEn: "Booze Specialty Coffee Bar",
    nameAr: "بوز",
  },
  "latch-al-mughrizat": { nameEn: "LATCH", nameAr: "لاتش" },
  "slant-specialty-coffee-al-izdihar": {
    nameEn: "Slant Specialty Coffee",
    nameAr: "سلانت قهوة مختصة",
  },
  "gedeb-al-olaya": { nameEn: "Gedeb", nameAr: "قيدب" },
  "bossco-roastery-al-olaya": { nameEn: "BOSS.CO Roastery", nameAr: "مقهى ومحمصة بوسكو" },
  "lluvia-caffe-al-olaya": { nameEn: "lluvia Caffe", nameAr: "يوڤيا كافيه" },
  "oromiffa-al-olaya": { nameEn: "Oromiffa", nameAr: "أورميفا" },
  "buljah-al-olaya": { nameEn: "Buljah", nameAr: "بُلجة" },
  "19-gram-al-olaya": { nameEn: "19 Gram", nameAr: "١٩ جرام" },
  "kulma-speciality-coffee-al-olaya": { nameEn: "KULMA Speciality Coffee", nameAr: "مقهى كولما" },
  "morfi-al-olaya": { nameEn: "MORFi", nameAr: "مورفي قهوة مختصة" },
  "jolt-al-olaya": { nameEn: "JOLT", nameAr: "جولت" },
  "key-cafe-al-olaya": { nameEn: "Key Cafe", nameAr: "كي" },
  "alwaal-albari-al-olaya": { nameEn: "Alwaal Albari", nameAr: "الوعل البري" },
  "crops-al-narjis": { nameEn: "Crops", nameAr: "كروبس" },
  "bala-al-rawabi": { nameEn: "Bala", nameAr: "بلة" },
  "ract-al-qirawan": { nameEn: "RACT", nameAr: "راكت" },
  "orkt-al-hamra": { nameEn: "ORKT", nameAr: "أوركت" },
  "rex-al-arid": { nameEn: "Rex", nameAr: "ريكس" },
  "veo-hittin": { nameEn: "VEO Coffee", nameAr: "فيو" },
  "essert-al-arid": { nameEn: "Essert", nameAr: "ايزرت" },
  "otto-al-muruj": { nameEn: "otto Speciality Coffee & Roastery", nameAr: "otto" },
  "behind-al-muruj": { nameEn: "Behind", nameAr: "بيهايند" },
  "shubak-al-bun-badr": { nameEn: "Shubak Al Bun", nameAr: "شباك البن" },
  "hearth-al-arid": { nameEn: "HEARTH Café", nameAr: "هيرث" },
  "abeille-al-narjis": { nameEn: "Abeille cafe", nameAr: "أبيي كافيه" },
  "way-coffee-dhahrat-al-badiah": { nameEn: "WAY Coffee & Bakery", nameAr: "وي كافية" },
  "kava-al-rabi": { nameEn: "KAVA", nameAr: "KAVA" },
  "sociable-al-rabi": { nameEn: "Sociable", nameAr: "سوشبيل" },
  "orne-cafe-al-rabi": { nameEn: "Ornè Cafè", nameAr: "اورن كافيه" },
  "atea-al-rabi": { nameEn: "ATEA", nameAr: "آتِ" },
  "arco-al-rabi": { nameEn: "Arco", nameAr: "اركو" },
  "diplab-al-rabi": { nameEn: "diplab cafe", nameAr: "ديب لاب كافيه" },
  "and-coffee-al-rabi": { nameEn: "& Coffee", nameAr: "كوفي اند" },
  "wacafe-al-rabi": { nameEn: "Wacafe", nameAr: "وكف" },
  "3bean-al-rabi": { nameEn: "3bean Coffee Roastery", nameAr: "محمصة ثري بين" },
  "waqar-al-aziziyah": { nameEn: "Waqar", nameAr: "وقار" },
};
for (const [id, names] of Object.entries(canonicalNames)) {
  const shop = getShop(id);
  assert(shop?.nameEn === names.nameEn, `${id} canonical nameEn`);
  assert(shop?.nameAr === names.nameAr, `${id} canonical nameAr`);
}
/** Ar Rabi Scout-10: weekly hours are the Places API regularOpeningHours bake (1 Oct 2026), never hand-filled. */
for (const id of [
  "kava-al-rabi",
  "sociable-al-rabi",
  "orne-cafe-al-rabi",
  "atea-al-rabi",
  "arco-al-rabi",
  "diplab-al-rabi",
  "and-coffee-al-rabi",
  "wacafe-al-rabi",
  "3bean-al-rabi",
]) {
  const hours = getShop(id)?.openingHours;
  assert(
    hours?.weekdayDescriptions?.length === 7 && (hours.periods?.length ?? 0) > 0,
    `${id} carries the Places weekly hours`,
  );
}
/** Waqar (Al Aziziyah): weekly hours are the Places API regularOpeningHours bake (2 Oct 2026), never Scout's guess. */
{
  const hours = getShop("waqar-al-aziziyah")?.openingHours;
  assert(
    hours?.weekdayDescriptions?.length === 7 && hours.periods?.length === 7,
    "waqar-al-aziziyah carries the 7-day Places weekly hours",
  );
  assert(
    hours?.weekdayDescriptions?.[4] === "Friday: 12:30\u202fPM\u2009\u2013\u20092:00\u202fAM",
    "waqar-al-aziziyah Friday row is the Places row",
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
assert(
  sitemap.includes("/coffee-shops/as-suwaidi<") &&
    sitemap.includes("/en/coffee-shops/as-suwaidi<"),
  "sitemap lists as-suwaidi now that Alwaal Albari is live",
);
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
const rankedCatalog = rankByPopularity(listDiscoveryShops());
assert(
  popularShops.length === listDiscoveryShops().length,
  "popular directory lists the specialty discovery catalog",
);
assert(
  popularShops.map((shop) => shop.id).join(",") ===
    rankedCatalog.map((shop) => shop.id).join(","),
  "popular directory follows popularityIndex DESC",
);
// 21 Oct 2026: Namq is a chain (Amjad via Ajz), so it leaves Most Popular; Urth leads and Woods Olaya enters the top 3.
assert(
  popularShops[0]?.id === "urth-caffe-tahlia-sulimaniyah" && !popularShops.some((shop) => shop.id.startsWith("namq-")),
  "popular directory lead is urth-caffe-tahlia-sulimaniyah (no Namq chain rows)",
);
assert(
  popularShops.slice(0, 3).map((shop) => shop.id).join(",") ===
    "urth-caffe-tahlia-sulimaniyah,breehant-al-yasmin,woods-olaya",
  "popular directory top 3 (PR #97 lock minus the Namq chain)",
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
  sitemap.includes("https://wain.lol/coffee-shops/with-friends<"),
  "sitemap missing AR with-friends",
);
assert(
  sitemap.includes("https://wain.lol/en/coffee-shops/with-friends<"),
  "sitemap missing EN with-friends",
);
assert(
  sitemap.includes("https://wain.lol/coffee-shops/matcha<"),
  "sitemap missing AR matcha",
);
assert(
  sitemap.includes("https://wain.lol/en/coffee-shops/matcha<"),
  "sitemap missing EN matcha",
);
assert(
  sitemap.includes("https://wain.lol/coffee-shops/drive-through<"),
  "sitemap missing AR drive-through",
);
assert(
  sitemap.includes("https://wain.lol/en/coffee-shops/drive-through<"),
  "sitemap missing EN drive-through",
);
assert(
  sitemap.includes("https://wain.lol/halfway<"),
  "sitemap missing AR /halfway",
);
assert(
  sitemap.includes("https://wain.lol/en/halfway<"),
  "sitemap missing EN /halfway",
);
assert(
  !sitemap.includes("/h/") && !sitemap.includes("/en/h/"),
  "sitemap must not list invite session /h/{id} URLs",
);
assert(
  !sitemap.includes("good-for-a-date") &&
    !sitemap.includes("/coffee-shops/for-two") &&
    !sitemap.includes("soft-places"),
  "sitemap excludes dating and Soft Places slugs",
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
    "isStaticDirectoryChip",
  ),
  "chat must not post Most Popular or Matcha to /api/chat",
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
  "بيننا is a utility card under the category grid",
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
  ).includes("{district || popular || vibe ? ("),
  "home drops the old district wrap",
);
assert(
  homeLanding.includes(': "popular"') &&
    homeLanding.includes("selectedChipId={pageChipId}"),
  "most-popular landing selects the popular vibe chip",
);
assert(
  homeLanding.includes("chipDirectoryMoment") &&
    homeLanding.includes("moment={chipMoment}"),
  "chip share URLs filter the directory by moment tag",
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
  filterPutsDirectoryFirst(null, null, "matcha"),
  "Matcha chip puts the tagged list above New this week",
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

const arDistrictRoute = readFileSync(
  join(process.cwd(), "app/[category]/[slug]/page.tsx"),
  "utf8",
);
const enDistrictRoute = readFileSync(
  join(process.cwd(), "app/en/[category]/[slug]/page.tsx"),
  "utf8",
);
assert(
  arDistrictRoute.includes("DistrictPage") &&
    arDistrictRoute.includes("<DistrictPage language=\"ar\" district={district} />"),
  "AR coffee-shops/{slug} uses DistrictPage",
);
assert(
  enDistrictRoute.includes("DistrictPage") &&
    enDistrictRoute.includes("<DistrictPage language=\"en\" district={district} />"),
  "EN coffee-shops/{slug} uses DistrictPage",
);
assert(
  !homeLanding.includes("district") && !homeLanding.includes("DistrictEnBody"),
  "HomeLanding is no longer the district template",
);

console.log(`check-district-urls: ok (${areas.length} districts)`);
