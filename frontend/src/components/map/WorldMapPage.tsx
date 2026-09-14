import { useCallback, useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { Hud } from '@/components/hud/Hud'
import { Sidebar } from '@/components/hud/Sidebar'
import { WorldMap } from '@/components/map/WorldMap'
import {
  MAP_SLOTS,
  SLOT_NEIGHBORS,
  ideasSlot,
  repoSlots,
  startSlot,
} from '@/components/map/mapLayout'

export function WorldMapPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeSlotId, setActiveSlotId] = useState(startSlot().id)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const { data: repos = [] } = useQuery({
    queryKey: ['repos'],
    queryFn: () => api.getRepos(),
  })

  const { data: plannedIdeas = [] } = useQuery({
    queryKey: ['ideas', 'planned-map'],
    queryFn: async () => {
      const ideas = await api.getIdeas({ sort: 'top' })
      return ideas.filter((i) => i.category === 'new-app' && i.status === 'planned')
    },
  })

  const overlayOpen = location.pathname !== '/'

  const enterSlot = useCallback(
    (slotId: string) => {
      if (slotId === 'ideas') {
        navigate('/ideas')
        return
      }
      if (slotId === 'start') return
      if (slotId.startsWith('idea:')) {
        navigate(`/ideas/${slotId.slice(5)}`)
        return
      }
      const repoSlotList = repoSlots()
      const idx = repoSlotList.findIndex((s) => s.id === slotId)
      const repo = repos[idx]
      if (repo) {
        navigate(`/app/${repo.id}`)
        return
      }
      const emptySlots = repoSlotList.filter((_, i) => !repos[i])
      const cIdx = emptySlots.findIndex((s) => s.id === slotId)
      if (cIdx >= 0 && plannedIdeas[cIdx]) {
        navigate(`/ideas/${plannedIdeas[cIdx].id}`)
      }
    },
    [navigate, plannedIdeas, repos],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return
      }

      if (e.key === 'Tab') {
        e.preventDefault()
        setSidebarOpen((v) => !v)
        setMenuOpen(false)
        return
      }

      if (overlayOpen || sidebarOpen) return

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        enterSlot(activeSlotId)
        return
      }

      const neighbors = SLOT_NEIGHBORS[activeSlotId]
      if (!neighbors) return
      const next =
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowRight'
          ? neighbors[e.key]
          : undefined
      if (next && MAP_SLOTS.some((s) => s.id === next)) {
        e.preventDefault()
        if (next.startsWith('slot-')) {
          const idx = repoSlots().findIndex((s) => s.id === next)
          const hasRepo = Boolean(repos[idx])
          const emptySlots = repoSlots().filter((_, i) => !repos[i])
          const hasConstruction =
            emptySlots.some((s) => s.id === next) &&
            plannedIdeas[emptySlots.findIndex((s) => s.id === next)] != null
          if (!hasRepo && !hasConstruction) return
        }
        setActiveSlotId(next)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeSlotId, enterSlot, overlayOpen, plannedIdeas, repos, sidebarOpen])

  useEffect(() => {
    if (activeSlotId.startsWith('slot-')) {
      const idx = repoSlots().findIndex((s) => s.id === activeSlotId)
      const hasRepo = idx >= 0 && Boolean(repos[idx])
      const emptySlots = repoSlots().filter((_, i) => !repos[i])
      const cIdx = emptySlots.findIndex((s) => s.id === activeSlotId)
      const hasConstruction = cIdx >= 0 && Boolean(plannedIdeas[cIdx])
      if (!hasRepo && !hasConstruction) setActiveSlotId(ideasSlot().id)
    }
  }, [repos, plannedIdeas, activeSlotId])

  return (
    <div className="relative h-full w-full">
      <WorldMap
        repos={repos}
        plannedIdeas={plannedIdeas}
        activeSlotId={activeSlotId}
        onSelectSlot={setActiveSlotId}
        onEnterSlot={enterSlot}
      />
      <Hud
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => {
          setSidebarOpen((v) => !v)
          setMenuOpen(false)
        }}
        menuOpen={menuOpen}
        onToggleMenu={() => {
          setMenuOpen((v) => !v)
          setSidebarOpen(false)
        }}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Outlet />
    </div>
  )
}
