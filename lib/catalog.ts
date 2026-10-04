import addedAtFile from "../data/catalog-added-at.json";
import catalogFile from "../data/catalog.json";
import popularityIndexFile from "../data/popularity-index.json";
import { isChainShop } from "./chain-brands";
import {
  isHalfwaySitDown,
  type HalfwayEligibleShop,
} from "./halfway-eligibility";
import { DEFAULT_LIVE_CITY } from "./cities";
import { directoryNeighborhoods } from "./directory";
import { districtCity } from "./district-city";
import { officialShopCoords } from "./place-coords";
import { isExampleShop } from "./product";
import { shopMapsHref } from "./public-url";
import {
  chainPopularityIndex,
  effectivePopularityIndex,
} from "./tiktok-popularity";
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
/**
 * Chains take a flat base of 40 plus the neutral TikTok weight.
 * Every other row keeps the baked index plus its own TikTok bonus.
 */
export function bakedPopularityFor(shop: Shop): number | undefined {
  if (isChainShop(shop)) return chainPopularityIndex();
  return effectivePopularityIndex(POPULARITY_INDEX[shop.id], shop.id);
}

function withBakedPopularity(shop: Shop): Shop {
  const popularityIndex = bakedPopularityFor(shop);
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

/** Local specialty: real, not drive-through, not a mass-market chain. */
export function isDiscoveryShop(
  shop: Pick<Shop, "example" | "catalogLane" | "isChain">,
): boolean {
  return !isExampleShop(shop) && !isDriveThroughLane(shop) && !isChainShop(shop);
}

/**
 * A chain is listed only when it is sit-down, not a drive-through lane,
 * and not pickup-only. A drive-through moment tag by itself does not hide
 * a sit-down chain — those rows stay on the drive-through list via the tag.
 * Unknown or false dine-in stays off the district page, its meta, JSON-LD, and llms.txt.
 */
export function chainIsListed(shop: HalfwayEligibleShop): boolean {
  if (!isChainShop(shop)) return true;
  if (shop.seatingVerdict?.dineIn === false) return false;
  if (shop.catalogLane === "drive-through") return false;
  if (shop.pickupOnly === true) return false;
  return isHalfwaySitDown(shop);
}

/** A manual seating verdict must match the stored lane and dineIn. */
export function seatingVerdictDisagrees(shop: Shop): string | null {
  const verdict = shop.seatingVerdict;
  if (!verdict) return null;
  const lane = shop.catalogLane === "drive-through";
  if (verdict.dineIn === false) {
    if (!lane) return `${shop.id} verdict is not dine-in but the drive-through lane is missing`;
    if (shop.dineIn !== false) {
      return `${shop.id} verdict is not dine-in but dineIn is ${String(shop.dineIn)}`;
    }
    return null;
  }
  if (lane) return `${shop.id} verdict is dine-in but the row is still a drive-through lane`;
  if (shop.dineIn !== true) {
    return `${shop.id} verdict is dine-in but dineIn is ${String(shop.dineIn)}`;
  }
  return null;
}

/**
 * District / browse listing row: local specialty plus a sit-down chain.
 * Drive-through lanes, and chains with dine-in unknown or false, stay out.
 */
export function isListingShop(
  shop: HalfwayEligibleShop & Pick<Shop, "example">,
): boolean {
  return (
    !isExampleShop(shop) &&
    !isDriveThroughLane(shop) &&
    chainIsListed(shop)
  );
}

export function discoveryShopsFrom(shops: readonly Shop[]): Shop[] {
  return shops.filter((shop) => isDiscoveryShop(shop));
}

export function listingShopsFrom(shops: readonly Shop[]): Shop[] {
  return shops.filter((shop) => isListingShop(shop));
}

/**
 * Non-chain rows use the prod listing: specialty shops, or every real
 * non-chain row when the district has no specialty shop. A chain row is
 * added only when it is sit-down, not a drive-through lane, and not
 * pickup-only. The fallback never returns a non-qualifying chain.
 */
export function districtListingFrom(
  shops: readonly Shop[],
  district: NeighborhoodId,
): Shop[] {
  const inDistrict = shops.filter(
    (shop) => !isExampleShop(shop) && shop.neighborhood === district,
  );
  const nonChains = inDistrict.filter((shop) => !isChainShop(shop));
  const nonChainSpecialty = nonChains.filter((shop) => !isDriveThroughLane(shop));
  const nonChainShown = nonChainSpecialty.length > 0 ? nonChainSpecialty : nonChains;
  const qualifyingChains = inDistrict.filter(
    (shop) => isChainShop(shop) && chainIsListed(shop),
  );
  return [...nonChainShown, ...qualifyingChains];
}

/** True when every real row is a chain branch that fails the sit-down gate. */
export function districtRowsAreUnlistedChains(
  shops: readonly Shop[],
  district: NeighborhoodId,
): boolean {
  const rows = shops.filter(
    (shop) => !isExampleShop(shop) && shop.neighborhood === district,
  );
  return (
    rows.length > 0 &&
    rows.every((shop) => isChainShop(shop) && !chainIsListed(shop))
  );
}

/** Specialty district set: local discovery only. A chains-only حي stays out. */
export function specialtyDistrictIdsFrom(
  shops: readonly Shop[],
): NeighborhoodId[] {
  return directoryNeighborhoods(discoveryShopsFrom(shops));
}

/** Catalog district set: any real row, including chains-only and drive-through. */
export function catalogDistrictIdsFrom(
  shops: readonly Shop[],
): NeighborhoodId[] {
  return directoryNeighborhoods(
    shops
      .filter((shop) => !isExampleShop(shop))
      .map((shop) => ({ neighborhood: shop.neighborhood })),
  );
}

/**
 * Districts that still have a page. A local drive-through row keeps it.
 * The page drops only when every row is a non-qualifying chain.
 */
export function listedDistrictIdsFrom(shops: readonly Shop[]): NeighborhoodId[] {
  const seen = new Set<NeighborhoodId>();
  const rows: { neighborhood: NeighborhoodId }[] = [];
  for (const shop of shops) {
    if (seen.has(shop.neighborhood)) continue;
    seen.add(shop.neighborhood);
    if (districtListingFrom(shops, shop.neighborhood).length > 0) {
      rows.push({ neighborhood: shop.neighborhood });
    }
  }
  return directoryNeighborhoods(rows);
}

/** Default specialty discovery — excludes drive-through lanes and chains. */
export function listDiscoveryShops(city: City = DEFAULT_LIVE_CITY): Shop[] {
  return discoveryShopsFrom(listRealShops(city));
}

/** Local specialty plus dine-in chain branches. Drive-through lanes stay out. */
export function listListingShops(city: City = DEFAULT_LIVE_CITY): Shop[] {
  return listingShopsFrom(listRealShops(city));
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

function directoryShopFrom(
  shop: Shop,
  added: Map<string, number>,
): DirectoryShop {
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
    ...(shop.isChain
      ? {
          isChain: true as const,
          ...(shop.chainBrand ? { chainBrand: shop.chainBrand } : {}),
        }
      : {}),
  };
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
    .map((shop) => directoryShopFrom(shop, added));
}

/** Keep caller order. Fixed lists rank first, then map onto directory cards. */
export function directoryShopsInOrder(shops: readonly Shop[]): DirectoryShop[] {
  const added = catalogAddedIndexById();
  return shops.map((shop) => directoryShopFrom(shop, added));
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

/** Directory rows for local specialty plus dine-in chains. */
export function listListingDirectoryShops(
  city: City = DEFAULT_LIVE_CITY,
): DirectoryShop[] {
  return toDirectoryShops(listListingShops(city));
}

/**
 * Prod rows for non-chains, plus sit-down chain branches. A district whose
 * rows are all non-qualifying chains returns nothing.
 */
export function listDirectoryShopsForDistrict(
  district: NeighborhoodId,
): DirectoryShop[] {
  const city = districtCity(district);
  return toDirectoryShops(districtListingFrom(listRealShops(city), district));
}

/** Neighborhood index: the same rows the district pages show. */
export function listBrowseDirectoryShops(
  city: City = DEFAULT_LIVE_CITY,
): DirectoryShop[] {
  const real = listRealShops(city);
  const shops = listedDistrictIdsFrom(real).flatMap((id) =>
    districtListingFrom(real, id),
  );
  return toDirectoryShops(shops);
}
