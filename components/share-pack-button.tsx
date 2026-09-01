"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/share-icon";
import { copy } from "@/lib/copy";
import { packetTextForPicks, sharePackPacket } from "@/lib/share-pack";
import { trackEvent } from "@/lib/track";
import type { ChatPick, Language } from "@/lib/types";

type SharePackButtonProps = {
  picks: ChatPick[];
  language: Language;
  uiLanguage: Language;
  ask: string;
  packId?: string;
};

export function SharePackButton({
  picks,
  language,
  uiLanguage,
  ask,
  packId,
}: SharePackButtonProps) {
  const [copied, setCopied] = useState(false);

  if (picks.length === 0) return null;

  async function onShare() {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const packet = packetTextForPicks({
      picks,
      language,
      ask,
      origin,
    });
    trackEvent(
      "share_packet_copy",
      { locale: language, pack_id: packId ?? packet.packId },
      { dedupeKey: `share_packet_copy:${packet.packId}` },
    );
    const result = await sharePackPacket(packet.text);
    setCopied(result === "copied");
  }

  return (
    <div className="mt-2 flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => {
          void onShare();
        }}
        className="notranslate inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-ink-soft hover:text-ink"
        lang={uiLanguage}
        translate="no"
      >
        <ShareIcon />
        <span>{copy.sharePack[uiLanguage]}</span>
      </button>
      {copied ? (
        <p className="text-[11px] text-ink-soft">{copy.packetCopied[uiLanguage]}</p>
      ) : null}
    </div>
  );
}
