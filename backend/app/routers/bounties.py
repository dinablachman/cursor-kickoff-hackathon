from fastapi import APIRouter, HTTPException, Query

from .. import models, schemas, serializers
from ..deps import DbSession, MaintainerUser

router = APIRouter(prefix="/api/bounties", tags=["bounties"])


@router.get("", response_model=list[schemas.BountyOut])
def list_bounties(
    db: DbSession,
    repo_id: int | None = Query(default=None),
    difficulty: schemas.Difficulty | None = Query(default=None),
    status: schemas.BountyStatus | None = Query(default=None),
) -> list[schemas.BountyOut]:
    query = db.query(models.Bounty)
    if repo_id is not None:
        query = query.filter(models.Bounty.repo_id == repo_id)
    if difficulty is not None:
        query = query.filter(models.Bounty.difficulty == difficulty)
    if status is not None:
        query = query.filter(models.Bounty.status == status)

    bounties = query.order_by(models.Bounty.created_at.desc(), models.Bounty.id.desc()).all()
    return [serializers.bounty_out(bounty) for bounty in bounties]


@router.post("", response_model=schemas.BountyOut, status_code=201)
def create_bounty(
    payload: schemas.BountyCreate, db: DbSession, user: MaintainerUser
) -> schemas.BountyOut:
    repo = db.get(models.Repo, payload.repo_id)
    if repo is None:
        raise HTTPException(status_code=404, detail="Repo not found")
    if repo.maintainer_id != user.id:
        raise HTTPException(
            status_code=403, detail="Only the repo maintainer can post bounties here"
        )

    bounty = models.Bounty(
        repo_id=repo.id,
        title=payload.title,
        description=payload.description,
        difficulty=payload.difficulty,
        status=models.BOUNTY_OPEN,
        source=models.SOURCE_MANUAL,
    )
    db.add(bounty)
    db.commit()
    db.refresh(bounty)
    return serializers.bounty_out(bounty)


@router.get("/{bounty_id}", response_model=schemas.BountyOut)
def get_bounty(bounty_id: int, db: DbSession) -> schemas.BountyOut:
    bounty = db.get(models.Bounty, bounty_id)
    if bounty is None:
        raise HTTPException(status_code=404, detail="Bounty not found")
    return serializers.bounty_out(bounty)
