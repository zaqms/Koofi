"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/share-icon";
import { copy } from "@/lib/copy";
import { copySharePacket, packetTextForPicks } from "@/lib/share-pack";
import { trackEvent } from "@/lib/track";
import type { ChatPick, Language } from "@/lib/types";

type SharePackButtonProps = {
  picks: ChatPick[];
  language: Language;
  ask: string;
  packId?: string;
};

export function SharePackButton({
  picks,
  language,
  ask,
  packId,
}: SharePackButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "failed">(
    "idle",
  );

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
    const next = await copySharePacket(packet.text);
    setStatus(next);
  }

  return (
    <div className="mt-2 flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => {
          void onShare();
        }}
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-ink-soft hover:text-ink"
      >
        <ShareIcon />
        <span>{copy.sendThree[language]}</span>
      </button>
      {status === "copied" || status === "shared" ? (
        <p className="text-[11px] text-ink-soft">{copy.packetCopied[language]}</p>
      ) : null}
      {status === "failed" ? (
        <p className="text-[11px] text-ink-soft">
          {copy.packetCopyFailed[language]}
        </p>
      ) : null}
    </div>
  );
}
