"use client";

import { useState } from "react";
import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";

type CardClaimProps = {
  language?: Language;
};

/** Mock verify-as-owner control. Session-only. Does not persist ownership. */
export function CardClaim({ language = "ar" }: CardClaimProps) {
  const [noted, setNoted] = useState(false);

  if (noted) {
    return <span className="text-xs text-ink-soft">{copy.claimNoted[language]}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => setNoted(true)}
      className="text-xs text-ink-soft underline-offset-2 hover:underline"
    >
      {copy.claimThis[language]}
    </button>
  );
}
