import { canApproveClaims } from "@/lib/claim-ops";
import {
  grantVerifiedClaim,
  listPendingClaims,
  listVerifiedClaims,
  verifyPendingClaim,
} from "@/lib/claims";
import { allowRate, clientIp } from "@/lib/feedback";
import { mintOwnerToken, ownerEditHref, revokeOwnerTokens } from "@/lib/owner-tokens";
import { OPS_CLAIMS_PATH } from "@/lib/product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

function denied() {
  return new Response("not found", { status: 404, headers: NO_STORE });
}

function isFormRequest(request: Request): boolean {
  const type = request.headers.get("content-type") ?? "";
  return type.includes("form");
}

function opsRedirect(ok: boolean, detail: string, extra?: string): Response {
  const params = new URLSearchParams();
  params.set(ok ? "ok" : "err", detail);
  if (extra) params.set("link", extra);
  return new Response(null, {
    status: 303,
    headers: { ...NO_STORE, Location: `${OPS_CLAIMS_PATH}?${params.toString()}` },
  });
}

async function readBody(request: Request): Promise<{
  shopId?: unknown;
  action?: unknown;
}> {
  if (isFormRequest(request)) {
    const form = await request.formData();
    return { shopId: form.get("shopId"), action: form.get("action") };
  }
  return (await request.json()) as { shopId?: unknown; action?: unknown };
}

export async function GET(request: Request) {
  if (!canApproveClaims(request)) return denied();

  const pending = await listPendingClaims();
  const verified = await listVerifiedClaims();
  if (!pending.ok || !verified.ok) {
    return Response.json(
      { ok: false, error: "no_storage" },
      { status: 503, headers: NO_STORE },
    );
  }
  return Response.json(
    { ok: true, pending: pending.claims, verified: verified.claims },
    { headers: NO_STORE },
  );
}

export async function POST(request: Request) {
  if (!canApproveClaims(request)) return denied();
  if (!allowRate(`claim-ops:${clientIp(request)}`, 40, 10 * 60 * 1000)) {
    if (isFormRequest(request)) return opsRedirect(false, "rate_limited");
    return Response.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: NO_STORE },
    );
  }

  let body: { shopId?: unknown; action?: unknown };
  try {
    body = await readBody(request);
  } catch {
    if (isFormRequest(request)) return opsRedirect(false, "bad_action");
    return Response.json(
      { ok: false, error: "bad_action" },
      { status: 400, headers: NO_STORE },
    );
  }

  const action = typeof body.action === "string" ? body.action.trim() : "";
  const origin = new URL(request.url).origin;

  if (action === "verify") {
    const result = await verifyPendingClaim(body.shopId);
    if (!result.ok) {
      if (isFormRequest(request)) return opsRedirect(false, result.error);
      const status =
        result.error === "no_storage"
          ? 503
          : result.error === "not_pending"
            ? 409
            : 404;
      return Response.json(
        { ok: false, error: result.error },
        { status, headers: NO_STORE },
      );
    }
    if (isFormRequest(request)) return opsRedirect(true, "verify");
    return Response.json(
      { ok: true, shopId: result.shopId, status: result.status },
      { headers: NO_STORE },
    );
  }

  if (action === "grant") {
    const result = await grantVerifiedClaim(body.shopId);
    if (!result.ok) {
      if (isFormRequest(request)) return opsRedirect(false, result.error);
      const status = result.error === "no_storage" ? 503 : 404;
      return Response.json(
        { ok: false, error: result.error },
        { status, headers: NO_STORE },
      );
    }
    if (isFormRequest(request)) return opsRedirect(true, "grant");
    return Response.json(
      {
        ok: true,
        shopId: result.shopId,
        status: result.status,
        created: result.created,
      },
      { headers: NO_STORE },
    );
  }

  if (action === "revoke") {
    const result = await revokeOwnerTokens(body.shopId);
    if (!result.ok) {
      if (isFormRequest(request)) return opsRedirect(false, result.error);
      const status = result.error === "no_storage" ? 503 : 404;
      return Response.json(
        { ok: false, error: result.error },
        { status, headers: NO_STORE },
      );
    }
    if (isFormRequest(request)) return opsRedirect(true, "revoke");
    return Response.json(
      { ok: true, shopId: result.shopId, revoked: result.revoked },
      { headers: NO_STORE },
    );
  }

  if (action === "mint") {
    const result = await mintOwnerToken(body.shopId);
    if (!result.ok) {
      if (isFormRequest(request)) return opsRedirect(false, result.error);
      const status =
        result.error === "no_storage"
          ? 503
          : result.error === "not_verified"
            ? 409
            : 400;
      return Response.json(
        { ok: false, error: result.error },
        { status, headers: NO_STORE },
      );
    }
    const hrefAr = ownerEditHref(origin, result.shopId, result.token, "ar");
    const hrefEn = ownerEditHref(origin, result.shopId, result.token, "en");
    if (isFormRequest(request)) return opsRedirect(true, "mint", hrefAr);
    return Response.json(
      {
        ok: true,
        shopId: result.shopId,
        token: result.token,
        expiresAt: result.expiresAt,
        hrefAr,
        hrefEn,
        pathAr: result.pathAr,
        pathEn: result.pathEn,
      },
      { headers: NO_STORE },
    );
  }

  if (isFormRequest(request)) return opsRedirect(false, "bad_action");
  return Response.json(
    { ok: false, error: "bad_action" },
    { status: 400, headers: NO_STORE },
  );
}
