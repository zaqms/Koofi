"use client";

import { formatDistanceKm, haversineKm } from "@/lib/distance";
import { useVisitorLocation } from "@/lib/visitor-location";
import type { Language, Pin } from "@/lib/types";

type ShopDistanceProps = {
  coords?: Pin | null;
  language: Language;
};

/** Quiet km on an existing meta line. Hidden if location or place geometry is missing. */
export function ShopDistance({ coords, language }: ShopDistanceProps) {
  const visitor = useVisitorLocation();
  if (visitor.status !== "ready" || !coords) return null;

  const label = formatDistanceKm(
    haversineKm({ lat: visitor.lat, lng: visitor.lng }, coords),
    language,
  );
  if (!label) return null;

  return (
    <span dir="ltr">
      {" · "}
      {label}
    </span>
  );
}
