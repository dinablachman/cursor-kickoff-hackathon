import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { BountyStatus, CiStatus, Difficulty } from '@/api/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function difficultyStars(difficulty: Difficulty): number {
  return difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3
}

export function statusIcon(status: BountyStatus): string {
  switch (status) {
    case 'open':
      return '○'
    case 'claimed':
      return '⚑'
    case 'in_review':
      return '⏳'
    case 'completed':
      return '★'
  }
}

export function statusLabel(status: BountyStatus): string {
  switch (status) {
    case 'open':
      return 'Open'
    case 'claimed':
      return 'Claimed'
    case 'in_review':
      return 'In Review'
    case 'completed':
      return 'Completed'
  }
}

export function ciBadge(ci: CiStatus): { label: string; className: string } {
  switch (ci) {
    case 'passing':
      return { label: 'CI ✓', className: 'bg-green-500 text-white' }
    case 'failing':
      return { label: 'CI ✗', className: 'bg-red-500 text-white' }
    case 'pending':
      return { label: 'CI …', className: 'bg-yellow-400 text-black' }
    case 'none':
      return { label: 'No CI', className: 'bg-gray-400 text-white' }
  }
}
