import { ENV_KEYS, readEnv } from "./env";
import { neighborhoodLabel } from "./neighborhoods";
import { cardPath } from "./product";
import type { Language, Pin, Shop } from "./types";

export { cardPath };

export function publicOrigin(): string | null {
  const raw = readEnv(ENV_KEYS.KOOFI_PUBLIC_URL);
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export function cardHref(id: string, language: Language = "ar"): string {
  const origin = publicOrigin();
  const path = cardPath(id, language);
  return origin ? `${origin}${path}` : path;
}

export function mapsHref(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

export function shopMapsHref(
  shop: Pick<Shop, "nameEn" | "neighborhood" | "pin" | "mapsShareUrl">,
): string {
  if (shop.mapsShareUrl) return shop.mapsShareUrl;
  if (shop.pin) return mapsHref(shop.pin.lat, shop.pin.lng);
  const query = `${shop.nameEn} ${neighborhoodLabel(shop.neighborhood, "en")} Riyadh`;
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
}

export function shopLocation(
  shop: Pick<Shop, "nameAr" | "nameEn" | "neighborhood" | "neighborhoodAr" | "pin">,
): (Pin & { name: string; address: string }) | null {
  if (!shop.pin) return null;
  return {
    ...shop.pin,
    name: shop.nameEn,
    address: `${shop.neighborhoodAr} · ${neighborhoodLabel(shop.neighborhood, "en")}, Riyadh`,
  };
}
