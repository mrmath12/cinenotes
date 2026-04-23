import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase-server'
import { createAdminClient } from '../../../../lib/supabase-admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  let body: { tmdb_id: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 })
  }

  const { tmdb_id } = body

  if (!tmdb_id || typeof tmdb_id !== 'number') {
    return NextResponse.json({ error: 'tmdb_id inválido' }, { status: 400 })
  }

  const admin = createAdminClient()
  await admin.from('movies').update({ poster_url: null }).eq('tmdb_id', tmdb_id)

  return NextResponse.json({ ok: true })
}
