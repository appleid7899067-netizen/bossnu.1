import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { isMigrationFile, migrationName, pendingMigrations } from "./migration-plan.mjs";
import { projectRoot } from "./with-app-env.mjs";

const AUTH_MIGRATION = "0001_auth.sql";
const AUTH_SCHEMA_COPY = "0002_auth_schema.sql";

function normalizeSql(sql) {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith("--"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The active workspace's top-level production schema and its canonical source,
 * normalized to compare SQL rather than their explanatory comments.
 */
function authSchemaCopy(root) {
  const copy = join(root, "migrations", AUTH_SCHEMA_COPY);
  const source = join(root, "migrations/auth", AUTH_MIGRATION);
  if (!existsSync(copy) || !existsSync(source)) return null;
  return {
    copy: normalizeSql(readFileSync(copy, "utf8")),
    source: normalizeSql(readFileSync(source, "utf8")),
  };
}

test("_migrations keys on basename, not path", () => {
  assert.equal(migrationName("/migrations/0002_todos.sql"), "0002_todos.sql");
  assert.equal(migrationName("migrations/auth/0001_auth.sql"), "0001_auth.sql");
  assert.equal(migrationName("0001_auth.sql"), "0001_auth.sql");
});

test("a file already applied from another directory does not re-apply", () => {
  // The auth-on path copies migrations/auth/0001_auth.sql into the globbed
  // directory; a database that already has it must not run it twice.
  assert.deepEqual(pendingMigrations(["/migrations/0001_auth.sql"], ["0001_auth.sql"]), []);
});

test("pending migrations are returned in name order", () => {
  assert.deepEqual(
    pendingMigrations(
      ["/migrations/0003_c.sql", "/migrations/0001_a.sql", "/migrations/0002_b.sql"],
      ["0001_a.sql"],
    ),
    [
      { name: "0002_b.sql", path: "/migrations/0002_b.sql" },
      { name: "0003_c.sql", path: "/migrations/0003_c.sql" },
    ],
  );
});

test("non-.sql entries are dropped (readdir also yields the auth/ directory)", () => {
  assert.equal(isMigrationFile("auth"), false);
  assert.deepEqual(pendingMigrations(["auth", "README.md"], []), []);
});

test("the canonical auth schema stays nested and one production copy is globbed", () => {
  const migrationsDir = join(projectRoot(), "migrations");
  const topLevel = pendingMigrations(readdirSync(migrationsDir), []).map((m) => m.name);
  const authMigrations = topLevel.filter((name) => /auth/i.test(name));

  assert.deepEqual(authMigrations, [AUTH_SCHEMA_COPY]);
  assert.ok(readdirSync(join(migrationsDir, "auth")).includes(AUTH_MIGRATION));
});

test("this workspace's production auth migration matches the canonical source SQL", () => {
  const pair = authSchemaCopy(projectRoot());
  assert.ok(pair, "the configured auth-on workspace must ship its production schema copy");
  assert.equal(
    pair.copy,
    pair.source,
    "migrations/0002_auth_schema.sql has drifted from migrations/auth/0001_auth.sql",
  );
});

test("the production-copy check reads both files and catches schema drift", () => {
  const root = mkdtempSync(join(tmpdir(), "auth-schema-"));
  mkdirSync(join(root, "migrations/auth"), { recursive: true });
  writeFileSync(join(root, "migrations/auth", AUTH_MIGRATION), "create table t ();\n");
  assert.equal(authSchemaCopy(root), null);

  writeFileSync(
    join(root, "migrations", AUTH_SCHEMA_COPY),
    "-- deployed copy\ncreate table t ();\n",
  );
  const same = authSchemaCopy(root);
  assert.equal(same.copy, same.source);

  writeFileSync(join(root, "migrations", AUTH_SCHEMA_COPY), "create table t (x int);\n");
  const drifted = authSchemaCopy(root);
  assert.notEqual(drifted.copy, drifted.source);
});
