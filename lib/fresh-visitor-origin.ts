"use client";

import { useEffect, useState } from "react";
import { isUsableVisitorOrigin } from "./place-coords";
import type { Pin } from "./types";
import {
  readGeolocationPermission,
  readRememberedGeoGranted,
  readSharedVisitorPosition,
  useVisitorLocationSnapshot,
  watchGeolocationPermission,
  type VisitorLocation,
} from "./visitor-location";

/**
 * Fresh visitor fix for the home neighborhood rail.
 *
 * High-accuracy first, `maximumAge: 0`. A second fresh coarse read runs
 * only if GPS times out or returns an unusable point. The shared
 * visitor snapshot is a permission signal only — its lat/lng are never copied.
 * Soft Places stays parked.
 */
export async function readFreshVisitorPosition(): Promise<VisitorLocation> {
  const gps = await readSharedVisitorPosition({
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
 * so the rail can keep the city fallback.
 * A status flip from the shared peek must not start a second GPS read.
 * Returning to the tab, or a permission change, reads again.
 */
let freshFix: VisitorLocation | null = null;

export function useFreshHomeOrigin(): VisitorLocation {
  const shared = useVisitorLocationSnapshot();
  const [location, setLocation] = useState<VisitorLocation>({ status: "pending" });

  useEffect(() => {
    let cancelled = false;
    let generation = 0;
    let unwatch = () => {};
    let wasHidden = false;

    async function refresh(force: boolean) {
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
        if (shared.status === "unavailable" || shared.status === "denied") {
          setLocation({ status: "unavailable" });
        }
        return;
      }

      if (!force && freshFix?.status === "ready") {
        setLocation(freshFix);
        return;
      }

      const next = await readFreshVisitorPosition();
      if (next.status === "ready") freshFix = next;
      if (cancelled || gen !== generation) return;
      setLocation(next);
    }

    void refresh(false);

    function onPageShow(event: PageTransitionEvent) {
      if (!event.persisted) return;
      freshFix = null;
      void refresh(true);
    }
    function onVisible() {
      if (document.visibilityState === "hidden") {
        wasHidden = true;
        return;
      }
      if (!wasHidden) return;
      wasHidden = false;
      freshFix = null;
      void refresh(true);
    }
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);

    void (async () => {
      const stop = await watchGeolocationPermission(() => {
        freshFix = null;
        void refresh(true);
      });
      if (cancelled) {
        stop();
        return;
      }
      unwatch = stop;
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
