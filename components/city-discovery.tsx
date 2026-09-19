"use client";

import type { ReactNode } from "react";
import { useCity } from "@/lib/city-context";

type CityDiscoveryProps = {
  children: ReactNode;
};

/** Hides live-catalog surfaces when a coming-soon city is selected. */
export function CityDiscovery({ children }: CityDiscoveryProps) {
  const { isLive } = useCity();
  if (!isLive) return null;
  return <>{children}</>;
}
