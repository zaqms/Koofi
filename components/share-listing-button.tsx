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
};

export function ShareListingButton({
  shop,
  language,
  source,
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
    <div className="inline-flex flex-col items-start gap-0.5">
      <button
        type="button"
        onClick={() => {
          void onShare();
        }}
        className="notranslate inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-ink-soft hover:text-ink"
        lang={language}
        translate="no"
      >
        <ShareIcon />
        <span>{copy.sharePack[language]}</span>
      </button>
      {copied ? (
        <p className="text-[11px] text-ink-soft">{copy.packetCopied[language]}</p>
      ) : null}
    </div>
  );
}
