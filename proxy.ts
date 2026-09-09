import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { trackAICrawlerRequest } from "@datafast/ai-crawl";
import { LOCALE_HEADER, localeFromPathname } from "@/lib/locale";

/** Server-side DataFast AI crawler tracking. Separate from the browser script in layout. */
export function proxy(request: NextRequest, event: NextFetchEvent) {
  trackAICrawlerRequest(request, event, {
    websiteId: "dfid_qZyLQNdTVNdYA3lB44WTe",
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LOCALE_HEADER, localeFromPathname(request.nextUrl.pathname));
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Skip API/static/favicon. Keep robots.txt, llms.txt, and sitemaps trackable.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
