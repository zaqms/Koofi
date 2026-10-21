/**
 * Share-pack copy in Arabic and English:
 * 1. English descriptions use the English tag label (Drive-through), not طلبات السيارة.
 * 2. An area phrase such as "In Al Jazirah" is not repeated.
 * 3. One district when every café shares it; otherwise "Al Malqa and 2 more areas"
 *    / "الملقا ومنطقتين زيادة".
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
  jazirahEn.copy.description.includes("Drive-through"),
  `EN description uses the Drive-through label, got ${jazirahEn.copy.description}`,
);
assert(
  !jazirahEn.copy.description.includes("طلبات السيارة") &&
    !ARABIC_SCRIPT.test(jazirahEn.copy.description) &&
    !ARABIC_SCRIPT.test(jazirahEn.copy.title) &&
    !ARABIC_SCRIPT.test(jazirahEn.copy.imageAlt),
  `EN share copy leaked Arabic: ${jazirahEn.copy.description}`,
);
assert(
  occurrences(jazirahEn.copy.description, "In Al Jazirah") === 1,
  `EN area phrase once, got ${occurrences(jazirahEn.copy.description, "In Al Jazirah")} in ${jazirahEn.copy.description}`,
);
assert(
  !jazirahEn.copy.description.includes("In Al Jazirah —") &&
    !jazirahEn.copy.description.includes("In Al Jazirah, In Al Jazirah"),
  `EN description still repeats the area phrase: ${jazirahEn.copy.description}`,
);

assert(
  jazirahAr.copy.description.includes("طلبات السيارة") &&
    !jazirahAr.copy.description.includes("Drive-through"),
  `AR description keeps the Arabic tag, got ${jazirahAr.copy.description}`,
);
assert(
  occurrences(jazirahAr.copy.description, "في الجزيرة") === 1,
  `AR area phrase once, got ${occurrences(jazirahAr.copy.description, "في الجزيرة")} in ${jazirahAr.copy.description}`,
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

const prefixed = packShareCopy({
  locale: "en",
  shops: jazirahEn.pack.shops,
  whys: ["In Al Jazirah", "In Al Jazirah — Drive-through", "In Al Mathar"],
  neighborhoodLabel: "Al Jazirah and 1 more area",
});
assert(
  occurrences(prefixed.description, "In Al Jazirah") === 1 &&
    prefixed.description.includes("Drive-through") &&
    !prefixed.description.includes("طلبات السيارة"),
  `prefixed EN description, got ${prefixed.description}`,
);
const prefixedAr = packShareCopy({
  locale: "ar",
  shops: jazirahAr.pack.shops,
  whys: ["في الجزيرة", "في الجزيرة — طلبات السيارة", "في المعذر"],
  neighborhoodLabel: "الجزيرة ومنطقة ثانية",
});
assert(
  occurrences(prefixedAr.description, "في الجزيرة") === 1 &&
    prefixedAr.description.includes("طلبات السيارة"),
  `prefixed AR description, got ${prefixedAr.description}`,
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
  occurrences(wadiEn.copy.description, "In Al Wadi") === 1 &&
    !wadiEn.copy.description.endsWith("Al Wadi"),
  `shared EN description repeated the area: ${wadiEn.copy.description}`,
);
assert(
  occurrences(wadiAr.copy.description, "في الوادي") === 1,
  `shared AR description repeated the area: ${wadiAr.copy.description}`,
);
assert(
  wadiEn.copy.description.includes("Drive-through") && !ARABIC_SCRIPT.test(wadiEn.copy.description),
  `shared EN description tag, got ${wadiEn.copy.description}`,
);
assert(
  wadiAr.copy.description.includes("طلبات السيارة") && !wadiAr.copy.description.includes("Drive-through"),
  `shared AR description tag, got ${wadiAr.copy.description}`,
);

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
  spreadEn.copy.title.endsWith("— Al Malqa and 2 more areas") &&
    spreadEn.copy.description.endsWith("Al Malqa and 2 more areas"),
  `three-district EN copy, title ${spreadEn.copy.title} / ${spreadEn.copy.description}`,
);
assert(
  spreadAr.copy.title.endsWith("— الملقا ومنطقتين زيادة") &&
    spreadAr.copy.description.endsWith("الملقا ومنطقتين زيادة"),
  `three-district AR copy, title ${spreadAr.copy.title} / ${spreadAr.copy.description}`,
);
assert(!ARABIC_SCRIPT.test(spreadEn.copy.description), "three-district EN description stays English");
assert(
  spreadEn.copy.description.split("Al Malqa and 2 more areas").length - 1 === 1,
  "spread area phrase is not duplicated",
);

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
