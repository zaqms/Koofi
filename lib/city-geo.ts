import type { CityId } from "./cities";
import { isUsableVisitorOrigin } from "./place-coords";
import type { Pin } from "./types";

/**
 * Metro box used only to assign a visitor fix to a registry city.
 * Not a district boundary and not a shop pin.
 *
 * Riyadh matches `isRiyadhPlacePin` (greater Riyadh). Jeddah and Dammam
 * are separate so a fix there cannot fall through into Riyadh.
 * Boxes do not overlap; non-Riyadh cities are tested first anyway.
 */
export const CITY_METRO_BOX: Record<
  CityId,
  { latMin: number; latMax: number; lngMin: number; lngMax: number }
> = {
  jeddah: { latMin: 21.15, latMax: 22.05, lngMin: 39.0, lngMax: 39.45 },
  dammam: { latMin: 26.15, latMax: 26.55, lngMin: 49.85, lngMax: 50.3 },
  riyadh: { latMin: 23.2, latMax: 26.8, lngMin: 45.3, lngMax: 48.5 },
};

const CITY_MATCH_ORDER: readonly CityId[] = ["jeddah", "dammam", "riyadh"];

function pinInBox(
  pin: Pin,
  box: (typeof CITY_METRO_BOX)[CityId],
): boolean {
  return (
    pin.lat >= box.latMin &&
    pin.lat <= box.latMax &&
    pin.lng >= box.lngMin &&
    pin.lng <= box.lngMax
  );
}

/**
 * Registry city containing a usable visitor fix.
 * Null when the fix is missing, unusable, or outside every metro box
 * (Abha, for example). Never guesses Riyadh.
 */
export function cityIdFromPin(pin: Pin | null | undefined): CityId | null {
  if (!isUsableVisitorOrigin(pin)) return null;
  for (const id of CITY_MATCH_ORDER) {
    if (pinInBox(pin, CITY_METRO_BOX[id])) return id;
  }
  return null;
}
