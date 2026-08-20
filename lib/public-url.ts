import { ENV_KEYS, readEnv } from "./env";
import { cardPath } from "./product";

export { cardPath };

export function publicOrigin(): string | null {
  const raw = readEnv(ENV_KEYS.KOOFI_PUBLIC_URL);
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export function cardHref(id: string): string {
  const origin = publicOrigin();
  const path = cardPath(id);
  return origin ? `${origin}${path}` : path;
}

export function mapsHref(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
