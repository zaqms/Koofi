"use client";

import { copy } from "@/lib/copy";
import { trackShareClick } from "@/lib/data-layer";
import { shareText, shareUrl, waMeShareHref } from "@/lib/share";
import type { Language } from "@/lib/types";

type ShareSpotProps = {
  cafeId: string;
  language: Language;
  name: string;
  matchedTags?: readonly string[];
  variant: "row" | "block";
};

export function ShareSpot({
  cafeId,
  language,
  name,
  matchedTags = [],
  variant,
}: ShareSpotProps) {
  const tags = [...matchedTags];
  const url = shareUrl(cafeId, language);
  const text = shareText({ name, tags, url, language });

  async function onShare() {
    trackShareClick(cafeId, tags);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text, url });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    window.location.assign(waMeShareHref(text));
  }

  return (
    <button
      type="button"
      onClick={() => {
        void onShare();
      }}
      className={
        variant === "block"
          ? "rounded-2xl border border-line px-4 py-3 text-center text-sm hover:border-bean"
          : "rounded-full border border-line px-3 py-1 text-xs hover:border-bean"
      }
    >
      {copy.sendThisSpot[language]}
    </button>
  );
}
