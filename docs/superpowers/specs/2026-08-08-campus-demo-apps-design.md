# Campus Demo Apps Design

**Date:** 2026-08-08  
**Status:** Approved for implementation  
**Owner:** ShawnLi14

## Purpose

Provide three small, believable campus apps that the Campus Bug Bounty Board can register, sync, and demo against. Each app ships with deterministic sample data, two claimable bugs, CI, and repeatable review-queue fixtures.

## Portfolio

| Repo | Stack | Role in demo |
|------|-------|--------------|
| `ShawnLi14/campus-ride` | React + Vite + TypeScript | Shuttle arrival board with visual ETA/filter bugs |
| `ShawnLi14/study-spot` | React + Vite + TypeScript | Study room booking with interval/capacity bugs |
| `ShawnLi14/campus-bites-api` | FastAPI + Pydantic | Dining menu API with allergen/inventory bugs |

Repositories are public, standalone siblings of the bounty-board checkout. The board repo does not vendor their source.

## Demo priority

Optimize for fast, visual before/after bug stories that an audience immediately understands. Hero bugs support the live walkthrough; backup bugs populate the board.

## Seeded bugs

### campus-ride

1. **Easy (hero):** Arrival cards sort ETA labels lexicographically, so `"12 min"` can appear before `"3 min"`.
2. **Medium (backup):** Turning off “wheelchair accessible only” does not restore filtered-out shuttles until refresh because filtering mutates displayed state.

### study-spot

1. **Medium (hero):** Back-to-back reservations are rejected as overlapping because interval boundaries are inclusive.
2. **Easy (backup):** A minimum-capacity filter only returns exact matches, hiding larger suitable rooms.

### campus-bites-api

1. **Medium (hero):** Excluding multiple allergens uses “any exclusion matches” logic, allowing unsafe dishes through when they contain one selected allergen.
2. **Easy (backup):** Sold-out dishes remain available because inventory checks use `remaining >= 0`.

## GitHub demo contract

Each repository includes:

- `README.md` for users and `DEMO.md` for presenters
- Deterministic fixtures and local-only synthetic data
- Tests and GitHub Actions that stay green on the default branch
- Labels: `bounty`, `difficulty: easy`, `difficulty: medium`
- Two open issues labeled `bounty` (no fix spoilers in issue bodies)
- Tag `demo-buggy-v1` pointing at the buggy default branch

### PR fixtures

- **campus-ride:** open PR with ETA regression test + incomplete fix → CI fails (request-changes demo)
- **study-spot:** open PR with boundary regression test + correct fix → CI passes (approve demo)
- Issues are linked, not auto-closed; PRs stay unmerged

## Safety constraints

- Harmless logic/state defects only
- No seeded security vulnerabilities, secrets, destructive behavior, or live campus data
- Never force-push default branches as part of reset

## Board integration note

Actual bounty-board registration and sync remain blocked until the FastAPI backend exists. This design prepares and verifies the GitHub-side demo contract first.

## Live walkthrough (once board exists)

1. Register the three repos
2. Sync six `bounty`-labeled issues
3. Claim a hero bounty
4. Submit / view the prepared PR states
5. Record a human review decision (request changes on failing PR, approve on passing PR)
