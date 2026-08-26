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

  async function submit() {
    if (!reason || sending) return;
    setSending(true);
    try {
      await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          nameEn,
          neighborhood,
          locale: language,
          path,
          reason,
          note: note.trim().slice(0, 280),
        }),
      });
    } catch {
      // Well-formed enough to thank. A log miss stays private.
    }
    setDone(true);
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
              checked={reason === id}
              required
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
      <button
        type="submit"
        disabled={sending || !reason}
        className="text-xs text-ink-soft underline-offset-2 hover:underline disabled:opacity-50"
      >
        {copy.send[language]}
      </button>
    </form>
  );
}
