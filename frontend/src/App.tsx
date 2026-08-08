import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/auth/AuthContext'
import { RequireAuth } from '@/auth/RequireAuth'
import { LoginPage } from '@/components/overlays/LoginPage'
import { WorldMapPage } from '@/components/map/WorldMapPage'
import { LevelPanel } from '@/components/overlays/LevelPanel'
import { BountyDetail } from '@/components/overlays/BountyDetail'
import { MyClaims } from '@/components/overlays/MyClaims'
import { ReviewQueue } from '@/components/overlays/ReviewQueue'
import { ReposPanel } from '@/components/overlays/ReposPanel'
import { IdeaDetail, IdeasBoard, NewIdea } from '@/components/overlays/Ideas'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/" element={<WorldMapPage />}>
                <Route path="app/:repoId" element={<LevelPanel />} />
                <Route path="app/:repoId/bounty/:bountyId" element={<BountyDetail />} />
                <Route path="claims" element={<MyClaims />} />
                <Route path="review" element={<ReviewQueue />} />
                <Route path="repos" element={<ReposPanel />} />
                <Route path="ideas" element={<IdeasBoard />} />
                <Route path="ideas/new" element={<NewIdea />} />
                <Route path="ideas/:ideaId" element={<IdeaDetail />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            className: 'font-sans border-4 border-[#2b2b2b] shadow-lg',
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
