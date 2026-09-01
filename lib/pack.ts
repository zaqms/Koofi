import { getShop, listRealShops } from "./catalog";
import { neighborhoodLabel } from "./neighborhoods";
import { packPath as publicPackPath, packSharePath as publicPackSharePath } from "./product";
import type { ChatPick, Language, NeighborhoodId, Shop } from "./types";
import { uniqueWhyLines } from "./why-line";
import { shopToChatPick } from "./chat-pick";

export type PackSeed = {
  locale: Language;
  shopIds: string[];
  ask: string;
};

export type ResolvedPack = {
  id: string;
  locale: Language;
  ask: string;
  shopIds: string[];
  shops: Shop[];
  whys: string[];
  neighborhoodId: NeighborhoodId | null;
  neighborhoodLabel: string;
};

const ASK_MAX = 80;

function checksum(body: string): string {
  let hash = 2166136261;
  for (let i = 0; i < body.length; i += 1) {
    hash ^= body.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function clipAsk(ask: string): string {
  return ask.trim().slice(0, ASK_MAX);
}

function utf8ToBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToUtf8(text: string): string {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Durable public pack id. Shop ids + locale + ask, checksummed.
 * Does not expire — no server clock, no signed-JWT TTL.
 */
export function encodePackId(input: PackSeed): string {
  const payload = JSON.stringify({
    v: 1,
    l: input.locale === "en" ? "e" : "a",
    s: input.shopIds.filter(Boolean).slice(0, 3),
    a: clipAsk(input.ask),
  });
  const body = utf8ToBase64Url(payload);
  return `${body}.${checksum(body)}`;
}

export function decodePackId(id: string): PackSeed | null {
  const trimmed = id.trim();
  const dot = trimmed.lastIndexOf(".");
  if (dot < 2) return null;
  const body = trimmed.slice(0, dot);
  const sig = trimmed.slice(dot + 1);
  if (!body || !sig || checksum(body) !== sig) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(body)) return null;

  try {
    const parsed = JSON.parse(base64UrlToUtf8(body)) as {
      v?: unknown;
      l?: unknown;
      s?: unknown;
      a?: unknown;
    };
    if (parsed.v !== 1) return null;
    const locale: Language = parsed.l === "e" ? "en" : parsed.l === "a" ? "ar" : "ar";
    if (parsed.l !== "a" && parsed.l !== "e") return null;
    if (!Array.isArray(parsed.s)) return null;
    const shopIds = parsed.s.filter(
      (shopId): shopId is string =>
        typeof shopId === "string" && /^[a-z0-9][a-z0-9-]*$/i.test(shopId),
    );
    if (shopIds.length === 0 || shopIds.length > 3) return null;
    const ask = typeof parsed.a === "string" ? clipAsk(parsed.a) : "";
    return { locale, shopIds, ask };
  } catch {
    return null;
  }
}

function majorityNeighborhood(shops: Shop[]): NeighborhoodId | null {
  const counts = new Map<NeighborhoodId, number>();
  for (const shop of shops) {
    counts.set(shop.neighborhood, (counts.get(shop.neighborhood) ?? 0) + 1);
  }
  let best: NeighborhoodId | null = null;
  let n = 0;
  for (const [id, count] of counts) {
    if (count > n) {
      best = id;
      n = count;
    }
  }
  return best;
}

export function resolvePack(id: string): ResolvedPack | null {
  const seed = decodePackId(id);
  if (!seed) return null;

  const shops: Shop[] = [];
  for (const shopId of seed.shopIds) {
    const shop = getShop(shopId);
    if (!shop) return null;
    shops.push(shop);
  }
  if (shops.length === 0) return null;

  const locale = seed.locale;
  const whys = uniqueWhyLines(shops, locale);
  const neighborhoodId = majorityNeighborhood(shops);
  const area = neighborhoodId
    ? neighborhoodLabel(neighborhoodId, locale)
    : shops[0]
      ? neighborhoodLabel(shops[0].neighborhood, locale)
      : "";

  return {
    id,
    locale,
    ask: seed.ask,
    shopIds: shops.map((shop) => shop.id),
    shops,
    whys,
    neighborhoodId,
    neighborhoodLabel: area,
  };
}

export function packToChatPicks(pack: ResolvedPack): ChatPick[] {
  return pack.shops.map((shop, index) =>
    shopToChatPick(shop, pack.locale, pack.whys[index] ?? ""),
  );
}

export const packPath = publicPackPath;
export const packSharePath = publicPackSharePath;

export function knownShopIds(ids: string[]): string[] {
  const allowed = new Set(listRealShops().map((shop) => shop.id));
  return ids.filter((id) => allowed.has(id)).slice(0, 3);
}
