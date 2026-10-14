import type { Pin } from "./types";

/**
 * بيننا results email: first result only, once per session.
 * In-memory guard is per server instance (best-effort across cold starts);
 * invite sessions are also gated on a successful results freeze.
 */
export const HALFWAY_NOTIFY_WINDOW_MS = 30 * 60 * 1000;
const MAX_KEYS = 5000;

const sentAt = new Map<string, number>();

/** ~110 m: same two pins from the same visitor read as one local session. */
function roundedPin(pin: Pin): string {
  return `${pin.lat.toFixed(3)},${pin.lng.toFixed(3)}`;
}

export function halfwayNotifyKey(input: {
  sessionId?: string | null;
  visitor?: string | null;
  locations?: readonly { pin?: Pin | null }[] | null;
}): string {
  const sessionId = input.sessionId?.trim();
  if (sessionId) return `s:${sessionId}`;
  const visitor =
    typeof input.visitor === "string" && input.visitor.trim()
      ? input.visitor.trim().slice(0, 64)
      : "anon";
  const pins = (input.locations ?? [])
    .flatMap((row) => (row.pin ? [roundedPin(row.pin)] : []))
    .sort()
    .join("|");
  return `l:${visitor}:${pins}`;
}

function prune(now: number): void {
  for (const [key, at] of sentAt) {
    if (now - at >= HALFWAY_NOTIFY_WINDOW_MS) sentAt.delete(key);
  }
  while (sentAt.size >= MAX_KEYS) {
    const oldest = sentAt.keys().next().value;
    if (oldest === undefined) break;
    sentAt.delete(oldest);
  }
}

/**
 * Decides and (when true) claims the send. 'more' pages and rerolls never
 * email; invite sessions email only when the results freeze succeeded; each
 * key emails at most once per 30 minutes on this instance.
 */
export function claimHalfwayResultsNotify(input: {
  more: boolean;
  reroll: boolean;
  pickCount: number;
  sessionId?: string | null;
  frozeOk: boolean;
  visitor?: string | null;
  locations?: readonly { pin?: Pin | null }[] | null;
  now?: number;
}): boolean {
  if (input.more || input.reroll || input.pickCount === 0) return false;
  if (input.sessionId?.trim() && !input.frozeOk) return false;
  const now = input.now ?? Date.now();
  const key = halfwayNotifyKey(input);
  const last = sentAt.get(key);
  if (last !== undefined && now - last < HALFWAY_NOTIFY_WINDOW_MS) return false;
  prune(now);
  sentAt.set(key, now);
  return true;
}

/** Test-only reset. */
export function resetHalfwayNotifyGuard(): void {
  sentAt.clear();
}
