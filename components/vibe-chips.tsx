import { copy } from "@/lib/copy";
import { NEARBY_CHIP, VIBE_CHIPS, vibeChipLabel } from "@/lib/product";
import type { Language } from "@/lib/types";

export type ChipPick = {
  id: string;
  label: string;
};

type VibeChipsProps = {
  language: Language;
  disabled?: boolean;
  onPick: (chip: ChipPick) => void;
};

const CHIPS = [...VIBE_CHIPS, NEARBY_CHIP];

export function VibeChips({ language, disabled, onPick }: VibeChipsProps) {
  return (
    <div
      className="-mx-1 flex flex-nowrap gap-2.5 overflow-x-auto px-1 [scrollbar-width:none] [-ms-overflow-style:none] [overscroll-behavior-x:contain] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-busy={disabled || undefined}
      aria-label={copy.pickVibe[language]}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {CHIPS.map((chip) => {
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
              onPick({ id: chip.id, label });
            }}
            className="min-h-10 shrink-0 whitespace-nowrap rounded-full border border-line bg-foam px-3.5 py-2 text-sm leading-5 text-ink hover:border-bean hover:bg-paper-deep aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
