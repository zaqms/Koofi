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

/** Where the legacy handler 307s to. Keeps /en and the original query. */
export function legacyInviteRedirectTarget(input: {
  token: string;
  en: boolean;
  search: string;
  outcome: LegacyInviteOutcome;
}): string {
  const prefix = input.en ? "/en" : "";
  const query = new URLSearchParams(input.search.replace(/^\?/, ""));
  query.delete(LEGACY_DIRECT_PARAM);
  if (input.outcome.ok) {
    const qs = query.toString();
    return `${prefix}/h/${encodeURIComponent(input.outcome.id)}${qs ? `?${qs}` : ""}`;
  }
  if (input.outcome.reason === "expired") return `${prefix}/h/expired`;
  // No store / rate limited / bad: serve the old page as-is (no trackers).
  query.set(LEGACY_DIRECT_PARAM, "1");
  return `${prefix}/h/${encodeURIComponent(input.token)}?${query.toString()}`;
}
