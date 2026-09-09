import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  cafeArMarkdown,
  cafeArMeta,
  cafeArTitle,
  districtArMarkdown,
  districtArMeta,
  districtArTitle,
  GATE_FORBIDDEN_CLAIMS_AR,
  GOLD_MASTER_AL_WURUD_AR,
  GOLD_MASTER_GATE_AR,
  GOLD_MASTER_KAFD_AR,
} from "../lib/ar-content";
import { cafePageMetadata } from "../lib/cafe-metadata";
import { getShop, listDirectoryShops, listRealShops } from "../lib/catalog";
import { directoryNeighborhoods } from "../lib/directory";
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
  "district body is wired",
);
assert(
  !readRepo("components/home-landing.tsx").includes(
    'language === "en" && district',
  ),
  "AR district body is wired for both locales",
);
assert(
  readRepo("components/cafe-card-page.tsx").includes("CafeEnBlurb"),
  "cafe blurb is wired",
);
assert(
  !readRepo("components/cafe-card-page.tsx").includes(
    'language === "en" && !passportPage',
  ),
  "AR cafe blurb is wired for both locales",
);
assert(
  !readRepo("lib/places.ts").includes("en-content"),
  "Soft Places ranking stays untouched",
);

assert(stripMarkdown(GOLD_MASTER_KAFD.markdown).includes("Coffee shops in KAFD"), "strip H1");
assert(PRODUCT_NAME === "wain.lol", "product name stays wain.lol");

const MSA_LEAK = ["يوجد", "يمكنكم", "تتميز", "يعتبر", "يتميز"] as const;
const DIALECT_LEAK = ["عايز", "أوي", "هلق", "بدك", "شو في"] as const;

assert(districtArTitle("kafd") === GOLD_MASTER_KAFD_AR.title, "AR kafd title lock");
assert(districtArMeta("kafd") === GOLD_MASTER_KAFD_AR.meta, "AR kafd meta lock");
assert(
  districtArMarkdown("kafd") === GOLD_MASTER_KAFD_AR.markdown,
  "AR kafd body lock",
);
assert(
  districtTitle("kafd", "ar") === GOLD_MASTER_KAFD_AR.title,
  "AR kafd page title",
);
assert(
  districtDescription("kafd", "ar") === GOLD_MASTER_KAFD_AR.meta,
  "AR kafd page meta",
);
assert(
  GOLD_MASTER_KAFD_AR.markdown.includes("تتمشى بالشاشة"),
  "AR kafd keeps the don’t-scroll-forever angle",
);
assert(
  GOLD_MASTER_KAFD_AR.markdown.includes("## وش فيه"),
  "AR kafd has وش فيه",
);

assert(
  districtArTitle("al-wurud") === GOLD_MASTER_AL_WURUD_AR.title,
  "AR wurud title lock",
);
assert(
  districtArMeta("al-wurud") === GOLD_MASTER_AL_WURUD_AR.meta,
  "AR wurud meta lock",
);
assert(
  districtArMarkdown("al-wurud") === GOLD_MASTER_AL_WURUD_AR.markdown,
  "AR wurud body lock",
);
assert(
  GOLD_MASTER_AL_WURUD_AR.markdown.includes("شوارع سكنية"),
  "AR wurud keeps the residential-street angle",
);
assert(
  GOLD_MASTER_AL_WURUD_AR.markdown.includes("أبراج مكاتب"),
  "AR wurud contrasts office towers",
);
assert(
  String(GOLD_MASTER_KAFD_AR.markdown) !==
    String(GOLD_MASTER_AL_WURUD_AR.markdown),
  "AR kafd and wurud are not clones",
);

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
    GOLD_MASTER_KAFD_AR.markdown.includes(`/c/${id}`),
    `AR kafd gold master links ${id}`,
  );
}

assert(cafeArTitle(gate) === GOLD_MASTER_GATE_AR.title, "AR Gate title lock");
assert(cafeArMeta(gate) === GOLD_MASTER_GATE_AR.meta, "AR Gate meta lock");
assert(
  cafeArMarkdown(gate) === GOLD_MASTER_GATE_AR.markdown,
  "AR Gate blurb lock",
);
assert(
  GOLD_MASTER_GATE_AR.markdown.includes("The Gate Specialty Coffee"),
  "AR Gate keeps Latin catalog name",
);
assert(
  !GOLD_MASTER_GATE_AR.markdown.includes("البوابة"),
  "AR Gate must not invent an Arabic brand name",
);
for (const claim of GATE_FORBIDDEN_CLAIMS_AR) {
  assert(
    !markdownHasPhrase(GOLD_MASTER_GATE_AR.markdown, claim),
    `AR Gate gold master must not claim ${claim}`,
  );
}
assert(
  GOLD_MASTER_GATE_AR.markdown.includes("قهوة مختصة"),
  "AR Gate keeps specialty-coffee theme",
);
assert(
  GOLD_MASTER_GATE_AR.markdown.includes("التشيزكيك"),
  "AR Gate keeps cheesecake theme",
);
assert(
  GOLD_MASTER_GATE_AR.markdown.includes("الطاقم الودود"),
  "AR Gate keeps friendly-staff theme",
);
assert(
  GOLD_MASTER_GATE_AR.markdown.includes("مول العليا") ||
    GOLD_MASTER_GATE_AR.markdown.includes("منطقة مول العليا"),
  "AR Gate may mention Al Olaya Mall area",
);

const gateArPage = cafePageMetadata(gate, "ar");
assert(
  gateArPage.title === GOLD_MASTER_GATE_AR.title,
  "AR Gate generateMetadata title",
);
assert(
  gateArPage.description === GOLD_MASTER_GATE_AR.meta,
  "AR Gate generateMetadata meta",
);
assert(
  gateArPage.alternates?.canonical === `/c/${GATE_CAFE_ID}`,
  "AR Gate canonical",
);
assert(
  gateArPage.alternates?.languages?.en === `/en/c/${GATE_CAFE_ID}`,
  "AR Gate hreflang en",
);
assert(
  gateArPage.alternates?.languages?.["ar-SA"] === `/c/${GATE_CAFE_ID}`,
  "AR Gate hreflang ar-SA",
);

const kafdArPage = districtMetadata("kafd", "ar");
assert(kafdArPage.title === GOLD_MASTER_KAFD_AR.title, "AR kafd metadata title");
assert(
  kafdArPage.description === GOLD_MASTER_KAFD_AR.meta,
  "AR kafd metadata description",
);
assert(
  kafdArPage.alternates?.canonical === "/coffee-shops/kafd",
  "AR kafd canonical stays /coffee-shops/kafd",
);
assert(
  kafdArPage.alternates?.languages?.en === "/en/coffee-shops/kafd",
  "AR kafd still emits EN hreflang",
);
assert(
  kafdArPage.alternates?.languages?.["ar-SA"] === "/coffee-shops/kafd",
  "AR kafd still emits ar-SA hreflang",
);

const narjisAr = districtArMarkdown("al-narjis");
assert(narjisAr.includes("# مقاهي في النرجس"), "AR al-narjis has H1");
assert(narjisAr.includes("كور قهوة ومحمصة"), "AR al-narjis names Core");
assert(narjisAr.includes("كاف لاب"), "AR al-narjis names CAF LAB");
assert(narjisAr.includes("محمصة ريبوستري"), "AR al-narjis names Repository");
assert(!narjisAr.includes("تتمشى بالشاشة"), "AR al-narjis must not clone KAFD");
assert(!narjisAr.includes("أبراج مكاتب"), "AR al-narjis must not clone Wurud towers");
assert(narjisAr !== GOLD_MASTER_KAFD_AR.markdown, "AR al-narjis body is unique");
const narjisArWords = wordCount(narjisAr);
assert(
  narjisArWords >= 120 && narjisArWords <= 450,
  `AR al-narjis word count ${narjisArWords}`,
);

const liveDistricts = directoryNeighborhoods(listDirectoryShops());
const arLeads = new Set<string>();
for (const district of liveDistricts) {
  const body = districtArMarkdown(district);
  const lead = body.split("## وش فيه")[0] ?? "";
  assert(lead !== "", `${district} AR has a lead`);
  assert(!arLeads.has(lead), `${district} AR opener must be unique`);
  arLeads.add(lead);
  assert(body.includes("## وش فيه"), `${district} AR has وش فيه`);
  assert(body.includes("## عن وين"), `${district} AR has عن وين`);
  assert(
    shopsInDistrict(district).every((shop) => body.includes(`/c/${shop.id}`)),
    `${district} AR lists catalog cafes`,
  );
}

const arBlurbs = new Set<string>();
for (const id of CNI_PRIORITY_CAFE_IDS) {
  const shop = getShop(id);
  assert(shop, `${id} is in the catalog`);
  const blurb = cafeArMarkdown(shop);
  assert(
    blurb.includes(shop.nameAr) || blurb.includes("**"),
    `${id} AR blurb names shop`,
  );
  assert(
    blurb.includes(`/coffee-shops/${shop.neighborhood}`),
    `${id} AR links district`,
  );
  assert(!arBlurbs.has(blurb), `${id} AR blurb must be unique`);
  arBlurbs.add(blurb);
  const words = wordCount(blurb);
  assert(words >= 60 && words <= 220, `${id} AR blurb word count ${words}`);
}

const extraAr = listRealShops()
  .filter((shop) => shop.id !== GATE_CAFE_ID)
  .slice(0, 12);
for (const shop of extraAr) {
  const blurb = cafeArMarkdown(shop);
  assert(
    blurb.includes("/c/") || blurb.includes("/coffee-shops/"),
    `${shop.id} AR has internal links`,
  );
  assert(blurb.includes(shop.nameAr), `${shop.id} AR names itself`);
}

const arHay = [
  GOLD_MASTER_KAFD_AR.markdown,
  GOLD_MASTER_AL_WURUD_AR.markdown,
  GOLD_MASTER_GATE_AR.markdown,
  districtArMarkdown("al-narjis"),
  cafeArMarkdown(gate),
].join("\n");
for (const phrase of [...DROPPED_SLOGANS, ...MSA_LEAK, ...DIALECT_LEAK]) {
  assert(!arHay.includes(phrase), `AR leak: ${phrase}`);
}

assert(htmlLang("ar") === "ar" && htmlDir("ar") === "rtl", "AR html lang/dir stay locked");

console.log(
  `check-en-content: ok (kafd ${wordCount(GOLD_MASTER_KAFD.markdown)}w, wurud ${wordCount(GOLD_MASTER_AL_WURUD.markdown)}w, narjis ${narjisWords}w, gate ${wordCount(GOLD_MASTER_GATE.markdown)}w; AR kafd ${wordCount(GOLD_MASTER_KAFD_AR.markdown)}w, wurud ${wordCount(GOLD_MASTER_AL_WURUD_AR.markdown)}w, narjis ${narjisArWords}w, gate ${wordCount(GOLD_MASTER_GATE_AR.markdown)}w)`,
);
