import { createHash } from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { getShop } from "./catalog";
import { ENV_KEYS, readEnv } from "./env";
import { allowRate, feedbackStorageKind } from "./feedback";
import {
  HALFWAY_INVITE_EXPIRED_ID,
  HALFWAY_INVITE_MAX_PINS,
  HALFWAY_INVITE_TTL_MS,
  HALFWAY_RESULTS_TTL_MS,
  halfwayInviteHasGuest,
  isRandomHalfwayInviteId,
  mintHalfwayInviteId,
  parseHalfwayInviteToken,
  sameHalfwayPin,
  type HalfwayInviteSeed,
} from "./halfway-invite";
import type { Language, Pin } from "./types";

/**
 * Server-side بيننا session, keyed by the opaque random invite id.
 * Holds the host pin (`host`), locale and expiry that used to ride in
 * the URL, plus the guest pin and frozen shop_ids after results.
 * Neon when DATABASE_URL is set; memory for local `next dev`.
 */
export type HalfwayInviteSession = {
  locations: Pin[];
  expiresAt: number;
  shopIds: string[];
  /** Locale the host minted the invite in. */
  locale?: Language;
  /** Host pin(s) — the seed that used to be encoded in the URL. */
  host?: Pin[];
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
  `ALTER TABLE halfway_invites ADD COLUMN IF NOT EXISTS locale TEXT`,
  `ALTER TABLE halfway_invites ADD COLUMN IF NOT EXISTS host_locations JSONB`,
  `ALTER TABLE halfway_invites ADD COLUMN IF NOT EXISTS legacy_key TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS halfway_invites_legacy_key_idx ON halfway_invites (legacy_key)`,
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

/** sha256(legacy token) → random id, for memory mode. */
const memoryLegacy = (() => {
  const globalStore = globalThis as typeof globalThis & {
    __wainHalfwayLegacy?: Map<string, string>;
  };
  if (!globalStore.__wainHalfwayLegacy) {
    globalStore.__wainHalfwayLegacy = new Map<string, string>();
  }
  return globalStore.__wainHalfwayLegacy;
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

  return {
    locations,
    expiresAt,
    shopIds,
    ...(input.existing?.locale ? { locale: input.existing.locale } : {}),
    ...(input.existing?.host?.length ? { host: input.existing.host } : {}),
  };
}

function parseLocale(value: unknown): Language | undefined {
  return value === "en" || value === "ar" ? value : undefined;
}

/** Row even when expired, so `/h/{id}` can say "expired" vs unknown. */
async function readStoredRecord(
  id: string,
): Promise<HalfwayInviteSession | null> {
  if ((await ensureStore()) === "missing") return null;

  if (feedbackStorageKind() === "memory") {
    return memoryInvites.get(id) ?? null;
  }

  const sql = getSql();
  if (!sql) return null;
  const rows = (await sql`
    SELECT locations, shop_ids, expires_at, locale, host_locations
    FROM halfway_invites
    WHERE id = ${id}
    LIMIT 1
  `) as {
    locations: unknown;
    shop_ids: unknown;
    expires_at: string;
    locale: unknown;
    host_locations: unknown;
  }[];
  const row = rows[0];
  if (!row) return null;
  const locale = parseLocale(row.locale);
  const host = parsePins(row.host_locations);
  return {
    locations: parsePins(row.locations),
    expiresAt: new Date(row.expires_at).getTime(),
    shopIds: cleanHalfwayShopIds(row.shop_ids),
    ...(locale ? { locale } : {}),
    ...(host.length ? { host } : {}),
  };
}

async function readStoredSession(
  id: string,
  now: number,
): Promise<HalfwayInviteSession | null> {
  const row = await readStoredRecord(id);
  if (!row) return null;
  if (row.expiresAt <= now) {
    if (feedbackStorageKind() === "memory") memoryInvites.delete(id);
    return null;
  }
  return row;
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
  const locale = session.locale ?? null;
  const host = session.host?.length ? JSON.stringify(session.host) : null;
  await sql`
    INSERT INTO halfway_invites (id, locations, shop_ids, expires_at, locale, host_locations)
    VALUES (${id}, ${locations}::jsonb, ${shopIds}::jsonb, ${expiresAt}, ${locale}, ${host}::jsonb)
    ON CONFLICT (id) DO UPDATE SET
      locations = EXCLUDED.locations,
      shop_ids = EXCLUDED.shop_ids,
      expires_at = EXCLUDED.expires_at,
      locale = COALESCE(EXCLUDED.locale, halfway_invites.locale),
      host_locations = COALESCE(EXCLUDED.host_locations, halfway_invites.host_locations)
  `;
}

/**
 * New بيننا invite: random opaque id, host pin stored server-side.
 * Same 45-minute waiting TTL the old token carried.
 */
export async function createHalfwayInviteSession(input: {
  locale: Language;
  host: Pin;
  now?: number;
}): Promise<{ id: string; session: HalfwayInviteSession } | null> {
  if ((await ensureStore()) === "missing") return null;
  const now = input.now ?? Date.now();
  const id = mintHalfwayInviteId();
  const session: HalfwayInviteSession = {
    locations: [input.host],
    expiresAt: now + HALFWAY_INVITE_TTL_MS,
    shopIds: [],
    locale: input.locale,
    host: [input.host],
  };
  await writeStoredSession(id, session);
  return { id, session };
}

function legacyKey(token: string): string {
  return createHash("sha256").update(`halfway-legacy:${token}`).digest("hex");
}

async function findMigratedId(token: string): Promise<string | null> {
  if ((await ensureStore()) === "missing") return null;
  const key = legacyKey(token);
  if (feedbackStorageKind() === "memory") return memoryLegacy.get(key) ?? null;
  const sql = getSql();
  if (!sql) return null;
  const rows = (await sql`
    SELECT id FROM halfway_invites WHERE legacy_key = ${key} LIMIT 1
  `) as { id: string }[];
  return rows[0]?.id ?? null;
}

export type LegacyHalfwayMigration =
  | { ok: true; id: string }
  | { ok: false; reason: "bad" | "expired" | "missing" | "rate_limited" };

const LEGACY_MIGRATE_LIMIT = 30;
const LEGACY_MIGRATE_WINDOW_MS = 10 * 60 * 1000;

/**
 * Old `/h/{base64-coords}` → random-id session. Idempotent per token
 * (sha256 key, unique index), so host and guest land on the same id.
 * Carries the old overlay (guest pin, frozen shop_ids, expiry). Expired
 * links mint nothing. New rows are rate-limited per IP.
 */
export async function migrateLegacyHalfwayInvite(
  token: string,
  options?: { now?: number; ip?: string },
): Promise<LegacyHalfwayMigration> {
  const parsed = parseHalfwayInviteToken(token);
  if (!parsed.ok) return { ok: false, reason: "bad" };
  if ((await ensureStore()) === "missing") return { ok: false, reason: "missing" };
  const now = options?.now ?? Date.now();

  const existing = await findMigratedId(token);
  if (existing) return { ok: true, id: existing };

  let overlay: HalfwayInviteSession | null = null;
  try {
    overlay = await readStoredRecord(token);
  } catch {
    overlay = null;
  }
  const rawExpiry = overlay?.expiresAt ?? parsed.seed.exp;
  if (rawExpiry <= now) return { ok: false, reason: "expired" };
  if (
    options?.ip &&
    !allowRate(`halfway-legacy:${options.ip}`, LEGACY_MIGRATE_LIMIT, LEGACY_MIGRATE_WINDOW_MS)
  ) {
    return { ok: false, reason: "rate_limited" };
  }

  const session: HalfwayInviteSession = {
    locations: overlay?.locations.length ? overlay.locations : parsed.seed.locations,
    // A crafted token can claim any expiry; never outlive a results session.
    expiresAt: Math.min(rawExpiry, now + HALFWAY_RESULTS_TTL_MS),
    shopIds: overlay?.shopIds ?? [],
    locale: parsed.seed.locale,
    host: parsed.seed.locations,
  };
  const key = legacyKey(token);
  const id = mintHalfwayInviteId();

  if (feedbackStorageKind() === "memory") {
    const raced = memoryLegacy.get(key);
    if (raced) return { ok: true, id: raced };
    memoryInvites.set(id, session);
    memoryLegacy.set(key, id);
    return { ok: true, id };
  }

  const sql = getSql();
  if (!sql) return { ok: false, reason: "missing" };
  await sql`
    INSERT INTO halfway_invites (id, locations, shop_ids, expires_at, locale, host_locations, legacy_key)
    VALUES (
      ${id},
      ${JSON.stringify(session.locations)}::jsonb,
      ${JSON.stringify(session.shopIds)}::jsonb,
      ${new Date(session.expiresAt).toISOString()},
      ${session.locale ?? null},
      ${JSON.stringify(session.host ?? [])}::jsonb,
      ${key}
    )
    ON CONFLICT (legacy_key) DO NOTHING
  `;
  const winner = await findMigratedId(token);
  return winner ? { ok: true, id: winner } : { ok: false, reason: "missing" };
}

/**
 * Store key for any invite id the client still holds: random ids as-is,
 * legacy tokens via their migrated random id (minted on first use).
 */
export async function canonicalHalfwayInviteId(
  id: string,
  options?: { now?: number; ip?: string },
): Promise<
  | { ok: true; id: string }
  | { ok: false; reason: "bad" | "expired" | "missing" | "rate_limited" }
> {
  const trimmed = id.trim();
  if (isRandomHalfwayInviteId(trimmed)) return { ok: true, id: trimmed };
  if (trimmed === HALFWAY_INVITE_EXPIRED_ID) return { ok: false, reason: "expired" };
  return migrateLegacyHalfwayInvite(trimmed, options);
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
  const trimmed = id.trim();
  if (trimmed === HALFWAY_INVITE_EXPIRED_ID) return { ok: false, reason: "expired" };

  if (isRandomHalfwayInviteId(trimmed)) {
    let row: HalfwayInviteSession | null = null;
    try {
      row = await readStoredRecord(trimmed);
    } catch {
      row = null;
    }
    if (!row) return { ok: false, reason: "bad" };
    if (row.expiresAt <= now) return { ok: false, reason: "expired" };
    const host = row.host?.length ? row.host : row.locations.slice(0, 1);
    return {
      ok: true,
      seed: { locale: row.locale ?? "ar", locations: host, exp: row.expiresAt },
      session: {
        locations: row.locations,
        expiresAt: row.expiresAt,
        shopIds: row.shopIds,
      },
      joined: halfwayInviteHasGuest(host, row.locations),
    };
  }

  const parsed = parseHalfwayInviteToken(trimmed);
  if (!parsed.ok) return parsed;

  // Legacy token already migrated: read the random-id session.
  try {
    const migrated = await findMigratedId(trimmed);
    if (migrated) return resolveHalfwayInviteSession(migrated, now);
  } catch {
    // Fall through to the stateless legacy read.
  }

  let stored: HalfwayInviteSession | null = null;
  try {
    stored = await readStoredSession(trimmed, now);
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
