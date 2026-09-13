"use client";

import type { MouseEvent } from "react";
import { copy } from "@/lib/copy";
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
