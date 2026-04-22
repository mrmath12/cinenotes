import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase-server'

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

interface TMDBMovie {
  id: number
  title: string
  release_date?: string
  poster_path?: string | null
  genre_ids?: number[]
  popularity?: number
}

interface TMDBResponse {
  results: TMDBMovie[]
  total_pages: number
}

interface FilmeItem {
  tmdb_id: number
  title: string
  year: number | null
  poster_url: string | null
  genre_ids: number[]
  avg_score: number | null
  review_count: number
}

function buildScoreMap(rows: { movie_id: number; final_score: number }[]) {
  const map = new Map<number, number[]>()
  for (const row of rows) {
    if (!map.has(row.movie_id)) map.set(row.movie_id, [])
    map.get(row.movie_id)!.push(row.final_score)
  }
  return map
}

function computeScore(scores: number[]) {
  return parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sort = (searchParams.get('sort') ?? 'popular') as 'popular' | 'top_rated'
  const genre = searchParams.get('genre')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const query = searchParams.get('query') ?? ''

  const apiKey = process.env.TMDB_API_KEY
  const common = `&language=pt-BR&include_adult=false&page=${page}`

  const supabase = await createClient()

  // Fetch all review scores from internal DB (used for enrichment + internal movie list)
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('movie_id, final_score')

  const scoreMap = buildScoreMap(allReviews ?? [])
  const reviewedIds = new Set(scoreMap.keys())

  // On page 1 (no search): load reviewed movies directly from internal DB
  const internalMovies: FilmeItem[] = []
  if (!query && page === 1 && reviewedIds.size > 0) {
    const { data: moviesData } = await supabase
      .from('movies')
      .select('tmdb_id, title, year, poster_url, genres')
      .in('tmdb_id', [...reviewedIds])

    if (moviesData) {
      for (const m of moviesData) {
        const scores = scoreMap.get(m.tmdb_id) ?? []
        internalMovies.push({
          tmdb_id: m.tmdb_id,
          title: m.title,
          year: m.year,
          poster_url: m.poster_url,
          genre_ids: m.genres ?? [],
          avg_score: scores.length > 0 ? computeScore(scores) : null,
          review_count: scores.length,
        })
      }

      // Repair movies with missing poster_url by fetching from TMDB
      const broken = internalMovies.filter(m => !m.poster_url)
      if (broken.length > 0) {
        await Promise.all(
          broken.map(async movie => {
            try {
              const res = await fetch(
                `https://api.themoviedb.org/3/movie/${movie.tmdb_id}?api_key=${apiKey}&language=pt-BR`,
                { next: { revalidate: 86400 } },
              )
              if (!res.ok) return
              const data = await res.json()
              if (data.poster_path) {
                movie.poster_url = `${IMAGE_BASE}${data.poster_path}`
                await supabase
                  .from('movies')
                  .update({ poster_url: movie.poster_url })
                  .eq('tmdb_id', movie.tmdb_id)
              }
            } catch { /* silent */ }
          }),
        )
      }
    }
  }

  // Fetch from TMDB
  let tmdbUrl: string
  if (query.length >= 2) {
    tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}${common}`
  } else if (genre) {
    const sortBy =
      sort === 'top_rated'
        ? 'vote_average.desc&vote_count.gte=100'
        : 'popularity.desc'
    tmdbUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genre}&sort_by=${sortBy}${common}`
  } else {
    const endpoint = sort === 'top_rated' ? 'top_rated' : 'popular'
    tmdbUrl = `https://api.themoviedb.org/3/movie/${endpoint}?api_key=${apiKey}${common}`
  }

  let tmdbData: TMDBResponse
  try {
    const res = await fetch(tmdbUrl, { next: { revalidate: 300 } })
    if (!res.ok) throw new Error(`TMDB ${res.status}`)
    tmdbData = await res.json()
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível carregar filmes. Tente novamente.' },
      { status: 502 },
    )
  }

  // Build a poster map from fresh TMDB results to fix stale poster_urls in internal movies
  const tmdbPosterMap = new Map<number, string>()
  for (const m of tmdbData.results ?? []) {
    if (m.poster_path) tmdbPosterMap.set(m.id, m.poster_path)
  }

  // Update internalMovies poster URLs using fresh TMDB data (no extra API calls)
  const posterUpdates: Promise<unknown>[] = []
  for (const movie of internalMovies) {
    const freshPath = tmdbPosterMap.get(movie.tmdb_id)
    if (freshPath) {
      const freshUrl = `${IMAGE_BASE}${freshPath}`
      if (movie.poster_url !== freshUrl) {
        movie.poster_url = freshUrl
        posterUpdates.push(
          Promise.resolve(supabase.from('movies').update({ poster_url: freshUrl }).eq('tmdb_id', movie.tmdb_id)),
        )
      }
    }
  }
  if (posterUpdates.length > 0) await Promise.all(posterUpdates)

  // Apply genre filter to internalMovies after TMDB fetch.
  // Uses TMDB discover results as fallback for movies with empty genres in the DB.
  if (!query && genre) {
    const genreId = parseInt(genre, 10)
    const tmdbMatchIds = new Set((tmdbData.results ?? []).map(m => m.id))
    const filtered = internalMovies.filter(m =>
      m.genre_ids.includes(genreId) || tmdbMatchIds.has(m.tmdb_id)
    )
    internalMovies.length = 0
    internalMovies.push(...filtered)
  }

  internalMovies.sort((a, b) => (b.avg_score ?? 0) - (a.avg_score ?? 0))

  // When searching: include reviewed movies enriched with internal scores (don't exclude them).
  // When not searching: exclude reviewed movies since they appear in internalMovies.
  const tmdbMovies: FilmeItem[] = (tmdbData.results ?? [])
    .filter(m => query.length >= 2 || !reviewedIds.has(m.id))
    .map(m => {
      const scores = query.length >= 2 ? (scoreMap.get(m.id) ?? []) : []
      return {
        tmdb_id: m.id,
        title: typeof m.title === 'string' ? m.title : '',
        year: m.release_date ? parseInt(m.release_date.slice(0, 4), 10) || null : null,
        poster_url: m.poster_path ? `${IMAGE_BASE}${m.poster_path}` : null,
        genre_ids: m.genre_ids ?? [],
        avg_score: scores.length > 0 ? computeScore(scores) : null,
        review_count: scores.length,
      }
    })

  // When searching, sort reviewed movies first (by score), then the rest (stable TMDB order)
  if (query.length >= 2) {
    tmdbMovies.sort((a, b) => {
      if (a.review_count > 0 && b.review_count === 0) return -1
      if (a.review_count === 0 && b.review_count > 0) return 1
      return (b.avg_score ?? 0) - (a.avg_score ?? 0)
    })
  }

  const movies = [...internalMovies, ...tmdbMovies]

  return NextResponse.json({
    movies,
    total_pages: tmdbData.total_pages ?? 1,
  })
}
