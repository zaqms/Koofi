/**
 * Dynamic share cards for home, chips, districts, and Most Popular.
 * Cafe cards stay on /c/{id}/opengraph-image. Soft Places stays parked.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { chipPageMetadata } from "../lib/chip-page";
import { districtMetadata } from "../lib/district";
import { listingOgCopy, listingOgPath } from "../lib/listing-og";
import { mostPopularMetadata } from "../lib/most-popular";
import {
  LOCKED_OPENER,
  LOCKED_OPENER_EN,
  SOCIAL_SHARE_IMAGE,
} from "../lib/product";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function readRepo(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function imageUrl(meta: {
  openGraph?: { images?: unknown } | null;
  twitter?: { images?: unknown } | null;
}): string {
  return JSON.stringify({
    openGraph: meta.openGraph?.images,
    twitter: meta.twitter?.images,
  });
}

const matchaAr = chipPageMetadata("matcha", "ar");
const matchaEn = chipPageMetadata("matcha", "en");
assert(
  imageUrl(matchaAr).includes(listingOgPath({ kind: "chip", language: "ar", id: "matcha" })),
  "Matcha AR og:image and twitter:image point at the chip card",
);
assert(
  imageUrl(matchaEn).includes(listingOgPath({ kind: "chip", language: "en", id: "matcha" })),
  "Matcha EN og:image and twitter:image point at the chip card",
);
assert(
  !imageUrl(matchaAr).includes(SOCIAL_SHARE_IMAGE.url),
  "Matcha AR must not use the brand og-v2 card",
);
assert(
  !imageUrl(matchaEn).includes(SOCIAL_SHARE_IMAGE.url),
  "Matcha EN must not use the brand og-v2 card",
);
assert(listingOgCopy({ kind: "chip", language: "ar", id: "matcha" })?.title === "ماتشا", "Matcha AR card title");
assert(listingOgCopy({ kind: "chip", language: "en", id: "matcha" })?.title === "Matcha", "Matcha EN card title");

const hittin = districtMetadata("hittin", "ar");
const kafd = districtMetadata("kafd", "en");
assert(
  imageUrl(hittin).includes(listingOgPath({ kind: "district", language: "ar", id: "hittin" })),
  "district AR card path",
);
assert(
  imageUrl(kafd).includes(listingOgPath({ kind: "district", language: "en", id: "kafd" })),
  "district EN card path",
);
assert(
  !imageUrl(hittin).includes(SOCIAL_SHARE_IMAGE.url),
  "district AR must not use og-v2",
);
assert(
  listingOgCopy({ kind: "district", language: "ar", id: "hittin" })?.title === "مقاهي في حطين",
  "district card uses the page heading",
);
assert(
  listingOgCopy({ kind: "district", language: "en", id: "kafd" })?.title === "Coffee shops in KAFD",
  "EN district card heading",
);

const popularAr = mostPopularMetadata("ar");
const popularEn = mostPopularMetadata("en");
assert(
  imageUrl(popularAr).includes("/og/ar/popular"),
  "Most Popular AR card",
);
assert(
  imageUrl(popularEn).includes("/og/en/popular"),
  "Most Popular EN card",
);
assert(
  listingOgCopy({ kind: "popular", language: "ar" })?.title === "أشهر القهاوي في الرياض",
  "Most Popular AR heading",
);

assert(listingOgCopy({ kind: "home", language: "ar" })?.title === LOCKED_OPENER, "home AR opener");
assert(listingOgCopy({ kind: "home", language: "en" })?.title === LOCKED_OPENER_EN, "home EN opener");
assert(listingOgPath({ kind: "home", language: "ar" }) === "/og/ar/home", "home AR path");
assert(listingOgPath({ kind: "home", language: "en" }) === "/og/en/home", "home EN path");

const layout = readRepo("app/layout.tsx");
const enHome = readRepo("app/en/page.tsx");
assert(layout.includes('listingOgImage({ kind: "home", language: "ar" }'), "home AR metadata uses the dynamic card");
assert(!layout.includes("SOCIAL_SHARE_IMAGE"), "root layout no longer emits og-v2");
assert(enHome.includes('listingOgImage({ kind: "home", language: "en" }'), "home EN metadata uses the dynamic card");
assert(!enHome.includes("SOCIAL_SHARE_IMAGE"), "EN home no longer emits og-v2");

assert(readRepo("app/about/page.tsx").includes("SOCIAL_SHARE_IMAGE"), "about keeps the static brand card");
assert(
  readRepo("app/c/[id]/opengraph-image.tsx").includes("cafeOpenGraphImage"),
  "cafe detail keeps its own opengraph-image",
);

const route = readRepo("app/og/[locale]/[kind]/[[...id]]/route.tsx");
const painter = readRepo("lib/listing-og-image.tsx");
assert(route.includes("listingOpenGraphImage"), "OG route returns ImageResponse");
assert(painter.includes("ImageResponse"), "card is minted with next/og");
assert(painter.includes('direction: rtl ? "rtl" : "ltr"'), "Arabic cards paint RTL");
assert(painter.includes("PRODUCT_NAME"), "card wordmark is the public brand");
assert(!/Koofi/i.test(painter + route + readRepo("lib/listing-og.ts")), "no Koofi on the share card");
assert(!/soft-places|Soft Places/i.test(painter + route), "Soft Places stays parked");

assert(listingOgCopy({ kind: "chip", language: "ar", id: "not-a-chip" }) === null, "unknown chip 404s");
assert(listingOgCopy({ kind: "district", language: "en", id: "nope" }) === null, "unknown district 404s");

console.log("check-listing-og: ok");
