'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '../../../lib/auth-context'
import { useSupabase } from '../../../lib/supabase-provider'
import Footer from '../../components/Footer'

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
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-400 text-xs text-center px-2">
              Sem poster
            </div>
          )}

          {filme.review_count > 0 ? (
            <div
              className={`absolute bottom-2 right-2 ${getScoreColor(filme.avg_score!)} text-white text-sm font-bold px-2 py-0.5 rounded-lg shadow-lg`}
            >
              {filme.avg_score!.toFixed(1)}
            </div>
          ) : (
            <div className="absolute bottom-2 right-2 bg-white/20 text-white/70 text-xs font-medium px-2 py-0.5 rounded-lg shadow-lg">
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
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
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
