import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase-server'
import { createAdminClient } from '../../../lib/supabase-admin'

interface ReviewBody {
  movie: {
    tmdb_id: number
    title: string
    year: number | null
    poster_url: string | null
    genre_ids?: number[]
  }
  score_script: number
  score_direction: number
  score_photography: number
  score_soundtrack: number
  score_impact: number
  comment?: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  let body: ReviewBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const { movie, score_script, score_direction, score_photography, score_soundtrack, score_impact, comment } = body

  if (!movie?.tmdb_id) {
    return NextResponse.json({ error: 'Filme inválido.' }, { status: 400 })
  }

  const scores = [score_script, score_direction, score_photography, score_soundtrack, score_impact]
  if (scores.some((s) => typeof s !== 'number' || s < 1 || s > 10)) {
    return NextResponse.json({ error: 'Notas inválidas.' }, { status: 400 })
  }

  // Verificar se o perfil existe (registro completo)
  const admin = createAdminClient()
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!existingProfile) {
    return NextResponse.json({ error: 'profile_incomplete' }, { status: 403 })
  }

  // Upsert movie via admin client (bypasses RLS)
  const { error: movieError } = await admin.from('movies').upsert(
    {
      tmdb_id: movie.tmdb_id,
      title: movie.title,
      year: movie.year,
      poster_url: movie.poster_url,
      genres: [],
    },
    { onConflict: 'tmdb_id' }
  )

  if (movieError) {
    console.error('Movie upsert error:', movieError)
    return NextResponse.json({ error: 'Erro ao salvar filme.' }, { status: 500 })
  }

  // Insert review via user's authenticated client
  const { error: reviewError } = await supabase.from('reviews').insert({
    user_id: user.id,
    movie_id: movie.tmdb_id,
    score_script,
    score_direction,
    score_photography,
    score_soundtrack,
    score_impact,
    comment: comment?.trim() || null,
  })

  if (reviewError) {
    // Postgres unique constraint violation
    if (reviewError.code === '23505') {
      return NextResponse.json({ error: 'duplicate' }, { status: 409 })
    }
    console.error('Review insert error:', reviewError)
    return NextResponse.json({ error: 'Erro ao salvar avaliação.' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
