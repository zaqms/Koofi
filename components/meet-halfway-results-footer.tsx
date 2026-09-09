"use client";

import { copy } from "@/lib/copy";
import type { HalfwayResultsFooterKind } from "@/lib/meet-halfway";
import type { Language } from "@/lib/types";

type MeetHalfwayResultsFooterProps = {
  language: Language;
  kind: HalfwayResultsFooterKind;
  disabled?: boolean;
  onMore: () => void;
};

/** Shared غيرها / exhausted line for local two-pin and /h/ guest results. */
export function MeetHalfwayResultsFooter({
  language,
  kind,
  disabled,
  onMore,
}: MeetHalfwayResultsFooterProps) {
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
