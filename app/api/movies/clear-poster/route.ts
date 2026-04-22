import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '../../../../lib/supabase-admin'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { tmdb_id } = body

  if (!tmdb_id || typeof tmdb_id !== 'number') {
    return NextResponse.json({ error: 'tmdb_id inválido' }, { status: 400 })
  }

  const admin = createAdminClient()
  await admin.from('movies').update({ poster_url: null }).eq('tmdb_id', tmdb_id)

  return NextResponse.json({ ok: true })
}
