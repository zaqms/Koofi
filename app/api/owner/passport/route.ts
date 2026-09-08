import { updateVerifiedPassport } from "@/lib/claims";
import { allowRate, clientIp } from "@/lib/feedback";
import { validateOwnerToken } from "@/lib/owner-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

function tokenStatus(error: string): number {
  if (error === "no_storage") return 503;
  if (error === "not_verified") return 403;
  if (error === "expired" || error === "revoked" || error === "wrong_shop") {
    return 401;
  }
  if (error === "missing" || error === "not_found" || error === "invalid") {
    return 401;
  }
  return 400;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = await validateOwnerToken({
    shopId: url.searchParams.get("shop"),
    token: url.searchParams.get("token"),
  });
  if (!result.ok) {
    return Response.json(
      { ok: false, error: result.error },
      { status: tokenStatus(result.error), headers: NO_STORE },
    );
  }
  return Response.json(
    {
      ok: true,
      shopId: result.shopId,
      passport: result.passport,
      expiresAt: result.expiresAt,
    },
    { headers: NO_STORE },
  );
}

export async function POST(request: Request) {
  if (!allowRate(`owner-passport:${clientIp(request)}`, 20, 10 * 60 * 1000)) {
    return Response.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: NO_STORE },
    );
  }

  let body: { shop?: unknown; shopId?: unknown; token?: unknown; passport?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json(
      { ok: false, error: "missing" },
      { status: 400, headers: NO_STORE },
    );
  }

  const session = await validateOwnerToken({
    shopId: body.shop ?? body.shopId,
    token: body.token,
  });
  if (!session.ok) {
    return Response.json(
      { ok: false, error: session.error },
      { status: tokenStatus(session.error), headers: NO_STORE },
    );
  }

  const saved = await updateVerifiedPassport({
    shopId: session.shopId,
    passport: body.passport,
  });
  if (!saved.ok) {
    return Response.json(
      { ok: false, error: saved.error },
      { status: tokenStatus(saved.error), headers: NO_STORE },
    );
  }

  return Response.json(
    { ok: true, shopId: saved.shopId, passport: saved.passport },
    { headers: NO_STORE },
  );
}
