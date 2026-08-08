from datetime import datetime, timezone

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

ROLE_STUDENT = "student"
ROLE_MAINTAINER = "maintainer"

BOUNTY_OPEN = "open"
BOUNTY_CLAIMED = "claimed"
BOUNTY_IN_REVIEW = "in_review"
BOUNTY_COMPLETED = "completed"

SOURCE_SYNCED = "synced"
SOURCE_MANUAL = "manual"

REVIEW_PENDING = "pending"
REVIEW_APPROVED = "approved"
REVIEW_CHANGES_REQUESTED = "changes_requested"
REVIEW_REJECTED = "rejected"

IDEA_OPEN = "open"
IDEA_PLANNED = "planned"
IDEA_DONE = "done"

IDEA_CATEGORY_FEATURE = "feature"
IDEA_CATEGORY_NEW_APP = "new-app"


def utcnow() -> datetime:
    """Naive UTC timestamp; SQLite columns here are timezone-less."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    github_username: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    role: Mapped[str] = mapped_column(String(20), default=ROLE_STUDENT)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    repos: Mapped[list["Repo"]] = relationship(back_populates="maintainer")
    claims: Mapped[list["Claim"]] = relationship(back_populates="user")


class Repo(Base):
    __tablename__ = "repos"
    __table_args__ = (UniqueConstraint("owner", "name", name="uq_repo_owner_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner: Mapped[str] = mapped_column(String(120), index=True)
    name: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str | None] = mapped_column(Text, default=None)
    html_url: Mapped[str | None] = mapped_column(String(400), default=None)
    bounty_label: Mapped[str] = mapped_column(String(60), default="bounty")
    maintainer_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    last_synced_at: Mapped[datetime | None] = mapped_column(DateTime, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    maintainer: Mapped[User] = relationship(back_populates="repos")
    bounties: Mapped[list["Bounty"]] = relationship(back_populates="repo")

    @property
    def full_name(self) -> str:
        return f"{self.owner}/{self.name}"


class Bounty(Base):
    __tablename__ = "bounties"
    __table_args__ = (
        UniqueConstraint("repo_id", "github_issue_number", name="uq_bounty_repo_issue"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    repo_id: Mapped[int] = mapped_column(ForeignKey("repos.id"), index=True)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text, default=None)
    difficulty: Mapped[str] = mapped_column(String(20), default="medium")
    status: Mapped[str] = mapped_column(String(20), default=BOUNTY_OPEN, index=True)
    source: Mapped[str] = mapped_column(String(20), default=SOURCE_MANUAL)
    github_issue_number: Mapped[int | None] = mapped_column(Integer, default=None)
    github_issue_url: Mapped[str | None] = mapped_column(String(400), default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    repo: Mapped[Repo] = relationship(back_populates="bounties")
    claims: Mapped[list["Claim"]] = relationship(back_populates="bounty")

    @property
    def active_claim(self) -> "Claim | None":
        for claim in self.claims:
            if claim.released_at is None:
                return claim
        return None


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    bounty_id: Mapped[int] = mapped_column(ForeignKey("bounties.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    released_at: Mapped[datetime | None] = mapped_column(DateTime, default=None)

    bounty: Mapped[Bounty] = relationship(back_populates="claims")
    user: Mapped[User] = relationship(back_populates="claims")
    submissions: Mapped[list["Submission"]] = relationship(
        back_populates="claim", order_by="Submission.created_at"
    )

    @property
    def is_active(self) -> bool:
        return self.released_at is None

    @property
    def latest_submission(self) -> "Submission | None":
        return self.submissions[-1] if self.submissions else None


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    claim_id: Mapped[int] = mapped_column(ForeignKey("claims.id"), index=True)
    pr_url: Mapped[str] = mapped_column(String(400))
    pr_number: Mapped[int | None] = mapped_column(Integer, default=None)
    pr_state: Mapped[str | None] = mapped_column(String(20), default=None)
    pr_author: Mapped[str | None] = mapped_column(String(120), default=None)
    ci_status: Mapped[str | None] = mapped_column(String(20), default=None)
    review_decision: Mapped[str] = mapped_column(String(30), default=REVIEW_PENDING)
    reviewer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), default=None)
    review_note: Mapped[str | None] = mapped_column(Text, default=None)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    claim: Mapped[Claim] = relationship(back_populates="submissions")
    reviewer: Mapped[User | None] = relationship(foreign_keys=[reviewer_id])


class Idea(Base):
    __tablename__ = "ideas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text, default=None)
    category: Mapped[str] = mapped_column(String(20), default=IDEA_CATEGORY_FEATURE)
    repo_id: Mapped[int | None] = mapped_column(ForeignKey("repos.id"), default=None)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(20), default=IDEA_OPEN)
    converted_bounty_id: Mapped[int | None] = mapped_column(
        ForeignKey("bounties.id"), default=None
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    repo: Mapped[Repo | None] = relationship()
    author: Mapped[User] = relationship()
    votes: Mapped[list["IdeaVote"]] = relationship(
        back_populates="idea", cascade="all, delete-orphan"
    )
    comments: Mapped[list["IdeaComment"]] = relationship(
        back_populates="idea",
        cascade="all, delete-orphan",
        order_by="IdeaComment.created_at",
    )

    @property
    def score(self) -> int:
        return sum(vote.value for vote in self.votes)


class IdeaVote(Base):
    __tablename__ = "idea_votes"
    __table_args__ = (UniqueConstraint("idea_id", "user_id", name="uq_vote_idea_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    idea_id: Mapped[int] = mapped_column(ForeignKey("ideas.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    value: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    idea: Mapped[Idea] = relationship(back_populates="votes")
    user: Mapped[User] = relationship()


class IdeaComment(Base):
    __tablename__ = "idea_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    idea_id: Mapped[int] = mapped_column(ForeignKey("ideas.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    idea: Mapped[Idea] = relationship(back_populates="comments")
    user: Mapped[User] = relationship()
