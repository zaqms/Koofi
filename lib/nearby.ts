import { listRealShops } from "./catalog";
import { shopToChatPick } from "./chat-pick";
import { haversineKm } from "./distance";
import { officialShopCoords } from "./place-coords";
import { dedupeSameBrand } from "./shop-brand";
import type { ChatPick, Language, Pin, Shop } from "./types";
import { uniqueWhyLines } from "./why-line";

const TARGET_PICKS = 3;


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
  return dedupeSameBrand(ranked.map((row) => row.shop)).slice(0, limit);
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
  const whys = uniqueWhyLines(shops, input.language);
  return shops.map((shop, index) =>
    shopToChatPick(shop, input.language, whys[index] ?? ""),
  );
}
