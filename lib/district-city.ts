import { DEFAULT_LIVE_CITY } from "./cities";
import { NEIGHBORHOOD_IDS, type City, type NeighborhoodId } from "./types";

/**
 * Structured district → city map. Every live حي is Riyadh today.
 * Never infer city from a district name string — read this field
 * (or `shop.city`) instead.
 */
export const DISTRICT_CITY = Object.fromEntries(
  NEIGHBORHOOD_IDS.map((id) => [id, DEFAULT_LIVE_CITY]),
) as Record<NeighborhoodId, City>;

export function districtCity(id: NeighborhoodId): City {
  return DISTRICT_CITY[id];
}

export function districtsInCity(city: City): NeighborhoodId[] {
  return NEIGHBORHOOD_IDS.filter((id) => DISTRICT_CITY[id] === city);
}

export function shopMatchesDistrictCity(shop: {
  city: City;
  neighborhood: NeighborhoodId;
}): boolean {
  return shop.city === districtCity(shop.neighborhood);
}
