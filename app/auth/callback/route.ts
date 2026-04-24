import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '../../../lib/supabase-server'
import { createAdminClient } from '../../../lib/supabase-admin'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('[callback] getUser failed:', userError)
        return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
      }

      const { id, email, user_metadata: m } = user
      const username = m?.username ?? email?.split('@')[0]?.replace(/[^a-z0-9_]/gi, '').toLowerCase()

      if (username) {
        const admin = createAdminClient()
        const { error: upsertError } = await admin
          .from('profiles')
          .upsert(
            {
              id,
              full_name: m?.full_name ?? '',
              username,
              avatar_color: m?.avatar_color ?? 'bg-blue-500',
            },
            { onConflict: 'id' }
          )
        if (upsertError) console.error('[callback] profile upsert error:', upsertError)
      } else {
        console.error('[callback] no username available for user:', id)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }

    console.error('[callback] exchangeCodeForSession error:', exchangeError)
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}
