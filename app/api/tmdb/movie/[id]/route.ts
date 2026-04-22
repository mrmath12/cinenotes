import { NextRequest, NextResponse } from 'next/server'

interface TMDBCrewMember {
  job: string
  name: string
}

interface TMDBGenre {
  id: number
  name: string
}

interface TMDBMovieDetail {
  id: number
  title: string
  release_date?: string
  poster_path?: string | null
  backdrop_path?: string | null
  overview?: string | null
  runtime?: number | null
  genres?: TMDBGenre[]
  credits?: {
    crew?: TMDBCrewMember[]
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const apiKey = process.env.TMDB_API_KEY
  const url = `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&language=pt-BR&append_to_response=credits`

  let data: TMDBMovieDetail
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (res.status === 404) {
      return NextResponse.json({ error: 'Filme não encontrado.' }, { status: 404 })
    }
    if (!res.ok) throw new Error(`TMDB ${res.status}`)
    data = await res.json()
  } catch (err) {
    if (err instanceof Error && err.message.includes('404')) {
      return NextResponse.json({ error: 'Filme não encontrado.' }, { status: 404 })
    }
    return NextResponse.json(
      { error: 'Não foi possível carregar o filme.' },
      { status: 502 },
    )
  }

  const year = data.release_date
    ? parseInt(data.release_date.slice(0, 4), 10) || null
    : null

  const director =
    data.credits?.crew?.find(c => c.job === 'Director')?.name ?? null

  return NextResponse.json({
    tmdb_id: data.id,
    title: data.title,
    year,
    poster_url: data.poster_path
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : null,
    backdrop_url: data.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`
      : null,
    overview: data.overview ?? null,
    runtime: data.runtime ?? null,
    genres: data.genres?.map(g => g.name) ?? [],
    director,
  })
}
