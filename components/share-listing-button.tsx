"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/share-icon";
import { copy } from "@/lib/copy";
import { listingPacketForShop, sharePackPacket } from "@/lib/share-pack";
import { trackEvent, type ListingShareSource } from "@/lib/track";
import type { Language, Shop } from "@/lib/types";

type ShareListingButtonProps = {
  shop: Pick<Shop, "id" | "nameAr" | "nameEn" | "neighborhood" | "momentTags" | "vibeTags">;
  language: Language;
  source: ListingShareSource;
  compact?: boolean;
  variant?: "default" | "passport" | "ghost";
};

export function ShareListingButton({
  shop,
  language,
  source,
  compact = false,
  variant = "default",
}: ShareListingButtonProps) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const packet = listingPacketForShop({ shop, language, origin });
    trackEvent(
      "share_listing",
      { shop_id: shop.id, locale: language, source },
      { dedupeKey: `share_listing:${shop.id}:${source}` },
    );
    const result = await sharePackPacket(packet.text);
    setCopied(result === "copied");
  }

  return (
    <div className="inline-flex shrink-0 flex-col items-start gap-0.5">
      <button
        type="button"
        onClick={() => {
          void onShare();
        }}
        className={
          variant === "ghost"
            ? "notranslate inline-flex size-8 items-center justify-center rounded-md text-foam hover:bg-foam/15"
            : variant === "passport"
            ? "notranslate inline-flex size-11 items-center justify-center rounded-lg border border-gold text-gold hover:bg-passport-wash"
            : compact
              ? "notranslate inline-flex size-11 items-center justify-center rounded-xl text-ink-soft hover:bg-paper-deep hover:text-ink"
              : "notranslate inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-ink-soft hover:text-ink"
        }
        lang={language}
        translate="no"
        aria-label={copy.sharePack[language]}
      >
        <ShareIcon />
        {compact ? null : <span>{copy.sharePack[language]}</span>}
      </button>
      {copied ? (
        <p className={compact ? "sr-only" : "text-[11px] text-ink-soft"}>
          {copy.packetCopied[language]}
        </p>
      ) : null}
    </div>
  );
}
