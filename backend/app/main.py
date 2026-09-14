import runpy
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from . import schemas, serializers
from .config import BACKEND_DIR, CORS_ORIGINS, SEED_ON_START, STATIC_DIR
from .database import init_db
from .deps import CurrentUser
from .routers import bounties, claims, ideas, repos, reviews, submissions
from .services.github import get_github_service


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    if SEED_ON_START:
        runpy.run_path(str(BACKEND_DIR / "seed.py"), run_name="__main__")
    yield


app = FastAPI(
    lifespan=lifespan,
    title="Campus Bug Bounty Board",
    description=(
        "Identify yourself with the X-GitHub-Username and X-Role headers "
        "(role is 'student' or 'maintainer'). Users are created on first use."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

meta = APIRouter(tags=["meta"])


@meta.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "github_mode": get_github_service().mode}


@meta.get("/api/me", response_model=schemas.UserOut)
def me(user: CurrentUser) -> schemas.UserOut:
    return serializers.user_out(user)


app.include_router(meta)
app.include_router(repos.router)
app.include_router(bounties.router)
app.include_router(claims.router)
app.include_router(submissions.router)
app.include_router(reviews.router)
app.include_router(ideas.router)


def _spa_file(full_path: str) -> Path | None:
    if not STATIC_DIR.is_dir():
        return None
    if full_path:
        candidate = (STATIC_DIR / full_path).resolve()
        try:
            candidate.relative_to(STATIC_DIR)
        except ValueError:
            return None
        if candidate.is_file():
            return candidate
    index = STATIC_DIR / "index.html"
    return index if index.is_file() else None


@app.get("/", include_in_schema=False)
def spa_root():
    index = _spa_file("")
    if index is None:
        return {"service": "campus-bug-bounty-board", "ui": "not built"}
    return FileResponse(index)


@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str):
    asset = _spa_file(full_path)
    if asset is None:
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(asset)
