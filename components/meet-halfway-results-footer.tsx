"use client";

import { MeetHalfwayFeedback } from "@/components/meet-halfway-feedback";
import { ShareIcon } from "@/components/share-icon";
import { copy } from "@/lib/copy";
import type { HalfwayResultsFooterKind } from "@/lib/meet-halfway";
import type { Language } from "@/lib/types";

type MeetHalfwayResultsFooterProps = {
  language: Language;
  kind: HalfwayResultsFooterKind;
  /** First-class بيننا results only. Thread/home keeps the quiet غيرها line. */
  surface?: "screen" | "thread";
  disabled?: boolean;
  resetKey?: string;
  packId?: string;
  onMore: () => void;
  onShareResults?: () => void;
  onStartNew?: () => void;
};

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M17.2 4.8v3.6h3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Shared refresh / exhausted / share / new line for local two-pin and /h/ guest results. */
export function MeetHalfwayResultsFooter({
  language,
  kind,
  surface = "thread",
  disabled,
  resetKey,
  packId,
  onMore,
  onShareResults,
  onStartNew,
}: MeetHalfwayResultsFooterProps) {
  if (surface !== "screen") {
    if (kind === "more") {
      return (
        <button
          type="button"
          disabled={disabled}
          onClick={onMore}
          className="inline-flex h-10 items-center rounded-full border border-line bg-foam px-3 text-sm text-ink disabled:opacity-50"
        >
          {copy.meetHalfwayMore[language]}
        </button>
      );
    }
    if (kind === "exhausted") {
      return (
        <p className="text-xs leading-5 text-ink-soft">
          {copy.meetHalfwayNoMore[language]}
        </p>
      );
    }
    return null;
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onMore}
          className="flex w-full flex-col items-center rounded-2xl border border-line bg-foam px-3 py-3 text-center disabled:opacity-50"
        >
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
            <RefreshIcon />
            {copy.meetHalfwayMoreTitle[language]}
          </span>
          <span className="mt-0.5 text-[11px] leading-4 text-ink-soft">
            {copy.meetHalfwayMoreSub[language]}
          </span>
        </button>
        {kind === "exhausted" ? (
          <p className="text-center text-xs leading-5 text-ink-soft">
            {copy.meetHalfwayNoMore[language]}
          </p>
        ) : null}
      </div>
      {resetKey ? (
        <MeetHalfwayFeedback
          language={language}
          resetKey={resetKey}
          packId={packId}
        />
      ) : null}
      {onShareResults ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onShareResults}
          className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full bg-ink text-sm text-foam disabled:opacity-50"
        >
          <ShareIcon />
          {copy.meetHalfwayShareResults[language]}
        </button>
      ) : null}
      {onStartNew ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onStartNew}
          className="inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-full border border-line bg-foam text-sm text-ink disabled:opacity-50"
        >
          <span aria-hidden className="text-base leading-none">
            +
          </span>
          {copy.meetHalfwayStartNew[language]}
        </button>
      ) : null}
    </div>
  );
}
