'use client'

import Link from 'next/link'
import { useAuth } from '../../lib/auth-context'
import { useSupabase } from '../../lib/supabase-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Avatar from './Avatar'

interface Profile {
  full_name: string
  avatar_color: string
}

export default function Header() {
  const { user, signOut } = useAuth()
  const supabase = useSupabase()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user || !supabase) return
    supabase
      .from('profiles')
      .select('full_name, avatar_color')
      .eq('id', user.id)
      .single()
      .then(({ data }: { data: Profile | null }) => {
        if (data) setProfile(data)
      })
  }, [user, supabase])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  // Fechar menu mobile ao redimensionar para desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSignOut = async () => {
    setDropdownOpen(false)
    setMobileOpen(false)
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const closeMobile = () => setMobileOpen(false)

  const displayName =
    profile?.full_name ||
    (user?.user_metadata as Record<string, unknown>)?.['full_name'] as string ||
    user?.email?.split('@')[0] ||
    'Usuário'

  const avatarColor = profile?.avatar_color || '#7C3AED'

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-bg-dark/95 backdrop-blur-sm border-b border-white/5">
        <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img
              src="/logo/full/cinenotes-logotipo-full-branco.svg"
              alt="CineNotes"
              className="hidden md:block h-8 w-auto"
            />
            <img
              src="/logo/symbol/cinenotes-logotipo-symbol-branco.svg"
              alt="CineNotes"
              className="md:hidden h-8 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link href="/dashboard" className="text-muted-300 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link href="/filmes" className="text-muted-300 hover:text-white transition-colors">
                  Filmes
                </Link>
                <Link href="/avaliacoes" className="text-muted-300 hover:text-white transition-colors">
                  Avaliações
                </Link>

                {/* Avatar + Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="rounded-full focus:outline-none focus:ring-2 focus:ring-primary-400"
                    aria-label="Menu do usuário"
                  >
                    <Avatar fullName={displayName} avatarColor={avatarColor} size="md" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-white/10 rounded-xl shadow-xl py-1 z-50">
                      <Link
                        href="/perfil"
                        className="block px-4 py-2 text-sm text-muted-300 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Meu Perfil
                      </Link>
                      <hr className="my-1 border-white/10" />
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
                      >
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/filmes" className="text-muted-300 hover:text-white transition-colors">
                  Filmes
                </Link>
                <Link href="/login" className="text-muted-300 hover:text-white transition-colors">
                  Entrar
                </Link>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-4 py-2 rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>

          {/* Hamburguer — mobile only */}
          <button
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileOpen ? (
              // X icon
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger icon
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-black/60" onClick={closeMobile}>
          <div
            className="absolute top-0 right-0 h-full w-72 bg-surface border-l border-white/10 shadow-2xl flex flex-col py-6 px-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do drawer */}
            <div className="flex items-center justify-between mb-8">
              <img
                src="/logo/text/cinenotes-logotipo-text-branco.svg"
                alt="CineNotes"
                className="h-6 w-auto"
              />
              <button
                onClick={closeMobile}
                className="text-muted-300 hover:text-white transition-colors"
                aria-label="Fechar menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {user ? (
              <>
                {/* Perfil resumido — área clicável */}
                <Link
                  href="/perfil"
                  onClick={closeMobile}
                  className="flex items-center space-x-3 mb-6 pb-6 border-b border-white/10 hover:bg-white/5 -mx-2 px-2 py-2 rounded-lg transition-colors"
                >
                  <Avatar fullName={displayName} avatarColor={avatarColor} size="md" />
                  <div className="min-w-0">
                    <span className="text-white font-medium text-sm truncate block">{displayName}</span>
                    <span className="text-muted-400 text-xs">Meu Perfil</span>
                  </div>
                </Link>

                <nav className="flex flex-col space-y-1 flex-1">
                  <Link href="/dashboard" onClick={closeMobile} className="text-muted-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/filmes" onClick={closeMobile} className="text-muted-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
                    Filmes
                  </Link>
                  <Link href="/avaliacoes" onClick={closeMobile} className="text-muted-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
                    Avaliações
                  </Link>
                </nav>

                <button
                  onClick={handleSignOut}
                  className="mt-6 w-full text-left text-red-400 hover:text-red-300 hover:bg-white/5 px-3 py-2 rounded-lg transition-colors"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <nav className="flex flex-col space-y-1 flex-1">
                  <Link href="/filmes" onClick={closeMobile} className="text-muted-300 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
                    Filmes
                  </Link>
                </nav>

                <div className="flex flex-col space-y-3 mt-6">
                  <Link
                    href="/login"
                    onClick={closeMobile}
                    className="text-center text-muted-300 hover:text-white border border-white/20 hover:border-white/40 px-4 py-2 rounded-lg transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMobile}
                    className="text-center bg-gradient-to-r from-primary-500 to-accent-500 text-white px-4 py-2 rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all"
                  >
                    Criar conta
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
