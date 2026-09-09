import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cafePageMetadata } from "../lib/cafe-metadata";
import { getShop, listRealShops } from "../lib/catalog";
import { districtDescription, districtMetadata, districtTitle } from "../lib/district";
import {
  cafeEnMarkdown,
  cafeEnMeta,
  cafeEnTitle,
  cafeOgImagePath,
  CNI_PRIORITY_CAFE_IDS,
  DROPPED_SLOGANS,
  EN_CONTENT_DATE_MODIFIED,
  GATE_CAFE_ID,
  GATE_FORBIDDEN_CLAIMS,
  GOLD_MASTER_AL_WURUD,
  GOLD_MASTER_GATE,
  GOLD_MASTER_KAFD,
  districtEnMarkdown,
  districtEnMeta,
  districtEnTitle,
  shopsInDistrict,
} from "../lib/en-content";
import { markdownHasPhrase, stripMarkdown, wordCount } from "../lib/en-markdown";
import { htmlDir, htmlLang, localeFromPathname } from "../lib/locale";
import { PRODUCT_NAME, SOCIAL_SHARE_IMAGE } from "../lib/product";
import { shopJsonLd } from "../lib/structured-data";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function readRepo(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

assert(EN_CONTENT_DATE_MODIFIED === "2026-09-09", "locked content date");

assert(districtEnTitle("kafd") === GOLD_MASTER_KAFD.title, "kafd title lock");
assert(districtEnMeta("kafd") === GOLD_MASTER_KAFD.meta, "kafd meta lock");
assert(districtEnMarkdown("kafd") === GOLD_MASTER_KAFD.markdown, "kafd body lock");
assert(
  districtTitle("kafd", "en") === "Coffee shops in KAFD · wain.lol",
  "kafd page title",
);
assert(
  districtDescription("kafd", "en") === GOLD_MASTER_KAFD.meta,
  "kafd page meta",
);

assert(districtEnTitle("al-wurud") === GOLD_MASTER_AL_WURUD.title, "wurud title lock");
assert(districtEnMeta("al-wurud") === GOLD_MASTER_AL_WURUD.meta, "wurud meta lock");
assert(
  districtEnMarkdown("al-wurud") === GOLD_MASTER_AL_WURUD.markdown,
  "wurud body lock",
);

const gate = getShop(GATE_CAFE_ID);
assert(gate, "Gate is in the catalog");
assert(
  gate.nameAr === "The Gate Specialty Coffee",
  "do not invent nameAr for The Gate",
);
assert(cafeEnTitle(gate) === GOLD_MASTER_GATE.title, "Gate title lock");
assert(cafeEnMeta(gate) === GOLD_MASTER_GATE.meta, "Gate meta lock");
assert(cafeEnMarkdown(gate) === GOLD_MASTER_GATE.markdown, "Gate blurb lock");
for (const claim of GATE_FORBIDDEN_CLAIMS) {
  assert(
    !markdownHasPhrase(GOLD_MASTER_GATE.markdown, claim),
    `Gate gold master must not claim ${claim}`,
  );
}

const kafdShops = shopsInDistrict("kafd");
assert(kafdShops.length === 7, "kafd still has seven catalog cafes");
for (const id of [
  "12-cups-roastery-and-cafe-kafd",
  "cafe-tale-kafd",
  "coffee-planet-kafd",
  "draft-cafe-kafd",
  "hal-alkeif-kafd",
  "tobys-estate-kafd",
  "trieste-kafd",
]) {
  assert(
    GOLD_MASTER_KAFD.markdown.includes(`/en/c/${id}`),
    `kafd gold master links ${id}`,
  );
}

const wurudShops = shopsInDistrict("al-wurud");
assert(wurudShops.length === 4, "al-wurud still has four catalog cafes");

const narjis = districtEnMarkdown("al-narjis");
assert(narjis.includes("# Coffee shops in Al Narjis"), "al-narjis has H1");
assert(narjis.includes("CORE COFFEE & ROASTERY"), "al-narjis names Core");
assert(narjis.includes("CAF LAB"), "al-narjis names CAF LAB");
assert(narjis.includes("Repository Coffee Roasters"), "al-narjis names Repository");
assert(!narjis.includes("scrolling forever"), "al-narjis must not clone KAFD");
assert(!narjis.includes("office towers"), "al-narjis must not clone Al Wurud/KAFD tower line");
assert(narjis !== GOLD_MASTER_KAFD.markdown, "al-narjis body is unique");
const narjisWords = wordCount(narjis);
assert(
  narjisWords >= 180 && narjisWords <= 450,
  `al-narjis word count ${narjisWords}`,
);

for (const district of [
  "diriyah",
  "al-yasmin",
  "al-mughrizat",
  "al-rabwah",
  "as-sahafah",
  "ghirnatah",
] as const) {
  const body = districtEnMarkdown(district);
  const lead = body.split("## What’s here")[0] ?? "";
  const kafdLead = GOLD_MASTER_KAFD.markdown.split("## What’s here")[0] ?? "";
  assert(lead !== kafdLead, `${district} opener must not clone KAFD`);
  assert(body.includes("## What’s here"), `${district} has What's here`);
  assert(body.includes("## About wain"), `${district} has About wain`);
  assert(
    shopsInDistrict(district).every((shop) => body.includes(`/en/c/${shop.id}`)),
    `${district} lists catalog cafes`,
  );
}

const kafdMeta = districtMetadata("kafd", "en");
assert(kafdMeta.alternates?.canonical === "/en/coffee-shops/kafd", "kafd EN canonical");
assert(
  kafdMeta.alternates?.languages?.["ar-SA"] === "/coffee-shops/kafd",
  "kafd hreflang ar-SA",
);
assert(kafdMeta.alternates?.languages?.en === "/en/coffee-shops/kafd", "kafd hreflang en");

const kafdArMeta = districtMetadata("kafd", "ar");
assert(kafdArMeta.alternates?.canonical === "/coffee-shops/kafd", "kafd AR canonical");
assert(
  kafdArMeta.alternates?.languages?.en === "/en/coffee-shops/kafd",
  "AR district still emits EN hreflang",
);

const gateMeta = cafePageMetadata(gate, "en");
assert(gateMeta.title === GOLD_MASTER_GATE.title, "Gate generateMetadata title");
assert(gateMeta.description === GOLD_MASTER_GATE.meta, "Gate generateMetadata meta");
assert(gateMeta.alternates?.canonical === `/en/c/${GATE_CAFE_ID}`, "Gate canonical");
assert(
  gateMeta.alternates?.languages?.["ar-SA"] === `/c/${GATE_CAFE_ID}`,
  "Gate hreflang ar",
);
assert(
  JSON.stringify(gateMeta.openGraph?.images)?.includes(cafeOgImagePath(GATE_CAFE_ID, "en")),
  "Gate OG is cafe-specific",
);
assert(
  !JSON.stringify(gateMeta.openGraph).includes(SOCIAL_SHARE_IMAGE.url),
  "Gate OG must not fall back to homepage og-v2",
);

const gateArMeta = cafePageMetadata(gate, "ar");
assert(
  JSON.stringify(gateArMeta.openGraph?.images)?.includes(cafeOgImagePath(GATE_CAFE_ID, "ar")),
  "AR cafe OG is cafe-specific",
);
assert(
  !JSON.stringify(gateArMeta.openGraph).includes(SOCIAL_SHARE_IMAGE.url),
  "AR cafe OG must not fall back to homepage og-v2",
);

const blurbs = new Set<string>();
for (const id of CNI_PRIORITY_CAFE_IDS) {
  const shop = getShop(id);
  assert(shop, `${id} is in the catalog`);
  const blurb = cafeEnMarkdown(shop);
  assert(blurb.includes(shop.nameEn) || blurb.includes("**"), `${id} blurb names shop`);
  assert(blurb.includes(districtPathFor(shop.neighborhood)), `${id} links district`);
  assert(!blurbs.has(blurb), `${id} blurb must be unique`);
  blurbs.add(blurb);
  const words = wordCount(blurb);
  assert(words >= 80 && words <= 220, `${id} blurb word count ${words}`);
}

function districtPathFor(id: string): string {
  return `/en/coffee-shops/${id}`;
}

const extra = listRealShops().filter((shop) => shop.id !== GATE_CAFE_ID).slice(0, 12);
for (const shop of extra) {
  const blurb = cafeEnMarkdown(shop);
  assert(blurb.includes("/en/c/") || blurb.includes("/en/coffee-shops/"), `${shop.id} has internal links`);
  assert(blurb.includes(shop.nameEn), `${shop.id} names itself`);
}

for (const phrase of DROPPED_SLOGANS) {
  const hay = [
    GOLD_MASTER_KAFD.markdown,
    GOLD_MASTER_AL_WURUD.markdown,
    GOLD_MASTER_GATE.markdown,
    districtEnMarkdown("al-narjis"),
    cafeEnMarkdown(gate),
  ].join("\n");
  assert(!hay.includes(phrase), `dropped slogan leaked: ${phrase}`);
}

assert(localeFromPathname("/en/coffee-shops/kafd") === "en", "EN pathname");
assert(localeFromPathname("/coffee-shops/kafd") === "ar", "AR pathname");
assert(htmlLang("en") === "en" && htmlDir("en") === "ltr", "EN html lang/dir");
assert(htmlLang("ar") === "ar" && htmlDir("ar") === "rtl", "AR html lang/dir");

const ld = shopJsonLd(gate, "en");
assert(ld.dateModified === EN_CONTENT_DATE_MODIFIED, "JSON-LD dateModified");

assert(
  readRepo("app/layout.tsx").includes("localeFromRequestHeaders"),
  "root layout reads locale header",
);
assert(readRepo("proxy.ts").includes("LOCALE_HEADER"), "proxy sets locale header");
assert(
  readRepo("app/c/[id]/opengraph-image.tsx").includes("cafeOpenGraphImage"),
  "AR cafe OG image route",
);
assert(
  readRepo("app/en/c/[id]/opengraph-image.tsx").includes("cafeOpenGraphImage"),
  "EN cafe OG image route",
);
assert(
  readRepo("components/home-landing.tsx").includes("DistrictEnBody"),
  "EN district body is wired",
);
assert(
  readRepo("components/cafe-card-page.tsx").includes("CafeEnBlurb"),
  "EN cafe blurb is wired",
);
assert(
  !readRepo("lib/places.ts").includes("en-content"),
  "Soft Places ranking stays untouched",
);

assert(stripMarkdown(GOLD_MASTER_KAFD.markdown).includes("Coffee shops in KAFD"), "strip H1");
assert(PRODUCT_NAME === "wain.lol", "product name stays wain.lol");

console.log(
  `check-en-content: ok (kafd ${wordCount(GOLD_MASTER_KAFD.markdown)}w, wurud ${wordCount(GOLD_MASTER_AL_WURUD.markdown)}w, narjis ${narjisWords}w, gate ${wordCount(GOLD_MASTER_GATE.markdown)}w)`,
);
