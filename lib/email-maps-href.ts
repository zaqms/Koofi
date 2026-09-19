import { isMapsShortlink, parseHttpUrl } from "./maps-url";
import { PUBLIC_SITE_URL } from "./product";

/**
 * First-party Maps hop for بيننا results email hrefs.
 * Gmail wraps google.com destinations as `google.com/url?q=…` and then
 * warns on a second google.com host. Product Maps buttons stay unchanged.
 */
export const EMAIL_MAPS_PATH = "/go/maps";

export function isRawGoogleMapsHref(value: string): boolean {
  const url = parseHttpUrl(value);
  if (!url) return false;
  const host = url.host.toLowerCase();
  return (
    host === "google.com" ||
    host === "www.google.com" ||
    host === "maps.google.com" ||
    host === "www.maps.google.com"
  );
}

export function emailMapsShopHref(shopId: string): string {
  return `${PUBLIC_SITE_URL}${EMAIL_MAPS_PATH}?shop=${encodeURIComponent(shopId)}`;
}

export function emailMapsPinHref(lat: number, lng: number): string {
  return `${PUBLIC_SITE_URL}${EMAIL_MAPS_PATH}?lat=${lat}&lng=${lng}`;
}

/**
 * Prefer an existing Maps shortlink. Else a wain.lol /go/maps hop that
 * 302s onto Maps. Last resort keeps the incoming href.
 */
export function emailMapsHref(input: {
  existing?: string;
  shopId?: string;
  lat?: number;
  lng?: number;
}): string {
  const existing = input.existing?.trim();
  if (existing && isMapsShortlink(existing)) return existing;
  const shopId = input.shopId?.trim();
  if (shopId) return emailMapsShopHref(shopId);
  if (
    input.lat != null &&
    input.lng != null &&
    Number.isFinite(input.lat) &&
    Number.isFinite(input.lng)
  ) {
    return emailMapsPinHref(input.lat, input.lng);
  }
  return existing ?? "";
}
