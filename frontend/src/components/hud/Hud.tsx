import { Link } from 'react-router-dom'
import { Menu, PanelLeft, LogOut } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

interface HudProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  menuOpen: boolean
  onToggleMenu: () => void
}

export function Hud({ sidebarOpen, onToggleSidebar, menuOpen, onToggleMenu }: HudProps) {
  const { user, logout, isMaintainer } = useAuth()
  const { data: claims = [] } = useQuery({
    queryKey: ['claims'],
    queryFn: () => api.getMyClaims(),
    enabled: !!user,
  })

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between p-3">
      <div className="pointer-events-auto game-panel flex items-center gap-2 py-0 pr-2">
        <div className="npc-sprite-sm shrink-0" aria-hidden />
        <div>
          <div className="font-pixel text-[10px] text-[#3b2416]">
            {user?.github_username}
          </div>
          <div className="text-xs text-[#6b4a2a] capitalize">
            {user?.role} · claims ×{claims.length}
          </div>
        </div>
      </div>

      <div className="pointer-events-auto flex gap-2">
        <button
          type="button"
          className={`game-btn flex items-center gap-2 ${sidebarOpen ? 'game-btn-primary' : 'bg-[#f6e3bb]'}`}
          onClick={onToggleSidebar}
          title="Quick access (Tab)"
        >
          <PanelLeft size={14} />
          Apps
        </button>
        <div className="relative">
          <button
            type="button"
            className={`game-btn flex items-center gap-2 ${menuOpen ? 'game-btn-blue' : 'bg-[#f6e3bb]'}`}
            onClick={onToggleMenu}
          >
            <Menu size={14} />
            Menu
          </button>
          {menuOpen && (
            <div className="game-panel absolute right-0 mt-2 w-52 p-0">
              <Link
                to="/claims"
                className="block rounded px-3 py-2 text-sm hover:bg-[#efd49a]"
                onClick={onToggleMenu}
              >
                My Claims
              </Link>
              {isMaintainer && (
                <>
                  <Link
                    to="/review"
                    className="block rounded px-3 py-2 text-sm hover:bg-[#efd49a]"
                    onClick={onToggleMenu}
                  >
                    Review Queue
                  </Link>
                  <Link
                    to="/repos"
                    className="block rounded px-3 py-2 text-sm hover:bg-[#efd49a]"
                    onClick={onToggleMenu}
                  >
                    Register Repo
                  </Link>
                </>
              )}
              <Link
                to="/ideas"
                className="block rounded px-3 py-2 text-sm hover:bg-[#efd49a]"
                onClick={onToggleMenu}
              >
                Ideas Lab
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                onClick={() => {
                  onToggleMenu()
                  logout()
                }}
              >
                <LogOut size={14} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
