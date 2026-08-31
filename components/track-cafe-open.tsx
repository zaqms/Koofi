"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/track";
import type { Language } from "@/lib/types";

type TrackCafeOpenProps = {
  shopId: string;
  locale: Language;
};

/** Fires `cafe_open` once the /c/[id] card is on screen. */
export function TrackCafeOpen({ shopId, locale }: TrackCafeOpenProps) {
  useEffect(() => {
    trackEvent(
      "cafe_open",
      { shop_id: shopId, locale },
      { dedupeKey: `cafe_open:${shopId}:${locale}` },
    );
  }, [shopId, locale]);

  return null;
}
