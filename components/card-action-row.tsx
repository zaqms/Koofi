"use client";

import { useId, useState } from "react";
import { MapsLink } from "@/components/maps-link";
import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";

type CardActionRowProps = {
  mapsHref: string;
  language?: Language;
};

function ThumbIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.2 17.5H3.8A1.3 1.3 0 0 1 2.5 16.2V9.8A1.3 1.3 0 0 1 3.8 8.5h3.1l1.5-4.3A1.7 1.7 0 0 1 10 3c.7 0 1.2.6 1.1 1.3L10.6 7h5.1a2 2 0 0 1 2 2.3l-.7 5a2 2 0 0 1-2 1.7H7.2Z"
      />
    </svg>
  );
}

function ReviewIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 4.5h12a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 16 14.5H9.2L5 17.2a.6.6 0 0 1-.9-.5V14.5H4A1.5 1.5 0 0 1 2.5 13V6A1.5 1.5 0 0 1 4 4.5Z"
      />
    </svg>
  );
}

export function CardActionRow({ mapsHref, language = "ar" }: CardActionRowProps) {
  const [open, setOpen] = useState(false);
  const [later, setLater] = useState(false);
  const panelId = useId();

  return (
    <div className="mt-6">
      <div className="flex w-auto flex-wrap items-center gap-2">
        <MapsLink
          href={mapsHref}
          className="inline-flex w-auto shrink-0 items-center rounded-full bg-bean px-3.5 py-2 text-sm text-foam hover:bg-bean-deep"
        >
          {copy.goThere[language]}
        </MapsLink>
        <span
          className="inline-flex size-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full text-ink-soft/45"
          aria-disabled="true"
          aria-label={copy.thumbsLaterHint[language]}
          title={copy.thumbsLaterHint[language]}
        >
          <ThumbIcon />
        </span>
        <button
          type="button"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-soft/70 hover:bg-paper-deep hover:text-ink-soft"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            setOpen((value) => !value);
            setLater(false);
          }}
        >
          <span className="sr-only">{copy.reviewsLater[language]}</span>
          <ReviewIcon />
        </button>
      </div>

      {open ? (
        <div
          id={panelId}
          className="mt-3 rounded-2xl border border-line bg-paper/70 px-4 py-3.5"
        >
          <p className="text-sm leading-6">{copy.loginToReview[language]}</p>
          {later ? (
            <p className="mt-3 text-xs text-ink-soft">{copy.reviewLater[language]}</p>
          ) : (
            <form
              className="mt-3 grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setLater(true);
              }}
            >
              <label className="grid gap-1.5">
                <span className="text-xs text-ink-soft">{copy.phone[language]}</span>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  name="phone"
                  className="rounded-xl border border-line bg-foam px-3 py-2 text-sm outline-none focus:border-bean"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="text-xs text-ink-soft underline-offset-2 hover:underline"
                >
                  {copy.reviewLater[language]}
                </button>
                <button
                  type="button"
                  className="text-xs text-ink-soft underline-offset-2 hover:underline"
                  onClick={() => setOpen(false)}
                >
                  {copy.closeReviewLogin[language]}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}
