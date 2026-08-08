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
    <div className="relative flex h-full items-center justify-center overflow-hidden bg-linear-to-b from-[#5ec8ff] to-[#b8e4ff]">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[#5cb85c]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[30%] h-8 bg-[#3d8b3d]" />
      <form
        onSubmit={onSubmit}
        className="game-panel relative z-10 w-full max-w-md p-6"
      >
        <h1 className="font-pixel mb-2 text-center text-sm leading-relaxed text-[#1a1a2e]">
          Campus Bug Bounty
        </h1>
        <p className="mb-6 text-center text-sm text-gray-600">
          Player Select — pick a GitHub username and role to enter the world map.
        </p>

        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-700">
          GitHub Username
        </label>
        <input
          className="game-input mb-4"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. alice"
          autoFocus
        />

        <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-700">
          Role
        </label>
        <div className="mb-6 grid grid-cols-2 gap-2">
          {(['student', 'maintainer'] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              className={`game-btn ${role === r ? 'game-btn-primary' : 'bg-white'}`}
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
    </div>
  )
}
