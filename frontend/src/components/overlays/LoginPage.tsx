import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/auth/AuthContext'
import type { Role } from '@/api/types'

export function LoginPage() {
  const { user, login } = useAuth()
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!username.trim()) {
      toast.error('Enter a GitHub username')
      return
    }
    setLoading(true)
    try {
      await login(username.trim(), role)
      toast.success(`Welcome, ${username.trim()}!`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden">
      <img
        src="/pixui/bg-plains.png"
        alt=""
        draggable={false}
        className="pixelated absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-black/25" />

      <form onSubmit={onSubmit} className="game-panel relative z-10 w-full max-w-md">
        <div className="mb-2 flex justify-center">
          <div className="npc-sprite" aria-hidden />
        </div>
        <h1 className="font-pixel mb-2 text-center text-sm leading-relaxed text-[#3b2416]">
          Campus Bug Bounty
        </h1>
        <p className="mb-6 text-center text-sm text-[#6b4a2a]">
          Player Select — pick a GitHub username and role to enter the world map.
        </p>

        <label className="mb-1 block font-pixel text-[8px] uppercase tracking-wide text-[#6b4a2a]">
          GitHub Username
        </label>
        <input
          className="game-input mb-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. alice"
          autoFocus
        />

        <label className="mb-1 block font-pixel text-[8px] uppercase tracking-wide text-[#6b4a2a]">
          Role
        </label>
        <div className="mb-6 grid grid-cols-2 gap-2">
          {(['student', 'maintainer'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              className={`game-btn ${role === r ? 'game-btn-primary' : ''}`}
              onClick={() => setRole(r)}
            >
              {r}
            </button>
          ))}
        </div>

        <button type="submit" className="game-btn game-btn-blue w-full" disabled={loading}>
          {loading ? 'Loading…' : 'Start Game ▶'}
        </button>
      </form>

      <p className="absolute bottom-2 left-1/2 z-10 w-full -translate-x-1/2 px-4 text-center font-pixel text-[7px] leading-relaxed text-white/80">
        Pixel art: Krishna Palacio (Minifantasy UI Overhaul) · tiopalada (CC0) · via phaser-pixui
      </p>
    </div>
  )
}
