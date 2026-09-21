"use client";

import { useEffect, useState } from "react";
import { isUsableVisitorOrigin } from "./place-coords";
import type { Pin } from "./types";
import {
  readGeolocationPermission,
  readRememberedGeoGranted,
  useVisitorLocationSnapshot,
  type VisitorLocation,
} from "./visitor-location";

/**
 * Fresh visitor fix for the home neighborhood rail.
 *
 * High-accuracy first, `maximumAge: 0`. A second fresh coarse read runs
 * only if GPS times out or returns an unusable point. The shared
 * visitor snapshot (low-accuracy, up to 60s old) is a permission signal
 * only — its lat/lng are never copied.
 *
 * Same read order as HOLD #195, implemented here so this rail does not
 * depend on that unmerged PR. Soft Places stays parked.
 */
export async function readFreshVisitorPosition(): Promise<VisitorLocation> {
  const gps = await readOnce({
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 12_000,
  });
  if (!gps.ok && gps.denied) return { status: "unavailable" };
  const freshGps = gps.ok ? usableReady(gps.lat, gps.lng) : null;
  if (freshGps) return freshGps;

  const coarse = await readOnce({
    enableHighAccuracy: false,
    maximumAge: 0,
    timeout: 8_000,
  });
  if (!coarse.ok && coarse.denied) return { status: "unavailable" };
  const freshCoarse = coarse.ok ? usableReady(coarse.lat, coarse.lng) : null;
  if (freshCoarse) return freshCoarse;

  return { status: "unavailable" };
}

function usableReady(lat: number, lng: number): VisitorLocation | null {
  const pin: Pin = { lat, lng };
  if (!isUsableVisitorOrigin(pin)) return null;
  return { status: "ready", lat: pin.lat, lng: pin.lng };
}

type PositionRead =
  | { ok: true; lat: number; lng: number }
  | { ok: false; denied: boolean };

function readOnce(options: PositionOptions): Promise<PositionRead> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve({ ok: false, denied: false });
      return;
    }
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

/**
 * Subscribe and read a fresh fix when location is already allowed.
 * Does not open a second browser prompt: the home chat still owns the
 * first ask. Denied, timeout, and unusable fixes stay `unavailable`
 * so the rail can keep the city fallback. Returning to the tab reads again.
 */
export function useFreshHomeOrigin(): VisitorLocation {
  const shared = useVisitorLocationSnapshot();
  const [location, setLocation] = useState<VisitorLocation>({ status: "pending" });

  useEffect(() => {
    let cancelled = false;
    let generation = 0;
    let unwatch = () => {};

    async function refresh() {
      const gen = ++generation;
      const permission = await readGeolocationPermission();
      if (cancelled || gen !== generation) return;

      if (permission === "denied") {
        setLocation({ status: "unavailable" });
        return;
      }

      const allowed =
        permission === "granted" ||
        readRememberedGeoGranted() ||
        shared.status === "ready";
      if (!allowed) {
        if (shared.status === "unavailable") {
          setLocation({ status: "unavailable" });
        }
        return;
      }

      const next = await readFreshVisitorPosition();
      if (cancelled || gen !== generation) return;
      setLocation(next);
    }

    void refresh();

    function onPageShow() {
      void refresh();
    }
    function onVisible() {
      if (document.visibilityState === "visible") void refresh();
    }
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);

    void (async () => {
      if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
      try {
        const status = await navigator.permissions.query({ name: "geolocation" });
        if (cancelled) return;
        const onChange = () => {
          void refresh();
        };
        status.addEventListener("change", onChange);
        unwatch = () => status.removeEventListener("change", onChange);
      } catch {
        // Some browsers reject geolocation permission queries.
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
      unwatch();
    };
  }, [shared.status]);

  return location;
}
