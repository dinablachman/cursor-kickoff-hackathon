"""Populate the database with demo data.

    python seed.py           # add demo data (skips what already exists)
    python seed.py --reset   # wipe the database first
"""

import sys

from app import models
from app.database import Base, SessionLocal, engine, init_db
from app.services.github import get_github_service

MAINTAINERS = [
    ("prof-ada", "campus/coursemap", "Course planner used by ~4k students"),
    ("dean-hopper", "campus/dorm-laundry", "Laundry machine availability tracker"),
]

STUDENTS = ["student-lin", "student-rey", "student-kai"]

MANUAL_BOUNTIES = [
    (
        "campus/coursemap",
        "Prerequisite chains render off-screen on mobile",
        "The graph view overflows the viewport below 400px. Needs responsive panning.",
        "medium",
    ),
    (
        "campus/dorm-laundry",
        "Push notification when a machine finishes",
        "Opt-in web push so students stop camping in the laundry room.",
        "hard",
    ),
]

IDEAS = [
    (
        "student-lin",
        "Bus tracker widget on the home screen",
        "Live shuttle ETAs so nobody sprints for a bus that already left.",
        "feature",
        "campus/coursemap",
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
        "Show laundry machine history",
        "Chart the busiest hours so students can plan around them.",
        "feature",
        "campus/dorm-laundry",
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
        for username, full_name, description in MAINTAINERS:
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
                difficulty = next(
                    (
                        label
                        for label in issue.labels
                        if label in {"easy", "medium", "hard"}
                    ),
                    "medium",
                )
                db.add(
                    models.Bounty(
                        repo_id=repo.id,
                        title=issue.title,
                        description=issue.body,
                        difficulty=difficulty,
                        source=models.SOURCE_SYNCED,
                        github_issue_number=issue.number,
                        github_issue_url=issue.html_url,
                    )
                )
                synced += 1
            print(f"Synced {len(issues)} labeled issues from {full_name} ({service.mode})")

        manual = 0
        for full_name, title, description, difficulty in MANUAL_BOUNTIES:
            repo = repos_by_name[full_name]
            exists = (
                db.query(models.Bounty)
                .filter(models.Bounty.repo_id == repo.id, models.Bounty.title == title)
                .first()
            )
            if exists is None:
                db.add(
                    models.Bounty(
                        repo_id=repo.id,
                        title=title,
                        description=description,
                        difficulty=difficulty,
                        source=models.SOURCE_MANUAL,
                    )
                )
                manual += 1

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
            f"Seeded {len(repos_by_name)} repos, {synced} synced bounties, "
            f"{manual} manual bounties, {ideas} ideas."
        )
        print("Log in as prof-ada (maintainer) or student-lin (student).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
