/**
 * Health Check Endpoint
 * Reports service status, feature availability, and dependency health.
 * Used by: Render health checks, monitoring, deployment verification.
 */

import { createFileRoute } from '@tanstack/react-router';
import { e2bConfigured } from '@/lib/sandbox/e2b-runner.server';
import { isNeonEnabled, checkNeonHealth } from '@/lib/db/neon';

export const Route = createFileRoute('/api/health')(
  {
    validateSearch: (search: unknown) => search, // Accept any query params
  },
  {
    component: () => null, // Not rendered as a page
    beforeLoad: async () => {
      // This hook runs on server-side before route rendering
    },
  },
);

// Server-side handler for GET /api/health
Route.createServerFn()
  .handler(
    async ({ request }) => {
      if (request.method !== 'GET') {
        return new Response(null, { status: 405 });
      }

      const neonHealth = await checkNeonHealth();

      const response = {
        ok: true,
        service: 'bossnu-web',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        features: {
          e2b: e2bConfigured(),
          neon: isNeonEnabled(),
          neonConnected: neonHealth,
        },
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store',
        },
      });
    },
  );
