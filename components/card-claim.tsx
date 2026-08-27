"use client";

import { useState } from "react";
import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";

type CardClaimProps = {
  language?: Language;
};

const OWNER_SLOTS = ["instagram", "tiktok", "phone"] as const;

/** Mock verify-as-owner control. Session-only. Does not persist ownership. */
export function CardClaim({ language = "ar" }: CardClaimProps) {
  const [claimed, setClaimed] = useState(false);

  if (!claimed) {
    return (
      <p className="mt-4">
        <button
          type="button"
          onClick={() => setClaimed(true)}
          className="text-xs text-ink-soft underline-offset-2 hover:underline"
        >
          {copy.claimThis[language]}
        </button>
      </p>
    );
  }

  return (
    <section className="mt-4 rounded-2xl border border-dashed border-line bg-paper/50 px-4 py-3.5">
      <p className="text-xs leading-5 text-ink-soft">{copy.claimNoted[language]}</p>
      <p className="mt-1 text-xs leading-5 text-ink-soft">{copy.ownerLater[language]}</p>
      <div className="mt-3 space-y-2.5">
        {OWNER_SLOTS.map((slot) => (
          <label key={slot} className="grid grid-cols-[4.75rem_1fr] items-center gap-3">
            <span className="text-xs text-ink-soft">{copy[slot][language]}</span>
            <input
              type={slot === "phone" ? "tel" : "text"}
              autoComplete="off"
              spellCheck={false}
              className="min-h-9 rounded-xl border border-dashed border-line bg-foam/80 px-3 text-sm outline-none focus:border-bean"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
