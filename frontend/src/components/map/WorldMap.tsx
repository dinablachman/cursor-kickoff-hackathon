import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Idea, Repo } from '@/api/types'
import { MAP_SLOTS, ideasSlot, type MapSlot } from '@/components/map/mapLayout'
import {
  PixelCastle,
  PixelConstruction,
  PixelFlag,
  PixelHouse,
  PixelLab,
} from '@/components/map/PixelIcons'

interface WorldMapProps {
  repos: Repo[]
  plannedIdeas?: Idea[]
  activeSlotId: string
  onSelectSlot: (slotId: string) => void
  onEnterSlot: (slotId: string) => void
}

function trailPath(slots: MapSlot[]) {
  return slots.map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`).join(' ')
}

/** Animated NPC sprite that walks between slots and faces its direction of travel */
function Avatar({ slot }: { slot: MapSlot }) {
  const prevX = useRef(slot.x)
  const [facing, setFacing] = useState<'right' | 'left'>('right')
  const [walking, setWalking] = useState(false)

  useEffect(() => {
    if (slot.x !== prevX.current) {
      setFacing(slot.x > prevX.current ? 'right' : 'left')
      prevX.current = slot.x
    }
    setWalking(true)
    const t = setTimeout(() => setWalking(false), 500)
    return () => clearTimeout(t)
  }, [slot.x, slot.y])

  const spriteClass = walking
    ? facing === 'right'
      ? 'npc-walking-right'
      : 'npc-walking-left'
    : facing === 'right'
      ? 'npc-face-right'
      : 'npc-face-left'

  return (
    <motion.div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[85%]"
      animate={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
    >
      <div className={`npc-sprite ${spriteClass} drop-shadow-lg`} />
    </motion.div>
  )
}

export function WorldMap({
  repos,
  plannedIdeas = [],
  activeSlotId,
  onSelectSlot,
  onEnterSlot,
}: WorldMapProps) {
  const repoSlotList = MAP_SLOTS.filter((s) => s.kind === 'repo')
  const slotToRepo = new Map<string, Repo>()
  repoSlotList.forEach((slot, i) => {
    if (repos[i]) slotToRepo.set(slot.id, repos[i])
  })

  const emptySlots = repoSlotList.filter((s) => !slotToRepo.has(s.id))
  const constructionNodes = plannedIdeas
    .filter((i) => i.category === 'new-app' && i.status === 'planned')
    .slice(0, emptySlots.length)
    .map((idea, i) => ({ idea, slot: emptySlots[i]! }))

  const activeSlot = MAP_SLOTS.find((s) => s.id === activeSlotId) ?? MAP_SLOTS[0]
  const ideas = ideasSlot()
  const constructionSlotIds = new Set(constructionNodes.map((n) => n.slot.id))

  return (
    <div className="relative h-full w-full overflow-hidden select-none bg-[#1c2e4a]">
      {/* Pixel-art plains backdrop (tiopalada, CC0) */}
      <img
        src="/pixui/bg-plains.png"
        alt=""
        draggable={false}
        className="pixelated absolute inset-0 h-full w-full object-cover"
      />

      {/* Trail */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d={trailPath(MAP_SLOTS)}
          fill="none"
          stroke="#3b2416"
          strokeWidth="5"
          strokeLinecap="square"
          strokeLinejoin="miter"
          vectorEffect="non-scaling-stroke"
          opacity="0.65"
        />
        <path
          d={trailPath(MAP_SLOTS)}
          fill="none"
          stroke="#e7bc78"
          strokeWidth="3"
          strokeLinecap="square"
          strokeDasharray="6 5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Start castle */}
      <button
        type="button"
        className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={{ left: `${MAP_SLOTS[0].x}%`, top: `${MAP_SLOTS[0].y}%` }}
        onClick={() => onSelectSlot('start')}
        title="Start"
      >
        <PixelCastle size={60} className="drop-shadow-md" />
        <span className="name-plate mt-1">Start</span>
      </button>

      {/* Ideas Lab building */}
      <button
        type="button"
        className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-transform ${
          activeSlotId === ideas.id ? 'scale-110' : 'hover:scale-105'
        }`}
        style={{ left: `${ideas.x}%`, top: `${ideas.y}%` }}
        onClick={() => {
          onSelectSlot(ideas.id)
          onEnterSlot(ideas.id)
        }}
        title="Ideas Lab"
      >
        <PixelLab size={60} className="drop-shadow-md" />
        <span className="name-plate mt-1">Ideas Lab</span>
      </button>

      {/* Repo level nodes */}
      {repoSlotList.map((slot) => {
        const repo = slotToRepo.get(slot.id)
        if (!repo) {
          if (constructionSlotIds.has(slot.id)) return null
          return (
            <div
              key={slot.id}
              className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 border-2 border-[#3b2416] bg-[#e7bc78]/60"
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            />
          )
        }
        const active = activeSlotId === slot.id
        const cleared = repo.open_bounty_count === 0
        return (
          <button
            key={slot.id}
            type="button"
            className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-transform ${
              active ? 'scale-115' : 'hover:scale-105'
            }`}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            onClick={() => {
              onSelectSlot(slot.id)
              onEnterSlot(slot.id)
            }}
            title={repo.full_name}
          >
            <div className="relative">
              <PixelHouse size={52} className="drop-shadow-md" />
              {repo.open_bounty_count > 0 && (
                <span className="font-pixel absolute -top-2 -right-3 border-2 border-[#3b2416] bg-[#d43d2a] px-1.5 py-0.5 text-[8px] text-white">
                  {repo.open_bounty_count}
                </span>
              )}
              {cleared && (
                <PixelFlag size={20} className="absolute -top-2 -left-2 drop-shadow" />
              )}
            </div>
            <span className={`name-plate mt-1 max-w-28 truncate ${active ? 'bg-[#3b2416]' : ''}`}>
              {repo.name}
            </span>
          </button>
        )
      })}

      {/* Under-construction nodes from planned new-app ideas */}
      {constructionNodes.map(({ idea, slot }) => (
        <button
          key={`build-${idea.id}`}
          type="button"
          className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-transform ${
            activeSlotId === slot.id ? 'scale-115' : 'opacity-90 hover:scale-105'
          }`}
          style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          onClick={() => {
            onSelectSlot(slot.id)
            onEnterSlot(`idea:${idea.id}`)
          }}
          title={`Under construction: ${idea.title}`}
        >
          <PixelConstruction size={52} className="drop-shadow-md" />
          <span className="name-plate mt-1 max-w-28 truncate">{idea.title}</span>
        </button>
      ))}

      <Avatar slot={activeSlot} />

      {/* Controls hint */}
      <div className="name-plate pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 text-[9px]">
        ← → ↑ ↓ move · Enter open · Tab apps
      </div>
    </div>
  )
}
