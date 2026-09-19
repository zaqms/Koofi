"use client";

import { useEffect, useState } from "react";
import { copy } from "@/lib/copy";
import {
  meetHalfwayFeedbackParams,
  trackEvent,
  type MeetHalfwayFeedbackReason,
  type MeetHalfwayFeedbackSource,
} from "@/lib/track";
import type { Language } from "@/lib/types";

type MeetHalfwayFeedbackProps = {
  language: Language;
  resetKey: string;
  packId?: string;
  source?: MeetHalfwayFeedbackSource;
  count?: number;
};

const REASONS: {
  id: MeetHalfwayFeedbackReason;
  copyKey:
    | "meetHalfwayFeedbackTooFar"
    | "meetHalfwayFeedbackVibe"
    | "meetHalfwayFeedbackMoreOptions"
    | "meetHalfwayFeedbackOther";
}[] = [
  { id: "too_far", copyKey: "meetHalfwayFeedbackTooFar" },
  { id: "vibe", copyKey: "meetHalfwayFeedbackVibe" },
  { id: "more_options", copyKey: "meetHalfwayFeedbackMoreOptions" },
  { id: "other", copyKey: "meetHalfwayFeedbackOther" },
];

function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden
      className="shrink-0 text-ink"
    >
      <path
        d="M12 3.4 13.2 8.6 18 10l-4.8 1.4L12 16.6 10.8 11.4 6 10l4.8-1.4z"
        fill="currentColor"
      />
      <path
        d="M18.2 14.2 18.7 16.2 20.6 16.8 18.7 17.4 18.2 19.4 17.7 17.4 15.8 16.8 17.7 16.2z"
        fill="currentColor"
      />
    </svg>
  );
}

export function MeetHalfwayFeedback({
  language,
  resetKey,
  packId,
  source,
  count,
}: MeetHalfwayFeedbackProps) {
  const [choice, setChoice] = useState<"yes" | "no" | null>(null);
  const [reason, setReason] = useState<MeetHalfwayFeedbackReason | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    setChoice(null);
    setReason(null);
    setNote("");
  }, [resetKey]);

  function fire(
    feedback: "yes" | "no",
    feedback_reason?: MeetHalfwayFeedbackReason,
  ) {
    trackEvent(
      "meet_halfway_feedback",
      meetHalfwayFeedbackParams({
        locale: language,
        feedback,
        feedback_reason,
        source,
        count,
        packId,
      }),
      {
        dedupeKey: `meet_halfway_feedback:${resetKey}:${feedback}:${feedback_reason ?? ""}`,
      },
    );
  }

  function onYes() {
    if (choice) return;
    setChoice("yes");
    fire("yes");
  }

  function onNo() {
    if (choice) return;
    setChoice("no");
    fire("no");
  }

  function onReason(next: MeetHalfwayFeedbackReason) {
    if (reason) return;
    setReason(next);
    fire("no", next);
  }

  const thanks =
    choice === "yes"
      ? copy.meetHalfwayFeedbackThanksYes[language]
      : reason
        ? copy.meetHalfwayFeedbackThanksNo[language]
        : null;

  return (
    <section className="rounded-2xl border border-line bg-foam px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5">
            <SparkleIcon />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-5 text-ink">
              {thanks ?? copy.meetHalfwayFeedbackTitle[language]}
            </p>
            {thanks ? null : (
              <p className="mt-0.5 text-[11px] leading-4 text-ink-soft">
                {copy.meetHalfwayFeedbackSub[language]}
              </p>
            )}
          </div>
        </div>
        {choice ? null : (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onYes}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-vote/40 px-2.5 text-[11px] leading-4 text-ink"
            >
              <span aria-hidden>👍</span>
              {copy.meetHalfwayFeedbackYes[language]}
            </button>
            <button
              type="button"
              onClick={onNo}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-blush/70 px-2.5 text-[11px] leading-4 text-ink"
            >
              <span aria-hidden>👎</span>
              {copy.meetHalfwayFeedbackNo[language]}
            </button>
          </div>
        )}
      </div>

      {choice === "no" && !reason ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs leading-4 text-ink">
            {copy.meetHalfwayFeedbackWhy[language]}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => onReason(row.id)}
                className="rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] leading-4 text-ink"
              >
                {copy[row.copyKey][language]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {reason === "other" ? (
        <label className="mt-3 block">
          <span className="sr-only">
            {copy.meetHalfwayFeedbackTellMore[language]}
          </span>
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={copy.meetHalfwayFeedbackTellMore[language]}
            className="h-9 w-full rounded-xl border border-line bg-paper px-2.5 text-xs text-ink outline-none placeholder:text-ink-soft focus:border-bean"
          />
        </label>
      ) : null}
    </section>
  );
}
