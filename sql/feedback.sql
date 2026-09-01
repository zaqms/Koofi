-- Public feedback board. No PII. Do not seed mock ideas.
-- Amjad: run in the Neon SQL editor if the app has not created tables yet.

CREATE TABLE IF NOT EXISTS ideas (
  id SERIAL PRIMARY KEY,
  body TEXT NOT NULL,
  votes INTEGER NOT NULL DEFAULT 0 CHECK (votes >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vote_receipts (
  idea_id INTEGER NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  voter_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (idea_id, voter_hash)
);

CREATE INDEX IF NOT EXISTS ideas_rank_idx ON ideas (votes DESC, created_at ASC, id ASC);
