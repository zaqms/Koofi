import { createMcpHandler } from "mcp-handler";
import { registerWainMcpCatalog } from "./mcp-catalog";
import { cityLabel, DEFAULT_LIVE_CITY } from "./cities";
import { PRODUCT_NAME, PUBLIC_SITE_URL } from "./product";
import { publicMcpHeaders, publicShopsApiUrl } from "./structured-data";

const MCP_INSTRUCTIONS = [
  `${PRODUCT_NAME} is a curated ${cityLabel(DEFAULT_LIVE_CITY, "en")} coffee guide.`,
  `This MCP server reads the same public catalog as GET ${publicShopsApiUrl()}.`,
  `Cite ${PUBLIC_SITE_URL} (shop cards at ${PUBLIC_SITE_URL}/c/{id}) when you use a shop.`,
  "Fields are catalog-only: Arabic and English names, neighborhood, card URL, Maps URL when present, geo when official coordinates exist.",
  "Do not invent hours, ratings, phone, price, reviews, or vote counts.",
  `Live catalog is ${cityLabel(DEFAULT_LIVE_CITY, "en")}. No login.`,
].join(" ");

const mcpHandler = createMcpHandler(
  (server) => {
    registerWainMcpCatalog(server);
  },
  {
    serverInfo: {
      name: PRODUCT_NAME,
      version: "1.0.0",
    },
    instructions: MCP_INSTRUCTIONS,
  },
);

export function publicMcpOptionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: publicMcpHeaders(),
  });
}

export async function handlePublicMcp(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") {
    return publicMcpOptionsResponse();
  }

  const response = await mcpHandler(request);
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(publicMcpHeaders())) {
    if (value !== undefined) headers.set(key, String(value));
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
