import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { GamePanel } from '@/components/ui/GamePanel'
import { DifficultyStars, StatusBadge } from '@/components/ui/Badges'
import { useAuth } from '@/auth/AuthContext'
import { useState } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import type { Difficulty } from '@/api/types'

export function LevelPanel() {
  const { repoId } = useParams()
  const id = Number(repoId)
  const { isMaintainer } = useAuth()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')

  const { data: repos = [] } = useQuery({ queryKey: ['repos'], queryFn: () => api.getRepos() })
  const repo = repos.find((r) => r.id === id)

  const { data: bounties = [], isLoading } = useQuery({
    queryKey: ['bounties', id],
    queryFn: () => api.getBounties({ repo_id: id }),
    enabled: Number.isFinite(id),
  })

  async function createBounty() {
    if (!title.trim()) return
    try {
      await api.createBounty({
        repo_id: id,
        title: title.trim(),
        description: description.trim(),
        difficulty,
      })
      toast.success('Bounty posted!')
      setShowCreate(false)
      setTitle('')
      setDescription('')
      await qc.invalidateQueries({ queryKey: ['bounties', id] })
      await qc.invalidateQueries({ queryKey: ['repos'] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    }
  }

  if (!repo) {
    return (
      <GamePanel title="Level not found">
        <p className="panel-body">This app isn't on the map yet.</p>
      </GamePanel>
    )
  }

  return (
    <GamePanel title={`Level: ${repo.name}`} wide>
      <p className="panel-meta mb-1">{repo.full_name}</p>
      <p className="panel-body mb-5">{repo.description}</p>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="panel-label">Challenges</h3>
        {isMaintainer && (
          <button
            type="button"
            className="game-btn game-btn-primary"
            onClick={() => setShowCreate((v) => !v)}
          >
            {showCreate ? 'Cancel' : '+ Manual bounty'}
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-4 border-2 border-[#3b2416] bg-[#f6e3bb] p-3">
          <input
            className="game-input mb-2"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="game-input mb-3 min-h-20"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="mb-3 flex gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                className={`game-btn ${difficulty === d ? 'game-btn-primary' : 'bg-[#f6e3bb]'}`}
                onClick={() => setDifficulty(d)}
              >
                {d}
              </button>
            ))}
          </div>
          <button type="button" className="game-btn game-btn-blue" onClick={createBounty}>
            Post bounty
          </button>
        </div>
      )}

      {isLoading && <p className="panel-meta">Loading challenges…</p>}

      <ul className="space-y-2">
        {bounties.map((b) => (
          <li key={b.id}>
            <Link
              to={`/app/${repo.id}/bounty/${b.id}`}
              className="flex items-center justify-between gap-3 border-2 border-[#3b2416] bg-[#f6e3bb] px-3 py-2.5 hover:bg-[#efd49a]"
            >
              <div className="min-w-0">
                <div className="panel-row-title">{b.title}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <DifficultyStars difficulty={b.difficulty} />
                  <StatusBadge status={b.status} />
                </div>
              </div>
              <span className="font-pixel shrink-0 text-[10px] text-[#8a6f52]">▶</span>
            </Link>
          </li>
        ))}
        {!isLoading && bounties.length === 0 && (
          <p className="panel-meta">No challenges yet — check back after a sync!</p>
        )}
      </ul>
    </GamePanel>
  )
}
