#!/usr/bin/env bash
# Build the Mario UI (if needed) and serve it with FastAPI on one port.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-8000}"

if ! command -v python3 >/dev/null; then
  echo "python3 is required" >&2
  exit 1
fi

if ! command -v npm >/dev/null; then
  echo "npm is required" >&2
  exit 1
fi

cd "$ROOT/frontend"
if [[ ! -d node_modules ]]; then
  npm ci
fi
if [[ ! -d dist || "${REBUILD_FRONTEND:-}" == "1" ]]; then
  VITE_USE_MOCK=false npm run build
fi

cd "$ROOT/backend"
if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
source .venv/bin/activate
pip install -q -r requirements.txt

export STATIC_DIR="${STATIC_DIR:-$ROOT/frontend/dist}"
export SEED_ON_START="${SEED_ON_START:-1}"

exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
