import { createHash, randomBytes } from "node:crypto";
import {
  ensureClaimsSchema,
  getClaimsSql,
  loadShopClaim,
} from "./claims";
import type { OwnerTokenError, PassportOwnerFields } from "./claims-types";
import { feedbackStorageKind } from "./feedback";
import { ownerEditPath } from "./product";
import type { Language } from "./types";

export const OWNER_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type MemoryToken = {
  shopId: string;
  tokenHash: string;
  expiresAt: number;
  revokedAt: number | null;
  createdAt: number;
};

/** Local next dev can load this module in more than one isolate. */
const memoryTokens = (() => {
  const globalStore = globalThis as typeof globalThis & {
    __wainOwnerTokensMemory?: Map<string, MemoryToken>;
  };
  if (!globalStore.__wainOwnerTokensMemory) {
    globalStore.__wainOwnerTokensMemory = new Map<string, MemoryToken>();
  }
  return globalStore.__wainOwnerTokensMemory;
})();

export function hashOwnerToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newOwnerToken(): string {
  return randomBytes(32).toString("base64url");
}

export function ownerTokenTtlMs(): number {
  return OWNER_TOKEN_TTL_MS;
}

export type ValidOwnerSession = {
  shopId: string;
  passport: PassportOwnerFields;
  expiresAt: string;
};

export async function mintOwnerToken(
  rawId: unknown,
  ttlMs = OWNER_TOKEN_TTL_MS,
): Promise<
  | {
      ok: true;
      shopId: string;
      token: string;
      expiresAt: string;
      pathAr: string;
      pathEn: string;
    }
  | { ok: false; error: OwnerTokenError }
> {
  const storage = await ensureClaimsSchema();
  if (storage === "missing") return { ok: false, error: "no_storage" };

  const claim = await loadShopClaim(rawId);
  if (!claim) return { ok: false, error: "not_verified" };
  if (claim.status !== "verified") return { ok: false, error: "not_verified" };

  const token = newOwnerToken();
  const tokenHash = hashOwnerToken(token);
  const expiresAt = new Date(Date.now() + ttlMs);

  if (feedbackStorageKind() === "memory") {
    memoryTokens.set(tokenHash, {
      shopId: claim.shopId,
      tokenHash,
      expiresAt: expiresAt.getTime(),
      revokedAt: null,
      createdAt: Date.now(),
    });
  } else {
    const sql = getClaimsSql();
    if (!sql) return { ok: false, error: "no_storage" };
    await sql`
      INSERT INTO shop_owner_tokens (token_hash, shop_id, expires_at)
      VALUES (${tokenHash}, ${claim.shopId}, ${expiresAt.toISOString()})
    `;
  }

  return {
    ok: true,
    shopId: claim.shopId,
    token,
    expiresAt: expiresAt.toISOString(),
    pathAr: ownerEditPath(claim.shopId, token, "ar"),
    pathEn: ownerEditPath(claim.shopId, token, "en"),
  };
}

export async function validateOwnerToken(input: {
  shopId: unknown;
  token: unknown;
}): Promise<
  | ({ ok: true } & ValidOwnerSession)
  | { ok: false; error: OwnerTokenError }
> {
  const shopId = typeof input.shopId === "string" ? input.shopId.trim() : "";
  const token = typeof input.token === "string" ? input.token.trim() : "";
  if (!shopId || !token) return { ok: false, error: "missing" };

  const storage = await ensureClaimsSchema();
  if (storage === "missing") return { ok: false, error: "no_storage" };

  const tokenHash = hashOwnerToken(token);
  const row = await loadOwnerToken(tokenHash);
  if (!row) return { ok: false, error: "invalid" };
  if (row.revokedAt) return { ok: false, error: "revoked" };
  if (row.expiresAt <= Date.now()) return { ok: false, error: "expired" };
  if (row.shopId !== shopId) return { ok: false, error: "wrong_shop" };

  const claim = await loadShopClaim(shopId);
  if (!claim) return { ok: false, error: "not_verified" };
  if (claim.status !== "verified") return { ok: false, error: "not_verified" };

  return {
    ok: true,
    shopId: claim.shopId,
    passport: claim.passport,
    expiresAt: new Date(row.expiresAt).toISOString(),
  };
}

export async function revokeOwnerTokens(rawId: unknown): Promise<
  | { ok: true; shopId: string; revoked: number }
  | { ok: false; error: OwnerTokenError }
> {
  const claim = await loadShopClaim(rawId);
  if (!claim) return { ok: false, error: "not_found" };

  const storage = await ensureClaimsSchema();
  if (storage === "missing") return { ok: false, error: "no_storage" };

  const now = Date.now();
  if (feedbackStorageKind() === "memory") {
    let revoked = 0;
    for (const row of memoryTokens.values()) {
      if (row.shopId !== claim.shopId || row.revokedAt) continue;
      row.revokedAt = now;
      revoked += 1;
    }
    return { ok: true, shopId: claim.shopId, revoked };
  }

  const sql = getClaimsSql();
  if (!sql) return { ok: false, error: "no_storage" };
  const rows = (await sql`
    UPDATE shop_owner_tokens
    SET revoked_at = ${new Date(now).toISOString()}
    WHERE shop_id = ${claim.shopId} AND revoked_at IS NULL
    RETURNING token_hash
  `) as { token_hash: string }[];
  return { ok: true, shopId: claim.shopId, revoked: rows.length };
}

async function loadOwnerToken(tokenHash: string): Promise<MemoryToken | null> {
  if (feedbackStorageKind() === "memory") {
    return memoryTokens.get(tokenHash) ?? null;
  }
  const sql = getClaimsSql();
  if (!sql) return null;
  const rows = (await sql`
    SELECT token_hash, shop_id, expires_at, revoked_at, created_at
    FROM shop_owner_tokens
    WHERE token_hash = ${tokenHash}
  `) as {
    token_hash: string;
    shop_id: string;
    expires_at: string;
    revoked_at: string | null;
    created_at: string;
  }[];
  const row = rows[0];
  if (!row) return null;
  return {
    shopId: row.shop_id,
    tokenHash: row.token_hash,
    expiresAt: new Date(row.expires_at).getTime(),
    revokedAt: row.revoked_at ? new Date(row.revoked_at).getTime() : null,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export function ownerEditHref(
  origin: string,
  shopId: string,
  token: string,
  language: Language,
): string {
  return `${origin.replace(/\/$/, "")}${ownerEditPath(shopId, token, language)}`;
}
