"use client";

import { useEffect, useState } from "react";
import {
  readGeolocationPermission,
  requestVisitorLocation,
  useVisitorLocationSnapshot,
  type VisitorLocation,
} from "./visitor-location";

/**
 * Home neighborhood rail.
 *
 * Joins the shared silent read (`requestVisitorLocation`). Home also peeks
 * from chat and cards, so this rail must not start its own GPS fix.
 * Soft Places stays parked.
 * Does not open the browser prompt. Only a granted permission, or a pin
 * a gesture already produced, may read. A stored "allowed before" flag is
 * not enough. Returning to the tab reads once more.
 */
export function useFreshHomeOrigin(): VisitorLocation {
  const shared = useVisitorLocationSnapshot();
  const [location, setLocation] = useState<VisitorLocation>({ status: "pending" });

  useEffect(() => {
    let cancelled = false;
    let generation = 0;
    let unwatch = () => {};
    let sawLoad = false;
    let wasHidden = false;

    async function refresh(force: boolean) {
      const gen = ++generation;
      const permission = await readGeolocationPermission();
      if (cancelled || gen !== generation) return;

      if (permission === "denied") {
        setLocation({ status: "unavailable" });
        return;
      }

      const allowed = permission === "granted" || shared.status === "ready";
      if (!allowed) {
        if (shared.status === "unavailable" || shared.status === "denied") {
          setLocation({ status: "unavailable" });
        }
        return;
      }

      const next = await requestVisitorLocation(
        force ? { retry: true, fresh: true } : { retry: true },
      );
      if (cancelled || gen !== generation) return;
      setLocation(next);
    }

    void refresh(false).then(() => {
      sawLoad = true;
    });

    function onPageShow(event: PageTransitionEvent) {
      // The load event's pageshow is not a return. Only a bfcache restore is.
      if (!sawLoad || !event.persisted) return;
      void refresh(true);
    }
    function onVisible() {
      if (document.visibilityState === "hidden") {
        wasHidden = true;
        return;
      }
      if (!sawLoad || !wasHidden) return;
      wasHidden = false;
      void refresh(true);
    }
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);

    void (async () => {
      if (typeof navigator === "undefined" || !navigator.permissions?.query) return;
      try {
        const status = await navigator.permissions.query({ name: "geolocation" });
        if (cancelled) return;
        const onChange = () => {
          void refresh(false);
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
