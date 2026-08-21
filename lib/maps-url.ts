const MAPS_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
  "google.com",
  "www.google.com",
  "maps.google.com",
  "www.maps.google.com",
]);

const URL_IN_TEXT = /https?:\/\/[^\s<>"']+/gi;

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
      url.searchParams.has("q")
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

/** Follow Google Maps short links. Google hosts only. Does not scrape the page. */
export async function followGoogleRedirects(start: string): Promise<string> {
  let current = start;
  const seen = new Set<string>();

  for (let i = 0; i < 5; i += 1) {
    if (seen.has(current)) break;
    seen.add(current);

    const parsed = parseHttpUrl(current);
    if (!parsed || !isAllowedMapsHost(parsed.host)) break;

    let response: Response;
    try {
      response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        headers: { Accept: "text/html" },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      break;
    }

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
