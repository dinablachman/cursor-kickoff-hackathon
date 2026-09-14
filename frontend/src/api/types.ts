export type Role = 'student' | 'maintainer'

export type BountyStatus = 'open' | 'claimed' | 'in_review' | 'completed'
export type BountySource = 'synced' | 'manual'
export type Difficulty = 'easy' | 'medium' | 'hard'

export type IdeaCategory = 'feature' | 'new-app'
export type IdeaStatus = 'open' | 'planned' | 'done'

export type CiStatus = 'passing' | 'failing' | 'pending' | 'none'
export type PrState = 'open' | 'merged' | 'closed'
export type ReviewDecision = 'approve' | 'request_changes' | 'reject'

export interface User {
  id: number
  github_username: string
  role: Role
}

export interface Repo {
  id: number
  owner: string
  name: string
  full_name: string
  description: string
  maintainer_id: number
  open_bounty_count: number
}

export interface Bounty {
  id: number
  repo_id: number
  title: string
  description: string
  difficulty: Difficulty
  status: BountyStatus
  source: BountySource
  github_issue_number?: number | null
  github_issue_url?: string | null
  claimer_id?: number | null
  claimer_username?: string | null
}

export interface Claim {
  id: number
  bounty_id: number
  user_id: number
  created_at: string
  active: boolean
  bounty?: Bounty
  submission?: Submission | null
}

export interface Submission {
  id: number
  claim_id: number
  bounty_id: number
  pr_url: string
  pr_state: PrState
  ci_status: CiStatus
  review_decision?: ReviewDecision | null
  bounty_title?: string
  submitter_username?: string
}

export interface Idea {
  id: number
  title: string
  description: string
  category: IdeaCategory
  status: IdeaStatus
  repo_id?: number | null
  repo_name?: string | null
  author_id: number
  author_username: string
  score: number
  my_vote?: -1 | 0 | 1
  created_at: string
}

export interface IdeaComment {
  id: number
  idea_id: number
  user_id: number
  username: string
  body: string
  created_at: string
}

export interface LoginRequest {
  username: string
  role: Role
}

export interface CreateRepoRequest {
  owner: string
  name: string
  description?: string
}

export interface CreateBountyRequest {
  repo_id: number
  title: string
  description: string
  difficulty: Difficulty
}

export interface CreateIdeaRequest {
  title: string
  description: string
  category: IdeaCategory
  repo_id?: number | null
}

export interface CreateCommentRequest {
  body: string
}

export interface SubmitPrRequest {
  pr_url: string
}

export interface ReviewRequest {
  decision: ReviewDecision
}
