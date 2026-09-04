import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { getShop } from "./catalog";
import { ENV_KEYS, readEnv } from "./env";
import {
  ensureVoterId,
  feedbackStorageKind,
  hashVoter,
  readVoterId,
} from "./feedback";
import {
  emptyShopUpvoteSnapshot,
  parseShopIdShape,
  type ShopUpvoteError,
  type ShopUpvoteSnapshot,
} from "./upvotes-types";

export {
  emptyShopUpvoteSnapshot,
  parseShopIdShape,
  SHOP_ID_PATTERN,
} from "./upvotes-types";
export type { ShopUpvoteError, ShopUpvoteSnapshot } from "./upvotes-types";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS shop_upvotes (
    shop_id TEXT PRIMARY KEY,
    votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0)
  )`,
  `CREATE TABLE IF NOT EXISTS shop_vote_receipts (
    shop_id TEXT NOT NULL REFERENCES shop_upvotes(shop_id) ON DELETE CASCADE,
    voter_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (shop_id, voter_hash)
  )`,
] as const;

const memoryCounts = new Map<string, number>();
const memoryReceipts = new Set<string>();

let sqlClient: NeonQueryFunction<false, false> | null = null;
let schemaReady = false;

function databaseUrl(): string | undefined {
  return readEnv(ENV_KEYS.DATABASE_URL);
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

export function resolveCatalogShopId(raw: unknown): string | undefined {
  const id = parseShopIdShape(raw);
  if (!id || !getShop(id)) return undefined;
  return id;
}

function receiptKey(shopId: string, voterHash: string): string {
  return `${shopId}:${voterHash}`;
}

function snapshotFromMemory(voterHash: string | undefined): ShopUpvoteSnapshot {
  const counts: Record<string, number> = {};
  for (const [shopId, votes] of memoryCounts) {
    counts[shopId] = votes;
  }
  const votedIds = voterHash
    ? [...memoryCounts.keys()].filter((shopId) =>
        memoryReceipts.has(receiptKey(shopId, voterHash)),
      )
    : [];
  return { counts, votedIds, storage: "ready" };
}

async function snapshotFromNeon(
  voterHash: string | undefined,
): Promise<ShopUpvoteSnapshot> {
  const sql = getSql();
  if (!sql) return emptyShopUpvoteSnapshot("missing");
  const rows = (await sql`
    SELECT shop_id, votes FROM shop_upvotes
  `) as { shop_id: string; votes: number }[];
  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.shop_id] = Number(row.votes);
  }
  if (!voterHash) return { counts, votedIds: [], storage: "ready" };
  const votes = (await sql`
    SELECT shop_id FROM shop_vote_receipts WHERE voter_hash = ${voterHash}
  `) as { shop_id: string }[];
  return {
    counts,
    votedIds: votes.map((row) => row.shop_id),
    storage: "ready",
  };
}

export async function loadShopUpvoteSnapshot(): Promise<ShopUpvoteSnapshot> {
  const storage = await ensureSchema();
  if (storage === "missing") return emptyShopUpvoteSnapshot("missing");
  const voterId = await readVoterId();
  const hash = voterId ? hashVoter(voterId) : undefined;
  return feedbackStorageKind() === "memory"
    ? snapshotFromMemory(hash)
    : snapshotFromNeon(hash);
}

export async function voteShop(
  rawId: unknown,
): Promise<
  | { ok: true; already: boolean; shopId: string; votes: number; snapshot: ShopUpvoteSnapshot }
  | { ok: false; error: ShopUpvoteError; snapshot?: ShopUpvoteSnapshot }
> {
  const shopId = resolveCatalogShopId(rawId);
  if (!shopId) return { ok: false, error: "not_found" };

  const storage = await ensureSchema();
  if (storage === "missing") return { ok: false, error: "no_storage" };

  const voterId = await ensureVoterId();
  const hash = hashVoter(voterId);

  if (feedbackStorageKind() === "memory") {
    const key = receiptKey(shopId, hash);
    const current = memoryCounts.get(shopId) ?? 0;
    if (memoryReceipts.has(key)) {
      return {
        ok: true,
        already: true,
        shopId,
        votes: current,
        snapshot: snapshotFromMemory(hash),
      };
    }
    memoryReceipts.add(key);
    const votes = current + 1;
    memoryCounts.set(shopId, votes);
    return {
      ok: true,
      already: false,
      shopId,
      votes,
      snapshot: snapshotFromMemory(hash),
    };
  }

  const sql = getSql();
  if (!sql) return { ok: false, error: "no_storage" };

  await sql`
    INSERT INTO shop_upvotes (shop_id, votes)
    VALUES (${shopId}, 0)
    ON CONFLICT (shop_id) DO NOTHING
  `;

  const updated = (await sql`
    WITH ins AS (
      INSERT INTO shop_vote_receipts (shop_id, voter_hash)
      VALUES (${shopId}, ${hash})
      ON CONFLICT DO NOTHING
      RETURNING shop_id
    )
    UPDATE shop_upvotes
    SET votes = votes + 1
    WHERE shop_id IN (SELECT shop_id FROM ins)
    RETURNING shop_id, votes
  `) as { shop_id: string; votes: number }[];

  const snapshot = await snapshotFromNeon(hash);
  if (updated.length > 0) {
    return {
      ok: true,
      already: false,
      shopId,
      votes: Number(updated[0]!.votes),
      snapshot,
    };
  }

  return {
    ok: true,
    already: true,
    shopId,
    votes: snapshot.counts[shopId] ?? 0,
    snapshot,
  };
}
