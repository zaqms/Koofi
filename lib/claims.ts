import { createHash, randomInt } from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { alertClaimSubmitted } from "./claim-alert";
import { parseOwnerPhone, whatsAppTo } from "./claim-phone";
import { getShop, listDirectoryShops } from "./catalog";
import {
  emptyPassport,
  parsePassport,
  parseProofType,
  publicPassport,
  sanitizeOwnerPassport,
  STUB_OTP_CODE,
  type PassportOwnerFields,
  type PendingClaim,
  type PublicClaimStatus,
  type PublicVerifiedList,
  type ShopClaim,
  type VerifiedClaimRow,
} from "./claims-types";
import { ENV_KEYS, readEnv } from "./env";
import { feedbackStorageKind } from "./feedback";
import {
  shouldApplyPassportPreview,
  woodsPassportFixture,
} from "./passport-preview";
import { isWhatsAppConfigured, sendWhatsAppText } from "./whatsapp";

export {
  emptyPassport,
  parsePassport,
  parseProofType,
  publicPassport,
  STUB_OTP_CODE,
} from "./claims-types";
export type {
  ClaimError,
  ClaimStatus,
  PassportOwnerFields,
  ProofType,
  PublicClaimStatus,
  PublicVerifiedList,
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
  `CREATE TABLE IF NOT EXISTS shop_owner_tokens (
    token_hash TEXT PRIMARY KEY,
    shop_id TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS shop_owner_tokens_shop_idx
    ON shop_owner_tokens (shop_id)`,
] as const;

const OTP_TTL_MS = 10 * 60 * 1000;

type MemoryClaim = ShopClaim;
type MemoryOtp = {
  codeHash: string;
  expiresAt: number;
  stub: boolean;
};

const memoryClaims = new Map<string, MemoryClaim>();
const memoryOtps = new Map<string, MemoryOtp>();

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

function withPreviewPassport(
  shopId: string,
  status: PublicClaimStatus["status"],
  storage: PublicClaimStatus["storage"],
  passport?: PassportOwnerFields,
): PublicClaimStatus {
  if (status === "verified") {
    return {
      shopId,
      status,
      storage,
      passport: publicPassport(passport ?? emptyPassport()),
    };
  }
  if (shouldApplyPassportPreview(shopId, status)) {
    return {
      shopId,
      status: "verified",
      storage,
      passport: publicPassport(woodsPassportFixture("ar")),
      preview: true,
    };
  }
  return { shopId, status, storage };
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
    return { ok: true, ...withPreviewPassport(shopId, "none", "missing") };
  }

  if (feedbackStorageKind() === "memory") {
    const row = memoryClaims.get(shopId);
    return {
      ok: true,
      ...withPreviewPassport(
        shopId,
        row?.status ?? "none",
        "ready",
        row?.passport,
      ),
    };
  }

  const sql = getSql();
  if (!sql) {
    return { ok: true, ...withPreviewPassport(shopId, "none", "missing") };
  }
  const rows = (await sql`
    SELECT status, passport FROM shop_claims WHERE shop_id = ${shopId}
  `) as { status: "pending" | "verified"; passport: unknown }[];
  const row = rows[0];
  return {
    ok: true,
    ...withPreviewPassport(
      shopId,
      row?.status ?? "none",
      "ready",
      row ? parsePassport(row.passport) : undefined,
    ),
  };
}

export async function listPublicVerifiedIds(): Promise<
  { ok: true } & PublicVerifiedList
> {
  const storage = await ensureSchema();
  const ids = new Set<string>();

  if (storage !== "missing") {
    if (feedbackStorageKind() === "memory") {
      for (const row of memoryClaims.values()) {
        if (row.status === "verified") ids.add(row.shopId);
      }
    } else {
      const sql = getSql();
      if (sql) {
        const rows = (await sql`
          SELECT shop_id FROM shop_claims WHERE status = 'verified'
        `) as { shop_id: string }[];
        for (const row of rows) ids.add(row.shop_id);
      }
    }
  }

  const resolvedStorage =
    storage === "missing" ? "missing" : ("ready" as const);
  const woods = await publicClaimStatus("woods-olaya");
  if (woods.ok && woods.status === "verified") ids.add(woods.shopId);

  return {
    ok: true,
    verifiedIds: [...ids],
    storage: resolvedStorage,
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

export async function ensureClaimsSchema(): Promise<"ready" | "missing"> {
  return ensureSchema();
}

export function getClaimsSql(): NeonQueryFunction<false, false> | null {
  return getSql();
}

/** Real claim row. Never the Woods preview overlay. */
export async function loadShopClaim(
  rawId: unknown,
): Promise<ShopClaim | null> {
  const shopId = resolveCatalogShopId(rawId);
  if (!shopId) return null;
  const storage = await ensureSchema();
  if (storage === "missing") return null;

  if (feedbackStorageKind() === "memory") {
    return memoryClaims.get(shopId) ?? null;
  }

  const sql = getSql();
  if (!sql) return null;
  const rows = (await sql`
    SELECT
      shop_id,
      status,
      owner_phone_e164,
      proof_type,
      proof_asset_url,
      passport,
      otp_stub,
      created_at,
      updated_at
    FROM shop_claims
    WHERE shop_id = ${shopId}
  `) as {
    shop_id: string;
    status: "pending" | "verified";
    owner_phone_e164: string;
    proof_type: "cr";
    proof_asset_url: string | null;
    passport: unknown;
    otp_stub: boolean;
    created_at: string;
    updated_at: string;
  }[];
  const row = rows[0];
  if (!row) return null;
  return {
    shopId: row.shop_id,
    status: row.status,
    ownerPhoneE164: row.owner_phone_e164,
    proofType: row.proof_type,
    proofAssetUrl: row.proof_asset_url,
    passport: parsePassport(row.passport),
    otpStub: Boolean(row.otp_stub),
    createdAt:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date(row.created_at).toISOString(),
    updatedAt:
      typeof row.updated_at === "string"
        ? row.updated_at
        : new Date(row.updated_at).toISOString(),
  };
}

export async function listPendingClaims(): Promise<
  | { ok: true; claims: PendingClaim[] }
  | { ok: false; error: "no_storage" }
> {
  const storage = await ensureSchema();
  if (storage === "missing") return { ok: false, error: "no_storage" };

  if (feedbackStorageKind() === "memory") {
    const claims = [...memoryClaims.values()]
      .filter((row) => row.status === "pending")
      .map((row) => ({
        shopId: row.shopId,
        ownerPhoneE164: row.ownerPhoneE164,
        proofAssetUrl: row.proofAssetUrl,
        createdAt: row.createdAt,
      }));
    return { ok: true, claims };
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

export async function listVerifiedClaims(): Promise<
  | { ok: true; claims: VerifiedClaimRow[] }
  | { ok: false; error: "no_storage" }
> {
  const storage = await ensureSchema();
  if (storage === "missing") return { ok: false, error: "no_storage" };

  if (feedbackStorageKind() === "memory") {
    const claims = [...memoryClaims.values()]
      .filter((row) => row.status === "verified")
      .map((row) => ({ shopId: row.shopId, updatedAt: row.updatedAt }));
    return { ok: true, claims };
  }

  const sql = getSql();
  if (!sql) return { ok: false, error: "no_storage" };
  const rows = (await sql`
    SELECT shop_id, updated_at
    FROM shop_claims
    WHERE status = 'verified'
    ORDER BY updated_at DESC
  `) as { shop_id: string; updated_at: string }[];

  return {
    ok: true,
    claims: rows.map((row) => ({
      shopId: row.shop_id,
      updatedAt:
        typeof row.updated_at === "string"
          ? row.updated_at
          : new Date(row.updated_at).toISOString(),
    })),
  };
}

export async function verifyPendingClaim(rawId: unknown): Promise<
  | { ok: true; shopId: string; status: "verified" }
  | { ok: false; error: "not_found" | "not_pending" | "no_storage" }
> {
  const shopId = resolveCatalogShopId(rawId);
  if (!shopId) return { ok: false, error: "not_found" };
  const storage = await ensureSchema();
  if (storage === "missing") return { ok: false, error: "no_storage" };

  const current = await loadShopClaim(shopId);
  if (!current) return { ok: false, error: "not_found" };
  if (current.status !== "pending") return { ok: false, error: "not_pending" };

  const now = new Date().toISOString();
  if (feedbackStorageKind() === "memory") {
    memoryClaims.set(shopId, { ...current, status: "verified", updatedAt: now });
    return { ok: true, shopId, status: "verified" };
  }

  const sql = getSql();
  if (!sql) return { ok: false, error: "no_storage" };
  await sql`
    UPDATE shop_claims
    SET status = 'verified', updated_at = ${now}
    WHERE shop_id = ${shopId} AND status = 'pending'
  `;
  return { ok: true, shopId, status: "verified" };
}

/** Ops-only. Creates a verified row when none exists. Does not send WhatsApp. */
export async function grantVerifiedClaim(rawId: unknown): Promise<
  | { ok: true; shopId: string; status: "verified"; created: boolean }
  | { ok: false; error: "not_found" | "no_storage" }
> {
  const shopId = resolveCatalogShopId(rawId);
  if (!shopId) return { ok: false, error: "not_found" };
  const storage = await ensureSchema();
  if (storage === "missing") return { ok: false, error: "no_storage" };

  const current = await loadShopClaim(shopId);
  if (current?.status === "verified") {
    return { ok: true, shopId, status: "verified", created: false };
  }
  if (current?.status === "pending") {
    const verified = await verifyPendingClaim(shopId);
    if (!verified.ok) {
      if (verified.error === "no_storage") {
        return { ok: false, error: "no_storage" };
      }
      return { ok: false, error: "not_found" };
    }
    return { ok: true, shopId, status: "verified", created: false };
  }

  const now = new Date().toISOString();
  const passport = emptyPassport();
  const row: ShopClaim = {
    shopId,
    status: "verified",
    ownerPhoneE164: "+966570064331",
    proofType: "cr",
    proofAssetUrl: `owner-proof/${shopId}/cr/ops-grant`,
    passport,
    otpStub: true,
    createdAt: now,
    updatedAt: now,
  };

  if (feedbackStorageKind() === "memory") {
    memoryClaims.set(shopId, row);
    return { ok: true, shopId, status: "verified", created: true };
  }

  const sql = getSql();
  if (!sql) return { ok: false, error: "no_storage" };
  await sql`
    INSERT INTO shop_claims (
      shop_id, status, owner_phone_e164, proof_type, proof_asset_url, passport, otp_stub
    )
    VALUES (
      ${shopId},
      'verified',
      ${row.ownerPhoneE164},
      ${row.proofType},
      ${row.proofAssetUrl},
      ${JSON.stringify(passport)}::jsonb,
      ${row.otpStub}
    )
    ON CONFLICT (shop_id) DO NOTHING
  `;
  return { ok: true, shopId, status: "verified", created: true };
}

export async function updateVerifiedPassport(input: {
  shopId: unknown;
  passport: unknown;
}): Promise<
  | { ok: true; shopId: string; passport: PassportOwnerFields }
  | {
      ok: false;
      error: "not_found" | "not_verified" | "no_storage";
    }
> {
  const shopId = resolveCatalogShopId(input.shopId);
  if (!shopId) return { ok: false, error: "not_found" };
  const storage = await ensureSchema();
  if (storage === "missing") return { ok: false, error: "no_storage" };

  const current = await loadShopClaim(shopId);
  if (!current) return { ok: false, error: "not_verified" };
  if (current.status !== "verified") return { ok: false, error: "not_verified" };

  const passport = sanitizeOwnerPassport(input.passport);
  const now = new Date().toISOString();

  if (feedbackStorageKind() === "memory") {
    memoryClaims.set(shopId, { ...current, passport, updatedAt: now });
    return { ok: true, shopId, passport };
  }

  const sql = getSql();
  if (!sql) return { ok: false, error: "no_storage" };
  await sql`
    UPDATE shop_claims
    SET passport = ${JSON.stringify(passport)}::jsonb, updated_at = ${now}
    WHERE shop_id = ${shopId} AND status = 'verified'
  `;
  return { ok: true, shopId, passport };
}
