'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ReviewCardData {
  id: string
  final_score: number
  created_at: string
  movies: {
    title: string
    year: number
    poster_url: string | null
  } | null
  profiles: {
    full_name: string
    username: string
    avatar_color: string
  } | null
}

interface ReviewCardProps {
  review: ReviewCardData
}

function scoreBadgeClass(score: number): string {
  if (score >= 7) return 'bg-green-500/20 text-green-400 border border-green-500/40'
  if (score >= 5) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
  return 'bg-red-500/20 text-red-400 border border-red-500/40'
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const [imgError, setImgError] = useState(false)
  const displayName =
    review.profiles?.full_name || review.profiles?.username || 'Usuário'
  const initials = displayName.charAt(0).toUpperCase()
  const avatarColor = review.profiles?.avatar_color || '#6366f1'

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/30 transition-all flex gap-4">
      {/* Poster */}
      <div className="flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-white/10 relative">
        {review.movies?.poster_url && !imgError ? (
          <Image
            src={review.movies.poster_url}
            alt={review.movies?.title || 'Poster'}
            fill
            className="object-cover"
            sizes="64px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs text-center px-1">
            Sem poster
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">
              {review.movies?.title || 'Filme desconhecido'}
            </p>
            <p className="text-primary-300 text-sm">{review.movies?.year}</p>
          </div>
          <span
            className={`flex-shrink-0 text-sm font-bold px-2 py-0.5 rounded-full ${scoreBadgeClass(review.final_score)}`}
          >
            {review.final_score.toFixed(1)}
          </span>
        </div>

        {/* Reviewer */}
        <div className="flex items-center gap-2 mt-auto">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </span>
          <span className="text-primary-200 text-sm truncate">{displayName}</span>
          <span className="text-primary-400 text-xs ml-auto flex-shrink-0">
            {new Date(review.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>
    </div>
  )
}
