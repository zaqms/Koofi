import type { Shop } from "./types";

const GENERIC_FIRST = new Set([
  "the",
  "just",
  "a",
  "al",
  "el",
  "cafe",
  "café",
  "coffee",
]);

const KNOWN_BRANDS = [
  "origin",
  "camel step",
  "woods",
  "breehant",
  "roasting house",
  "percent arabica",
] as const;

function latinName(shop: Pick<Shop, "nameEn" | "nameAr">): string {
  return shop.nameEn
    .toLowerCase()
    .replace(/[–—-]/g, " ")
    .replace(/[^a-z0-9\s%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Same-brand key for a three-pack. ORIGIN Lab + ORIGIN Roasters + ORIGIN JAX
 * collapse to `origin`. Woods / Camel Step / Breehant branches share a key.
 * "Just A Space" and "Just another" stay distinct.
 */
export function shopBrandKey(
  shop: Pick<Shop, "id" | "nameEn" | "nameAr">,
): string {
  const name = latinName(shop);
  if (name.startsWith("%") || name.includes("arabica")) {
    if (name.includes("arabica")) return "percent-arabica";
  }
  for (const brand of KNOWN_BRANDS) {
    if (name.startsWith(brand)) return brand.replace(/\s+/g, "-");
  }

  const words = name.split(" ").filter(Boolean);
  if (words.length >= 2 && GENERIC_FIRST.has(words[0] ?? "")) {
    return words.slice(0, 2).join("-");
  }
  if (words[0]) return words[0];

  const fromId = shop.id.toLowerCase().split("-")[0] ?? shop.id;
  return fromId;
}

/** Keep the first (highest-ranked) shop per brand. */
export function dedupeSameBrand<T extends Pick<Shop, "id" | "nameEn" | "nameAr">>(
  shops: T[],
): T[] {
  const seen = new Set<string>();
  const next: T[] = [];
  for (const shop of shops) {
    const brand = shopBrandKey(shop);
    if (seen.has(brand)) continue;
    seen.add(brand);
    next.push(shop);
  }
  return next;
}
