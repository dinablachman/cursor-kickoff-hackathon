import type { BountyStatus, CiStatus, Difficulty } from '@/api/types'
import { ciBadge, difficultyStars, statusIcon, statusLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function DifficultyStars({ difficulty }: { difficulty: Difficulty }) {
  const n = difficultyStars(difficulty)
  return (
    <span className="font-pixel text-[10px] text-yellow-500" title={difficulty}>
      {'★'.repeat(n)}
      <span className="text-gray-300">{'★'.repeat(3 - n)}</span>
    </span>
  )
}

export function StatusBadge({ status }: { status: BountyStatus }) {
  const colors: Record<BountyStatus, string> = {
    open: 'bg-sky-100 text-sky-800',
    claimed: 'bg-orange-100 text-orange-800',
    in_review: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        colors[status],
      )}
    >
      <span aria-hidden>{statusIcon(status)}</span>
      {statusLabel(status)}
    </span>
  )
}

export function CiBadge({ status }: { status: CiStatus }) {
  const badge = ciBadge(status)
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 font-pixel text-[9px]',
        badge.className,
      )}
    >
      {badge.label}
    </span>
  )
}
