'use client'

import { createBrowserClient } from '@supabase/ssr'
import { createContext, useContext, useState } from 'react'
const SupabaseContext = createContext<ReturnType<typeof createBrowserClient> | null>(null)

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState<ReturnType<typeof createBrowserClient> | null>(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      if (typeof window !== 'undefined') {
        console.error('Variáveis de ambiente do Supabase não encontradas:')
        console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
        console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '***' : 'não definida')
      }
      // Evita falha no build/prerender. Componentes que precisarem do Supabase
      // devem lidar com a ausência via useSupabase (que lança erro controlado).
      return null
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
  // Retorna null quando não configurado; consumidores devem checar null.
  return context
}