# Campus Bug Bounty Board

A bounty board web app where campus app maintainers register GitHub repos, bugs become claimable bounties (synced from GitHub issues or posted manually), and students submit PRs that go through CI checks plus human review.

## Status

Board backend/frontend scaffolding is not started yet. The **demo campus apps** below are ready as standalone GitHub repositories for issue sync and review-queue demos once the board API exists.

## Demo campus apps

Three public sibling repositories under [`ShawnLi14`](https://github.com/ShawnLi14):

| App | Repo | Stack | Hero bug |
|-----|------|-------|----------|
| Campus Ride | [campus-ride](https://github.com/ShawnLi14/campus-ride) | React + Vite + TypeScript | ETA string sort (`"12 min"` before `"3 min"`) |
| Study Spot | [study-spot](https://github.com/ShawnLi14/study-spot) | React + Vite + TypeScript | Inclusive booking boundaries reject back-to-back slots |
| Campus Bites API | [campus-bites-api](https://github.com/ShawnLi14/campus-bites-api) | FastAPI | Multi-allergen exclusion uses wrong boolean logic |

Each repo ships:

- Deterministic sample data and two `bounty`-labeled issues
- `difficulty: easy` / `difficulty: medium` labels
- CI via GitHub Actions
- `demo-buggy-v1` reset tag
- Presenter notes in `DEMO.md`

### Local checkouts

Clone next to this board repo:

```bash
cd ../
git clone https://github.com/ShawnLi14/campus-ride.git
git clone https://github.com/ShawnLi14/study-spot.git
git clone https://github.com/ShawnLi14/campus-bites-api.git
```

### Seeded issue inventory

Once published, list all claimable demos with:

```bash
gh issue list --repo ShawnLi14/campus-ride --label bounty
gh issue list --repo ShawnLi14/study-spot --label bounty
gh issue list --repo ShawnLi14/campus-bites-api --label bounty
```

### Review-queue fixtures

- **campus-ride:** open PR with failing CI (incomplete ETA fix) — demo “request changes”
- **study-spot:** open PR with passing CI (correct boundary fix) — demo “approve”

### Board sync limitation

Registering these repos and syncing issues into the bounty board requires the FastAPI backend (not yet built). Until then, use GitHub Issues / PRs and each app’s `DEMO.md` for the presenter walkthrough.

## Design docs

- [Campus Demo Apps Design](docs/superpowers/specs/2026-08-08-campus-demo-apps-design.md)
