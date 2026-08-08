from fastapi import APIRouter, HTTPException

from .. import models, schemas, serializers
from ..deps import DbSession, MaintainerUser
from ..models import utcnow
from .submissions import apply_pr_info, fetch_pr

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


@router.get("", response_model=list[schemas.SubmissionOut])
def review_queue(
    db: DbSession, user: MaintainerUser, all_repos: bool = False
) -> list[schemas.SubmissionOut]:
    query = (
        db.query(models.Submission)
        .join(models.Claim, models.Submission.claim_id == models.Claim.id)
        .join(models.Bounty, models.Claim.bounty_id == models.Bounty.id)
        .join(models.Repo, models.Bounty.repo_id == models.Repo.id)
        .filter(models.Submission.review_decision == models.REVIEW_PENDING)
    )
    if not all_repos:
        query = query.filter(models.Repo.maintainer_id == user.id)

    submissions = query.order_by(models.Submission.created_at).all()
    return [serializers.submission_out(submission) for submission in submissions]


@router.post("/{submission_id}", response_model=schemas.SubmissionOut)
def record_decision(
    submission_id: int,
    payload: schemas.ReviewCreate,
    db: DbSession,
    user: MaintainerUser,
) -> schemas.SubmissionOut:
    submission = db.get(models.Submission, submission_id)
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")

    claim = submission.claim
    bounty = claim.bounty
    if bounty.repo.maintainer_id != user.id:
        raise HTTPException(
            status_code=403, detail="Only the repo maintainer can review this submission"
        )
    if submission.review_decision != models.REVIEW_PENDING:
        raise HTTPException(
            status_code=409,
            detail=f"Submission already reviewed ({submission.review_decision})",
        )

    if payload.decision == "approve":
        # Completion requires GitHub to confirm the PR actually merged.
        apply_pr_info(submission, fetch_pr(submission.pr_url))
        if submission.pr_state != "merged":
            raise HTTPException(
                status_code=409,
                detail=f"PR is {submission.pr_state}, not merged. Merge it on GitHub first.",
            )
        submission.review_decision = models.REVIEW_APPROVED
        bounty.status = models.BOUNTY_COMPLETED
        claim.released_at = utcnow()
    elif payload.decision == "request_changes":
        submission.review_decision = models.REVIEW_CHANGES_REQUESTED
        bounty.status = models.BOUNTY_CLAIMED
    else:
        submission.review_decision = models.REVIEW_REJECTED
        claim.released_at = utcnow()
        bounty.status = models.BOUNTY_OPEN

    submission.reviewer_id = user.id
    submission.review_note = payload.note
    submission.reviewed_at = utcnow()

    db.commit()
    db.refresh(submission)
    return serializers.submission_out(submission)
