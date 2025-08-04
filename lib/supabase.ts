import { createBrowserClient } from '@supabase/ssr'

// Cliente para uso no lado do servidor (Server Components)
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
) 