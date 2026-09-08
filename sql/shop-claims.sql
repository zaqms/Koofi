-- Owner claim + empty Passport scaffold. Per shop_id (branch).
-- Same Neon DATABASE_URL as /feedback and shop_upvotes.
-- Status `none` is the absence of a row. Public cards never write Passport fields.
-- Amjad: run in the Neon SQL editor if the app has not created tables yet.

CREATE TABLE IF NOT EXISTS shop_claims (
  shop_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('pending', 'verified')),
  owner_phone_e164 TEXT NOT NULL,
  proof_type TEXT NOT NULL CHECK (proof_type = 'cr'),
  proof_asset_url TEXT,
  passport JSONB NOT NULL DEFAULT '{}'::jsonb,
  otp_stub BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_claim_otp (
  shop_id TEXT NOT NULL,
  phone_e164 TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  stub BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (shop_id, phone_e164)
);
