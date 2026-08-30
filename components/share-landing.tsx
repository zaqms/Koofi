"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackLandedFromShare } from "@/lib/data-layer";

type ShareLandingProps = {
  cafeId: string;
};

/** Once per load when the cafe card opens with `?ref=share`. */
export function ShareLanding({ cafeId }: ShareLandingProps) {
  const searchParams = useSearchParams();
  const fromShare = searchParams.get("ref") === "share";

  useEffect(() => {
    if (!fromShare) return;
    trackLandedFromShare(cafeId);
  }, [cafeId, fromShare]);

  return null;
}
