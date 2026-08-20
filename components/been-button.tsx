"use client";

import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";

type BeenButtonProps = {
  marked: boolean;
  language: Language;
  onMark: () => void;
};

export function BeenButton({ marked, language, onMark }: BeenButtonProps) {
  if (marked) {
    return (
      <span className="text-xs text-ink-soft">{copy.beenMarked[language]}</span>
    );
  }

  return (
    <button
      type="button"
      onClick={onMark}
      className="text-xs text-ink-soft underline-offset-2 hover:underline"
    >
      {copy.beenHere[language]}
    </button>
  );
}
