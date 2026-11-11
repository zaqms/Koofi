/**
 * Fixed-list pages (Nearby and the other chip lists) keep their scroll on
 * Back. The browser restores it before location swaps the fallback chrome
 * for the distance list, and that swap pulls the page to the wrong offset.
 * We remember only the path and the scroll offset — no coordinates.
 */
import { FIXED_LIST_IDS } from "./fixed-list-ids";
import { chipSharePath } from "./product";

export const LIST_SCROLL_KEY = "wain.listScroll.v1";

/**
 * A fresh high-accuracy fix often takes more than two seconds.
 * User input cancels sooner; this only drops a fix that never arrives.
 */
export const LIST_SCROLL_MAX_WAIT_MS = 8000;

/** Scrolling less than about one card is still the top. Don't store a café for it. */
export const LIST_SCROLL_MIN_Y = 160;

/** Layout anchoring can nudge a card by a few pixels. A real scroll moves it further. */
export const LIST_SCROLL_MOVE_TOLERANCE_PX = 32;

export type ListScrollRecord = {
  path: string;
  /** Page scroll offset. Fallback when the card is not on screen. */
  y: number;
  /** Catalog id of the top visible card. Not a place id and not a coordinate. */
  cardId?: string;
  /** That card's top edge, in pixels from the viewport top. */
  cardTop?: number;
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

const CARD_ID_RE = /^[a-z0-9-]{1,80}$/;

function cardAnchor(card: { id: string; top: number } | null | undefined): Pick<ListScrollRecord, "cardId" | "cardTop"> {
  if (!card || !CARD_ID_RE.test(card.id) || !Number.isFinite(card.top)) return {};
  return { cardId: card.id, cardTop: Math.round(card.top) };
}

/** 160px, or one card when the card is taller than that. */
export function listScrollMinY(cardHeight: number | null): number {
  if (cardHeight != null && Number.isFinite(cardHeight) && cardHeight > 0) {
    return Math.max(LIST_SCROLL_MIN_Y, Math.round(cardHeight));
  }
  return LIST_SCROLL_MIN_Y;
}

export function listScrollWorthSaving(scrollY: number, cardHeight: number | null = null): boolean {
  return Number.isFinite(scrollY) && scrollY >= listScrollMinY(cardHeight);
}

/** Scroll to put back on this history entry. Café cards and home are ignored. */
export function rememberListScroll(
  pathname: string,
  scrollY: number,
  card?: { id: string; top: number } | null,
  cardHeight: number | null = null,
): ListScrollRecord | null {
  if (!isFixedListScrollPath(pathname)) return null;
  if (!listScrollWorthSaving(scrollY, cardHeight)) return null;
  return { path: normalizePath(pathname), y: Math.round(scrollY), ...cardAnchor(card) };
}

export function readListScroll(raw: string | null): ListScrollRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { path?: unknown; y?: unknown; cardId?: unknown; cardTop?: unknown };
    if (!parsed || typeof parsed.path !== "string" || typeof parsed.y !== "number") return null;
    if (!isFixedListScrollPath(parsed.path)) return null;
    if (!Number.isFinite(parsed.y) || parsed.y < 0) return null;
    const record: ListScrollRecord = { path: normalizePath(parsed.path), y: Math.round(parsed.y) };
    if (typeof parsed.cardId === "string" && CARD_ID_RE.test(parsed.cardId)) {
      record.cardId = parsed.cardId;
      if (typeof parsed.cardTop === "number" && Number.isFinite(parsed.cardTop)) {
        record.cardTop = Math.round(parsed.cardTop);
      }
    }
    return record;
  } catch {
    return null;
  }
}

/**
 * The same card staying put while scrollY changes is layout anchoring, not a person.
 * A different screen position for that card, or a scroll with no card to compare, is movement.
 * A new card id means the list swapped; that is not movement either.
 */
export function listScrollLooksLikeUserMove(input: {
  cardId: string | null;
  cardTop: number | null;
  baselineCardId: string | null;
  baselineCardTop: number | null;
  scrollY: number;
  baselineScrollY: number | null;
  tolerance?: number;
}): boolean {
  const tolerance = input.tolerance ?? LIST_SCROLL_MOVE_TOLERANCE_PX;
  if (input.cardId && input.cardId !== input.baselineCardId) return false;
  const cardDelta =
    input.cardTop != null && input.baselineCardTop != null ? Math.abs(input.cardTop - input.baselineCardTop) : null;
  const scrollDelta =
    input.baselineScrollY != null ? Math.abs(input.scrollY - input.baselineScrollY) : null;
  if (cardDelta != null && input.cardId) {
    // Anchoring keeps the card still while scrollY changes. A layout jump
    // moves the card while scrollY stays. A person moves both.
    if (cardDelta <= tolerance) return false;
    if (scrollDelta == null || scrollDelta <= tolerance) return false;
    return true;
  }
  if (scrollDelta == null) return false;
  return scrollDelta > tolerance;
}

/** Prefer the same card's place in the settled list. Otherwise use the saved offset. */
export function listScrollAnchorY(record: ListScrollRecord, cardDocumentTop: number | null): number {
  if (
    record.cardId &&
    typeof record.cardTop === "number" &&
    cardDocumentTop != null &&
    Number.isFinite(cardDocumentTop)
  ) {
    return Math.max(0, Math.round(cardDocumentTop - record.cardTop));
  }
  return Math.max(0, Math.round(record.y));
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

export function clearListScroll(storage: { removeItem(key: string): void }): void {
  try {
    storage.removeItem(LIST_SCROLL_KEY);
  } catch {
    // Already empty.
  }
  held = null;
}

export function writeListScroll(
  storage: { setItem(key: string, value: string): void },
  record: ListScrollRecord,
): void {
  const payload: { path: string; y: number; cardId?: string; cardTop?: number } = {
    path: record.path,
    y: record.y,
  };
  if (record.cardId && typeof record.cardTop === "number") {
    payload.cardId = record.cardId;
    payload.cardTop = record.cardTop;
  }
  storage.setItem(LIST_SCROLL_KEY, JSON.stringify(payload));
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
