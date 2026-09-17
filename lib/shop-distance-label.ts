import { copy } from "./copy";
import { formatDistanceKm, haversineKm } from "./distance";
import { isRiyadhPlacePin, isUsableVisitorOrigin } from "./place-coords";
import type { Language, Pin } from "./types";

/** City-scale Nearby only. Absurd hops (Null Island, Jeddah→Riyadh) stay hidden as fallback. */
export const MAX_NEARBY_DISPLAY_KM = 200;

export type ShopDistanceDisplay =
  | { kind: "hidden"; label: "" }
  | { kind: "km"; label: string; km: number }
  | { kind: "missing"; label: string };

function fallback(language: Language): ShopDistanceDisplay {
  return {
    kind: "missing",
    label: copy.directoryDistanceUnavailable[language],
  };
}

/**
 * Nearby distance slot. Hidden until visitor geo is ready.
 * When a browser position exists: km if Riyadh place geometry exists and
 * the visitor origin is usable KSA geo, otherwise an honest fallback.
 * Never silently omit the slot once a position object exists.
 * Never paint 5-digit km from Null Island / non-KSA origins.
 */
export function shopDistanceDisplay(input: {
  origin: Pin | null;
  coords: Pin | null | undefined;
  language: Language;
}): ShopDistanceDisplay {
  if (input.origin == null) return { kind: "hidden", label: "" };
  if (!isUsableVisitorOrigin(input.origin)) return fallback(input.language);

  const shop = isRiyadhPlacePin(input.coords) ? input.coords : null;
  if (shop) {
    const km = haversineKm(input.origin, shop);
    if (
      Number.isFinite(km) &&
      km >= 0 &&
      km <= MAX_NEARBY_DISPLAY_KM
    ) {
      const label = formatDistanceKm(km, input.language);
      if (label) return { kind: "km", label, km };
    }
  }

  return fallback(input.language);
}
