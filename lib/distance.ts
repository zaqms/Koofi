import type { Language, Pin } from "./types";

const EARTH_KM = 6371;

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance in kilometers. */
export function haversineKm(from: Pin, to: Pin): number {
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Display-only. Arabic `1.2 كم`, English `1.2 km`. */
export function formatDistanceKm(km: number, language: Language): string {
  if (!Number.isFinite(km) || km < 0) return "";
  const label = km < 9.95 ? km.toFixed(1) : String(Math.round(km));
  return language === "ar" ? `${label} كم` : `${label} km`;
}
