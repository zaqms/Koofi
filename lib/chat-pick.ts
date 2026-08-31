import { neighborhoodLabel } from "./neighborhoods";
import { officialShopCoords } from "./place-coords";
import { cardPath, isExampleShop } from "./product";
import { shopMapsHref } from "./public-url";
import { matchedChipLabels } from "./share";
import type { ChatPick, Language, MomentTag, Shop } from "./types";

export function shopToChatPick(
  shop: Shop,
  language: Language,
  why: string,
  askedMoments: readonly MomentTag[] = [],
): ChatPick {
  const coords = officialShopCoords(shop);
  return {
    id: shop.id,
    nameAr: shop.nameAr,
    nameEn: shop.nameEn,
    neighborhoodLabel: neighborhoodLabel(shop.neighborhood, language),
    example: isExampleShop(shop),
    why,
    mapsHref: shopMapsHref(shop),
    cardPath: cardPath(shop.id, language),
    matchedTags: matchedChipLabels(shop.momentTags, askedMoments, language),
    photoUrl: shop.photoUrl,
    logoUrl: shop.logoUrl,
    ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
  };
}
