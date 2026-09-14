import type {
  Bounty,
  Claim,
  Idea,
  IdeaComment,
  Repo,
  Submission,
  User,
} from '@/api/types'

export const mockUsers: User[] = [
  { id: 1, github_username: 'alice', role: 'student' },
  { id: 2, github_username: 'bob', role: 'maintainer' },
  { id: 3, github_username: 'carol', role: 'student' },
]

/** Public demo apps under ShawnLi14 — seeded test targets for the board. */
export let mockRepos: Repo[] = [
  {
    id: 1,
    owner: 'ShawnLi14',
    name: 'campus-ride',
    full_name: 'ShawnLi14/campus-ride',
    description: 'Demo campus shuttle arrival board for Campus Bug Bounty Board',
    maintainer_id: 2,
    open_bounty_count: 1,
  },
  {
    id: 2,
    owner: 'ShawnLi14',
    name: 'study-spot',
    full_name: 'ShawnLi14/study-spot',
    description: 'Demo study room booking app for Campus Bug Bounty Board',
    maintainer_id: 2,
    open_bounty_count: 1,
  },
  {
    id: 3,
    owner: 'ShawnLi14',
    name: 'campus-bites-api',
    full_name: 'ShawnLi14/campus-bites-api',
    description: 'Demo campus dining API for Campus Bug Bounty Board',
    maintainer_id: 2,
    open_bounty_count: 2,
  },
]

export let mockBounties: Bounty[] = [
  {
    id: 1,
    repo_id: 1,
    title: 'Arrival board sorts ETAs lexicographically instead of by soonest arrival',
    description:
      'ETA cards order by label text, so "12 min" can appear before "3 min".',
    difficulty: 'easy',
    status: 'in_review',
    source: 'synced',
    github_issue_number: 1,
    github_issue_url: 'https://github.com/ShawnLi14/campus-ride/issues/1',
    claimer_id: 3,
    claimer_username: 'carol',
  },
  {
    id: 2,
    repo_id: 1,
    title: 'Wheelchair accessibility filter does not restore hidden shuttles when disabled',
    description:
      'Turning off wheelchair-accessible-only does not restore filtered shuttles until refresh.',
    difficulty: 'medium',
    status: 'open',
    source: 'synced',
    github_issue_number: 2,
    github_issue_url: 'https://github.com/ShawnLi14/campus-ride/issues/2',
  },
  {
    id: 3,
    repo_id: 2,
    title: 'Back-to-back room bookings are rejected as overlapping',
    description: 'Adjacent slots that only share an endpoint are treated as conflicts.',
    difficulty: 'medium',
    status: 'claimed',
    source: 'synced',
    github_issue_number: 1,
    github_issue_url: 'https://github.com/ShawnLi14/study-spot/issues/1',
    claimer_id: 1,
    claimer_username: 'alice',
  },
  {
    id: 4,
    repo_id: 2,
    title: 'Minimum capacity filter only shows exact capacity matches',
    description: 'A 4+ seats filter hides rooms larger than 4.',
    difficulty: 'easy',
    status: 'open',
    source: 'synced',
    github_issue_number: 2,
    github_issue_url: 'https://github.com/ShawnLi14/study-spot/issues/2',
  },
  {
    id: 5,
    repo_id: 3,
    title: 'Excluding multiple allergens still returns dishes containing one of them',
    description:
      'Multi-allergen exclusion uses AND semantics instead of removing any match.',
    difficulty: 'medium',
    status: 'open',
    source: 'synced',
    github_issue_number: 1,
    github_issue_url: 'https://github.com/ShawnLi14/campus-bites-api/issues/1',
  },
  {
    id: 6,
    repo_id: 3,
    title: 'Sold-out menu items still appear when available_only=true',
    description: 'Dishes with remaining == 0 are still returned as available.',
    difficulty: 'easy',
    status: 'open',
    source: 'synced',
    github_issue_number: 2,
    github_issue_url: 'https://github.com/ShawnLi14/campus-bites-api/issues/2',
  },
]

export let mockClaims: Claim[] = [
  {
    id: 1,
    bounty_id: 3,
    user_id: 1,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    active: true,
  },
  {
    id: 2,
    bounty_id: 1,
    user_id: 3,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    active: true,
  },
]

export let mockSubmissions: Submission[] = [
  {
    id: 1,
    claim_id: 2,
    bounty_id: 1,
    pr_url: 'https://github.com/ShawnLi14/campus-ride/pull/3',
    pr_state: 'open',
    ci_status: 'failing',
    bounty_title: 'Arrival board sorts ETAs lexicographically instead of by soonest arrival',
    submitter_username: 'carol',
  },
]

export let mockIdeas: Idea[] = [
  {
    id: 1,
    title: 'Campus laundry notifier',
    description: 'Push notifications when washer/dryer cycles finish in dorm laundry rooms.',
    category: 'new-app',
    status: 'open',
    author_id: 1,
    author_username: 'alice',
    score: 12,
    my_vote: 0,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 2,
    title: 'Favorite stop pin on the ride board',
    description: 'Pin a habitual stop so the arrival board scrolls it into view first.',
    category: 'feature',
    status: 'planned',
    repo_id: 1,
    repo_name: 'ShawnLi14/campus-ride',
    author_id: 3,
    author_username: 'carol',
    score: 8,
    my_vote: 0,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 3,
    title: 'Roommate chore splitter',
    description: 'Split chores and groceries fairly among roommates with reminders.',
    category: 'new-app',
    status: 'planned',
    author_id: 1,
    author_username: 'alice',
    score: 5,
    my_vote: 0,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 4,
    title: 'Show popular booking hours',
    description: 'Chart the busiest study-room slots so students can plan around them.',
    category: 'feature',
    status: 'open',
    repo_id: 2,
    repo_name: 'ShawnLi14/study-spot',
    author_id: 3,
    author_username: 'carol',
    score: 3,
    my_vote: 0,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
]

export let mockComments: IdeaComment[] = [
  {
    id: 1,
    idea_id: 1,
    user_id: 3,
    username: 'carol',
    body: 'Would love this — laundry rooms are chaos during midterms.',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 2,
    idea_id: 1,
    user_id: 2,
    username: 'bob',
    body: 'If we get IoT sensors from facilities, this is totally doable.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
]

export function recomputeOpenBountyCounts() {
  mockRepos = mockRepos.map((repo) => ({
    ...repo,
    open_bounty_count: mockBounties.filter(
      (b) => b.repo_id === repo.id && b.status === 'open',
    ).length,
  }))
}

let nextId = 100

export function nextMockId() {
  nextId += 1
  return nextId
}

export let currentMockUser: User | null = null

export function setCurrentMockUser(user: User | null) {
  currentMockUser = user
}
