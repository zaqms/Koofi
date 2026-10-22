"use client";

import { useEffect } from "react";
import { installCafeReturn, revealResultsRestore, restoreResultsScroll } from "@/lib/results-return";

/** Captures café-card navigations and puts the results scroll back on return. */
export function CafeReturn() {
  useEffect(() => {
    const remove = installCafeReturn();
    const timers: number[] = [];
    function restore() {
      restoreResultsScroll();
      requestAnimationFrame(() => restoreResultsScroll());
      timers.push(window.setTimeout(() => restoreResultsScroll(), 60));
    }
    restore();
    timers.push(window.setTimeout(revealResultsRestore, 2500));
    window.addEventListener("popstate", restore);
    return () => {
      remove();
      window.removeEventListener("popstate", restore);
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, []);
  return null;
}
