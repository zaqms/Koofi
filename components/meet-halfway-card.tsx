import type { MouseEvent } from "react";
import Link from "next/link";
import { copy } from "@/lib/copy";
import {
  MEET_HALFWAY_CHIP,
  MEET_HALFWAY_HOME_ART,
  chipSharePath,
  vibeChipLabel,
} from "@/lib/product";
import type { Language } from "@/lib/types";
import type { ChipPick } from "@/components/vibe-chips";

type MeetHalfwayCardProps = {
  language: Language;
  disabled?: boolean;
  selected?: boolean;
  onPick: (chip: ChipPick) => void;
};

function ForwardArrow({ language }: { language: Language }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      {language === "ar" ? (
        <>
          <path d="M19 12H5" />
          <path d="m11 6-6 6 6 6" />
        </>
      ) : (
        <>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </>
      )}
    </svg>
  );
}

/**
 * P0 بيننا utility card — below the category grid, not a tile.
 * RTL: 3D cluster at the start (right), forward CTA on the left.
 * Selected session after اعزم خويك stays on `/h/{id}`.
 */
export function MeetHalfwayCard({
  language,
  disabled,
  selected = false,
  onPick,
}: MeetHalfwayCardProps) {
  const title = vibeChipLabel(MEET_HALFWAY_CHIP, language);
  const subtitle = copy.meetHalfwayHomeSub[language];
  const className =
    "flex w-full items-center gap-2 rounded-[18px] border border-line/80 bg-paper-deep px-2 py-1 text-start aria-disabled:pointer-events-none aria-disabled:opacity-50";

  const onCardClick = (
    event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>,
  ) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    event.currentTarget.blur();
    onPick({ id: MEET_HALFWAY_CHIP.id, label: title });
  };

  const body = (
    <>
      <span aria-hidden className="relative h-8 w-[6rem] shrink-0">
        {/* Local static PNG. Decorative — title is the accessible name. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MEET_HALFWAY_HOME_ART.src}
          alt=""
          width={MEET_HALFWAY_HOME_ART.width}
          height={MEET_HALFWAY_HOME_ART.height}
          className="h-full w-full object-contain object-center"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.95rem] font-semibold leading-5 text-ink">
          {title}
        </span>
        <span className="mt-0.5 block text-[12px] leading-4 text-ink-soft">
          {subtitle}
        </span>
      </span>
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-bean text-foam"
      >
        <ForwardArrow language={language} />
      </span>
    </>
  );

  if (selected) {
    return (
      <button
        type="button"
        aria-disabled={disabled || undefined}
        aria-pressed={selected || undefined}
        aria-current="page"
        onClick={onCardClick}
        className={className}
      >
        {body}
      </button>
    );
  }

  return (
    <Link
      href={chipSharePath(MEET_HALFWAY_CHIP.id, language)}
      aria-disabled={disabled || undefined}
      aria-label={`${title} — ${subtitle}`}
      onClick={onCardClick}
      className={className}
    >
      {body}
    </Link>
  );
}
