"use client";

import { useSyncExternalStore, type ReactNode } from "react";

const listeners = new Set<() => void>();
let open = false;

/** Bare-home search tells the footer to unmount. Other routes never publish. */
export function setSearchScreenOpen(next: boolean) {
  if (open === next) return;
  open = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Keeps the bare-home footer in place until Search/Chat is open. */
export function HomeBareTail({ children }: { children: ReactNode }) {
  const hidden = useSyncExternalStore(subscribe, () => open, () => false);
  if (hidden) return null;
  return children;
}
