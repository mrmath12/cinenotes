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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { id, user_metadata: m } = user

        if (m?.username) {
          const admin = createAdminClient()
          const { data: existing } = await admin
            .from('profiles')
            .select('id')
            .eq('id', id)
            .maybeSingle()

          if (!existing) {
            const { error: insertError } = await admin.from('profiles').insert({
              id,
              full_name: m.full_name ?? '',
              username: m.username,
              avatar_color: m.avatar_color ?? 'bg-blue-500',
            })
            if (insertError) console.error('[callback] profile insert error:', insertError)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`)
}
