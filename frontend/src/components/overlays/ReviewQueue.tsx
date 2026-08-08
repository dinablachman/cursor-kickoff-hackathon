import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { ReviewDecision } from '@/api/types'
import { GamePanel } from '@/components/ui/GamePanel'
import { CiBadge } from '@/components/ui/Badges'

export function ReviewQueue() {
  const qc = useQueryClient()
  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: () => api.getPendingSubmissions(),
  })

  const reviewMut = useMutation({
    mutationFn: ({ id, decision }: { id: number; decision: ReviewDecision }) =>
      api.reviewSubmission(id, decision),
    onSuccess: async (_data, vars) => {
      toast.success(`Decision: ${vars.decision.replace('_', ' ')}`)
      await qc.invalidateQueries({ queryKey: ['submissions'] })
      await qc.invalidateQueries({ queryKey: ['bounties'] })
      await qc.invalidateQueries({ queryKey: ['claims'] })
      await qc.invalidateQueries({ queryKey: ['repos'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <GamePanel title="Review Queue" wide>
      <p className="mb-4 text-sm text-[#6b4a2a]">
        Code review happens on GitHub. Record your decision here after checking the PR + CI.
      </p>
      {isLoading && <p className="text-sm text-[#7d5b38]">Loading…</p>}
      {!isLoading && submissions.length === 0 && (
        <p className="text-sm text-[#6b4a2a]">No pending submissions. Nice!</p>
      )}
      <ul className="space-y-3">
        {submissions.map((s) => (
          <li key={s.id} className="rounded-lg border-2 border-[#3b2416] bg-[#f6e3bb] p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-semibold">{s.bounty_title ?? `Submission #${s.id}`}</span>
              <CiBadge status={s.ci_status} />
              {s.ci_status === 'failing' && (
                <span className="text-xs font-semibold text-red-600">⚠ CI failing</span>
              )}
              {s.ci_status === 'none' && (
                <span className="text-xs text-orange-600">⚠ No CI on this repo</span>
              )}
            </div>
            <p className="mb-2 text-xs text-[#7d5b38]">
              by @{s.submitter_username} · PR {s.pr_state}
            </p>
            <a
              href={s.pr_url}
              target="_blank"
              rel="noreferrer"
              className="mb-3 inline-block text-sm text-sky-700 underline"
            >
              Open pull request
            </a>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="game-btn game-btn-primary"
                disabled={reviewMut.isPending}
                onClick={() => reviewMut.mutate({ id: s.id, decision: 'approve' })}
              >
                Approve
              </button>
              <button
                type="button"
                className="game-btn bg-yellow-300"
                disabled={reviewMut.isPending}
                onClick={() => reviewMut.mutate({ id: s.id, decision: 'request_changes' })}
              >
                Request changes
              </button>
              <button
                type="button"
                className="game-btn game-btn-danger"
                disabled={reviewMut.isPending}
                onClick={() => reviewMut.mutate({ id: s.id, decision: 'reject' })}
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </GamePanel>
  )
}
