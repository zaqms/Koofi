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
