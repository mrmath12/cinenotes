'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '../../lib/auth-context'
import ReviewModal from './ReviewModal'
import { useDragScroll } from '../hooks/useDragScroll'

interface CarouselReview {
  id: string
  tmdb_id: number
  final_score: number
  score_script: number
  score_direction: number
  score_photography: number
  score_soundtrack: number
  score_impact: number
  comment: string | null
  created_at: string
  title: string
  year: number
  poster_url: string | null
  reviewer: string | null
  full_name: string
  username: string
  avatar_color: string
}

interface ReviewsCarouselProps {
  reviews: CarouselReview[]
}

function PosterImage({ src, alt, sizes, tmdb_id }: { src: string; alt: string; sizes: string; tmdb_id: number }) {
  const [error, setError] = useState(false)
  if (error) return (
    <div className="w-full h-full flex items-center justify-center text-muted-400">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
      </svg>
    </div>
  )
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes={sizes}
      onError={() => {
        setError(true)
        fetch('/api/movies/clear-poster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tmdb_id }),
        })
      }}
    />
  )
}

function scoreColor(score: number): string {
  if (score >= 7.0) return 'text-green-400'
  if (score >= 5.0) return 'text-yellow-400'
  return 'text-red-400'
}

export default function ReviewsCarousel({ reviews }: ReviewsCarouselProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [selectedReview, setSelectedReview] = useState<CarouselReview | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { user } = useAuth()
  const { ref: scrollRef, onPointerDown, onPointerMove, onPointerUp, onClickCapture } = useDragScroll<HTMLDivElement>()

  const total = reviews.length
  // Max index actually reachable by scrolling — depends on how many cards are visible at once
  const [maxIdx, setMaxIdx] = useState(total - 1)

  // Recalculate maxIdx whenever the container or its cards are resized
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => {
      const firstCard = el.children[0] as HTMLElement | undefined
      if (!firstCard || firstCard.offsetWidth === 0) return
      const visible = Math.round(el.clientWidth / firstCard.offsetWidth)
      setMaxIdx(Math.max(0, total - visible))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  // card.offsetLeft is relative to offsetParent, not to el — subtract el.offsetLeft to get the correct scroll target
  const cardScrollLeft = (card: HTMLElement) => card.offsetLeft - (scrollRef.current?.offsetLeft ?? 0)

  const scrollToCard = (idx: number) => {
    const el = scrollRef.current
    if (!el) return
    const card = el.children[idx] as HTMLElement | undefined
    if (card) el.scrollTo({ left: cardScrollLeft(card), behavior: 'smooth' })
  }

  const next = () => {
    const newIdx = current >= maxIdx ? 0 : current + 1
    setCurrent(newIdx)
    const el = scrollRef.current
    if (!el) return
    if (newIdx === 0) {
      el.scrollLeft = 0
    } else {
      scrollToCard(newIdx)
    }
  }

  const prev = () => {
    const newIdx = current <= 0 ? maxIdx : current - 1
    setCurrent(newIdx)
    const el = scrollRef.current
    if (!el) return
    if (newIdx === maxIdx) {
      el.scrollLeft = el.scrollWidth
    } else {
      scrollToCard(newIdx)
    }
  }

  // Sync dots when user drags manually
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const elOffsetLeft = el.offsetLeft
    let timeout: ReturnType<typeof setTimeout>
    const onScroll = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        const cards = Array.from(el.children)
        let closest = 0
        let closestDist = Infinity
        cards.forEach((card, i) => {
          const dist = Math.abs((card as HTMLElement).offsetLeft - elOffsetLeft - el.scrollLeft)
          if (dist < closestDist) { closestDist = dist; closest = i }
        })
        setCurrent(closest)
      }, 150)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); clearTimeout(timeout) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (paused || total === 0) return
    intervalRef.current = setInterval(next, 5000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, total, current])

  if (total === 0) {
    if (user) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-lg mb-1">Nenhuma avaliação ainda</p>
            <p className="text-muted-400 text-sm">Que tal avaliar o primeiro filme?</p>
          </div>
          <Link
            href="/dashboard"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition font-medium"
          >
            Avaliar meu primeiro filme
          </Link>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-muted-400 text-lg">Nenhuma avaliação ainda. Seja o primeiro!</p>
        <Link
          href="/register"
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg transition font-medium"
        >
          Criar Conta
        </Link>
      </div>
    )
  }

  return (
    <div
      className="relative py-2 px-1"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Scrollable cards container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto"
        style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory', cursor: 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {reviews.map(review => (
          <div
            key={review.id}
            className="flex-none w-full sm:w-[calc(50%-8px)] md:w-[calc(33.333%-10.667px)] lg:w-[calc(25%-12px)] xl:w-[calc(20%-12.8px)]"
            style={{ scrollSnapAlign: 'start' }}
          >
            <div onClick={() => setSelectedReview(review)} className="block h-full cursor-pointer">
            <div className="p-[1px] rounded-xl bg-gradient-to-br from-white/30 via-white/5 to-white/15 h-full hover:scale-[1.02] transition-all">
            <div className="bg-white/5 backdrop-blur-xl backdrop-saturate-150 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)] overflow-hidden h-full">
              {/* Poster */}
              <div className="relative w-full aspect-[2/3] bg-white/5">
                {review.poster_url ? (
                  <PosterImage
                    src={review.poster_url}
                    alt={review.title}
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    tmdb_id={review.tmdb_id}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold leading-tight truncate">{review.title}</p>
                    <p className="text-muted-400 text-sm">{review.year}</p>
                  </div>
                  <div className={`text-xl font-bold flex-shrink-0 ${scoreColor(review.final_score)}`}>
                    {review.final_score.toFixed(1)}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-muted-400 text-xs">
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  {review.reviewer && (
                    <p className="text-muted-400 text-xs truncate ml-2">
                      {user
                        ? `@${review.reviewer}`
                        : (() => { const n = review.reviewer; return '@' + (n.length <= 2 ? n[0] + '*' : n[0] + '*'.repeat(n.length - 2) + n[n.length - 1]) })()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      {total > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={prev}
            aria-label="Anterior"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Dots — limited to reachable positions (maxIdx varies with screen width) */}
          <div className="flex gap-2">
            {Array.from({ length: maxIdx + 1 }, (_, idx) => (
              <button
                key={idx}
                onClick={() => { setCurrent(idx); scrollToCard(idx) }}
                aria-label={`Ir para avaliação ${idx + 1}`}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === current ? 'bg-primary-400 w-4' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            aria-label="Próximo"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {selectedReview && (
        <ReviewModal
          review={{
            id: selectedReview.id,
            final_score: selectedReview.final_score,
            score_script: selectedReview.score_script,
            score_direction: selectedReview.score_direction,
            score_photography: selectedReview.score_photography,
            score_soundtrack: selectedReview.score_soundtrack,
            score_impact: selectedReview.score_impact,
            comment: selectedReview.comment,
            created_at: selectedReview.created_at,
            movies: {
              tmdb_id: selectedReview.tmdb_id,
              title: selectedReview.title,
              year: selectedReview.year,
              poster_url: selectedReview.poster_url,
            },
            profiles: {
              full_name: selectedReview.full_name,
              username: selectedReview.username,
              avatar_color: selectedReview.avatar_color,
            },
          }}
          isOpen={true}
          onClose={() => setSelectedReview(null)}
          censorProfile={!user}
        />
      )}
    </div>
  )
}
