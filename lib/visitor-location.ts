"use client";

import { useEffect, useSyncExternalStore } from "react";

export type VisitorLocation =
  | { status: "pending" }
  | { status: "ready"; lat: number; lng: number }
  | { status: "unavailable" };

type Listener = () => void;

const listeners = new Set<Listener>();
const pendingSnapshot: VisitorLocation = { status: "pending" };

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

function readPosition(): Promise<VisitorLocation> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ status: "unavailable" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          status: "ready",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        resolve({ status: "unavailable" });
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 8_000 },
    );
  });
}

export type GeoPermission = "granted" | "prompt" | "denied" | "unknown";

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
  if (snapshot.status === "ready") return snapshot;
  const permission = await readGeolocationPermission();
  if (permission === "granted") return requestVisitorLocation();
  return snapshot.status === "unavailable" ? snapshot : pendingSnapshot;
}

/** One browser Geolocation read. Retry after deny so a chip tap can ask again. */
export function requestVisitorLocation(options?: {
  retry?: boolean;
}): Promise<VisitorLocation> {
  if (snapshot.status === "ready") return Promise.resolve(snapshot);
  if (inflight) return inflight;
  if (snapshot.status === "unavailable" && !options?.retry) {
    return Promise.resolve(snapshot);
  }

  inflight = readPosition().then((next) => {
    emit(next);
    inflight = null;
    return next;
  });
  return inflight;
}

export function useVisitorLocation(): VisitorLocation {
  const location = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (autoStarted) return;
    autoStarted = true;
    void requestVisitorLocation();
  }, []);

  return location;
}
