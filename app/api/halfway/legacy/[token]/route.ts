import { clientIp } from "@/lib/feedback";
import {
  isLegacyInviteToken,
  LEGACY_LANG_HEADER,
  LEGACY_SEARCH_HEADER,
  legacyInviteRedirectTarget,
} from "@/lib/halfway-invite-legacy";
import { migrateLegacyHalfwayInvite } from "@/lib/halfway-invite-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reached via the proxy rewrite of a legacy `/h/{base64-coords}` page
 * request (or directly, see below). Answers 307 to `/h/{randomId}`
 * before any HTML (and so any analytics tag) is served for the old URL.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  // /api is outside the proxy matcher, so this route can be hit directly:
  // validate the token shape, and treat both headers as untrusted input
  // (lang is en|ar only; the search header is allowlisted + length-capped
  // in legacyInviteRedirectTarget). Targets are always relative /h/ paths.
  if (!isLegacyInviteToken(token)) {
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
    });
  }
  const en = request.headers.get(LEGACY_LANG_HEADER) === "en";
  const search = request.headers.get(LEGACY_SEARCH_HEADER) ?? "";
  let outcome: Awaited<ReturnType<typeof migrateLegacyHalfwayInvite>>;
  try {
    outcome = await migrateLegacyHalfwayInvite(token, { ip: clientIp(request) });
  } catch {
    outcome = { ok: false, reason: "missing" };
  }
  const location = legacyInviteRedirectTarget({ token, en, search, outcome });
  return new Response(null, {
    status: 307,
    headers: {
      Location: location,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
