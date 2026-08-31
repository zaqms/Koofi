import type { ReactNode } from "react";
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

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 shrink-0 text-ink"
    >
      {children}
    </svg>
  );
}

function ChipIcon({ id }: { id: string }) {
  switch (id) {
    case "popular":
      return (
        <Icon>
          <path d="M12 3v3" />
          <path d="M8 8c0 4 1.5 8 4 11 2.5-3 4-7 4-11" />
          <path d="M9 12h6" />
        </Icon>
      );
    case "coffee":
      return (
        <Icon>
          <path d="M6 9h10v6a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V9z" />
          <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" />
          <path d="M9 4.5c.4.6.4 1.4 0 2" />
          <path d="M12 4c.4.6.4 1.4 0 2" />
        </Icon>
      );
    case "pastry":
      return (
        <Icon>
          <path d="M5 15c2-6 6-9 12-10-1 6-4 10-10 12-1-1-2-1.3-2-2z" />
          <path d="M8 12c1.5-2 3.5-3.5 6-4.5" />
        </Icon>
      );
    case "roaster":
      return (
        <Icon>
          <ellipse cx="12" cy="12" rx="5" ry="7" />
          <path d="M12 6.5c1.4 1.8 1.4 9.2 0 11" />
        </Icon>
      );
    case "specialty":
      return (
        <Icon>
          <path d="M7 10h9v5.5A3.5 3.5 0 0 1 12.5 19h-2A3.5 3.5 0 0 1 7 15.5V10z" />
          <path d="M16 12h1.4a2 2 0 1 1 0 4H16" />
          <path d="M9 5c.5.8.5 1.6 0 2.3" />
          <path d="M12 4.5c.5.8.5 1.6 0 2.3" />
          <path d="M15 5c.5.8.5 1.6 0 2.3" />
        </Icon>
      );
    case "quiet":
      return (
        <Icon>
          <path d="M6 14.5c4-1 6-4 7-9 3 3 4 7 2 11-3 1.5-6 1.2-9-2z" />
          <path d="M11 8.5c.8 1.2 1.2 2.4 1.3 3.6" />
        </Icon>
      );
    case "work":
      return (
        <Icon>
          <rect x="4" y="8" width="16" height="10" rx="1.5" />
          <path d="M8 8V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" />
          <path d="M4 13h16" />
        </Icon>
      );
    case "study":
      return (
        <Icon>
          <path d="M4 7.5 12 5l8 2.5v9.5L12 19l-8-2.5V7.5z" />
          <path d="M12 5v14" />
          <path d="M8 10.5c1.2.4 2.4.4 4 0" />
        </Icon>
      );
    case "late":
      return (
        <Icon>
          <path d="M15 5.2A7 7 0 1 0 19 15 5.5 5.5 0 0 1 15 5.2z" />
        </Icon>
      );
    case "outdoor":
      return (
        <Icon>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 4v2.2M12 17.8V20M4 12h2.2M17.8 12H20M6.4 6.4l1.6 1.6M16 16l1.6 1.6M17.6 6.4 16 8M8 16l-1.6 1.6" />
        </Icon>
      );
    case "date":
      return (
        <Icon>
          <path d="M12 19s-6.5-4.2-8.2-8A4.2 4.2 0 0 1 12 8.2 4.2 4.2 0 0 1 20.2 11c-1.7 3.8-8.2 8-8.2 8z" />
        </Icon>
      );
    case "nearby":
      return (
        <Icon>
          <path d="M12 21s6-5.4 6-10a6 6 0 1 0-12 0c0 4.6 6 10 6 10z" />
          <circle cx="12" cy="11" r="1.8" />
        </Icon>
      );
    default:
      return (
        <Icon>
          <circle cx="12" cy="12" r="6" />
        </Icon>
      );
  }
}

export function VibeChips({ language, disabled, onPick }: VibeChipsProps) {
  return (
    <div
      className="grid grid-cols-4 gap-1.5"
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
            className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-foam px-1 py-1.5 text-ink hover:border-bean hover:bg-paper-deep aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <ChipIcon id={chip.id} />
            <span className="line-clamp-2 text-center text-[11px] leading-tight">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
