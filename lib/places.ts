import { ENV_KEYS, readEnv } from "./env";
import {
  followGoogleRedirects,
  isAllowedMapsHost,
  parseHttpUrl,
} from "./maps-url";
import { neighborhoodLabel } from "./neighborhoods";
import { isExampleShop } from "./product";
import type { ChatPick, Language, Shop } from "./types";

const TTL_MS = 20 * 60 * 1000;

export type PlaceSocial = {
  rating: number;
  reviewCount: number;
  reviewSnippet?: string;
};

type CacheEntry<T> = { expires: number; value: T };

const placeIdCache = new Map<string, CacheEntry<string | null>>();
const socialCache = new Map<string, CacheEntry<PlaceSocial | null>>();

function placesKey(): string | undefined {
  return readEnv(ENV_KEYS.GOOGLE_PLACES_API_KEY);
}

function readCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function writeCache<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
): T {
  cache.set(key, { expires: Date.now() + TTL_MS, value });
  return value;
}

function hexCidToDecimal(hex: string): string | undefined {
  try {
    const value = BigInt(hex);
    if (value <= 0n) return undefined;
    return value.toString();
  } catch {
    return undefined;
  }
}

export function extractPlaceHints(url: string): {
  placeId?: string;
  cid?: string;
} {
  const parsed = parseHttpUrl(url);
  const raw = url;

  const queryPlace =
    parsed?.searchParams.get("query_place_id") ??
    parsed?.searchParams.get("place_id");
  if (queryPlace?.startsWith("ChIJ")) return { placeId: queryPlace };

  const cidParam = parsed?.searchParams.get("cid");
  if (cidParam && /^\d+$/.test(cidParam)) return { cid: cidParam };

  const ftidParam = parsed?.searchParams.get("ftid");
  const ftidMatch =
    ftidParam?.match(/0x[0-9a-f]+:(0x[0-9a-f]+)/i) ??
    raw.match(/!1s0x[0-9a-f]+:(0x[0-9a-f]+)/i) ??
    raw.match(/ftid=0x[0-9a-f]+:(0x[0-9a-f]+)/i);
  if (ftidMatch?.[1]) {
    const cid = hexCidToDecimal(ftidMatch[1]);
    if (cid) return { cid };
  }

  return {};
}

async function findPlaceIdFromText(shop: Shop): Promise<string | undefined> {
  const key = placesKey();
  if (!key) return undefined;

  const input = `${shop.nameEn} ${neighborhoodLabel(shop.neighborhood, "en")} Riyadh`;
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/findplacefromtext/json",
  );
  url.searchParams.set("input", input);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id");
  url.searchParams.set("key", key);

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return undefined;
    const data = (await response.json()) as {
      candidates?: { place_id?: string }[];
    };
    return data.candidates?.[0]?.place_id;
  } catch {
    return undefined;
  }
}

export async function resolvePlaceId(shop: Shop): Promise<string | null> {
  const cached = readCache(placeIdCache, shop.id);
  if (cached !== undefined) return cached;

  if (!placesKey() || isExampleShop(shop) || !shop.mapsShareUrl) {
    return writeCache(placeIdCache, shop.id, null);
  }

  const parsed = parseHttpUrl(shop.mapsShareUrl);
  if (!parsed || !isAllowedMapsHost(parsed.host)) {
    return writeCache(placeIdCache, shop.id, null);
  }

  let hints = extractPlaceHints(shop.mapsShareUrl);
  if (!hints.placeId && !hints.cid) {
    const resolved = await followGoogleRedirects(shop.mapsShareUrl);
    hints = extractPlaceHints(resolved);
  }

  if (hints.placeId) return writeCache(placeIdCache, shop.id, hints.placeId);

  const fromText = await findPlaceIdFromText(shop);
  if (fromText) return writeCache(placeIdCache, shop.id, fromText);

  if (hints.cid) return writeCache(placeIdCache, shop.id, `cid:${hints.cid}`);

  return writeCache(placeIdCache, shop.id, null);
}

function truncateSnippet(text: string, max = 90): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  const slice = compact.slice(0, max - 1);
  const cut = slice.lastIndexOf(" ");
  return `${(cut > 40 ? slice.slice(0, cut) : slice).trim()}…`;
}

function pickSnippet(
  reviews: { text?: string; language?: string }[] | undefined,
  language: Language,
): string | undefined {
  if (!reviews?.length) return undefined;
  const preferred = reviews.find(
    (review) =>
      review.text &&
      review.language?.toLowerCase().startsWith(language),
  );
  const fallback = reviews.find((review) => review.text);
  const text = preferred?.text ?? fallback?.text;
  return text ? truncateSnippet(text) : undefined;
}

type DetailsJson = {
  result?: {
    rating?: number;
    user_ratings_total?: number;
    reviews?: { text?: string; language?: string }[];
    photos?: { photo_reference?: string }[];
  };
  status?: string;
};

async function placeDetails(
  placeRef: string,
  language: Language,
): Promise<DetailsJson | undefined> {
  const key = placesKey();
  if (!key) return undefined;

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/details/json",
  );
  if (placeRef.startsWith("cid:")) {
    url.searchParams.set("cid", placeRef.slice(4));
  } else {
    url.searchParams.set("place_id", placeRef);
  }
  url.searchParams.set("fields", "rating,user_ratings_total,reviews,photo");
  url.searchParams.set("language", language);
  url.searchParams.set("key", key);

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return undefined;
    return (await response.json()) as DetailsJson;
  } catch {
    return undefined;
  }
}

export async function fetchPlaceSocial(
  shop: Shop,
  language: Language,
): Promise<PlaceSocial | null> {
  if (isExampleShop(shop)) return null;
  const key = placesKey();
  if (!key) return null;

  const cacheKey = `${shop.id}:${language}`;
  const cached = readCache(socialCache, cacheKey);
  if (cached !== undefined) return cached;

  const placeRef = await resolvePlaceId(shop);
  if (!placeRef) return writeCache(socialCache, cacheKey, null);

  const details = await placeDetails(placeRef, language);
  const rating = details?.result?.rating;
  const reviewCount = details?.result?.user_ratings_total;
  if (typeof rating !== "number" || typeof reviewCount !== "number") {
    return writeCache(socialCache, cacheKey, null);
  }

  const social: PlaceSocial = {
    rating,
    reviewCount,
    reviewSnippet: pickSnippet(details?.result?.reviews, language),
  };
  return writeCache(socialCache, cacheKey, social);
}

export async function decorateChatPicks(
  picks: ChatPick[],
  shops: Shop[],
  language: Language,
): Promise<ChatPick[]> {
  if (!placesKey()) return picks;

  return Promise.all(
    picks.map(async (pick, index) => {
      const shop = shops[index];
      if (!shop || isExampleShop(shop)) return pick;
      const social = await fetchPlaceSocial(shop, language);
      if (!social) return pick;
      return {
        ...pick,
        rating: social.rating,
        reviewCount: social.reviewCount,
        reviewSnippet: social.reviewSnippet,
      };
    }),
  );
}

export async function fetchPlacePhotoReference(
  shop: Shop,
): Promise<string | undefined> {
  const key = placesKey();
  if (!key || isExampleShop(shop)) return undefined;
  const placeRef = await resolvePlaceId(shop);
  if (!placeRef) return undefined;
  const details = await placeDetails(placeRef, "en");
  return details?.result?.photos?.[0]?.photo_reference;
}
