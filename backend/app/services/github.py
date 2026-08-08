"""GitHub integration.

Uses the live REST API when ``GITHUB_TOKEN`` is set; otherwise falls back to
deterministic mock data so the app is demoable without credentials.
"""

from __future__ import annotations

import re
import zlib
from dataclasses import dataclass, field
from typing import Protocol

import httpx

from ..config import GITHUB_API_BASE, GITHUB_TOKEN

PR_URL_PATTERN = re.compile(
    r"^https?://(?:www\.)?github\.com/([\w.-]+)/([\w.-]+)/pull/(\d+)/?$",
    re.IGNORECASE,
)

CI_SUCCESS = "success"
CI_FAILURE = "failure"
CI_PENDING = "pending"
CI_NONE = "none"


class GitHubError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


@dataclass
class RepoInfo:
    owner: str
    name: str
    description: str | None
    html_url: str

    @property
    def full_name(self) -> str:
        return f"{self.owner}/{self.name}"


@dataclass
class IssueInfo:
    number: int
    title: str
    body: str | None
    html_url: str
    labels: list[str] = field(default_factory=list)


@dataclass
class PullRequestRef:
    owner: str
    name: str
    number: int

    @property
    def full_name(self) -> str:
        return f"{self.owner}/{self.name}"


@dataclass
class PullRequestInfo:
    number: int
    state: str  # open | merged | closed
    author: str | None
    base_repo_full_name: str
    ci_status: str  # success | failure | pending | none
    html_url: str


def parse_pr_url(pr_url: str) -> PullRequestRef:
    match = PR_URL_PATTERN.match((pr_url or "").strip())
    if not match:
        raise GitHubError(
            "PR URL must look like https://github.com/owner/repo/pull/123",
            status_code=400,
        )
    owner, name, number = match.groups()
    return PullRequestRef(owner=owner, name=name, number=int(number))


def parse_repo_full_name(full_name: str) -> tuple[str, str]:
    parts = (full_name or "").strip().strip("/").split("/")
    if len(parts) != 2 or not all(parts):
        raise GitHubError("Repo must be in the form owner/name", status_code=400)
    return parts[0], parts[1]


class GitHubService(Protocol):
    mode: str

    def validate_repo(self, owner: str, name: str) -> RepoInfo: ...

    def list_bounty_issues(self, owner: str, name: str, label: str) -> list[IssueInfo]: ...

    def get_pull_request(self, ref: PullRequestRef) -> PullRequestInfo: ...


class LiveGitHubService:
    mode = "live"

    def __init__(self, token: str):
        self._client = httpx.Client(
            base_url=GITHUB_API_BASE,
            headers={
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
            timeout=15.0,
        )

    def _get(self, path: str, **params) -> httpx.Response:
        try:
            response = self._client.get(path, params=params or None)
        except httpx.HTTPError as exc:
            raise GitHubError(f"GitHub request failed: {exc}") from exc
        if response.status_code == 404:
            raise GitHubError(f"Not found on GitHub: {path}", status_code=404)
        if response.status_code >= 400:
            raise GitHubError(
                f"GitHub API error {response.status_code}: {response.text[:200]}"
            )
        return response

    def validate_repo(self, owner: str, name: str) -> RepoInfo:
        data = self._get(f"/repos/{owner}/{name}").json()
        return RepoInfo(
            owner=data["owner"]["login"],
            name=data["name"],
            description=data.get("description"),
            html_url=data["html_url"],
        )

    def list_bounty_issues(self, owner: str, name: str, label: str) -> list[IssueInfo]:
        data = self._get(
            f"/repos/{owner}/{name}/issues",
            labels=label,
            state="open",
            per_page=100,
        ).json()
        issues: list[IssueInfo] = []
        for item in data:
            if "pull_request" in item:
                continue
            issues.append(
                IssueInfo(
                    number=item["number"],
                    title=item["title"],
                    body=item.get("body"),
                    html_url=item["html_url"],
                    labels=[label_item["name"] for label_item in item.get("labels", [])],
                )
            )
        return issues

    def get_pull_request(self, ref: PullRequestRef) -> PullRequestInfo:
        data = self._get(f"/repos/{ref.owner}/{ref.name}/pulls/{ref.number}").json()
        if data.get("merged"):
            state = "merged"
        else:
            state = data.get("state", "open")

        head_sha = (data.get("head") or {}).get("sha")
        return PullRequestInfo(
            number=data["number"],
            state=state,
            author=(data.get("user") or {}).get("login"),
            base_repo_full_name=(data.get("base") or {}).get("repo", {}).get(
                "full_name", f"{ref.owner}/{ref.name}"
            ),
            ci_status=self._ci_status(ref, head_sha) if head_sha else CI_NONE,
            html_url=data.get("html_url", ""),
        )

    def _ci_status(self, ref: PullRequestRef, sha: str) -> str:
        checks = self._get(f"/repos/{ref.owner}/{ref.name}/commits/{sha}/check-runs").json()
        runs = checks.get("check_runs", [])
        if runs:
            if any(run.get("status") != "completed" for run in runs):
                return CI_PENDING
            conclusions = {run.get("conclusion") for run in runs}
            if conclusions & {"failure", "timed_out", "cancelled", "action_required"}:
                return CI_FAILURE
            return CI_SUCCESS

        combined = self._get(f"/repos/{ref.owner}/{ref.name}/commits/{sha}/status").json()
        state = combined.get("state")
        if not combined.get("statuses"):
            return CI_NONE
        return {
            "success": CI_SUCCESS,
            "failure": CI_FAILURE,
            "error": CI_FAILURE,
            "pending": CI_PENDING,
        }.get(state, CI_NONE)


# Fixture issues mirroring ShawnLi14's public campus demo apps (mock mode / offline demos).
DEMO_REPO_ISSUES: dict[str, list[tuple[int, str, str, str]]] = {
    "ShawnLi14/campus-ride": [
        (
            1,
            "Arrival board sorts ETAs lexicographically instead of by soonest arrival",
            "ETA cards order by label text, so \"12 min\" can appear before \"3 min\".",
            "easy",
        ),
        (
            2,
            "Wheelchair accessibility filter does not restore hidden shuttles when disabled",
            "Turning off wheelchair-accessible-only does not restore filtered shuttles until refresh.",
            "medium",
        ),
    ],
    "ShawnLi14/study-spot": [
        (
            1,
            "Back-to-back room bookings are rejected as overlapping",
            "Adjacent slots that only share an endpoint are treated as conflicts.",
            "medium",
        ),
        (
            2,
            "Minimum capacity filter only shows exact capacity matches",
            "A 4+ seats filter hides rooms larger than 4.",
            "easy",
        ),
    ],
    "ShawnLi14/campus-bites-api": [
        (
            1,
            "Excluding multiple allergens still returns dishes containing one of them",
            "Multi-allergen exclusion uses AND semantics instead of removing any match.",
            "medium",
        ),
        (
            2,
            "Sold-out menu items still appear when available_only=true",
            "Dishes with remaining == 0 are still returned as available.",
            "easy",
        ),
    ],
}

DEMO_REPO_DESCRIPTIONS = {
    "ShawnLi14/campus-ride": "Demo campus shuttle arrival board for Campus Bug Bounty Board",
    "ShawnLi14/study-spot": "Demo study room booking app for Campus Bug Bounty Board",
    "ShawnLi14/campus-bites-api": "Demo campus dining API for Campus Bug Bounty Board",
}


class MockGitHubService:
    """Deterministic stand-in used when no token is configured.

    Known ShawnLi14 demo repos return their real bounty fixtures. For other repos,
    PR number drives the outcome so demos can hit every branch on purpose:
    ``%3 == 0`` merged + passing, ``%3 == 1`` open + passing, else open + failing.

    Fixture PR shortcuts for the live walkthrough:
    - campus-ride #3 → open + failing CI (request-changes path)
    - study-spot #3 → open + passing CI (approve path)
    """

    mode = "mock"

    def validate_repo(self, owner: str, name: str) -> RepoInfo:
        full_name = f"{owner}/{name}"
        return RepoInfo(
            owner=owner,
            name=name,
            description=DEMO_REPO_DESCRIPTIONS.get(
                full_name, f"Mock repo for {full_name} (no GITHUB_TOKEN configured)"
            ),
            html_url=f"https://github.com/{full_name}",
        )

    def list_bounty_issues(self, owner: str, name: str, label: str) -> list[IssueInfo]:
        full_name = f"{owner}/{name}"
        fixtures = DEMO_REPO_ISSUES.get(full_name)
        if fixtures is not None:
            return [
                IssueInfo(
                    number=number,
                    title=title,
                    body=body,
                    html_url=f"https://github.com/{full_name}/issues/{number}",
                    labels=[label, f"difficulty: {difficulty}"],
                )
                for number, title, body, difficulty in fixtures
            ]

        # crc32, not hash(): issue numbers must stay stable across processes so
        # re-syncing a repo updates the same bounties instead of duplicating them.
        seed = zlib.crc32(full_name.encode()) % 50
        templates = [
            ("Fix crash on empty search query", "easy"),
            ("Dark mode toggle resets on reload", "medium"),
            ("Course schedule export drops timezone", "hard"),
        ]
        issues = []
        for index, (title, difficulty) in enumerate(templates):
            number = seed + index + 1
            issues.append(
                IssueInfo(
                    number=number,
                    title=title,
                    body=f"Mock issue for {full_name}. Difficulty hint: {difficulty}.",
                    html_url=f"https://github.com/{full_name}/issues/{number}",
                    labels=[label, difficulty],
                )
            )
        return issues

    def get_pull_request(self, ref: PullRequestRef) -> PullRequestInfo:
        # Match the prepared demo PRs on the public campus apps.
        if ref.full_name.lower() == "shawnli14/campus-ride" and ref.number == 3:
            state, ci = "open", CI_FAILURE
        elif ref.full_name.lower() == "shawnli14/study-spot" and ref.number == 3:
            state, ci = "open", CI_SUCCESS
        else:
            bucket = ref.number % 3
            if bucket == 0:
                state, ci = "merged", CI_SUCCESS
            elif bucket == 1:
                state, ci = "open", CI_SUCCESS
            else:
                state, ci = "open", CI_FAILURE
        return PullRequestInfo(
            number=ref.number,
            state=state,
            author=None,
            base_repo_full_name=ref.full_name,
            ci_status=ci,
            html_url=f"https://github.com/{ref.full_name}/pull/{ref.number}",
        )


_service: GitHubService | None = None


def get_github_service() -> GitHubService:
    global _service
    if _service is None:
        _service = LiveGitHubService(GITHUB_TOKEN) if GITHUB_TOKEN else MockGitHubService()
    return _service
