'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '../../lib/supabase'
import type { DashboardReview } from './page'

type CommunityReview = {
  movie_id: number
  final_score: number
  movies: {
    tmdb_id: number
    title: string
    year: number
    poster_url: string | null
    genres: number[]
  }
}

type Recommendation = {
  movie: CommunityReview['movies']
  avgScore: number
  reviewCount: number
}

const TMDB_GENRES: Record<number, string> = {
  28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia',
  80: 'Crime', 99: 'Documentário', 18: 'Drama', 10751: 'Família',
  14: 'Fantasia', 36: 'História', 27: 'Terror', 10402: 'Música',
  9648: 'Mistério', 10749: 'Romance', 878: 'Ficção Científica',
  10770: 'Filme de TV', 53: 'Thriller', 10752: 'Guerra', 37: 'Faroeste',
}

function scoreBadgeClass(score: number) {
  if (score >= 7) return 'bg-green-500/20 text-green-400 border border-green-500/40'
  if (score >= 5) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
  return 'bg-red-500/20 text-red-400 border border-red-500/40'
}

interface Props {
  userId: string
  userReviews: DashboardReview[]
}

export default function ForYouSection({ userId, userReviews }: Props) {
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [favoriteGenres, setFavoriteGenres] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return

    // Extract top genres from high-rated user reviews
    const highRated = userReviews.filter(r => r.final_score >= 7)
    const genreFreq: Record<number, number> = {}
    for (const r of highRated) {
      for (const g of r.movies.genres ?? []) {
        genreFreq[g] = (genreFreq[g] || 0) + 1
      }
    }
    const topGenres = Object.entries(genreFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => Number(id))

    setFavoriteGenres(topGenres)

    const ratedIds = userReviews.map(r => r.movies.tmdb_id)

    let query = supabase
      .from('reviews')
      .select('movie_id, final_score, movies!inner(tmdb_id, title, year, poster_url, genres)')
      .neq('user_id', userId)
      .gte('final_score', 7)
      .limit(300)

    if (ratedIds.length > 0) {
      query = query.not('movie_id', 'in', `(${ratedIds.join(',')})`)
    }

    query.then(({ data }) => {
      const communityReviews = (data as unknown as CommunityReview[]) ?? []

      // Group by movie and compute avg score
      const movieMap = new Map<number, { movie: CommunityReview['movies']; scores: number[] }>()
      for (const r of communityReviews) {
        const id = r.movies.tmdb_id
        if (!movieMap.has(id)) movieMap.set(id, { movie: r.movies, scores: [] })
        movieMap.get(id)!.scores.push(r.final_score)
      }

      const candidates = Array.from(movieMap.values())
        .map(({ movie, scores }) => ({
          movie,
          avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
          reviewCount: scores.length,
          genreMatch: topGenres.length > 0 && (movie.genres ?? []).some(g => topGenres.includes(g)),
        }))
        .sort((a, b) => b.avgScore - a.avgScore)

      // Prefer genre matches; fall back to all community picks
      const genreMatches = candidates.filter(c => c.genreMatch)
      const result = topGenres.length > 0 && genreMatches.length >= 4
        ? genreMatches.slice(0, 8)
        : candidates.slice(0, 8)

      setRecs(result)
      setLoading(false)
    })
  }, [userId, userReviews])

  const genreNames = favoriteGenres.map(id => TMDB_GENRES[id]).filter(Boolean).slice(0, 2)
  const hasGenreContext = genreNames.length > 0

  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-1">Para Você</h2>
      <p className="text-muted-400 text-sm mb-4">
        {hasGenreContext
          ? `Baseado no seu gosto por ${genreNames.join(' e ')} — filmes bem avaliados pela comunidade que você ainda não viu`
          : 'Filmes bem avaliados pela comunidade que você ainda não viu'}
      </p>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden animate-pulse">
              <div className="w-full aspect-[2/3] bg-white/10" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/10 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && recs.length === 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-muted-300">
            {userReviews.length === 0
              ? 'Avalie alguns filmes para receber recomendações personalizadas!'
              : 'Você está em dia com a comunidade — nenhuma novidade por enquanto.'}
          </p>
        </div>
      )}

      {!loading && recs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {recs.map(({ movie, avgScore, reviewCount }) => (
            <Link
              key={movie.tmdb_id}
              href={`/filmes/${movie.tmdb_id}`}
              className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 hover:bg-white/8 hover:scale-[1.03] transition-all duration-300 group"
            >
              <div className="relative w-full aspect-[2/3] bg-white/10">
                {movie.poster_url ? (
                  <Image
                    src={movie.poster_url}
                    alt={movie.title}
                    fill
                    className="object-cover transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-400 text-xs text-center px-2">
                    Sem poster
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${scoreBadgeClass(avgScore)}`}>
                    {avgScore.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="p-3">
                <p className="text-white text-sm font-medium leading-tight line-clamp-2">{movie.title}</p>
                <p className="text-muted-400 text-xs mt-0.5">{movie.year}</p>
                <p className="text-muted-500 text-xs mt-1">
                  {reviewCount} {reviewCount === 1 ? 'avaliação' : 'avaliações'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
