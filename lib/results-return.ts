/**
 * Back from a café card should return to the results the visitor came from.
 *
 * Home search and بيننا keep their picks in memory on `/`, `/en`, `/halfway`.
 * A document reload of that history entry (browser back after a full load)
 * otherwise paints the homepage, because the URL has no query. The in-app
 * back control is a link to `/` or `/en`, so district and list pages lose
 * their place too.
 *
 * Snapshots live in sessionStorage under the history entry key. They keep
 * the ask text and each café's own place link — no people's pins, no
 * coordinates taken from those pins, and no invite id. They restore only on
 * back/forward, and only until 30 minutes after they were first saved.
 * Reading or restoring does not start that clock again. A direct visit keeps
 * the home link. A chain of café cards steps back through history and keeps
 * the results scroll on the original entry.
 */

import { isOfficialMapsPlaceUrl, placeIdentityKeys } from "./place-coords";
import { halfwayPath } from "./product";
import type { Language } from "./types";

export const RESULTS_SNAPSHOT_KEY = "wain.resultsSnapshot.v1";
export const CAFE_ORIGIN_KEY = "wain.cafeOrigin.v1";

/**
 * Hides the server paint only when this load is a back/forward traversal
 * and the history entry already has a snapshot. Reload and a freshly typed
 * URL stay on the server page.
 */
export const RESULTS_RESTORE_BOOTSTRAP =
  `(function(){try{window.addEventListener("popstate",function(){window.__wainResultsTraverse=1;});var nav=performance.getEntriesByType("navigation")[0];if(!nav||nav.type!=="back_forward")return;var path=location.pathname;if(path.length>1&&path.endsWith("/"))path=path.slice(0,-1);var home=path==="/"||path==="/en";var halfway=path==="/halfway"||path==="/en/halfway"||/^\\/(?:en\\/)?h\\/[^/]+$/.test(path);if(!home&&!halfway)return;var state=history.state;if(home&&!(state&&state.wainSearch===true))return;var key=state&&typeof state.wainEntry==="string"?state.wainEntry:"";if(!key&&window.navigation&&window.navigation.currentEntry)key=window.navigation.currentEntry.key||"";if(!key)return;var raw=sessionStorage.getItem(${JSON.stringify(RESULTS_SNAPSHOT_KEY)});if(!raw||raw.indexOf('"entryKey":"'+key+'"')<0)return;document.documentElement.setAttribute("data-results-pending","");}catch(e){}})();`;

export function revealResultsRestore(): void {
  if (typeof document === "undefined") return;
  document.documentElement.removeAttribute("data-results-pending");
}

const MAX_AGE_MS = 12 * 60 * 60 * 1000;
/** Results are only useful for the visit that made them. */
export const RESULTS_SNAPSHOT_TTL_MS = 30 * 60 * 1000;
const COORDINATE_RE = /\d{1,3}\.\d{4,}/;
const MAX_STORE_CHARS = 150_000;
const MAX_ENTRIES = 8;

export type ResultsScroll = {
  scrollY: number;
  listScroll: number;
};

export type CafeOrigin = {
  /** History entry of the results screen that started this chain. */
  entryKey: string;
  href: string;
  /** Café card most recently opened. */
  cafePath: string;
  /** Every café card opened from those results, oldest first. */
  trail: string[];
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
  /** Listing cards on screen when the visitor left. Scroll waits for these. */
  cardCount: number;
  awaitingMaps: boolean;
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

/** Invite sessions store a generic thread key. The id stays in the URL only. */
export function storageThreadKey(threadKey: string): string {
  if (/^halfway:[^:]+$/.test(threadKey) && threadKey !== "halfway:session") return "halfway:session";
  return threadKey;
}

/** `/h/{id}` is the invite id. Snapshots keep the screen, not the id. */
export function storageHref(href: string): string {
  const path = normalizePath(href.split("?")[0]?.split("#")[0] ?? href);
  if (/^\/en\/h\/[^/]+$/.test(path)) return "/en/h";
  if (/^\/h\/[^/]+$/.test(path)) return "/h";
  return path;
}

export function extractInviteId(threadKey: string, href: string): string | null {
  const fromHref = href.match(/\/h\/([^/?#]+)/)?.[1];
  if (fromHref && fromHref !== "expired") return fromHref;
  const fromThread = threadKey.match(/^halfway:([^:]+)$/)?.[1];
  if (fromThread && fromThread !== "session") return fromThread;
  return null;
}

function stripInviteId(value: string, inviteId: string | null): string {
  if (!inviteId || inviteId.length < 8) return value;
  return value.split(inviteId).join("");
}

function isPick(value: unknown): value is Record<string, unknown> & {
  id: string;
  nameAr: string;
  nameEn: string;
  neighborhood: string;
  neighborhoodAr: string;
  cardPath: string;
} {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.nameAr === "string" &&
    typeof value.nameEn === "string" &&
    typeof value.neighborhood === "string" &&
    typeof value.neighborhoodAr === "string" &&
    Array.isArray(value.vibeTags) &&
    Array.isArray(value.momentTags) &&
    (value.mapsHref === undefined || typeof value.mapsHref === "string") &&
    typeof value.cardPath === "string"
  );
}

/**
 * The café's public Maps place (`/maps/place/` with its place id) stays.
 * A coordinate search is a person's pin, not that place, so it does not.
 * Never invent a name search — "Starbucks al-mathar Riyadh" matches several branches.
 */
function peoplePins(message: Record<string, unknown>): { lat: number; lng: number }[] {
  if (!Array.isArray(message.halfwayLocations)) return [];
  const pins: { lat: number; lng: number }[] = [];
  for (const row of message.halfwayLocations) {
    if (!isRecord(row) || typeof row.lat !== "number" || typeof row.lng !== "number") continue;
    if (!Number.isFinite(row.lat) || !Number.isFinite(row.lng)) continue;
    pins.push({ lat: row.lat, lng: row.lng });
  }
  return pins;
}

function embedsPeoplePin(text: string, pins: readonly { lat: number; lng: number }[]): boolean {
  for (const pin of pins) {
    for (let digits = 4; digits <= 6; digits += 1) {
      if (text.includes(pin.lat.toFixed(digits)) || text.includes(pin.lng.toFixed(digits))) return true;
    }
  }
  return false;
}

function caféPlaceHref(
  value: string,
  inviteId: string | null,
  pins: readonly { lat: number; lng: number }[],
): string | null {
  const href = stripInviteId(value, inviteId).trim();
  if (!href || embedsPeoplePin(href, pins)) return null;
  if (isOfficialMapsPlaceUrl(href)) return href;
  if (/[?&](?:q|query)=[-+]?\d/i.test(href)) return null;
  if (COORDINATE_RE.test(href)) return null;
  return href;
}

/** True until 30 minutes after the original save. A later read does not extend it. */
export function resultsSnapshotIsFresh(savedAt: number, now = Date.now()): boolean {
  return now - savedAt <= RESULTS_SNAPSHOT_TTL_MS && savedAt <= now + 60_000;
}

export function resultsPickCount(messages: readonly { picks?: readonly unknown[] }[]): number {
  let count = 0;
  for (const message of messages) {
    if (Array.isArray(message.picks)) count += message.picks.length;
  }
  return count;
}

function sanitizePick(
  value: unknown,
  inviteId: string | null,
  pins: readonly { lat: number; lng: number }[],
): Record<string, unknown> | null {
  if (!isPick(value)) return null;
  const pick: Record<string, unknown> = {
    id: stripInviteId(value.id, inviteId),
    nameAr: stripInviteId(value.nameAr, inviteId),
    nameEn: stripInviteId(value.nameEn, inviteId),
    neighborhood: stripInviteId(value.neighborhood, inviteId),
    neighborhoodAr: stripInviteId(value.neighborhoodAr, inviteId),
    vibeTags: value.vibeTags,
    momentTags: value.momentTags,
    cardPath: stripInviteId(String(value.cardPath).split("?")[0] ?? "", inviteId),
  };
  const mapsHref = typeof value.mapsHref === "string" ? caféPlaceHref(value.mapsHref, inviteId, pins) : null;
  if (mapsHref) {
    pick.mapsHref = mapsHref;
    const placeId = placeIdentityKeys(mapsHref)[0];
    if (placeId) pick.placeId = placeId;
  }
  if (value.isChain === true) pick.isChain = true;
  for (const key of ["branchEn", "branchAr", "photoUrl", "logoUrl", "why", "neighborhoodLabel", "placeId"] as const) {
    const field = value[key];
    if (typeof field !== "string" || !field || COORDINATE_RE.test(field)) continue;
    pick[key] = stripInviteId(field, inviteId);
  }
  if (Array.isArray(value.tags)) {
    const tags = value.tags.filter((tag) => typeof tag === "string" && tag && !COORDINATE_RE.test(tag));
    if (tags.length > 0) pick.tags = tags.map((tag) => stripInviteId(tag, inviteId));
  }
  return pick;
}

function parseMessage(
  value: unknown,
  inviteId: string | null,
  pins: readonly { lat: number; lng: number }[] = [],
): ResultsMessage | null {
  if (!isRecord(value)) return null;
  if (value.role !== "user" && value.role !== "assistant") return null;
  if (typeof value.id !== "string" || typeof value.text !== "string") return null;
  const message: ResultsMessage = {
    id: stripInviteId(value.id, inviteId) || "m",
    role: value.role,
    text: stripInviteId(value.text, inviteId),
  };
  if (value.language === "ar" || value.language === "en") message.language = value.language;
  if (value.role === "assistant") {
    if (Array.isArray(value.picks)) {
      const picks = value.picks
        .map((pick) => sanitizePick(pick, inviteId, pins))
        .filter((pick): pick is Record<string, unknown> => Boolean(pick));
      if (picks.length > 0) message.picks = picks;
    }
    if (value.thinCatalog === true) message.thinCatalog = true;
    if (isRecord(value.districtMatch) && typeof value.districtMatch.district_slug === "string") {
      message.districtMatch = {
        district_slug: value.districtMatch.district_slug,
        ...(value.districtMatch.locale === "ar" || value.districtMatch.locale === "en"
          ? { locale: value.districtMatch.locale }
          : {}),
      };
    }
    if (typeof value.halfwayMore === "boolean") message.halfwayMore = value.halfwayMore;
    if (value.halfwayPaged === true) message.halfwayPaged = true;
    if (value.halfwayJoined === true) message.halfwayJoined = true;
    if (value.resultVia === "typed" || value.resultVia === "chip") {
      message.resultVia = value.resultVia;
    }
  }
  return message;
}

export function parseResultsSnapshot(value: unknown, now = Date.now()): ResultsSnapshot | null {
  if (!isRecord(value)) return null;
  if (typeof value.entryKey !== "string" || !value.entryKey) return null;
  if (typeof value.threadKey !== "string" || !value.threadKey) return null;
  if (typeof value.href !== "string" || !value.href.startsWith("/")) return null;
  if (!Array.isArray(value.messages)) return null;
  const savedAt = typeof value.savedAt === "number" ? value.savedAt : 0;
  if (!resultsSnapshotIsFresh(savedAt, now)) return null;
  const inviteId = extractInviteId(
    value.threadKey,
    typeof value.href === "string" ? value.href : "",
  );
  const messages = value.messages
    .map((message) => parseMessage(message, inviteId, isRecord(message) ? peoplePins(message) : []))
    .filter((message): message is ResultsMessage => Boolean(message));
  if (!resultsThreadRestorable(messages)) return null;
  const composerLanguage = value.composerLanguage === "en" ? "en" : value.composerLanguage === "ar" ? "ar" : null;
  if (!composerLanguage) return null;
  return {
    entryKey: value.entryKey,
    threadKey: storageThreadKey(value.threadKey),
    href: storageHref(value.href),
    scrollY: typeof value.scrollY === "number" ? value.scrollY : 0,
    listScroll: typeof value.listScroll === "number" ? value.listScroll : 0,
    messages,
    composerLanguage,
    cardCount: typeof value.cardCount === "number" && value.cardCount > 0 ? value.cardCount : 0,
    awaitingMaps: value.awaitingMaps === true,
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
  const cafePath = normalizePath(value.cafePath);
  const trail = Array.isArray(value.trail)
    ? value.trail.filter((path): path is string => typeof path === "string" && Boolean(cafeCardPathname(path))).map((path) => normalizePath(path))
    : [];
  if (!trail.includes(cafePath)) trail.push(cafePath);
  return {
    entryKey: value.entryKey,
    href: storageHref(value.href),
    cafePath,
    trail,
    scrollY: typeof value.scrollY === "number" ? value.scrollY : 0,
    listScroll: typeof value.listScroll === "number" ? value.listScroll : 0,
    ts: value.ts,
  };
}

const IN_APP_HOSTS = new Set(["wain.lol", "www.wain.lol", "localhost", "127.0.0.1"]);

/** Previous history entry belongs to this tab's own pages. */
export function previousEntryIsInApp(previous: HistoryLike): boolean {
  if (!previous?.url) return false;
  try {
    const url = new URL(previous.url, "https://wain.lol");
    return IN_APP_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Step back when the previous entry is in this app, or when this card is
 * still on the chain we opened from results (browsers without entry URLs).
 * A direct visit, with no previous entry and no chain, keeps Home.
 */
export function shouldReturnInApp(input: {
  cafePath: string;
  origin: CafeOrigin | null;
  previous: HistoryLike;
  now?: number;
}): boolean {
  if (input.previous?.url && !previousEntryIsInApp(input.previous)) return false;
  if (previousEntryIsInApp(input.previous) || input.previous?.key) return true;
  const origin = input.origin;
  if (!origin) return false;
  if (input.now != null && input.now - origin.ts > MAX_AGE_MS) return false;
  const trail = origin.trail?.length ? origin.trail : [origin.cafePath];
  return trail.some((path) => normalizePath(path) === normalizePath(input.cafePath));
}

/** Keep the results entry and its scroll while the visitor opens more cards. */
export function nextCafeOrigin(input: {
  existing: CafeOrigin | null;
  currentPath: string;
  destinationPath: string;
  entryKey: string;
  href: string;
  scrollY: number;
  listScroll: number;
  now: number;
}): CafeOrigin {
  const destination = normalizePath(input.destinationPath);
  const currentCafe = cafeCardPathname(input.currentPath);
  const existing = input.existing;
  if (existing && currentCafe && normalizePath(existing.cafePath) === currentCafe) {
    const trail = existing.trail.filter((path) => path !== destination);
    trail.push(destination);
    return { ...existing, cafePath: destination, trail, ts: input.now };
  }
  return {
    entryKey: input.entryKey,
    href: storageHref(input.href),
    cafePath: destination,
    trail: [destination],
    scrollY: input.scrollY,
    listScroll: input.listScroll,
    ts: input.now,
  };
}

export function shouldRestoreResultsNavigation(input: {
  navigationType?: string | null;
  traversed?: boolean;
}): boolean {
  if (input.traversed) return true;
  return input.navigationType === "back_forward";
}

export function resultsNavigationShouldRestore(): boolean {
  if (typeof window === "undefined") return false;
  const traversed = (window as Window & { __wainResultsTraverse?: number }).__wainResultsTraverse === 1;
  let navigationType: string | null = null;
  try {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    navigationType = nav?.type ?? null;
  } catch {
    navigationType = null;
  }
  if (!navigationType) {
    const legacy = (performance as Performance & { navigation?: { type?: number } }).navigation;
    if (legacy?.type === 2) navigationType = "back_forward";
    else if (legacy?.type === 1) navigationType = "reload";
    else if (legacy?.type === 0) navigationType = "navigate";
  }
  return shouldRestoreResultsNavigation({ navigationType, traversed });
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

function snapshotRawIsDirty(raw: string): boolean {
  return (
    /"(?:lat|lng|halfwayLocations|halfwayWaitingId|halfwayWaitingMe)"/.test(raw) ||
    /maps\.google\.com\/\?q=\d/.test(raw) ||
    /\/h\/(?!expired")[^"\\/]+/.test(raw) ||
    /"threadKey":"halfway:(?!session")/.test(raw)
  );
}

function readStore(now = Date.now()): StoreFile {
  try {
    const raw = window.sessionStorage.getItem(RESULTS_SNAPSHOT_KEY);
    if (!raw) return { entries: [] };
    const parsed = JSON.parse(raw) as { entries?: unknown };
    if (!parsed || !Array.isArray(parsed.entries)) return { entries: [] };
    const entries = parsed.entries
      .map((entry) => parseResultsSnapshot(entry, now))
      .filter((entry): entry is ResultsSnapshot => Boolean(entry));
    if (entries.length !== parsed.entries.length || snapshotRawIsDirty(raw)) {
      writeStore(entries);
    }
    return { entries };
  } catch {
    return { entries: [] };
  }
}

function isHalfwaySnapshot(entry: ResultsSnapshot): boolean {
  return (
    entry.threadKey.startsWith("halfway") ||
    entry.href === "/halfway" ||
    entry.href === "/en/halfway" ||
    entry.href === "/h" ||
    entry.href === "/en/h"
  );
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

export function readResultsSnapshot(entryKey: string, threadKey: string, href: string, now = Date.now()): ResultsSnapshot | null {
  if (typeof window === "undefined") return null;
  const wantThread = storageThreadKey(threadKey);
  const wantHref = storageHref(href);
  const snapshot = readStore(now).entries.find(
    (entry) => entry.entryKey === entryKey && entry.threadKey === wantThread && entry.href === wantHref,
  );
  return snapshot ?? null;
}

function readRawSnapshotEntries(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(RESULTS_SNAPSHOT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { entries?: unknown };
    if (!parsed || !Array.isArray(parsed.entries)) return [];
    return parsed.entries.filter(isRecord);
  } catch {
    return [];
  }
}

/** Original save time, including an entry that is already past 30 minutes. */
export function resultsEntrySavedAt(entryKey: string): number | null {
  const entry = readRawSnapshotEntries().find((item) => item.entryKey === entryKey);
  return entry && typeof entry.savedAt === "number" ? entry.savedAt : null;
}

export function resultsEntryExpired(entryKey: string, now = Date.now()): boolean {
  const savedAt = resultsEntrySavedAt(entryKey);
  if (savedAt == null) return false;
  return !resultsSnapshotIsFresh(savedAt, now);
}

/**
 * Where to put the page when this history entry loads.
 * A restored snapshot keeps its scroll. Anything else on a results
 * screen starts at the top, so an expired search does not reuse it.
 */
export function resultsPageScroll(input: {
  navigationRestores: boolean;
  persistable: boolean;
  hasFreshSnapshot: boolean;
}): "saved" | "top" | "leave" {
  if (input.navigationRestores && input.hasFreshSnapshot) return "saved";
  if (input.persistable) return "top";
  return "leave";
}

export function resetResultsScroll(): void {
  if (typeof window === "undefined") return;
  window.scrollTo(0, 0);
  const list = document.querySelector("[data-halfway-results]");
  if (list instanceof HTMLElement) list.scrollTop = 0;
}

export function writeResultsSnapshot(snapshot: ResultsSnapshot, now = Date.now()): void {
  if (typeof window === "undefined") return;
  // Read the original clock before readStore drops an expired entry.
  // A restore that passes Date.now() must not start the 30 minutes over,
  // and must not bring back a list that has already expired.
  const originalSavedAt = resultsEntrySavedAt(snapshot.entryKey);
  const savedAt = originalSavedAt ?? snapshot.savedAt;
  const clean = parseResultsSnapshot({ ...snapshot, savedAt }, now);
  const entries = readStore(now).entries.filter((entry) => entry.entryKey !== snapshot.entryKey);
  if (!clean) {
    writeStore(entries);
    return;
  }
  entries.push(clean);
  writeStore(entries);
}

export function clearResultsSnapshot(entryKey: string): void {
  if (typeof window === "undefined") return;
  writeStore(readStore().entries.filter((entry) => entry.entryKey !== entryKey));
}

/** Drop بيننا and invite snapshots. Home search stays. */
export function clearHalfwayResultsSnapshots(): void {
  if (typeof window === "undefined") return;
  writeStore(readStore().entries.filter((entry) => !isHalfwaySnapshot(entry)));
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
  const now = Date.now();
  openedFromResults = true;
  const origin = nextCafeOrigin({
    existing: readOrigin(now),
    currentPath: window.location.pathname,
    destinationPath: cafePath,
    entryKey,
    href: currentResultsHref(),
    scrollY: scroll.scrollY,
    listScroll: scroll.listScroll,
    now,
  });
  writeOrigin(origin);
  const continuing = Boolean(cafeCardPathname(window.location.pathname));
  if (continuing) return;
  const snapshotKey = resultsSnapshotKey() ?? entryKey;
  const existing = readStore(now).entries.find((entry) => entry.entryKey === snapshotKey);
  if (existing) {
    writeResultsSnapshot({
      ...existing,
      scrollY: scroll.scrollY,
      listScroll: scroll.listScroll,
      cardCount: renderedCardCount() || existing.cardCount,
    }, now);
  }
}

function renderedCardCount(): number {
  if (typeof document === "undefined") return 0;
  const halfway = document.querySelector("[data-halfway-results]");
  const root = halfway ?? document;
  return root.querySelectorAll("[data-listing-card]").length;
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

let scrollRestoreToken = 0;

function applyResultsScroll(scrollY: number, listScroll: number): void {
  window.scrollTo(0, scrollY);
  const list = document.querySelector("[data-halfway-results]");
  if (list instanceof HTMLElement && listScroll > 0) list.scrollTop = listScroll;
}

/**
 * Scroll after the restored cards exist. Show-more batches and late layout
 * otherwise clamp the position short of the card the visitor left.
 */
export function restoreResultsScroll(): void {
  if (typeof window === "undefined") return;
  const key = resultsSnapshotKey() ?? navigationEntryKey();
  const href = storageHref(currentResultsHref());
  const snapshot = key
    ? readStore().entries.find((entry) => entry.entryKey === key && entry.href === href)
    : undefined;
  const scroll = resultsPageScroll({
    navigationRestores: resultsNavigationShouldRestore(),
    persistable: shouldPersistSnapshot(window.location.pathname, window.history.state),
    hasFreshSnapshot: Boolean(snapshot),
  });
  if (scroll === "top") {
    resetResultsScroll();
    return;
  }
  if (scroll === "leave" || !snapshot || !key) return;
  const origin = readOrigin();
  const fromOrigin = Boolean(origin && origin.entryKey === key && origin.href === href);
  const scrollY = fromOrigin ? origin?.scrollY : snapshot?.scrollY;
  const listScroll = fromOrigin ? origin?.listScroll ?? 0 : snapshot?.listScroll ?? 0;
  if (scrollY == null && listScroll <= 0) return;
  const targetY = scrollY ?? 0;
  const cardCount = snapshot?.cardCount ?? 0;
  const token = ++scrollRestoreToken;
  const started = performance.now();
  const tick = () => {
    if (token !== scrollRestoreToken) return;
    if (storageHref(currentResultsHref()) !== href) return;
    const cards = renderedCardCount();
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const list = document.querySelector("[data-halfway-results]");
    const listHeight = list instanceof HTMLElement ? list.scrollHeight - list.clientHeight : 0;
    const cardsReady = cardCount <= 0 || cards >= cardCount;
    const pageReady = targetY <= 0 || maxScroll + 2 >= targetY;
    const listReady = listScroll <= 0 || listHeight + 2 >= listScroll;
    if (cardsReady && pageReady && listReady) {
      applyResultsScroll(targetY, listScroll);
      const root = document.documentElement;
      let pageHeight = root.scrollHeight;
      let listHeightSeen = list instanceof HTMLElement ? list.scrollHeight : 0;
      if (typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(() => {
        if (token !== scrollRestoreToken) {
          observer.disconnect();
          return;
        }
        const nextPage = root.scrollHeight;
        const nextList = list instanceof HTMLElement ? list.scrollHeight : 0;
        if (nextPage === pageHeight && nextList === listHeightSeen) return;
        pageHeight = nextPage;
        listHeightSeen = nextList;
        applyResultsScroll(targetY, listScroll);
      });
      observer.observe(root);
      if (list instanceof HTMLElement) observer.observe(list);
      window.setTimeout(() => observer.disconnect(), 800);
      return;
    }
    if (performance.now() - started > 2500) {
      applyResultsScroll(targetY, listScroll);
      return;
    }
    requestAnimationFrame(tick);
  };
  tick();
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
