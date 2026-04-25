'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import { createSupabaseBrowserClient } from '../../lib/supabase'
import { deleteReview } from '../../lib/actions'
import ReviewModal from '../components/ReviewModal'
import NovaAvaliacaoModal from '../components/NovaAvaliacaoModal'
import Footer from '../components/Footer'

type MyReview = {
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
  profiles: {
    full_name: string
    username: string
    avatar_color: string
  }
}

type SortMode = 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc'

function scoreBadgeClass(score: number): string {
  if (score >= 7) return 'bg-green-500/20 text-green-400 border border-green-500/40'
  if (score >= 5) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
  return 'bg-red-500/20 text-red-400 border border-red-500/40'
}

function sortReviews(reviews: MyReview[], mode: SortMode): MyReview[] {
  const copy = [...reviews]
  if (mode === 'date_desc') {
    return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  if (mode === 'date_asc') {
    return copy.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }
  if (mode === 'score_desc') {
    return copy.sort((a, b) => b.final_score - a.final_score)
  }
  return copy.sort((a, b) => a.final_score - b.final_score)
}

export default function MinhasAvaliacoesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [reviews, setReviews] = useState<MyReview[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('date_desc')
  const [fetching, setFetching] = useState(true)
  const [selectedReview, setSelectedReview] = useState<MyReview | null>(null)
  const [avaliacaoModalOpen, setAvaliacaoModalOpen] = useState(false)

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
        movies!inner(tmdb_id, title, year, poster_url),
        profiles!inner(full_name, username, avatar_color)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews((data as unknown as MyReview[]) ?? [])
        setFetching(false)
      })
  }, [user])

  const sorted = sortReviews(reviews, sortMode)

  const handleDelete = async (reviewId: string) => {
    await deleteReview(reviewId)
    setReviews((prev) => prev.filter((r) => r.id !== reviewId))
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
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-2xl font-bold text-white mb-6">Minhas Avaliações</h1>

        {reviews.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-300 text-lg mb-6">Você ainda não fez nenhuma avaliação.</p>
            <button
              onClick={() => setAvaliacaoModalOpen(true)}
              className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-3 rounded-xl hover:from-primary-600 hover:to-accent-600 transition-all font-medium cursor-pointer"
            >
              Avaliar meu primeiro filme
            </button>
          </div>
        ) : (
          <>
            {/* Sort controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-3">
                <button
                  onClick={() => setSortMode((prev) => (prev === 'date_desc' ? 'date_asc' : 'date_desc'))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortMode === 'date_desc' || sortMode === 'date_asc'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-muted-300 hover:text-white hover:bg-white/15'
                  }`}
                >
                  Por Data {sortMode === 'date_desc' ? '↓' : sortMode === 'date_asc' ? '↑' : ''}
                </button>
                <button
                  onClick={() => setSortMode((prev) => (prev === 'score_desc' ? 'score_asc' : 'score_desc'))}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortMode === 'score_desc' || sortMode === 'score_asc'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white/10 text-muted-300 hover:text-white hover:bg-white/15'
                  }`}
                >
                  Por Nota {sortMode === 'score_desc' ? '↓' : sortMode === 'score_asc' ? '↑' : ''}
                </button>
              </div>
              <button
                onClick={() => setAvaliacaoModalOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
              >
                + Nova Avaliação
              </button>
            </div>

            {/* Review list */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sorted.map((review) => (
                <button
                  key={review.id}
                  onClick={() => setSelectedReview(review)}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 text-left hover:border-white/20 hover:bg-white/8 hover:scale-[1.01] transition-all cursor-pointer w-full"
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
                      <div className="min-w-0">
                        <h2 className="text-white font-semibold text-base leading-tight truncate">
                          {review.movies.title}
                        </h2>
                        <p className="text-muted-400 text-sm">{review.movies.year}</p>
                      </div>
                      <span className={`flex-shrink-0 text-sm font-bold px-2 py-0.5 rounded-full ${scoreBadgeClass(review.final_score)}`}>
                        {review.final_score.toFixed(1)}
                      </span>
                    </div>

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

                    <span className="text-muted-400 text-xs">
                      {new Date(review.created_at).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />

      {selectedReview && (
        <ReviewModal
          review={selectedReview}
          isOpen={true}
          onClose={() => setSelectedReview(null)}
          showDelete={true}
          onDelete={handleDelete}
          censorProfile={false}
        />
      )}

      <NovaAvaliacaoModal
        isOpen={avaliacaoModalOpen}
        onClose={() => setAvaliacaoModalOpen(false)}
      />
    </div>
  )
}
