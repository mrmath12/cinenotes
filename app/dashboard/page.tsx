'use client'

import { useAuth } from '../../lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Footer from '../components/Footer'
import { createSupabaseBrowserClient } from '../../lib/supabase'
import UserStats from './UserStats'
import ForYouSection from './ForYouSection'
import NovaAvaliacaoModal from '../components/NovaAvaliacaoModal'

export type DashboardReview = {
  id: string
  final_score: number
  score_script: number
  score_direction: number
  score_photography: number
  score_soundtrack: number
  score_impact: number
  comment: string | null
  created_at: string
  movies: {
    tmdb_id: number
    title: string
    year: number
    poster_url: string | null
    genres: number[]
  }
  profiles: {
    full_name: string
    username: string
    avatar_color: string
  }
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [reviews, setReviews] = useState<DashboardReview[]>([])
  const [fetching, setFetching] = useState(true)
  const [avaliacaoModalOpen, setAvaliacaoModalOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return

    supabase
      .from('reviews')
      .select(`
        id, final_score, score_script, score_direction,
        score_photography, score_soundtrack, score_impact,
        comment, created_at,
        movies!inner(tmdb_id, title, year, poster_url, genres),
        profiles!inner(full_name, username, avatar_color)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReviews((data as unknown as DashboardReview[]) ?? [])
        setFetching(false)
      })
  }, [user])

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!user) return null

  const firstName = reviews[0]?.profiles.full_name.split(' ')[0] ?? null

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-10">

          <h1 className="text-3xl font-bold text-white text-center">
            {firstName ? `Olá, ${firstName}!` : 'Olá!'}
          </h1>

          <UserStats
            reviews={reviews}
            headerActions={
              <div className="flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setAvaliacaoModalOpen(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
                >
                  + Nova Avaliação
                </button>
                <Link
                  href="/minhas-avaliacoes"
                  className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Minhas Avaliações
                </Link>
              </div>
            }
          />

          <ForYouSection userId={user.id} userReviews={reviews} />

        </div>
      </main>
      <Footer />
      <NovaAvaliacaoModal
        isOpen={avaliacaoModalOpen}
        onClose={() => setAvaliacaoModalOpen(false)}
      />
    </div>
  )
}
