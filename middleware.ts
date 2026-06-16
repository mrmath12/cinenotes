import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limit in-memory por instância de edge: protege rotas caras
// (chamadas ao TMDB) contra abuso de bots/scrapers de um mesmo IP.
// Não é distribuído entre instâncias/regiões, mas não exige infra externa.
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 30
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()

const RATE_LIMITED_PREFIXES = ['/api/tmdb/', '/filmes/', '/ator/', '/diretor/']

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return false
  }

  entry.count += 1
  return entry.count > RATE_LIMIT_MAX_REQUESTS
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const isRateLimitedRoute = RATE_LIMITED_PREFIXES.some(prefix => pathname.startsWith(prefix))

  if (isRateLimitedRoute) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em breve.' },
        { status: 429 },
      )
    }
  }

  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Verificar se as variáveis de ambiente estão disponíveis
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Variáveis de ambiente do Supabase não encontradas no middleware')
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: Record<string, unknown>) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Verificar sessão atual
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rotas que requerem autenticação
  const protectedRoutes = ['/dashboard', '/perfil', '/minhas-avaliacoes']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Rotas de autenticação (login/cadastro)
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Se tentar acessar rota protegida sem estar logado
  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.search = ''
    const destination = req.nextUrl.pathname + req.nextUrl.search
    redirectUrl.searchParams.set('redirectTo', destination)
    return NextResponse.redirect(redirectUrl)
  }

  // Se estiver logado e tentar acessar páginas de auth, redirecionar para dashboard
  if (isAuthRoute && session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 