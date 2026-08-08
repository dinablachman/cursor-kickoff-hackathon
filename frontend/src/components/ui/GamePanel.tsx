import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface GamePanelProps {
  title: string
  children: ReactNode
  wide?: boolean
  onClose?: () => void
}

export function GamePanel({ title, children, wide, onClose }: GamePanelProps) {
  const navigate = useNavigate()
  const close = onClose ?? (() => navigate('/'))

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div
        className={`game-panel overlay-scroll relative flex max-h-[90vh] w-full flex-col ${
          wide ? 'max-w-3xl' : 'max-w-xl'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-4 border-[#3b2416] bg-[#e7bc78] px-2 py-2">
          <h2 className="font-pixel text-[11px] leading-relaxed">{title}</h2>
          <button type="button" className="game-btn" onClick={close}>
            <X size={14} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
