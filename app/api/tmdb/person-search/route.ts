import { NextRequest, NextResponse } from 'next/server'

const PROFILE_BASE = 'https://image.tmdb.org/t/p/w185'

interface TMDBPerson {
  id: number
  name: string
  profile_path: string | null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') ?? ''

  if (query.length < 2) {
    return NextResponse.json([])
  }

  const apiKey = process.env.TMDB_API_KEY
  const url = `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=pt-BR`

  let data: { results: TMDBPerson[] }
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) throw new Error(`TMDB ${res.status}`)
    data = await res.json()
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível buscar pessoas.' },
      { status: 502 },
    )
  }

  const people = (data.results ?? []).slice(0, 5).map(p => ({
    id: p.id,
    name: p.name,
    profile_url: p.profile_path ? `${PROFILE_BASE}${p.profile_path}` : null,
  }))

  return NextResponse.json(people)
}
