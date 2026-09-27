-- Workspace ↔ Neon sync bookkeeping.
-- boss_workspace_sync: the manifest (path → sha256) of the last VERIFIED sync,
-- used as the common base for 3-way seeding of the Sandbox Runner.
CREATE TABLE IF NOT EXISTS boss_workspace_sync (
  workspace_id TEXT PRIMARY KEY REFERENCES boss_workspaces(id) ON DELETE CASCADE,
  manifest JSONB NOT NULL DEFAULT '{}'::jsonb,
  manifest_hash TEXT NOT NULL DEFAULT '',
  file_count INTEGER NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit trail: one row per sync attempt with its read-back evidence.
CREATE TABLE IF NOT EXISTS boss_workspace_sync_events (
  id BIGSERIAL PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES boss_workspaces(id) ON DELETE CASCADE,
  command TEXT NOT NULL DEFAULT '',
  verified BOOLEAN NOT NULL,
  complete BOOLEAN NOT NULL,
  evidence JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS boss_workspace_sync_events_idx
  ON boss_workspace_sync_events (workspace_id, created_at DESC);
