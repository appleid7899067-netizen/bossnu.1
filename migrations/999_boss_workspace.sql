-- Boss Agent persistent workspace: Agent Home, memory, tasks, and project files.
CREATE TABLE IF NOT EXISTS boss_workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Boss Workspace',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS boss_workspace_files (
  workspace_id TEXT NOT NULL REFERENCES boss_workspaces(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, path)
);

CREATE TABLE IF NOT EXISTS boss_workspace_memory (
  workspace_id TEXT NOT NULL REFERENCES boss_workspaces(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'conversation',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, key)
);

CREATE TABLE IF NOT EXISTS boss_workspace_tasks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES boss_workspaces(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS boss_workspace_files_updated_idx
  ON boss_workspace_files (workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS boss_workspace_memory_updated_idx
  ON boss_workspace_memory (workspace_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS boss_workspace_tasks_workspace_idx
  ON boss_workspace_tasks (workspace_id, updated_at DESC);
