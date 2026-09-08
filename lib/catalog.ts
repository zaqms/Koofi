import catalogFile from "../data/catalog.json";
import popularityIndexFile from "../data/popularity-index.json";
import { officialShopCoords } from "./place-coords";
import { isExampleShop } from "./product";
import { shopMapsHref } from "./public-url";
import { NEIGHBORHOOD_IDS, type CatalogFile, type NeighborhoodId, type Shop } from "./types";
import type { DirectoryShop } from "./directory";

export type { DirectoryShop } from "./directory";
export { directoryNeighborhoods, filterDirectoryShops } from "./directory";

const catalog = catalogFile as CatalogFile;
const POPULARITY_INDEX = popularityIndexFile as Record<string, number>;

function withBakedPopularity(shop: Shop): Shop {
  const popularityIndex = POPULARITY_INDEX[shop.id];
  if (popularityIndex == null) return shop;
  return { ...shop, popularityIndex };
}

export function listShops(): Shop[] {
  return catalog.shops
    .filter((shop) => shop.city === "riyadh")
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

export function listRealShops(): Shop[] {
  return listShops().filter((shop) => !isExampleShop(shop));
}

export function realShopCount(): number {
  return listRealShops().length;
}

function neighborhoodOrder(id: NeighborhoodId): number {
  const index = NEIGHBORHOOD_IDS.indexOf(id);
  return index === -1 ? NEIGHBORHOOD_IDS.length : index;
}

export function listDirectoryShops(): DirectoryShop[] {
  return listRealShops()
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
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      };
    });
}
