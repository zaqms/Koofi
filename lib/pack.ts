import { getShop, listRealShops } from "./catalog";
import { neighborhoodLabel } from "./neighborhoods";
import {
  PRODUCT_NAME,
  packPath as publicPackPath,
  packSharePath as publicPackSharePath,
  shopDisplayName,
} from "./product";
import type { ChatPick, Language, NeighborhoodId, Shop } from "./types";
import { vibeTagLabel } from "./vibe-labels";
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

const GENERIC_VIBE = new Set(["قهوة", "Coffee"]);

/** One area, both areas, or "Al Malqa and 2 more areas" once there are three. */
function descriptionPlace(
  shops: Pick<Shop, "neighborhood">[],
  language: Language,
): string {
  const districts = distinctDistricts(shops);
  if (districts.length === 0) return "";
  if (districts.length === 1) return neighborhoodLabel(districts[0]!, language);
  if (districts.length === 2) {
    const [first, second] = districts.map((id) => neighborhoodLabel(id, language));
    return language === "ar" ? `${first} و${second}` : `${first} and ${second}`;
  }
  return packAreaLabel(shops, language).label;
}

function cafeCountPhrase(count: number, language: Language): string {
  if (language === "ar") {
    if (count === 1) return "قهوة واحدة";
    if (count === 2) return "قهوتين";
    return `${count} قهاوي`;
  }
  return count === 1 ? "1 café" : `${count} cafés`;
}

function shareTag(shop: Pick<Shop, "vibeTags">, language: Language): string | null {
  for (const tag of shop.vibeTags) {
    const label = vibeTagLabel(tag, language);
    if (!label || GENERIC_VIBE.has(tag) || GENERIC_VIBE.has(label)) continue;
    return language === "en" ? label.toLowerCase() : label;
  }
  return null;
}

function countWord(count: number, language: Language): string {
  if (language === "ar") {
    if (count === 1) return "وحدة";
    if (count === 2) return "ثنتين";
    return String(count);
  }
  if (count === 1) return "one";
  if (count === 2) return "two";
  if (count === 3) return "three";
  return String(count);
}

function tagBits(
  shops: Pick<Shop, "vibeTags">[],
  language: Language,
): string[] {
  const counts = new Map<string, number>();
  const order: string[] = [];
  for (const shop of shops) {
    const tag = shareTag(shop, language);
    if (!tag) continue;
    if (!counts.has(tag)) order.push(tag);
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  const only = order.length === 1;
  return order.map((tag) => {
    const count = counts.get(tag) ?? 0;
    if (language === "ar") {
      if (shops.length === 1 && count === 1) return `فيها ${tag}`;
      if (only && count === shops.length && shops.length === 2) return `ثنتينهم فيها ${tag}`;
      if (only && count === shops.length && shops.length > 1) return `كلها فيها ${tag}`;
      return `${countWord(count, "ar")} فيها ${tag}`;
    }
    const label = tag;
    if (shops.length === 1 && count === 1) return `with ${label}`;
    if (only && count === shops.length && shops.length === 2) return `both with ${label}`;
    if (only && count === shops.length && shops.length > 1) return `all with ${label}`;
    return `${countWord(count, "en")} with ${label}`;
  });
}

function joinBits(bits: string[], language: Language): string {
  if (bits.length <= 1) return bits[0] ?? "";
  const last = bits[bits.length - 1]!;
  const rest = bits.slice(0, -1);
  if (language === "ar") return `${rest.join("، ")} و${last}`;
  if (rest.length === 1) return `${rest[0]} and ${last}`;
  return `${rest.join(", ")}, and ${last}`;
}

/**
 * One sentence. Two areas are both named; from three up, the lead district
 * plus the rest ("Al Malqa and 2 more areas"). A tag hangs on the cafés that have it.
 */
export function packShareDescription(
  shops: Pick<Shop, "neighborhood" | "vibeTags">[],
  language: Language,
): string {
  if (shops.length === 0) return "";
  const place = descriptionPlace(shops, language);
  const opening =
    language === "en"
      ? `${cafeCountPhrase(shops.length, "en")} in ${place}`
      : `${cafeCountPhrase(shops.length, "ar")} في ${place}`;
  const bits = tagBits(shops, language);
  if (bits.length === 0) return `${opening}.`;
  const tags = joinBits(bits, language);
  if (shops.length === 1) return `${opening} ${tags}.`;
  const comma = language === "ar" ? "، " : ", ";
  return `${opening}${comma}${tags}.`;
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
  neighborhoodLabel: string;
}): PackShareCopy {
  const names = pack.shops
    .map((shop) => shopDisplayName(shop, pack.locale))
    .join(SHOP_JOIN[pack.locale]);
  const area = pack.neighborhoodLabel.trim();
  const title = area ? `${names} — ${area}` : names;
  return {
    title,
    description: packShareDescription(pack.shops, pack.locale),
    imageAlt: title ? `${title} · ${PRODUCT_NAME}` : PRODUCT_NAME,
  };
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
