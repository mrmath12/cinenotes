'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '../../lib/auth-context'
import { useSupabase } from '../../lib/supabase-provider'
import Footer from '../components/Footer'

interface FilmeItem {
  tmdb_id: number
  title: string
  year: number | null
  poster_url: string | null
  genre_ids: number[]
  avg_score: number | null
  review_count: number
}

type SortMode = 'popular' | 'top_rated'

function getScoreColor(score: number): string {
  if (score >= 7) return 'bg-emerald-600'
  if (score >= 5) return 'bg-amber-500'
  return 'bg-red-600'
}

function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-pulse">
      <div className="w-full aspect-[2/3] bg-white/15" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-white/15 rounded w-3/4" />
        <div className="h-3 bg-white/10 rounded w-1/4" />
        <div className="h-3 bg-white/10 rounded w-1/2" />
      </div>
    </div>
  )
}

function FilmeCard({
  filme,
  isEvaluated,
}: {
  filme: FilmeItem
  isEvaluated: boolean
}) {
  const [imgError, setImgError] = useState(false)
  return (
    <Link href={`/filmes/${filme.tmdb_id}`} className="block group">
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-white/20 transition-all">
        <div className="relative w-full aspect-[2/3] bg-white/10">
          {filme.poster_url && !imgError ? (
            <Image
              src={filme.poster_url}
              alt={filme.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
              onError={() => {
                setImgError(true)
                fetch('/api/movies/clear-poster', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tmdb_id: filme.tmdb_id }),
                })
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/50 text-center px-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium">Sem poster</span>
            </div>
          )}

          {filme.review_count > 0 ? (
            <div
              className={`absolute bottom-2 right-2 ${getScoreColor(filme.avg_score!)} text-white text-sm font-bold px-2 py-0.5 rounded-lg shadow-lg`}
            >
              {filme.avg_score!.toFixed(1)}
            </div>
          ) : (
            <div className="absolute bottom-2 right-2 bg-gray-900/60 text-white text-xs font-semibold px-2 py-0.5 rounded-lg shadow-lg">
              Sem avaliações
            </div>
          )}

          {isEvaluated && (
            <div className="absolute top-2 left-2 bg-emerald-600 text-white text-xs font-semibold px-2 py-0.5 rounded-lg shadow-lg">
              Já Avaliado
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="text-white text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary-300 transition-colors">
            {filme.title}
          </h3>
          <p className="text-muted-400 text-xs mt-0.5">{filme.year}</p>
          <p className="text-muted-400 text-xs mt-1">
            {filme.review_count > 0
              ? `${filme.review_count} ${filme.review_count === 1 ? 'avaliação' : 'avaliações'}`
              : 'Seja o primeiro!'}
          </p>
        </div>
      </div>
    </Link>
  )
}

export default function FilmesPage() {
  const { user } = useAuth()
  const supabase = useSupabase()

  const [searchInput, setSearchInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState<number | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('popular')
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([])

  const [movies, setMovies] = useState<FilmeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const pageRef = useRef(1)

  const [userReviewedIds, setUserReviewedIds] = useState<Set<number>>(new Set())

  const sentinelRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadMoreRef = useRef<() => void>(() => {})
  const genreScrollRef = useRef<HTMLDivElement>(null)

  function scrollGenres(dir: 'left' | 'right') {
    genreScrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' })
  }

  useEffect(() => {
    fetch('/api/tmdb/genres')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setGenres(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!user || !supabase) return
    supabase
      .from('reviews')
      .select('movie_id')
      .eq('user_id', user.id)
      .then(({ data }: { data: { movie_id: number }[] | null }) => {
        if (data) setUserReviewedIds(new Set(data.map(r => r.movie_id)))
      })
  }, [user, supabase])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedQuery(searchInput), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  useEffect(() => {
    if (searchInput.length >= 2) {
      setActiveGenre(null)
      setSortMode('popular')
    }
  }, [searchInput])

  const loadMovies = useCallback(async (
    query: string,
    genre: number | null,
    sort: SortMode,
    page: number,
    append: boolean,
  ) => {
    const effectiveQuery = query.length >= 2 ? query : ''
    const params = new URLSearchParams({ sort, page: String(page) })
    if (effectiveQuery) params.set('query', effectiveQuery)
    if (genre !== null && !effectiveQuery) params.set('genre', String(genre))

    try {
      const res = await fetch(`/api/tmdb/browse?${params}`)
      const json = await res.json()
      const data: FilmeItem[] = json.movies ?? []
      const totalPages: number = json.total_pages ?? 1

      if (append) {
        setMovies(prev => [...prev, ...data])
      } else {
        setMovies(data)
      }
      pageRef.current = page
      setHasMore(page < totalPages)
    } catch {
      // silent
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    pageRef.current = 1
    setIsLoading(true)
    loadMovies(debouncedQuery, activeGenre, sortMode, 1, false)
  }, [debouncedQuery, activeGenre, sortMode, loadMovies])

  loadMoreRef.current = () => {
    if (!hasMore || isLoadingMore || isLoading) return
    setIsLoadingMore(true)
    loadMovies(debouncedQuery, activeGenre, sortMode, pageRef.current + 1, true)
  }

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreRef.current() },
      { threshold: 0.1 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-2xl font-bold text-white mb-6">Explorar Filmes</h1>

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar por título..."
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-muted-400 focus:outline-none focus:border-primary-400 transition-colors"
          />
          {searchInput.length === 1 && (
            <p className="text-muted-400 text-xs mt-1.5 ml-1">Continue digitando para buscar…</p>
          )}
        </div>

        {/* Genre chips */}
        {genres.length > 0 && searchInput.length < 2 && (
          <div className="relative flex items-center mb-5 pb-2">
            <button
              onClick={() => scrollGenres('left')}
              className="flex-shrink-0 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors mr-1"
              aria-label="Rolar para esquerda"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>
            <div ref={genreScrollRef} className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {genres.map(g => (
                <button
                  key={g.id}
                  onClick={() => setActiveGenre(prev => prev === g.id ? null : g.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    activeGenre === g.id
                      ? 'bg-primary-600 text-white border-primary-500'
                      : 'bg-white/5 text-muted-300 border-white/15 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => scrollGenres('right')}
              className="flex-shrink-0 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors ml-1"
              aria-label="Rolar para direita"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Sort tabs */}
        {searchInput.length < 2 && (
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setSortMode('popular')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortMode === 'popular'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/5 text-muted-300 border border-white/15 hover:text-white hover:bg-white/10'
              }`}
            >
              Populares
            </button>
            <button
              onClick={() => setSortMode('top_rated')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortMode === 'top_rated'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white/5 text-muted-300 border border-white/15 hover:text-white hover:bg-white/10'
              }`}
            >
              Mais Bem Avaliados
            </button>
          </div>
        )}

        {/* Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && movies.length === 0 && (
          <div className="text-center py-20">
            {debouncedQuery.length >= 2 ? (
              <p className="text-muted-300 text-lg">
                Nenhum filme encontrado para &ldquo;{debouncedQuery}&rdquo;.
              </p>
            ) : (
              <p className="text-muted-300 text-lg">Nenhum filme encontrado.</p>
            )}
          </div>
        )}

        {/* Grid */}
        {!isLoading && movies.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {movies.map(filme => (
              <FilmeCard
                key={filme.tmdb_id}
                filme={filme}
                isEvaluated={userReviewedIds.has(filme.tmdb_id)}
              />
            ))}
          </div>
        )}

        {/* Sentinel */}
        <div ref={sentinelRef} className="h-4" />

        {/* Loading more */}
        {isLoadingMore && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* End of results */}
        {!isLoading && !isLoadingMore && !hasMore && movies.length > 0 && (
          <p className="text-center text-muted-400 text-sm py-6">
            Nenhum resultado adicional.
          </p>
        )}
      </main>

      <Footer />
    </div>
  )
}
