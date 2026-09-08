import {
  approveCookieHeader,
  approveTokenConfigured,
  clearApproveCookieHeader,
  tokenEquals,
} from "@/lib/claim-ops";
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

function sessionRedirect(err?: string): Response {
  const url = err
    ? `${OPS_CLAIMS_PATH}?err=${encodeURIComponent(err)}`
    : OPS_CLAIMS_PATH;
  return new Response(null, {
    status: 303,
    headers: { ...NO_STORE, Location: url },
  });
}

async function readToken(request: Request): Promise<{
  token?: string;
  logout: boolean;
}> {
  if (isFormRequest(request)) {
    const form = await request.formData();
    const action = String(form.get("action") ?? "");
    const token = String(form.get("token") ?? "").trim();
    return { token, logout: action === "logout" };
  }
  const body = (await request.json()) as { token?: unknown; action?: unknown };
  const token = typeof body.token === "string" ? body.token.trim() : "";
  return { token, logout: body.action === "logout" };
}

export async function POST(request: Request) {
  if (!approveTokenConfigured()) return denied();
  if (!allowRate(`claim-ops-session:${clientIp(request)}`, 8, 10 * 60 * 1000)) {
    if (isFormRequest(request)) return sessionRedirect("rate_limited");
    return Response.json({ ok: false, error: "rate_limited" }, { status: 429, headers: NO_STORE });
  }

  let parsed: { token?: string; logout: boolean };
  try {
    parsed = await readToken(request);
  } catch {
    if (isFormRequest(request)) return sessionRedirect("bad");
    return denied();
  }

  if (parsed.logout) {
    const headers = { ...NO_STORE, "Set-Cookie": clearApproveCookieHeader() };
    if (isFormRequest(request)) {
      return new Response(null, {
        status: 303,
        headers: { ...headers, Location: OPS_CLAIMS_PATH },
      });
    }
    return Response.json({ ok: true }, { headers });
  }

  if (!tokenEquals(parsed.token) || !parsed.token) {
    if (isFormRequest(request)) return sessionRedirect("bad");
    return denied();
  }

  const headers = {
    ...NO_STORE,
    "Set-Cookie": approveCookieHeader(parsed.token),
  };
  if (isFormRequest(request)) {
    return new Response(null, {
      status: 303,
      headers: { ...headers, Location: OPS_CLAIMS_PATH },
    });
  }
  return Response.json({ ok: true }, { headers });
}
