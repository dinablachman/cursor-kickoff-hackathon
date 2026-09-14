#!/usr/bin/env bash
# Idempotent repository bootstrap for the Campus Bug Bounty Board.
# Prepares the FastAPI backend (venv + deps + demo data) and the Vite frontend.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# The base image ships Python 3.12 but not the venv/ensurepip module.
if ! python3 -c "import ensurepip" >/dev/null 2>&1; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq python3.12-venv
fi

# Backend: virtualenv, pinned dependencies, local config, and demo data.
cd "$REPO_ROOT/backend"
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
# shellcheck disable=SC1091
. .venv/bin/activate
pip install --upgrade pip --quiet
pip install -r requirements.txt --quiet
[ -f .env ] || cp .env.example .env
# seed.py is idempotent: it skips users, repos, bounties, and ideas that exist.
python seed.py
deactivate

# Frontend: install the test-harness dependencies from the lockfile.
cd "$REPO_ROOT/frontend"
npm install
