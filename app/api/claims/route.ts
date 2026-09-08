import { allowRate, clientIp } from "@/lib/feedback";
import {
  listPublicVerifiedIds,
  publicClaimStatus,
  submitShopClaim,
} from "@/lib/claims";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shopId = url.searchParams.get("shopId");
  if (!shopId) {
    const list = await listPublicVerifiedIds();
    return Response.json(list);
  }
  const result = await publicClaimStatus(shopId);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 404 });
  }
  return Response.json(result);
}

export async function POST(request: Request) {
  if (!allowRate(`claim:${clientIp(request)}`, 8, 10 * 60 * 1000)) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: {
    shopId?: unknown;
    phone?: unknown;
    code?: unknown;
    proofType?: unknown;
    proofName?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false, error: "not_found" }, { status: 400 });
  }

  const result = await submitShopClaim({
    shopId: body.shopId,
    phone: body.phone,
    code: body.code,
    proofType: body.proofType,
    proofName: body.proofName,
  });
  if (!result.ok) {
    const status =
      result.error === "no_storage"
        ? 503
        : result.error === "not_found"
          ? 404
          : result.error === "already_claimed"
            ? 409
            : 400;
    return Response.json({ ok: false, error: result.error }, { status });
  }

  return Response.json({
    ok: true,
    shopId: result.shopId,
    status: result.status,
    stub: result.stub,
  });
}
