import {
  ResourceNotFoundError,
  ResourceTemplate,
  type McpServer,
} from "@modelcontextprotocol/server";
import { z } from "zod";
import { directoryNeighborhoods } from "./directory";
import { isNeighborhoodId, NEIGHBORHOODS, neighborhoodLabel } from "./neighborhoods";
import { PRODUCT_NAME, PUBLIC_SITE_URL } from "./product";
import {
  districtCanonicalUrl,
  jsonHasForbiddenPublicFields,
  listPublicShops,
  publicShopPayload,
  publicShopRecord,
  publicShopsApiUrl,
  publicShopsInDistrict,
  publicShopsItemList,
  SCHEMA_CONTEXT,
} from "./structured-data";
import { NEIGHBORHOOD_IDS, type NeighborhoodId, type Shop } from "./types";

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const searchOutputSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      url: z.string(),
    }),
  ),
});

const fetchOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  url: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

const notFoundSchema = z.object({
  error: z.literal("not_found"),
});

function assertPublicPayload(value: unknown): void {
  const forbidden = jsonHasForbiddenPublicFields(value);
  if (forbidden.length) {
    throw new Error(`forbidden public fields: ${forbidden.join(", ")}`);
  }
  if (/Koofi/i.test(JSON.stringify(value))) {
    throw new Error("public payload must not say Koofi");
  }
}

function jsonToolResult<T extends Record<string, unknown>>(
  value: T,
  options?: { isError?: boolean },
) {
  assertPublicPayload(value);
  const text = JSON.stringify(value);
  return {
    content: [{ type: "text" as const, text }],
    structuredContent: value,
    ...(options?.isError ? { isError: true as const } : {}),
  };
}

function shopTitle(shop: Shop): string {
  return `${shop.nameEn} / ${shop.nameAr}`;
}

function shopCitationUrl(shop: Shop): string {
  return `${PUBLIC_SITE_URL}/c/${shop.id}`;
}

/** Directory-order catalog filter. No ranking, scores, or vibe picker. */
export function searchPublicShops(query: string): Shop[] {
  const shops = listPublicShops();
  const trimmed = query.trim();
  if (!trimmed) return shops;

  const needle = trimmed.toLowerCase();
  const districts = new Set<NeighborhoodId>();

  for (const place of Object.values(NEIGHBORHOODS)) {
    if (place.id === needle) {
      districts.add(place.id);
      continue;
    }
    if (place.ar === trimmed || place.en.toLowerCase() === needle) {
      districts.add(place.id);
      continue;
    }
    if (place.aliases.some((alias) => alias.toLowerCase() === needle)) {
      districts.add(place.id);
    }
  }

  return shops.filter((shop) => {
    if (districts.has(shop.neighborhood)) return true;
    if (shop.id.toLowerCase().includes(needle)) return true;
    if (shop.nameEn.toLowerCase().includes(needle)) return true;
    if (shop.nameAr.includes(trimmed) || shop.nameAr.toLowerCase().includes(needle)) {
      return true;
    }
    if (shop.neighborhoodAr.includes(trimmed)) return true;
    return false;
  });
}

export function searchShopResults(query: string) {
  return {
    results: searchPublicShops(query).map((shop) => ({
      id: shop.id,
      title: shopTitle(shop),
      url: shopCitationUrl(shop),
    })),
  };
}

export function fetchShopDocument(id: string) {
  const shop = listPublicShops().find((row) => row.id === id);
  const payload = publicShopPayload(id);
  if (!shop || !payload) return null;

  return {
    id: shop.id,
    title: shopTitle(shop),
    text: JSON.stringify(payload),
    url: shopCitationUrl(shop),
    metadata: {
      source: publicShopsApiUrl(shop.id),
      identifier: shop.id,
      neighborhood: shop.neighborhood,
      neighborhoodAr: shop.neighborhoodAr,
    },
  };
}

export function publicDistrictCatalog(district: NeighborhoodId) {
  const shops = publicShopsInDistrict(district);
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "ItemList" as const,
    name: `${PRODUCT_NAME} curated Riyadh coffee shops`,
    url: districtCanonicalUrl(district, "ar"),
    numberOfItems: shops.length,
    itemListElement: shops.map((shop, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      item: publicShopRecord(shop, { includeContext: false }),
    })),
  };
}

export function listPublicDistrictSummaries() {
  const present = new Set(listPublicShops().map((shop) => shop.neighborhood));
  return NEIGHBORHOOD_IDS.filter((id) => present.has(id)).map((id) => ({
    id,
    neighborhood: id,
    neighborhoodAr: neighborhoodLabel(id, "ar"),
    neighborhoodEn: neighborhoodLabel(id, "en"),
    url: districtCanonicalUrl(id, "ar"),
    urlEn: districtCanonicalUrl(id, "en"),
    numberOfItems: publicShopsInDistrict(id).length,
  }));
}

function districtIds(): NeighborhoodId[] {
  return directoryNeighborhoods(
    listPublicShops().map((shop) => ({ neighborhood: shop.neighborhood })),
  );
}

export function registerWainMcpCatalog(server: McpServer): void {
  server.registerTool(
    "search",
    {
      title: "Search shops",
      description:
        "Search the wain.lol curated Riyadh coffee catalog by shop name, catalog id, or district (Arabic or English). Same shops as GET https://wain.lol/api/shops, in directory order — not ranked. Returns ChatGPT-compatible { results: [{ id, title, url }] }. Cite the url. Prefer list_shops / get_shop when you want the full schema.org records.",
      inputSchema: z.object({
        query: z
          .string()
          .describe("Shop name, catalog id, or Riyadh district (e.g. الملقا, Al Malqa)."),
      }),
      outputSchema: searchOutputSchema,
      annotations: READ_ONLY,
    },
    async ({ query }) => jsonToolResult(searchShopResults(query)),
  );

  server.registerTool(
    "fetch",
    {
      title: "Fetch shop",
      description:
        "Fetch one wain.lol shop by catalog id (from search). Same object as GET https://wain.lol/api/shops/{id}, wrapped for citation. Unknown id returns { error: \"not_found\" }.",
      inputSchema: z.object({
        id: z.string().describe("Catalog shop id, e.g. ik-coffee-downtown."),
      }),
      outputSchema: z.union([fetchOutputSchema, notFoundSchema]),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      const document = fetchShopDocument(id);
      if (!document) {
        return jsonToolResult({ error: "not_found" as const }, { isError: true });
      }
      return jsonToolResult(document);
    },
  );

  server.registerTool(
    "list_shops",
    {
      title: "List shops",
      description:
        "Return the full curated catalog. Identical to GET https://wain.lol/api/shops: schema.org ItemList of CafeOrCoffeeShop. Catalog-only fields. No hours, ratings, phone, price, reviews, images, or votes.",
      inputSchema: z.object({}),
      annotations: READ_ONLY,
    },
    async () => jsonToolResult(publicShopsItemList()),
  );

  server.registerTool(
    "get_shop",
    {
      title: "Get shop",
      description:
        "Return one shop. Identical to GET https://wain.lol/api/shops/{id}. Unknown id returns { error: \"not_found\" }.",
      inputSchema: z.object({
        id: z.string().describe("Catalog shop id."),
      }),
      annotations: READ_ONLY,
    },
    async ({ id }) => {
      const shop = publicShopPayload(id);
      if (!shop) {
        return jsonToolResult({ error: "not_found" as const }, { isError: true });
      }
      return jsonToolResult(shop);
    },
  );

  server.registerTool(
    "list_shops_by_district",
    {
      title: "List shops by district",
      description:
        "Return the curated shops in one Riyadh district, same records as GET https://wain.lol/api/shops filtered to that neighborhood. district is the catalog slug (al-malqa, hittin, olaya, …).",
      inputSchema: z.object({
        district: z
          .string()
          .describe("Neighborhood slug, e.g. al-malqa, hittin, olaya."),
      }),
      annotations: READ_ONLY,
    },
    async ({ district }) => {
      if (!isNeighborhoodId(district)) {
        return jsonToolResult({ error: "not_found" as const }, { isError: true });
      }
      return jsonToolResult(publicDistrictCatalog(district));
    },
  );

  server.registerResource(
    "shops",
    publicShopsApiUrl(),
    {
      title: `${PRODUCT_NAME} curated catalog`,
      description:
        "Full curated Riyadh coffee catalog. Same JSON as GET /api/shops.",
      mimeType: "application/ld+json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/ld+json",
          text: JSON.stringify(publicShopsItemList()),
        },
      ],
    }),
  );

  server.registerResource(
    "shop",
    new ResourceTemplate(`${publicShopsApiUrl()}/{id}`, {
      list: async () => ({
        resources: listPublicShops().map((shop) => ({
          uri: publicShopsApiUrl(shop.id),
          name: shop.id,
          title: shopTitle(shop),
          description: `${shop.neighborhoodAr} / ${neighborhoodLabel(shop.neighborhood, "en")}`,
          mimeType: "application/ld+json",
        })),
      }),
      complete: {
        id: (value) =>
          listPublicShops()
            .map((shop) => shop.id)
            .filter((id) => id.toLowerCase().startsWith(value.toLowerCase())),
      },
    }),
    {
      title: "One shop",
      description: "One catalog shop. Same JSON as GET /api/shops/{id}.",
      mimeType: "application/ld+json",
    },
    async (uri, variables) => {
      const id = String(variables.id ?? "");
      const shop = publicShopPayload(id);
      if (!shop) {
        throw new ResourceNotFoundError(uri.href, `Unknown shop: ${id}`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/ld+json",
            text: JSON.stringify(shop),
          },
        ],
      };
    },
  );

  server.registerResource(
    "districts",
    "wain://districts",
    {
      title: "Districts",
      description:
        "Riyadh districts that have curated shops, with counts. Shop records still come from /api/shops.",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({ districts: listPublicDistrictSummaries() }),
        },
      ],
    }),
  );

  server.registerResource(
    "district",
    new ResourceTemplate("wain://districts/{slug}", {
      list: async () => ({
        resources: districtIds().map((slug) => ({
          uri: `wain://districts/${slug}`,
          name: slug,
          title: `${neighborhoodLabel(slug, "en")} / ${neighborhoodLabel(slug, "ar")}`,
          mimeType: "application/ld+json",
        })),
      }),
      complete: {
        slug: (value) =>
          districtIds().filter((id) => id.startsWith(value.toLowerCase())),
      },
    }),
    {
      title: "District shops",
      description:
        "Curated shops in one district. Same CafeOrCoffeeShop records as /api/shops.",
      mimeType: "application/ld+json",
    },
    async (uri, variables) => {
      const slug = String(variables.slug ?? "");
      if (!isNeighborhoodId(slug)) {
        throw new ResourceNotFoundError(uri.href, `Unknown district: ${slug}`);
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/ld+json",
            text: JSON.stringify(publicDistrictCatalog(slug)),
          },
        ],
      };
    },
  );
}
