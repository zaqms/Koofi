import catalogFile from "../data/catalog.json";
import { isExampleShop } from "./product";
import { shopMapsHref } from "./public-url";
import { NEIGHBORHOOD_IDS, type CatalogFile, type NeighborhoodId, type Shop } from "./types";
import type { DirectoryShop } from "./directory";

export type { DirectoryShop } from "./directory";
export { directoryNeighborhoods, filterDirectoryShops } from "./directory";

const catalog = catalogFile as CatalogFile;

export function listShops(): Shop[] {
  return catalog.shops.filter((shop) => shop.city === "riyadh");
}

export function getShop(id: string): Shop | undefined {
  return listRealShops().find((shop) => shop.id === id);
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
    .map((shop) => ({
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
    }));
}
