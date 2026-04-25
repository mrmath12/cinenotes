'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth-context'
import { deleteReview, fetchPublicReviews } from '../../lib/actions'
import Avatar from '../components/Avatar'
import Footer from '../components/Footer'
import ReviewModal from '../components/ReviewModal'
import NovaAvaliacaoModal from '../components/NovaAvaliacaoModal'

interface ReviewWithMovie {
  id: string
  user_id: string
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


function getScoreBadgeColor(score: number): string {
  if (score >= 8) return 'bg-emerald-600'
  if (score >= 6) return 'bg-amber-600'
  if (score >= 4) return 'bg-orange-600'
  return 'bg-red-600'
}

function sortReviews(reviews: ReviewWithMovie[], mode: SortMode): ReviewWithMovie[] {
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

interface DeleteModalProps {
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

function DeleteModal({ onConfirm, onCancel, loading }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
      <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h2 id="delete-modal-title" className="text-white text-lg font-semibold mb-2">Excluir avaliação?</h2>
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
  const { user } = useAuth()

  const [reviews, setReviews] = useState<ReviewWithMovie[]>([])
  const [sortMode, setSortMode] = useState<SortMode>('date_desc')
  const [fetching, setFetching] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedReview, setSelectedReview] = useState<ReviewWithMovie | null>(null)
  const [avaliacaoModalOpen, setAvaliacaoModalOpen] = useState(false)

  useEffect(() => {
    fetchPublicReviews().then((data) => {
      setReviews(data as unknown as ReviewWithMovie[])
      setFetching(false)
    })
  }, [])

  const sorted = sortReviews(reviews, sortMode)

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

  async function handleModalDelete(reviewId: string) {
    await deleteReview(reviewId)
    setReviews(prev => prev.filter(r => r.id !== reviewId))
    setSelectedReview(null)
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-2xl font-bold text-white mb-6">Avaliações da Comunidade</h1>

        {reviews.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-300 text-lg mb-6">Nenhuma avaliação ainda.</p>
            {user && (
              <button
                onClick={() => setAvaliacaoModalOpen(true)}
                className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-3 rounded-xl hover:from-primary-600 hover:to-accent-600 transition-all font-medium cursor-pointer"
              >
                Seja o primeiro a avaliar
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Sort controls + action buttons */}
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
              <div className="flex gap-3">
                <button
                  onClick={() => setAvaliacaoModalOpen(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
                >
                  + Nova Avaliação
                </button>
                <Link
                  href="/minhas-avaliacoes"
                  className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg text-sm font-medium transition border border-white/20"
                >
                  Minhas Avaliações
                </Link>
              </div>
            </div>

            {/* Review grid — 3 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map(review => (
                <button
                  key={review.id}
                  type="button"
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex gap-4 p-4 cursor-pointer hover:bg-white/8 hover:scale-[1.01] transition-all text-left w-full"
                  onClick={() => setSelectedReview(review)}
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
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <div className="min-w-0">
                        <h2 className="text-white font-semibold text-lg leading-tight line-clamp-2">
                          {review.movies.title}
                        </h2>
                        <p className="text-muted-400 text-base">{review.movies.year}</p>
                      </div>
                      <span className={`flex-shrink-0 ${getScoreBadgeColor(review.final_score)} text-white text-base font-bold px-2 py-0.5 rounded-md`}>
                        {review.final_score.toFixed(1)}
                      </span>
                    </div>

                    {/* Author + delete */}
                    <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-white/10">
                      <div className="flex items-center gap-1 min-w-0">
                        <Avatar
                          fullName={review.profiles.full_name}
                          avatarColor={review.profiles.avatar_color}
                          size="xs"
                        />
                        <span className="text-muted-400 text-sm truncate">
                          {review.profiles.username || review.profiles.full_name}
                        </span>
                      </div>

                      {user && user.id === review.user_id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(review.id) }}
                          className="flex-shrink-0 text-muted-400 hover:text-red-400 transition-colors p-1 rounded"
                          aria-label="Excluir avaliação"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
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
          showDelete={!!(user && user.id === selectedReview.user_id)}
          onDelete={handleModalDelete}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      <NovaAvaliacaoModal
        isOpen={avaliacaoModalOpen}
        onClose={() => setAvaliacaoModalOpen(false)}
      />
    </div>
  )
}
