/**
 * Fixed-list pages (Nearby and the other chip lists) keep their scroll on
 * Back. The browser restores it before location swaps the fallback chrome
 * for the distance list, and that swap pulls the page to the wrong offset.
 * We remember only the path and the scroll offset — no coordinates.
 */
import { FIXED_LIST_IDS } from "./fixed-list-ids";
import { chipSharePath } from "./product";

export const LIST_SCROLL_KEY = "wain.listScroll.v1";

export type ListScrollRecord = {
  path: string;
  y: number;
};

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
}): number | null {
  if (!input.settled) return null;
  if (input.navigationType !== "back_forward") return null;
  const record = input.record;
  if (!record) return null;
  if (normalizePath(record.path) !== normalizePath(input.pathname)) return null;
  if (!Number.isFinite(record.y) || record.y <= 0) return null;
  return record.y;
}
