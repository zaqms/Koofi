-- Owner manage magic links. Same Neon DATABASE_URL as shop_claims.
-- Store the SHA-256 hash only. Plaintext is shown once at mint.
-- Token is valid only when shop_claims.status = 'verified' for that shop_id.

CREATE TABLE IF NOT EXISTS shop_owner_tokens (
  token_hash TEXT PRIMARY KEY,
  shop_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shop_owner_tokens_shop_idx
  ON shop_owner_tokens (shop_id);
