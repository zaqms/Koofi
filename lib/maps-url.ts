const MAPS_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "google.com",
  "www.google.com",
  "maps.google.com",
  "www.maps.google.com",
]);

const URL_IN_TEXT = /https?:\/\/[^\s<>"']+/gi;
const PREVIEW_HREF =
  /(?:href|src)="((?:https?:\/\/(?:www\.)?google\.com)?\/maps\/preview\/place[^"]+)"/i;
const HTML_LIMIT = 48_000;

const MAPS_FETCH_HEADERS = {
  Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
  "User-Agent": "Mozilla/5.0",
} as const;

export function isAllowedMapsHost(host: string): boolean {
  return MAPS_HOSTS.has(host.toLowerCase());
}

export function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

export function isMapsUrl(value: string): boolean {
  const url = parseHttpUrl(value);
  if (!url || !isAllowedMapsHost(url.host)) return false;
  if (url.host.endsWith("google.com")) {
    return (
      url.pathname.includes("/maps") ||
      url.host.startsWith("maps.") ||
      url.searchParams.has("q") ||
      url.searchParams.has("ftid") ||
      url.searchParams.has("cid") ||
      url.searchParams.has("ll")
    );
  }
  return true;
}

export function extractMapsUrl(text: string): string | null {
  const trimmed = text.trim();
  if (isMapsUrl(trimmed)) return parseHttpUrl(trimmed)?.toString() ?? trimmed;

  const matches = trimmed.match(URL_IN_TEXT) ?? [];
  for (const match of matches) {
    const cleaned = match.replace(/[),.]+$/, "");
    if (isMapsUrl(cleaned)) return parseHttpUrl(cleaned)?.toString() ?? cleaned;
  }
  return null;
}

export function looksLikeHttpUrl(text: string): boolean {
  return /https?:\/\//i.test(text) || /\bwww\./i.test(text);
}

async function fetchGoogleMaps(url: string): Promise<Response | null> {
  const parsed = parseHttpUrl(url);
  if (!parsed || !isAllowedMapsHost(parsed.host)) return null;
  try {
    return await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: MAPS_FETCH_HEADERS,
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return null;
  }
}

/** Follow Google Maps short links, including `?g_st=ic` iOS share URLs. */
export async function followGoogleRedirects(start: string): Promise<string> {
  let current = start;
  const seen = new Set<string>();

  for (let i = 0; i < 5; i += 1) {
    if (seen.has(current)) break;
    seen.add(current);

    const response = await fetchGoogleMaps(current);
    if (!response) break;

    const location = response.headers.get("location");
    if (!location) break;

    try {
      const next = new URL(location, current).toString();
      if (!isAllowedMapsHost(new URL(next).host)) break;
      current = next;
    } catch {
      break;
    }
  }

  return current;
}

/** Google's own `/maps/preview/place` href from a Maps HTML shell. */
export function extractMapsPreviewHref(html: string): string | null {
  const match = html.match(PREVIEW_HREF);
  if (!match?.[1]) return null;
  return match[1].replace(/&amp;/g, "&");
}

/** Google hosts only. Reads enough HTML to find the preview place link. */
export async function fetchGoogleMapsHtml(url: string): Promise<string | null> {
  const response = await fetchGoogleMaps(url);
  if (!response || !response.ok) return null;
  try {
    const raw = await response.text();
    return raw.slice(0, HTML_LIMIT);
  } catch {
    return null;
  }
}
