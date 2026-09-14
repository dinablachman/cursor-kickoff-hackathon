import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BACKEND_DIR / ".env")

REPO_ROOT = BACKEND_DIR.parent
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "").strip()
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BACKEND_DIR / 'bounty_board.db'}")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
    ).split(",")
    if origin.strip()
]
STATIC_DIR = Path(os.getenv("STATIC_DIR", REPO_ROOT / "frontend" / "dist")).resolve()
SEED_ON_START = os.getenv("SEED_ON_START", "1").strip().lower() not in {
    "0",
    "false",
    "no",
}

GITHUB_API_BASE = "https://api.github.com"
DEFAULT_BOUNTY_LABEL = "bounty"
MAX_ACTIVE_CLAIMS_PER_USER = 2
