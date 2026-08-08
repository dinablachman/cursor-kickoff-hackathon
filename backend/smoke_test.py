"""End-to-end smoke test for the bounty lifecycle.

Runs against a throwaway SQLite file with the mock GitHub service:
    python smoke_test.py
"""

import os
import pathlib
import sys

DB_PATH = pathlib.Path(__file__).resolve().parent / "smoke_test.db"
DB_PATH.unlink(missing_ok=True)
os.environ["DATABASE_URL"] = f"sqlite:///{DB_PATH}"
os.environ["GITHUB_TOKEN"] = ""

from fastapi.testclient import TestClient  # noqa: E402

from app.database import init_db  # noqa: E402
from app.main import app  # noqa: E402

MAINTAINER = {"X-GitHub-Username": "prof-ada", "X-Role": "maintainer"}
STUDENT = {"X-GitHub-Username": "student-lin", "X-Role": "student"}
OTHER_STUDENT = {"X-GitHub-Username": "student-rey", "X-Role": "student"}

failures: list[str] = []


def check(label: str, condition: bool, detail: object = "") -> None:
    if condition:
        print(f"  PASS  {label}")
    else:
        print(f"  FAIL  {label} -> {detail}")
        failures.append(label)


def main() -> int:
    init_db()
    client = TestClient(app)

    print("health + identity")
    health = client.get("/api/health").json()
    check("github runs in mock mode", health["github_mode"] == "mock", health)
    me = client.get("/api/me", headers=STUDENT).json()
    check("user auto-created from headers", me["github_username"] == "student-lin", me)
    check(
        "missing identity header is rejected",
        client.get("/api/me").status_code == 401,
    )

    print("repos")
    repo_resp = client.post(
        "/api/repos", json={"full_name": "campus/coursemap"}, headers=MAINTAINER
    )
    check("maintainer registers repo", repo_resp.status_code == 201, repo_resp.text)
    repo = repo_resp.json()
    check(
        "students cannot register repos",
        client.post(
            "/api/repos", json={"full_name": "campus/other"}, headers=STUDENT
        ).status_code
        == 403,
    )
    check(
        "duplicate repo rejected",
        client.post(
            "/api/repos", json={"full_name": "campus/coursemap"}, headers=MAINTAINER
        ).status_code
        == 409,
    )

    sync = client.post(f"/api/repos/{repo['id']}/sync", headers=MAINTAINER).json()
    check("sync creates bounties", sync["created"] == 3, sync)
    resync = client.post(f"/api/repos/{repo['id']}/sync", headers=MAINTAINER).json()
    check("resync updates instead of duplicating", resync["created"] == 0, resync)

    print("bounties")
    manual = client.post(
        "/api/bounties",
        json={"repo_id": repo["id"], "title": "Add offline mode", "difficulty": "hard"},
        headers=MAINTAINER,
    )
    check("manual bounty created", manual.status_code == 201, manual.text)
    bounties = client.get("/api/bounties").json()
    check("board lists 4 bounties", len(bounties) == 4, len(bounties))
    hard = client.get("/api/bounties", params={"difficulty": "hard"}).json()
    check("difficulty filter works", all(b["difficulty"] == "hard" for b in hard), hard)

    print("claims")
    target = bounties[-1]
    claimed = client.post(f"/api/bounties/{target['id']}/claim", headers=STUDENT)
    check("student claims bounty", claimed.status_code == 200, claimed.text)
    check("bounty now claimed", claimed.json()["status"] == "claimed", claimed.json())
    check(
        "second claimer blocked",
        client.post(
            f"/api/bounties/{target['id']}/claim", headers=OTHER_STUDENT
        ).status_code
        == 409,
    )

    others = [b for b in bounties if b["id"] != target["id"]]
    client.post(f"/api/bounties/{others[0]['id']}/claim", headers=STUDENT)
    third = client.post(f"/api/bounties/{others[1]['id']}/claim", headers=STUDENT)
    check("claim cap of 2 enforced", third.status_code == 409, third.text)
    client.post(f"/api/bounties/{others[0]['id']}/release", headers=STUDENT)

    mine = client.get("/api/me/claims", headers=STUDENT).json()
    check("my claims shows one active claim", len(mine) == 1, mine)

    print("submissions")
    wrong_repo = client.post(
        f"/api/bounties/{target['id']}/submit",
        json={"pr_url": "https://github.com/someone/else/pull/4"},
        headers=STUDENT,
    )
    check("PR against wrong repo rejected", wrong_repo.status_code == 400, wrong_repo.text)
    bad_url = client.post(
        f"/api/bounties/{target['id']}/submit",
        json={"pr_url": "not-a-url"},
        headers=STUDENT,
    )
    check("malformed PR URL rejected", bad_url.status_code == 400, bad_url.text)

    open_pr = client.post(
        f"/api/bounties/{target['id']}/submit",
        json={"pr_url": "https://github.com/campus/coursemap/pull/1"},
        headers=STUDENT,
    )
    check("submission accepted", open_pr.status_code == 201, open_pr.text)
    submission = open_pr.json()
    check("CI status cached", submission["ci_status"] == "success", submission)
    check("PR state cached", submission["pr_state"] == "open", submission)
    check(
        "bounty moved to in_review",
        client.get(f"/api/bounties/{target['id']}").json()["status"] == "in_review",
    )

    print("reviews")
    queue = client.get("/api/reviews", headers=MAINTAINER).json()
    check("review queue shows submission", len(queue) == 1, queue)
    check(
        "students cannot see review queue",
        client.get("/api/reviews", headers=STUDENT).status_code == 403,
    )

    unmerged_approve = client.post(
        f"/api/reviews/{submission['id']}",
        json={"decision": "approve"},
        headers=MAINTAINER,
    )
    check(
        "approve blocked while PR unmerged",
        unmerged_approve.status_code == 409,
        unmerged_approve.text,
    )

    changes = client.post(
        f"/api/reviews/{submission['id']}",
        json={"decision": "request_changes", "note": "Please add a test"},
        headers=MAINTAINER,
    )
    check("request_changes recorded", changes.status_code == 200, changes.text)
    check(
        "bounty returns to claimed",
        client.get(f"/api/bounties/{target['id']}").json()["status"] == "claimed",
    )

    merged = client.post(
        f"/api/bounties/{target['id']}/submit",
        json={"pr_url": "https://github.com/campus/coursemap/pull/3"},
        headers=STUDENT,
    ).json()
    approved = client.post(
        f"/api/reviews/{merged['id']}", json={"decision": "approve"}, headers=MAINTAINER
    )
    check("merged PR approved", approved.status_code == 200, approved.text)
    final = client.get(f"/api/bounties/{target['id']}").json()
    check("bounty completed", final["status"] == "completed", final)
    check("claim released on completion", final["active_claim"] is None, final)

    print("reject path")
    reject_bounty = others[0]
    client.post(f"/api/bounties/{reject_bounty['id']}/claim", headers=OTHER_STUDENT)
    rejected_submission = client.post(
        f"/api/bounties/{reject_bounty['id']}/submit",
        json={"pr_url": "https://github.com/campus/coursemap/pull/2"},
        headers=OTHER_STUDENT,
    ).json()
    check("failing CI is surfaced", rejected_submission["ci_status"] == "failure", rejected_submission)
    client.post(
        f"/api/reviews/{rejected_submission['id']}",
        json={"decision": "reject", "note": "Out of scope"},
        headers=MAINTAINER,
    )
    reopened = client.get(f"/api/bounties/{reject_bounty['id']}").json()
    check("reject reopens bounty", reopened["status"] == "open", reopened)

    print("ideas")
    idea_resp = client.post(
        "/api/ideas",
        json={
            "title": "Bus tracker widget",
            "description": "Live shuttle ETAs on the home screen",
            "category": "feature",
            "repo_id": repo["id"],
        },
        headers=STUDENT,
    )
    check("idea created", idea_resp.status_code == 201, idea_resp.text)
    idea = idea_resp.json()

    client.post(f"/api/ideas/{idea['id']}/vote", json={"value": 1}, headers=STUDENT)
    voted = client.post(
        f"/api/ideas/{idea['id']}/vote", json={"value": 1}, headers=OTHER_STUDENT
    ).json()
    check("votes accumulate", voted["score"] == 2, voted)
    changed = client.post(
        f"/api/ideas/{idea['id']}/vote", json={"value": -1}, headers=OTHER_STUDENT
    ).json()
    check("vote can be changed", changed["score"] == 0, changed)
    removed = client.post(
        f"/api/ideas/{idea['id']}/vote", json={"value": 0}, headers=OTHER_STUDENT
    ).json()
    check("vote can be removed", removed["score"] == 1 and removed["vote_count"] == 1, removed)

    client.post(
        f"/api/ideas/{idea['id']}/comments",
        json={"body": "Would love this for late-night shuttles"},
        headers=OTHER_STUDENT,
    )
    detail = client.get(f"/api/ideas/{idea['id']}", headers=STUDENT).json()
    check("comment appears on detail", len(detail["comments"]) == 1, detail["comments"])
    check("viewer vote reflected", detail["my_vote"] == 1, detail)

    planned = client.patch(
        f"/api/ideas/{idea['id']}/status", json={"status": "planned"}, headers=MAINTAINER
    )
    check("maintainer sets status", planned.status_code == 200, planned.text)
    check(
        "student cannot set status",
        client.patch(
            f"/api/ideas/{idea['id']}/status", json={"status": "done"}, headers=STUDENT
        ).status_code
        == 403,
    )

    converted = client.post(f"/api/ideas/{idea['id']}/convert", headers=MAINTAINER)
    check("idea converts to bounty", converted.status_code == 201, converted.text)
    check(
        "converted bounty keeps title",
        converted.json()["title"] == "Bus tracker widget",
        converted.json(),
    )
    check(
        "double conversion blocked",
        client.post(f"/api/ideas/{idea['id']}/convert", headers=MAINTAINER).status_code
        == 409,
    )

    top = client.get("/api/ideas", params={"sort": "top"}).json()
    check("ideas list returns idea", len(top) == 1, top)

    print()
    if failures:
        print(f"{len(failures)} check(s) failed:")
        for name in failures:
            print(f"  - {name}")
        return 1
    print("All checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
