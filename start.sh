#!/usr/bin/env sh
set -e
ROOT="$(dirname "$0")/../.."
npx concurrently \
  --kill-others \
  --names "nebula,angular" \
  --prefix "name" \
  --prefix-colors "cyan,green" \
  "npx tsx watch \"$ROOT/typescript/nebula-srv/src/index.ts\"" \
  "./node_modules/@angular/cli/bin/ng.js serve --host 0.0.0.0"
