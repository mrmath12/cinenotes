'use client'

import { createBrowserClient } from '@supabase/ssr'
import { createContext, useContext, useState } from 'react'
const SupabaseContext = createContext<ReturnType<typeof createBrowserClient> | null>(null)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Variáveis de ambiente do Supabase não encontradas:')
      console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***' : 'não definida')
      throw new Error('Variáveis de ambiente do Supabase não configuradas corretamente')
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
  })

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === null) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
} 