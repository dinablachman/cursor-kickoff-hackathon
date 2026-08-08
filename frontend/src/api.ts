const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type Identity = { username: string; role: "student" | "maintainer" };

export type User = { id: number; github_username: string; role: string };

export type Repo = {
  id: number;
  owner: string;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string | null;
  bounty_label: string;
  maintainer: User;
  last_synced_at: string | null;
  open_bounties: number;
};

export type Submission = {
  id: number;
  claim_id: number;
  bounty_id: number;
  bounty_title: string;
  repo_full_name: string;
  submitter: User;
  pr_url: string;
  pr_number: number | null;
  pr_state: string | null;
  pr_author: string | null;
  ci_status: string | null;
  review_decision: string;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type Bounty = {
  id: number;
  repo_id: number;
  repo_full_name: string;
  title: string;
  description: string | null;
  difficulty: string;
  status: string;
  source: string;
  github_issue_number: number | null;
  github_issue_url: string | null;
  created_at: string;
  active_claim: { id: number; user: User; created_at: string } | null;
  latest_submission: Submission | null;
};

export type MyClaim = {
  claim_id: number;
  bounty: Bounty;
  claimed_at: string;
  released_at: string | null;
  submission: Submission | null;
};

export type Idea = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  status: string;
  repo_id: number | null;
  repo_full_name: string | null;
  author: User;
  score: number;
  vote_count: number;
  my_vote: number;
  comment_count: number;
  converted_bounty_id: number | null;
  created_at: string;
};

export type IdeaComment = {
  id: number;
  idea_id: number;
  author: User;
  body: string;
  created_at: string;
};

export type IdeaDetail = Idea & { comments: IdeaComment[] };

export class ApiError extends Error {}

async function request<T>(
  path: string,
  identity: Identity,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-GitHub-Username": identity.username,
      "X-Role": identity.role,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      // response had no JSON body; keep the status text
    }
    throw new ApiError(detail);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

const get = <T,>(path: string, identity: Identity) => request<T>(path, identity);
const post = <T,>(path: string, identity: Identity, body?: unknown) =>
  request<T>(path, identity, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const patch = <T,>(path: string, identity: Identity, body?: unknown) =>
  request<T>(path, identity, {
    method: "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
  });

export const api = {
  health: () => fetch(`${BASE_URL}/api/health`).then((r) => r.json()),

  listRepos: (identity: Identity) => get<Repo[]>("/api/repos", identity),
  registerRepo: (identity: Identity, fullName: string, bountyLabel?: string) =>
    post<Repo>("/api/repos", identity, {
      full_name: fullName,
      bounty_label: bountyLabel || undefined,
    }),
  syncRepo: (identity: Identity, repoId: number) =>
    post<{ created: number; updated: number; total_issues: number; source: string }>(
      `/api/repos/${repoId}/sync`,
      identity,
    ),

  listBounties: (identity: Identity, filters: Record<string, string> = {}) => {
    const query = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value !== ""),
    ).toString();
    return get<Bounty[]>(`/api/bounties${query ? `?${query}` : ""}`, identity);
  },
  getBounty: (identity: Identity, id: number) => get<Bounty>(`/api/bounties/${id}`, identity),
  createBounty: (
    identity: Identity,
    payload: { repo_id: number; title: string; description?: string; difficulty: string },
  ) => post<Bounty>("/api/bounties", identity, payload),
  claimBounty: (identity: Identity, id: number) =>
    post<Bounty>(`/api/bounties/${id}/claim`, identity),
  releaseBounty: (identity: Identity, id: number) =>
    post<Bounty>(`/api/bounties/${id}/release`, identity),
  submitPr: (identity: Identity, id: number, prUrl: string) =>
    post<Submission>(`/api/bounties/${id}/submit`, identity, { pr_url: prUrl }),

  myClaims: (identity: Identity) => get<MyClaim[]>("/api/me/claims", identity),
  refreshSubmission: (identity: Identity, id: number) =>
    post<Submission>(`/api/submissions/${id}/refresh`, identity),

  reviewQueue: (identity: Identity) => get<Submission[]>("/api/reviews", identity),
  review: (identity: Identity, submissionId: number, decision: string, note?: string) =>
    post<Submission>(`/api/reviews/${submissionId}`, identity, { decision, note }),

  listIdeas: (identity: Identity, filters: Record<string, string> = {}) => {
    const query = new URLSearchParams(
      Object.entries(filters).filter(([, value]) => value !== ""),
    ).toString();
    return get<Idea[]>(`/api/ideas${query ? `?${query}` : ""}`, identity);
  },
  getIdea: (identity: Identity, id: number) => get<IdeaDetail>(`/api/ideas/${id}`, identity),
  createIdea: (
    identity: Identity,
    payload: { title: string; description?: string; category: string; repo_id?: number | null },
  ) => post<Idea>("/api/ideas", identity, payload),
  voteIdea: (identity: Identity, id: number, value: number) =>
    post<Idea>(`/api/ideas/${id}/vote`, identity, { value }),
  commentOnIdea: (identity: Identity, id: number, body: string) =>
    post<IdeaComment>(`/api/ideas/${id}/comments`, identity, { body }),
  setIdeaStatus: (identity: Identity, id: number, status: string) =>
    patch<Idea>(`/api/ideas/${id}/status`, identity, { status }),
  convertIdea: (identity: Identity, id: number) =>
    post<Bounty>(`/api/ideas/${id}/convert`, identity),
};
