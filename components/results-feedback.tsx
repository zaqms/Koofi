"use client";

import { useState, useSyncExternalStore } from "react";
import {
  EMPTY_FEEDBACK_GUARD_SNAPSHOT,
  feedbackGuardSnapshot,
  markResultsFeedback,
  subscribeFeedbackGuard,
} from "@/lib/results-feedback-guard";
import {
  resultsFeedbackPreset,
  type ResultsFeedbackPresetId,
  type ResultsFeedbackReasonRow,
} from "@/lib/results-feedback-presets";
import {
  resultsFeedbackParams,
  trackEvent,
  type MeetHalfwayFeedbackSource,
  type ResultsFeedbackFeature,
  type ResultsFeedbackReason,
  type ResultsFeedbackSource,
} from "@/lib/track";
import type { Language } from "@/lib/types";

export type ResultsFeedbackProps = {
  language: Language;
  resetKey: string;
  source: ResultsFeedbackSource;
  feature: ResultsFeedbackFeature;
  title: string;
  subtitle?: string;
  yesLabel: string;
  noLabel: string;
  whyLabel: string;
  tellMoreLabel: string;
  doneLabel: string;
  thanksYes: string;
  thanksNo: string;
  reasons: ResultsFeedbackReasonRow[];
  halfwaySource?: MeetHalfwayFeedbackSource;
  packId?: string;
  count?: number;
  shopIds?: string[];
  shopId?: string;
  queryText?: string;
  categoryId?: string;
  categorySlug?: string;
};

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

export function ResultsFeedback({
  language,
  resetKey,
  source,
  feature,
  title,
  subtitle,
  yesLabel,
  noLabel,
  whyLabel,
  tellMoreLabel,
  doneLabel,
  thanksYes,
  thanksNo,
  reasons,
  halfwaySource,
  packId,
  count,
  shopIds,
  shopId,
  queryText,
  categoryId,
  categorySlug,
}: ResultsFeedbackProps) {
  const snap = useSyncExternalStore(
    subscribeFeedbackGuard,
    () => feedbackGuardSnapshot(source, resetKey),
    () => EMPTY_FEEDBACK_GUARD_SNAPSHOT,
  );
  const stored = JSON.parse(snap) as {
    instance: {
      choice: "yes" | "no";
      reason?: string;
      noteDone?: boolean;
    } | null;
    offer: boolean;
  };
  const choice = stored.instance?.choice ?? null;
  const reason =
    (stored.instance?.reason as ResultsFeedbackReason | undefined) ?? null;
  const noteDone = Boolean(stored.instance?.noteDone);
  const awaitingNote = reason === "other" && !noteDone;
  const [noteKey, setNoteKey] = useState(resetKey);
  const [note, setNote] = useState("");
  if (noteKey !== resetKey) {
    setNoteKey(resetKey);
    setNote("");
  }

  if (!stored.offer) return null;

  function fire(
    feedback: "yes" | "no",
    feedback_reason?: ResultsFeedbackReason,
    extra?: { feedback_text?: string; feedback_note?: boolean },
  ) {
    trackEvent(
      "meet_halfway_feedback",
      resultsFeedbackParams({
        locale: language,
        feedback,
        feedback_reason,
        feedback_text: extra?.feedback_text,
        feedback_note: extra?.feedback_note,
        source,
        halfwaySource,
        feature,
        count,
        packId,
        shopIds,
        shopId,
        queryText,
        categoryId,
        categorySlug,
      }),
      {
        dedupeKey: `meet_halfway_feedback:${source}:${resetKey}:${feedback}:${feedback_reason ?? ""}:${extra?.feedback_note ? "note" : ""}`,
      },
    );
  }

  function onYes() {
    if (choice) return;
    markResultsFeedback(source, resetKey, { choice: "yes" });
    fire("yes");
  }

  function onNo() {
    if (choice) return;
    markResultsFeedback(source, resetKey, { choice: "no" });
    fire("no");
  }

  function onReason(next: ResultsFeedbackReason) {
    if (reason) return;
    markResultsFeedback(source, resetKey, {
      choice: "no",
      reason: next,
      noteDone: next !== "other",
    });
    if (next !== "other") fire("no", next);
  }

  function completeNote() {
    if (reason !== "other" || noteDone) return;
    const text = note.trim();
    markResultsFeedback(source, resetKey, {
      choice: "no",
      reason: "other",
      noteDone: true,
    });
    fire("no", "other", text ? { feedback_text: text } : undefined);
  }

  const thanks =
    choice === "yes" ? thanksYes : awaitingNote ? null : reason ? thanksNo : null;

  return (
    <section
      data-results-feedback=""
      data-feedback-source={source}
      className="rounded-2xl border border-line bg-foam px-3 py-3"
      dir={language === "ar" ? "rtl" : "ltr"}
      lang={language}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5">
            <SparkleIcon />
          </span>
          <div className="min-w-0">
            <p className="text-start text-sm font-medium leading-5 text-ink">
              {thanks ?? title}
            </p>
            {thanks || !subtitle ? null : (
              <p className="mt-0.5 text-start text-[11px] leading-4 text-ink-soft">
                {subtitle}
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
              {yesLabel}
            </button>
            <button
              type="button"
              onClick={onNo}
              className="inline-flex h-8 items-center gap-1 rounded-full bg-blush/70 px-2.5 text-[11px] leading-4 text-ink"
            >
              <span aria-hidden>👎</span>
              {noLabel}
            </button>
          </div>
        )}
      </div>

      {choice === "no" && !reason ? (
        <div className="mt-3 space-y-2">
          <p className="text-start text-xs leading-4 text-ink">{whyLabel}</p>
          <div className="flex flex-wrap gap-1.5">
            {reasons.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => onReason(row.id)}
                data-feedback-reason={row.id}
                className="rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] leading-4 text-ink"
              >
                {row.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {awaitingNote ? (
        <div className="mt-3 space-y-2" data-feedback-note="">
          <p className="text-start text-xs leading-4 text-ink">{tellMoreLabel}</p>
          <div className="flex items-center gap-1.5">
            <label className="min-w-0 flex-1">
              <span className="sr-only">{tellMoreLabel}</span>
              <input
                type="text"
                value={note}
                autoFocus
                onChange={(event) => setNote(event.target.value)}
                onBlur={(event) => {
                  const next = event.relatedTarget;
                  if (
                    next instanceof HTMLElement &&
                    next.closest("[data-feedback-note-done]")
                  ) {
                    return;
                  }
                  completeNote();
                }}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  completeNote();
                }}
                placeholder={tellMoreLabel}
                className="h-9 w-full rounded-xl border border-line bg-paper px-2.5 text-start text-xs text-ink outline-none placeholder:text-ink-soft focus:border-bean"
              />
            </label>
            <button
              type="button"
              data-feedback-note-done=""
              onClick={completeNote}
              className="inline-flex h-8 shrink-0 items-center rounded-full border border-line bg-paper px-2.5 text-[11px] leading-4 text-ink"
            >
              {doneLabel}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

type ResultsFeedbackBlockProps = {
  language: Language;
  preset: ResultsFeedbackPresetId;
  resetKey: string;
  halfwaySource?: MeetHalfwayFeedbackSource;
  packId?: string;
  count?: number;
  shopIds?: string[];
  shopId?: string;
  queryText?: string;
  categoryId?: string;
  categorySlug?: string;
};

/** Same master chrome. Preset only swaps copy, chips, and analytics context. */
export function ResultsFeedbackBlock({
  language,
  preset,
  resetKey,
  halfwaySource,
  packId,
  count,
  shopIds,
  shopId,
  queryText,
  categoryId,
  categorySlug,
}: ResultsFeedbackBlockProps) {
  const row = resultsFeedbackPreset(preset, language);
  return (
    <ResultsFeedback
      language={language}
      resetKey={resetKey}
      source={row.source}
      feature={row.feature}
      title={row.title}
      subtitle={row.subtitle}
      yesLabel={row.yesLabel}
      noLabel={row.noLabel}
      whyLabel={row.whyLabel}
      tellMoreLabel={row.tellMoreLabel}
      doneLabel={row.doneLabel}
      thanksYes={row.thanksYes}
      thanksNo={row.thanksNo}
      reasons={row.reasons}
      halfwaySource={halfwaySource}
      packId={packId}
      count={count ?? shopIds?.length}
      shopIds={shopIds}
      shopId={shopId}
      queryText={queryText}
      categoryId={categoryId}
      categorySlug={categorySlug}
    />
  );
}
