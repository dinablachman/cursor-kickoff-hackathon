import type { BountyStatus, CiStatus, Difficulty } from '@/api/types'
import { ciBadge, difficultyStars, statusIcon, statusLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'

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
    <span
      className={cn(
        'inline-flex items-center gap-1 border-2 border-[#3b2416] px-1.5 py-0.5 font-pixel text-[7px]',
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
        'inline-flex border-2 border-[#3b2416] px-1.5 py-0.5 font-pixel text-[7px]',
        badge.className,
      )}
    >
      {badge.label}
    </span>
  )
}
