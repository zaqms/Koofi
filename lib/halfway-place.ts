import { listRealShops } from "./catalog";
import { copy } from "./copy";
import { haversineKm } from "./distance";
import { neighborhoodCentroid } from "./neighborhood-tight";
import { neighborhoodLabel } from "./neighborhoods";
import { NEIGHBORHOOD_IDS, type Language, type NeighborhoodId, type Pin } from "./types";

/** Catalog حي snap for labels only — never shown as lat,lng. */
const PLACE_SNAP_KM = 8;

/**
 * Cheap Riyadh city-speed estimate. Not traffic, not Soft Places.
 * Display-only on بيننا cards when both pins exist.
 */
const RIYADH_DRIVE_KMH = 26;

export function nearestNeighborhoodFromPin(
  pin: Pin,
  shops = listRealShops(),
  maxKm = PLACE_SNAP_KM,
): NeighborhoodId | null {
  let best: { id: NeighborhoodId; km: number } | null = null;
  for (const id of NEIGHBORHOOD_IDS) {
    const center = neighborhoodCentroid(id, shops);
    if (!center) continue;
    const km = haversineKm(pin, center);
    if (km > maxKm) continue;
    if (!best || km < best.km) best = { id, km };
  }
  return best?.id ?? null;
}

/** "حطين، الرياض" / "Hittin, Riyadh" — never coordinates. */
export function formatHalfwayPlaceLabel(
  pin: Pin | null | undefined,
  language: Language,
): string {
  const city = copy.meetHalfwayCity[language];
  if (!pin) return city;
  const id = nearestNeighborhoodFromPin(pin);
  if (!id) return city;
  const area = neighborhoodLabel(id, language);
  return language === "ar" ? `${area}، ${city}` : `${area}, ${city}`;
}

export function estimateDriveMinutes(from: Pin, to: Pin): number {
  const km = haversineKm(from, to);
  if (!Number.isFinite(km) || km < 0) return 0;
  return Math.max(1, Math.round((km / RIYADH_DRIVE_KMH) * 60));
}

export function formatDriveMinutes(minutes: number, language: Language): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  return language === "ar" ? `${minutes} د` : `${minutes} min`;
}

export function pinFromHalfwayInput(row: {
  lat?: number;
  lng?: number;
} | null | undefined): Pin | null {
  if (
    !row ||
    typeof row.lat !== "number" ||
    typeof row.lng !== "number" ||
    !Number.isFinite(row.lat) ||
    !Number.isFinite(row.lng)
  ) {
    return null;
  }
  return { lat: row.lat, lng: row.lng };
}
