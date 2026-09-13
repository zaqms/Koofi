import { looksLikeSharedPin } from "./shared-pin";
import type { Pin } from "./types";

export type HalfwayPinSurface = "ready" | "paste";

/**
 * Guest + host My-pin surface. Language is display-only — AR and EN
 * must resolve the same Ready vs Maps-paste composer from this input.
 */
export function halfwayPinSurface(input: {
  pin?: Pin | null;
  text?: string;
  locationOff?: boolean;
  wantChange?: boolean;
}): HalfwayPinSurface {
  const ready = Boolean(input.pin || looksLikeSharedPin(input.text ?? ""));
  if (!ready || input.locationOff || input.wantChange) return "paste";
  return "ready";
}

export function halfwayPinIsReady(input: {
  pin?: Pin | null;
  text?: string;
}): boolean {
  return Boolean(input.pin || looksLikeSharedPin(input.text ?? ""));
}
