export const BEEN_STORAGE_KEY = "koofi.been.v1";

export function readBeenIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BEEN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function writeBeenIds(ids: string[]): void {
  window.localStorage.setItem(BEEN_STORAGE_KEY, JSON.stringify([...new Set(ids)]));
}

export function markBeenHere(id: string): string[] {
  const next = [...readBeenIds(), id];
  writeBeenIds(next);
  return readBeenIds();
}
