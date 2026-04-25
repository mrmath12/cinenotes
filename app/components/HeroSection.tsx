import { createClient } from "../../lib/supabase-server";
import HeroVideoBackground from "./HeroVideoBackground";

interface TrendingMovie {
  id: number
  title: string
  release_date?: string
}

interface VideoResult {
  key: string
  site: string
  type: string
}

async function fetchTrailerKey(movieId: number, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${apiKey}&language=pt-BR`,
      { next: { revalidate: 86400 } },
    )
    if (!res.ok) return null
    const data = await res.json()
    const videos: VideoResult[] = data.results ?? []
    return (
      videos.find(v => v.site === 'YouTube' && v.type === 'Trailer')?.key ??
      videos.find(v => v.site === 'YouTube' && v.type === 'Teaser')?.key ??
      null
    )
  } catch {
    return null
  }
}

export default async function HeroSection() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const ctaHref = user ? "/avaliacoes" : "/register"

  const apiKey = process.env.TMDB_API_KEY
  let movies: { trailerKey: string; title: string; year: number | null; tmdbId: number }[] = []

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}&language=pt-BR`,
      { next: { revalidate: 3600 } },
    )
    if (res.ok) {
      const data = await res.json()
      const top5: TrendingMovie[] = (data.results ?? []).slice(0, 5)

      const withTrailers = await Promise.all(
        top5.map(async (movie) => {
          const trailerKey = await fetchTrailerKey(movie.id, apiKey!)
          if (!trailerKey) return null
          return {
            trailerKey,
            title: movie.title,
            year: movie.release_date
              ? parseInt(movie.release_date.slice(0, 4), 10) || null
              : null,
            tmdbId: movie.id,
          }
        }),
      )

      movies = withTrailers.filter((m): m is NonNullable<typeof m> => m !== null)
    }
  } catch {
    // silent fallback — hero renders without video
  }

  return <HeroVideoBackground movies={movies} ctaHref={ctaHref} />
}
