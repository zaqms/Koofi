import { listRealShops } from "./catalog";
import {
  extractMapsUrl,
  followGoogleRedirects,
  isMapsUrl,
} from "./maps-url";
import { extractPlaceHints } from "./places";
import { matchCatalogShops } from "./shop-name";
import type { Shop } from "./types";

const HEX_PAIR = /0x[0-9a-f]+:0x[0-9a-f]+/i;

function hexPair(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const match = url.match(HEX_PAIR);
  return match?.[0]?.toLowerCase();
}

function hintsKey(url: string | undefined): { placeId?: string; cid?: string; hex?: string } {
  if (!url) return {};
  const hints = extractPlaceHints(url);
  return {
    ...hints,
    hex: hexPair(url),
  };
}

function placeNameFromUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/maps\/place\/([^/]+)/);
    if (!match?.[1] || match[1] === "data") return undefined;
    return decodeURIComponent(match[1].replace(/\+/g, " ")).trim() || undefined;
  } catch {
    return undefined;
  }
}

function shopMatchesUrl(shop: Shop, url: string): boolean {
  const incoming = hintsKey(url);
  const listed = hintsKey(shop.mapsShareUrl);
  if (incoming.placeId && listed.placeId && incoming.placeId === listed.placeId) {
    return true;
  }
  if (incoming.cid && listed.cid && incoming.cid === listed.cid) return true;
  if (incoming.hex && listed.hex && incoming.hex === listed.hex) return true;
  if (shop.mapsShareUrl && shop.mapsShareUrl === url) return true;
  return false;
}

export function matchCatalogShopFromMapsUrl(url: string): Shop | undefined {
  const shops = listRealShops();
  const exact = shops.find((shop) => shopMatchesUrl(shop, url));
  if (exact) return exact;

  const name = placeNameFromUrl(url);
  if (!name) return undefined;
  const named = matchCatalogShops(name, shops);
  return named.length === 1 ? named[0] : undefined;
}

export async function resolveCatalogShopFromMapsInput(raw: string): Promise<{
  shop?: Shop;
  mapsUrl?: string;
  reason: "matched" | "need_pick" | "bad_url";
}> {
  const mapsUrl = extractMapsUrl(raw);
  if (!mapsUrl || !isMapsUrl(mapsUrl)) {
    return { reason: "bad_url" };
  }

  const direct = matchCatalogShopFromMapsUrl(mapsUrl);
  if (direct) return { shop: direct, mapsUrl, reason: "matched" };

  const resolved = await followGoogleRedirects(mapsUrl);
  if (resolved !== mapsUrl) {
    const followed = matchCatalogShopFromMapsUrl(resolved);
    if (followed) return { shop: followed, mapsUrl: resolved, reason: "matched" };
  }

  return { mapsUrl: resolved, reason: "need_pick" };
}
