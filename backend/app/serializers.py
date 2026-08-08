from . import models, schemas


def user_out(user: models.User) -> schemas.UserOut:
    return schemas.UserOut.model_validate(user)


def repo_out(repo: models.Repo) -> schemas.RepoOut:
    open_bounties = sum(1 for b in repo.bounties if b.status == models.BOUNTY_OPEN)
    return schemas.RepoOut(
        id=repo.id,
        owner=repo.owner,
        name=repo.name,
        full_name=repo.full_name,
        description=repo.description,
        html_url=repo.html_url,
        bounty_label=repo.bounty_label,
        maintainer=user_out(repo.maintainer),
        last_synced_at=repo.last_synced_at,
        open_bounties=open_bounties,
    )


def claim_summary(claim: models.Claim) -> schemas.ClaimSummary:
    return schemas.ClaimSummary(
        id=claim.id,
        user=user_out(claim.user),
        created_at=claim.created_at,
        released_at=claim.released_at,
    )


def submission_out(submission: models.Submission) -> schemas.SubmissionOut:
    claim = submission.claim
    bounty = claim.bounty
    return schemas.SubmissionOut(
        id=submission.id,
        claim_id=claim.id,
        bounty_id=bounty.id,
        bounty_title=bounty.title,
        repo_full_name=bounty.repo.full_name,
        submitter=user_out(claim.user),
        pr_url=submission.pr_url,
        pr_number=submission.pr_number,
        pr_state=submission.pr_state,
        pr_author=submission.pr_author,
        ci_status=submission.ci_status,
        review_decision=submission.review_decision,
        review_note=submission.review_note,
        reviewed_at=submission.reviewed_at,
        created_at=submission.created_at,
    )


def bounty_out(bounty: models.Bounty) -> schemas.BountyOut:
    active = bounty.active_claim
    latest = active.latest_submission if active else None
    return schemas.BountyOut(
        id=bounty.id,
        repo_id=bounty.repo_id,
        repo_full_name=bounty.repo.full_name,
        title=bounty.title,
        description=bounty.description,
        difficulty=bounty.difficulty,
        status=bounty.status,
        source=bounty.source,
        github_issue_number=bounty.github_issue_number,
        github_issue_url=bounty.github_issue_url,
        created_at=bounty.created_at,
        active_claim=claim_summary(active) if active else None,
        latest_submission=submission_out(latest) if latest else None,
    )


def idea_out(
    idea: models.Idea, viewer: models.User | None = None
) -> schemas.IdeaOut:
    my_vote = 0
    if viewer is not None:
        for vote in idea.votes:
            if vote.user_id == viewer.id:
                my_vote = vote.value
                break
    return schemas.IdeaOut(
        id=idea.id,
        title=idea.title,
        description=idea.description,
        category=idea.category,
        status=idea.status,
        repo_id=idea.repo_id,
        repo_full_name=idea.repo.full_name if idea.repo else None,
        author=user_out(idea.author),
        score=idea.score,
        vote_count=len(idea.votes),
        my_vote=my_vote,
        comment_count=len(idea.comments),
        converted_bounty_id=idea.converted_bounty_id,
        created_at=idea.created_at,
    )


def idea_comment_out(comment: models.IdeaComment) -> schemas.IdeaCommentOut:
    return schemas.IdeaCommentOut(
        id=comment.id,
        idea_id=comment.idea_id,
        author=user_out(comment.user),
        body=comment.body,
        created_at=comment.created_at,
    )


def idea_detail_out(
    idea: models.Idea, viewer: models.User | None = None
) -> schemas.IdeaDetailOut:
    base = idea_out(idea, viewer)
    return schemas.IdeaDetailOut(
        **base.model_dump(),
        comments=[idea_comment_out(c) for c in idea.comments],
    )
