import type { Language } from "./types";

/** Survives refresh and language switch. No URL param — canonicals stay clean. */
export const HIDE_CHAINS_STORAGE_KEY = "wain.hideChains.v1";
const HIDE_CHAINS_EVENT = "wain-hide-chains";

/** Session cache so a tap updates the list before (and without) storage. */
let cachedHideChains: boolean | undefined;

function readStoredHideChains(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(HIDE_CHAINS_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Default is chains shown. `true` means the visitor chose Local only. */
export function readHideChains(): boolean {
  if (cachedHideChains !== undefined) return cachedHideChains;
  cachedHideChains = readStoredHideChains();
  return cachedHideChains;
}

export function writeHideChains(hidden: boolean): void {
  cachedHideChains = hidden;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HIDE_CHAINS_STORAGE_KEY, hidden ? "1" : "0");
  } catch {
    // Private mode — the in-memory selection still applies this view.
  }
  window.dispatchEvent(new Event(HIDE_CHAINS_EVENT));
}

export function hideChainsServerSnapshot(): boolean {
  return false;
}

export function subscribeHideChains(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(HIDE_CHAINS_EVENT, onChange);
  return () => window.removeEventListener(HIDE_CHAINS_EVENT, onChange);
}

export const CHAIN_FILTER_LABEL = {
  en: "Local only",
  ar: "المحلية بس",
} as const;

export const CHAIN_FILTER_EMPTY = {
  en: "No local cafés here yet — only chains so far. Show chains",
  ar: "ما فيه قهاوي محلية هنا للحين، بس سلاسل. اعرض السلاسل",
} as const;

/** Lead keeps the trailing space so the button reads as the full sentence. */
export const CHAIN_FILTER_EMPTY_LEAD = {
  en: "No local cafés here yet — only chains so far. ",
  ar: "ما فيه قهاوي محلية هنا للحين، بس سلاسل. ",
} as const;

export const CHAIN_FILTER_SHOW = {
  en: "Show chains",
  ar: "اعرض السلاسل",
} as const;

export type ChainFilterListing = "district" | "category";
export type ChainFilterState = "hidden" | "shown";

export function applyHideChains<T extends { isChain?: boolean | true }>(
  shops: readonly T[],
  hideChains: boolean,
): T[] {
  if (!hideChains) return [...shops];
  return shops.filter((shop) => shop.isChain !== true);
}

/** Local-only is on, and every row in the list was a chain. */
export function chainFilterShowsEmpty<T extends { isChain?: boolean | true }>(
  shops: readonly T[],
  hideChains: boolean,
): boolean {
  if (!hideChains) return false;
  if (!shops.some((shop) => shop.isChain === true)) return false;
  return applyHideChains(shops, true).length === 0;
}

export function chainFilterDedupeKey(input: {
  listing: ChainFilterListing;
  districtId?: string;
  language: Language;
  state: ChainFilterState;
}): string {
  return `chain_filter:${input.listing}:${input.districtId ?? ""}:${input.language}:${input.state}`;
}
