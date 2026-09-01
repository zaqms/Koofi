"use client";

import { useEffect } from "react";
import { trackEvent, type ShareInboundKind } from "@/lib/track";

type TrackShareInboundProps = {
  kind: ShareInboundKind;
  from?: string;
  packId?: string;
  shopId?: string;
};

/** Fires share_inbound when a restore URL arrives with from=wa. */
export function TrackShareInbound({
  kind,
  from,
  packId,
  shopId,
}: TrackShareInboundProps) {
  useEffect(() => {
    if (from !== "wa") return;
    trackEvent(
      "share_inbound",
      {
        kind,
        from,
        ...(packId ? { pack_id: packId } : {}),
        ...(shopId ? { shop_id: shopId } : {}),
      },
      { dedupeKey: `share_inbound:${kind}:${packId ?? shopId ?? ""}:${from}` },
    );
  }, [kind, from, packId, shopId]);

  return null;
}
