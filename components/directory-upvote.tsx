"use client";

import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";
import { useShopUpvote } from "@/components/shop-upvote-provider";

type DirectoryUpvoteProps = {
  shopId: string;
  language: Language;
};

export function DirectoryUpvote({ shopId, language }: DirectoryUpvoteProps) {
  const { countFor, hasVoted, votingId, vote, errorFor } = useShopUpvote();
  const voted = hasVoted(shopId);
  const busy = votingId === shopId;
  const count = countFor(shopId);
  const label = copy.shopUpvote[language];
  const error = errorFor(shopId);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (busy) return;
        void vote(shopId, language);
      }}
      disabled={busy}
      aria-pressed={voted}
      aria-label={`${label} ${count}`}
      title={label}
      dir="ltr"
      className={
        voted
          ? "inline-flex min-w-10 shrink-0 flex-col items-center rounded-xl bg-paper-deep px-2 py-1.5 text-bean"
          : "inline-flex min-w-10 shrink-0 flex-col items-center rounded-xl px-2 py-1.5 text-ink-soft hover:bg-paper-deep hover:text-ink"
      }
    >
      <span className="text-[10px] leading-none" aria-hidden>
        ▲
      </span>
      <span className="mt-1 text-xs tabular-nums leading-none">{count}</span>
      {error ? (
        <span className="sr-only" role="status">
          {error === "no_storage"
            ? copy.shopUpvoteNoStorage[language]
            : error === "rate_limited"
              ? copy.feedbackRateLimited[language]
              : copy.error[language]}
        </span>
      ) : null}
    </button>
  );
}
