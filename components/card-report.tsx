"use client";

import { useState } from "react";
import { copy } from "@/lib/copy";
import type { Language, NeighborhoodId } from "@/lib/types";

const REASONS = Object.keys(copy.reportReasons) as Array<
  keyof typeof copy.reportReasons
>;
type ReportReason = (typeof REASONS)[number];

type CardReportProps = {
  shopId: string;
  nameEn: string;
  neighborhood: NeighborhoodId;
  path: string;
  language: Language;
};

export function CardReport({
  shopId,
  nameEn,
  neighborhood,
  path,
  language,
}: CardReportProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const trimmedNote = note.trim();
  const submitReason: ReportReason | "" = reason || (trimmedNote ? "other" : "");
  const canSend = Boolean(submitReason);

  async function submit() {
    if (!submitReason || sending) return;
    setSending(true);
    setFailed(false);
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          nameEn,
          neighborhood,
          locale: language,
          path,
          reason: submitReason,
          note: trimmedNote.slice(0, 280),
        }),
      });
      const body = (await response.json().catch(() => null)) as {
        ok?: boolean;
      } | null;
      if (response.ok && body?.ok === true) {
        setDone(true);
        return;
      }
    } catch {
      // Stay on the form. Thanks only after an accepted report.
    }
    setSending(false);
    setFailed(true);
  }

  if (done) {
    return (
      <p className="pt-1 text-xs text-ink-soft">{copy.reportThanks[language]}</p>
    );
  }

  if (!open) {
    return (
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-ink-soft underline-offset-2 hover:underline"
        >
          {copy.reportPrompt[language]}
        </button>
      </div>
    );
  }

  return (
    <form
      className="space-y-2 pt-1"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <fieldset className="space-y-1.5">
        <legend className="sr-only">{copy.reportPrompt[language]}</legend>
        {REASONS.map((id) => (
          <label
            key={id}
            className="flex items-center gap-2 text-xs text-ink-soft"
          >
            <input
              type="radio"
              name="listing-report-reason"
              value={id}
              checked={submitReason === id}
              onChange={() => setReason(id)}
              className="accent-bean"
            />
            <span>{copy.reportReasons[id][language]}</span>
          </label>
        ))}
      </fieldset>
      <textarea
        value={note}
        rows={2}
        maxLength={280}
        onChange={(event) => setNote(event.target.value)}
        className="w-full resize-none rounded-2xl border border-line bg-foam px-3 py-2 text-xs leading-5 text-ink outline-none focus:border-bean"
      />
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <button
          type="submit"
          disabled={sending || !canSend}
          className="text-xs text-ink-soft underline-offset-2 hover:underline disabled:opacity-50"
        >
          {copy.send[language]}
        </button>
        {canSend ? null : (
          <span className="text-xs text-ink-soft">
            {copy.reportNeedReason[language]}
          </span>
        )}
        {failed ? (
          <span className="text-xs text-ink-soft">{copy.reportFail[language]}</span>
        ) : null}
      </div>
    </form>
  );
}
