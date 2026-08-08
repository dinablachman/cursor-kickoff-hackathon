# Campus Bug Bounty Board

Campus app maintainers register GitHub repos, bugs become claimable bounties (synced from labeled
GitHub issues or posted manually), and students submit PRs that go through CI checks plus human
review.

This repo is API-first: `backend/` is the real deliverable, `frontend/` is a deliberately plain
harness for exercising the endpoints while the production UI is built separately.

## Stack

- `backend/` — FastAPI + SQLAlchemy + SQLite
- `frontend/` — React + Vite + TypeScript test harness
- GitHub REST API for repo validation, issue sync, and PR/CI status

## Quick start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env          # macOS/Linux: cp .env.example .env
python seed.py                  # optional demo data
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`, interactive docs at `http://localhost:8000/docs`.

### Frontend harness

```bash
cd frontend
npm install
npm run dev
```

Runs at `http://localhost:5173`. Set `VITE_API_URL` if the backend isn't on port 8000.

## Identity

There is no auth. Every request identifies itself with two headers, and users are created on first
use:

```
X-GitHub-Username: ShawnLi14
X-Role: maintainer      # or: student
```

The harness sends these from the fields in its header bar. Maintainer-only actions: registering and
syncing repos, posting manual bounties, reviewing submissions, changing idea status, converting
ideas to bounties.

## GitHub modes

`GITHUB_TOKEN` in `backend/.env` decides the mode; `GET /api/health` reports which one is active.

- **live** — real GitHub API: repo validation, issues labeled `bounty`, PR state and check runs
- **mock** — no token needed, deterministic fixtures so demos never block

In mock mode the PR number drives the result, which makes each review path reachable on purpose:

| PR URL ends in | PR state | CI status |
| --- | --- | --- |
| a multiple of 3 (e.g. `/pull/3`) | merged | success |
| `n % 3 == 1` (e.g. `/pull/1`) | open | success |
| `n % 3 == 2` (e.g. `/pull/2`) | open | failure |

## Bounty lifecycle

```
open --claim--> claimed --submit PR--> in_review --approve (PR merged)--> completed
                   ^                        |
                   +---- request_changes ---+
                   
reject or release -> back to open
```

Rules the API enforces:

- One active claim per bounty; each user holds at most 2 active claims
- A submitted PR must target the bounty's repo, and (when GitHub reports an author) be authored by
  the claimer
- Approve only succeeds if GitHub confirms the PR is merged; the backend re-checks at decision time
- Review decisions are stored as their own step, so an automated reviewer can be added later without
  schema changes

## API

| Method | Path | Role | Notes |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Status plus active GitHub mode |
| GET | `/api/me` | any | Current user (creates on first use) |
| GET | `/api/repos` | any | Registered repos |
| POST | `/api/repos` | maintainer | Body `{ full_name, description?, bounty_label? }` |
| GET | `/api/repos/{id}` | any | Single repo |
| POST | `/api/repos/{id}/sync` | maintainer | Import open issues with the repo's bounty label |
| GET | `/api/bounties` | any | Filters: `repo_id`, `difficulty`, `status` |
| POST | `/api/bounties` | maintainer | Manual bounty on a repo you maintain |
| GET | `/api/bounties/{id}` | any | Single bounty with claim and latest submission |
| POST | `/api/bounties/{id}/claim` | any | Claim an open bounty |
| POST | `/api/bounties/{id}/release` | claimer or maintainer | Release the active claim |
| POST | `/api/bounties/{id}/submit` | claimer | Body `{ pr_url }` |
| GET | `/api/me/claims` | any | Active claims (`?include_released=true` for history) |
| POST | `/api/submissions/{id}/refresh` | any | Re-poll PR state and CI |
| GET | `/api/reviews` | maintainer | Pending queue for your repos (`?all_repos=true`) |
| POST | `/api/reviews/{submission_id}` | maintainer | Body `{ decision, note? }` where decision is `approve`, `request_changes`, or `reject` |
| GET | `/api/ideas` | any | Filters: `category`, `status`, `repo_id`; `sort` is `top` or `new` |
| POST | `/api/ideas` | any | Body `{ title, description?, category, repo_id? }` |
| GET | `/api/ideas/{id}` | any | Idea with comments and your vote |
| POST | `/api/ideas/{id}/vote` | any | Body `{ value }` where value is `1`, `-1`, or `0` to clear |
| GET/POST | `/api/ideas/{id}/comments` | any | Flat comment list |
| PATCH | `/api/ideas/{id}/status` | maintainer | Body `{ status }`: `open`, `planned`, `done` |
| POST | `/api/ideas/{id}/convert` | maintainer | Create a bounty from a feature idea |

## Ideas board

A second board for proposing features on existing campus apps (`feature`, optionally tagged to a
repo) or entirely new apps (`new-app`). One vote per user per idea, changeable and removable.
Maintainers move ideas to `planned`/`done` and can convert a feature idea on their own repo into a
bounty, which links the two boards.

## Testing

```bash
cd backend
.venv\Scripts\python.exe smoke_test.py
```

Runs the full lifecycle — repo registration, sync, claim caps, PR verification, every review path,
and the ideas flows — against a throwaway SQLite file in mock mode.

## Demo campus apps

Three public sibling repositories with seeded `bounty` issues for live sync and review demos:

| App | Repo | Hero bug | Fixture PR |
|-----|------|----------|------------|
| Campus Ride | [campus-ride](https://github.com/ShawnLi14/campus-ride) | ETA string sort | [#3 failing CI](https://github.com/ShawnLi14/campus-ride/pull/3) (request changes) |
| Study Spot | [study-spot](https://github.com/ShawnLi14/study-spot) | Inclusive booking boundaries | [#3 passing CI](https://github.com/ShawnLi14/study-spot/pull/3) (approve) |
| Campus Bites API | [campus-bites-api](https://github.com/ShawnLi14/campus-bites-api) | Multi-allergen exclusion | — |

Each repo has two open `bounty`-labeled issues, `difficulty: easy` / `difficulty: medium` labels, CI, a `demo-buggy-v1` reset tag, and presenter notes in `DEMO.md`.

```bash
gh issue list --repo ShawnLi14/campus-ride --label bounty
gh issue list --repo ShawnLi14/study-spot --label bounty
gh issue list --repo ShawnLi14/campus-bites-api --label bounty
```

Suggested walkthrough once the board is running: register the three repos → sync → claim a hero bounty → submit/view the fixture PRs → request changes on Ride #3 / approve Study Spot #3.

Design: [docs/superpowers/specs/2026-08-08-campus-demo-apps-design.md](docs/superpowers/specs/2026-08-08-campus-demo-apps-design.md)

## Notes for the frontend team

- CORS allows `http://localhost:5173` and `http://localhost:3000` by default; change `CORS_ORIGINS`
  in `backend/.env` to add more.
- `frontend/` is a throwaway harness. Build the real UI wherever you like and point it at the same
  endpoints; nothing in the backend depends on it.
- Code review itself happens on GitHub. The platform records the decision and the CI signal; it
  never executes submitted code.
