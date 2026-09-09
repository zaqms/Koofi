import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { ENV_KEYS, readEnv } from "./env";
import { feedbackStorageKind } from "./feedback";
import {
  HALFWAY_INVITE_MAX_PINS,
  sameHalfwayPin,
} from "./halfway-invite";
import type { Pin } from "./types";

/**
 * Optional overlay so Person A can refresh after B joins.
 * Source of truth for B is still the checksummed `/h/{id}` URL.
 * Neon when DATABASE_URL is set; memory for local `next dev`.
 */
type StoredInvite = {
  locations: Pin[];
  expiresAt: number;
};

const SCHEMA = `CREATE TABLE IF NOT EXISTS halfway_invites (
  id TEXT PRIMARY KEY,
  locations JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)`;

const memoryInvites = (() => {
  const globalStore = globalThis as typeof globalThis & {
    __wainHalfwayInvites?: Map<string, StoredInvite>;
  };
  if (!globalStore.__wainHalfwayInvites) {
    globalStore.__wainHalfwayInvites = new Map<string, StoredInvite>();
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
  await sql.query(SCHEMA);
  schemaReady = true;
  return "ready";
}

function parsePins(value: unknown): Pin[] {
  if (!Array.isArray(value)) return [];
  const pins: Pin[] = [];
  for (const row of value) {
    if (!row || typeof row !== "object") continue;
    const lat = (row as { lat?: unknown }).lat;
    const lng = (row as { lng?: unknown }).lng;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    pins.push({ lat, lng });
  }
  return pins;
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

export async function readHalfwayInviteLocations(
  id: string,
): Promise<Pin[] | null> {
  if ((await ensureStore()) === "missing") return null;
  const now = Date.now();

  if (feedbackStorageKind() === "memory") {
    const row = memoryInvites.get(id);
    if (!row) return null;
    if (row.expiresAt <= now) {
      memoryInvites.delete(id);
      return null;
    }
    return row.locations;
  }

  const sql = getSql();
  if (!sql) return null;
  const rows = (await sql`
    SELECT locations, expires_at
    FROM halfway_invites
    WHERE id = ${id}
    LIMIT 1
  `) as { locations: unknown; expires_at: string }[];
  const row = rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= now) return null;
  return parsePins(row.locations);
}

export async function writeHalfwayInviteLocations(input: {
  id: string;
  locations: Pin[];
  expiresAt: number;
}): Promise<Pin[] | null> {
  if ((await ensureStore()) === "missing") return null;
  const locations = input.locations.slice(0, HALFWAY_INVITE_MAX_PINS);
  if (locations.length < 1) return null;

  if (feedbackStorageKind() === "memory") {
    const existing = memoryInvites.get(input.id);
    const merged = mergePins(existing?.locations ?? [], locations);
    memoryInvites.set(input.id, {
      locations: merged,
      expiresAt: input.expiresAt,
    });
    return merged;
  }

  const sql = getSql();
  if (!sql) return null;
  const expiresAt = new Date(input.expiresAt).toISOString();
  const current = await readHalfwayInviteLocations(input.id);
  const merged = mergePins(current ?? [], locations);
  const payload = JSON.stringify(merged);
  await sql`
    INSERT INTO halfway_invites (id, locations, expires_at)
    VALUES (${input.id}, ${payload}::jsonb, ${expiresAt})
    ON CONFLICT (id) DO UPDATE SET
      locations = EXCLUDED.locations,
      expires_at = EXCLUDED.expires_at
  `;
  return merged;
}
