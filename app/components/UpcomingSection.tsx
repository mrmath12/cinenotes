import Image from 'next/image'
import Link from 'next/link'

interface UpcomingMovie {
  id: number
  title: string
  release_date: string
  backdrop_path: string | null
  poster_path: string | null
  popularity: number
}

function formatReleaseDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function UpcomingSection() {
  const apiKey = process.env.TMDB_API_KEY
  let movies: UpcomingMovie[] = []

  try {
    const [res1, res2] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}&language=pt-BR&region=BR&page=1`, { next: { revalidate: 3600 } }),
      fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${apiKey}&language=pt-BR&region=BR&page=2`, { next: { revalidate: 3600 } }),
    ])
    const results: UpcomingMovie[] = []
    if (res1.ok) results.push(...((await res1.json()).results ?? []))
    if (res2.ok) results.push(...((await res2.json()).results ?? []))

    const top20 = results
      .filter((m: UpcomingMovie) => m.backdrop_path || m.poster_path)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 20)

    // Fisher-Yates shuffle, pick 6
    for (let i = top20.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [top20[i], top20[j]] = [top20[j], top20[i]]
    }
    movies = top20.slice(0, 6)
  } catch {
    return null
  }

  if (movies.length === 0) return null

  return (
    <section className="mt-20">
      <h2 className="text-2xl font-bold text-white mb-8 text-center">
        Próximos{' '}
        <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
          Lançamentos
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {movies.map((movie) => {
          const imageUrl = movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
            : `https://image.tmdb.org/t/p/w500${movie.poster_path}`

          return (
            <Link
              key={movie.id}
              href={`/filmes/${movie.id}`}
              className="group relative aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/30 transition-all hover:scale-[1.02]"
            >
              <Image
                src={imageUrl}
                alt={movie.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="text-white font-semibold line-clamp-1">{movie.title}</p>
                {movie.release_date && (
                  <p className="text-muted-300 text-sm mt-0.5">
                    {formatReleaseDate(movie.release_date)}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
