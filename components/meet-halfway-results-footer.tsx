"use client";

import type { MouseEvent } from "react";
import { MeetHalfwayFeedback } from "@/components/meet-halfway-feedback";
import { ShareIcon } from "@/components/share-icon";
import { copy } from "@/lib/copy";
import type { HalfwayResultsFooterKind } from "@/lib/meet-halfway";
import type { MeetHalfwayFeedbackSource } from "@/lib/track";
import type { Language } from "@/lib/types";

type MeetHalfwayResultsFooterProps = {
  language: Language;
  kind: HalfwayResultsFooterKind;
  /** First-class بيننا results only. Thread/home keeps the quiet غيرها line. */
  surface?: "screen" | "thread";
  disabled?: boolean;
  resetKey?: string;
  packId?: string;
  feedbackSource?: MeetHalfwayFeedbackSource;
  cafeCount?: number;
  shopIds?: string[];
  onMore: (event: MouseEvent<HTMLButtonElement>) => void;
  onShareResults?: () => void;
  onStartNew?: () => void;
};

/** Shared add / exhausted / share / new line for local two-pin and /h/ guest results. */
export function MeetHalfwayResultsFooter({
  language,
  kind,
  surface = "thread",
  disabled,
  resetKey,
  packId,
  feedbackSource,
  cafeCount,
  shopIds,
  onMore,
  onShareResults,
  onStartNew,
}: MeetHalfwayResultsFooterProps) {
  if (surface !== "screen") {
    if (kind === "more") {
      return (
        <button
          type="button"
          data-halfway-show-more=""
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
      {kind === "more" || kind === "exhausted" ? (
        <div className="grid gap-2">
          {kind === "more" ? (
            <button
              type="button"
              data-halfway-show-more=""
              disabled={disabled}
              onClick={onMore}
              className="flex w-full items-center justify-center rounded-2xl bg-paper px-3 py-3.5 text-center disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-ink">
                <span aria-hidden className="text-base leading-none">
                  +
                </span>
                {copy.meetHalfwayMoreTitle[language]}
              </span>
            </button>
          ) : (
            <p className="text-center text-xs leading-5 text-ink-soft">
              {copy.meetHalfwayNoMore[language]}
            </p>
          )}
        </div>
      ) : null}
      {resetKey ? (
        <MeetHalfwayFeedback
          language={language}
          resetKey={resetKey}
          packId={packId}
          source={feedbackSource}
          count={cafeCount}
          shopIds={shopIds}
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
