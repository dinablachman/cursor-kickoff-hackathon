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
import {
  currentMockUser,
  mockBounties,
  mockClaims,
  mockComments,
  mockIdeas,
  mockRepos,
  mockSubmissions,
  nextMockId,
  recomputeOpenBountyCounts,
  setCurrentMockUser,
} from '@/data/mockStore'

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms))
}

function requireUser(): User {
  if (!currentMockUser) throw new Error('Not logged in')
  return currentMockUser
}

function enrichClaim(claim: Claim): Claim {
  const bounty = mockBounties.find((b) => b.id === claim.bounty_id)
  const submission = mockSubmissions.find((s) => s.claim_id === claim.id) ?? null
  return { ...claim, bounty, submission }
}

export const mockApi = {
  async login(body: LoginRequest): Promise<User> {
    const user: User = {
      id: nextMockId(),
      github_username: body.username,
      role: body.role,
    }
    setCurrentMockUser(user)
    return delay(user)
  },

  async getRepos(): Promise<Repo[]> {
    recomputeOpenBountyCounts()
    return delay(mockRepos)
  },

  async createRepo(body: CreateRepoRequest): Promise<Repo> {
    requireUser()
    const repo: Repo = {
      id: nextMockId(),
      owner: body.owner,
      name: body.name,
      full_name: `${body.owner}/${body.name}`,
      description: body.description ?? '',
      maintainer_id: currentMockUser!.id,
      open_bounty_count: 0,
    }
    mockRepos.push(repo)
    return delay(repo)
  },

  async syncRepo(repoId: number): Promise<{ synced: number }> {
    requireUser()
    const exists = mockRepos.some((r) => r.id === repoId)
    if (!exists) throw new Error('Repo not found')
    return delay({ synced: 0 })
  },

  async getBounties(params?: {
    repo_id?: number
    difficulty?: string
    status?: string
  }): Promise<Bounty[]> {
    let list = [...mockBounties]
    if (params?.repo_id != null) list = list.filter((b) => b.repo_id === params.repo_id)
    if (params?.difficulty) list = list.filter((b) => b.difficulty === params.difficulty)
    if (params?.status) list = list.filter((b) => b.status === params.status)
    return delay(list)
  },

  async getBounty(id: number): Promise<Bounty> {
    const bounty = mockBounties.find((b) => b.id === id)
    if (!bounty) throw new Error('Bounty not found')
    return delay(bounty)
  },

  async createBounty(body: CreateBountyRequest): Promise<Bounty> {
    requireUser()
    const bounty: Bounty = {
      id: nextMockId(),
      repo_id: body.repo_id,
      title: body.title,
      description: body.description,
      difficulty: body.difficulty,
      status: 'open',
      source: 'manual',
    }
    mockBounties.push(bounty)
    recomputeOpenBountyCounts()
    return delay(bounty)
  },

  async claimBounty(id: number): Promise<Claim> {
    const user = requireUser()
    const bounty = mockBounties.find((b) => b.id === id)
    if (!bounty) throw new Error('Bounty not found')
    if (bounty.status !== 'open') throw new Error('Bounty is not open')
    const activeClaims = mockClaims.filter((c) => c.user_id === user.id && c.active)
    if (activeClaims.length >= 2) throw new Error('You already have 2 active claims')

    bounty.status = 'claimed'
    bounty.claimer_id = user.id
    bounty.claimer_username = user.github_username
    const claim: Claim = {
      id: nextMockId(),
      bounty_id: id,
      user_id: user.id,
      created_at: new Date().toISOString(),
      active: true,
    }
    mockClaims.push(claim)
    recomputeOpenBountyCounts()
    return delay(enrichClaim(claim))
  },

  async releaseBounty(id: number): Promise<Bounty> {
    const user = requireUser()
    const bounty = mockBounties.find((b) => b.id === id)
    if (!bounty) throw new Error('Bounty not found')
    if (bounty.claimer_id !== user.id && user.role !== 'maintainer') {
      throw new Error('Not your claim')
    }
    bounty.status = 'open'
    bounty.claimer_id = null
    bounty.claimer_username = null
    mockClaims.forEach((c) => {
      if (c.bounty_id === id && c.active) c.active = false
    })
    recomputeOpenBountyCounts()
    return delay(bounty)
  },

  async getMyClaims(): Promise<Claim[]> {
    const user = requireUser()
    return delay(
      mockClaims.filter((c) => c.user_id === user.id && c.active).map(enrichClaim),
    )
  },

  async submitPr(claimId: number, pr_url: string): Promise<Submission> {
    const user = requireUser()
    const claim = mockClaims.find((c) => c.id === claimId && c.user_id === user.id)
    if (!claim) throw new Error('Claim not found')
    const bounty = mockBounties.find((b) => b.id === claim.bounty_id)
    if (!bounty) throw new Error('Bounty not found')
    bounty.status = 'in_review'
    const submission: Submission = {
      id: nextMockId(),
      claim_id: claimId,
      bounty_id: bounty.id,
      pr_url,
      pr_state: 'open',
      ci_status: 'pending',
      bounty_title: bounty.title,
      submitter_username: user.github_username,
    }
    mockSubmissions.push(submission)
    // Simulate CI finishing
    setTimeout(() => {
      submission.ci_status = Math.random() > 0.3 ? 'passing' : 'failing'
    }, 1500)
    return delay(submission)
  },

  async getPendingSubmissions(): Promise<Submission[]> {
    requireUser()
    return delay(
      mockSubmissions.filter((s) => !s.review_decision && s.pr_state === 'open'),
    )
  },

  async reviewSubmission(id: number, decision: ReviewDecision): Promise<Submission> {
    requireUser()
    const submission = mockSubmissions.find((s) => s.id === id)
    if (!submission) throw new Error('Submission not found')
    submission.review_decision = decision
    const bounty = mockBounties.find((b) => b.id === submission.bounty_id)
    const claim = mockClaims.find((c) => c.id === submission.claim_id)
    if (decision === 'approve') {
      submission.pr_state = 'merged'
      if (bounty) bounty.status = 'completed'
      if (claim) claim.active = false
    } else if (decision === 'request_changes') {
      if (bounty) bounty.status = 'claimed'
    } else if (decision === 'reject') {
      if (bounty) {
        bounty.status = 'open'
        bounty.claimer_id = null
        bounty.claimer_username = null
      }
      if (claim) claim.active = false
    }
    recomputeOpenBountyCounts()
    return delay(submission)
  },

  async getIdeas(params?: {
    category?: string
    sort?: 'top' | 'newest'
  }): Promise<Idea[]> {
    let list = [...mockIdeas]
    if (params?.category) list = list.filter((i) => i.category === params.category)
    if (params?.sort === 'newest') {
      list.sort((a, b) => b.created_at.localeCompare(a.created_at))
    } else {
      list.sort((a, b) => b.score - a.score)
    }
    return delay(list)
  },

  async getIdea(id: number): Promise<Idea> {
    const idea = mockIdeas.find((i) => i.id === id)
    if (!idea) throw new Error('Idea not found')
    return delay(idea)
  },

  async createIdea(body: CreateIdeaRequest): Promise<Idea> {
    const user = requireUser()
    const repo = body.repo_id ? mockRepos.find((r) => r.id === body.repo_id) : null
    const idea: Idea = {
      id: nextMockId(),
      title: body.title,
      description: body.description,
      category: body.category,
      status: 'open',
      repo_id: body.repo_id ?? null,
      repo_name: repo?.full_name ?? null,
      author_id: user.id,
      author_username: user.github_username,
      score: 0,
      my_vote: 0,
      created_at: new Date().toISOString(),
    }
    mockIdeas.unshift(idea)
    return delay(idea)
  },

  async voteIdea(id: number, value: 1 | -1): Promise<Idea> {
    requireUser()
    const idea = mockIdeas.find((i) => i.id === id)
    if (!idea) throw new Error('Idea not found')
    const prev = idea.my_vote ?? 0
    if (prev === value) {
      idea.score -= value
      idea.my_vote = 0
    } else {
      idea.score += value - prev
      idea.my_vote = value
    }
    return delay(idea)
  },

  async removeVote(id: number): Promise<Idea> {
    requireUser()
    const idea = mockIdeas.find((i) => i.id === id)
    if (!idea) throw new Error('Idea not found')
    if (idea.my_vote) {
      idea.score -= idea.my_vote
      idea.my_vote = 0
    }
    return delay(idea)
  },

  async getComments(ideaId: number): Promise<IdeaComment[]> {
    return delay(mockComments.filter((c) => c.idea_id === ideaId))
  },

  async createComment(ideaId: number, body: CreateCommentRequest): Promise<IdeaComment> {
    const user = requireUser()
    const comment: IdeaComment = {
      id: nextMockId(),
      idea_id: ideaId,
      user_id: user.id,
      username: user.github_username,
      body: body.body,
      created_at: new Date().toISOString(),
    }
    mockComments.push(comment)
    return delay(comment)
  },

  async updateIdeaStatus(id: number, status: IdeaStatus): Promise<Idea> {
    requireUser()
    const idea = mockIdeas.find((i) => i.id === id)
    if (!idea) throw new Error('Idea not found')
    idea.status = status
    return delay(idea)
  },

  async convertIdea(id: number): Promise<Bounty> {
    requireUser()
    const idea = mockIdeas.find((i) => i.id === id)
    if (!idea) throw new Error('Idea not found')
    if (!idea.repo_id) throw new Error('Idea has no linked repo')
    const bounty: Bounty = {
      id: nextMockId(),
      repo_id: idea.repo_id,
      title: idea.title,
      description: idea.description,
      difficulty: 'medium',
      status: 'open',
      source: 'manual',
    }
    mockBounties.push(bounty)
    idea.status = 'planned'
    recomputeOpenBountyCounts()
    return delay(bounty)
  },
}
