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

export let mockRepos: Repo[] = [
  {
    id: 1,
    owner: 'campus',
    name: 'dining-menu',
    full_name: 'campus/dining-menu',
    description: 'Live dining hall menus and hours for campus.',
    maintainer_id: 2,
    open_bounty_count: 2,
  },
  {
    id: 2,
    owner: 'campus',
    name: 'course-planner',
    full_name: 'campus/course-planner',
    description: 'Plan your semester schedule across departments.',
    maintainer_id: 2,
    open_bounty_count: 1,
  },
  {
    id: 3,
    owner: 'campus',
    name: 'bus-tracker',
    full_name: 'campus/bus-tracker',
    description: 'Real-time campus shuttle tracking.',
    maintainer_id: 2,
    open_bounty_count: 3,
  },
  {
    id: 4,
    owner: 'campus',
    name: 'club-finder',
    full_name: 'campus/club-finder',
    description: 'Discover and join student organizations.',
    maintainer_id: 2,
    open_bounty_count: 0,
  },
  {
    id: 5,
    owner: 'campus',
    name: 'study-rooms',
    full_name: 'campus/study-rooms',
    description: 'Book library and student center study rooms.',
    maintainer_id: 2,
    open_bounty_count: 1,
  },
]

export let mockBounties: Bounty[] = [
  {
    id: 1,
    repo_id: 1,
    title: 'Fix allergen icons not loading',
    description: 'Allergen badges on menu items intermittently fail to render on Safari.',
    difficulty: 'easy',
    status: 'open',
    source: 'synced',
    github_issue_number: 12,
    github_issue_url: 'https://github.com/campus/dining-menu/issues/12',
  },
  {
    id: 2,
    repo_id: 1,
    title: 'Add weekly nutrition summary',
    description: 'Show a weekly nutrition rollup for favorited dining halls.',
    difficulty: 'medium',
    status: 'open',
    source: 'manual',
  },
  {
    id: 3,
    repo_id: 1,
    title: 'Timezone bug in closing hours',
    description: 'Closing times show UTC instead of local campus time.',
    difficulty: 'easy',
    status: 'completed',
    source: 'synced',
    github_issue_number: 8,
    github_issue_url: 'https://github.com/campus/dining-menu/issues/8',
    claimer_id: 3,
    claimer_username: 'carol',
  },
  {
    id: 4,
    repo_id: 2,
    title: 'Conflict detection across majors',
    description: 'Detect schedule conflicts when mixing courses from different departments.',
    difficulty: 'hard',
    status: 'open',
    source: 'manual',
  },
  {
    id: 5,
    repo_id: 2,
    title: 'Export ICS calendar',
    description: 'Allow exporting a planned schedule as an .ics file.',
    difficulty: 'medium',
    status: 'claimed',
    source: 'synced',
    github_issue_number: 21,
    github_issue_url: 'https://github.com/campus/course-planner/issues/21',
    claimer_id: 1,
    claimer_username: 'alice',
  },
  {
    id: 6,
    repo_id: 3,
    title: 'Stale GPS markers on route B',
    description: 'Route B buses freeze for ~30s after leaving the stadium stop.',
    difficulty: 'medium',
    status: 'open',
    source: 'synced',
    github_issue_number: 4,
    github_issue_url: 'https://github.com/campus/bus-tracker/issues/4',
  },
  {
    id: 7,
    repo_id: 3,
    title: 'Offline map tiles',
    description: 'Cache map tiles so the tracker works in low-signal tunnels.',
    difficulty: 'hard',
    status: 'open',
    source: 'manual',
  },
  {
    id: 8,
    repo_id: 3,
    title: 'Accessibility labels for stops',
    description: 'Add ARIA labels and voiceover-friendly stop names.',
    difficulty: 'easy',
    status: 'open',
    source: 'synced',
    github_issue_number: 9,
    github_issue_url: 'https://github.com/campus/bus-tracker/issues/9',
  },
  {
    id: 9,
    repo_id: 3,
    title: 'Wrong ETA math overnight',
    description: 'ETAs wrap incorrectly after midnight.',
    difficulty: 'easy',
    status: 'in_review',
    source: 'manual',
    claimer_id: 3,
    claimer_username: 'carol',
  },
  {
    id: 10,
    repo_id: 5,
    title: 'Double-booking race condition',
    description: 'Two users can book the same room in the same slot under load.',
    difficulty: 'hard',
    status: 'open',
    source: 'synced',
    github_issue_number: 3,
    github_issue_url: 'https://github.com/campus/study-rooms/issues/3',
  },
]

export let mockClaims: Claim[] = [
  {
    id: 1,
    bounty_id: 5,
    user_id: 1,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    active: true,
  },
  {
    id: 2,
    bounty_id: 9,
    user_id: 3,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    active: true,
  },
]

export let mockSubmissions: Submission[] = [
  {
    id: 1,
    claim_id: 2,
    bounty_id: 9,
    pr_url: 'https://github.com/campus/bus-tracker/pull/15',
    pr_state: 'open',
    ci_status: 'passing',
    bounty_title: 'Wrong ETA math overnight',
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
    title: 'Dark mode for dining menu',
    description: 'Add a dark theme toggle to the dining menu app.',
    category: 'feature',
    status: 'planned',
    repo_id: 1,
    repo_name: 'campus/dining-menu',
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
    title: 'Favorite clubs feed',
    description: 'Personalized event feed for clubs you follow.',
    category: 'feature',
    status: 'open',
    repo_id: 4,
    repo_name: 'campus/club-finder',
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
