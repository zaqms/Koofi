"use client";

const STORAGE_KEY = "koofi.sid.v1";

function randomSession(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function readLearnSession(): string {
  try {
    const existing = window.sessionStorage.getItem(STORAGE_KEY);
    if (existing && /^[a-f0-9]{12}$/.test(existing)) return existing;
    const next = randomSession();
    window.sessionStorage.setItem(STORAGE_KEY, next);
    return next;
  } catch {
    return "anon";
  }
}

export function postLearnMaps(input: {
  shopId: string;
  pickIndex: number;
}): void {
  try {
    void fetch("/api/learn", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "maps",
        shopId: input.shopId,
        pickIndex: input.pickIndex,
        session: readLearnSession(),
      }),
    });
  } catch {
    // Best-effort. A failed tap log must not block Maps.
  }
}
