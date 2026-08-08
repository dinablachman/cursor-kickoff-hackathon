import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Lightbulb, Search, X } from 'lucide-react'
import { api } from '@/api/client'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: repos = [] } = useQuery({
    queryKey: ['repos'],
    queryFn: () => api.getRepos(),
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return repos
    return repos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.full_name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    )
  }, [repos, search])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Tab' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Handled by parent — keep focus trap soft
      }
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full w-80 flex-col game-panel transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b-4 border-[#3b2416] p-3">
          <h2 className="font-pixel text-[11px]">Apps</h2>
          <button type="button" className="game-btn bg-[#f6e3bb] px-2 py-1" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <div className="border-b-4 border-[#3b2416] p-3">
          <button
            type="button"
            className="game-btn game-btn-primary mb-3 flex w-full items-center justify-center gap-2"
            onClick={() => {
              onClose()
              navigate('/ideas/new')
            }}
          >
            <Lightbulb size={14} />
            Propose an idea
          </button>
          <div className="relative">
            <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-[#8a6f52]" />
            <input
              className="game-input pl-9"
              placeholder="Search apps…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overlay-scroll flex-1 p-2">
          {filtered.length === 0 && (
            <p className="p-3 text-sm text-[#7d5b38]">No apps match.</p>
          )}
          {filtered.map((repo) => (
            <Link
              key={repo.id}
              to={`/app/${repo.id}`}
              onClick={onClose}
              className="mb-1 flex items-start justify-between gap-2 rounded-lg px-3 py-2 hover:bg-[#efd49a]"
            >
              <div>
                <div className="font-semibold text-sm">{repo.name}</div>
                <div className="text-xs text-[#7d5b38] line-clamp-2">{repo.description}</div>
              </div>
              <span className="font-pixel shrink-0 rounded-full bg-[#5cb85c] px-2 py-1 text-[9px] text-white">
                {repo.open_bounty_count}
              </span>
            </Link>
          ))}
        </div>
      </aside>
    </>
  )
}
