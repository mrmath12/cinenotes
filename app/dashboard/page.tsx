'use client'

import { useAuth } from '../../lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import Footer from '../components/Footer'
import CommunityFeed from '../components/CommunityFeed'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col">
      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
            {/* Card - Avaliar Filme */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Avaliar Filme</h3>
              <p className="text-primary-200 mb-4">Adicione uma nova avaliação de filme com critérios profissionais.</p>
              <Link
                href="/nova-avaliacao"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
              >
                Nova Avaliação
              </Link>
            </div>

            {/* Card - Minhas Avaliações */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Minhas Avaliações</h3>
              <p className="text-primary-200 mb-4">Visualize e gerencie todas as suas avaliações de filmes.</p>
              <Link
                href="/avaliacoes"
                className="inline-block bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition"
              >
                Ver Avaliações
              </Link>
            </div>
          </div>

          <CommunityFeed />
        </div>
      </main>

      <Footer />
    </div>
  )
}
