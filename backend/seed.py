"""Populate the database with demo data.

    python seed.py           # add demo data (skips what already exists)
    python seed.py --reset   # wipe the database first
"""

import sys

from app import models
from app.database import Base, SessionLocal, engine, init_db
from app.routers.repos import difficulty_from_issue
from app.services.github import get_github_service

# Public demo apps under ShawnLi14 — see docs/superpowers/specs/2026-08-08-campus-demo-apps-design.md
DEMO_REPOS = [
    ("prof-ada", "ShawnLi14/campus-ride", "Demo campus shuttle arrival board"),
    ("prof-ada", "ShawnLi14/study-spot", "Demo study room booking app"),
    ("dean-hopper", "ShawnLi14/campus-bites-api", "Demo campus dining API"),
]

STUDENTS = ["student-lin", "student-rey", "student-kai"]

IDEAS = [
    (
        "student-lin",
        "Favorite stop pin on the ride board",
        "Pin a habitual stop so the arrival board scrolls it into view first.",
        "feature",
        "ShawnLi14/campus-ride",
    ),
    (
        "student-rey",
        "Campus marketplace for used textbooks",
        "A new app for buying and selling textbooks within the campus network.",
        "new-app",
        None,
    ),
    (
        "student-kai",
        "Show popular booking hours",
        "Chart the busiest study-room slots so students can plan around them.",
        "feature",
        "ShawnLi14/study-spot",
    ),
]


def reset() -> None:
    Base.metadata.drop_all(bind=engine)
    print("Dropped all tables.")


def get_or_create_user(db, username: str, role: str) -> models.User:
    user = (
        db.query(models.User).filter(models.User.github_username == username).one_or_none()
    )
    if user is None:
        user = models.User(github_username=username, role=role)
        db.add(user)
        db.flush()
    return user


def main() -> None:
    if "--reset" in sys.argv:
        reset()
    init_db()

    service = get_github_service()
    db = SessionLocal()
    repos_by_name: dict[str, models.Repo] = {}

    try:
        for username, full_name, description in DEMO_REPOS:
            maintainer = get_or_create_user(db, username, models.ROLE_MAINTAINER)
            owner, name = full_name.split("/")
            repo = (
                db.query(models.Repo)
                .filter(models.Repo.owner == owner, models.Repo.name == name)
                .one_or_none()
            )
            if repo is None:
                repo = models.Repo(
                    owner=owner,
                    name=name,
                    description=description,
                    html_url=f"https://github.com/{full_name}",
                    maintainer_id=maintainer.id,
                )
                db.add(repo)
                db.flush()
            repos_by_name[full_name] = repo

        for username in STUDENTS:
            get_or_create_user(db, username, models.ROLE_STUDENT)

        synced = 0
        for full_name, repo in repos_by_name.items():
            issues = service.list_bounty_issues(repo.owner, repo.name, repo.bounty_label)
            existing = {b.github_issue_number for b in repo.bounties}
            for issue in issues:
                if issue.number in existing:
                    continue
                db.add(
                    models.Bounty(
                        repo_id=repo.id,
                        title=issue.title,
                        description=issue.body,
                        difficulty=difficulty_from_issue(issue),
                        source=models.SOURCE_SYNCED,
                        github_issue_number=issue.number,
                        github_issue_url=issue.html_url,
                    )
                )
                synced += 1
            print(f"Synced {len(issues)} labeled issues from {full_name} ({service.mode})")

        ideas = 0
        for username, title, description, category, repo_full_name in IDEAS:
            author = get_or_create_user(db, username, models.ROLE_STUDENT)
            exists = db.query(models.Idea).filter(models.Idea.title == title).first()
            if exists is not None:
                continue
            idea = models.Idea(
                title=title,
                description=description,
                category=category,
                repo_id=repos_by_name[repo_full_name].id if repo_full_name else None,
                author_id=author.id,
            )
            db.add(idea)
            db.flush()
            for voter_name in STUDENTS[: (ideas % 3) + 1]:
                voter = get_or_create_user(db, voter_name, models.ROLE_STUDENT)
                db.add(models.IdeaVote(idea_id=idea.id, user_id=voter.id, value=1))
            db.add(
                models.IdeaComment(
                    idea_id=idea.id,
                    user_id=author.id,
                    body="Happy to help build this if a maintainer picks it up.",
                )
            )
            ideas += 1

        db.commit()
        print(
            f"Seeded {len(repos_by_name)} repos, {synced} synced bounties, {ideas} ideas."
        )
        print("Log in as prof-ada (maintainer) or student-lin (student).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
