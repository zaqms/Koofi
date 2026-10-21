export type VisitorLocationStatus =
  | "pending"
  | "ready"
  | "unavailable"
  | "denied";

export type GeoPermission = "granted" | "prompt" | "denied" | "unknown";

export type VisitorLocationPeekAction =
  | "use-ready"
  | "await-inflight"
  | "request"
  | "idle";

/**
 * Silent read only. `getCurrentPosition` runs when the Permissions API
 * already says granted, which does not open a prompt.
 * `rememberedGranted` is ignored on purpose: after a reset the permission
 * is `prompt` (or `unknown` where the API is missing) and a stored flag
 * would open the dialog on page load. A Nearby tap still calls
 * `requestVisitorLocation`.
 */
export function decideVisitorLocationPeek(input: {
  snapshotStatus: VisitorLocationStatus;
  permission: GeoPermission;
  inflight: boolean;
  rememberedGranted: boolean;
}): VisitorLocationPeekAction {
  if (input.snapshotStatus === "ready") return "use-ready";
  if (input.inflight) return "await-inflight";
  if (input.permission === "granted") return "request";
  void input.rememberedGranted;
  return "idle";
}
