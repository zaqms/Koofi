import { requestClaimOtp } from "@/lib/claims";
import { allowRate, clientIp } from "@/lib/feedback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!allowRate(`claim-otp:${clientIp(request)}`, 8, 10 * 60 * 1000)) {
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: { shopId?: unknown; phone?: unknown };
  try {
    body = (await request.json()) as { shopId?: unknown; phone?: unknown };
  } catch {
    return Response.json({ ok: false, error: "bad_phone" }, { status: 400 });
  }

  const result = await requestClaimOtp({
    shopId: body.shopId,
    phone: body.phone,
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
    phone: result.phone,
    configured: result.configured,
    stub: result.stub,
    ...(result.stub
      ? {
          stubCode: result.stubCode,
          hint: "WhatsApp Cloud API is not configured. Stub OTP for preview.",
        }
      : {}),
  });
}
