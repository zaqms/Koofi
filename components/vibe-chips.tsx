import { copy } from "@/lib/copy";
import { VIBE_CHIPS, vibeChipLabel } from "@/lib/product";
import type { Language } from "@/lib/types";

type VibeChipsProps = {
  language: Language;
  disabled?: boolean;
  onPick: (label: string) => void;
};

export function VibeChips({ language, disabled, onPick }: VibeChipsProps) {
  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="group"
      aria-label={copy.pickVibe[language]}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {VIBE_CHIPS.map((chip) => {
        const label = vibeChipLabel(chip, language);
        return (
          <button
            key={chip.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(label)}
            className="rounded-full border border-line bg-foam px-2.5 py-1 text-[11px] leading-5 text-ink hover:border-bean hover:bg-paper-deep disabled:opacity-50"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
