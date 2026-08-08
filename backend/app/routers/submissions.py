from fastapi import APIRouter, HTTPException

from .. import models, schemas, serializers
from ..deps import CurrentUser, DbSession
from ..services.github import (
    GitHubError,
    PullRequestInfo,
    get_github_service,
    parse_pr_url,
)

router = APIRouter(tags=["submissions"])


def fetch_pr(pr_url: str) -> PullRequestInfo:
    try:
        ref = parse_pr_url(pr_url)
        return get_github_service().get_pull_request(ref)
    except GitHubError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


def apply_pr_info(submission: models.Submission, info: PullRequestInfo) -> None:
    submission.pr_number = info.number
    submission.pr_state = info.state
    submission.pr_author = info.author
    submission.ci_status = info.ci_status


@router.post("/api/bounties/{bounty_id}/submit", response_model=schemas.SubmissionOut, status_code=201)
def submit_pr(
    bounty_id: int,
    payload: schemas.SubmissionCreate,
    db: DbSession,
    user: CurrentUser,
) -> schemas.SubmissionOut:
    bounty = db.get(models.Bounty, bounty_id)
    if bounty is None:
        raise HTTPException(status_code=404, detail="Bounty not found")

    claim = bounty.active_claim
    if claim is None or claim.user_id != user.id:
        raise HTTPException(
            status_code=403, detail="You must hold the active claim to submit a PR"
        )
    if bounty.status == models.BOUNTY_COMPLETED:
        raise HTTPException(status_code=409, detail="Bounty is already completed")

    info = fetch_pr(payload.pr_url)

    if info.base_repo_full_name.lower() != bounty.repo.full_name.lower():
        raise HTTPException(
            status_code=400,
            detail=f"PR targets {info.base_repo_full_name}, but this bounty is on "
            f"{bounty.repo.full_name}",
        )
    if info.author and info.author.lower() != user.github_username.lower():
        raise HTTPException(
            status_code=400,
            detail=f"PR was opened by {info.author}, but the claim belongs to "
            f"{user.github_username}",
        )

    submission = models.Submission(claim_id=claim.id, pr_url=payload.pr_url)
    apply_pr_info(submission, info)
    bounty.status = models.BOUNTY_IN_REVIEW

    db.add(submission)
    db.commit()
    db.refresh(submission)
    return serializers.submission_out(submission)


@router.post("/api/submissions/{submission_id}/refresh", response_model=schemas.SubmissionOut)
def refresh_submission(
    submission_id: int, db: DbSession, user: CurrentUser
) -> schemas.SubmissionOut:
    submission = db.get(models.Submission, submission_id)
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")

    info = fetch_pr(submission.pr_url)
    apply_pr_info(submission, info)
    db.commit()
    db.refresh(submission)
    return serializers.submission_out(submission)
