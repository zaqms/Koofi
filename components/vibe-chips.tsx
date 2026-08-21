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
      aria-busy={disabled || undefined}
      aria-label={copy.pickVibe[language]}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {VIBE_CHIPS.map((chip) => {
        const label = vibeChipLabel(chip, language);
        return (
          <button
            key={chip.id}
            type="button"
            // Native `disabled` on the chip that just received the tap moves
            // focus (often to <body>) and some browsers scroll back to the
            // opener — it looks like the thread reset. Keep the control
            // focusable and ignore the click instead.
            aria-disabled={disabled || undefined}
            onClick={(event) => {
              if (disabled) return;
              event.currentTarget.blur();
              onPick(label);
            }}
            className="rounded-full border border-line bg-foam px-2.5 py-1 text-[11px] leading-5 text-ink hover:border-bean hover:bg-paper-deep aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
