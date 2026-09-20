"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Search + category lists: never paint at the top, and do not ask on first
 * paint. Show after the visitor has had a look — scroll past the first
 * results (~160px), a pointer on the page, or 6s after results are ready.
 */
export const RESULTS_FEEDBACK_REVEAL_MS = 6000;
export const RESULTS_FEEDBACK_REVEAL_SCROLL_PX = 160;

export function useResultsFeedbackReveal(ready: boolean): boolean {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!ready || shown) return;

    function show() {
      setShown(true);
    }

    function onScroll() {
      if (window.scrollY >= RESULTS_FEEDBACK_REVEAL_SCROLL_PX) show();
    }

    if (window.scrollY >= RESULTS_FEEDBACK_REVEAL_SCROLL_PX) {
      show();
      return;
    }

    const timer = window.setTimeout(show, RESULTS_FEEDBACK_REVEAL_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointerdown", show, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", show);
    };
  }, [ready, shown]);

  return ready && shown;
}

export function ResultsFeedbackReveal({
  ready,
  children,
}: {
  ready: boolean;
  children: ReactNode;
}) {
  const shown = useResultsFeedbackReveal(ready);
  if (!shown) return null;
  return <>{children}</>;
}
