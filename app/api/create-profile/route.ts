import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase-admin'

export const runtime = 'nodejs'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, full_name, username, avatar_color } = body ?? {}

    if (!id || !full_name || !username || !avatar_color) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    if (!USERNAME_REGEX.test(username)) {
      return NextResponse.json(
        { error: 'Username inválido. Use 3–20 caracteres: letras, números e _' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()

    // Verifica que o ID realmente existe em auth.users antes de inserir
    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(id)
    if (authError || !authUser?.user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 401 })
    }

    const normalizedUsername = username.toLowerCase()

    const { error } = await admin
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
