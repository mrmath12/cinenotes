import { NextRequest, NextResponse } from 'next/server'

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

interface TMDBMovie {
  id: number
  title: string
  release_date?: string
  poster_path?: string | null
}

interface TMDBDiscoverResponse {
  results: TMDBMovie[]
  total_pages: number
  total_results: number
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const genre = searchParams.get('genre')
  const yearFrom = searchParams.get('year_from')
  const yearTo = searchParams.get('year_to')
  const minRating = searchParams.get('min_rating')
  const actorId = searchParams.get('actor_id')
  const directorId = searchParams.get('director_id')

  const apiKey = process.env.TMDB_API_KEY

  function buildUrl(page: number): string {
    const params = new URLSearchParams({
      api_key: apiKey!,
      language: 'pt-BR',
      include_adult: 'false',
      sort_by: 'popularity.desc',
      page: String(page),
    })
    if (genre) params.set('with_genres', genre)
    if (yearFrom) params.set('primary_release_date.gte', `${yearFrom}-01-01`)
    if (yearTo) params.set('primary_release_date.lte', `${yearTo}-12-31`)
    if (minRating) {
      params.set('vote_average.gte', minRating)
      params.set('vote_count.gte', '50')
    }
    if (actorId) params.set('with_cast', actorId)
    if (directorId) params.set('with_crew', directorId)
    return `https://api.themoviedb.org/3/discover/movie?${params}`
  }

  let first: TMDBDiscoverResponse
  try {
    const res = await fetch(buildUrl(1), { cache: 'no-store' })
    if (!res.ok) throw new Error(`TMDB ${res.status}`)
    first = await res.json()
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível sortear. Tente novamente.' },
      { status: 502 },
    )
  }

  if (!first.total_results || first.total_results === 0) {
    return NextResponse.json(
      { error: 'Nenhum filme encontrado com esses filtros.' },
      { status: 404 },
    )
  }

  const maxPage = Math.min(first.total_pages, 500)
  const randomPage = Math.ceil(Math.random() * maxPage)

  let results: TMDBMovie[]
  if (randomPage === 1) {
    results = first.results
  } else {
    try {
      const res = await fetch(buildUrl(randomPage), { cache: 'no-store' })
      if (!res.ok) throw new Error(`TMDB ${res.status}`)
      const data: TMDBDiscoverResponse = await res.json()
      results = data.results
    } catch {
      results = first.results
    }
  }

  if (!results.length) {
    return NextResponse.json(
      { error: 'Nenhum filme encontrado com esses filtros.' },
      { status: 404 },
    )
  }

  const movie = results[Math.floor(Math.random() * results.length)]

  return NextResponse.json({
    tmdb_id: movie.id,
    title: movie.title,
    year: movie.release_date ? parseInt(movie.release_date.slice(0, 4), 10) || null : null,
    poster_url: movie.poster_path ? `${IMAGE_BASE}${movie.poster_path}` : null,
  })
}
