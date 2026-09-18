import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { trackAICrawlerRequest } from "@datafast/ai-crawl";
import { LOCALE_HEADER, localeFromPathname } from "@/lib/locale";

/**
 * Next.js proxy matcher. /sitemap.xml is the committed public file — skip it
 * so Googlebot/GSC never wait on a cold middleware invoke (or a DataFast throw).
 */
export const PROXY_MATCHER =
  "/((?!api|_next/static|_next/image|favicon.ico|sitemap\\.xml).*)";

/** Server-side DataFast AI crawler tracking. Separate from the browser script in layout. */
export function proxy(request: NextRequest, event: NextFetchEvent) {
  try {
    trackAICrawlerRequest(request, event, {
      websiteId: "dfid_qZyLQNdTVNdYA3lB44WTe",
    });
  } catch {
    // Tracking must never 500 a crawler or visitor request.
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, localeFromPathname(request.nextUrl.pathname));
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Skip API/static/favicon and the CDN sitemap. robots.txt + llms.txt stay trackable.
  matcher: [PROXY_MATCHER],
};
