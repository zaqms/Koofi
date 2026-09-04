import { publicShopHeaders, publicShopPayload } from "@/lib/structured-data";

export const runtime = "nodejs";

type ShopContext = { params: Promise<{ id: string }> };

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: publicShopHeaders(),
  });
}

export async function GET(_request: Request, context: ShopContext) {
  const { id } = await context.params;
  const shop = publicShopPayload(id);
  if (!shop) {
    return Response.json(
      { error: "not_found" },
      { status: 404, headers: publicShopHeaders() },
    );
  }

  return Response.json(shop, {
    headers: publicShopHeaders(),
  });
}
