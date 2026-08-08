# Campus Bug Bounty Board — Frontend

Mario-style world map UI for the Campus Bug Bounty Board.

## Stack

- React + Vite + TypeScript
- Tailwind CSS + game-styled panels
- React Router, TanStack Query, framer-motion

## Run

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Mock API

By default `VITE_USE_MOCK=true` (see `.env`) so the map works without the FastAPI backend.

To hit a real backend on `:8000`:

```bash
# .env
VITE_USE_MOCK=false
```

Vite proxies `/api` → `http://localhost:8000`.

## Controls

- Arrow keys — move avatar between levels
- Enter / Space — enter selected level / Ideas Lab
- Tab — toggle quick-access Apps sidebar
- Click anything — mouse works too

## Login

Dev “player select”: GitHub username + role (`student` / `maintainer`).
