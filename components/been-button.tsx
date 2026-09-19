"use client";

import type { MouseEvent } from "react";
import { copy } from "@/lib/copy";
import { SHOW_BEEN_HERE } from "@/lib/tonight";
import type { Language } from "@/lib/types";

type BeenButtonProps = {
  marked: boolean;
  language: Language;
  onMark: () => void;
  className?: string;
};

export function BeenButton({
  marked,
  language,
  onMark,
  className,
}: BeenButtonProps) {
  if (!SHOW_BEEN_HERE) return null;

  if (marked) {
    return (
      <span className={["text-xs text-ink-soft", className].filter(Boolean).join(" ")}>
        {copy.beenMarked[language]}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onMark();
      }}
      className={[
        "text-xs text-ink-soft underline-offset-2 hover:underline",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {copy.beenHere[language]}
    </button>
  );
}
