import { listDiscoveryShops } from "./catalog";
import { cityLabel, DEFAULT_LIVE_CITY } from "./cities";
import { districtsInCity } from "./district-city";
import { formatDistanceKm, haversineKm } from "./distance";
import { neighborhoodCentroid } from "./neighborhood-tight";
import { neighborhoodLabel } from "./neighborhoods";
import type { City, Language, NeighborhoodId, Pin } from "./types";

/** Catalog حي snap for labels only — never shown as lat,lng. */
const PLACE_SNAP_KM = 8;

/**
 * Cheap Riyadh city-speed estimate. Not traffic, not Soft Places.
 * Display-only on بيننا cards when both pins exist.
 */
const RIYADH_DRIVE_KMH = 26;

export function nearestNeighborhoodFromPin(
  pin: Pin,
  shops = listDiscoveryShops(),
  maxKm = PLACE_SNAP_KM,
  city: City = DEFAULT_LIVE_CITY,
): NeighborhoodId | null {
  let best: { id: NeighborhoodId; km: number } | null = null;
  for (const id of districtsInCity(city)) {
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
  city: City = DEFAULT_LIVE_CITY,
): string {
  const cityName = cityLabel(city, language);
  if (!pin) return cityName;
  const id = nearestNeighborhoodFromPin(pin, listDiscoveryShops(city), PLACE_SNAP_KM, city);
  if (!id) return cityName;
  const area = neighborhoodLabel(id, language);
  return language === "ar" ? `${area}، ${cityName}` : `${area}, ${cityName}`;
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

/** Both submitted areas — AR uses a bullet, EN a middot. Never coordinates. */
export function formatHalfwayLocationLine(
  me: Pin | null | undefined,
  friend: Pin | null | undefined,
  language: Language,
): string {
  const labels = [
    formatHalfwayPlaceLabel(me, language),
    formatHalfwayPlaceLabel(friend, language),
  ].filter((label, index, rows) => Boolean(label) && rows.indexOf(label) === index);
  return labels.join(language === "ar" ? " • " : " · ");
}

/** Compact card meta: `10 km · Al Rihaniyah` / `10 كم · الرمانية`. */
export function formatHalfwayShopMeta(
  neighborhood: string,
  shop: Pin | null | undefined,
  origin: Pin | null | undefined,
  language: Language,
): string {
  const area = neighborhood.trim();
  if (!shop || !origin) return area;
  const km = haversineKm(origin, shop);
  const distance = formatDistanceKm(km, language);
  if (!distance) return area;
  return area ? `${distance} · ${area}` : distance;
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
