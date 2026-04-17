import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase-server'

export const runtime = 'nodejs'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, full_name, username, avatar_color } = body ?? {}

    if (!id || id !== authData.user.id) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    if (!full_name || !username || !avatar_color) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: 'Username inválido. Use 3–20 caracteres: letras, números e _' },
        { status: 400 }
      )
    }

    const normalizedUsername = username.toLowerCase()

    const { error } = await supabase
      .from('profiles')
      .upsert(
        { id, full_name, username: normalizedUsername, avatar_color },
        { onConflict: 'id' }
      )

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Erro interno'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
