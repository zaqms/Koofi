import { NextResponse, type NextRequest } from "next/server";
import {
  cleanSearch,
  hasPlatformParams,
  isTrackerFreePathname,
  trackersAllowed,
} from "@/lib/analytics-redact";

/** Route handlers the matcher still sees (no HTML, no GTM): never redirect these. */
const NON_PAGE_RE =
  /^\/(?:go|og|mcp)(?:\/|$)|\/(?:opengraph-image|twitter-image|image)(?:\/|$)|\.[a-z0-9]+$/i;

/** A top-level page load (not an RSC fetch, prefetch, image or API call). */
export function isDocumentRequest(request: NextRequest): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (request.headers.has("rsc") || request.headers.has("next-router-prefetch")) return false;
  if (request.nextUrl.searchParams.has("_rsc")) return false;
  const dest = request.headers.get("sec-fetch-dest");
  if (dest) return dest === "document";
  return (request.headers.get("accept") ?? "").includes("text/html");
}

/**
 * Clean-URL redirect: a page request whose query has keys outside the
 * allowlist (lib/analytics-redact.ts) is 307'd to the same path with only
 * utm_* / click ids / `from` / `shop` kept, before any HTML, so GTM and
 * the pixels only ever load on a clean URL. Null when not applicable.
 */
export function cleanUrlRedirect(request: NextRequest): NextResponse | null {
  const { pathname, searchParams, search } = request.nextUrl;
  if (!search || trackersAllowed(pathname, searchParams)) return null;
  if (isTrackerFreePathname(pathname) || NON_PAGE_RE.test(pathname)) return null;
  if (hasPlatformParams(searchParams) || !isDocumentRequest(request)) return null;
  const target = request.nextUrl.clone();
  target.search = cleanSearch(searchParams);
  const response = NextResponse.redirect(target, 307);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
