import type {
  Bounty,
  Claim,
  CreateBountyRequest,
  CreateCommentRequest,
  CreateIdeaRequest,
  CreateRepoRequest,
  Idea,
  IdeaComment,
  IdeaStatus,
  LoginRequest,
  Repo,
  ReviewDecision,
  Submission,
  User,
} from '@/api/types'
import { mockApi } from '@/data/mockApi'
import { setCurrentMockUser } from '@/data/mockStore'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

let authUsername: string | null = null

export function setAuthUsername(username: string | null) {
  authUsername = username
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')
  if (authUsername) headers.set('X-Username', authUsername)

  const res = await fetch(`/api${path}`, { ...init, headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const api = {
  async login(body: LoginRequest): Promise<User> {
    if (USE_MOCK) {
      const user = await mockApi.login(body)
      setAuthUsername(user.github_username)
      return user
    }
    const user = await request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    setAuthUsername(user.github_username)
    return user
  },

  restoreSession(user: User | null) {
    setAuthUsername(user?.github_username ?? null)
    if (USE_MOCK) setCurrentMockUser(user)
  },

  getRepos: (): Promise<Repo[]> =>
    USE_MOCK ? mockApi.getRepos() : request('/repos'),

  createRepo: (body: CreateRepoRequest): Promise<Repo> =>
    USE_MOCK
      ? mockApi.createRepo(body)
      : request('/repos', { method: 'POST', body: JSON.stringify(body) }),

  syncRepo: (repoId: number): Promise<{ synced: number }> =>
    USE_MOCK
      ? mockApi.syncRepo(repoId)
      : request(`/repos/${repoId}/sync`, { method: 'POST' }),

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
    return request(`/bounties${q ? `?${q}` : ''}`)
  },

  getBounty: (id: number): Promise<Bounty> =>
    USE_MOCK ? mockApi.getBounty(id) : request(`/bounties/${id}`),

  createBounty: (body: CreateBountyRequest): Promise<Bounty> =>
    USE_MOCK
      ? mockApi.createBounty(body)
      : request('/bounties', { method: 'POST', body: JSON.stringify(body) }),

  claimBounty: (id: number): Promise<Claim> =>
    USE_MOCK
      ? mockApi.claimBounty(id)
      : request(`/bounties/${id}/claim`, { method: 'POST' }),

  releaseBounty: (id: number): Promise<Bounty> =>
    USE_MOCK
      ? mockApi.releaseBounty(id)
      : request(`/bounties/${id}/release`, { method: 'POST' }),

  getMyClaims: (): Promise<Claim[]> =>
    USE_MOCK ? mockApi.getMyClaims() : request('/me/claims'),

  submitPr: (claimId: number, pr_url: string): Promise<Submission> =>
    USE_MOCK
      ? mockApi.submitPr(claimId, pr_url)
      : request(`/claims/${claimId}/submission`, {
          method: 'POST',
          body: JSON.stringify({ pr_url }),
        }),

  getPendingSubmissions: (): Promise<Submission[]> =>
    USE_MOCK
      ? mockApi.getPendingSubmissions()
      : request('/submissions?status=pending'),

  reviewSubmission: (id: number, decision: ReviewDecision): Promise<Submission> =>
    USE_MOCK
      ? mockApi.reviewSubmission(id, decision)
      : request(`/submissions/${id}/review`, {
          method: 'POST',
          body: JSON.stringify({ decision }),
        }),

  getIdeas: (params?: {
    category?: string
    sort?: 'top' | 'newest'
  }): Promise<Idea[]> => {
    if (USE_MOCK) return mockApi.getIdeas(params)
    const qs = new URLSearchParams()
    if (params?.category) qs.set('category', params.category)
    if (params?.sort) qs.set('sort', params.sort)
    const q = qs.toString()
    return request(`/ideas${q ? `?${q}` : ''}`)
  },

  getIdea: (id: number): Promise<Idea> =>
    USE_MOCK ? mockApi.getIdea(id) : request(`/ideas/${id}`),

  createIdea: (body: CreateIdeaRequest): Promise<Idea> =>
    USE_MOCK
      ? mockApi.createIdea(body)
      : request('/ideas', { method: 'POST', body: JSON.stringify(body) }),

  voteIdea: (id: number, value: 1 | -1): Promise<Idea> =>
    USE_MOCK
      ? mockApi.voteIdea(id, value)
      : request(`/ideas/${id}/vote`, {
          method: 'PUT',
          body: JSON.stringify({ value }),
        }),

  removeVote: (id: number): Promise<Idea> =>
    USE_MOCK
      ? mockApi.removeVote(id)
      : request(`/ideas/${id}/vote`, { method: 'DELETE' }),

  getComments: (ideaId: number): Promise<IdeaComment[]> =>
    USE_MOCK ? mockApi.getComments(ideaId) : request(`/ideas/${ideaId}/comments`),

  createComment: (ideaId: number, body: CreateCommentRequest): Promise<IdeaComment> =>
    USE_MOCK
      ? mockApi.createComment(ideaId, body)
      : request(`/ideas/${ideaId}/comments`, {
          method: 'POST',
          body: JSON.stringify(body),
        }),

  updateIdeaStatus: (id: number, status: IdeaStatus): Promise<Idea> =>
    USE_MOCK
      ? mockApi.updateIdeaStatus(id, status)
      : request(`/ideas/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }),

  convertIdea: (id: number): Promise<Bounty> =>
    USE_MOCK
      ? mockApi.convertIdea(id)
      : request(`/ideas/${id}/convert`, { method: 'POST' }),
}
