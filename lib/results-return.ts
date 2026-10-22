/**
 * Back from a café card should return to the results the visitor came from.
 *
 * Home search and بيننا keep their picks in memory on `/`, `/en`, `/halfway`.
 * A document reload of that history entry (browser back after a full load)
 * otherwise paints the homepage, because the URL has no query. The in-app
 * back control is a link to `/` or `/en`, so district and list pages lose
 * their place too.
 *
 * Snapshots live in sessionStorage under the history entry key. The café
 * back control calls history.back() only when this card was opened from that
 * entry. A direct visit keeps the home link.
 */

import { halfwayPath } from "./product";
import type { Language } from "./types";

export const RESULTS_SNAPSHOT_KEY = "wain.resultsSnapshot.v1";
export const CAFE_ORIGIN_KEY = "wain.cafeOrigin.v1";

/**
 * A full reload of a search or بيننا entry paints the server page before
 * the session snapshot restores. Runs before first paint and hides that
 * paint only when this history entry already has a snapshot.
 */
export const RESULTS_RESTORE_BOOTSTRAP =
  `(function(){try{var path=location.pathname;if(path.length>1&&path.endsWith("/"))path=path.slice(0,-1);var home=path==="/"||path==="/en";var halfway=path==="/halfway"||path==="/en/halfway"||/^\\/(?:en\\/)?h\\/[^/]+$/.test(path);if(!home&&!halfway)return;var state=history.state;if(home&&!(state&&state.wainSearch===true))return;var key=state&&typeof state.wainEntry==="string"?state.wainEntry:"";if(!key&&window.navigation&&window.navigation.currentEntry)key=window.navigation.currentEntry.key||"";if(!key)return;var raw=sessionStorage.getItem(${JSON.stringify(RESULTS_SNAPSHOT_KEY)});if(!raw||raw.indexOf('"entryKey":"'+key+'"')<0)return;document.documentElement.setAttribute("data-results-pending","");}catch(e){}})();`;

export function revealResultsRestore(): void {
  if (typeof document === "undefined") return;
  document.documentElement.removeAttribute("data-results-pending");
}

const MAX_AGE_MS = 12 * 60 * 60 * 1000;
const MAX_STORE_CHARS = 150_000;
const MAX_ENTRIES = 8;

export type ResultsScroll = {
  scrollY: number;
  listScroll: number;
};

export type CafeOrigin = {
  entryKey: string;
  href: string;
  cafePath: string;
  scrollY: number;
  listScroll: number;
  ts: number;
};

export type ResultsMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  language?: Language;
  picks?: Record<string, unknown>[];
  thinCatalog?: boolean;
  districtMatch?: Record<string, unknown>;
  halfwayMore?: boolean;
  halfwayLocations?: Record<string, unknown>[];
  halfwayPaged?: boolean;
  halfwayJoined?: boolean;
  resultVia?: "typed" | "chip";
};

export type ResultsSnapshot = {
  entryKey: string;
  threadKey: string;
  href: string;
  scrollY: number;
  listScroll: number;
  messages: ResultsMessage[];
  composerLanguage: Language;
  awaitingMaps: boolean;
  halfwayWaitingId: string | null;
  halfwayWaitingMe: { lat: number; lng: number } | null;
  savedAt: number;
};

type HistoryLike = { key?: string; url?: string } | null;

type StoreFile = {
  entries: ResultsSnapshot[];
};

export function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "/";
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    decoded = trimmed;
  }
  if (decoded.length > 1 && decoded.endsWith("/")) decoded = decoded.slice(0, -1);
  return decoded.startsWith("/") ? decoded : `/${decoded}`;
}

/** `/c/{id}` and `/en/c/{id}` only. Subpaths (OG images, tonight) are not cards. */
export function cafeCardPathname(href: string, base = "https://wain.lol"): string | null {
  let url: URL;
  try {
    url = new URL(href, base);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const parts = normalizePath(url.pathname).split("/").filter(Boolean);
  const id = parts.length === 2 && parts[0] === "c"
    ? parts[1]
    : parts.length === 3 && parts[0] === "en" && parts[1] === "c"
      ? parts[2]
      : null;
  if (!id || id === "opengraph-image" || id === "twitter-image") return null;
  return parts[0] === "en" ? `/en/c/${id}` : `/c/${id}`;
}

export function historyHasSearch(state: unknown): boolean {
  return Boolean(
    state &&
      typeof state === "object" &&
      (state as { wainSearch?: unknown }).wainSearch === true,
  );
}

/** Home search (flagged history entry), بيننا landing, and invite sessions. */
export function shouldPersistSnapshot(pathname: string, historyState: unknown): boolean {
  const path = normalizePath(pathname);
  if (path === "/" || path === "/en") return historyHasSearch(historyState);
  if (path === halfwayPath("ar") || path === halfwayPath("en")) return true;
  return /^\/(?:en\/)?h\/[^/]+$/.test(path);
}

export function resultsThreadRestorable(messages: readonly ResultsMessage[]): boolean {
  return messages.some((message) => {
    if (message.role === "user" && message.text.trim()) return true;
    if (message.role !== "assistant" || message.id === "opener") return false;
    if (message.picks && message.picks.length > 0) return true;
    if (typeof message.halfwayMore === "boolean") return true;
    return message.text.trim().length > 0;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isPick(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.nameAr === "string" &&
    typeof value.nameEn === "string" &&
    typeof value.neighborhood === "string" &&
    typeof value.neighborhoodAr === "string" &&
    Array.isArray(value.vibeTags) &&
    Array.isArray(value.momentTags) &&
    typeof value.mapsHref === "string" &&
    typeof value.cardPath === "string"
  );
}

function parseMessage(value: unknown): ResultsMessage | null {
  if (!isRecord(value)) return null;
  if (value.role !== "user" && value.role !== "assistant") return null;
  if (typeof value.id !== "string" || typeof value.text !== "string") return null;
  const message: ResultsMessage = {
    id: value.id,
    role: value.role,
    text: value.text,
  };
  if (value.language === "ar" || value.language === "en") message.language = value.language;
  if (value.role === "assistant") {
    if (Array.isArray(value.picks)) {
      const picks = value.picks.filter(isPick);
      if (picks.length > 0) message.picks = picks;
    }
    if (value.thinCatalog === true) message.thinCatalog = true;
    if (isRecord(value.districtMatch) && typeof value.districtMatch.district_slug === "string") {
      message.districtMatch = value.districtMatch;
    }
    if (typeof value.halfwayMore === "boolean") message.halfwayMore = value.halfwayMore;
    if (Array.isArray(value.halfwayLocations)) {
      const locations = value.halfwayLocations.filter(isRecord);
      if (locations.length > 0) message.halfwayLocations = locations;
    }
    if (value.halfwayPaged === true) message.halfwayPaged = true;
    if (value.halfwayJoined === true) message.halfwayJoined = true;
    if (value.resultVia === "typed" || value.resultVia === "chip") {
      message.resultVia = value.resultVia;
    }
  }
  return message;
}

function parsePin(value: unknown): { lat: number; lng: number } | null {
  if (!isRecord(value)) return null;
  if (typeof value.lat !== "number" || typeof value.lng !== "number") return null;
  return { lat: value.lat, lng: value.lng };
}

export function parseResultsSnapshot(value: unknown): ResultsSnapshot | null {
  if (!isRecord(value)) return null;
  if (typeof value.entryKey !== "string" || !value.entryKey) return null;
  if (typeof value.threadKey !== "string" || !value.threadKey) return null;
  if (typeof value.href !== "string" || !value.href.startsWith("/")) return null;
  if (!Array.isArray(value.messages)) return null;
  const messages = value.messages.map(parseMessage).filter((message): message is ResultsMessage => Boolean(message));
  if (!resultsThreadRestorable(messages)) return null;
  const composerLanguage = value.composerLanguage === "en" ? "en" : value.composerLanguage === "ar" ? "ar" : null;
  if (!composerLanguage) return null;
  const savedAt = typeof value.savedAt === "number" ? value.savedAt : 0;
  return {
    entryKey: value.entryKey,
    threadKey: value.threadKey,
    href: value.href,
    scrollY: typeof value.scrollY === "number" ? value.scrollY : 0,
    listScroll: typeof value.listScroll === "number" ? value.listScroll : 0,
    messages,
    composerLanguage,
    awaitingMaps: value.awaitingMaps === true,
    halfwayWaitingId: typeof value.halfwayWaitingId === "string" ? value.halfwayWaitingId : null,
    halfwayWaitingMe: parsePin(value.halfwayWaitingMe),
    savedAt,
  };
}

export function parseCafeOrigin(value: unknown, now = Date.now()): CafeOrigin | null {
  if (!isRecord(value)) return null;
  if (typeof value.entryKey !== "string" || !value.entryKey) return null;
  if (typeof value.href !== "string" || !value.href.startsWith("/")) return null;
  if (typeof value.cafePath !== "string" || !cafeCardPathname(value.cafePath)) return null;
  if (typeof value.ts !== "number") return null;
  if (now - value.ts > MAX_AGE_MS) return null;
  return {
    entryKey: value.entryKey,
    href: value.href,
    cafePath: normalizePath(value.cafePath),
    scrollY: typeof value.scrollY === "number" ? value.scrollY : 0,
    listScroll: typeof value.listScroll === "number" ? value.listScroll : 0,
    ts: value.ts,
  };
}

function samePlace(previousUrl: string, href: string): boolean {
  try {
    const url = new URL(previousUrl, "https://wain.lol");
    const path = `${normalizePath(url.pathname)}${url.search}`;
    return path === href;
  } catch {
    return false;
  }
}

/**
 * In-app back when this card was opened from the previous history entry.
 * A direct open (no matching entry) stays on the home fallback.
 */
export function shouldReturnInApp(input: {
  cafePath: string;
  origin: CafeOrigin | null;
  previous: HistoryLike;
  now?: number;
}): boolean {
  const origin = input.origin;
  const previous = input.previous;
  if (!origin || !previous) return false;
  if (input.now != null && input.now - origin.ts > MAX_AGE_MS) return false;
  if (normalizePath(origin.cafePath) !== normalizePath(input.cafePath)) return false;
  if (origin.entryKey && previous.key) return previous.key === origin.entryKey;
  if (!previous.url) return false;
  return samePlace(previous.url, origin.href);
}

export function currentResultsHref(): string {
  return `${normalizePath(window.location.pathname)}${window.location.search}`;
}

type NavEntry = { id?: string; key?: string; url?: string };

function navigationApi(): {
  currentEntry?: NavEntry;
  entries?: () => NavEntry[];
} | null {
  const nav = (window as Window & { navigation?: { currentEntry?: NavEntry; entries?: () => NavEntry[] } }).navigation;
  if (!nav?.entries || !nav.currentEntry) return null;
  return nav;
}

function stateRecord(): Record<string, unknown> | null {
  const state = window.history.state;
  if (!state || typeof state !== "object") return null;
  return state as Record<string, unknown>;
}

/**
 * Id for the results snapshot. The stamped id survives a reload of this
 * history entry. The Navigation API key covers browsers that keep it.
 */
export function resultsSnapshotKey(): string | null {
  const state = stateRecord();
  const stamped = state?.wainEntry;
  if (typeof stamped === "string" && stamped) return stamped;
  return navigationEntryKey();
}

export function ensureResultsSnapshotKey(): string | null {
  const state = stateRecord();
  const stamped = state?.wainEntry;
  if (typeof stamped === "string" && stamped) return stamped;
  if (state?.__NA === true) {
    const key = crypto.randomUUID();
    window.history.replaceState(
      { ...state, wainEntry: key },
      "",
      window.location.href,
    );
    return key;
  }
  return navigationEntryKey();
}

function navigationEntryKey(): string | null {
  const current = navigationApi()?.currentEntry;
  return typeof current?.key === "string" && current.key ? current.key : null;
}

let openedFromResults = false;

function previousHistoryEntry(): HistoryLike {
  const nav = navigationApi();
  if (!nav?.entries || !nav.currentEntry) return null;
  const entries = nav.entries();
  const index = entries.findIndex((entry) => entry.id && entry.id === nav.currentEntry?.id);
  if (index <= 0) return null;
  const previous = entries[index - 1];
  return previous ?? null;
}

function readStore(): StoreFile {
  try {
    const raw = window.sessionStorage.getItem(RESULTS_SNAPSHOT_KEY);
    if (!raw) return { entries: [] };
    const parsed = JSON.parse(raw) as { entries?: unknown };
    if (!parsed || !Array.isArray(parsed.entries)) return { entries: [] };
    return {
      entries: parsed.entries
        .map((entry) => parseResultsSnapshot(entry))
        .filter((entry): entry is ResultsSnapshot => Boolean(entry)),
    };
  } catch {
    return { entries: [] };
  }
}

function writeStore(entries: ResultsSnapshot[]): void {
  const trimmed = entries.slice(-MAX_ENTRIES);
  try {
    const raw = JSON.stringify({ entries: trimmed });
    if (raw.length > MAX_STORE_CHARS) {
      window.sessionStorage.setItem(
        RESULTS_SNAPSHOT_KEY,
        JSON.stringify({ entries: trimmed.slice(-2) }),
      );
      return;
    }
    window.sessionStorage.setItem(RESULTS_SNAPSHOT_KEY, raw);
  } catch {
    // Private mode and quota failures leave the in-memory thread as it is.
  }
}

export function readResultsSnapshot(entryKey: string, threadKey: string, href: string): ResultsSnapshot | null {
  if (typeof window === "undefined") return null;
  const snapshot = readStore().entries.find(
    (entry) => entry.entryKey === entryKey && entry.threadKey === threadKey && entry.href === href,
  );
  return snapshot ?? null;
}

export function writeResultsSnapshot(snapshot: ResultsSnapshot): void {
  if (typeof window === "undefined") return;
  if (!resultsThreadRestorable(snapshot.messages)) return;
  const entries = readStore().entries.filter((entry) => entry.entryKey !== snapshot.entryKey);
  entries.push(snapshot);
  writeStore(entries);
}

export function clearResultsSnapshot(entryKey: string): void {
  if (typeof window === "undefined") return;
  writeStore(readStore().entries.filter((entry) => entry.entryKey !== entryKey));
}

function readOrigin(now = Date.now()): CafeOrigin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CAFE_ORIGIN_KEY);
    if (!raw) return null;
    const origin = parseCafeOrigin(JSON.parse(raw), now);
    if (!origin) window.sessionStorage.removeItem(CAFE_ORIGIN_KEY);
    return origin;
  } catch {
    return null;
  }
}

function writeOrigin(origin: CafeOrigin): void {
  try {
    window.sessionStorage.setItem(CAFE_ORIGIN_KEY, JSON.stringify(origin));
  } catch {
    // Ignore quota failures. The home link remains the fallback.
  }
}

export function readResultsScroll(): ResultsScroll {
  const list = document.querySelector("[data-halfway-results]");
  return {
    scrollY: window.scrollY,
    listScroll: list instanceof HTMLElement ? list.scrollTop : 0,
  };
}

function plainClick(event: {
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  button: number;
  defaultPrevented: boolean;
}): boolean {
  return (
    !event.defaultPrevented &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    event.button === 0
  );
}

/** Remember the results entry before a café card navigation. */
export function rememberCafeNavigation(anchor: HTMLAnchorElement, event: MouseEvent): void {
  if (!plainClick(event)) return;
  if (anchor.target && anchor.target !== "_self") return;
  let url: URL;
  try {
    url = new URL(anchor.href, window.location.href);
  } catch {
    return;
  }
  if (url.origin !== window.location.origin) return;
  const cafePath = cafeCardPathname(url.pathname);
  if (!cafePath) return;
  const entryKey = navigationEntryKey() ?? resultsSnapshotKey() ?? "soft";
  const scroll = readResultsScroll();
  openedFromResults = true;
  writeOrigin({
    entryKey,
    href: currentResultsHref(),
    cafePath,
    scrollY: scroll.scrollY,
    listScroll: scroll.listScroll,
    ts: Date.now(),
  });
  const existing = readStore().entries.find((entry) => entry.entryKey === (resultsSnapshotKey() ?? entryKey));
  if (existing) {
    writeResultsSnapshot({ ...existing, scrollY: scroll.scrollY, listScroll: scroll.listScroll });
  }
}

export function canReturnFromThisCafe(now = Date.now()): boolean {
  if (typeof window === "undefined") return false;
  const cafePath = cafeCardPathname(window.location.pathname);
  if (!cafePath) return false;
  const origin = readOrigin(now);
  if (
    shouldReturnInApp({
      cafePath,
      origin,
      previous: previousHistoryEntry(),
      now,
    })
  ) {
    return true;
  }
  // Soft navigations keep this document. Browsers without the Navigation
  // API still opened the card from the click that armed this flag.
  return Boolean(openedFromResults && origin && normalizePath(origin.cafePath) === cafePath);
}

export function onCafeBackClick(event: {
  preventDefault(): void;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  button: number;
  defaultPrevented: boolean;
}): void {
  if (!plainClick(event)) return;
  if (!canReturnFromThisCafe()) return;
  event.preventDefault();
  window.history.back();
}

export function restoreResultsScroll(): void {
  if (typeof window === "undefined") return;
  const key = resultsSnapshotKey() ?? navigationEntryKey();
  if (!key) return;
  const origin = readOrigin();
  const href = currentResultsHref();
  const snapshot = readStore().entries.find((entry) => entry.entryKey === key && entry.href === href);
  const scroll = origin && origin.entryKey === key && origin.href === href
    ? { scrollY: origin.scrollY, listScroll: origin.listScroll }
    : snapshot
      ? { scrollY: snapshot.scrollY, listScroll: snapshot.listScroll }
      : null;
  if (!scroll) return;
  window.scrollTo(0, scroll.scrollY);
  const list = document.querySelector("[data-halfway-results]");
  if (list instanceof HTMLElement && scroll.listScroll > 0) {
    list.scrollTop = scroll.listScroll;
  }
}

export function installCafeReturn(): () => void {
  function onClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest("a");
    if (!(anchor instanceof HTMLAnchorElement)) return;
    rememberCafeNavigation(anchor, event);
  }
  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
