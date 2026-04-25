'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { censorUsername } from '../../lib/utils'

type ReviewModalReview = {
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

interface ReviewModalProps {
  review: ReviewModalReview
  isOpen: boolean
  onClose: () => void
  showDelete?: boolean
  onDelete?: (reviewId: string) => void
  censorProfile?: boolean
}

function scoreBadgeClass(score: number): string {
  if (score >= 7.0) return 'bg-green-500/20 text-green-400 border border-green-500/40'
  if (score >= 5.0) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
  return 'bg-red-500/20 text-red-400 border border-red-500/40'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function ReviewModal({
  review,
  isOpen,
  onClose,
  showDelete = false,
  onDelete,
  censorProfile = false,
}: ReviewModalProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setShowConfirm(false)
      return
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const firstName = review.profiles.full_name.split(' ')[0]
  const displayName = censorProfile ? firstName : review.profiles.full_name
  const displayUsername = censorProfile
    ? censorUsername(review.profiles.username)
    : review.profiles.username
  const initials = displayName.charAt(0).toUpperCase()

  async function handleConfirmDelete() {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete(review.id)
      toast.success('Avaliação excluída.')
      onClose()
    } catch {
      toast.error('Erro ao excluir. Tente novamente.')
      setDeleting(false)
    }
  }

  const scores = [
    { label: 'Roteiro', value: review.score_script },
    { label: 'Direção', value: review.score_direction },
    { label: 'Fotografia', value: review.score_photography },
    { label: 'Trilha Sonora', value: review.score_soundtrack },
    { label: 'Impacto Geral', value: review.score_impact },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="p-[1px] rounded-2xl bg-gradient-to-br from-white/30 via-white/5 to-white/15 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
      <div
        className="bg-white/5 backdrop-blur-xl backdrop-saturate-150 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)] max-h-[90vh] overflow-y-auto"
      >
        {/* Close button */}
        <div className="flex justify-end p-4 pb-0">
          <button
            onClick={onClose}
            className="text-muted-400 hover:text-white transition-colors p-1 rounded"
            aria-label="Fechar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Header: poster + title + score */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-20 h-[120px] relative rounded-lg overflow-hidden bg-white/10">
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

            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-lg leading-tight">
                {review.movies.title}
              </h2>
              <p className="text-muted-400 text-sm mb-2">{review.movies.year}</p>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-muted-300 text-sm">Nota Final:</span>
                <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${scoreBadgeClass(review.final_score)}`}>
                  {review.final_score.toFixed(1)}
                </span>
              </div>

              <Link
                href={`/filmes/${review.movies.tmdb_id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 text-sm transition-colors"
              >
                Ir para o Filme
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          <hr className="border-white/10" />

          {/* Individual scores */}
          <div>
            {scores.map(({ label, value }, index) => (
              <div key={label}>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-300 text-sm">{label}:</span>
                  <span className="text-white text-sm font-medium">{value.toFixed(1)}</span>
                </div>
                {index < scores.length - 1 && (
                  <hr className="border-white/10" />
                )}
              </div>
            ))}
          </div>

          <hr className="border-white/10" />

          {/* Reviewer + date */}
          <div className="flex items-center gap-2">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: review.profiles.avatar_color }}
            >
              {initials}
            </span>
            <div className="min-w-0 flex flex-col">
              <span className="text-white text-sm font-medium">{displayName}</span>
              <span className="text-muted-400 text-xs">@{displayUsername}</span>
            </div>
            <span className="text-muted-400 text-xs ml-auto flex-shrink-0">
              {formatDate(review.created_at)}
            </span>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-muted-300 text-sm italic leading-relaxed">
              &ldquo;{review.comment}&rdquo;
            </p>
          )}

          {/* Delete section */}
          {showDelete && (
            <div className="pt-2">
              {!showConfirm ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full py-2 rounded-lg text-sm font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                >
                  Excluir Avaliação
                </button>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-3">
                  <p className="text-white text-sm font-medium">Excluir avaliação?</p>
                  <p className="text-muted-300 text-xs">Essa ação não pode ser desfeita.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirm(false)}
                      disabled={deleting}
                      className="flex-1 py-2 rounded-lg text-sm text-muted-300 border border-white/20 hover:border-white/40 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      disabled={deleting}
                      className="flex-1 py-2 rounded-lg text-sm bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                    >
                      {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
