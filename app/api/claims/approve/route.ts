import { listPendingClaims, reviewShopClaim } from "@/lib/claims";
import { canApproveClaims } from "@/lib/claim-ops";
import { allowRate, clientIp } from "@/lib/feedback";
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

async function readBody(
  request: Request,
): Promise<{ shopId?: unknown; action?: unknown }> {
  if (isFormRequest(request)) {
    const form = await request.formData();
    return { shopId: form.get("shopId"), action: form.get("action") };
  }
  return (await request.json()) as { shopId?: unknown; action?: unknown };
}

function reviewRedirect(ok: boolean, detail: string): Response {
  const url = `${OPS_CLAIMS_PATH}?${ok ? "ok" : "err"}=${encodeURIComponent(detail)}`;
  return new Response(null, {
    status: 303,
    headers: { ...NO_STORE, Location: url },
  });
}

export async function GET(request: Request) {
  if (!canApproveClaims(request)) return denied();

  const result = await listPendingClaims();
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 503, headers: NO_STORE });
  }
  return Response.json({ ok: true, claims: result.claims }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  if (!canApproveClaims(request)) return denied();
  if (!allowRate(`claim-approve:${clientIp(request)}`, 40, 10 * 60 * 1000)) {
    if (isFormRequest(request)) return reviewRedirect(false, "rate_limited");
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429, headers: NO_STORE });
  }

  let body: { shopId?: unknown; action?: unknown };
  try {
    body = await readBody(request);
  } catch {
    if (isFormRequest(request)) return reviewRedirect(false, "bad_action");
    return Response.json({ ok: false, error: "bad_action" }, { status: 400, headers: NO_STORE });
  }

  const result = await reviewShopClaim({
    shopId: body.shopId,
    action: body.action,
  });
  if (!result.ok) {
    const status =
      result.error === "no_storage"
        ? 503
        : result.error === "not_found"
          ? 404
          : result.error === "not_pending"
            ? 409
            : 400;
    if (isFormRequest(request)) return reviewRedirect(false, result.error);
    return Response.json({ ok: false, error: result.error }, { status, headers: NO_STORE });
  }

  if (isFormRequest(request)) return reviewRedirect(true, result.action);
  return Response.json(
    {
      ok: true,
      shopId: result.shopId,
      status: result.status,
      action: result.action,
    },
    { headers: NO_STORE },
  );
}
