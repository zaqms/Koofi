"use client";

import { shopDistanceDisplay } from "@/lib/shop-distance-label";
import type { Language, Pin } from "@/lib/types";
import { useVisitorLocation } from "@/lib/visitor-location";

type ShopDistanceProps = {
  coords?: Pin | null;
  language: Language;
};

/**
 * Quiet km on an existing meta line. Hidden until visitor geo is ready.
 * When ready: km if place geometry exists, otherwise a muted fallback.
 * Matcha + Drive-through Nearby share this slot — never a silent omit.
 */
export function ShopDistance({ coords, language }: ShopDistanceProps) {
  const visitor = useVisitorLocation();
  const origin =
    visitor.status === "ready"
      ? { lat: visitor.lat, lng: visitor.lng }
      : null;
  const display = shopDistanceDisplay({ origin, coords, language });
  if (display.kind === "hidden") return null;

  if (display.kind === "missing") {
    return (
      <span className="text-ink/45" data-shop-distance="missing">
        {" · "}
        {display.label}
      </span>
    );
  }

  return (
    <span dir="ltr" data-shop-distance="km" data-shop-distance-km={display.km.toFixed(3)}>
      {" · "}
      {display.label}
    </span>
  );
}
