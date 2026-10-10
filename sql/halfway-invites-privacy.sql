-- PR #252 (بيننا random invite ids): ONE-TIME manual migration.
-- Run once, by hand, against the production Neon database BEFORE the PR
-- merges (runner: `npx tsx scripts/migrate-halfway-invites.ts --apply`,
-- or paste into the Neon SQL editor). The app never runs this: at request
-- time it runs no DDL; it only checks (read-only) that these columns and
-- the unique index exist, and keeps بيننا invites off until they do.
--
-- Additive only. The current production code names its columns
-- explicitly, so it keeps working before and after. Idempotent
-- (IF NOT EXISTS). The table is small; each statement takes a brief lock.

-- Same shape main creates at runtime today (no-op on prod). After this
-- PR the app runs no DDL at all, so a fresh database needs this file.
CREATE TABLE IF NOT EXISTS halfway_invites (
  id TEXT PRIMARY KEY,
  locations JSONB NOT NULL,
  shop_ids JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE halfway_invites ADD COLUMN IF NOT EXISTS shop_ids JSONB;

-- Locale the host minted the invite in.
ALTER TABLE halfway_invites ADD COLUMN IF NOT EXISTS locale TEXT;
-- Host pin(s): the seed that used to be encoded in the URL.
ALTER TABLE halfway_invites ADD COLUMN IF NOT EXISTS host_locations JSONB;
-- sha256("halfway-legacy:" + old token): old /h/{base64} link → random id.
ALTER TABLE halfway_invites ADD COLUMN IF NOT EXISTS legacy_key TEXT;

-- Idempotent legacy migration (NULLs are distinct, new invites unaffected).
CREATE UNIQUE INDEX IF NOT EXISTS halfway_invites_legacy_key_idx
  ON halfway_invites (legacy_key);

-- Expired-row sweep (sweepExpiredHalfwayInvites) scans by expiry.
CREATE INDEX IF NOT EXISTS halfway_invites_expires_at_idx
  ON halfway_invites (expires_at);
