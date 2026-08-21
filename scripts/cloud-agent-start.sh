#!/usr/bin/env bash
set -euo pipefail

# Per-boot initialization is handled by terminal processes; keep start lightweight.
if [ ! -f server/data/apointo.db ]; then
  pnpm db:prepare
fi
