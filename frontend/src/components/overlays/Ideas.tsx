import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/api/client'
import type { IdeaCategory, IdeaStatus } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { GamePanel } from '@/components/ui/GamePanel'

export function IdeasBoard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') ?? ''
  const sort = (searchParams.get('sort') as 'top' | 'newest') || 'top'

  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ['ideas', category, sort],
    queryFn: () =>
      api.getIdeas({
        category: category || undefined,
        sort,
      }),
  })

  return (
    <GamePanel title="Ideas Lab" wide>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`game-btn ${!category ? 'game-btn-primary' : 'bg-[#f6e3bb]'}`}
            onClick={() => {
              const next = new URLSearchParams(searchParams)
              next.delete('category')
              setSearchParams(next)
            }}
          >
            All
          </button>
          {(['feature', 'new-app'] as IdeaCategory[]).map((c) => (
            <button
              key={c}
              type="button"
              className={`game-btn ${category === c ? 'game-btn-primary' : 'bg-[#f6e3bb]'}`}
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                next.set('category', c)
                setSearchParams(next)
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['top', 'newest'] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={`game-btn ${sort === s ? 'game-btn-blue' : 'bg-[#f6e3bb]'}`}
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                next.set('sort', s)
                setSearchParams(next)
              }}
            >
              {s}
            </button>
          ))}
          <Link to="/ideas/new" className="game-btn game-btn-primary">
            + New idea
          </Link>
        </div>
      </div>

      {isLoading && <p className="text-sm text-[#7d5b38]">Loading…</p>}
      <ul className="space-y-2">
        {ideas.map((idea) => (
          <li key={idea.id}>
            <Link
              to={`/ideas/${idea.id}`}
              className="flex items-start justify-between gap-3 rounded-lg border-2 border-[#3b2416] bg-[#f6e3bb] px-3 py-2 hover:bg-[#efd49a]"
            >
              <div>
                <div className="font-semibold text-sm">{idea.title}</div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#7d5b38]">
                  <span className="rounded bg-sky-100 px-1.5 py-0.5 capitalize text-sky-800">
                    {idea.category}
                  </span>
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 capitalize">
                    {idea.status}
                  </span>
                  {idea.repo_name && <span>→ {idea.repo_name}</span>}
                  <span>by @{idea.author_username}</span>
                </div>
              </div>
              <div className="font-pixel text-[11px] text-[#5cb85c]">▲ {idea.score}</div>
            </Link>
          </li>
        ))}
        {!isLoading && ideas.length === 0 && (
          <p className="text-sm text-[#7d5b38]">No ideas yet — propose the first one!</p>
        )}
      </ul>
    </GamePanel>
  )
}

export function NewIdea() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()
  const defaultCategory = (searchParams.get('category') as IdeaCategory) || 'new-app'

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<IdeaCategory>(defaultCategory)
  const [repoId, setRepoId] = useState<number | ''>('')

  const { data: repos = [] } = useQuery({
    queryKey: ['repos'],
    queryFn: () => api.getRepos(),
  })

  const createMut = useMutation({
    mutationFn: () =>
      api.createIdea({
        title: title.trim(),
        description: description.trim(),
        category,
        repo_id: category === 'feature' && repoId !== '' ? Number(repoId) : null,
      }),
    onSuccess: async (idea) => {
      toast.success('Idea posted!')
      await qc.invalidateQueries({ queryKey: ['ideas'] })
      navigate(`/ideas/${idea.id}`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description required')
      return
    }
    createMut.mutate()
  }

  return (
    <GamePanel title="Propose an Idea" onClose={() => navigate('/ideas')}>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="game-input"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <textarea
          className="game-input min-h-28"
          placeholder="Describe your idea…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex gap-2">
          {(['feature', 'new-app'] as IdeaCategory[]).map((c) => (
            <button
              key={c}
              type="button"
              className={`game-btn ${category === c ? 'game-btn-primary' : 'bg-[#f6e3bb]'}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        {category === 'feature' && (
          <select
            className="game-input"
            value={repoId}
            onChange={(e) => setRepoId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Link a registered app (optional)</option>
            {repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.full_name}
              </option>
            ))}
          </select>
        )}
        <button type="submit" className="game-btn game-btn-blue" disabled={createMut.isPending}>
          Post idea
        </button>
      </form>
    </GamePanel>
  )
}

export function IdeaDetail() {
  const { ideaId } = useParams()
  const id = Number(ideaId)
  const navigate = useNavigate()
  const { isMaintainer } = useAuth()
  const qc = useQueryClient()
  const [comment, setComment] = useState('')

  const { data: idea, isLoading } = useQuery({
    queryKey: ['idea', id],
    queryFn: () => api.getIdea(id),
    enabled: Number.isFinite(id),
  })

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', id],
    queryFn: () => api.getComments(id),
    enabled: Number.isFinite(id),
  })

  const voteMut = useMutation({
    mutationFn: (value: 1 | -1) => api.voteIdea(id, value),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['idea', id] })
      await qc.invalidateQueries({ queryKey: ['ideas'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const commentMut = useMutation({
    mutationFn: () => api.createComment(id, { body: comment.trim() }),
    onSuccess: async () => {
      setComment('')
      toast.success('Comment added')
      await qc.invalidateQueries({ queryKey: ['comments', id] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const statusMut = useMutation({
    mutationFn: (status: IdeaStatus) => api.updateIdeaStatus(id, status),
    onSuccess: async () => {
      toast.success('Status updated')
      await qc.invalidateQueries({ queryKey: ['idea', id] })
      await qc.invalidateQueries({ queryKey: ['ideas'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const convertMut = useMutation({
    mutationFn: () => api.convertIdea(id),
    onSuccess: async (bounty) => {
      toast.success('Converted to bounty!')
      await qc.invalidateQueries({ queryKey: ['idea', id] })
      await qc.invalidateQueries({ queryKey: ['bounties'] })
      await qc.invalidateQueries({ queryKey: ['repos'] })
      navigate(`/app/${bounty.repo_id}/bounty/${bounty.id}`)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const sortedComments = useMemo(
    () => [...comments].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [comments],
  )

  if (isLoading || !idea) {
    return (
      <GamePanel title="Idea" onClose={() => navigate('/ideas')}>
        <p className="text-sm text-[#7d5b38]">Loading…</p>
      </GamePanel>
    )
  }

  return (
    <GamePanel title="Idea" onClose={() => navigate('/ideas')} wide>
      <Link to="/ideas" className="mb-3 inline-block text-xs text-sky-700 underline">
        ← Back to Ideas Lab
      </Link>

      <div className="mb-4 flex gap-4">
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            className={`game-btn px-2 py-1 ${idea.my_vote === 1 ? 'game-btn-primary' : 'bg-[#f6e3bb]'}`}
            onClick={() => voteMut.mutate(1)}
          >
            ▲
          </button>
          <span className="font-pixel text-sm">{idea.score}</span>
          <button
            type="button"
            className={`game-btn px-2 py-1 ${idea.my_vote === -1 ? 'game-btn-danger' : 'bg-[#f6e3bb]'}`}
            onClick={() => voteMut.mutate(-1)}
          >
            ▼
          </button>
        </div>
        <div className="flex-1">
          <h3 className="mb-1 text-lg font-bold">{idea.title}</h3>
          <div className="mb-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded bg-sky-100 px-1.5 py-0.5 capitalize text-sky-800">
              {idea.category}
            </span>
            <span className="rounded bg-gray-100 px-1.5 py-0.5 capitalize">{idea.status}</span>
            {idea.repo_name && <span>→ {idea.repo_name}</span>}
            <span>by @{idea.author_username}</span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-[#4a3018]">{idea.description}</p>
        </div>
      </div>

      {isMaintainer && (
        <div className="mb-4 flex flex-wrap gap-2 rounded-lg border-2 border-dashed border-gray-400 bg-[#f6e3bb] p-3">
          <span className="w-full text-xs font-bold uppercase text-[#7d5b38]">Maintainer</span>
          {(['open', 'planned', 'done'] as IdeaStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`game-btn ${idea.status === s ? 'game-btn-blue' : 'bg-[#f6e3bb]'}`}
              onClick={() => statusMut.mutate(s)}
            >
              {s}
            </button>
          ))}
          {idea.category === 'feature' && idea.repo_id && (
            <button
              type="button"
              className="game-btn game-btn-primary"
              disabled={convertMut.isPending}
              onClick={() => convertMut.mutate()}
            >
              Convert to bounty
            </button>
          )}
        </div>
      )}

      <h4 className="font-pixel mb-2 text-[10px]">Comments</h4>
      <ul className="mb-3 space-y-2">
        {sortedComments.map((c) => (
          <li key={c.id} className="rounded-lg bg-[#f6e3bb] px-3 py-2 text-sm border-2 border-[#3b2416]">
            <div className="mb-1 text-xs text-[#7d5b38]">@{c.username}</div>
            {c.body}
          </li>
        ))}
        {sortedComments.length === 0 && (
          <p className="text-sm text-[#7d5b38]">No comments yet.</p>
        )}
      </ul>
      <div className="flex gap-2">
        <input
          className="game-input"
          placeholder="Add a comment…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && comment.trim()) commentMut.mutate()
          }}
        />
        <button
          type="button"
          className="game-btn game-btn-blue"
          disabled={!comment.trim() || commentMut.isPending}
          onClick={() => commentMut.mutate()}
        >
          Post
        </button>
      </div>
    </GamePanel>
  )
}
