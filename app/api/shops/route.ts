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

export function GET() {
  return Response.json(publicShopsItemList(), {
    headers: publicShopHeaders(),
  });
}
