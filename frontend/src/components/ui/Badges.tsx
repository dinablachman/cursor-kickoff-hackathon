import type { ReactNode } from 'react'
import type {
  BountySource,
  BountyStatus,
  CiStatus,
  Difficulty,
  IdeaCategory,
  IdeaStatus,
} from '@/api/types'
import { ciBadge, difficultyStars, statusIcon, statusLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'

const chipBase =
  'inline-flex items-center gap-1 border-2 border-[#3b2416] px-1.5 py-0.5 font-pixel text-[7px] uppercase tracking-wide'

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn(chipBase, className)}>{children}</span>
}

export function DifficultyStars({ difficulty }: { difficulty: Difficulty }) {
  const n = difficultyStars(difficulty)
  return (
    <span className="font-pixel text-[10px] text-[#d4880f]" title={difficulty}>
      {'★'.repeat(n)}
      <span className="text-[#c9b088]">{'★'.repeat(3 - n)}</span>
    </span>
  )
}

export function StatusBadge({ status }: { status: BountyStatus }) {
  const colors: Record<BountyStatus, string> = {
    open: 'bg-[#4a90c2] text-white',
    claimed: 'bg-[#d4880f] text-white',
    in_review: 'bg-[#8e5abc] text-white',
    completed: 'bg-[#4caf50] text-white',
  }
  return (
    <Chip className={colors[status]}>
      <span aria-hidden>{statusIcon(status)}</span>
      {statusLabel(status)}
    </Chip>
  )
}

export function SourceBadge({ source }: { source: BountySource }) {
  const colors: Record<BountySource, string> = {
    manual: 'bg-[#c4783a] text-white',
    synced: 'bg-[#6b8f71] text-white',
  }
  return <Chip className={colors[source]}>{source}</Chip>
}

export function IdeaCategoryBadge({ category }: { category: IdeaCategory }) {
  const colors: Record<IdeaCategory, string> = {
    feature: 'bg-[#4a90c2] text-white',
    'new-app': 'bg-[#8e5abc] text-white',
  }
  const label = category === 'new-app' ? 'New app' : 'Feature'
  return <Chip className={colors[category]}>{label}</Chip>
}

export function IdeaStatusBadge({ status }: { status: IdeaStatus }) {
  const colors: Record<IdeaStatus, string> = {
    open: 'bg-[#4a90c2] text-white',
    planned: 'bg-[#d4880f] text-white',
    done: 'bg-[#4caf50] text-white',
  }
  return <Chip className={colors[status]}>{status}</Chip>
}

export function CiBadge({ status }: { status: CiStatus }) {
  const badge = ciBadge(status)
  return <Chip className={badge.className}>{badge.label}</Chip>
}
