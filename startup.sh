#!/bin/sh
# Restart contract: bring the dev server (0.0.0.0:8080) back after a
# hibernate/revive. Idempotent and non-blocking — probe first, start only what
# is down, background it, return fast. Path-agnostic so it works in any checkout.
set -eu
cd "$(dirname "$0")"

node scripts/preview.mjs stop || true

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi

npm run dev >>/tmp/app-startup.log 2>&1 &
