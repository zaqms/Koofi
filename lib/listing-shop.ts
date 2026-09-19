import type { DirectoryShop } from "./directory";
import type { ChatPick } from "./types";

/** Chat / بيننا picks are catalog rows — same shape DirectoryCard already lists. */
export function directoryShopFromPick(pick: ChatPick): DirectoryShop {
  return {
    id: pick.id,
    nameAr: pick.nameAr,
    nameEn: pick.nameEn,
    neighborhood: pick.neighborhood,
    neighborhoodAr: pick.neighborhoodAr,
    vibeTags: pick.vibeTags,
    momentTags: pick.momentTags,
    mapsHref: pick.mapsHref,
    photoUrl: pick.photoUrl,
    logoUrl: pick.logoUrl,
    catalogIndex: -1,
    ...(pick.lat != null && pick.lng != null
      ? { lat: pick.lat, lng: pick.lng }
      : {}),
  };
}
