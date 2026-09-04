import { getShop, listDirectoryShops, listRealShops } from "./catalog";
import { coffeeShopsInDistrict } from "./directory-category";
import { neighborhoodLabel } from "./neighborhoods";
import { officialShopCoords } from "./place-coords";
import {
  cardPath,
  districtPath,
  PRODUCT_NAME,
  PUBLIC_SITE_URL,
  shopDisplayName,
} from "./product";
import type { Language, NeighborhoodId, Shop } from "./types";

export const SCHEMA_CONTEXT = "https://schema.org" as const;

export const PUBLIC_SHOPS_API_PATH = "/api/shops";
export const PUBLIC_MCP_PATH = "/api/mcp";
export const PUBLIC_MCP_ALIAS_PATH = "/mcp";
export const LLMS_TXT_PATH = "/llms.txt";

export const PUBLIC_SHOPS_CACHE_CONTROL =
  "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400";

/** Catalog-only public fields. No hours, ratings, phone, price, reviews, images, or votes. */
export const PUBLIC_SHOP_FIELDS = [
  "identifier",
  "nameAr",
  "nameEn",
  "neighborhood",
  "neighborhoodAr",
  "url",
  "urlEn",
  "sameAs",
  "hasMap",
  "geo",
] as const;

const FORBIDDEN_PUBLIC_KEYS = [
  "hours",
  "openingHours",
  "openingHoursSpecification",
  "aggregateRating",
  "rating",
  "review",
  "reviewCount",
  "telephone",
  "phone",
  "priceRange",
  "price",
  "image",
  "photo",
  "photoUrl",
  "logo",
  "logoUrl",
  "votes",
  "upvote",
  "upvoteCount",
] as const;

export type GeoJsonLd = {
  "@type": "GeoCoordinates";
  latitude: number;
  longitude: number;
};

export type PostalAddressJsonLd = {
  "@type": "PostalAddress";
  addressLocality: string;
  addressRegion: string;
  addressCountry: "SA";
};

export type CafeOrCoffeeShopJsonLd = {
  "@context"?: typeof SCHEMA_CONTEXT;
  "@type": "CafeOrCoffeeShop";
  name: string;
  alternateName?: string;
  url: string;
  address: PostalAddressJsonLd;
  sameAs?: string[];
  hasMap?: string;
  geo?: GeoJsonLd;
};

export type PublicShopRecord = {
  "@context"?: typeof SCHEMA_CONTEXT;
  "@type": "CafeOrCoffeeShop";
  identifier: string;
  nameAr: string;
  nameEn: string;
  neighborhood: NeighborhoodId;
  neighborhoodAr: string;
  url: string;
  urlEn: string;
  sameAs?: string[];
  hasMap?: string;
  geo?: GeoJsonLd;
};

export type ItemListJsonLd = {
  "@context": typeof SCHEMA_CONTEXT;
  "@type": "ItemList";
  name: string;
  url: string;
  numberOfItems: number;
  itemListElement: {
    "@type": "ListItem";
    position: number;
    url?: string;
    item: CafeOrCoffeeShopJsonLd | PublicShopRecord;
  }[];
};

function shopById(): Map<string, Shop> {
  return new Map(listRealShops().map((shop) => [shop.id, shop]));
}

/** Real shops in the same neighborhood-then-name order as the public directory. */
export function listPublicShops(): Shop[] {
  const byId = shopById();
  return listDirectoryShops()
    .map((row) => byId.get(row.id))
    .filter((shop): shop is Shop => shop !== undefined);
}

export function publicShopsInDistrict(district: NeighborhoodId): Shop[] {
  return listPublicShops().filter((shop) => shop.neighborhood === district);
}

export function shopCanonicalUrl(id: string, language: Language): string {
  return `${PUBLIC_SITE_URL}${cardPath(id, language)}`;
}

export function districtCanonicalUrl(
  district: NeighborhoodId,
  language: Language,
): string {
  return `${PUBLIC_SITE_URL}${districtPath(district, language)}`;
}

export function publicShopsApiUrl(id?: string): string {
  if (!id) return `${PUBLIC_SITE_URL}${PUBLIC_SHOPS_API_PATH}`;
  return `${PUBLIC_SITE_URL}${PUBLIC_SHOPS_API_PATH}/${encodeURIComponent(id)}`;
}

export function publicMcpUrl(path: typeof PUBLIC_MCP_PATH | typeof PUBLIC_MCP_ALIAS_PATH = PUBLIC_MCP_PATH): string {
  return `${PUBLIC_SITE_URL}${path}`;
}

function mapsUrls(shop: Shop): string[] {
  const maps = shop.mapsShareUrl?.trim();
  const site = shop.officialSite?.trim();
  const urls: string[] = [];
  if (maps) urls.push(maps);
  if (site && site !== maps) urls.push(site);
  return urls;
}

function geoFromCatalog(shop: Shop): GeoJsonLd | undefined {
  const coords = officialShopCoords(shop);
  if (!coords) return undefined;
  return {
    "@type": "GeoCoordinates",
    latitude: coords.lat,
    longitude: coords.lng,
  };
}

function compact<T extends Record<string, unknown>>(value: T): T {
  for (const key of Object.keys(value)) {
    if (value[key] === undefined) {
      delete value[key];
    }
  }
  return value;
}

export function shopJsonLd(
  shop: Shop,
  language: Language,
  options?: { includeContext?: boolean },
): CafeOrCoffeeShopJsonLd {
  const name = shopDisplayName(shop, language);
  const other =
    language === "ar" ? shop.nameEn.trim() : shop.nameAr.trim();
  const locality =
    language === "ar"
      ? shop.neighborhoodAr
      : neighborhoodLabel(shop.neighborhood, "en");
  const sameAs = mapsUrls(shop);
  const maps = sameAs[0];
  const geo = geoFromCatalog(shop);

  return compact({
    ...(options?.includeContext === false
      ? {}
      : { "@context": SCHEMA_CONTEXT }),
    "@type": "CafeOrCoffeeShop",
    name,
    ...(other && other !== name ? { alternateName: other } : {}),
    url: shopCanonicalUrl(shop.id, language),
    address: {
      "@type": "PostalAddress",
      addressLocality: locality,
      addressRegion: language === "ar" ? "الرياض" : "Riyadh",
      addressCountry: "SA",
    },
    ...(sameAs.length ? { sameAs } : {}),
    ...(maps ? { hasMap: maps } : {}),
    ...(geo ? { geo } : {}),
  });
}

export function publicShopRecord(
  shop: Shop,
  options?: { includeContext?: boolean },
): PublicShopRecord {
  const sameAs = mapsUrls(shop);
  const maps = sameAs[0];
  const geo = geoFromCatalog(shop);

  return compact({
    ...(options?.includeContext === false
      ? {}
      : { "@context": SCHEMA_CONTEXT }),
    "@type": "CafeOrCoffeeShop",
    identifier: shop.id,
    nameAr: shop.nameAr,
    nameEn: shop.nameEn,
    neighborhood: shop.neighborhood,
    neighborhoodAr: shop.neighborhoodAr,
    url: shopCanonicalUrl(shop.id, "ar"),
    urlEn: shopCanonicalUrl(shop.id, "en"),
    ...(sameAs.length ? { sameAs } : {}),
    ...(maps ? { hasMap: maps } : {}),
    ...(geo ? { geo } : {}),
  });
}

export function districtItemListJsonLd(
  district: NeighborhoodId,
  language: Language,
): ItemListJsonLd {
  const shops = publicShopsInDistrict(district);
  const name = coffeeShopsInDistrict(
    neighborhoodLabel(district, language),
    language,
  );

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "ItemList",
    name,
    url: districtCanonicalUrl(district, language),
    numberOfItems: shops.length,
    itemListElement: shops.map((shop, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: shopCanonicalUrl(shop.id, language),
      item: shopJsonLd(shop, language, { includeContext: false }),
    })),
  };
}

export function publicShopsItemList(): ItemListJsonLd {
  const shops = listPublicShops();
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "ItemList",
    name: `${PRODUCT_NAME} curated Riyadh coffee shops`,
    url: publicShopsApiUrl(),
    numberOfItems: shops.length,
    itemListElement: shops.map((shop, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: publicShopRecord(shop, { includeContext: false }),
    })),
  };
}

export function publicShopPayload(id: string): PublicShopRecord | null {
  const shop = getShop(id);
  if (!shop) return null;
  return publicShopRecord(shop, { includeContext: true });
}

export function publicShopHeaders(): HeadersInit {
  return {
    "Cache-Control": PUBLIC_SHOPS_CACHE_CONTROL,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

/** CORS for the public MCP endpoint. No auth. Protocol requests are not cached. */
export function publicMcpHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Accept, Authorization, MCP-Protocol-Version, MCP-Session-Id, Last-Event-ID",
    "Access-Control-Expose-Headers": "MCP-Protocol-Version, MCP-Session-Id",
    "Access-Control-Max-Age": "86400",
  };
}

export function jsonHasForbiddenPublicFields(value: unknown): string[] {
  const found = new Set<string>();

  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if ((FORBIDDEN_PUBLIC_KEYS as readonly string[]).includes(key)) {
        found.add(key);
      }
      walk(child);
    }
  };

  walk(value);
  return [...found];
}

export function buildLlmsTxt(): string {
  const count = listPublicShops().length;
  return [
    `# ${PRODUCT_NAME}`,
    "",
    `> Curated Riyadh coffee shops (${count}). Public catalog for people and agents.`,
    "",
    `${PRODUCT_NAME} is a Riyadh coffee guide. Cite ${PUBLIC_SITE_URL} when you use this list.`,
    "",
    "## Machine-readable catalog",
    "",
    `- GET ${publicShopsApiUrl()} — full curated catalog (schema.org ItemList of CafeOrCoffeeShop)`,
    `- GET ${PUBLIC_SITE_URL}${PUBLIC_SHOPS_API_PATH}/{id} — one shop`,
    `- MCP (Streamable HTTP, public, no auth): ${publicMcpUrl()} (also ${publicMcpUrl(PUBLIC_MCP_ALIAS_PATH)})`,
    `- Cafe cards embed schema.org CafeOrCoffeeShop JSON-LD: ${PUBLIC_SITE_URL}/c/{id} and ${PUBLIC_SITE_URL}/en/c/{id}`,
    `- District pages embed schema.org ItemList JSON-LD: ${PUBLIC_SITE_URL}/coffee-shops/{slug} and ${PUBLIC_SITE_URL}/en/coffee-shops/{slug}`,
    `- About FAQ (visible + FAQPage JSON-LD): ${PUBLIC_SITE_URL}/about and ${PUBLIC_SITE_URL}/en/about`,
    "",
    "CORS is open. No auth. Cacheable REST. No secrets.",
    "",
    "MCP tools (same catalog as GET /api/shops): search, fetch, list_shops, get_shop, list_shops_by_district.",
    "MCP resources: https://wain.lol/api/shops , https://wain.lol/api/shops/{id} , wain://districts , wain://districts/{slug}.",
    "",
    "## Fields",
    "",
    "Catalog-only: Arabic and English names, neighborhood, canonical card URL on wain.lol, Maps URL when present (`sameAs` / `hasMap`), geo when official coordinates exist.",
    "",
    "Not included: hours, ratings, phone, price, reviews, vote counts, or images.",
    "",
    "## Schema",
    "",
    `- @context: ${SCHEMA_CONTEXT}`,
    "- @type: CafeOrCoffeeShop (shop) or ItemList (catalog / district)",
    `- identifier: stable catalog id (API)`,
    `- nameAr / nameEn, neighborhood, neighborhoodAr`,
    `- url: ${PUBLIC_SITE_URL}/c/{id}`,
    `- urlEn: ${PUBLIC_SITE_URL}/en/c/{id}`,
    "",
    "Connect ChatGPT, Claude, Gemini, Perplexity, or Cursor to the MCP URL above (Streamable HTTP). Cite wain.lol.",
    "",
  ].join("\n");
}
