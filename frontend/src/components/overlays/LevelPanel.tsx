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
        <p className="text-sm text-gray-600">This app isn't on the map yet.</p>
      </GamePanel>
    )
  }

  return (
    <GamePanel title={`Level: ${repo.name}`} wide>
      <p className="mb-1 text-xs text-gray-500">{repo.full_name}</p>
      <p className="mb-4 text-sm text-gray-700">{repo.description}</p>

      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-pixel text-[10px]">Challenges</h3>
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
        <div className="mb-4 rounded-lg border-2 border-[#2b2b2b] bg-white p-3">
          <input
            className="game-input mb-2"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="game-input mb-2 min-h-20"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="mb-2 flex gap-2">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                className={`game-btn ${difficulty === d ? 'game-btn-primary' : 'bg-white'}`}
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

      {isLoading && <p className="text-sm text-gray-500">Loading challenges…</p>}

      <ul className="space-y-2">
        {bounties.map((b) => (
          <li key={b.id}>
            <Link
              to={`/app/${repo.id}/bounty/${b.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border-2 border-[#2b2b2b] bg-white px-3 py-2 hover:bg-yellow-50"
            >
              <div>
                <div className="font-semibold text-sm">{b.title}</div>
                <div className="mt-1 flex items-center gap-2">
                  <DifficultyStars difficulty={b.difficulty} />
                  <StatusBadge status={b.status} />
                </div>
              </div>
              <span className="font-pixel text-[10px] text-gray-400">▶</span>
            </Link>
          </li>
        ))}
        {!isLoading && bounties.length === 0 && (
          <p className="text-sm text-gray-500">No challenges yet — check back after a sync!</p>
        )}
      </ul>
    </GamePanel>
  )
}
