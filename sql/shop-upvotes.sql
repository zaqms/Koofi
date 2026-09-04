-- Directory-list social proof. No PII. Does not change list order.
-- Same Neon DATABASE_URL as the /feedback board. Cookie voter is wain_vid.
-- Amjad: run in the Neon SQL editor if the app has not created tables yet.

CREATE TABLE IF NOT EXISTS shop_upvotes (
  shop_id TEXT PRIMARY KEY,
  votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0)
);

CREATE TABLE IF NOT EXISTS shop_vote_receipts (
  shop_id TEXT NOT NULL REFERENCES shop_upvotes(shop_id) ON DELETE CASCADE,
  voter_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (shop_id, voter_hash)
);
