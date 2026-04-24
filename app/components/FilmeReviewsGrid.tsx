'use client'

import { useState } from 'react'
import Avatar from './Avatar'
import ReviewModal from './ReviewModal'

interface ReviewItem {
  id: string
  final_score: number
  score_script: number
  score_direction: number
  score_photography: number
  score_soundtrack: number
  score_impact: number
  comment: string | null
  created_at: string
  profiles: {
    full_name: string
    username: string
    avatar_color: string
  } | null
}

interface MovieInfo {
  tmdb_id: number
  title: string
  year: number | null
  poster_url: string | null
}

interface FilmeReviewsGridProps {
  reviews: ReviewItem[]
  movie: MovieInfo
}

function getScoreColor(score: number): string {
  if (score >= 7) return 'bg-emerald-600'
  if (score >= 5) return 'bg-amber-500'
  return 'bg-red-600'
}

export default function FilmeReviewsGrid({ reviews, movie }: FilmeReviewsGridProps) {
  const [selected, setSelected] = useState<ReviewItem | null>(null)

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
        <p className="text-muted-400">Nenhuma avaliação ainda. Seja o primeiro!</p>
      </div>
    )
  }

  const modalReview = selected
    ? {
        ...selected,
        profiles: selected.profiles ?? { full_name: 'Usuário', username: 'usuario', avatar_color: '#6366f1' },
        movies: {
          tmdb_id: movie.tmdb_id,
          title: movie.title,
          year: movie.year ?? 0,
          poster_url: movie.poster_url,
        },
      }
    : null

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map(review => (
          <button
            key={review.id}
            type="button"
            onClick={() => setSelected(review)}
            className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/8 hover:border-white/20 transition-colors text-left w-full cursor-pointer"
          >
            <div className="flex items-start gap-3">
              {review.profiles && (
                <Avatar
                  fullName={review.profiles.full_name}
                  avatarColor={review.profiles.avatar_color}
                  size="sm"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white text-sm font-medium truncate">
                    {review.profiles?.full_name ?? review.profiles?.username ?? 'Usuário'}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`${getScoreColor(review.final_score)} text-white text-xs font-bold px-2 py-0.5 rounded-lg`}>
                      {review.final_score.toFixed(1)}
                    </span>
                    <span className="text-muted-300 text-xs">
                      {new Date(review.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-muted-300 text-sm mt-1.5 leading-relaxed line-clamp-2">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {modalReview && (
        <ReviewModal
          review={modalReview}
          isOpen={true}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
