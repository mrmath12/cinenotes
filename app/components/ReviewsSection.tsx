import { createClient } from '../../lib/supabase-server'
import { createAdminClient } from '../../lib/supabase-admin'
import ReviewsCarousel from './ReviewsCarousel'

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500'

export const revalidate = 60

export default async function ReviewsSection() {
  const supabase = await createClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id,
      movie_id,
      final_score,
      created_at,
      movies (
        title,
        year,
        poster_url
      ),
      profiles (
        username,
        full_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  const rawItems = (reviews ?? []).map((r) => {
    const movie = Array.isArray(r.movies) ? r.movies[0] : r.movies
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
    return {
      id: r.id as string,
      tmdb_id: r.movie_id as number,
      movie_id: r.movie_id as number,
      final_score: r.final_score as number,
      created_at: r.created_at as string,
      title: (movie?.title ?? 'Filme desconhecido') as string,
      year: (movie?.year ?? 0) as number,
      poster_url: (movie?.poster_url ?? null) as string | null,
      reviewer: (profile?.username ?? profile?.full_name ?? null) as string | null,
    }
  })

  // Repair items with missing poster_url using tmdb_id directly
  const broken = rawItems.filter(item => !item.poster_url)
  if (broken.length > 0) {
    const apiKey = process.env.TMDB_API_KEY
    const admin = createAdminClient()
    await Promise.all(
      broken.map(async item => {
        try {
          const res = await fetch(
            `https://api.themoviedb.org/3/movie/${item.movie_id}?api_key=${apiKey}&language=pt-BR`,
            { next: { revalidate: 86400 } },
          )
          if (!res.ok) return
          const data = await res.json()
          if (data.poster_path) {
            item.poster_url = `${IMAGE_BASE}${data.poster_path}`
            await admin
              .from('movies')
              .update({ poster_url: item.poster_url })
              .eq('tmdb_id', item.movie_id)
          }
        } catch { /* silent */ }
      }),
    )
  }

  const carouselData = rawItems

  return (
    <section className="mt-20">
      <h2 className="text-2xl font-bold text-white mb-8 text-center">Avaliações Recentes</h2>
      <ReviewsCarousel reviews={carouselData} />
    </section>
  )
}
