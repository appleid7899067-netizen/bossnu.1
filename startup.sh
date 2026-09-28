#!/bin/sh
set -eu
# Resolve the checkout rather than assuming it is mounted at /workspace.
cd "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"

# Process supervisors should own the foreground process and receive its exit status.
if [ "${1:-}" = "--foreground" ]; then
  exec npm run dev
fi

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
nohup npm run dev >>/tmp/app-startup.log 2>&1 </dev/null &
