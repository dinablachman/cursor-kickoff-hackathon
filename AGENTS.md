# AGENTS.md

## Cursor Cloud specific instructions

Campus Bug Bounty Board: a FastAPI + SQLAlchemy + SQLite backend (`backend/`, the real
deliverable) and a plain React + Vite + TypeScript test harness (`frontend/`). There is no auth —
requests identify themselves with `X-GitHub-Username` and `X-Role` (`student` | `maintainer`)
headers, and users are created on first use.

### Services

| Service | Dir | Dev command | URL |
| --- | --- | --- | --- |
| Backend API | `backend/` | `.venv/bin/uvicorn app.main:app --reload --port 8000` | http://localhost:8000 (Swagger at `/docs`) |
| Frontend harness (optional) | `frontend/` | `npm run dev` | http://localhost:5173 |

The update script provisions both `backend/.venv` (Python deps) and `frontend/node_modules`, so
future agents can start the servers directly without reinstalling.

### Non-obvious notes

- The venv is created with the system `python3` (there is no `python` on PATH). Always invoke the
  backend interpreter as `backend/.venv/bin/python` / `.venv/bin/uvicorn`, not `python`.
- `backend/.env` is gitignored. The update script copies it from `backend/.env.example` only when
  missing; defaults work out of the box (mock GitHub mode, local SQLite).
- SQLite is embedded and auto-created on startup (`init_db()` runs `create_all`). No DB server.
  The DB file (`backend/bounty_board.db`) is gitignored; run `.venv/bin/python seed.py` to load
  demo data (repos `campus/coursemap`, `campus/dorm-laundry`; users `prof-ada` maintainer,
  `student-lin` student).
- GitHub runs in **mock mode** unless `GITHUB_TOKEN` is set in `backend/.env`. In mock mode the PR
  number drives the outcome: `/pull/3` (multiple of 3) = merged + passing CI (approvable),
  `n%3==1` = open + passing, `n%3==2` = open + failing.
- Tests: there is no pytest suite. The end-to-end check is `backend/.venv/bin/python smoke_test.py`
  (runs the full lifecycle against a throwaway SQLite file in mock mode).
- Lint: no dedicated linter. Frontend type-checking runs via `npm run build` (`tsc -b && vite
  build`). Backend has no configured linter/formatter.
- README quick-start commands are written Windows-first; on this Linux VM use `source
  .venv/bin/activate` / `cp` equivalents.
