/**
 * Analytics hygiene for بيننا invite URLs and query strings.
 *
 * Rule (r2): GTM, the pixels inside it (X, OpenAI, Google Ads) and the
 * DataFast browser script load only on a clean URL, and (#251) only after
 * the visitor accepts in the cookie banner. Clean means:
 *  - not a tracker-free path (`/h/*` invites, `/owner/edit` magic links,
 *    `/ops/*`), and
 *  - every query key is an ad-attribution key (utm_*, gclid, …) or a
 *    page key we know carries no personal data (`from`, `shop`).
 * Those tags read document.location / document.referrer themselves, so
 * a dirty URL can't be redacted from code. Instead the proxy 307s a
 * dirty page request to its clean URL (server redirect), the layout
 * skips the tags on anything still dirty, and the inline bootstrap below
 * re-checks in the browser and turns in-app navigations to a dirty URL
 * into full loads. Pages that aren't clean send Referrer-Policy
 * strict-origin, so the next page's referrer is the origin only.
 *
 * GA4 / Vercel Analytics / dataLayer URLs: `/h/{id}` → `/h/[invite]`,
 * invite URLs lose their query, other pages keep only utm_* / click ids
 * / `from`. Referrers always lose their query.
 */

export const INVITE_PLACEHOLDER = "[invite]";

/** Request header the proxy sets so the root layout can skip trackers. */
export const TRACKERS_HEADER = "x-wain-trackers";

/** Ad attribution keys kept in the URL and in GA4 page_location. */
export const ATTRIBUTION_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "gbraid",
  "wbraid",
  "gad_source",
  "dclid",
  "fbclid",
  "twclid",
  "ttclid",
  "msclkid",
] as const;

/** Query keys our pages read that carry no personal data. */
export const SAFE_PAGE_PARAMS = ["from", "shop"] as const;

/** Next.js RSC fetch marker. Never in a document URL; ignored for cleanliness. */
const NEUTRAL_PARAMS = ["_rsc"] as const;

/** Vercel preview / protection params: never stripped (the platform reads them). */
const PLATFORM_PARAM_RE = /^(_vercel|x-vercel)/i;

const CLEAN_KEYS = new Set<string>([...ATTRIBUTION_PARAMS, ...SAFE_PAGE_PARAMS, ...NEUTRAL_PARAMS]);
const ANALYTICS_KEYS = new Set<string>([...ATTRIBUTION_PARAMS, "from"]);

const INVITE_PATH_RE = /^(\/en)?\/h\/[^/?#]+/;
const INVITE_PAGE_RE = /^(\/en)?\/h(\/|$)/;
/** No GTM / pixels / DataFast here, ever: the URL itself is private. */
const TRACKER_FREE_RE = /^(?:(\/en)?\/h(\/|$)|(\/en)?\/owner\/edit(\/|$)|\/ops(\/|$))/;

/** `/h`, `/h/…`, `/en/h`, `/en/h/…`. */
export function isInvitePathname(pathname: string): boolean {
  return INVITE_PAGE_RE.test(pathname);
}

/** Invite pages, owner magic-link pages and ops: trackers never load. */
export function isTrackerFreePathname(pathname: string): boolean {
  return TRACKER_FREE_RE.test(pathname);
}

function toParams(search: string | URLSearchParams): URLSearchParams {
  return typeof search === "string" ? new URLSearchParams(search.replace(/^\?/, "")) : search;
}

/** Every key is attribution / safe page / neutral. */
export function hasOnlyCleanParams(search: string | URLSearchParams): boolean {
  for (const key of toParams(search).keys()) {
    if (!CLEAN_KEYS.has(key)) return false;
  }
  return true;
}

/** True when the query carries Vercel platform params (never strip those). */
export function hasPlatformParams(search: string | URLSearchParams): boolean {
  for (const key of toParams(search).keys()) {
    if (PLATFORM_PARAM_RE.test(key)) return true;
  }
  return false;
}

/** Query with only clean keys kept, as `?a=b` or "". */
export function cleanSearch(search: string | URLSearchParams): string {
  const out = new URLSearchParams();
  for (const [key, value] of toParams(search)) {
    if (CLEAN_KEYS.has(key) && key !== "_rsc") out.append(key, value);
  }
  const qs = out.toString();
  return qs ? `?${qs}` : "";
}

/** GTM, the pixels and DataFast may load on this URL. */
export function trackersAllowed(pathname: string, search: string | URLSearchParams = ""): boolean {
  return !isTrackerFreePathname(pathname) && hasOnlyCleanParams(search);
}

export function redactAnalyticsPath(pathname: string): string {
  return pathname.replace(INVITE_PATH_RE, `$1/h/${INVITE_PLACEHOLDER}`);
}

/**
 * Absolute URLs keep origin + redacted path; relative paths stay relative.
 * Invite URLs drop the whole query; other pages keep only utm_* / click
 * ids / `from` (unless `query: "none"`, used for referrers). The hash is
 * always dropped. Unparseable input → "".
 */
export function redactAnalyticsUrl(
  raw: string,
  base = "https://wain.lol",
  options: { query?: "attribution" | "none" } = {},
): string {
  const value = raw.trim();
  if (!value) return "";
  try {
    const absolute = /^[a-z][a-z0-9+.-]*:/i.test(value);
    const url = new URL(value, base);
    const path = redactAnalyticsPath(url.pathname);
    let qs = "";
    if (options.query !== "none" && !isTrackerFreePathname(url.pathname)) {
      const kept = new URLSearchParams();
      for (const [key, val] of url.searchParams) {
        if (ANALYTICS_KEYS.has(key)) kept.append(key, val);
      }
      qs = kept.toString();
    }
    const tail = `${path}${qs ? `?${qs}` : ""}`;
    return absolute ? `${url.origin}${tail}` : tail;
  } catch {
    return "";
  }
}

/** Referrer: redacted path, never a query. */
export function redactAnalyticsReferrer(raw: string, base = "https://wain.lol"): string {
  return redactAnalyticsUrl(raw, base, { query: "none" });
}

const INVITE_ID_KEYS = new Set(["pack_id", "session_id", "invite_id"]);

function looksLikeUrlOrPath(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.startsWith("/");
}

/**
 * Custom dataLayer params: invite ids on بيننا events become `[invite]`;
 * any top-level URL/path value is redacted (attribution query only).
 */
export function redactAnalyticsParams<T extends Record<string, unknown>>(
  name: string,
  params: T | undefined,
): T | undefined {
  if (!params) return params;
  const halfway = name.startsWith("meet_halfway") || params.kind === "halfway";
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (halfway && INVITE_ID_KEYS.has(key) && typeof value === "string" && value) {
      out[key] = INVITE_PLACEHOLDER;
      continue;
    }
    if (typeof value === "string" && looksLikeUrlOrPath(value)) {
      out[key] = redactAnalyticsUrl(value);
      continue;
    }
    out[key] = value;
  }
  return out as T;
}

const js = (value: unknown) => JSON.stringify(value);

/**
 * Inline <head> script, after the consent bootstrap (lib/consent.ts) and
 * before CONSENT_AUTOLOAD_SCRIPT (plain ES5, runs before any tag).
 * Fail-closed: the consent bootstrap's __wainLoadGtm loads GTM only if
 * this sets `window.__wainTrackers = true` (and only after Accept). It
 * also exposes `window.__wainRedactSet` so the Accept-time dataLayer
 * reset can re-apply page_location before GTM loads.
 *  - Dirty URL (tracker-free path, or a query key outside the allowlist):
 *    `__wainTrackers = false`, nothing else runs. The proxy normally
 *    307s these first; this covers anything that slipped through.
 *  - Clean URL: gtag('set') page_location (attribution kept) / page_path
 *    / page_referrer (no query), all with /h/{id} → /h/[invite].
 *  - pushState / replaceState to a dirty URL becomes a full load
 *    (assign / replace), so the server redirect or the tracker-free
 *    layout applies; clean in-app navigations re-set page_location.
 */
export const ANALYTICS_REDACT_BOOTSTRAP = `(function(){var w=window;w.__wainTrackers=false;try{var d=document,h=w.history,C=${js([
  ...CLEAN_KEYS,
])},A=${js([...ANALYTICS_KEYS])},F=${TRACKER_FREE_RE.toString()},I=${INVITE_PATH_RE.toString()};w.dataLayer=w.dataLayer||[];function g(){w.dataLayer.push(arguments)}function U(u){try{return new URL(u,w.location.href)}catch(e){return null}}function dirty(u){var x=U(u);if(!x||F.test(x.pathname))return true;var bad=false;x.searchParams.forEach(function(v,k){if(C.indexOf(k)<0)bad=true});return bad}function loc(u,q){var x=U(u);if(!x)return"";var p=x.pathname.replace(I,"$1/h/[invite]"),s="";if(q&&!F.test(x.pathname)){var k=new URLSearchParams();x.searchParams.forEach(function(v,n){if(A.indexOf(n)>=0)k.append(n,v)});s=k.toString();if(s)s="?"+s}return x.origin+p+s}function set(u){var l=loc(u||w.location.href,true);if(!l)return;var p={page_location:l,page_path:U(l).pathname};if(d.referrer)p.page_referrer=loc(d.referrer,false);g("set",p)}if(dirty(w.location.href))return;set();["pushState","replaceState"].forEach(function(k){var o=h[k];if(typeof o!=="function")return;h[k]=function(st,t,u){if(u!=null){var n=String(u);if(dirty(n)){if(k==="replaceState")w.location.replace(n);else w.location.assign(n);return}set(n)}return o.apply(this,arguments)}});w.__wainRedactSet=function(){set()};w.__wainTrackers=true}catch(e){w.__wainTrackers=false}})();`;

