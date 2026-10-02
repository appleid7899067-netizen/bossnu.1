/**
 * Neon Database Connection
 * Handles serverless Postgres via Neon API.
 * Used when DATABASE_URL is set; app falls back to PGLite otherwise.
 */

const DATABASE_URL = process.env.DATABASE_URL?.trim();
const NEON_ENABLED = !!DATABASE_URL;

/**
 * Check if Neon is configured.
 */
export function isNeonEnabled(): boolean {
  return NEON_ENABLED;
}

/**
 * Get database URL.
 */
export function getDatabaseUrl(): string | undefined {
  return DATABASE_URL;
}

/**
 * Health check for Neon connection.
 * Returns true if DATABASE_URL is set and accessible.
 */
export async function checkNeonHealth(): Promise<boolean> {
  if (!NEON_ENABLED) {
    return false;
  }

  try {
    // Import pg dynamically to avoid requiring it if DATABASE_URL is not set
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: DATABASE_URL,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 1_000,
      max: 1,
    });

    const result = await pool.query('SELECT 1');
    await pool.end();

    return result.rows.length > 0;
  } catch (err) {
    console.error('[Neon] Health check failed:', err instanceof Error ? err.message : err);
    return false;
  }
}
