import { NEIGHBORHOOD_IDS, type MomentTag, type NeighborhoodId } from "./types";

export type DirectoryShop = {
  id: string;
  nameAr: string;
  nameEn: string;
  neighborhood: NeighborhoodId;
  neighborhoodAr: string;
  vibeTags: string[];
  momentTags: MomentTag[];
  mapsHref: string;
  photoUrl?: string;
  logoUrl?: string;
  lat?: number;
  lng?: number;
};

export function directoryNeighborhoods(
  shops: Pick<DirectoryShop, "neighborhood">[],
): NeighborhoodId[] {
  const present = new Set(shops.map((shop) => shop.neighborhood));
  return NEIGHBORHOOD_IDS.filter((id) => present.has(id));
}

export function filterDirectoryShops(
  shops: DirectoryShop[],
  district: NeighborhoodId | null,
): DirectoryShop[] {
  if (!district) return shops;
  return shops.filter((shop) => shop.neighborhood === district);
}
