"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/track";

type TrackShareInboundProps = {
  packId: string;
  from?: string;
};

/** Fires share_inbound when a restore URL arrives with from=wa. */
export function TrackShareInbound({ packId, from }: TrackShareInboundProps) {
  useEffect(() => {
    if (from !== "wa" || !packId) return;
    trackEvent(
      "share_inbound",
      { pack_id: packId, from },
      { dedupeKey: `share_inbound:${packId}:${from}` },
    );
  }, [packId, from]);

  return null;
}
