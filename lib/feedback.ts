import { createHash, randomBytes } from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { cookies } from "next/headers";
import { ENV_KEYS, readEnv } from "./env";
import {
  sanitizeIdeaBody,
  type FeedbackError,
  type FeedbackIdea,
  type FeedbackSnapshot,
} from "./feedback-types";

export { IDEA_MAX_CHARS, sanitizeIdeaBody } from "./feedback-types";
export type { FeedbackError, FeedbackIdea, FeedbackSnapshot } from "./feedback-types";

export const VOTER_COOKIE = "wain_vid";

type MemoryRow = {
  id: number;
  body: string;
  votes: number;
  createdAt: Date;
};

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS ideas (
    id SERIAL PRIMARY KEY,
    body TEXT NOT NULL,
    votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS vote_receipts (
    idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    voter_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (idea_id, voter_hash)
  )`,
  `CREATE INDEX IF NOT EXISTS ideas_rank_idx ON ideas (votes DESC, created_at ASC, id ASC)`,
] as const;

const ADD_WINDOW_MS = 10 * 60 * 1000;
const ADD_LIMIT = 8;
const VOTE_WINDOW_MS = 10 * 60 * 1000;
const VOTE_LIMIT = 40;
const rateBuckets = new Map<string, number[]>();

const memoryIdeas: MemoryRow[] = [];
const memoryReceipts = new Set<string>();
let memoryNextId = 1;

let sqlClient: NeonQueryFunction<false, false> | null = null;
let schemaReady = false;

function databaseUrl(): string | undefined {
  return readEnv(ENV_KEYS.DATABASE_URL);
}

/** Neon on Vercel. Local `next dev` may use memory if DATABASE_URL is unset. */
export function feedbackStorageKind(): "neon" | "memory" | "missing" {
  if (databaseUrl()) return "neon";
  if (process.env.VERCEL) return "missing";
  return "memory";
}

function getSql(): NeonQueryFunction<false, false> | null {
  const url = databaseUrl();
  if (!url) return null;
  if (!sqlClient) sqlClient = neon(url);
  return sqlClient;
}

async function ensureSchema(): Promise<"ready" | "missing"> {
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

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function allowRate(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const kept = (rateBuckets.get(key) ?? []).filter((at) => now - at < windowMs);
  if (kept.length >= limit) {
    rateBuckets.set(key, kept);
    return false;
  }
  kept.push(now);
  rateBuckets.set(key, kept);
  return true;
}

export function allowAdd(ip: string): boolean {
  return allowRate(`add:${ip}`, ADD_LIMIT, ADD_WINDOW_MS);
}

export function allowVote(ip: string): boolean {
  return allowRate(`vote:${ip}`, VOTE_LIMIT, VOTE_WINDOW_MS);
}

function hashVoter(voterId: string): string {
  return createHash("sha256").update(voterId).digest("hex");
}

function isVoterId(value: string | undefined): value is string {
  return Boolean(value && /^[a-f0-9]{32}$/.test(value));
}

export async function readVoterId(): Promise<string | undefined> {
  const store = await cookies();
  const value = store.get(VOTER_COOKIE)?.value;
  return isVoterId(value) ? value : undefined;
}

export async function ensureVoterId(): Promise<string> {
  const existing = await readVoterId();
  if (existing) return existing;
  const id = randomBytes(16).toString("hex");
  const store = await cookies();
  store.set(VOTER_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });
  return id;
}

function toIdea(row: {
  id: number;
  body: string;
  votes: number;
  created_at: Date | string;
}): FeedbackIdea {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString();
  return {
    id: Number(row.id),
    body: row.body,
    votes: Number(row.votes),
    createdAt,
  };
}

function rankMemory(): FeedbackIdea[] {
  return [...memoryIdeas]
    .sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      const time = a.createdAt.getTime() - b.createdAt.getTime();
      if (time !== 0) return time;
      return a.id - b.id;
    })
    .map((row) => toIdea({ ...row, created_at: row.createdAt }));
}

async function listFromNeon(
  voterHash: string | undefined,
): Promise<{ ideas: FeedbackIdea[]; votedIds: number[] }> {
  const sql = getSql();
  if (!sql) return { ideas: [], votedIds: [] };
  const rows = (await sql`
    SELECT id, body, votes, created_at
    FROM ideas
    ORDER BY votes DESC, created_at ASC, id ASC
  `) as { id: number; body: string; votes: number; created_at: string }[];
  const ideas = rows.map(toIdea);
  if (!voterHash) return { ideas, votedIds: [] };
  const votes = (await sql`
    SELECT idea_id FROM vote_receipts WHERE voter_hash = ${voterHash}
  `) as { idea_id: number }[];
  return { ideas, votedIds: votes.map((row) => Number(row.idea_id)) };
}

function listFromMemory(voterHash: string | undefined): {
  ideas: FeedbackIdea[];
  votedIds: number[];
} {
  const ideas = rankMemory();
  if (!voterHash) return { ideas, votedIds: [] };
  const votedIds = ideas
    .filter((idea) => memoryReceipts.has(`${idea.id}:${voterHash}`))
    .map((idea) => idea.id);
  return { ideas, votedIds };
}

export async function loadFeedbackSnapshot(): Promise<FeedbackSnapshot> {
  const storage = await ensureSchema();
  if (storage === "missing") {
    return { ideas: [], votedIds: [], storage: "missing" };
  }
  const voterId = await readVoterId();
  const hash = voterId ? hashVoter(voterId) : undefined;
  const listed =
    feedbackStorageKind() === "memory"
      ? listFromMemory(hash)
      : await listFromNeon(hash);
  return { ...listed, storage: "ready" };
}

export async function addIdea(
  rawBody: unknown,
): Promise<
  | { ok: true; snapshot: FeedbackSnapshot }
  | { ok: false; error: FeedbackError; snapshot?: FeedbackSnapshot }
> {
  const cleaned = sanitizeIdeaBody(rawBody);
  if (!cleaned.ok) return { ok: false, error: cleaned.error };

  const storage = await ensureSchema();
  if (storage === "missing") return { ok: false, error: "no_storage" };

  const voterId = await ensureVoterId();
  const hash = hashVoter(voterId);

  if (feedbackStorageKind() === "memory") {
    memoryIdeas.push({
      id: memoryNextId,
      body: cleaned.body,
      votes: 0,
      createdAt: new Date(),
    });
    memoryNextId += 1;
    return { ok: true, snapshot: { ...listFromMemory(hash), storage: "ready" } };
  }

  const sql = getSql();
  if (!sql) return { ok: false, error: "no_storage" };
  await sql`INSERT INTO ideas (body) VALUES (${cleaned.body})`;
  return { ok: true, snapshot: { ...(await listFromNeon(hash)), storage: "ready" } };
}

export async function voteIdea(
  rawId: unknown,
): Promise<
  | { ok: true; snapshot: FeedbackSnapshot; already: boolean }
  | { ok: false; error: FeedbackError; snapshot?: FeedbackSnapshot }
> {
  const id = typeof rawId === "number" ? rawId : Number(rawId);
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "not_found" };

  const storage = await ensureSchema();
  if (storage === "missing") return { ok: false, error: "no_storage" };

  const voterId = await ensureVoterId();
  const hash = hashVoter(voterId);

  if (feedbackStorageKind() === "memory") {
    const row = memoryIdeas.find((idea) => idea.id === id);
    if (!row) return { ok: false, error: "not_found" };
    const key = `${id}:${hash}`;
    if (memoryReceipts.has(key)) {
      return { ok: true, already: true, snapshot: { ...listFromMemory(hash), storage: "ready" } };
    }
    memoryReceipts.add(key);
    row.votes += 1;
    return { ok: true, already: false, snapshot: { ...listFromMemory(hash), storage: "ready" } };
  }

  const sql = getSql();
  if (!sql) return { ok: false, error: "no_storage" };

  const updated = (await sql`
    WITH ins AS (
      INSERT INTO vote_receipts (idea_id, voter_hash)
      SELECT ${id}, ${hash}
      WHERE EXISTS (SELECT 1 FROM ideas WHERE id = ${id})
      ON CONFLICT DO NOTHING
      RETURNING idea_id
    )
    UPDATE ideas
    SET votes = votes + 1
    WHERE id IN (SELECT idea_id FROM ins)
    RETURNING id
  `) as { id: number }[];

  if (updated.length > 0) {
    return { ok: true, already: false, snapshot: { ...(await listFromNeon(hash)), storage: "ready" } };
  }

  const existing = (await sql`SELECT id FROM ideas WHERE id = ${id}`) as { id: number }[];
  if (existing.length === 0) return { ok: false, error: "not_found" };
  return {
    ok: true,
    already: true,
    snapshot: { ...(await listFromNeon(hash)), storage: "ready" },
  };
}
