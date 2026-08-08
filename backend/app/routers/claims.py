from fastapi import APIRouter, HTTPException

from .. import models, schemas, serializers
from ..config import MAX_ACTIVE_CLAIMS_PER_USER
from ..deps import CurrentUser, DbSession
from ..models import utcnow

router = APIRouter(tags=["claims"])


def active_claims_for_user(db, user_id: int) -> list[models.Claim]:
    return (
        db.query(models.Claim)
        .filter(models.Claim.user_id == user_id, models.Claim.released_at.is_(None))
        .all()
    )


@router.post("/api/bounties/{bounty_id}/claim", response_model=schemas.BountyOut)
def claim_bounty(
    bounty_id: int, db: DbSession, user: CurrentUser
) -> schemas.BountyOut:
    bounty = db.get(models.Bounty, bounty_id)
    if bounty is None:
        raise HTTPException(status_code=404, detail="Bounty not found")
    if bounty.status != models.BOUNTY_OPEN:
        raise HTTPException(
            status_code=409, detail=f"Bounty is {bounty.status}, not open for claiming"
        )
    if bounty.active_claim is not None:
        raise HTTPException(status_code=409, detail="Bounty already has an active claim")

    active = active_claims_for_user(db, user.id)
    if len(active) >= MAX_ACTIVE_CLAIMS_PER_USER:
        raise HTTPException(
            status_code=409,
            detail=f"You already have {MAX_ACTIVE_CLAIMS_PER_USER} active claims. "
            "Release one before claiming another.",
        )

    claim = models.Claim(bounty_id=bounty.id, user_id=user.id)
    bounty.status = models.BOUNTY_CLAIMED
    db.add(claim)
    db.commit()
    db.refresh(bounty)
    return serializers.bounty_out(bounty)


@router.post("/api/bounties/{bounty_id}/release", response_model=schemas.BountyOut)
def release_claim(
    bounty_id: int, db: DbSession, user: CurrentUser
) -> schemas.BountyOut:
    bounty = db.get(models.Bounty, bounty_id)
    if bounty is None:
        raise HTTPException(status_code=404, detail="Bounty not found")

    claim = bounty.active_claim
    if claim is None:
        raise HTTPException(status_code=409, detail="Bounty has no active claim")

    is_repo_maintainer = bounty.repo.maintainer_id == user.id
    if claim.user_id != user.id and not is_repo_maintainer:
        raise HTTPException(
            status_code=403, detail="Only the claimer or repo maintainer can release this claim"
        )

    claim.released_at = utcnow()
    bounty.status = models.BOUNTY_OPEN
    db.commit()
    db.refresh(bounty)
    return serializers.bounty_out(bounty)


@router.get("/api/me/claims", response_model=list[schemas.MyClaimOut])
def my_claims(
    db: DbSession, user: CurrentUser, include_released: bool = False
) -> list[schemas.MyClaimOut]:
    query = db.query(models.Claim).filter(models.Claim.user_id == user.id)
    if not include_released:
        query = query.filter(models.Claim.released_at.is_(None))

    claims = query.order_by(models.Claim.created_at.desc()).all()
    return [
        schemas.MyClaimOut(
            claim_id=claim.id,
            bounty=serializers.bounty_out(claim.bounty),
            claimed_at=claim.created_at,
            released_at=claim.released_at,
            submission=(
                serializers.submission_out(claim.latest_submission)
                if claim.latest_submission
                else None
            ),
        )
        for claim in claims
    ]
