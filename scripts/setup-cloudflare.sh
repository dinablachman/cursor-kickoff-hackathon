#!/usr/bin/env bash
# Deploy the Cloudflare Worker that fronts the Render (or other) origin.
# Requires: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, ORIGIN
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ORIGIN="${ORIGIN:-}"

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" || -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  cat >&2 <<'EOF'
Cloudflare API credentials are not set.

1. Create a token: https://dash.cloudflare.com/profile/api-tokens
   Use "Edit Cloudflare Workers" (Account.Workers Scripts Edit).
2. Copy the Account ID from the Workers dashboard sidebar.
3. Export:
     export CLOUDFLARE_API_TOKEN=...
     export CLOUDFLARE_ACCOUNT_ID=...
     export ORIGIN=https://YOUR-SERVICE.onrender.com
4. Re-run: ./scripts/setup-cloudflare.sh

Or add those as GitHub Actions secrets and run
"Deploy Cloudflare" from the Actions tab (it asks for ORIGIN).
EOF
  exit 1
fi

if [[ -z "$ORIGIN" ]]; then
  echo "Set ORIGIN to your Render URL, e.g. https://campus-bounty-board.onrender.com" >&2
  exit 1
fi

if ! command -v npx >/dev/null; then
  echo "npx is required" >&2
  exit 1
fi

cd "$ROOT/cloudflare"
npx --yes wrangler@4 secret put ORIGIN --name campus-bounty-board <<< "$ORIGIN"
npx --yes wrangler@4 deploy
echo
echo "Worker deployed. Open the workers.dev URL wrangler printed above."
echo "After Render's URL changes, re-run with the new ORIGIN."
