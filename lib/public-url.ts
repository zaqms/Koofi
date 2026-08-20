export function publicOrigin(): string | null {
  const raw = process.env.KOOFI_PUBLIC_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export function cardPath(id: string): string {
  return `/c/${encodeURIComponent(id)}`;
}

export function cardHref(id: string): string {
  const origin = publicOrigin();
  const path = cardPath(id);
  return origin ? `${origin}${path}` : path;
}

export function mapsHref(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
