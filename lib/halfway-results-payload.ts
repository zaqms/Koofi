import { haversineKm } from "./distance";
import type { ChatPick, Language, Pin } from "./types";

/** One café on a بيننا results screen — dataLayer + server webhook share this shape. */
export type HalfwayResultCafe = {
  name_ar: string;
  name_en: string;
  district: string;
  maps_url: string;
  distance_km?: number;
};

export type HalfwayResultCafeInput = {
  nameAr: string;
  nameEn: string;
  neighborhoodLabel?: string;
  mapsHref: string;
  lat?: number;
  lng?: number;
};

export function cafeInputFromChatPick(pick: ChatPick): HalfwayResultCafeInput {
  return {
    nameAr: pick.nameAr,
    nameEn: pick.nameEn,
    neighborhoodLabel: pick.neighborhoodLabel,
    mapsHref: pick.mapsHref,
    lat: pick.lat,
    lng: pick.lng,
  };
}

/** Mean of resolved pins. Empty when no usable coords — never invents a district. */
export function pinsMidpoint(
  pins: Array<Pin | null | undefined>,
): Pin | null {
  const ready: Pin[] = [];
  for (const pin of pins) {
    if (
      pin &&
      Number.isFinite(pin.lat) &&
      Number.isFinite(pin.lng)
    ) {
      ready.push(pin);
    }
  }
  if (ready.length === 0) return null;
  let lat = 0;
  let lng = 0;
  for (const pin of ready) {
    lat += pin.lat;
    lng += pin.lng;
  }
  return { lat: lat / ready.length, lng: lng / ready.length };
}

function roundKm(km: number): number {
  return Math.round(km * 10) / 10;
}

/**
 * Up to three cafés as just shown. No lat/lng, no Soft Places blurbs.
 * `district` is the locale-facing area already on the card.
 */
export function halfwayResultCafes(input: {
  picks: readonly HalfwayResultCafeInput[];
  midpoint?: Pin | null;
}): HalfwayResultCafe[] {
  return input.picks.slice(0, 3).map((pick) => {
    const cafe: HalfwayResultCafe = {
      name_ar: pick.nameAr,
      name_en: pick.nameEn,
      district: pick.neighborhoodLabel?.trim() ?? "",
      maps_url: pick.mapsHref,
    };
    if (
      input.midpoint &&
      pick.lat != null &&
      pick.lng != null &&
      Number.isFinite(pick.lat) &&
      Number.isFinite(pick.lng)
    ) {
      const km = haversineKm(input.midpoint, {
        lat: pick.lat,
        lng: pick.lng,
      });
      if (Number.isFinite(km) && km >= 0) {
        cafe.distance_km = roundKm(km);
      }
    }
    return cafe;
  });
}

export function halfwayResultCafesFromPicks(input: {
  picks: readonly ChatPick[];
  midpoint?: Pin | null;
}): HalfwayResultCafe[] {
  return halfwayResultCafes({
    picks: input.picks.map(cafeInputFromChatPick),
    midpoint: input.midpoint,
  });
}
