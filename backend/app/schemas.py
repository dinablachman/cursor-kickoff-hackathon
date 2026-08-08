from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Role = Literal["student", "maintainer"]
Difficulty = Literal["easy", "medium", "hard"]
BountyStatus = Literal["open", "claimed", "in_review", "completed"]
IdeaCategory = Literal["feature", "new-app"]
IdeaStatus = Literal["open", "planned", "done"]
ReviewDecision = Literal["approve", "request_changes", "reject"]


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    github_username: str
    role: str


class RepoCreate(BaseModel):
    full_name: str = Field(description="GitHub repo as owner/name")
    description: str | None = None
    bounty_label: str | None = None


class RepoOut(BaseModel):
    id: int
    owner: str
    name: str
    full_name: str
    description: str | None
    html_url: str | None
    bounty_label: str
    maintainer: UserOut
    last_synced_at: datetime | None
    open_bounties: int


class SyncResult(BaseModel):
    repo_id: int
    created: int
    updated: int
    total_issues: int
    source: str


class ClaimSummary(BaseModel):
    id: int
    user: UserOut
    created_at: datetime
    released_at: datetime | None


class SubmissionOut(BaseModel):
    id: int
    claim_id: int
    bounty_id: int
    bounty_title: str
    repo_full_name: str
    submitter: UserOut
    pr_url: str
    pr_number: int | None
    pr_state: str | None
    pr_author: str | None
    ci_status: str | None
    review_decision: str
    review_note: str | None
    reviewed_at: datetime | None
    created_at: datetime


class BountyCreate(BaseModel):
    repo_id: int
    title: str
    description: str | None = None
    difficulty: Difficulty = "medium"


class BountyOut(BaseModel):
    id: int
    repo_id: int
    repo_full_name: str
    title: str
    description: str | None
    difficulty: str
    status: str
    source: str
    github_issue_number: int | None
    github_issue_url: str | None
    created_at: datetime
    active_claim: ClaimSummary | None
    latest_submission: SubmissionOut | None


class SubmissionCreate(BaseModel):
    pr_url: str


class MyClaimOut(BaseModel):
    claim_id: int
    bounty: BountyOut
    claimed_at: datetime
    released_at: datetime | None
    submission: SubmissionOut | None


class ReviewCreate(BaseModel):
    decision: ReviewDecision
    note: str | None = None


class IdeaCreate(BaseModel):
    title: str
    description: str | None = None
    category: IdeaCategory = "feature"
    repo_id: int | None = None


class IdeaCommentCreate(BaseModel):
    body: str


class IdeaCommentOut(BaseModel):
    id: int
    idea_id: int
    author: UserOut
    body: str
    created_at: datetime


class IdeaVoteCreate(BaseModel):
    value: Literal[-1, 0, 1] = Field(description="1 upvote, -1 downvote, 0 removes vote")


class IdeaOut(BaseModel):
    id: int
    title: str
    description: str | None
    category: str
    status: str
    repo_id: int | None
    repo_full_name: str | None
    author: UserOut
    score: int
    vote_count: int
    my_vote: int
    comment_count: int
    converted_bounty_id: int | None
    created_at: datetime


class IdeaDetailOut(IdeaOut):
    comments: list[IdeaCommentOut]


class IdeaStatusUpdate(BaseModel):
    status: IdeaStatus
