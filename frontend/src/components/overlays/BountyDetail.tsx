import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { GamePanel } from '@/components/ui/GamePanel'
import { DifficultyStars, StatusBadge } from '@/components/ui/Badges'

export function BountyDetail() {
  const { repoId, bountyId } = useParams()
  const id = Number(bountyId)
  const navigate = useNavigate()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [prUrl, setPrUrl] = useState('')
  const [showSubmit, setShowSubmit] = useState(false)

  const { data: bounty, isLoading } = useQuery({
    queryKey: ['bounty', id],
    queryFn: () => api.getBounty(id),
    enabled: Number.isFinite(id),
  })

  const { data: claims = [] } = useQuery({
    queryKey: ['claims'],
    queryFn: () => api.getMyClaims(),
  })

  const myClaim = claims.find((c) => c.bounty_id === id && c.active)

  const claimMut = useMutation({
    mutationFn: () => api.claimBounty(id),
    onSuccess: async () => {
      toast.success('Bounty claimed!')
      await qc.invalidateQueries({ queryKey: ['bounty', id] })
      await qc.invalidateQueries({ queryKey: ['bounties'] })
      await qc.invalidateQueries({ queryKey: ['claims'] })
      await qc.invalidateQueries({ queryKey: ['repos'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const releaseMut = useMutation({
    mutationFn: () => api.releaseBounty(id),
    onSuccess: async () => {
      toast.success('Claim released')
      await qc.invalidateQueries({ queryKey: ['bounty', id] })
      await qc.invalidateQueries({ queryKey: ['bounties'] })
      await qc.invalidateQueries({ queryKey: ['claims'] })
      await qc.invalidateQueries({ queryKey: ['repos'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const submitMut = useMutation({
    mutationFn: () => api.submitPr(myClaim!.id, prUrl.trim()),
    onSuccess: async () => {
      toast.success('PR submitted for review!')
      setShowSubmit(false)
      setPrUrl('')
      await qc.invalidateQueries({ queryKey: ['bounty', id] })
      await qc.invalidateQueries({ queryKey: ['bounties'] })
      await qc.invalidateQueries({ queryKey: ['claims'] })
      await qc.invalidateQueries({ queryKey: ['submissions'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading || !bounty) {
    return (
      <GamePanel title="Challenge" onClose={() => navigate(`/app/${repoId}`)}>
        <p className="text-sm text-gray-500">Loading…</p>
      </GamePanel>
    )
  }

  const isMine = bounty.claimer_id === user?.id

  return (
    <GamePanel title="Challenge" onClose={() => navigate(`/app/${repoId}`)} wide>
      <Link to={`/app/${repoId}`} className="mb-3 inline-block text-xs text-sky-700 underline">
        ← Back to level
      </Link>

      <h3 className="mb-2 text-lg font-bold">{bounty.title}</h3>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <DifficultyStars difficulty={bounty.difficulty} />
        <StatusBadge status={bounty.status} />
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize">
          {bounty.source}
        </span>
      </div>

      <p className="mb-4 whitespace-pre-wrap text-sm text-gray-700">{bounty.description}</p>

      {bounty.github_issue_url && (
        <a
          href={bounty.github_issue_url}
          target="_blank"
          rel="noreferrer"
          className="mb-4 inline-block text-sm text-sky-700 underline"
        >
          View GitHub issue #{bounty.github_issue_number}
        </a>
      )}

      {bounty.claimer_username && (
        <p className="mb-4 text-sm text-gray-600">
          Claimed by <strong>@{bounty.claimer_username}</strong>
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {bounty.status === 'open' && (
          <button
            type="button"
            className="game-btn game-btn-primary"
            disabled={claimMut.isPending}
            onClick={() => claimMut.mutate()}
          >
            Claim this bounty
          </button>
        )}

        {(bounty.status === 'claimed' || bounty.status === 'in_review') && isMine && (
          <>
            <button
              type="button"
              className="game-btn bg-white"
              disabled={releaseMut.isPending}
              onClick={() => releaseMut.mutate()}
            >
              Release claim
            </button>
            {bounty.status === 'claimed' && (
              <button
                type="button"
                className="game-btn game-btn-blue"
                onClick={() => setShowSubmit((v) => !v)}
              >
                Submit PR URL
              </button>
            )}
          </>
        )}
      </div>

      {showSubmit && (
        <div className="mt-4 rounded-lg border-2 border-[#2b2b2b] bg-white p-3">
          <label className="mb-1 block text-xs font-bold uppercase text-gray-600">
            Pull request URL
          </label>
          <input
            className="game-input mb-2"
            placeholder="https://github.com/owner/repo/pull/123"
            value={prUrl}
            onChange={(e) => setPrUrl(e.target.value)}
          />
          <button
            type="button"
            className="game-btn game-btn-primary"
            disabled={!prUrl.trim() || submitMut.isPending}
            onClick={() => submitMut.mutate()}
          >
            Submit for review
          </button>
        </div>
      )}
    </GamePanel>
  )
}
