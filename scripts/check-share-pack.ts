/**
 * Share-pack copy in Arabic and English:
 * 1. English descriptions use the English tag (drive-through), not طلبات السيارة.
 * 2. The description is one sentence. Each area is named once.
 * 3. One district, both districts, or "Al Malqa and 2 more areas" / "الملقا ومنطقتين زيادة".
 * 4. Share-image alt follows the page language. Branch names stay `Brand · branch`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getShop } from "../lib/catalog";
import { cafePageMetadata, cafeShareImageAlt } from "../lib/cafe-metadata";
import { neighborhoodLabel } from "../lib/neighborhoods";
import { encodePackId, packShareCopy, resolvePack } from "../lib/pack";
import { PRODUCT_NAME, shopDisplayName } from "../lib/product";
import type { Language, Shop } from "../lib/types";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

const ARABIC_SCRIPT = /[\u0600-\u06FF]/;

function occurrences(hay: string, needle: string): number {
  if (!needle) return 0;
  return hay.split(needle).length - 1;
}

function ogAlt(meta: ReturnType<typeof cafePageMetadata>): string {
  const images = meta.openGraph?.images;
  const image = Array.isArray(images) ? images[0] : images;
  assert(image && typeof image === "object" && "alt" in image, "cafe og image has alt");
  return String(image.alt ?? "");
}

function share(ids: string[], locale: Language) {
  const id = encodePackId({ locale, shopIds: ids, ask: "share-pack" });
  const pack = resolvePack(id);
  assert(pack, `pack ${locale} ${ids.join(",")}`);
  const copy = packShareCopy(pack);
  return { pack, copy };
}

const JAZIRAH = ["drcafe-al-jazirah", "drcafe-al-jazirah-2", "drcafe-al-mathar"];
const jazirahEn = share(JAZIRAH, "en");
const jazirahAr = share(JAZIRAH, "ar");

assert(
  jazirahEn.copy.title ===
    "dr.CAFE · Exit 15, dr.CAFE · Prince Saad Rd, dr.CAFE · King Fahd Rd — Al Jazirah and 1 more area",
  `EN spread title, got ${jazirahEn.copy.title}`,
);
assert(
  jazirahAr.copy.title ===
    "د.كيف كافيه · مخرج 15، د.كيف كافيه · طريق الأمير سعد بن عبدالرحمن، د.كيف كافيه · طريق الملك فهد — الجزيرة ومنطقة ثانية",
  `AR spread title, got ${jazirahAr.copy.title}`,
);
assert(jazirahEn.copy.title.includes(" · "), "EN title keeps the branch separator");
assert(jazirahAr.copy.title.includes(" · "), "AR title keeps the branch separator");
assert(jazirahEn.copy.title.includes(", "), "EN shops stay comma-separated");
assert(jazirahAr.copy.title.includes("، "), "AR shops stay Arabic-comma-separated");
assert(!jazirahEn.copy.title.includes(" · dr.CAFE"), "EN title does not join shops with ·");

assert(
  jazirahEn.copy.description ===
    "3 cafés in Al Jazirah and Al Mathar, all with drive-through.",
  `EN description, got ${jazirahEn.copy.description}`,
);
assert(
  jazirahAr.copy.description ===
    "3 قهاوي في الجزيرة والمعذر، كلها فيها طلبات السيارة.",
  `AR description, got ${jazirahAr.copy.description}`,
);
assert(
  !ARABIC_SCRIPT.test(jazirahEn.copy.description) &&
    !ARABIC_SCRIPT.test(jazirahEn.copy.title) &&
    !ARABIC_SCRIPT.test(jazirahEn.copy.imageAlt),
  `EN share copy leaked Arabic: ${jazirahEn.copy.description}`,
);
assert(
  occurrences(jazirahEn.copy.description, "Al Jazirah") === 1 &&
    occurrences(jazirahEn.copy.description, "Al Mathar") === 1 &&
    !jazirahEn.copy.description.includes("1 more area"),
  `EN description should name each area once, got ${jazirahEn.copy.description}`,
);
assert(
  occurrences(jazirahAr.copy.description, "الجزيرة") === 1 &&
    occurrences(jazirahAr.copy.description, "المعذر") === 1 &&
    !jazirahAr.copy.description.includes("منطقة ثانية"),
  `AR description should name each area once, got ${jazirahAr.copy.description}`,
);

assert(
  jazirahEn.copy.imageAlt === `${jazirahEn.copy.title} · ${PRODUCT_NAME}`,
  `EN pack alt, got ${jazirahEn.copy.imageAlt}`,
);
assert(
  jazirahAr.copy.imageAlt === `${jazirahAr.copy.title} · ${PRODUCT_NAME}`,
  `AR pack alt, got ${jazirahAr.copy.imageAlt}`,
);
assert(jazirahEn.copy.imageAlt !== jazirahAr.copy.imageAlt, "pack alt follows the pack language");
assert(jazirahAr.copy.imageAlt.includes("الجزيرة ومنطقة ثانية"), "AR pack alt names the spread in Arabic");
assert(jazirahEn.copy.imageAlt.includes("Al Jazirah and 1 more area"), "EN pack alt names the spread");

const oneTag = share(
  ["drcafe-al-jazirah", "camel-step-hittin", "tobys-estate-hittin"],
  "en",
);
const oneTagAr = share(
  ["drcafe-al-jazirah", "camel-step-hittin", "tobys-estate-hittin"],
  "ar",
);
assert(
  oneTag.copy.description === "3 cafés in Al Jazirah and Hittin, one with drive-through.",
  `one-tag EN description, got ${oneTag.copy.description}`,
);
assert(
  oneTagAr.copy.description === "3 قهاوي في الجزيرة وحطين، وحدة فيها طلبات السيارة.",
  `one-tag AR description, got ${oneTagAr.copy.description}`,
);

const WADI = ["24cafe-al-wadi", "coffee-address-al-wadi", "java-cafe-al-wadi"];
const wadiEn = share(WADI, "en");
const wadiAr = share(WADI, "ar");
assert(wadiEn.pack.neighborhoodId === "al-wadi", "shared district keeps an id");
assert(wadiEn.pack.neighborhoodLabel === "Al Wadi", `shared EN area, got ${wadiEn.pack.neighborhoodLabel}`);
assert(wadiAr.pack.neighborhoodLabel === "الوادي", `shared AR area, got ${wadiAr.pack.neighborhoodLabel}`);
assert(
  wadiEn.copy.title.endsWith("— Al Wadi") && !wadiEn.copy.title.includes("more area"),
  `shared EN title, got ${wadiEn.copy.title}`,
);
assert(
  wadiAr.copy.title.endsWith("— الوادي") && !wadiAr.copy.title.includes("زيادة"),
  `shared AR title, got ${wadiAr.copy.title}`,
);
assert(
  wadiEn.copy.description === "3 cafés in Al Wadi, all with drive-through.",
  `shared EN description, got ${wadiEn.copy.description}`,
);
assert(
  wadiAr.copy.description === "3 قهاوي في الوادي، كلها فيها طلبات السيارة.",
  `shared AR description, got ${wadiAr.copy.description}`,
);
assert(occurrences(wadiEn.copy.description, "Al Wadi") === 1, "Al Wadi is named once");
assert(occurrences(wadiAr.copy.description, "الوادي") === 1, "الوادي is named once");

const SPREAD = ["jorn-al-malqa", "elixir-bunn-al-nakheel", "idmi-al-yasmin"];
const spreadEn = share(SPREAD, "en");
const spreadAr = share(SPREAD, "ar");
assert(spreadEn.pack.neighborhoodId === null, "a spread pack is not one district");
assert(
  spreadEn.pack.neighborhoodLabel === "Al Malqa and 2 more areas",
  `three-district EN area, got ${spreadEn.pack.neighborhoodLabel}`,
);
assert(
  spreadAr.pack.neighborhoodLabel === "الملقا ومنطقتين زيادة",
  `three-district AR area, got ${spreadAr.pack.neighborhoodLabel}`,
);
assert(
  spreadEn.copy.title.endsWith("— Al Malqa and 2 more areas"),
  `three-district EN title, got ${spreadEn.copy.title}`,
);
assert(
  spreadAr.copy.title.endsWith("— الملقا ومنطقتين زيادة"),
  `three-district AR title, got ${spreadAr.copy.title}`,
);
assert(
  spreadEn.copy.description === "3 cafés in Al Malqa and 2 more areas, two with roastery.",
  `three-district EN description, got ${spreadEn.copy.description}`,
);
assert(
  spreadAr.copy.description === "3 قهاوي في الملقا ومنطقتين زيادة، ثنتين فيها محمصة.",
  `three-district AR description, got ${spreadAr.copy.description}`,
);
assert(
  occurrences(spreadEn.copy.description, "Al Malqa and 2 more areas") === 1 &&
    !spreadEn.copy.description.includes("An Nakheel") &&
    !spreadEn.copy.description.includes("Al Yasmin"),
  `three-district EN description names the lead once, got ${spreadEn.copy.description}`,
);
assert(!ARABIC_SCRIPT.test(spreadEn.copy.description), "three-district EN description stays English");

const pair = share(["drcafe-al-jazirah", "drcafe-al-jazirah-2"], "en");
const pairAr = share(["drcafe-al-jazirah", "drcafe-al-jazirah-2"], "ar");
assert(
  pair.copy.description === "2 cafés in Al Jazirah, both with drive-through.",
  `pair EN description, got ${pair.copy.description}`,
);
assert(
  pairAr.copy.description === "قهوتين في الجزيرة، ثنتينهم فيها طلبات السيارة.",
  `pair AR description, got ${pairAr.copy.description}`,
);

const solo = share(["drcafe-al-jazirah"], "en");
const soloAr = share(["drcafe-al-jazirah"], "ar");
assert(
  solo.copy.description === "1 café in Al Jazirah with drive-through.",
  `solo EN description, got ${solo.copy.description}`,
);
assert(
  soloAr.copy.description === "قهوة واحدة في الجزيرة فيها طلبات السيارة.",
  `solo AR description, got ${soloAr.copy.description}`,
);

const plain = share(["camel-step-hittin", "tobys-estate-hittin", "just-another-hittin"], "en");
const plainAr = share(["camel-step-hittin", "tobys-estate-hittin", "just-another-hittin"], "ar");
assert(plain.copy.description === "3 cafés in Hittin.", `plain EN description, got ${plain.copy.description}`);
assert(plainAr.copy.description === "3 قهاوي في حطين.", `plain AR description, got ${plainAr.copy.description}`);

const prince = getShop("drcafe-al-jazirah-2");
assert(prince, "Prince Saad dr.CAFE");
assert(
  ogAlt(cafePageMetadata(prince, "en")) ===
    "dr.CAFE · Prince Saad Rd · Al Jazirah · wain.lol",
  `EN cafe alt, got ${ogAlt(cafePageMetadata(prince, "en"))}`,
);
assert(
  ogAlt(cafePageMetadata(prince, "ar")) ===
    "د.كيف كافيه · طريق الأمير سعد بن عبدالرحمن · الجزيرة · wain.lol",
  `AR cafe alt, got ${ogAlt(cafePageMetadata(prince, "ar"))}`,
);
assert(
  cafeShareImageAlt(prince, "en") === ogAlt(cafePageMetadata(prince, "en")) &&
    cafeShareImageAlt(prince, "ar") === ogAlt(cafePageMetadata(prince, "ar")),
  "cafe metadata alt is the localized share alt",
);
assert(
  ogAlt(cafePageMetadata(prince, "ar")) !== ogAlt(cafePageMetadata(prince, "en")),
  "Arabic cafe pages do not reuse the English alt",
);

const jorn = getShop("jorn-al-malqa");
assert(jorn, "Jorn");
assert(
  ogAlt(cafePageMetadata(jorn, "en")) ===
    `${shopDisplayName(jorn, "en")} · ${neighborhoodLabel("al-malqa", "en")} · ${PRODUCT_NAME}`,
  "EN cafe alt keeps name · district · wain.lol",
);
assert(
  ogAlt(cafePageMetadata(jorn, "ar")) ===
    `${shopDisplayName(jorn, "ar")} · ${neighborhoodLabel("al-malqa", "ar")} · ${PRODUCT_NAME}`,
  "AR cafe alt keeps name · district · wain.lol",
);
assert(!ARABIC_SCRIPT.test(ogAlt(cafePageMetadata(jorn, "en"))), "EN cafe alt has no Arabic");
assert(ARABIC_SCRIPT.test(ogAlt(cafePageMetadata(jorn, "ar"))), "AR cafe alt is Arabic");

const page = readFileSync(join(process.cwd(), "app/p/[id]/page.tsx"), "utf8");
const packLib = readFileSync(join(process.cwd(), "lib/pack.ts"), "utf8");
assert(page.includes("packShareCopy"), "pack page builds title, description, and alt from packShareCopy");
assert(page.includes("copy.imageAlt"), "pack og:image alt is the localized share alt");
assert(packLib.includes("`${names} — ${area}`"), "pack title still uses the em dash before the area");
assert(!page.includes('.join(" · ")') && !page.includes(".join(' · ')"), "pack page does not join shops with ·");

const shops = JAZIRAH.map((id) => getShop(id)).filter((shop): shop is Shop => Boolean(shop));
assert(shops.length === 3, "jazirah shops resolve");
assert(
  shops.every((shop) => shopDisplayName(shop, "en").includes(" · ") && shopDisplayName(shop, "ar").includes(" · ")),
  "branch-aware names stay on the share pack",
);

console.log("check-share-pack: ok");
