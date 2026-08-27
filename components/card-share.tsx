"use client";

import { useState } from "react";
import { copy } from "@/lib/copy";
import { cardPath } from "@/lib/product";
import type { Language } from "@/lib/types";

type CardShareProps = {
  shopId: string;
  name: string;
  language?: Language;
};

function cardUrl(shopId: string, language: Language): string {
  return `${window.location.origin}${cardPath(shopId, language)}`;
}

/** Shares the cafe card path on this host. Not Maps. Not an app-store link. */
export function CardShare({ shopId, name, language = "ar" }: CardShareProps) {
  const [copied, setCopied] = useState(false);

  async function shareCard() {
    const url = cardUrl(shopId, language);

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: name, url });
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Stay quiet if the browser blocks clipboard too.
    }
  }

  if (copied) {
    return <span className="text-xs text-ink-soft">{copy.shareCopied[language]}</span>;
  }

  return (
    <button
      type="button"
      onClick={() => {
        void shareCard();
      }}
      className="text-xs text-ink-soft underline-offset-2 hover:underline"
    >
      {copy.shareCard[language]}
    </button>
  );
}
