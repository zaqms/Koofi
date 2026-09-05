import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  filterDirectoryShops,
  getShop,
  listDirectoryShops,
  listRealShops,
} from "../lib/catalog";
import {
  aboutFaqJsonLd,
  aboutFaqs,
  districtFaqJsonLd,
  districtFaqs,
  faqPageJsonLd,
} from "../lib/faq";
import { districtPath } from "../lib/product";
import { buildSitemapXml } from "../lib/sitemap-xml";
import {
  buildLlmsTxt,
  districtItemListJsonLd,
  jsonHasForbiddenPublicFields,
  listPublicShops,
  PUBLIC_MCP_ALIAS_PATH,
  PUBLIC_MCP_PATH,
  PUBLIC_SHOPS_API_PATH,
  publicMcpUrl,
  publicShopPayload,
  publicShopRecord,
  publicShopsApiUrl,
  publicShopsInDistrict,
  publicShopsItemList,
  shopJsonLd,
  websiteJsonLd,
} from "../lib/structured-data";
import {
  fetchShopDocument,
  listPublicDistrictSummaries,
  publicDistrictCatalog,
  searchPublicShops,
  searchShopResults,
} from "../lib/mcp-catalog";

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
assert(llms.includes("https://wain.lol/api/mcp"), "llms.txt points at MCP");
assert(llms.includes("/c/{id}"), "llms.txt mentions cafe cards");
assert(!/Koofi/i.test(llms), "llms.txt must not say Koofi");
assert(llms.includes("Not included: hours"), "llms.txt states omitted fields");
assert(
  !llms.includes("not hosted yet"),
  "llms.txt must not say MCP is unhosted",
);

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
assert(robots.includes('"/api/mcp"'), "robots allows /api/mcp");
assert(robots.includes('"/mcp"'), "robots allows /mcp");
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
assert(PUBLIC_MCP_PATH === "/api/mcp", "MCP path is /api/mcp");
assert(PUBLIC_MCP_ALIAS_PATH === "/mcp", "MCP alias is /mcp");
assert(publicMcpUrl() === "https://wain.lol/api/mcp", "canonical MCP URL");

const malqaSearch = searchPublicShops("الملقا");
assert(malqaSearch.length === malqaShops.length, "search الملقا matches district list");
assert(
  malqaSearch.every((shop) => shop.neighborhood === "al-malqa"),
  "search الملقا is al-malqa only",
);
assert(
  malqaSearch.map((shop) => shop.id).join(",") ===
    malqaShops.map((shop) => shop.id).join(","),
  "search keeps directory order",
);

const nameSearch = searchShopResults("IK coffee Downtown");
assert(nameSearch.results.some((row) => row.id === sample.id), "search finds shop name");
assert(
  nameSearch.results[0] && nameSearch.results.every((row) => row.url.startsWith("https://wain.lol/c/")),
  "search urls are wain.lol cards",
);
assert(searchPublicShops("").length === shops.length, "empty search is the full catalog");
assert(
  searchPublicShops("")[0]?.id === shops[0]?.id,
  "empty search keeps directory order",
);

const fetched = fetchShopDocument(sample.id);
assert(fetched, "fetch returns a document");
assert(fetched.id === sample.id, "fetch id");
assert(fetched.url === `https://wain.lol/c/${sample.id}`, "fetch cites card URL");
assert(
  fetched.text === JSON.stringify(publicShopPayload(sample.id)),
  "fetch text is GET /api/shops/{id}",
);
assert(fetchShopDocument("not-a-shop") === null, "fetch unknown id is null");

const districtList = publicDistrictCatalog("al-malqa");
assert(districtList.numberOfItems === malqaShops.length, "district catalog count");
assert(
  districtList.itemListElement.every((row) => row.item["@type"] === "CafeOrCoffeeShop"),
  "district catalog items are CafeOrCoffeeShop",
);
assert(
  JSON.stringify(districtList.itemListElement[0]?.item) ===
    JSON.stringify(publicShopRecord(malqaShops[0], { includeContext: false })),
  "district catalog uses the same shop records as /api/shops",
);

const summaries = listPublicDistrictSummaries();
assert(summaries.some((row) => row.id === "al-malqa"), "district summaries include al-malqa");
assert(
  summaries.find((row) => row.id === "al-malqa")?.numberOfItems === malqaShops.length,
  "district summary count",
);

for (const payload of [nameSearch, fetched, districtList, { districts: summaries }]) {
  const forbidden = jsonHasForbiddenPublicFields(payload);
  assert(forbidden.length === 0, `MCP forbidden fields: ${forbidden.join(", ")}`);
  const text = JSON.stringify(payload);
  assert(!/Koofi/i.test(text), "MCP payload must not say Koofi");
}

assert(
  readRepo("app/api/mcp/route.ts").includes("handlePublicMcp"),
  "MCP is mounted at /api/mcp",
);
assert(readRepo("app/mcp/route.ts").includes("handlePublicMcp"), "MCP alias at /mcp");
assert(
  publicShopsApiUrl() === "https://wain.lol/api/shops",
  "MCP resources point at the public shops API",
);

const aboutAr = aboutFaqs("ar");
const aboutEn = aboutFaqs("en");
assert(aboutAr.length >= 4 && aboutAr.length <= 6, "About AR has 4–6 FAQs");
assert(aboutEn.length === aboutAr.length, "About EN matches AR count");
assert(
  aboutAr.some((item) => item.q.includes("wain.lol")),
  "About AR names wain.lol",
);
assert(
  aboutEn.some((item) => item.q.includes("wain.lol")),
  "About EN names wain.lol",
);
assert(
  aboutAr.some((item) => item.a.includes("ثلاث") && item.a.includes("خريطة")),
  "About AR covers three picks + Maps",
);
assert(
  aboutEn.some((item) => /three/i.test(item.a) && /Maps/i.test(item.a)),
  "About EN covers three picks + Maps",
);
assert(
  aboutAr.some((item) => item.a.includes("الرياض بس")),
  "About AR says Riyadh only",
);
assert(
  aboutAr.some((item) => item.a.includes("قوقل ماب")),
  "About AR covers Maps add-shop",
);
assert(
  aboutAr.some((item) => item.a.includes("مو توصيل") && item.a.includes("مو سوق")),
  "About AR says no delivery/marketplace",
);

const aboutLdAr = aboutFaqJsonLd("ar");
assert(aboutLdAr["@type"] === "FAQPage", "About JSON-LD is FAQPage");
assert(aboutLdAr.url === "https://wain.lol/about", "About AR FAQ url");
assert(
  aboutLdAr.mainEntity.length === aboutAr.length,
  "FAQPage count matches visible About AR",
);
for (const [index, item] of aboutAr.entries()) {
  const entity = aboutLdAr.mainEntity[index];
  assert(entity?.name === item.q, `About AR JSON-LD Q${index} matches visible`);
  assert(
    entity?.acceptedAnswer.text === item.a,
    `About AR JSON-LD A${index} matches visible`,
  );
}

const aboutLdEn = aboutFaqJsonLd("en");
assert(aboutLdEn.url === "https://wain.lol/en/about", "About EN FAQ url");
for (const [index, item] of aboutEn.entries()) {
  const entity = aboutLdEn.mainEntity[index];
  assert(entity?.name === item.q, `About EN JSON-LD Q${index} matches visible`);
  assert(
    entity?.acceptedAnswer.text === item.a,
    `About EN JSON-LD A${index} matches visible`,
  );
}

const malqaFaqAr = districtFaqs("al-malqa", "ar");
const malqaFaqEn = districtFaqs("al-malqa", "en");
assert(malqaFaqAr.length >= 1 && malqaFaqAr.length <= 2, "district FAQ is 1–2");
assert(malqaFaqAr[0]?.q === "قهوة في الملقا؟", "district AR Q names الملقا");
assert(
  malqaFaqAr[0]?.a.includes("هذي القائمة"),
  "district AR A points at this list",
);
assert(malqaFaqEn[0]?.q === "Coffee in Al Malqa?", "district EN Q names Al Malqa");
assert(
  malqaFaqEn[0]?.a.includes("curated list"),
  "district EN A points at this list",
);

const districtFaqLd = districtFaqJsonLd("al-malqa", "ar");
assert(districtFaqLd["@type"] === "FAQPage", "district FAQ JSON-LD is FAQPage");
assert(
  districtFaqLd.mainEntity[0]?.name === malqaFaqAr[0]?.q,
  "district FAQ JSON-LD matches visible Q",
);
assert(
  districtFaqLd.mainEntity[0]?.acceptedAnswer.text === malqaFaqAr[0]?.a,
  "district FAQ JSON-LD matches visible A",
);

const rebuilt = faqPageJsonLd(aboutAr, "https://wain.lol/about");
assert(
  JSON.stringify(rebuilt) === JSON.stringify(aboutLdAr),
  "aboutFaqJsonLd is faqPageJsonLd(aboutFaqs)",
);

for (const payload of [aboutLdAr, aboutLdEn, districtFaqLd]) {
  const forbidden = jsonHasForbiddenPublicFields(payload);
  assert(forbidden.length === 0, `FAQ forbidden fields: ${forbidden.join(", ")}`);
  const text = JSON.stringify(payload);
  assert(!/Koofi/i.test(text), "FAQ must not say Koofi");
  assert(!/best of|أفضل قهاوي/i.test(text), "FAQ must not claim best-of");
  assert(!/ساعات|hours|تقييم|rating/i.test(text), "FAQ must not invent hours/ratings");
}

const aboutView = readRepo("components/about-page.tsx");
assert(aboutView.includes("aboutFaqs("), "About page renders visible FAQs");
assert(aboutView.includes("FaqList"), "About page uses FaqList");
assert(
  readRepo("app/about/page.tsx").includes("aboutFaqJsonLd"),
  "AR About injects FAQPage JSON-LD",
);
assert(
  readRepo("app/en/about/page.tsx").includes("aboutFaqJsonLd"),
  "EN About injects FAQPage JSON-LD",
);
const shopDirectory = readRepo("components/shop-directory.tsx");
assert(
  shopDirectory.includes("directoryHint"),
  "district page keeps directoryHint",
);
assert(
  !shopDirectory.includes("districtFaqs("),
  "district page does not render district FAQs",
);
assert(
  !shopDirectory.includes("FaqList"),
  "district page does not render FaqList",
);
assert(
  !readRepo("app/[category]/[slug]/page.tsx").includes("districtFaqJsonLd"),
  "AR district page does not inject FAQPage JSON-LD",
);
assert(
  !readRepo("app/en/[category]/[slug]/page.tsx").includes("districtFaqJsonLd"),
  "EN district page does not inject FAQPage JSON-LD",
);
assert(
  llms.includes("/about"),
  "llms.txt mentions About",
);
assert(llms.includes("search"), "llms.txt names MCP search");

const siteAr = websiteJsonLd("ar");
assert(siteAr["@type"] === "WebSite", "home JSON-LD is WebSite");
assert(siteAr.name === "wain.lol", "WebSite name is wain.lol");
assert(siteAr.url === "https://wain.lol", "WebSite url is https://wain.lol");
assert(siteAr.inLanguage === "ar-SA", "AR home inLanguage is ar-SA");
assert(siteAr.publisher["@type"] === "Organization", "publisher is Organization");
assert(siteAr.publisher.name === "wain.lol", "Organization name is wain.lol");
assert(siteAr.publisher.url === "https://wain.lol", "Organization url is https://wain.lol");
assert(
  siteAr.publisher.logo === "https://wain.lol/icon.png",
  "Organization logo is /icon.png",
);
assert(!("sameAs" in siteAr.publisher), "Organization sameAs is omitted");
assert(!("potentialAction" in siteAr), "no invented SearchAction");
assert(!/Koofi/i.test(JSON.stringify(siteAr)), "WebSite must not say Koofi");

const siteEn = websiteJsonLd("en");
assert(siteEn.inLanguage === "en", "EN home inLanguage is en");
assert(siteEn.url === "https://wain.lol", "EN WebSite url stays https://wain.lol");
assert(!("sameAs" in siteEn.publisher), "EN Organization sameAs is omitted");
assert(!("potentialAction" in siteEn), "EN has no invented SearchAction");

assert(
  readRepo("app/page.tsx").includes("websiteJsonLd"),
  "AR home injects WebSite JSON-LD",
);
assert(
  readRepo("app/en/page.tsx").includes("websiteJsonLd"),
  "EN home injects WebSite JSON-LD",
);
assert(
  llms.includes("WebSite"),
  "llms.txt mentions home WebSite JSON-LD",
);

console.log(
  `check-structured-data: ok (${shops.length} shops, sample ${sample.id}, ${aboutAr.length} about FAQs)`,
);
