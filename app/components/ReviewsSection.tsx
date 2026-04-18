import { createClient } from '../../lib/supabase-server'
import ReviewsCarousel from './ReviewsCarousel'

export const revalidate = 60

export default async function ReviewsSection() {
  const supabase = await createClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id,
      final_score,
      created_at,
      movies (
        title,
        year,
        poster_url
      )
    `)
    .order('created_at', { ascending: false })
    .limit(6)

  const carouselData = (reviews ?? []).map((r) => {
    const movie = Array.isArray(r.movies) ? r.movies[0] : r.movies
    return {
      id: r.id as string,
      final_score: r.final_score as number,
      created_at: r.created_at as string,
      title: (movie?.title ?? 'Filme desconhecido') as string,
      year: (movie?.year ?? 0) as number,
      poster_url: (movie?.poster_url ?? null) as string | null,
    }
  })

  return (
    <section className="mt-20">
      <h2 className="text-2xl font-bold text-white mb-8 text-center">Avaliações Recentes</h2>
      <ReviewsCarousel reviews={carouselData} />
    </section>
  )
}
