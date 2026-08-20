"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export const BEEN_STORAGE_KEY = "koofi.been.v1";
const BEEN_EVENT = "koofi-been";

function parseBeenIds(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function readBeenIds(): string[] {
  if (typeof window === "undefined") return [];
  return parseBeenIds(window.localStorage.getItem(BEEN_STORAGE_KEY) ?? "[]");
}

export function writeBeenIds(ids: string[]): void {
  window.localStorage.setItem(BEEN_STORAGE_KEY, JSON.stringify([...new Set(ids)]));
  window.dispatchEvent(new Event(BEEN_EVENT));
}

export function markBeenHere(id: string): string[] {
  writeBeenIds([...readBeenIds(), id]);
  return readBeenIds();
}

function subscribeBeen(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(BEEN_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(BEEN_EVENT, onStoreChange);
  };
}

function getBeenSnapshot() {
  return window.localStorage.getItem(BEEN_STORAGE_KEY) ?? "[]";
}

function getBeenServerSnapshot() {
  return "[]";
}

export function useBeenIds() {
  const raw = useSyncExternalStore(
    subscribeBeen,
    getBeenSnapshot,
    getBeenServerSnapshot,
  );
  const ids = useMemo(() => parseBeenIds(raw), [raw]);
  const mark = useCallback((id: string) => {
    markBeenHere(id);
  }, []);

  return { ids, mark, has: (id: string) => ids.includes(id) };
}
