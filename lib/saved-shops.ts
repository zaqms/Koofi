"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export const SAVED_SHOPS_STORAGE_KEY = "wain.saved.v1";
const SAVED_EVENT = "wain-saved-shops";

function parseSavedIds(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function readSavedShopIds(): string[] {
  if (typeof window === "undefined") return [];
  return parseSavedIds(window.localStorage.getItem(SAVED_SHOPS_STORAGE_KEY) ?? "[]");
}

export function writeSavedShopIds(ids: string[]): void {
  window.localStorage.setItem(
    SAVED_SHOPS_STORAGE_KEY,
    JSON.stringify([...new Set(ids)]),
  );
  window.dispatchEvent(new Event(SAVED_EVENT));
}

export function toggleSavedShop(id: string): string[] {
  const current = readSavedShopIds();
  writeSavedShopIds(
    current.includes(id) ? current.filter((row) => row !== id) : [...current, id],
  );
  return readSavedShopIds();
}

function subscribeSaved(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SAVED_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SAVED_EVENT, onStoreChange);
  };
}

function getSavedSnapshot() {
  return window.localStorage.getItem(SAVED_SHOPS_STORAGE_KEY) ?? "[]";
}

function getSavedServerSnapshot() {
  return "[]";
}

export function useSavedShopIds() {
  const raw = useSyncExternalStore(
    subscribeSaved,
    getSavedSnapshot,
    getSavedServerSnapshot,
  );
  const ids = useMemo(() => parseSavedIds(raw), [raw]);
  const toggle = useCallback((id: string) => {
    toggleSavedShop(id);
  }, []);

  return { ids, toggle, has: (id: string) => ids.includes(id) };
}
