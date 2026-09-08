import { neighborhoodLabel } from "./neighborhoods";
import {
  allowPassportPreview,
  isPassportPreviewShop,
  WOODS_PASSPORT_HERO_PHOTOS,
} from "./passport-preview";
import { cardPath, shopDisplayName } from "./product";
import type { Language, Shop } from "./types";

export const TONIGHT_LINE_MAX = 72;
export const TONIGHT_MINT_STORAGE_KEY = "wain.tonight.mints.v1";
export const TONIGHT_MINT_WINDOW_MS = 30 * 60 * 1000;
export const TONIGHT_MINTS_PER_SHOP = 5;
export const TONIGHT_MINTS_PER_SESSION = 12;

export const TONIGHT_IMAGE_SIZE = { width: 1080, height: 1920 } as const;

export const VIRAL_SHARE_CHANNELS = [
  "system",
  "x",
  "ig",
  "snap",
  "download",
  "copy",
] as const;

export type ViralShareChannel = (typeof VIRAL_SHARE_CHANNELS)[number];

export type TonightMintStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

type MintLog = { at: number; shopId: string };

const MAPS_LEAK = /maps\.(google|app)|google\.com\/maps|maps\.app\.goo/i;

export function sanitizeTonightLine(raw: string | null | undefined): string {
  const trimmed = (raw ?? "").replace(/\s+/g, " ").trim().slice(0, TONIGHT_LINE_MAX);
  if (!trimmed) return "";
  if (MAPS_LEAK.test(trimmed)) return "";
  return trimmed.replace(/[\u0000-\u001F\u007F]/g, "");
}

export function tonightCardPath(
  shopId: string,
  language: Language = "ar",
): string {
  return `${cardPath(shopId, language)}?from=tonight`;
}

export function tonightCardUrl(
  shopId: string,
  language: Language,
  origin: string,
): string {
  return `${origin.replace(/\/$/, "")}${tonightCardPath(shopId, language)}`;
}

export function tonightImagePath(
  shopId: string,
  input: { locale: Language; line?: string; photo?: string },
): string {
  const params = new URLSearchParams({ locale: input.locale });
  const line = sanitizeTonightLine(input.line);
  if (line) params.set("line", line);
  const photo = safeTonightPhotoPath(input.photo);
  if (photo) params.set("photo", photo);
  return `/c/${encodeURIComponent(shopId)}/tonight/image?${params.toString()}`;
}

/** Same-origin hero only. No remote fetch-by-URL. */
export function safeTonightPhotoPath(src: string | null | undefined): string | null {
  if (!src) return null;
  const raw = src.trim();
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.includes("..") || raw.includes("\\")) return null;
  if (
    raw.startsWith("/logos/") ||
    raw.startsWith("/passport/") ||
    raw.startsWith("/api/passport-photo/")
  ) {
    return raw.split("?")[0] ?? raw;
  }
  return null;
}

export function tonightHeroForShop(
  shop: Pick<Shop, "id" | "photoUrl" | "logoUrl">,
  photos: string[] = [],
): string | null {
  for (const src of photos) {
    const safe = safeTonightPhotoPath(src);
    if (safe) return safe;
  }
  if (allowPassportPreview() && isPassportPreviewShop(shop.id)) {
    return WOODS_PASSPORT_HERO_PHOTOS[0];
  }
  return (
    safeTonightPhotoPath(shop.photoUrl) ?? safeTonightPhotoPath(shop.logoUrl)
  );
}

export function tonightDistrict(
  shop: Pick<Shop, "neighborhood" | "neighborhoodAr">,
  language: Language,
): string {
  return language === "ar"
    ? shop.neighborhoodAr
    : neighborhoodLabel(shop.neighborhood, "en");
}

export function inviteShareText(input: {
  shop: Pick<Shop, "nameAr" | "nameEn">;
  language: Language;
  cardUrl: string;
}): string {
  const name = shopDisplayName(input.shop, input.language);
  const line =
    input.language === "ar"
      ? `أنا بـ ${name} الحين — تعال`
      : `I'm at ${name} — come through`;
  return `${line}\n\n${input.cardUrl}`;
}

export function tonightShareText(input: {
  shop: Pick<Shop, "nameAr" | "nameEn">;
  language: Language;
  cardUrl: string;
  line?: string;
}): string {
  const name = shopDisplayName(input.shop, input.language);
  const line = sanitizeTonightLine(input.line);
  const lead =
    line ||
    (input.language === "ar" ? `الليلة في ${name}` : `tonight at ${name}`);
  return `${lead}\n\n${input.cardUrl}`;
}

export function xShareHref(text: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
}

export function isViralShareChannel(
  value: string | null | undefined,
): value is ViralShareChannel {
  return (
    typeof value === "string" &&
    (VIRAL_SHARE_CHANNELS as readonly string[]).includes(value)
  );
}

function readMintLog(store: TonightMintStore): MintLog[] {
  try {
    const parsed = JSON.parse(store.getItem(TONIGHT_MINT_STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row): row is MintLog => {
      if (!row || typeof row !== "object") return false;
      const item = row as MintLog;
      return typeof item.at === "number" && typeof item.shopId === "string";
    });
  } catch {
    return [];
  }
}

function pruneMintLog(log: MintLog[], now: number): MintLog[] {
  return log.filter((row) => now - row.at < TONIGHT_MINT_WINDOW_MS);
}

export function canMintTonight(
  shopId: string,
  now: number,
  store: TonightMintStore,
): boolean {
  const log = pruneMintLog(readMintLog(store), now);
  if (log.length >= TONIGHT_MINTS_PER_SESSION) return false;
  const forShop = log.filter((row) => row.shopId === shopId);
  return forShop.length < TONIGHT_MINTS_PER_SHOP;
}

export function recordTonightMint(
  shopId: string,
  now: number,
  store: TonightMintStore,
): void {
  const log = pruneMintLog(readMintLog(store), now);
  log.push({ at: now, shopId });
  store.setItem(TONIGHT_MINT_STORAGE_KEY, JSON.stringify(log));
}

export function tonightFilename(shopId: string): string {
  const slug = shopId.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-");
  return `wain-tonight-${slug}.png`;
}

/**
 * ImageResponse / Satori paints runs LTR. Reverse Arabic tokens so
 * مقهى ومحمصة وودز reads in source order on the minted card.
 */
export function satoriArabicLine(text: string): string {
  return text.trim().split(/\s+/).reverse().join(" ");
}
