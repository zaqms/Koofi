import { copy } from "./copy";
import { formatDistanceKm, haversineKm } from "./distance";
import type { Language, Pin } from "./types";

export type ShopDistanceDisplay =
  | { kind: "hidden"; label: "" }
  | { kind: "km"; label: string }
  | { kind: "missing"; label: string };

/**
 * Nearby distance slot. Hidden until visitor geo is ready.
 * When ready: km if place geometry exists, otherwise an honest fallback.
 * Never silently omit the slot once location is known.
 */
export function shopDistanceDisplay(input: {
  origin: Pin | null;
  coords: Pin | null | undefined;
  language: Language;
}): ShopDistanceDisplay {
  if (!input.origin) return { kind: "hidden", label: "" };

  if (input.coords) {
    const label = formatDistanceKm(haversineKm(input.origin, input.coords), input.language);
    if (label) return { kind: "km", label };
  }

  return {
    kind: "missing",
    label: copy.directoryDistanceUnavailable[input.language],
  };
}
