import type { ResultsFeedbackSource } from "./track";

const STORAGE_KEY = "wain.results_feedback.v1";

type GuardChoice = {
  choice: "yes" | "no";
  reason?: string;
  /** Something else stays open until blur / Enter / Done. */
  noteDone?: boolean;
};

type GuardStore = {
  byKey: Record<string, GuardChoice>;
  bySource: Partial<Record<ResultsFeedbackSource, true>>;
};

function emptyStore(): GuardStore {
  return { byKey: {}, bySource: {} };
}

function readStore(): GuardStore {
  if (typeof window === "undefined") return emptyStore();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<GuardStore>;
    return {
      byKey: parsed.byKey && typeof parsed.byKey === "object" ? parsed.byKey : {},
      bySource:
        parsed.bySource && typeof parsed.bySource === "object"
          ? parsed.bySource
          : {},
    };
  } catch {
    return emptyStore();
  }
}

const listeners = new Set<() => void>();

function emitFeedbackGuard(): void {
  for (const listener of listeners) listener();
}

export function subscribeFeedbackGuard(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function writeStore(store: GuardStore): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Private mode / quota — still ask this visit.
  }
  emitFeedbackGuard();
}

export function feedbackGuardSnapshot(
  source: ResultsFeedbackSource,
  resetKey: string,
): string {
  return JSON.stringify({
    instance: readFeedbackInstance(source, resetKey),
    offer: shouldOfferResultsFeedback(source, resetKey),
  });
}

export const EMPTY_FEEDBACK_GUARD_SNAPSHOT = JSON.stringify({
  instance: null,
  offer: true,
});

export function feedbackInstanceKey(
  source: ResultsFeedbackSource,
  resetKey: string,
): string {
  return `${source}:${resetKey}`;
}

export function readFeedbackInstance(
  source: ResultsFeedbackSource,
  resetKey: string,
): GuardChoice | null {
  return readStore().byKey[feedbackInstanceKey(source, resetKey)] ?? null;
}

export function sourceAlreadyAnswered(
  source: ResultsFeedbackSource,
): boolean {
  return Boolean(readStore().bySource[source]);
}

/**
 * Halfway re-asks on a new result set (new resetKey). Other screens hide
 * after one submit in the same tab session so the block is not spammy.
 */
export function shouldOfferResultsFeedback(
  source: ResultsFeedbackSource,
  resetKey: string,
): boolean {
  if (readFeedbackInstance(source, resetKey)) return true;
  if (source === "halfway_results") return true;
  return !sourceAlreadyAnswered(source);
}

export function markResultsFeedback(
  source: ResultsFeedbackSource,
  resetKey: string,
  choice: GuardChoice,
): void {
  const store = readStore();
  store.byKey[feedbackInstanceKey(source, resetKey)] = choice;
  store.bySource[source] = true;
  writeStore(store);
}
