/**
 * Analytics redaction for بيننا invite URLs and query strings.
 *
 * `/h/{id}` and `/en/h/{id}` become `/h/[invite]` / `/en/h/[invite]`,
 * and every query string + hash is dropped, before a URL reaches GA4
 * (gtag `set` page_location / page_path / page_referrer), the GTM
 * dataLayer (custom params), Vercel Web Analytics (beforeSend) or the
 * server-side DataFast crawler hook. Pages under /h/* do not load GTM or
 * the DataFast browser script at all (see app/layout.tsx + proxy.ts):
 * tags inside the GTM container (X / OpenAI pixels) and DataFast read
 * document.location directly and cannot be redacted from code.
 */

export const INVITE_PLACEHOLDER = "[invite]";

/** Request header the proxy sets so the root layout can skip trackers. */
export const TRACKERS_HEADER = "x-wain-trackers";

const INVITE_PATH_RE = /^(\/en)?\/h\/[^/?#]+/;
const INVITE_PAGE_RE = /^(\/en)?\/h(\/|$)/;

/** `/h`, `/h/…`, `/en/h`, `/en/h/…` — no trackers on these pages. */
export function isInvitePathname(pathname: string): boolean {
  return INVITE_PAGE_RE.test(pathname);
}

export function redactAnalyticsPath(pathname: string): string {
  return pathname.replace(INVITE_PATH_RE, `$1/h/${INVITE_PLACEHOLDER}`);
}

/**
 * Absolute URLs keep origin + redacted path. Relative paths stay relative.
 * Query string and hash are always dropped. Unparseable input → "".
 */
export function redactAnalyticsUrl(raw: string, base = "https://wain.lol"): string {
  const value = raw.trim();
  if (!value) return "";
  try {
    const absolute = /^[a-z][a-z0-9+.-]*:/i.test(value);
    const url = new URL(value, base);
    const path = redactAnalyticsPath(url.pathname);
    return absolute ? `${url.origin}${path}` : path;
  } catch {
    return "";
  }
}

const INVITE_ID_KEYS = new Set(["pack_id", "session_id", "invite_id"]);

function looksLikeUrlOrPath(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.startsWith("/");
}

/**
 * Custom dataLayer params: invite ids on بيننا events become `[invite]`;
 * any top-level URL/path value is redacted and loses its query string.
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

/**
 * Inline <head> script, before the GTM snippet. Same rules as above in
 * plain ES5 so it runs before any tag:
 *  - gtag('set') page_location / page_path / page_referrer (redacted,
 *    no query) via the dataLayer, re-set on every pushState/replaceState
 *    so in-app navigations report the clean URL too;
 *  - an in-app navigation INTO /h/* becomes a full document load, so the
 *    invite page loads without GTM (tags that read document.location
 *    never see the invite path).
 */
export const ANALYTICS_REDACT_BOOTSTRAP = `(function(){try{var w=window,d=document,h=w.history;w.dataLayer=w.dataLayer||[];w.__wainTrackers=true;function g(){w.dataLayer.push(arguments)}function c(u){try{var x=new URL(u,w.location.href);return x.origin+x.pathname.replace(/^(\\/en)?\\/h\\/[^\\/?#]+/,"$1/h/[invite]")}catch(e){return""}}function s(u){var l=c(u||w.location.href);if(!l)return;var p={page_location:l,page_path:new URL(l).pathname};if(d.referrer)p.page_referrer=c(d.referrer);g("set",p)}function inv(u){try{return/^(\\/en)?\\/h(\\/|$)/.test(new URL(u,w.location.href).pathname)}catch(e){return false}}s();["pushState","replaceState"].forEach(function(k){var o=h[k];if(typeof o!=="function")return;h[k]=function(st,t,u){if(u!=null){var n=String(u);if(inv(n)&&!inv(w.location.href)){w.location.assign(n);return}s(n)}return o.apply(this,arguments)}})}catch(e){}})();`;
