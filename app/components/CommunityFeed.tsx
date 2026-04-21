'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '../../lib/supabase'
import ReviewCard from './ReviewCard'

const PAGE_SIZE = 10

interface FeedReview {
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
  const [reviews, setReviews] = useState<FeedReview[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchReviews = useCallback(async (offset: number) => {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return []

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id, final_score, created_at,
        movies!inner(title, year, poster_url),
        profiles!inner(full_name, username, avatar_color)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error || !data) return []
    return data as unknown as FeedReview[]
  }, [])

  // Initial load
  useEffect(() => {
    fetchReviews(0).then((data) => {
      setReviews(data)
      offsetRef.current = data.length
      setHasMore(data.length === PAGE_SIZE)
      setInitialLoading(false)
    })
  }, [fetchReviews])

  // Infinite scroll observer
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
          <Link
            href="/nova-avaliacao"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition"
          >
            Nova Avaliação
          </Link>
        </div>
      )}

      {!initialLoading && reviews.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Sentinel for infinite scroll */}
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
    </section>
  )
}
