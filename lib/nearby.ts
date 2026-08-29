import { listRealShops } from "./catalog";
import { shopToChatPick } from "./chat-pick";
import { haversineKm } from "./distance";
import { neighborhoodLabel } from "./neighborhoods";
import { officialShopCoords } from "./place-coords";
import type { ChatPick, Language, Pin, Shop } from "./types";

const TARGET_PICKS = 3;

function nearbyWhy(shop: Shop, language: Language): string {
  const neighborhood = neighborhoodLabel(shop.neighborhood, language);
  return language === "ar"
    ? `قريب منك في ${neighborhood}.`
    : `Near you in ${neighborhood}.`;
}

/** Three nearest official-place shops. Display sort for the Nearby chip only. */
export function pickNearestShops(
  shops: Shop[],
  origin: Pin,
  beenIds: string[],
  limit = TARGET_PICKS,
): Shop[] {
  const been = new Set(beenIds.filter(Boolean));
  const ranked: { shop: Shop; km: number }[] = [];

  for (const shop of shops) {
    if (been.has(shop.id)) continue;
    const coords = officialShopCoords(shop);
    if (!coords) continue;
    ranked.push({ shop, km: haversineKm(origin, coords) });
  }

  ranked.sort((a, b) => a.km - b.km);
  return ranked.slice(0, limit).map((row) => row.shop);
}

export function nearbyChatPicks(input: {
  origin: Pin;
  beenIds?: string[];
  language: Language;
}): ChatPick[] {
  const shops = pickNearestShops(
    listRealShops(),
    input.origin,
    input.beenIds ?? [],
  );
  return shops.map((shop) =>
    shopToChatPick(shop, input.language, nearbyWhy(shop, input.language)),
  );
}
