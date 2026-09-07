import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getShop, listDirectoryShops, listRealShops } from "../lib/catalog";
import { listNewThisWeekShops, NEW_THIS_WEEK_IDS } from "../lib/new-this-week";
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
  listPopularDirectoryShops,
  mostPopularDescription,
  mostPopularMetadata,
  mostPopularTitle,
} from "../lib/most-popular";
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
assert(areas.length === 22, `expected 22 districts, got ${areas.length}`);
assert(listRealShops().length === 141, `catalog 131→141, got ${listRealShops().length}`);

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
  neighborhood: "al-safa" | "al-rabwah" | "al-rawdah" | "qurtubah" | "an-nazhah";
  vibe: string[];
  moments: string[];
  logoUrl?: string;
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
