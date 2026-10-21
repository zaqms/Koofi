import { getShop, listRealShops } from "./catalog";
import { neighborhoodLabel } from "./neighborhoods";
import {
  PRODUCT_NAME,
  packPath as publicPackPath,
  packSharePath as publicPackSharePath,
  shopDisplayName,
} from "./product";
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

function distinctDistricts(shops: Pick<Shop, "neighborhood">[]): NeighborhoodId[] {
  const seen: NeighborhoodId[] = [];
  for (const shop of shops) {
    if (!seen.includes(shop.neighborhood)) seen.push(shop.neighborhood);
  }
  return seen;
}

/**
 * One district when every café shares it. Otherwise name the lead district
 * (the one that appears most, or the first café's when they tie) and the
 * rest: "Al Malqa and 2 more areas" / "الملقا ومنطقتين زيادة".
 */
export function packAreaLabel(
  shops: Pick<Shop, "neighborhood">[],
  language: Language,
): { neighborhoodId: NeighborhoodId | null; label: string } {
  const districts = distinctDistricts(shops);
  if (districts.length === 0) return { neighborhoodId: null, label: "" };
  if (districts.length === 1) {
    const id = districts[0]!;
    return { neighborhoodId: id, label: neighborhoodLabel(id, language) };
  }

  const counts = new Map<NeighborhoodId, number>();
  for (const shop of shops) {
    counts.set(shop.neighborhood, (counts.get(shop.neighborhood) ?? 0) + 1);
  }
  let lead = districts[0]!;
  let best = 0;
  for (const id of districts) {
    const count = counts.get(id) ?? 0;
    if (count > best) {
      lead = id;
      best = count;
    }
  }

  const extra = districts.length - 1;
  const name = neighborhoodLabel(lead, language);
  const rest =
    language === "ar"
      ? extra === 1
        ? "منطقة ثانية"
        : extra === 2
          ? "منطقتين زيادة"
          : `${extra} مناطق زيادة`
      : extra === 1
        ? "1 more area"
        : `${extra} more areas`;
  const label = language === "ar" ? `${name} و${rest}` : `${name} and ${rest}`;
  return { neighborhoodId: null, label };
}

const SHOP_JOIN: Record<Language, string> = { ar: "، ", en: ", " };

function areaPhrase(area: string, language: Language): string {
  return language === "ar" ? `في ${area}` : `In ${area}`;
}

function isBareAreaLine(line: string, language: Language): boolean {
  return language === "ar" ? line.startsWith("في ") : line.startsWith("In ");
}

/** Drop a repeated "In Al Jazirah" when a longer line already starts with it. */
function dedupedWhys(whys: string[], language: Language): string[] {
  const parts: string[] = [];
  for (const why of whys) {
    const line = why.trim();
    if (!line || parts.includes(line)) continue;
    const clash = parts.findIndex((prev) => {
      if (line.startsWith(`${prev} —`) && isBareAreaLine(prev, language)) return true;
      if (prev.startsWith(`${line} —`) && isBareAreaLine(line, language)) return true;
      return false;
    });
    if (clash === -1) {
      parts.push(line);
      continue;
    }
    if (line.length > parts[clash]!.length) parts[clash] = line;
  }
  return parts;
}

function areaAlreadySaid(parts: string[], area: string, language: Language): boolean {
  const phrase = areaPhrase(area, language);
  return parts.some(
    (part) => part === area || part === phrase || part.startsWith(`${phrase} —`),
  );
}

export type PackShareCopy = {
  title: string;
  description: string;
  imageAlt: string;
};

/** Title, description, and share-image alt for a pack page. */
export function packShareCopy(pack: {
  locale: Language;
  shops: Shop[];
  whys: string[];
  neighborhoodLabel: string;
}): PackShareCopy {
  const join = SHOP_JOIN[pack.locale];
  const names = pack.shops
    .map((shop) => shopDisplayName(shop, pack.locale))
    .join(join);
  const area = pack.neighborhoodLabel.trim();
  const title = area ? `${names} — ${area}` : names;
  const parts = dedupedWhys(pack.whys, pack.locale);
  if (area && !areaAlreadySaid(parts, area, pack.locale)) parts.push(area);
  const description = parts.filter(Boolean).join(join);
  const imageAlt = title ? `${title} · ${PRODUCT_NAME}` : PRODUCT_NAME;
  return { title, description, imageAlt };
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
  const area = packAreaLabel(shops, locale);

  return {
    id,
    locale,
    ask: seed.ask,
    shopIds: shops.map((shop) => shop.id),
    shops,
    whys,
    neighborhoodId: area.neighborhoodId,
    neighborhoodLabel: area.label,
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
