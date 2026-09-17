import { copy } from "./copy";
import { formatDistanceKm, haversineKm } from "./distance";
import { isRiyadhPlacePin } from "./place-coords";
import type { Language, Pin } from "./types";

export type ShopDistanceDisplay =
  | { kind: "hidden"; label: "" }
  | { kind: "km"; label: string; km: number }
  | { kind: "missing"; label: string };

function isWgs84Pin(pin: Pin | null | undefined): pin is Pin {
  if (!pin) return false;
  return (
    Number.isFinite(pin.lat) &&
    Number.isFinite(pin.lng) &&
    Math.abs(pin.lat) <= 90 &&
    Math.abs(pin.lng) <= 180
  );
}

/**
 * Nearby distance slot. Hidden until visitor geo is ready.
 * When ready: km if Riyadh place geometry exists, otherwise an honest fallback.
 * Never silently omit the slot once location is known.
 */
export function shopDistanceDisplay(input: {
  origin: Pin | null;
  coords: Pin | null | undefined;
  language: Language;
}): ShopDistanceDisplay {
  if (!isWgs84Pin(input.origin)) return { kind: "hidden", label: "" };

  const shop = isRiyadhPlacePin(input.coords) ? input.coords : null;
  if (shop) {
    const km = haversineKm(input.origin, shop);
    const label = formatDistanceKm(km, input.language);
    if (label) return { kind: "km", label, km };
  }

  return {
    kind: "missing",
    label: copy.directoryDistanceUnavailable[input.language],
  };
}
