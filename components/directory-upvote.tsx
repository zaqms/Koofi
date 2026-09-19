"use client";

import { copy } from "@/lib/copy";
import type { Language } from "@/lib/types";
import { useShopUpvote } from "@/components/shop-upvote-provider";
import { ThumbsUpIcon } from "@/components/thumbs-up-icon";

type DirectoryUpvoteProps = {
  shopId: string;
  language: Language;
  variant?: "list" | "passport";
};

export function DirectoryUpvote({
  shopId,
  language,
  variant = "list",
}: DirectoryUpvoteProps) {
  const { countFor, hasVoted, votingId, vote, errorFor } = useShopUpvote();
  const voted = hasVoted(shopId);
  const busy = votingId === shopId;
  const count = countFor(shopId);
  const label = copy.shopUpvote[language];
  const error = errorFor(shopId);
  const showCount = count >= 1;
  const accessibleName = showCount ? `${label} ${count}` : label;

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
      aria-label={accessibleName}
      title={label}
      dir="ltr"
      className={
        variant === "passport"
          ? voted
            ? "inline-flex size-11 shrink-0 flex-col items-center justify-center rounded-lg border border-gold bg-passport-wash text-gold"
            : "inline-flex size-11 shrink-0 flex-col items-center justify-center rounded-lg border border-gold text-gold hover:bg-passport-wash"
          : voted
            ? "inline-flex min-w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-paper-deep px-2 py-1.5 text-bean"
            : "inline-flex min-w-10 shrink-0 flex-col items-center justify-center rounded-xl px-2 py-1.5 text-ink-soft hover:bg-paper-deep hover:text-ink"
      }
    >
      <ThumbsUpIcon filled={voted} />
      {showCount ? (
        <span className="mt-1 text-xs tabular-nums leading-none">{count}</span>
      ) : null}
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
