from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import schemas, serializers
from .config import CORS_ORIGINS
from .database import init_db
from .deps import CurrentUser
from .routers import bounties, claims, ideas, repos, reviews, submissions
from .services.github import get_github_service


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
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
