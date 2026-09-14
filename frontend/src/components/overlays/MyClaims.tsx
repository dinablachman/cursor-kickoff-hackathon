import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { GamePanel } from '@/components/ui/GamePanel'
import { CiBadge, StatusBadge } from '@/components/ui/Badges'

export function MyClaims() {
  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['claims'],
    queryFn: () => api.getMyClaims(),
  })

  return (
    <GamePanel title="My Claims" wide>
      {isLoading && <p className="panel-meta">Loading…</p>}
      {!isLoading && claims.length === 0 && (
        <p className="panel-body">No active claims. Walk the map and claim an open challenge!</p>
      )}
      <ul className="space-y-2">
        {claims.map((claim) => (
          <li
            key={claim.id}
            className="border-2 border-[#3b2416] bg-[#f6e3bb] px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="panel-row-title">
                  {claim.bounty?.title ?? `Bounty #${claim.bounty_id}`}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {claim.bounty && <StatusBadge status={claim.bounty.status} />}
                  {claim.submission && <CiBadge status={claim.submission.ci_status} />}
                </div>
                {claim.submission && (
                  <a
                    href={claim.submission.pr_url}
                    target="_blank"
                    rel="noreferrer"
                    className="game-link game-link-external mt-2"
                  >
                    View PR
                  </a>
                )}
              </div>
              {claim.bounty && (
                <Link
                  to={`/app/${claim.bounty.repo_id}/bounty/${claim.bounty_id}`}
                  className="game-btn bg-[#f6e3bb]"
                >
                  Open
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </GamePanel>
  )
}
