import { resolveCatalogShopFromMapsInput } from "@/lib/claim-resolve";
import { allowRate, clientIp } from "@/lib/feedback";
import { shopDisplayName } from "@/lib/product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!allowRate(`claim-resolve:${clientIp(request)}`, 20, 10 * 60 * 1000)) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: { mapsUrl?: unknown };
  try {
    body = (await request.json()) as { mapsUrl?: unknown };
  } catch {
    return Response.json({ ok: false, error: "bad_url" }, { status: 400 });
  }

  const raw = typeof body.mapsUrl === "string" ? body.mapsUrl : "";
  const result = await resolveCatalogShopFromMapsInput(raw);
  if (result.reason === "bad_url") {
    return Response.json({ ok: false, error: "bad_url" }, { status: 400 });
  }
  if (result.reason === "need_pick" || !result.shop) {
    return Response.json({ ok: false, error: "need_pick" }, { status: 404 });
  }

  return Response.json({
    ok: true,
    shopId: result.shop.id,
    nameAr: result.shop.nameAr,
    nameEn: result.shop.nameEn,
    labelAr: shopDisplayName(result.shop, "ar"),
    labelEn: shopDisplayName(result.shop, "en"),
  });
}
