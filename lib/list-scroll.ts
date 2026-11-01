/**
 * Fixed-list pages (Nearby and the other chip lists) keep their scroll on
 * Back. The browser restores it before location swaps the fallback chrome
 * for the distance list, and that swap pulls the page to the wrong offset.
 * We remember only the path and the scroll offset — no coordinates.
 */
import { FIXED_LIST_IDS } from "./fixed-list-ids";
import { chipSharePath } from "./product";

export const LIST_SCROLL_KEY = "wain.listScroll.v1";

/** Stop waiting for location and drop the offset. A late fix must not jump the page. */
export const LIST_SCROLL_MAX_WAIT_MS = 1800;

export type ListScrollRecord = {
  path: string;
  y: number;
};

/**
 * One document can mount Nearby again after the hard Back (an in-app pill,
 * or café Back that stays in this document). The navigation type is still
 * `back_forward`, so the stored offset has to be taken once.
 */
let held: ListScrollRecord | null | undefined = undefined;

const FIXED_LIST_PATHS = new Set(
  FIXED_LIST_IDS.flatMap((id) => [chipSharePath(id, "ar"), chipSharePath(id, "en")]),
);

function normalizePath(pathname: string): string {
  const trimmed = pathname.trim();
  if (!trimmed) return "/";
  let path = trimmed.split("?")[0]?.split("#")[0] ?? trimmed;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return path.startsWith("/") ? path : `/${path}`;
}

export function isFixedListScrollPath(pathname: string): boolean {
  return FIXED_LIST_PATHS.has(normalizePath(pathname));
}

/** Scroll to put back on this history entry. Café cards and home are ignored. */
export function rememberListScroll(pathname: string, scrollY: number): ListScrollRecord | null {
  if (!isFixedListScrollPath(pathname)) return null;
  if (!Number.isFinite(scrollY) || scrollY < 0) return null;
  return { path: normalizePath(pathname), y: Math.round(scrollY) };
}

export function readListScroll(raw: string | null): ListScrollRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { path?: unknown; y?: unknown };
    if (!parsed || typeof parsed.path !== "string" || typeof parsed.y !== "number") return null;
    if (!isFixedListScrollPath(parsed.path)) return null;
    if (!Number.isFinite(parsed.y) || parsed.y < 0) return null;
    return { path: normalizePath(parsed.path), y: Math.round(parsed.y) };
  } catch {
    return null;
  }
}

type ListScrollStorage = {
  getItem(key: string): string | null;
  removeItem(key: string): void;
};

/**
 * Read the offset once per document and delete it. A second mount, or a
 * fresh navigation after that, finds nothing to restore.
 */
export function takeListScroll(storage: ListScrollStorage): ListScrollRecord | null {
  if (held === undefined) {
    try {
      held = readListScroll(storage.getItem(LIST_SCROLL_KEY));
      storage.removeItem(LIST_SCROLL_KEY);
    } catch {
      held = null;
    }
  }
  return held;
}

/** The offset was applied or given up. Later mounts in this document must not see it. */
export function releaseListScroll(): void {
  held = null;
}

/** A new leave saved a new offset. The next document may take it. */
export function noteListScrollWrite(): void {
  held = undefined;
}

export function writeListScroll(
  storage: { setItem(key: string, value: string): void },
  record: ListScrollRecord,
): void {
  storage.setItem(LIST_SCROLL_KEY, JSON.stringify({ path: record.path, y: record.y }));
  noteListScrollWrite();
}

/** Test hook. Production mounts share one held offset for the document. */
export function resetListScrollHold(): void {
  held = undefined;
}

/**
 * Nearby's first paint is the no-location list. Distance replaces that
 * chrome once a granted fix arrives. Restoring before that swap lands on
 * the fallback height.
 */
export function nearbyListScrollSettled(input: {
  listId: string;
  located: boolean;
  permission: "unknown" | "granted" | "prompt" | "denied";
  visitorStatus: "pending" | "ready" | "unavailable" | "denied";
}): boolean {
  if (input.listId !== "nearby") return true;
  if (input.located) return true;
  if (input.visitorStatus === "unavailable" || input.visitorStatus === "denied") return true;
  if (input.permission === "denied" || input.permission === "prompt") return true;
  return false;
}

/** Back/forward only. Reload and a fresh visit keep the browser's own position. */
export function listScrollRestoreTarget(input: {
  navigationType: string | null;
  pathname: string;
  record: ListScrollRecord | null;
  settled: boolean;
  elapsedMs?: number;
  userMoved?: boolean;
}): number | null {
  if (input.userMoved) return null;
  if ((input.elapsedMs ?? 0) >= LIST_SCROLL_MAX_WAIT_MS) return null;
  if (!input.settled) return null;
  if (input.navigationType !== "back_forward") return null;
  const record = input.record;
  if (!record) return null;
  if (normalizePath(record.path) !== normalizePath(input.pathname)) return null;
  if (!Number.isFinite(record.y) || record.y <= 0) return null;
  return record.y;
}

/**
 * Drop the stored offset once this mount has used it or given up.
 * Waiting for location, still inside the cap, keeps it for this mount only
 * (it is already removed from storage).
 */
export function listScrollShouldRelease(input: {
  navigationType: string | null;
  pathname: string;
  record: ListScrollRecord | null;
  settled: boolean;
  elapsedMs?: number;
  userMoved?: boolean;
}): boolean {
  if (!input.record) return true;
  if (input.userMoved) return true;
  if ((input.elapsedMs ?? 0) >= LIST_SCROLL_MAX_WAIT_MS) return true;
  if (input.navigationType !== "back_forward") return true;
  if (normalizePath(input.record.path) !== normalizePath(input.pathname)) return true;
  if (input.record.y <= 0) return true;
  return input.settled;
}
