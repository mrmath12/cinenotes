import { createAdminClient } from '../../lib/supabase-admin'

export const revalidate = 60

export default async function StatsSection() {
  const supabase = createAdminClient()

  const [moviesResult, usersResult, reviewsResult] = await Promise.all([
    supabase.from('movies').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
  ])

  const totalMovies = moviesResult.count ?? 0
  const totalUsers = usersResult.count ?? 0
  const totalReviews = reviewsResult.count ?? 0

  return (
    <section className="mt-20 text-center">
      <div className="grid grid-cols-3 gap-8">
        <div>
          <div className="text-3xl font-bold text-white mb-2">{totalMovies}</div>
          <div className="text-muted-400">Filmes Avaliados</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-white mb-2">{totalUsers}</div>
          <div className="text-muted-400">Usuários</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-white mb-2">{totalReviews}</div>
          <div className="text-muted-400">Avaliações</div>
        </div>
      </div>
    </section>
  )
}
