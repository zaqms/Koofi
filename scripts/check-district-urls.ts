import { getShop, listDirectoryShops, listRealShops } from "../lib/catalog";
import { copy } from "../lib/copy";
import {
  districtDescription,
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
  categoryDistrictPath,
  districtPath,
  homePath,
  legacyDistrictPath,
  PRODUCT_NAME,
} from "../lib/product";
import { buildSitemapXml } from "../lib/sitemap-xml";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

assert(resolveDistrictSlug("ghirnatah") === "ghirnatah", "ghirnatah resolves");
assert(resolveDistrictSlug("al-shohda") === "al-shohda", "al-shohda resolves");
assert(resolveDistrictSlug("al-safa") === "al-safa", "al-safa resolves");
assert(resolveDistrictSlug("al-rawdah") === "al-rawdah", "al-rawdah resolves");
assert(resolveDistrictSlug("qurtubah") === "qurtubah", "qurtubah resolves");
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
assert(areas.length === 21, `expected 21 districts, got ${areas.length}`);
assert(listRealShops().length === 131, `catalog 119→131, got ${listRealShops().length}`);

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

const scoutPack: {
  id: string;
  hex: string;
  neighborhood: "al-safa" | "al-rabwah" | "al-rawdah" | "qurtubah";
  vibe: string[];
  moments: string[];
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
  if (row.id === "jazwa-specialty-coffee-ar-rabwah") {
    assert(
      shop.logoUrl === "/logos/jazwa-specialty-coffee-ar-rabwah.jpg",
      "jazwa uses Instagram @Jazwah.sa mark",
    );
  } else {
    assert(!("logoUrl" in shop), `${row.id} catalog has no logoUrl (letter tile)`);
  }
  assert(!("pin" in shop), `${row.id} catalog has no invented pin`);
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
  districtDescription("al-malqa", "ar") ===
    `مقاهي في ${malqaAr} · ${copy.directoryHint.ar}`,
  "AR description stays category phrase + directoryHint",
);
assert(
  districtDescription("ghirnatah", "en") ===
    `Coffee shops in ${ghirEn} · ${copy.directoryHint.en}`,
  "EN description stays category phrase + directoryHint",
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

console.log(`check-district-urls: ok (${areas.length} districts)`);
