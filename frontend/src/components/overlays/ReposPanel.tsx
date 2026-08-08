import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import { GamePanel } from '@/components/ui/GamePanel'

export function ReposPanel() {
  const qc = useQueryClient()
  const [owner, setOwner] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: repos = [] } = useQuery({
    queryKey: ['repos'],
    queryFn: () => api.getRepos(),
  })

  const createMut = useMutation({
    mutationFn: () =>
      api.createRepo({
        owner: owner.trim(),
        name: name.trim(),
        description: description.trim(),
      }),
    onSuccess: async (repo) => {
      toast.success(`Registered ${repo.full_name} — new level on the map!`)
      setOwner('')
      setName('')
      setDescription('')
      await qc.invalidateQueries({ queryKey: ['repos'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const syncMut = useMutation({
    mutationFn: (id: number) => api.syncRepo(id),
    onSuccess: async (res) => {
      toast.success(`Synced ${res.synced} bounty issue(s)`)
      await qc.invalidateQueries({ queryKey: ['bounties'] })
      await qc.invalidateQueries({ queryKey: ['repos'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!owner.trim() || !name.trim()) {
      toast.error('Owner and name required')
      return
    }
    createMut.mutate()
  }

  return (
    <GamePanel title="Register Repos" wide>
      <form onSubmit={onSubmit} className="mb-6 rounded-lg border-2 border-[#3b2416] bg-[#f6e3bb] p-3">
        <p className="mb-3 text-sm text-[#6b4a2a]">
          Add a campus app as <code>owner/name</code>. It appears as a new level on the world map.
        </p>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <input
            className="game-input"
            placeholder="owner"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          />
          <input
            className="game-input"
            placeholder="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <input
          className="game-input mb-2"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" className="game-btn game-btn-primary" disabled={createMut.isPending}>
          Register repo
        </button>
      </form>

      <h3 className="font-pixel mb-2 text-[10px]">Registered apps</h3>
      <ul className="space-y-2">
        {repos.map((repo) => (
          <li
            key={repo.id}
            className="flex items-center justify-between gap-2 rounded-lg border-2 border-[#3b2416] bg-[#f6e3bb] px-3 py-2"
          >
            <div>
              <div className="font-semibold text-sm">{repo.full_name}</div>
              <div className="text-xs text-[#7d5b38]">
                {repo.open_bounty_count} open · {repo.description}
              </div>
            </div>
            <button
              type="button"
              className="game-btn game-btn-blue"
              disabled={syncMut.isPending}
              onClick={() => syncMut.mutate(repo.id)}
            >
              Sync now
            </button>
          </li>
        ))}
      </ul>
    </GamePanel>
  )
}
