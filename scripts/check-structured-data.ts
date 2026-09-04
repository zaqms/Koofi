import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  filterDirectoryShops,
  getShop,
  listDirectoryShops,
  listRealShops,
} from "../lib/catalog";
import { districtPath } from "../lib/product";
import { buildSitemapXml } from "../lib/sitemap-xml";
import {
  buildLlmsTxt,
  districtItemListJsonLd,
  jsonHasForbiddenPublicFields,
  listPublicShops,
  PUBLIC_SHOPS_API_PATH,
  publicShopPayload,
  publicShopRecord,
  publicShopsInDistrict,
  publicShopsItemList,
  shopJsonLd,
} from "../lib/structured-data";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function readRepo(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const shops = listPublicShops();
assert(shops.length === listRealShops().length, "public list is real shops only");
assert(shops.length > 0, "catalog is not empty");

const sample = getShop("ik-coffee-downtown");
assert(sample, "ik-coffee-downtown is in the catalog");

const arLd = shopJsonLd(sample, "ar");
assert(arLd["@context"] === "https://schema.org", "JSON-LD has @context");
assert(arLd["@type"] === "CafeOrCoffeeShop", "JSON-LD type is CafeOrCoffeeShop");
assert(arLd.name === sample.nameAr, "AR JSON-LD name is nameAr");
assert(arLd.url === `https://wain.lol/c/${sample.id}`, "AR canonical card URL");
assert(arLd.address.addressLocality === sample.neighborhoodAr, "AR locality");
assert(arLd.address.addressCountry === "SA", "country is SA");
assert(arLd.sameAs?.[0] === sample.mapsShareUrl, "sameAs is maps URL");
assert(arLd.hasMap === sample.mapsShareUrl, "hasMap is maps URL");
assert(arLd.geo?.latitude === sample.pin?.lat, "geo lat from official pin");
assert(arLd.geo?.longitude === sample.pin?.lng, "geo lng from official pin");
assert(!("hours" in arLd), "JSON-LD has no hours");
assert(!("image" in arLd), "JSON-LD has no image");

const enLd = shopJsonLd(sample, "en");
assert(enLd.name === sample.nameEn, "EN JSON-LD name is nameEn");
assert(enLd.url === `https://wain.lol/en/c/${sample.id}`, "EN card URL");
assert(enLd.address.addressLocality === "Olaya", "EN locality");

const apiShop = publicShopPayload(sample.id);
assert(apiShop, "API payload exists");
assert(apiShop.identifier === sample.id, "API identifier");
assert(apiShop.nameAr === sample.nameAr, "API nameAr");
assert(apiShop.nameEn === sample.nameEn, "API nameEn");
assert(apiShop.neighborhood === "olaya", "API neighborhood slug");
assert(apiShop.url === `https://wain.lol/c/${sample.id}`, "API canonical url");
assert(apiShop.urlEn === `https://wain.lol/en/c/${sample.id}`, "API urlEn");
assert(publicShopPayload("not-a-shop") === null, "unknown id is null");

const list = publicShopsItemList();
assert(list["@type"] === "ItemList", "catalog API is ItemList");
assert(list.numberOfItems === shops.length, "ItemList count matches");
assert(list.url === "https://wain.lol/api/shops", "catalog API url");
assert(
  list.itemListElement[0]?.item &&
    "identifier" in list.itemListElement[0].item,
  "list items are public shop records",
);

const malqaShops = publicShopsInDistrict("al-malqa");
const directoryMalqa = filterDirectoryShops(listDirectoryShops(), "al-malqa");
assert(malqaShops.length === directoryMalqa.length, "district filter matches directory");
assert(malqaShops.length > 0, "al-malqa has shops");

const districtAr = districtItemListJsonLd("al-malqa", "ar");
assert(districtAr["@type"] === "ItemList", "district JSON-LD is ItemList");
assert(
  districtAr.url === `https://wain.lol${districtPath("al-malqa", "ar")}`,
  "district AR url",
);
assert(districtAr.numberOfItems === malqaShops.length, "district count");
assert(
  districtAr.itemListElement.every((row) => row.item["@type"] === "CafeOrCoffeeShop"),
  "district items are CafeOrCoffeeShop",
);

const districtEn = districtItemListJsonLd("al-malqa", "en");
assert(
  districtEn.url === "https://wain.lol/en/coffee-shops/al-malqa",
  "district EN url",
);

for (const payload of [arLd, enLd, apiShop, list, districtAr, districtEn]) {
  const forbidden = jsonHasForbiddenPublicFields(payload);
  assert(
    forbidden.length === 0,
    `forbidden public fields: ${forbidden.join(", ")}`,
  );
  const text = JSON.stringify(payload);
  assert(!/Koofi/i.test(text), "public payload must not say Koofi");
  assert(!/"votes"/.test(text), "public payload must omit votes");
}

const noGeoShop = shops.find((shop) => !publicShopRecord(shop).geo);
if (noGeoShop) {
  const record = publicShopRecord(noGeoShop);
  assert(!("geo" in record), `${noGeoShop.id} must omit geo when coords are missing`);
}

const llms = buildLlmsTxt();
assert(llms.includes("https://wain.lol/api/shops"), "llms.txt points at /api/shops");
assert(llms.includes("/c/{id}"), "llms.txt mentions cafe cards");
assert(!/Koofi/i.test(llms), "llms.txt must not say Koofi");
assert(llms.includes("Not included: hours"), "llms.txt states omitted fields");

const sitemap = buildSitemapXml("2026-09-04");
assert(sitemap.includes("https://wain.lol/llms.txt<"), "sitemap lists /llms.txt");
assert(
  sitemap.includes(`https://wain.lol/c/${sample.id}<`),
  "sitemap still lists card URLs",
);
assert(
  sitemap.includes("https://wain.lol/coffee-shops/al-malqa<"),
  "sitemap still lists district URLs",
);
assert(!sitemap.includes("/n/"), "sitemap must not revive /n/");
assert(!/Koofi/i.test(sitemap), "sitemap must not say Koofi");

const robots = readRepo("app/robots.ts");
assert(robots.includes('"/api/shops"'), "robots allows /api/shops");
assert(robots.includes('disallow: "/api/"'), "robots still disallows other /api/");

const cafeCard = readRepo("components/cafe-card.tsx");
assert(
  !cafeCard.includes("application/ld+json"),
  "cafe-card.tsx stays visual-only",
);
assert(
  !readRepo("components/cafe-card-page.tsx").includes("application/ld+json"),
  "cafe-card-page.tsx stays visual-only",
);

const cardPage = readRepo("app/c/[id]/page.tsx");
assert(cardPage.includes("shopJsonLd"), "AR card page injects JSON-LD");
assert(
  readRepo("app/en/c/[id]/page.tsx").includes("shopJsonLd"),
  "EN card page injects JSON-LD",
);
assert(
  readRepo("app/[category]/[slug]/page.tsx").includes("districtItemListJsonLd"),
  "AR district page injects ItemList",
);
assert(
  readRepo("app/en/[category]/[slug]/page.tsx").includes("districtItemListJsonLd"),
  "EN district page injects ItemList",
);
assert(
  readRepo("app/api/shops/route.ts").includes("Access-Control-Allow-Origin") ||
    readRepo("lib/structured-data.ts").includes("Access-Control-Allow-Origin"),
  "CORS is open",
);
assert(
  PUBLIC_SHOPS_API_PATH === "/api/shops",
  "public API path stays /api/shops",
);

console.log(
  `check-structured-data: ok (${shops.length} shops, sample ${sample.id})`,
);
