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
      <p className="panel-body mb-4">
        Code review happens on GitHub. Record your decision here after checking the PR + CI.
      </p>
      {isLoading && <p className="panel-meta">Loading…</p>}
      {!isLoading && submissions.length === 0 && (
        <p className="panel-body">No pending submissions. Nice!</p>
      )}
      <ul className="space-y-3">
        {submissions.map((s) => (
          <li key={s.id} className="border-2 border-[#3b2416] bg-[#f6e3bb] p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="panel-row-title">{s.bounty_title ?? `Submission #${s.id}`}</span>
              <CiBadge status={s.ci_status} />
            </div>
            <p className="panel-meta mb-2">
              by @{s.submitter_username}
              <span className="mx-1.5 opacity-50">·</span>
              PR {s.pr_state}
              {s.ci_status === 'failing' && (
                <>
                  <span className="mx-1.5 opacity-50">·</span>
                  <span className="font-semibold text-[#c45c4a]">CI failing</span>
                </>
              )}
              {s.ci_status === 'none' && (
                <>
                  <span className="mx-1.5 opacity-50">·</span>
                  <span className="font-semibold text-[#d4880f]">No CI on this repo</span>
                </>
              )}
            </p>
            <a
              href={s.pr_url}
              target="_blank"
              rel="noreferrer"
              className="game-link game-link-external mb-3"
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
