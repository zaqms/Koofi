import { clientIp } from "@/lib/feedback";
import {
  LEGACY_LANG_HEADER,
  LEGACY_SEARCH_HEADER,
  legacyInviteRedirectTarget,
} from "@/lib/halfway-invite-legacy";
import { migrateLegacyHalfwayInvite } from "@/lib/halfway-invite-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reached only via the proxy rewrite of a legacy `/h/{base64-coords}`
 * page request. Answers 307 to `/h/{randomId}` before any HTML (and so
 * any analytics tag) is served for the old URL.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  // Set by proxy.ts (it overwrites any client-sent value).
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
