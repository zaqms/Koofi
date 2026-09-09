import { listDirectoryShops } from "./catalog";
import { directoryNeighborhoods } from "./directory";
import { NEIGHBORHOODS, isNeighborhoodId } from "./neighborhoods";
import { parseIntent } from "./parse-intent";
import { districtPath } from "./product";
import type { Language, NeighborhoodId } from "./types";

/**
 * Live catalog districts only. Izdihar / الازدهار is not a live حي —
 * do not invent it. Aliases live on `NEIGHBORHOODS` (EN + AR + typos).
 */
export function listLiveDistrictIds(): NeighborhoodId[] {
  return directoryNeighborhoods(listDirectoryShops());
}

export function dictionaryDistrictIds(): NeighborhoodId[] {
  return (Object.keys(NEIGHBORHOODS) as NeighborhoodId[]).filter(
    isNeighborhoodId,
  );
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/(^|\s)ال(?=\p{L})/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function aliasIndex(haystack: string, alias: string): number {
  const needle = normalize(alias);
  if (!needle) return -1;
  if (needle.includes(" ")) return haystack.indexOf(needle);
  const match = haystack.match(
    new RegExp(`(^|\\s)(${escapeRegExp(needle)})(\\s|$)`, "u"),
  );
  if (!match || match.index == null) return -1;
  return match.index + match[1].length;
}

function placeAliases(id: NeighborhoodId): string[] {
  const place = NEIGHBORHOODS[id];
  return [place.id, place.en, place.ar, ...place.aliases];
}

/** First district named in the ask (EN / AR / alias / typo). */
export function extractPrimaryDistrict(raw: string): NeighborhoodId | null {
  const { neighborhoods } = parseIntent(raw);
  if (neighborhoods.length === 0) return null;
  if (neighborhoods.length === 1) return neighborhoods[0] ?? null;

  const haystack = normalize(raw);
  let best: { id: NeighborhoodId; at: number } | null = null;
  for (const id of neighborhoods) {
    let at = Infinity;
    for (const alias of placeAliases(id)) {
      const index = aliasIndex(haystack, alias);
      if (index >= 0 && index < at) at = index;
    }
    if (at < Infinity && (!best || at < best.at)) {
      best = { id, at };
    }
  }
  return best?.id ?? neighborhoods[0] ?? null;
}

export function districtListHref(
  district: NeighborhoodId,
  language: Language,
): string {
  return districtPath(district, language);
}

export function dictionaryCoversLiveDistricts(): {
  ok: boolean;
  missing: NeighborhoodId[];
} {
  const dictionary = new Set(dictionaryDistrictIds());
  const missing = listLiveDistrictIds().filter((id) => !dictionary.has(id));
  return { ok: missing.length === 0, missing };
}
