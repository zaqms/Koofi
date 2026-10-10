import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { trackAICrawlerRequest } from "@datafast/ai-crawl";
import { LOCALE_HEADER, localeFromPathname } from "@/lib/locale";
import { cleanUrlRedirect } from "@/lib/clean-url-redirect";
import {
  isInvitePathname,
  redactAnalyticsReferrer,
  redactAnalyticsUrl,
  trackersAllowed,
  TRACKERS_HEADER,
} from "@/lib/analytics-redact";
import {
  LEGACY_DIRECT_PARAM,
  LEGACY_INVITE_ROUTE,
  LEGACY_LANG_HEADER,
  LEGACY_SEARCH_HEADER,
  matchLegacyInvitePath,
} from "@/lib/halfway-invite-legacy";

/** DataFast crawler beacon with /h/{id} redacted and no query string. */
const redactedDataFastFetch: typeof fetch = (input, init) => {
  if (typeof init?.body === "string") {
    try {
      const body = JSON.parse(init.body) as { href?: unknown; referrer?: unknown };
      if (typeof body.href === "string") body.href = redactAnalyticsUrl(body.href);
      if (typeof body.referrer === "string") {
        body.referrer = redactAnalyticsReferrer(body.referrer) || null;
      }
      return fetch(input, { ...init, body: JSON.stringify(body) });
    } catch {
      // fall through with the original body
    }
  }
  return fetch(input, init);
};

/** Server-side DataFast AI crawler tracking. Separate from the browser script in layout. */
export function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname, searchParams, search } = request.nextUrl;
  const invitePage = isInvitePathname(pathname);

  // Legacy coordinate-bearing invite → 307 to /h/{randomId} from the
  // route handler, before any HTML / analytics for the old URL.
  const legacy =
    invitePage && !searchParams.has(LEGACY_DIRECT_PARAM)
      ? matchLegacyInvitePath(pathname)
      : null;
  if (legacy) {
    const target = request.nextUrl.clone();
    target.pathname = `${LEGACY_INVITE_ROUTE}/${legacy.token}`;
    target.search = "";
    const legacyHeaders = new Headers(request.headers);
    legacyHeaders.set(LEGACY_LANG_HEADER, legacy.en ? "en" : "ar");
    legacyHeaders.set(LEGACY_SEARCH_HEADER, search);
    return NextResponse.rewrite(target, { request: { headers: legacyHeaders } });
  }

  const redirect = cleanUrlRedirect(request);
  if (redirect) return redirect;

  const clean = trackersAllowed(pathname, searchParams);
  if (clean) {
    try {
      trackAICrawlerRequest(request, event, {
        websiteId: "dfid_qZyLQNdTVNdYA3lB44WTe",
        fetch: redactedDataFastFetch,
      });
    } catch {
      // Tracking must never 500 a crawler or visitor request.
    }
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, localeFromPathname(pathname));
  // Root layout loads GTM + DataFast only on a clean URL (never trust the
  // client's value: this always overwrites it).
  requestHeaders.set(TRACKERS_HEADER, clean ? "on" : "off");
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  if (!clean) {
    // Links / navigations out of a private URL carry only the origin.
    response.headers.set("Referrer-Policy", "strict-origin");
  }
  return response;
}

export const config = {
  // Skip API/static/favicon and the CDN sitemap. Next requires a static
  // matcher string — do not extract it to a const. robots.txt + llms.txt
  // stay trackable. /sitemap.xml is public/sitemap.xml (no cold proxy).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|sitemap\\.xml).*)"],
};
