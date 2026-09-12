"use client";

import { ShareIcon } from "@/components/share-icon";
import { copy } from "@/lib/copy";
import type { HalfwayResultsFooterKind } from "@/lib/meet-halfway";
import type { Language } from "@/lib/types";

type MeetHalfwayResultsFooterProps = {
  language: Language;
  kind: HalfwayResultsFooterKind;
  disabled?: boolean;
  onMore: () => void;
  onShareResults?: () => void;
  onStartNew?: () => void;
};

/** Shared غيرها / exhausted line for local two-pin and /h/ guest results. */
export function MeetHalfwayResultsFooter({
  language,
  kind,
  disabled,
  onMore,
  onShareResults,
  onStartNew,
}: MeetHalfwayResultsFooterProps) {
  const more =
    kind === "more" ? (
      <button
        type="button"
        disabled={disabled}
        onClick={onMore}
        className="inline-flex h-10 items-center rounded-full border border-line bg-foam px-3 text-sm text-ink disabled:opacity-50"
      >
        {copy.meetHalfwayMore[language]}
      </button>
    ) : kind === "exhausted" ? (
      <p className="text-xs leading-5 text-ink-soft">
        {copy.meetHalfwayNoMore[language]}
      </p>
    ) : null;

  if (!onShareResults && !onStartNew) return more;

  return (
    <div className="grid gap-2">
      {more}
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
