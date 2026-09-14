import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { copy } from "@/lib/copy";
import {
  homeSurfaceChips,
  chipSharePath,
  vibeChipLabel,
} from "@/lib/product";
import type { Language } from "@/lib/types";

export type ChipPick = {
  id: string;
  label: string;
};

type VibeChipsProps = {
  language: Language;
  disabled?: boolean;
  /** Active vibe chip (Most Popular URL, or the last tapped chip). */
  selectedId?: string | null;
  onPick: (chip: ChipPick) => void;
};

const CHIPS = homeSurfaceChips();

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6 shrink-0"
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
          <path d="M8 9h9a1 1 0 0 1 1 1v5.2A3.8 3.8 0 0 1 14.2 19h-3.4A3.8 3.8 0 0 1 7 15.2V10a1 1 0 0 1 1-1z" />
          <path d="M18 11.2h1.2a2 2 0 1 1 0 4H18" />
          <path d="M10 4.4c.35.55.35 1.25 0 1.8" />
          <path d="M13 4c.35.55.35 1.25 0 1.8" />
        </Icon>
      );
    case "coffee":
      return (
        <Icon>
          <path d="M7 9h9v6.2A3.8 3.8 0 0 1 12.2 19H10A3.8 3.8 0 0 1 6.2 15.2V10c0-.6.5-1 .8-1z" />
          <path d="M16 11.4h1.4a2.1 2.1 0 1 1 0 4.2H16" />
          <path d="M9 4.6c.4.55.4 1.2 0 1.75" />
          <path d="M12 4.2c.4.55.4 1.2 0 1.75" />
        </Icon>
      );
    case "pastry":
      return (
        <Icon>
          <path d="M5.2 16.2c1.1-5.4 5-9.2 11.6-10.6-.2 5.8-3.1 9.8-9.4 12.2-1.1-.7-1.8-1.1-2.2-1.6z" />
          <path d="M8.2 12.6c1.6-2.1 3.8-3.6 6.6-4.6" />
          <path d="M9.4 15c1.2-1.3 2.6-2.2 4.4-2.8" />
        </Icon>
      );
    case "quiet":
      return (
        <Icon>
          <path d="M5 14.5V11c0-1.4 1.2-2.6 2.6-2.6h8.8C17.8 8.4 19 9.6 19 11v3.5" />
          <path d="M5 14.5h14v1.2c0 .7-.6 1.3-1.3 1.3H6.3c-.7 0-1.3-.6-1.3-1.3z" />
          <path d="M8 8.4V7.2A2.2 2.2 0 0 1 10.2 5h3.6A2.2 2.2 0 0 1 16 7.2v1.2" />
        </Icon>
      );
    case "work":
      return (
        <Icon>
          <rect x="4" y="8.2" width="16" height="10.3" rx="1.6" />
          <path d="M8 8.2V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.2" />
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
          <circle cx="12" cy="12" r="3.1" />
          <path d="M12 3.6v2.2M12 18.2v2.2M3.6 12h2.2M18.2 12h2.2M6.2 6.2l1.5 1.5M16.3 16.3l1.5 1.5M17.8 6.2 16.3 7.7M7.7 16.3 6.2 17.8" />
        </Icon>
      );
    case "date":
      return (
        <Icon>
          <circle cx="12" cy="8" r="3.1" />
          <path d="M5.6 19c.7-3.2 3.2-5 6.4-5s5.7 1.8 6.4 5" />
        </Icon>
      );
    case "nearby":
      return (
        <Icon>
          <path d="M12 21s6-5.4 6-10a6 6 0 1 0-12 0c0 4.6 6 10 6 10z" />
          <circle cx="12" cy="11" r="1.8" />
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
    default:
      return (
        <Icon>
          <circle cx="12" cy="12" r="6" />
        </Icon>
      );
  }
}

function vibeChipClass(selected: boolean): string {
  return selected
    ? "flex min-h-[5.6rem] flex-col items-center justify-center gap-1.5 rounded-[26px] border border-bean bg-bean px-1 py-2.5 text-foam hover:border-bean-deep hover:bg-bean-deep aria-disabled:pointer-events-none aria-disabled:opacity-50"
    : "flex min-h-[5.6rem] flex-col items-center justify-center gap-1.5 rounded-[26px] border border-line bg-foam px-1 py-2.5 text-ink hover:border-bean/40 hover:bg-paper-deep aria-disabled:pointer-events-none aria-disabled:opacity-50";
}

export function VibeChips({
  language,
  disabled,
  selectedId = null,
  onPick,
}: VibeChipsProps) {
  return (
    <div
      className="grid grid-cols-4 gap-2.5"
      role="group"
      aria-busy={disabled || undefined}
      aria-label={copy.pickVibe[language]}
      dir={language === "ar" ? "rtl" : "ltr"}
    >
      {CHIPS.map((chip) => {
        const label = vibeChipLabel(chip, language);
        const selected = selectedId === chip.id;
        const className = vibeChipClass(selected);
        const onChipClick = (
          event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
        ) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          event.currentTarget.blur();
          onPick({ id: chip.id, label });
        };

        return (
          <Link
            key={chip.id}
            href={chipSharePath(chip.id, language)}
            aria-disabled={disabled || undefined}
            aria-current={selected ? "page" : undefined}
            onClick={onChipClick}
            className={className}
          >
            <ChipIcon id={chip.id} />
            <span className="line-clamp-2 text-center text-[11px] leading-tight">
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
