/** Predefined world-map path slots as % of map size */
export interface MapSlot {
  id: string
  x: number
  y: number
  kind: 'repo' | 'ideas' | 'start'
}

export const MAP_SLOTS: MapSlot[] = [
  { id: 'start', x: 8, y: 72, kind: 'start' },
  { id: 'slot-0', x: 18, y: 58, kind: 'repo' },
  { id: 'slot-1', x: 30, y: 48, kind: 'repo' },
  { id: 'slot-2', x: 42, y: 58, kind: 'repo' },
  { id: 'ideas', x: 54, y: 42, kind: 'ideas' },
  { id: 'slot-3', x: 66, y: 52, kind: 'repo' },
  { id: 'slot-4', x: 78, y: 40, kind: 'repo' },
  { id: 'slot-5', x: 88, y: 55, kind: 'repo' },
  { id: 'slot-6', x: 72, y: 70, kind: 'repo' },
  { id: 'slot-7', x: 56, y: 78, kind: 'repo' },
  { id: 'slot-8', x: 40, y: 82, kind: 'repo' },
  { id: 'slot-9', x: 24, y: 78, kind: 'repo' },
]

export function repoSlots() {
  return MAP_SLOTS.filter((s) => s.kind === 'repo')
}

export function ideasSlot() {
  return MAP_SLOTS.find((s) => s.kind === 'ideas')!
}

export function startSlot() {
  return MAP_SLOTS.find((s) => s.kind === 'start')!
}

/** Neighbor graph for arrow-key navigation (by slot index in MAP_SLOTS) */
export const SLOT_NEIGHBORS: Record<string, Partial<Record<'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight', string>>> = {
  start: { ArrowRight: 'slot-0', ArrowUp: 'slot-0' },
  'slot-0': { ArrowLeft: 'start', ArrowRight: 'slot-1', ArrowUp: 'slot-1', ArrowDown: 'slot-9' },
  'slot-1': { ArrowLeft: 'slot-0', ArrowRight: 'slot-2', ArrowDown: 'slot-2', ArrowUp: 'ideas' },
  'slot-2': { ArrowLeft: 'slot-1', ArrowRight: 'ideas', ArrowUp: 'ideas', ArrowDown: 'slot-8' },
  ideas: { ArrowLeft: 'slot-2', ArrowRight: 'slot-3', ArrowDown: 'slot-2', ArrowUp: 'slot-4' },
  'slot-3': { ArrowLeft: 'ideas', ArrowRight: 'slot-4', ArrowDown: 'slot-6', ArrowUp: 'slot-4' },
  'slot-4': { ArrowLeft: 'slot-3', ArrowRight: 'slot-5', ArrowDown: 'slot-3', ArrowUp: 'slot-5' },
  'slot-5': { ArrowLeft: 'slot-4', ArrowDown: 'slot-6' },
  'slot-6': { ArrowLeft: 'slot-7', ArrowRight: 'slot-5', ArrowUp: 'slot-3', ArrowDown: 'slot-7' },
  'slot-7': { ArrowLeft: 'slot-8', ArrowRight: 'slot-6', ArrowUp: 'ideas', ArrowDown: 'slot-8' },
  'slot-8': { ArrowLeft: 'slot-9', ArrowRight: 'slot-7', ArrowUp: 'slot-2' },
  'slot-9': { ArrowLeft: 'start', ArrowRight: 'slot-8', ArrowUp: 'slot-0' },
}
