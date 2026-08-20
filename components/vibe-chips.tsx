import { copy } from "@/lib/copy";
import { VIBE_CHIPS } from "@/lib/product";

type VibeChipsProps = {
  disabled?: boolean;
  onPick: (label: string) => void;
};

export function VibeChips({ disabled, onPick }: VibeChipsProps) {
  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="group"
      aria-label={`${copy.pickVibe.ar} · ${copy.pickVibe.en}`}
    >
      {VIBE_CHIPS.map((chip) => (
        <div
          key={chip.id}
          className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-foam"
        >
          <button
            type="button"
            dir="rtl"
            disabled={disabled}
            onClick={() => onPick(chip.ar)}
            className="px-2.5 pt-1.5 pb-0.5 text-start text-[11px] leading-4 text-ink hover:bg-paper-deep disabled:opacity-50"
          >
            {chip.ar}
          </button>
          <button
            type="button"
            dir="ltr"
            disabled={disabled}
            onClick={() => onPick(chip.en)}
            className="px-2.5 pt-0 pb-1.5 text-start text-[10px] leading-4 text-ink-soft hover:bg-paper-deep disabled:opacity-50"
          >
            {chip.en}
          </button>
        </div>
      ))}
    </div>
  );
}
