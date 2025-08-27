'use client'

import { useAuth } from '../../lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ReviewsSection from '../components/ReviewsSection'

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <Header />
      
      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
            {/* Card - Avaliar Filme */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Avaliar Filme</h3>
              <p className="text-purple-200 mb-4">Adicione uma nova avaliação de filme com critérios profissionais.</p>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition">
                Nova Avaliação
              </button>
            </div>

            {/* Card - Minhas Avaliações */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-semibold text-white mb-4">Minhas Avaliações</h3>
              <p className="text-purple-200 mb-4">Visualize e gerencie todas as suas avaliações de filmes.</p>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition">
                Ver Avaliações
              </button>
            </div>
          </div>

          {/* Reviews Section - Ocupa toda a largura */}
          <ReviewsSection />
        </div>
      </main>
      
      <Footer />
    </div>
  )
}