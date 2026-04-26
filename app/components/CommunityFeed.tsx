'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { createSupabaseBrowserClient } from '../../lib/supabase'
import { censorUsername } from '../../lib/utils'
import { useAuth } from '../../lib/auth-context'
import ReviewModal from './ReviewModal'
import NovaAvaliacaoModal from './NovaAvaliacaoModal'
import LiquidButton from './LiquidButton'

const PAGE_SIZE = 10

type FeedReview = {
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
  } | null
  profiles: {
    full_name: string
    username: string
    avatar_color: string
  } | null
}

function scoreBadgeClass(score: number): string {
  if (score >= 7) return 'bg-green-500/20 text-green-400 border border-green-500/40'
  if (score >= 5) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
  return 'bg-red-500/20 text-red-400 border border-red-500/40'
}

function SkeletonCard() {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex gap-4 animate-pulse">
      <div className="flex-shrink-0 w-16 h-24 rounded-lg bg-white/20" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 bg-white/20 rounded w-3/4" />
        <div className="h-3 bg-white/15 rounded w-1/4" />
        <div className="h-3 bg-white/10 rounded w-1/2 mt-4" />
      </div>
    </div>
  )
}

export default function CommunityFeed() {
  const { user } = useAuth()
  const censor = !user
  const [reviews, setReviews] = useState<FeedReview[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [selectedReview, setSelectedReview] = useState<FeedReview | null>(null)
  const [avaliacaoModalOpen, setAvaliacaoModalOpen] = useState(false)
  const offsetRef = useRef(0)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchReviews = useCallback(async (offset: number) => {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return []

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id, final_score, score_script, score_direction,
        score_photography, score_soundtrack, score_impact,
        comment, created_at,
        movies!inner(tmdb_id, title, year, poster_url),
        profiles!inner(full_name, username, avatar_color)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error || !data) return []
    return data as unknown as FeedReview[]
  }, [])

  useEffect(() => {
    fetchReviews(0).then((data) => {
      setReviews(data)
      offsetRef.current = data.length
      setHasMore(data.length === PAGE_SIZE)
      setInitialLoading(false)
    })
  }, [fetchReviews])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !initialLoading) {
          setLoadingMore(true)
          fetchReviews(offsetRef.current).then((data) => {
            setReviews((prev) => [...prev, ...data])
            offsetRef.current += data.length
            setHasMore(data.length === PAGE_SIZE)
            setLoadingMore(false)
          })
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, initialLoading, fetchReviews])

  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-4">Avaliações da Comunidade</h2>

      {initialLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!initialLoading && reviews.length === 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 text-center">
          <p className="text-primary-200 mb-4">
            Nenhuma avaliação ainda. Seja o primeiro a avaliar um filme!
          </p>
          <LiquidButton variant="purple" onClick={() => setAvaliacaoModalOpen(true)}>Nova Avaliação</LiquidButton>
        </div>
      )}

      {!initialLoading && reviews.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <button
              key={review.id}
              onClick={() => setSelectedReview(review)}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/30 hover:scale-[1.01] transition-all flex gap-4 text-left w-full cursor-pointer"
            >
              {/* Poster */}
              <div className="flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-white/10 relative">
                {review.movies?.poster_url ? (
                  <Image
                    src={review.movies.poster_url}
                    alt={review.movies?.title || 'Poster'}
                    fill
                    className="object-cover"
                    sizes="64px"
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
                  <span className={`flex-shrink-0 text-sm font-bold px-2 py-0.5 rounded-full ${scoreBadgeClass(review.final_score)}`}>
                    {review.final_score.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-auto">
                  {review.profiles && (
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: review.profiles.avatar_color }}
                    >
                      {review.profiles.full_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="text-primary-200 text-sm truncate">
                    @{review.profiles ? (censor ? censorUsername(review.profiles.username) : review.profiles.username) : 'usuário'}
                  </span>
                  <span className="text-primary-400 text-xs ml-auto flex-shrink-0">
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />

      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!initialLoading && !hasMore && reviews.length > 0 && (
        <p className="text-center text-primary-400 text-sm py-4">
          Não há mais avaliações.
        </p>
      )}

      <NovaAvaliacaoModal
        isOpen={avaliacaoModalOpen}
        onClose={() => setAvaliacaoModalOpen(false)}
      />

      {selectedReview && selectedReview.movies && selectedReview.profiles && (
        <ReviewModal
          review={{
            ...selectedReview,
            movies: selectedReview.movies,
            profiles: selectedReview.profiles,
          }}
          isOpen={true}
          onClose={() => setSelectedReview(null)}
          censorProfile={censor}
          showDelete={false}
        />
      )}
    </section>
  )
}
