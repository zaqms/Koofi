import addedAtFile from "../data/catalog-added-at.json";
import catalogFile from "../data/catalog.json";
import popularityIndexFile from "../data/popularity-index.json";
import { DEFAULT_LIVE_CITY } from "./cities";
import { districtCity } from "./district-city";
import { officialShopCoords } from "./place-coords";
import { isExampleShop } from "./product";
import { shopMapsHref } from "./public-url";
import { effectivePopularityIndex } from "./tiktok-popularity";
import { NEIGHBORHOOD_IDS, type CatalogFile, type City, type NeighborhoodId, type Shop } from "./types";
import type { DirectoryShop } from "./directory";

export type { DirectoryShop } from "./directory";
export {
  directoryNeighborhoods,
  filterDirectoryShops,
  filterDirectoryShopsByMoment,
} from "./directory";

const catalog = catalogFile as CatalogFile;
const POPULARITY_INDEX = popularityIndexFile as Record<string, number>;
/**
 * First commit that introduced each shop id. See data/catalog-added-at.json.
 * Not baked onto catalog.json so shop merges do not have to touch hours/pins.
 */
const CATALOG_ADDED_AT = (
  addedAtFile as { addedAt: Record<string, string> }
).addedAt;

/**
 * Baked index from data/popularity-index.json, plus the TikTok bonus.
 * The index file stays untouched so a follower refresh cannot compound.
 * No baked index → the catalog row is unchanged (TikTok does not create a rank).
 */
function withBakedPopularity(shop: Shop): Shop {
  const popularityIndex = effectivePopularityIndex(
    POPULARITY_INDEX[shop.id],
    shop.id,
  );
  if (popularityIndex == null) return shop;
  return { ...shop, popularityIndex };
}

export function listShops(city: City = DEFAULT_LIVE_CITY): Shop[] {
  return catalog.shops
    .filter((shop) => shop.city === city)
    .map(withBakedPopularity);
}

export function getShop(id: string): Shop | undefined {
  return listRealShops().find((shop) => shop.id === id);
}

/** Stable CARD N° from catalog order. Padded, 1-based. */
export function shopCardNumber(id: string): string {
  const index = listRealShops().findIndex((shop) => shop.id === id);
  if (index < 0) return "00";
  return String(index + 1).padStart(2, "0");
}

export function listRealShops(city: City = DEFAULT_LIVE_CITY): Shop[] {
  return listShops(city).filter((shop) => !isExampleShop(shop));
}

export function isDriveThroughLane(
  shop: Pick<Shop, "catalogLane">,
): boolean {
  return shop.catalogLane === "drive-through";
}

/** Default specialty discovery — excludes Drive-through-lane additions. */
export function listDiscoveryShops(city: City = DEFAULT_LIVE_CITY): Shop[] {
  return listRealShops(city).filter((shop) => !isDriveThroughLane(shop));
}

export function realShopCount(): number {
  return listRealShops().length;
}

function neighborhoodOrder(id: NeighborhoodId): number {
  const index = NEIGHBORHOOD_IDS.indexOf(id);
  return index === -1 ? NEIGHBORHOOD_IDS.length : index;
}

function catalogAddedIndexById(): Map<string, number> {
  return new Map(listRealShops().map((shop, index) => [shop.id, index]));
}

function toDirectoryShops(shops: Shop[]): DirectoryShop[] {
  const added = catalogAddedIndexById();
  return shops
    .slice()
    .sort((a, b) => {
      const area = neighborhoodOrder(a.neighborhood) - neighborhoodOrder(b.neighborhood);
      if (area !== 0) return area;
      return a.nameEn.localeCompare(b.nameEn);
    })
    .map((shop) => {
      const coords = officialShopCoords(shop);
      return {
        id: shop.id,
        nameAr: shop.nameAr,
        nameEn: shop.nameEn,
        neighborhood: shop.neighborhood,
        neighborhoodAr: shop.neighborhoodAr,
        vibeTags: shop.vibeTags,
        momentTags: shop.momentTags,
        mapsHref: shopMapsHref(shop),
        photoUrl: shop.photoUrl,
        logoUrl: shop.logoUrl,
        catalogIndex: added.get(shop.id) ?? -1,
        addedAt: CATALOG_ADDED_AT[shop.id],
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      };
    });
}

/** Specialty directory used by default home, districts with specialty shops, chips. */
export function listDirectoryShops(city: City = DEFAULT_LIVE_CITY): DirectoryShop[] {
  return toDirectoryShops(listDiscoveryShops(city));
}

export function listAllDirectoryShops(city: City = DEFAULT_LIVE_CITY): DirectoryShop[] {
  return toDirectoryShops(listRealShops(city));
}

/** Unified Drive-through directory — specialty TAG rows + DT-lane additions. */
export function listDriveThroughDirectoryShops(): DirectoryShop[] {
  return toDirectoryShops(
    listRealShops().filter((shop) => shop.momentTags.includes("drive-through")),
  );
}

/**
 * Specialty shops in a district, or DT-lane shops when that district has
 * no default-catalog rows (so new DT-only districts still have a page).
 */
export function listDirectoryShopsForDistrict(
  district: NeighborhoodId,
): DirectoryShop[] {
  const city = districtCity(district);
  const specialty = listDirectoryShops(city).filter(
    (shop) => shop.neighborhood === district,
  );
  if (specialty.length > 0) return specialty;
  return listAllDirectoryShops(city).filter((shop) => shop.neighborhood === district);
}

/**
 * Neighborhood index: specialty catalog plus DT-lane shops that live in
 * districts with no specialty rows.
 */
export function listBrowseDirectoryShops(
  city: City = DEFAULT_LIVE_CITY,
): DirectoryShop[] {
  const specialty = listDirectoryShops(city);
  const specialtyDistricts = new Set(specialty.map((shop) => shop.neighborhood));
  const extra = listAllDirectoryShops(city).filter(
    (shop) => !specialtyDistricts.has(shop.neighborhood),
  );
  return [...specialty, ...extra];
}
