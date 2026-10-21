import { catalogViewFromQuery } from "@/lib/catalog";
import {
  publicShopHeaders,
  publicShopsItemList,
} from "@/lib/structured-data";

export const runtime = "nodejs";

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: publicShopHeaders(),
  });
}

export function GET(request: Request) {
  const view = catalogViewFromQuery(new URL(request.url).searchParams.get("view"));
  return Response.json(publicShopsItemList(view), {
    headers: publicShopHeaders(),
  });
}
