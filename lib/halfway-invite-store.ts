import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { getShop } from "./catalog";
import { ENV_KEYS, readEnv } from "./env";
import { feedbackStorageKind } from "./feedback";
import {
  HALFWAY_INVITE_MAX_PINS,
  HALFWAY_RESULTS_TTL_MS,
  halfwayInviteHasGuest,
  parseHalfwayInviteToken,
  sameHalfwayPin,
  type HalfwayInviteSeed,
} from "./halfway-invite";
import type { Pin } from "./types";

/**
 * Optional overlay so Person A's host page can poll after B joins,
 * and so `/h/{id}` can restore frozen shop_ids after results.
 * Neon when DATABASE_URL is set; memory for local `next dev`.
 */
export type HalfwayInviteSession = {
  locations: Pin[];
  expiresAt: number;
  shopIds: string[];
};

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS halfway_invites (
  id TEXT PRIMARY KEY,
  locations JSONB NOT NULL,
  shop_ids JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`,
  `ALTER TABLE halfway_invites ADD COLUMN IF NOT EXISTS shop_ids JSONB`,
] as const;

const memoryInvites = (() => {
  const globalStore = globalThis as typeof globalThis & {
    __wainHalfwayInvites?: Map<string, HalfwayInviteSession>;
  };
  if (!globalStore.__wainHalfwayInvites) {
    globalStore.__wainHalfwayInvites = new Map<string, HalfwayInviteSession>();
  }
  return globalStore.__wainHalfwayInvites;
})();

let sqlClient: NeonQueryFunction<false, false> | null = null;
let schemaReady = false;

function getSql(): NeonQueryFunction<false, false> | null {
  const url = readEnv(ENV_KEYS.DATABASE_URL);
  if (!url) return null;
  if (!sqlClient) sqlClient = neon(url);
  return sqlClient;
}

async function ensureStore(): Promise<"ready" | "missing"> {
  const kind = feedbackStorageKind();
  if (kind === "missing") return "missing";
  if (kind === "memory") return "ready";
  if (schemaReady) return "ready";
  const sql = getSql();
  if (!sql) return "missing";
  for (const statement of SCHEMA) {
    await sql.query(statement);
  }
  schemaReady = true;
  return "ready";
}

function parsePins(value: unknown): Pin[] {
  let rows = value;
  if (typeof rows === "string") {
    try {
      rows = JSON.parse(rows) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(rows)) return [];
  const pins: Pin[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const lat = (row as { lat?: unknown }).lat;
    const lng = (row as { lng?: unknown }).lng;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    pins.push({ lat, lng });
  }
  return pins;
}

export function cleanHalfwayShopIds(value: unknown): string[] {
  let rows = value;
  if (typeof rows === "string") {
    try {
      rows = JSON.parse(rows) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(rows)) return [];
  const ids: string[] = [];
  for (const row of rows) {
    if (typeof row !== "string") continue;
    const id = row.trim();
    if (!id || ids.includes(id) || !getShop(id)) continue;
    ids.push(id);
    if (ids.length >= 3) break;
  }
  return ids;
}

function mergePins(base: Pin[], extra: Pin[]): Pin[] {
  const next = [...base];
  for (const pin of extra) {
    if (next.some((existing) => sameHalfwayPin(existing, pin))) continue;
    next.push(pin);
    if (next.length >= HALFWAY_INVITE_MAX_PINS) break;
  }
  return next;
}

function nextSession(input: {
  existing: HalfwayInviteSession | null;
  locations: Pin[];
  expiresAt: number;
  shopIds?: string[];
  freezeResults?: boolean;
  now: number;
}): HalfwayInviteSession | null {
  const locations = mergePins(
    input.existing?.locations ?? [],
    input.locations,
  ).slice(0, HALFWAY_INVITE_MAX_PINS);
  if (locations.length < 1) return null;

  const incomingShopIds = cleanHalfwayShopIds(input.shopIds ?? []);
  const frozen = input.existing?.shopIds ?? [];
  const shopIds =
    frozen.length > 0
      ? frozen
      : input.freezeResults
        ? incomingShopIds
        : incomingShopIds.length > 0
          ? incomingShopIds
          : [];
  const justFroze = input.freezeResults && frozen.length === 0 && shopIds.length > 0;
  const expiresAt = justFroze
    ? input.now + HALFWAY_RESULTS_TTL_MS
    : frozen.length > 0
      ? input.existing?.expiresAt ?? input.expiresAt
      : input.expiresAt;

  return { locations, expiresAt, shopIds };
}

async function readStoredSession(
  id: string,
  now: number,
): Promise<HalfwayInviteSession | null> {
  if ((await ensureStore()) === "missing") return null;

  if (feedbackStorageKind() === "memory") {
    const row = memoryInvites.get(id);
    if (!row) return null;
    if (row.expiresAt <= now) {
      memoryInvites.delete(id);
      return null;
    }
    return row;
  }

  const sql = getSql();
  if (!sql) return null;
  const rows = (await sql`
    SELECT locations, shop_ids, expires_at
    FROM halfway_invites
    WHERE id = ${id}
    LIMIT 1
  `) as { locations: unknown; shop_ids: unknown; expires_at: string }[];
  const row = rows[0];
  if (!row) return null;
  const expiresAt = new Date(row.expires_at).getTime();
  if (expiresAt <= now) return null;
  return {
    locations: parsePins(row.locations),
    expiresAt,
    shopIds: cleanHalfwayShopIds(row.shop_ids),
  };
}

async function writeStoredSession(
  id: string,
  session: HalfwayInviteSession,
): Promise<void> {
  if (feedbackStorageKind() === "memory") {
    memoryInvites.set(id, session);
    return;
  }

  const sql = getSql();
  if (!sql) return;
  const expiresAt = new Date(session.expiresAt).toISOString();
  const locations = JSON.stringify(session.locations);
  const shopIds = JSON.stringify(session.shopIds);
  await sql`
    INSERT INTO halfway_invites (id, locations, shop_ids, expires_at)
    VALUES (${id}, ${locations}::jsonb, ${shopIds}::jsonb, ${expiresAt})
    ON CONFLICT (id) DO UPDATE SET
      locations = EXCLUDED.locations,
      shop_ids = EXCLUDED.shop_ids,
      expires_at = EXCLUDED.expires_at
  `;
}

export async function readHalfwayInviteSession(
  id: string,
  now = Date.now(),
): Promise<HalfwayInviteSession | null> {
  return readStoredSession(id, now);
}

export async function readHalfwayInviteLocations(
  id: string,
): Promise<Pin[] | null> {
  const session = await readStoredSession(id, Date.now());
  return session ? session.locations : null;
}

export async function writeHalfwayInviteLocations(input: {
  id: string;
  locations: Pin[];
  expiresAt: number;
}): Promise<Pin[] | null> {
  const session = await upsertHalfwayInviteSession(input);
  return session?.locations ?? null;
}

export async function upsertHalfwayInviteSession(input: {
  id: string;
  locations: Pin[];
  expiresAt: number;
  shopIds?: string[];
  freezeResults?: boolean;
  now?: number;
}): Promise<HalfwayInviteSession | null> {
  if ((await ensureStore()) === "missing") return null;
  const now = input.now ?? Date.now();
  const existing = await readStoredSession(input.id, now);
  const session = nextSession({
    existing,
    locations: input.locations,
    expiresAt: input.expiresAt,
    shopIds: input.shopIds,
    freezeResults: input.freezeResults,
    now,
  });
  if (!session) return null;
  await writeStoredSession(input.id, session);
  return session;
}

export async function freezeHalfwayInviteResults(input: {
  id: string;
  shopIds: string[];
  locations?: Pin[];
  now?: number;
}): Promise<HalfwayInviteSession | null> {
  const now = input.now ?? Date.now();
  const existing = await readStoredSession(input.id, now);
  return upsertHalfwayInviteSession({
    id: input.id,
    locations: input.locations ?? existing?.locations ?? [],
    expiresAt: existing?.expiresAt ?? now + HALFWAY_RESULTS_TTL_MS,
    shopIds: input.shopIds,
    freezeResults: true,
    now,
  });
}

export type ResolvedHalfwayInvite =
  | {
      ok: true;
      seed: HalfwayInviteSeed;
      session: HalfwayInviteSession;
      joined: boolean;
    }
  | { ok: false; reason: "bad" | "expired" };

export async function resolveHalfwayInviteSession(
  id: string,
  now = Date.now(),
): Promise<ResolvedHalfwayInvite> {
  const parsed = parseHalfwayInviteToken(id);
  if (!parsed.ok) return parsed;

  let stored: HalfwayInviteSession | null = null;
  try {
    stored = await readStoredSession(id, now);
  } catch {
    stored = null;
  }

  const locations =
    stored && stored.locations.length > parsed.seed.locations.length
      ? stored.locations
      : stored?.locations.length
        ? stored.locations
        : parsed.seed.locations;
  const shopIds = stored?.shopIds ?? [];
  const expiresAt = stored?.expiresAt ?? parsed.seed.exp;
  if (expiresAt <= now) return { ok: false, reason: "expired" };

  return {
    ok: true,
    seed: parsed.seed,
    session: {
      locations,
      expiresAt,
      shopIds,
    },
    joined: halfwayInviteHasGuest(parsed.seed.locations, locations),
  };
}

export function mergeHalfwayInviteSessionForTest(input: {
  existing: HalfwayInviteSession | null;
  locations: Pin[];
  expiresAt: number;
  shopIds?: string[];
  freezeResults?: boolean;
  now: number;
}): HalfwayInviteSession | null {
  return nextSession(input);
}
