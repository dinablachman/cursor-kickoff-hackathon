import type {
  Bounty,
  CiStatus,
  Claim,
  CreateBountyRequest,
  CreateCommentRequest,
  CreateIdeaRequest,
  CreateRepoRequest,
  Idea,
  IdeaComment,
  IdeaStatus,
  LoginRequest,
  PrState,
  Repo,
  ReviewDecision,
  Role,
  Submission,
  User,
} from '@/api/types'
import { mockApi } from '@/data/mockApi'
import { setCurrentMockUser } from '@/data/mockStore'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

let identity: { username: string; role: Role } | null = null

export function setAuthUsername(username: string | null, role: Role = 'student') {
  identity = username ? { username, role } : null
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  if (identity) {
    headers.set('X-GitHub-Username', identity.username)
    headers.set('X-Role', identity.role)
  }

  const res = await fetch(`/api${path}`, { ...init, headers })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      if (typeof body?.detail === 'string') message = body.detail
      else if (body?.detail) message = JSON.stringify(body.detail)
    } catch {
      // non-JSON error body; keep statusText
    }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Backend response shapes (FastAPI schemas.py) and mappers to frontend types.
// The backend nests users (maintainer/author/submitter) and the active claim;
// the UI types are flat, so we translate here and nowhere else.
// ---------------------------------------------------------------------------

interface BackendUser {
  id: number
  github_username: string
  role: Role
}

interface BackendRepo {
  id: number
  owner: string
  name: string
  full_name: string
  description: string | null
  maintainer: BackendUser
  open_bounties: number
}

interface BackendClaimSummary {
  id: number
  user: BackendUser
  created_at: string
  released_at: string | null
}

interface BackendSubmission {
  id: number
  claim_id: number
  bounty_id: number
  bounty_title: string
  submitter: BackendUser
  pr_url: string
  pr_state: string | null
  ci_status: string | null
  review_decision: string
}

interface BackendBounty {
  id: number
  repo_id: number
  title: string
  description: string | null
  difficulty: Bounty['difficulty']
  status: Bounty['status']
  source: Bounty['source']
  github_issue_number: number | null
  github_issue_url: string | null
  active_claim: BackendClaimSummary | null
  latest_submission: BackendSubmission | null
}

interface BackendSyncResult {
  created: number
  updated: number
}

interface BackendMyClaim {
  claim_id: number
  bounty: BackendBounty
  claimed_at: string
  released_at: string | null
  submission: BackendSubmission | null
}

interface BackendIdea {
  id: number
  title: string
  description: string | null
  category: Idea['category']
  status: Idea['status']
  repo_id: number | null
  repo_full_name: string | null
  author: BackendUser
  score: number
  my_vote: number
  created_at: string
}

interface BackendIdeaComment {
  id: number
  idea_id: number
  author: BackendUser
  body: string
  created_at: string
}

function mapRepo(r: BackendRepo): Repo {
  return {
    id: r.id,
    owner: r.owner,
    name: r.name,
    full_name: r.full_name,
    description: r.description ?? '',
    maintainer_id: r.maintainer.id,
    open_bounty_count: r.open_bounties,
  }
}

function mapCiStatus(status: string | null): CiStatus {
  if (status === 'success') return 'passing'
  if (status === 'failure') return 'failing'
  if (status === 'pending') return 'pending'
  return 'none'
}

function mapDecision(decision: string): ReviewDecision | null {
  if (decision === 'approved') return 'approve'
  if (decision === 'changes_requested') return 'request_changes'
  if (decision === 'rejected') return 'reject'
  return null
}

function mapSubmission(s: BackendSubmission): Submission {
  return {
    id: s.id,
    claim_id: s.claim_id,
    bounty_id: s.bounty_id,
    pr_url: s.pr_url,
    pr_state: (s.pr_state ?? 'open') as PrState,
    ci_status: mapCiStatus(s.ci_status),
    review_decision: mapDecision(s.review_decision),
    bounty_title: s.bounty_title,
    submitter_username: s.submitter.github_username,
  }
}

function mapBounty(b: BackendBounty): Bounty {
  return {
    id: b.id,
    repo_id: b.repo_id,
    title: b.title,
    description: b.description ?? '',
    difficulty: b.difficulty,
    status: b.status,
    source: b.source,
    github_issue_number: b.github_issue_number,
    github_issue_url: b.github_issue_url,
    claimer_id: b.active_claim?.user.id ?? null,
    claimer_username: b.active_claim?.user.github_username ?? null,
  }
}

function mapMyClaim(mc: BackendMyClaim): Claim {
  return {
    id: mc.claim_id,
    bounty_id: mc.bounty.id,
    user_id: mc.bounty.active_claim?.user.id ?? 0,
    created_at: mc.claimed_at,
    active: mc.released_at == null,
    bounty: mapBounty(mc.bounty),
    submission: mc.submission ? mapSubmission(mc.submission) : null,
  }
}

function mapIdea(i: BackendIdea): Idea {
  return {
    id: i.id,
    title: i.title,
    description: i.description ?? '',
    category: i.category,
    status: i.status,
    repo_id: i.repo_id,
    repo_name: i.repo_full_name,
    author_id: i.author.id,
    author_username: i.author.github_username,
    score: i.score,
    my_vote: i.my_vote as -1 | 0 | 1,
    created_at: i.created_at,
  }
}

function mapComment(c: BackendIdeaComment): IdeaComment {
  return {
    id: c.id,
    idea_id: c.idea_id,
    user_id: c.author.id,
    username: c.author.github_username,
    body: c.body,
    created_at: c.created_at,
  }
}

export const api = {
  async login(body: LoginRequest): Promise<User> {
    if (USE_MOCK) {
      const user = await mockApi.login(body)
      setAuthUsername(user.github_username, user.role)
      return user
    }
    // The backend has no login endpoint: identity travels in headers and the
    // user record is created on first authenticated request (GET /api/me).
    setAuthUsername(body.username, body.role)
    return request<BackendUser>('/me')
  },

  restoreSession(user: User | null) {
    setAuthUsername(user?.github_username ?? null, user?.role ?? 'student')
    if (USE_MOCK) setCurrentMockUser(user)
  },

  getRepos: (): Promise<Repo[]> =>
    USE_MOCK
      ? mockApi.getRepos()
      : request<BackendRepo[]>('/repos').then((repos) => repos.map(mapRepo)),

  createRepo: (body: CreateRepoRequest): Promise<Repo> =>
    USE_MOCK
      ? mockApi.createRepo(body)
      : request<BackendRepo>('/repos', {
          method: 'POST',
          body: JSON.stringify({
            full_name: `${body.owner}/${body.name}`,
            description: body.description || null,
          }),
        }).then(mapRepo),

  syncRepo: (repoId: number): Promise<{ synced: number }> =>
    USE_MOCK
      ? mockApi.syncRepo(repoId)
      : request<BackendSyncResult>(`/repos/${repoId}/sync`, { method: 'POST' }).then(
          (r) => ({ synced: r.created + r.updated }),
        ),

  getBounties: (params?: {
    repo_id?: number
    difficulty?: string
    status?: string
  }): Promise<Bounty[]> => {
    if (USE_MOCK) return mockApi.getBounties(params)
    const qs = new URLSearchParams()
    if (params?.repo_id != null) qs.set('repo_id', String(params.repo_id))
    if (params?.difficulty) qs.set('difficulty', params.difficulty)
    if (params?.status) qs.set('status', params.status)
    const q = qs.toString()
    return request<BackendBounty[]>(`/bounties${q ? `?${q}` : ''}`).then((list) =>
      list.map(mapBounty),
    )
  },

  getBounty: (id: number): Promise<Bounty> =>
    USE_MOCK
      ? mockApi.getBounty(id)
      : request<BackendBounty>(`/bounties/${id}`).then(mapBounty),

  createBounty: (body: CreateBountyRequest): Promise<Bounty> =>
    USE_MOCK
      ? mockApi.createBounty(body)
      : request<BackendBounty>('/bounties', {
          method: 'POST',
          body: JSON.stringify(body),
        }).then(mapBounty),

  claimBounty: async (id: number): Promise<Claim> => {
    if (USE_MOCK) return mockApi.claimBounty(id)
    const bounty = await request<BackendBounty>(`/bounties/${id}/claim`, {
      method: 'POST',
    })
    const claim = bounty.active_claim!
    return {
      id: claim.id,
      bounty_id: bounty.id,
      user_id: claim.user.id,
      created_at: claim.created_at,
      active: true,
      bounty: mapBounty(bounty),
      submission: null,
    }
  },

  releaseBounty: (id: number): Promise<Bounty> =>
    USE_MOCK
      ? mockApi.releaseBounty(id)
      : request<BackendBounty>(`/bounties/${id}/release`, { method: 'POST' }).then(
          mapBounty,
        ),

  getMyClaims: (): Promise<Claim[]> =>
    USE_MOCK
      ? mockApi.getMyClaims()
      : request<BackendMyClaim[]>('/me/claims').then((claims) =>
          claims.map(mapMyClaim),
        ),

  submitPr: async (claimId: number, pr_url: string): Promise<Submission> => {
    if (USE_MOCK) return mockApi.submitPr(claimId, pr_url)
    // The backend keys submissions by bounty, so resolve the claim first.
    const claims = await request<BackendMyClaim[]>('/me/claims')
    const claim = claims.find((c) => c.claim_id === claimId)
    if (!claim) throw new Error('Claim not found')
    return request<BackendSubmission>(`/bounties/${claim.bounty.id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ pr_url }),
    }).then(mapSubmission)
  },

  getPendingSubmissions: (): Promise<Submission[]> =>
    USE_MOCK
      ? mockApi.getPendingSubmissions()
      : request<BackendSubmission[]>('/reviews').then((list) =>
          list.map(mapSubmission),
        ),

  reviewSubmission: (id: number, decision: ReviewDecision): Promise<Submission> =>
    USE_MOCK
      ? mockApi.reviewSubmission(id, decision)
      : request<BackendSubmission>(`/reviews/${id}`, {
          method: 'POST',
          body: JSON.stringify({ decision }),
        }).then(mapSubmission),

  getIdeas: (params?: {
    category?: string
    sort?: 'top' | 'newest'
  }): Promise<Idea[]> => {
    if (USE_MOCK) return mockApi.getIdeas(params)
    const qs = new URLSearchParams()
    if (params?.category) qs.set('category', params.category)
    if (params?.sort) qs.set('sort', params.sort === 'newest' ? 'new' : 'top')
    const q = qs.toString()
    return request<BackendIdea[]>(`/ideas${q ? `?${q}` : ''}`).then((list) =>
      list.map(mapIdea),
    )
  },

  getIdea: (id: number): Promise<Idea> =>
    USE_MOCK ? mockApi.getIdea(id) : request<BackendIdea>(`/ideas/${id}`).then(mapIdea),

  createIdea: (body: CreateIdeaRequest): Promise<Idea> =>
    USE_MOCK
      ? mockApi.createIdea(body)
      : request<BackendIdea>('/ideas', {
          method: 'POST',
          body: JSON.stringify(body),
        }).then(mapIdea),

  voteIdea: async (id: number, value: 1 | -1): Promise<Idea> => {
    if (USE_MOCK) return mockApi.voteIdea(id, value)
    // Preserve the toggle UX: voting the same way twice clears the vote.
    const current = await request<BackendIdea>(`/ideas/${id}`)
    const next = current.my_vote === value ? 0 : value
    return request<BackendIdea>(`/ideas/${id}/vote`, {
      method: 'POST',
      body: JSON.stringify({ value: next }),
    }).then(mapIdea)
  },

  removeVote: (id: number): Promise<Idea> =>
    USE_MOCK
      ? mockApi.removeVote(id)
      : request<BackendIdea>(`/ideas/${id}/vote`, {
          method: 'POST',
          body: JSON.stringify({ value: 0 }),
        }).then(mapIdea),

  getComments: (ideaId: number): Promise<IdeaComment[]> =>
    USE_MOCK
      ? mockApi.getComments(ideaId)
      : request<BackendIdeaComment[]>(`/ideas/${ideaId}/comments`).then((list) =>
          list.map(mapComment),
        ),

  createComment: (ideaId: number, body: CreateCommentRequest): Promise<IdeaComment> =>
    USE_MOCK
      ? mockApi.createComment(ideaId, body)
      : request<BackendIdeaComment>(`/ideas/${ideaId}/comments`, {
          method: 'POST',
          body: JSON.stringify(body),
        }).then(mapComment),

  updateIdeaStatus: (id: number, status: IdeaStatus): Promise<Idea> =>
    USE_MOCK
      ? mockApi.updateIdeaStatus(id, status)
      : request<BackendIdea>(`/ideas/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }).then(mapIdea),

  convertIdea: (id: number): Promise<Bounty> =>
    USE_MOCK
      ? mockApi.convertIdea(id)
      : request<BackendBounty>(`/ideas/${id}/convert`, { method: 'POST' }).then(
          mapBounty,
        ),
}
