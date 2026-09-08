import { createHash, randomInt } from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { alertClaimSubmitted } from "./claim-alert";
import { parseOwnerPhone, whatsAppTo } from "./claim-phone";
import { getShop, listDirectoryShops } from "./catalog";
import {
  emptyPassport,
  parseClaimReviewAction,
  parseProofType,
  STUB_OTP_CODE,
  type ClaimReviewAction,
  type PassportOwnerFields,
  type PendingClaim,
  type PublicClaimStatus,
  type ShopClaim,
} from "./claims-types";
import { ENV_KEYS, readEnv } from "./env";
import { feedbackStorageKind } from "./feedback";
import { isWhatsAppConfigured, sendWhatsAppText } from "./whatsapp";

export {
  emptyPassport,
  parseClaimReviewAction,
  parseProofType,
  STUB_OTP_CODE,
} from "./claims-types";
export type {
  ClaimError,
  ClaimReviewAction,
  ClaimStatus,
  PassportOwnerFields,
  PendingClaim,
  ProofType,
  PublicClaimStatus,
  ShopClaim,
} from "./claims-types";

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS shop_claims (
    shop_id TEXT PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('pending', 'verified')),
    owner_phone_e164 TEXT NOT NULL,
    proof_type TEXT NOT NULL CHECK (proof_type = 'cr'),
    proof_asset_url TEXT,
    passport JSONB NOT NULL DEFAULT '{}'::jsonb,
    otp_stub BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS shop_claim_otp (
    shop_id TEXT NOT NULL,
    phone_e164 TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    stub BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (shop_id, phone_e164)
  )`,
] as const;

const OTP_TTL_MS = 10 * 60 * 1000;

type MemoryClaim = ShopClaim;
type MemoryOtp = {
  codeHash: string;
  expiresAt: number;
  stub: boolean;
};

type ClaimsMemory = {
  claims: Map<string, MemoryClaim>;
  otps: Map<string, MemoryOtp>;
};

const claimsMemory: ClaimsMemory = (() => {
  const globalStore = globalThis as typeof globalThis & {
    __wainClaimsMemory?: ClaimsMemory;
  };
  if (!globalStore.__wainClaimsMemory) {
    globalStore.__wainClaimsMemory = {
      claims: new Map<string, MemoryClaim>(),
      otps: new Map<string, MemoryOtp>(),
    };
  }
  return globalStore.__wainClaimsMemory;
})();

const memoryClaims = claimsMemory.claims;
const memoryOtps = claimsMemory.otps;

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

function hashOtp(shopId: string, phone: string, code: string): string {
  return createHash("sha256")
    .update(`${shopId}:${phone}:${code}`)
    .digest("hex");
}

function otpKey(shopId: string, phone: string): string {
  return `${shopId}:${phone}`;
}

export function resolveCatalogShopId(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const id = raw.trim();
  if (!id || !getShop(id)) return undefined;
  return id;
}

export async function publicClaimStatus(
  rawId: unknown,
): Promise<
  | ({ ok: true } & PublicClaimStatus)
  | { ok: false; error: "not_found" }
> {
  const shopId = resolveCatalogShopId(rawId);
  if (!shopId) return { ok: false, error: "not_found" };

  const storage = await ensureSchema();
  if (storage === "missing") {
    return { ok: true, shopId, status: "none", storage: "missing" };
  }

  if (feedbackStorageKind() === "memory") {
    const row = memoryClaims.get(shopId);
    return { ok: true, shopId, status: row?.status ?? "none", storage: "ready" };
  }

  const sql = getSql();
  if (!sql) return { ok: true, shopId, status: "none", storage: "missing" };
  const rows = (await sql`
    SELECT status FROM shop_claims WHERE shop_id = ${shopId}
  `) as { status: "pending" | "verified" }[];
  return {
    ok: true,
    shopId,
    status: rows[0]?.status ?? "none",
    storage: "ready",
  };
}

function sixDigitCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function requestClaimOtp(input: {
  shopId: unknown;
  phone: unknown;
}): Promise<
  | {
      ok: true;
      shopId: string;
      phone: string;
      configured: boolean;
      stub: boolean;
      stubCode?: string;
    }
  | { ok: false; error: "not_found" | "bad_phone" | "no_storage" | "already_claimed" }
> {
  const shopId = resolveCatalogShopId(input.shopId);
  if (!shopId) return { ok: false, error: "not_found" };
  const phone = parseOwnerPhone(input.phone);
  if (!phone) return { ok: false, error: "bad_phone" };

  const storage = await ensureSchema();
  if (storage === "missing") return { ok: false, error: "no_storage" };

  const existing = await publicClaimStatus(shopId);
  if (!existing.ok) return { ok: false, error: "not_found" };
  if (existing.status === "pending" || existing.status === "verified") {
    return { ok: false, error: "already_claimed" };
  }

  const configured = isWhatsAppConfigured();
  const stub = !configured;
  const code = stub ? STUB_OTP_CODE : sixDigitCode();
  const codeHash = hashOtp(shopId, phone, code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  if (feedbackStorageKind() === "memory") {
    memoryOtps.set(otpKey(shopId, phone), {
      codeHash,
      expiresAt: expiresAt.getTime(),
      stub,
    });
  } else {
    const sql = getSql();
    if (!sql) return { ok: false, error: "no_storage" };
    await sql`
      INSERT INTO shop_claim_otp (shop_id, phone_e164, code_hash, expires_at, stub)
      VALUES (${shopId}, ${phone}, ${codeHash}, ${expiresAt.toISOString()}, ${stub})
      ON CONFLICT (shop_id, phone_e164) DO UPDATE SET
        code_hash = EXCLUDED.code_hash,
        expires_at = EXCLUDED.expires_at,
        stub = EXCLUDED.stub,
        created_at = NOW()
    `;
  }

  if (!stub) {
    const body = `رمز wain.lol: ${code}`;
    await sendWhatsAppText(whatsAppTo(phone), body);
  }

  return {
    ok: true,
    shopId,
    phone,
    configured,
    stub,
    ...(stub ? { stubCode: STUB_OTP_CODE } : {}),
  };
}

async function otpMatches(
  shopId: string,
  phone: string,
  code: string,
): Promise<{ ok: true; stub: boolean } | { ok: false }> {
  const codeHash = hashOtp(shopId, phone, code);

  if (feedbackStorageKind() === "memory") {
    const row = memoryOtps.get(otpKey(shopId, phone));
    if (!row || row.expiresAt < Date.now() || row.codeHash !== codeHash) {
      return { ok: false };
    }
    return { ok: true, stub: row.stub };
  }

  const sql = getSql();
  if (!sql) return { ok: false };
  const rows = (await sql`
    SELECT code_hash, expires_at, stub FROM shop_claim_otp
    WHERE shop_id = ${shopId} AND phone_e164 = ${phone}
  `) as { code_hash: string; expires_at: string; stub: boolean }[];
  const row = rows[0];
  if (!row) return { ok: false };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false };
  if (row.code_hash !== codeHash) return { ok: false };
  return { ok: true, stub: Boolean(row.stub) };
}

function proofStubPath(shopId: string, rawName: string): string {
  const name = rawName.trim().replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "cr";
  return `owner-proof/${shopId}/cr/${name}`;
}

export async function submitShopClaim(input: {
  shopId: unknown;
  phone: unknown;
  code: unknown;
  proofType: unknown;
  proofName?: unknown;
}): Promise<
  | { ok: true; shopId: string; status: "pending"; stub: boolean }
  | {
      ok: false;
      error:
        | "not_found"
        | "bad_phone"
        | "bad_otp"
        | "bad_proof"
        | "no_storage"
        | "already_claimed";
    }
> {
  const shopId = resolveCatalogShopId(input.shopId);
  if (!shopId) return { ok: false, error: "not_found" };
  const shop = getShop(shopId);
  if (!shop) return { ok: false, error: "not_found" };
  const phone = parseOwnerPhone(input.phone);
  if (!phone) return { ok: false, error: "bad_phone" };
  const proofType = parseProofType(input.proofType);
  if (!proofType) return { ok: false, error: "bad_proof" };
  const proofName =
    typeof input.proofName === "string" ? input.proofName.trim() : "";
  if (!proofName) return { ok: false, error: "bad_proof" };
  const code = typeof input.code === "string" ? input.code.trim() : "";
  if (!/^\d{6}$/.test(code)) return { ok: false, error: "bad_otp" };

  const storage = await ensureSchema();
  if (storage === "missing") return { ok: false, error: "no_storage" };

  const existing = await publicClaimStatus(shopId);
  if (!existing.ok) return { ok: false, error: "not_found" };
  if (existing.status === "pending" || existing.status === "verified") {
    return { ok: false, error: "already_claimed" };
  }

  const otp = await otpMatches(shopId, phone, code);
  if (!otp.ok) return { ok: false, error: "bad_otp" };

  const passport: PassportOwnerFields = emptyPassport();
  const proofAssetUrl = proofStubPath(shopId, proofName);
  const now = new Date().toISOString();

  if (feedbackStorageKind() === "memory") {
    memoryClaims.set(shopId, {
      shopId,
      status: "pending",
      ownerPhoneE164: phone,
      proofType,
      proofAssetUrl,
      passport,
      otpStub: otp.stub,
      createdAt: now,
      updatedAt: now,
    });
    memoryOtps.delete(otpKey(shopId, phone));
  } else {
    const sql = getSql();
    if (!sql) return { ok: false, error: "no_storage" };
    await sql`
      INSERT INTO shop_claims (
        shop_id, status, owner_phone_e164, proof_type, proof_asset_url, passport, otp_stub
      )
      VALUES (
        ${shopId},
        'pending',
        ${phone},
        ${proofType},
        ${proofAssetUrl},
        ${JSON.stringify(passport)}::jsonb,
        ${otp.stub}
      )
      ON CONFLICT (shop_id) DO NOTHING
    `;
    await sql`
      DELETE FROM shop_claim_otp
      WHERE shop_id = ${shopId} AND phone_e164 = ${phone}
    `;
  }

  try {
    await alertClaimSubmitted({
      shopId,
      shopNameAr: shop.nameAr,
      shopNameEn: shop.nameEn,
      phone,
      proofType,
      proofAssetUrl,
      otpStub: otp.stub,
    });
  } catch (error) {
    console.error("wain_claim_alert_error", error);
  }

  return { ok: true, shopId, status: "pending", stub: otp.stub };
}

export function ownerCatalogOptions(): {
  id: string;
  nameAr: string;
  nameEn: string;
  neighborhoodAr: string;
  neighborhood: string;
}[] {
  return listDirectoryShops().map((shop) => ({
    id: shop.id,
    nameAr: shop.nameAr,
    nameEn: shop.nameEn,
    neighborhoodAr: shop.neighborhoodAr,
    neighborhood: shop.neighborhood,
  }));
}

function pendingFromMemory(): PendingClaim[] {
  return [...memoryClaims.values()]
    .filter((row) => row.status === "pending")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((row) => ({
      shopId: row.shopId,
      ownerPhoneE164: row.ownerPhoneE164,
      proofAssetUrl: row.proofAssetUrl,
      createdAt: row.createdAt,
    }));
}

export async function listPendingClaims(): Promise<
  | { ok: true; claims: PendingClaim[] }
  | { ok: false; error: "no_storage" }
> {
  const storage = await ensureSchema();
  if (storage === "missing") return { ok: false, error: "no_storage" };

  if (feedbackStorageKind() === "memory") {
    return { ok: true, claims: pendingFromMemory() };
  }

  const sql = getSql();
  if (!sql) return { ok: false, error: "no_storage" };
  const rows = (await sql`
    SELECT shop_id, owner_phone_e164, proof_asset_url, created_at
    FROM shop_claims
    WHERE status = 'pending'
    ORDER BY created_at ASC
  `) as {
    shop_id: string;
    owner_phone_e164: string;
    proof_asset_url: string | null;
    created_at: string;
  }[];

  return {
    ok: true,
    claims: rows.map((row) => ({
      shopId: row.shop_id,
      ownerPhoneE164: row.owner_phone_e164,
      proofAssetUrl: row.proof_asset_url,
      createdAt:
        typeof row.created_at === "string"
          ? row.created_at
          : new Date(row.created_at).toISOString(),
    })),
  };
}

async function loadClaimStatus(
  shopId: string,
): Promise<"pending" | "verified" | undefined> {
  if (feedbackStorageKind() === "memory") {
    return memoryClaims.get(shopId)?.status;
  }
  const sql = getSql();
  if (!sql) return undefined;
  const rows = (await sql`
    SELECT status FROM shop_claims WHERE shop_id = ${shopId}
  `) as { status: "pending" | "verified" }[];
  return rows[0]?.status;
}

export async function reviewShopClaim(input: {
  shopId: unknown;
  action: unknown;
}): Promise<
  | { ok: true; shopId: string; status: "verified" | "none"; action: ClaimReviewAction }
  | { ok: false; error: "not_found" | "not_pending" | "no_storage" | "bad_action" }
> {
  const action = parseClaimReviewAction(input.action);
  if (!action) return { ok: false, error: "bad_action" };
  const shopId =
    typeof input.shopId === "string" ? input.shopId.trim() : "";
  if (!shopId) return { ok: false, error: "not_found" };

  const storage = await ensureSchema();
  if (storage === "missing") return { ok: false, error: "no_storage" };

  const current = await loadClaimStatus(shopId);
  if (!current) return { ok: false, error: "not_found" };
  if (current !== "pending") return { ok: false, error: "not_pending" };

  const now = new Date().toISOString();

  if (feedbackStorageKind() === "memory") {
    if (action === "reject") {
      memoryClaims.delete(shopId);
      return { ok: true, shopId, status: "none", action };
    }
    const row = memoryClaims.get(shopId);
    if (!row) return { ok: false, error: "not_found" };
    memoryClaims.set(shopId, { ...row, status: "verified", updatedAt: now });
    return { ok: true, shopId, status: "verified", action };
  }

  const sql = getSql();
  if (!sql) return { ok: false, error: "no_storage" };

  if (action === "reject") {
    await sql`
      DELETE FROM shop_claims
      WHERE shop_id = ${shopId} AND status = 'pending'
    `;
    return { ok: true, shopId, status: "none", action };
  }

  await sql`
    UPDATE shop_claims
    SET status = 'verified', updated_at = ${now}
    WHERE shop_id = ${shopId} AND status = 'pending'
  `;
  return { ok: true, shopId, status: "verified", action };
}
