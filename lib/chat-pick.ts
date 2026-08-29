import { neighborhoodLabel } from "./neighborhoods";
import { officialShopCoords } from "./place-coords";
import { cardPath, isExampleShop } from "./product";
import { shopMapsHref } from "./public-url";
import type { ChatPick, Language, Shop } from "./types";

export function shopToChatPick(
  shop: Shop,
  language: Language,
  why: string,
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
    photoUrl: shop.photoUrl,
    logoUrl: shop.logoUrl,
    ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
  };
}
