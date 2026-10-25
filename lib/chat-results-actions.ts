/**
 * Decisions the results screen makes when a list should be cleared or kept.
 * Hook-free so the handlers can be tested without rendering chat.
 */
import { resultsSnapshotIsFresh } from "./results-return";

/** Start new Halfway always drops the saved بيننا and invite lists. */
export function startNewHalfwayShouldClear(): boolean {
  return true;
}

/**
 * An expired invite session, or an expired بيننا session, drops those
 * saved lists. A live session keeps them.
 */
export function expiredHalfwayShouldClear(
  sessionExpired: boolean,
  halfwayInviteExpired: boolean,
): boolean {
  return sessionExpired || halfwayInviteExpired;
}

/**
 * A new ask typed on the home composer replaces the saved search.
 * Directory and list pages are their own URLs and do not.
 */
export function homeSearchShouldClear(homeSurface: boolean): boolean {
  return homeSurface;
}

/**
 * The invite response is the first page. A longer fresh snapshot already
 * on this history entry must stay, including show-more batches.
 */
export function halfwayFetchKeepsLongerSnapshot(input: {
  saved: { savedAt: number; pickCount: number } | null;
  incomingPickCount: number;
  now?: number;
}): boolean {
  if (!input.saved) return false;
  if (!resultsSnapshotIsFresh(input.saved.savedAt, input.now ?? Date.now())) return false;
  return input.saved.pickCount > input.incomingPickCount;
}
