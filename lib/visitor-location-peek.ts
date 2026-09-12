export type VisitorLocationStatus = "pending" | "ready" | "unavailable";

export type GeoPermission = "granted" | "prompt" | "denied" | "unknown";

export type VisitorLocationPeekAction =
  | "use-ready"
  | "await-inflight"
  | "request"
  | "idle";

/**
 * بيننا auto-Ready: read only when the browser already allowed location.
 * Never opens the prompt. My pin / موقعي still calls requestVisitorLocation.
 */
export function decideVisitorLocationPeek(input: {
  snapshotStatus: VisitorLocationStatus;
  permission: GeoPermission;
  inflight: boolean;
  rememberedGranted: boolean;
}): VisitorLocationPeekAction {
  if (input.snapshotStatus === "ready") return "use-ready";
  if (input.inflight) return "await-inflight";
  if (input.permission === "denied") return "idle";
  if (input.permission === "granted" || input.rememberedGranted) {
    return "request";
  }
  return "idle";
}
