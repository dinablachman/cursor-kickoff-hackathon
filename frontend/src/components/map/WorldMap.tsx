import { motion } from 'framer-motion'
import type { Idea, Repo } from '@/api/types'
import { MAP_SLOTS, ideasSlot, type MapSlot } from '@/components/map/mapLayout'

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
    <div className="relative h-full w-full overflow-hidden select-none">
      <div className="absolute inset-0 bg-linear-to-b from-[#5ec8ff] via-[#9ad8ff] to-[#c8ecff]" />

      <div className="absolute top-[8%] left-[10%] h-10 w-24 rounded-full bg-white/80" />
      <div className="absolute top-[6%] left-[14%] h-14 w-16 rounded-full bg-white/80" />
      <div className="absolute top-[12%] right-[18%] h-12 w-28 rounded-full bg-white/70" />
      <div className="absolute top-[10%] right-[14%] h-16 w-20 rounded-full bg-white/70" />

      <div className="absolute bottom-[38%] left-[5%] h-32 w-40 rounded-t-full bg-[#7ec87e]" />
      <div className="absolute bottom-[40%] left-[18%] h-40 w-48 rounded-t-full bg-[#6bb86b]" />
      <div className="absolute bottom-[36%] right-[8%] h-36 w-52 rounded-t-full bg-[#7ec87e]" />

      <div className="absolute bottom-0 left-0 h-[18%] w-[35%] rounded-tr-[40%] bg-[#4db8e8]" />
      <div className="absolute bottom-[14%] left-[8%] h-3 w-10 rounded-full bg-white/40" />

      <div className="absolute inset-x-0 bottom-0 h-[55%] bg-[#5cb85c]" />
      <div
        className="absolute inset-x-0 bottom-[40%] h-[20%]"
        style={{
          background:
            'repeating-linear-gradient(90deg, #5cb85c 0 40px, #6bc46b 40px 80px)',
        }}
      />

      <span className="absolute bottom-[28%] left-[6%] text-2xl">🌸</span>
      <span className="absolute bottom-[22%] left-[48%] text-2xl">🌼</span>
      <span className="absolute bottom-[30%] right-[12%] text-3xl">🌳</span>
      <span className="absolute bottom-[25%] right-[28%] text-2xl">🍄</span>
      <span className="absolute bottom-[20%] left-[35%] text-xl">🌿</span>

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d={trailPath(MAP_SLOTS)}
          fill="none"
          stroke="#c4a574"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={trailPath(MAP_SLOTS)}
          fill="none"
          stroke="#8b6914"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="0.8 1.6"
          vectorEffect="non-scaling-stroke"
          opacity="0.5"
        />
      </svg>

      <button
        type="button"
        className="absolute -translate-x-1/2 -translate-y-1/2 text-4xl drop-shadow-md"
        style={{ left: `${MAP_SLOTS[0].x}%`, top: `${MAP_SLOTS[0].y}%` }}
        onClick={() => onSelectSlot('start')}
        title="Start"
      >
        🏰
      </button>

      <button
        type="button"
        className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center ${
          activeSlotId === ideas.id ? 'scale-110' : ''
        }`}
        style={{ left: `${ideas.x}%`, top: `${ideas.y}%` }}
        onClick={() => {
          onSelectSlot(ideas.id)
          onEnterSlot(ideas.id)
        }}
        title="Ideas Lab"
      >
        <span className="text-4xl drop-shadow-md">🍄</span>
        <span className="font-pixel mt-1 rounded bg-[#fff8e7] px-2 py-0.5 text-[8px] shadow">
          Ideas Lab
        </span>
      </button>

      {repoSlotList.map((slot) => {
        const repo = slotToRepo.get(slot.id)
        if (!repo) {
          if (constructionSlotIds.has(slot.id)) return null
          return (
            <div
              key={slot.id}
              className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-white/50 bg-black/10"
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
              active ? 'scale-110' : 'hover:scale-105'
            }`}
            style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            onClick={() => {
              onSelectSlot(slot.id)
              onEnterSlot(slot.id)
            }}
            title={repo.full_name}
          >
            <div
              className={`relative flex h-10 w-10 items-center justify-center rounded-full border-4 ${
                active ? 'border-yellow-300 bg-[#2b2b2b]' : 'border-yellow-400 bg-[#1a1a2e]'
              } text-lg shadow-lg`}
            >
              📦
              {repo.open_bounty_count > 0 && (
                <span className="font-pixel absolute -top-2 -right-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] text-white">
                  {repo.open_bounty_count}
                </span>
              )}
              {cleared && (
                <span className="absolute -bottom-1 -left-1 text-sm" title="No open bounties">
                  🚩
                </span>
              )}
            </div>
            <span className="font-pixel mt-1 max-w-24 truncate rounded bg-[#fff8e7]/90 px-1.5 py-0.5 text-[8px] shadow">
              {repo.name}
            </span>
          </button>
        )
      })}

      {constructionNodes.map(({ idea, slot }) => (
        <button
          key={`build-${idea.id}`}
          type="button"
          className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center opacity-70 ${
            activeSlotId === slot.id ? 'scale-110 opacity-100' : ''
          }`}
          style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          onClick={() => {
            onSelectSlot(slot.id)
            onEnterSlot(`idea:${idea.id}`)
          }}
          title={`Under construction: ${idea.title}`}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-4 border-dashed border-gray-400 bg-gray-300 text-lg shadow">
            🚧
          </div>
          <span className="font-pixel mt-1 max-w-24 truncate rounded bg-gray-200 px-1.5 py-0.5 text-[8px] shadow">
            {idea.title}
          </span>
        </button>
      ))}

      <motion.div
        className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-[120%] text-3xl drop-shadow-lg"
        animate={{ left: `${activeSlot.x}%`, top: `${activeSlot.y}%` }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      >
        <span className="inline-block animate-bounce">🧑‍🎓</span>
      </motion.div>

      <div className="pointer-events-none absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 font-pixel text-[9px] text-white">
        ← → ↑ ↓ move · Enter open · Tab apps
      </div>
    </div>
  )
}
