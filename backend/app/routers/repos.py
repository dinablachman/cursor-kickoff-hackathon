from fastapi import APIRouter, HTTPException

from .. import models, schemas, serializers
from ..config import DEFAULT_BOUNTY_LABEL
from ..deps import DbSession, MaintainerUser
from ..models import utcnow
from ..services.github import (
    GitHubError,
    IssueInfo,
    get_github_service,
    parse_repo_full_name,
)

router = APIRouter(prefix="/api/repos", tags=["repos"])

DIFFICULTY_LABELS = {"easy", "medium", "hard"}


def difficulty_from_issue(issue: IssueInfo) -> str:
    for label in issue.labels:
        normalized = label.strip().lower()
        if normalized in DIFFICULTY_LABELS:
            return normalized
        if normalized.startswith("difficulty:"):
            candidate = normalized.split(":", 1)[1].strip()
            if candidate in DIFFICULTY_LABELS:
                return candidate
    return "medium"


@router.get("", response_model=list[schemas.RepoOut])
def list_repos(db: DbSession) -> list[schemas.RepoOut]:
    repos = db.query(models.Repo).order_by(models.Repo.owner, models.Repo.name).all()
    return [serializers.repo_out(repo) for repo in repos]


@router.post("", response_model=schemas.RepoOut, status_code=201)
def register_repo(
    payload: schemas.RepoCreate, db: DbSession, user: MaintainerUser
) -> schemas.RepoOut:
    try:
        owner, name = parse_repo_full_name(payload.full_name)
        info = get_github_service().validate_repo(owner, name)
    except GitHubError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    existing = (
        db.query(models.Repo)
        .filter(models.Repo.owner == info.owner, models.Repo.name == info.name)
        .one_or_none()
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail=f"{info.full_name} is already registered")

    repo = models.Repo(
        owner=info.owner,
        name=info.name,
        description=payload.description or info.description,
        html_url=info.html_url,
        bounty_label=(payload.bounty_label or DEFAULT_BOUNTY_LABEL).strip(),
        maintainer_id=user.id,
    )
    db.add(repo)
    db.commit()
    db.refresh(repo)
    return serializers.repo_out(repo)


@router.get("/{repo_id}", response_model=schemas.RepoOut)
def get_repo(repo_id: int, db: DbSession) -> schemas.RepoOut:
    repo = db.get(models.Repo, repo_id)
    if repo is None:
        raise HTTPException(status_code=404, detail="Repo not found")
    return serializers.repo_out(repo)


@router.post("/{repo_id}/sync", response_model=schemas.SyncResult)
def sync_repo(repo_id: int, db: DbSession, user: MaintainerUser) -> schemas.SyncResult:
    repo = db.get(models.Repo, repo_id)
    if repo is None:
        raise HTTPException(status_code=404, detail="Repo not found")

    service = get_github_service()
    try:
        issues = service.list_bounty_issues(repo.owner, repo.name, repo.bounty_label)
    except GitHubError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    existing_by_number = {
        bounty.github_issue_number: bounty
        for bounty in repo.bounties
        if bounty.github_issue_number is not None
    }

    created = 0
    updated = 0
    for issue in issues:
        bounty = existing_by_number.get(issue.number)
        if bounty is None:
            db.add(
                models.Bounty(
                    repo_id=repo.id,
                    title=issue.title,
                    description=issue.body,
                    difficulty=difficulty_from_issue(issue),
                    status=models.BOUNTY_OPEN,
                    source=models.SOURCE_SYNCED,
                    github_issue_number=issue.number,
                    github_issue_url=issue.html_url,
                )
            )
            created += 1
        else:
            bounty.title = issue.title
            bounty.description = issue.body
            bounty.github_issue_url = issue.html_url
            updated += 1

    repo.last_synced_at = utcnow()
    db.commit()

    return schemas.SyncResult(
        repo_id=repo.id,
        created=created,
        updated=updated,
        total_issues=len(issues),
        source=service.mode,
    )
