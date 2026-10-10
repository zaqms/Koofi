/**
 * Legacy `/h/{base64-coords}` links → `/h/{randomId}`.
 *
 * proxy.ts rewrites a legacy-shaped invite path to the legacy route
 * handler before any page HTML (and so before GTM / DataFast) is served;
 * the handler mints or looks up the random-id session and answers 307.
 * Dependency-free so the proxy bundle stays small.
 */

/** Set on the 307 fallback so the proxy renders the old page (no trackers). */
export const LEGACY_DIRECT_PARAM = "legacy";

export const LEGACY_INVITE_ROUTE = "/api/halfway/legacy";

/** Proxy → legacy handler: original locale + query (a rewrite keeps the old URL). */
export const LEGACY_LANG_HEADER = "x-wain-legacy-lang";
export const LEGACY_SEARCH_HEADER = "x-wain-legacy-search";

/** `{base64url}.{checksum}` — random ids never contain a dot. */
const LEGACY_INVITE_PATH_RE = /^(\/en)?\/h\/([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)\/?$/;
const LEGACY_TOKEN_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export function matchLegacyInvitePath(
  pathname: string,
): { token: string; en: boolean } | null {
  const match = pathname.match(LEGACY_INVITE_PATH_RE);
  if (!match) return null;
  return { token: match[2], en: Boolean(match[1]) };
}

export type LegacyInviteOutcome =
  | { ok: true; id: string }
  | { ok: false; reason: "bad" | "expired" | "missing" | "rate_limited" };

/** Longest legacy token we accept (real ones are ~100-200 chars). */
export const LEGACY_TOKEN_MAX = 600;

/** Token shape the legacy route accepts (it is reachable without the proxy). */
export function isLegacyInviteToken(token: string): boolean {
  return token.length <= LEGACY_TOKEN_MAX && LEGACY_TOKEN_RE.test(token);
}

/** Query keys a legacy redirect carries over: the share marker + attribution. */
const LEGACY_KEEP_PARAMS = new Set([
  "from",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
]);
const LEGACY_SEARCH_MAX = 512;

/**
 * The `x-wain-legacy-search` header is client-controlled when the route
 * is hit directly, so only short, allowlisted keys survive.
 */
export function sanitizeLegacySearch(search: string): URLSearchParams {
  const out = new URLSearchParams();
  if (search.length > LEGACY_SEARCH_MAX) return out;
  for (const [key, value] of new URLSearchParams(search.replace(/^\?/, ""))) {
    if (LEGACY_KEEP_PARAMS.has(key) && value.length <= 64 && !out.has(key)) out.set(key, value);
  }
  return out;
}

/** Where the legacy handler 307s to. Keeps /en and the allowlisted query. */
export function legacyInviteRedirectTarget(input: {
  token: string;
  en: boolean;
  search: string;
  outcome: LegacyInviteOutcome;
}): string {
  const prefix = input.en ? "/en" : "";
  const query = sanitizeLegacySearch(input.search);
  if (input.outcome.ok) {
    const qs = query.toString();
    return `${prefix}/h/${encodeURIComponent(input.outcome.id)}${qs ? `?${qs}` : ""}`;
  }
  if (input.outcome.reason === "expired") return `${prefix}/h/expired`;
  // No store / rate limited / bad: serve the old page as-is (no trackers).
  query.set(LEGACY_DIRECT_PARAM, "1");
  return `${prefix}/h/${encodeURIComponent(input.token)}?${query.toString()}`;
}
