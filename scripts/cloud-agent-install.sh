#!/usr/bin/env bash
set -euo pipefail

corepack enable
corepack prepare pnpm@9.15.4 --activate
pnpm install --frozen-lockfile
pnpm db:prepare
