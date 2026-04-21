'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth-context'
import { createSupabaseBrowserClient } from '../../lib/supabase'
import { deleteReview } from '../../lib/actions'
import Header from '../components/Header'
import Footer from '../components/Footer'

interface ReviewWithMovie {
  id: string
  final_score: number
  score_script: number
  score_direction: number
  score_photography: number
  score_soundtrack: number
  score_impact: number
  comment: string | null
  created_at: string
  movies: {
    tmdb_id: number
    title: string
    year: number
    poster_url: string | null
  }
}

type SortMode = 'date' | 'score_desc' | 'score_asc'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function getScoreBadgeColor(score: number): string {
  if (score >= 8) return 'bg-emerald-600'
  if (score >= 6) return 'bg-amber-600'
  if (score >= 4) return 'bg-orange-600'
  return 'bg-red-600'
}

function sortReviews(reviews: ReviewWithMovie[], mode: SortMode): ReviewWithMovie[] {
  const copy = [...reviews]
  if (mode === 'date') {
    return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  if (mode === 'score_desc') {
    return copy.sort((a, b) => b.final_score - a.final_score)
  }
  return copy.sort((a, b) => a.final_score - b.final_score)
}

interface DeleteModalProps {
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

function DeleteModal({ onConfirm, onCancel, loading }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h2 className="text-white text-lg font-semibold mb-2">Excluir avaliação?</h2>
        <p className="text-muted-300 text-sm mb-6">Essa ação não pode ser desfeita.</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm text-muted-300 hover:text-white border border-white/20 hover:border-white/40 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AvaliacoesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [reviews, setReviews] = useState<ReviewWithMovie[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('date')
  const [fetching, setFetching] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return

    supabase
      .from('reviews')
      .select(`
        id, final_score, score_script, score_direction,
        score_photography, score_soundtrack, score_impact,
        comment, created_at,
        movies!inner(tmdb_id, title, year, poster_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews((data as unknown as ReviewWithMovie[]) ?? [])
        setFetching(false)
      })
  }, [user])

  const sorted = sortReviews(reviews, sortMode)

  function handleSortDate() {
    setSortMode('date')
  }

  function handleSortScore() {
    setSortMode(prev => prev === 'score_desc' ? 'score_asc' : 'score_desc')
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteReview(deleteTarget)
      setReviews(prev => prev.filter(r => r.id !== deleteTarget))
      toast.success('Avaliação excluída.')
      setDeleteTarget(null)
    } catch {
      toast.error('Erro ao excluir. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-6">Minhas Avaliações</h1>

        {reviews.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-300 text-lg mb-6">Você ainda não fez nenhuma avaliação.</p>
            <Link
              href="/nova-avaliacao"
              className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-3 rounded-xl hover:from-primary-600 hover:to-accent-600 transition-all font-medium"
            >
              Avaliar meu primeiro filme
            </Link>
          </div>
        ) : (
          <>
            {/* Sort controls */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleSortDate}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortMode === 'date'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/10 text-muted-300 hover:text-white hover:bg-white/15'
                }`}
              >
                Por Data
              </button>
              <button
                onClick={handleSortScore}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortMode !== 'date'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white/10 text-muted-300 hover:text-white hover:bg-white/15'
                }`}
              >
                Por Nota {sortMode === 'score_desc' ? '↓' : sortMode === 'score_asc' ? '↑' : ''}
              </button>
            </div>

            {/* Review list */}
            <div className="flex flex-col gap-4">
              {sorted.map(review => (
                <div
                  key={review.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4"
                >
                  {/* Poster */}
                  <div className="flex-shrink-0 w-[80px] h-[120px] relative rounded-lg overflow-hidden bg-white/10">
                    {review.movies.poster_url ? (
                      <Image
                        src={review.movies.poster_url}
                        alt={review.movies.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-400 text-xs text-center px-1">
                        Sem poster
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <h2 className="text-white font-semibold text-base leading-tight">
                          {review.movies.title}
                        </h2>
                        <p className="text-muted-400 text-sm">{review.movies.year}</p>
                      </div>
                      <span className={`flex-shrink-0 ${getScoreBadgeColor(review.final_score)} text-white text-sm font-bold px-2 py-0.5 rounded-lg`}>
                        {review.final_score.toFixed(1)}
                      </span>
                    </div>

                    {/* 5 scores */}
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 mb-2">
                      <span className="text-muted-300 text-xs">Roteiro: <span className="text-white">{review.score_script}</span></span>
                      <span className="text-muted-300 text-xs">Direção: <span className="text-white">{review.score_direction}</span></span>
                      <span className="text-muted-300 text-xs">Fotografia: <span className="text-white">{review.score_photography}</span></span>
                      <span className="text-muted-300 text-xs">Trilha: <span className="text-white">{review.score_soundtrack}</span></span>
                      <span className="text-muted-300 text-xs">Impacto: <span className="text-white">{review.score_impact}</span></span>
                    </div>

                    {review.comment && (
                      <p className="text-muted-300 text-sm mb-2 line-clamp-2">{review.comment}</p>
                    )}

                    <div className="flex items-center justify-between mt-1">
                      <span className="text-muted-400 text-xs">{formatDate(review.created_at)}</span>
                      <button
                        onClick={() => setDeleteTarget(review.id)}
                        className="text-muted-400 hover:text-red-400 transition-colors p-1 rounded"
                        aria-label="Excluir avaliação"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />

      {deleteTarget && (
        <DeleteModal
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
