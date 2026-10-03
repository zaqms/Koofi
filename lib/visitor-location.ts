"use client";

import { useEffect, useSyncExternalStore } from "react";
import { isUsableVisitorOrigin } from "./place-coords";
import {
  decideVisitorLocationPeek,
  type GeoPermission,
} from "./visitor-location-peek";

export type VisitorLocation =
  | { status: "pending" }
  | { status: "ready"; lat: number; lng: number }
  | { status: "unavailable" }
  | { status: "denied" };

export type { GeoPermission, VisitorLocationPeekAction } from "./visitor-location-peek";
export { decideVisitorLocationPeek };

type Listener = () => void;

const listeners = new Set<Listener>();
const pendingSnapshot: VisitorLocation = { status: "pending" };

/** Boolean only — never lat/lng. Lets Safari-lying-as-prompt still auto-Ready. */
export const VISITOR_GEO_GRANTED_KEY = "wain.visitorGeoGranted.v1";

let snapshot: VisitorLocation = pendingSnapshot;
let inflight: Promise<VisitorLocation> | null = null;
let autoStarted = false;

function emit(next: VisitorLocation) {
  snapshot = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): VisitorLocation {
  return snapshot;
}

function getServerSnapshot(): VisitorLocation {
  return pendingSnapshot;
}

export function readRememberedGeoGranted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(VISITOR_GEO_GRANTED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeRememberedGeoGranted(granted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (granted) window.localStorage.setItem(VISITOR_GEO_GRANTED_KEY, "1");
    else window.localStorage.removeItem(VISITOR_GEO_GRANTED_KEY);
  } catch {
    // Private mode / quota — permission query still works this session.
  }
}

type PositionRead =
  | { ok: true; lat: number; lng: number }
  | { ok: false; denied: boolean };

function readOnce(options: PositionOptions): Promise<PositionRead> {
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude),
        });
      },
      (error) => resolve({ ok: false, denied: error.code === 1 }),
      options,
    );
  });
}

function readyIfUsable(lat: number, lng: number): VisitorLocation | null {
  const pin = { lat, lng };
  if (!isUsableVisitorOrigin(pin)) return null;
  writeRememberedGeoGranted(true);
  return { status: "ready", lat: pin.lat, lng: pin.lng };
}

/**
 * Fresh GPS first. A cached low-accuracy fix (carrier / IP) must not become
 * `ready` — that painted "Location unavailable" on every official pin.
 * Soft Places stays parked. Shop distance still uses official place pins only.
 */
async function readPosition(): Promise<VisitorLocation> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { status: "unavailable" };
  }

  const gps = await readOnce({
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 12_000,
  });
  if (!gps.ok && gps.denied) {
    writeRememberedGeoGranted(false);
    return { status: "denied" };
  }
  if (gps.ok) {
    const ready = readyIfUsable(gps.lat, gps.lng);
    if (ready) return ready;
  }

  const coarse = await readOnce({
    enableHighAccuracy: false,
    maximumAge: 0,
    timeout: 8_000,
  });
  if (!coarse.ok && coarse.denied) {
    writeRememberedGeoGranted(false);
    return { status: "denied" };
  }
  if (coarse.ok) {
    const ready = readyIfUsable(coarse.lat, coarse.lng);
    if (ready) return ready;
  }

  return { status: "unavailable" };
}

/** Permissions API only — never opens the browser prompt. */
export async function readGeolocationPermission(): Promise<GeoPermission> {
  if (typeof navigator === "undefined") return "unknown";
  try {
    const permissions = navigator.permissions;
    if (!permissions?.query) return "unknown";
    const status = await permissions.query({ name: "geolocation" });
    if (
      status.state === "granted" ||
      status.state === "denied" ||
      status.state === "prompt"
    ) {
      return status.state;
    }
  } catch {
    // Some browsers reject geolocation permission queries.
  }
  return "unknown";
}

/**
 * Use a pin that is already allowed. Does not prompt.
 * بيننا auto-Ready only — My pin / موقعي still calls requestVisitorLocation.
 */
export async function peekReadyVisitorLocation(): Promise<VisitorLocation> {
  if (readySnapshotUsable()) return snapshot;
  if (inflight) return inflight;

  const permission = await readGeolocationPermission();
  if (readySnapshotUsable()) return snapshot;
  if (inflight) return inflight;

  const action = decideVisitorLocationPeek({
    snapshotStatus: snapshot.status,
    permission,
    inflight: false,
    rememberedGranted: readRememberedGeoGranted(),
  });
  if (action === "request") return requestVisitorLocation({ retry: true });
  return snapshot.status === "unavailable" ? snapshot : pendingSnapshot;
}

/** One browser Geolocation read. Retry after deny so a chip tap can ask again. */
function readySnapshotUsable(): boolean {
  return (
    snapshot.status === "ready" &&
    isUsableVisitorOrigin({ lat: snapshot.lat, lng: snapshot.lng })
  );
}

export function requestVisitorLocation(options?: {
  retry?: boolean;
}): Promise<VisitorLocation> {
  if (readySnapshotUsable()) return Promise.resolve(snapshot);
  if (inflight) return inflight;
  if (
    (snapshot.status === "unavailable" || snapshot.status === "denied") &&
    !options?.retry
  ) {
    return Promise.resolve(snapshot);
  }

  inflight = readPosition().then((next) => {
    emit(next);
    inflight = null;
    return next;
  });
  return inflight;
}

export function useVisitorLocationSnapshot(): VisitorLocation {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Subscribe + peek. Does not open the browser prompt. */
export function usePeekVisitorLocation(): VisitorLocation {
  const location = useVisitorLocationSnapshot();

  useEffect(() => {
    void peekReadyVisitorLocation();
  }, []);

  return location;
}

export function useVisitorLocation(options?: {
  auto?: boolean;
}): VisitorLocation {
  const location = useVisitorLocationSnapshot();
  const auto = options?.auto !== false;

  useEffect(() => {
    if (!auto) return;
    if (autoStarted) return;
    autoStarted = true;
    void requestVisitorLocation();
  }, [auto]);

  return location;
}
