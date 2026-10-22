"use client";

import { useEffect } from "react";
import { installCafeReturn, revealResultsRestore, restoreResultsScroll } from "@/lib/results-return";

/** Captures café-card navigations and puts the results scroll back on return. */
export function CafeReturn() {
  useEffect(() => {
    const remove = installCafeReturn();
    restoreResultsScroll();
    const revealTimer = window.setTimeout(revealResultsRestore, 2500);
    window.addEventListener("popstate", restoreResultsScroll);
    return () => {
      remove();
      window.removeEventListener("popstate", restoreResultsScroll);
      window.clearTimeout(revealTimer);
    };
  }, []);
  return null;
}
