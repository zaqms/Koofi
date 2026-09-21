import { copy } from "./copy";
import { formatDistanceKm, haversineKm } from "./distance";
import { isRiyadhPlacePin, isUsableVisitorOrigin } from "./place-coords";
import type { Language, Pin } from "./types";

/** City-scale Nearby only. Absurd hops (Jeddah→Riyadh) stay a shop-side fallback. */
export const MAX_NEARBY_DISPLAY_KM = 200;

export type VisitorDistanceStatus = "pending" | "ready" | "unavailable" | "denied";

export type ShopDistanceDisplay =
  | { kind: "hidden"; label: "" }
  | { kind: "km"; label: string; km: number }
  | { kind: "missing"; label: string }
  | { kind: "permission"; label: string };

function shopPinFallback(language: Language): ShopDistanceDisplay {
  return {
    kind: "missing",
    label: copy.directoryDistanceUnavailable[language],
  };
}

function unreadOrigin(language: Language): ShopDistanceDisplay {
  return {
    kind: "permission",
    label: copy.directoryDistanceUnread[language],
  };
}

/** Numeric strings still count. A non-finite or out-of-gate fix does not. */
export function usableVisitorOrigin(pin: Pin | null | undefined): Pin | null {
  if (pin == null) return null;
  const lat = typeof pin.lat === "number" ? pin.lat : Number(pin.lat);
  const lng = typeof pin.lng === "number" ? pin.lng : Number(pin.lng);
  const next = { lat, lng };
  return isUsableVisitorOrigin(next) ? next : null;
}

/**
 * Nearby distance slot.
 * Hidden until a visitor read settles.
 * `permission` is a visitor-origin failure (denied, unread, or rejected by
 * `isUsableVisitorOrigin`) — never the shop-pin string.
 * `missing` is only an official shop pin that failed `isRiyadhPlacePin`
 * or a hop over `MAX_NEARBY_DISPLAY_KM`, after the visitor origin passed.
 * Soft Places stays parked — shop side is official place geometry only.
 */
export function shopDistanceDisplay(input: {
  origin: Pin | null;
  coords: Pin | null | undefined;
  language: Language;
}): ShopDistanceDisplay {
  if (input.origin == null) return { kind: "hidden", label: "" };
  const origin = usableVisitorOrigin(input.origin);
  if (!origin) return unreadOrigin(input.language);

  const shop = isRiyadhPlacePin(input.coords) ? input.coords : null;
  if (shop) {
    const km = haversineKm(origin, shop);
    if (Number.isFinite(km) && km >= 0 && km <= MAX_NEARBY_DISPLAY_KM) {
      const label = formatDistanceKm(km, input.language);
      if (label) return { kind: "km", label, km };
    }
  }

  return shopPinFallback(input.language);
}

/** Card slot from the shared visitor snapshot. Pending stays blank. */
export function shopDistanceForVisitor(input: {
  status: VisitorDistanceStatus;
  lat?: number;
  lng?: number;
  coords: Pin | null | undefined;
  language: Language;
}): ShopDistanceDisplay {
  if (input.status === "pending") return { kind: "hidden", label: "" };
  if (input.status === "denied") {
    return {
      kind: "permission",
      label: copy.directoryDistancePermission[input.language],
    };
  }
  if (input.status !== "ready") return unreadOrigin(input.language);
  return shopDistanceDisplay({
    origin: { lat: input.lat ?? Number.NaN, lng: input.lng ?? Number.NaN },
    coords: input.coords,
    language: input.language,
  });
}
