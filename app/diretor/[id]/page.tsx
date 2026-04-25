import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '../../../lib/supabase-server'
import Footer from '../../components/Footer'
import BackdropImage from '../../components/BackdropImage'
import FilmografiaGrid from '../../components/FilmografiaGrid'
import { fetchFilmografia, fetchPersonMovieIds } from '../../../lib/actions'

interface PersonDetail {
  id: number
  name: string
  profile_url: string | null
  backdrop_urls: string[]
  biography: string | null
  birthday: string | null
  deathday: string | null
  place_of_birth: string | null
  gender: number
}

async function fetchPersonDetail(id: string): Promise<PersonDetail | null> {
  const apiKey = process.env.TMDB_API_KEY
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/person/${id}?api_key=${apiKey}&language=pt-BR&append_to_response=tagged_images`,
      { next: { revalidate: 3600 } },
    )
    if (!res.ok) return null
    const data = await res.json()

    const backdropUrls: string[] = (data.tagged_images?.results ?? [])
      .filter((img: { image_type: string }) => img.image_type === 'backdrop')
      .slice(0, 5)
      .map((img: { file_path: string }) => `https://image.tmdb.org/t/p/w1280${img.file_path}`)

    return {
      id: data.id,
      name: data.name ?? '',
      profile_url: data.profile_path
        ? `https://image.tmdb.org/t/p/w342${data.profile_path}`
        : null,
      backdrop_urls: backdropUrls,
      biography: data.biography || null,
      birthday: data.birthday || null,
      deathday: data.deathday || null,
      place_of_birth: data.place_of_birth || null,
      gender: data.gender ?? 0,
    }
  } catch {
    return null
  }
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function calcAge(birthday: string, until: string): number {
  return Math.floor(
    (new Date(until).getTime() - new Date(birthday).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000),
  )
}

function getScoreColor(score: number): string {
  if (score >= 7) return 'bg-emerald-600'
  if (score >= 5) return 'bg-amber-500'
  return 'bg-red-600'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const person = await fetchPersonDetail(id)
  if (!person) return { title: 'Diretor não encontrado' }
  return {
    title: `${person.name} — CineNotes`,
    description:
      person.biography?.slice(0, 155) ??
      `Filmografia de ${person.name} no CineNotes.`,
  }
}

interface ReviewRow {
  movie_id: number
  final_score: number
  movies: {
    tmdb_id: number
    title: string
    year: number | null
    poster_url: string | null
  } | null
}

export default async function DiretorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const personId = Number(id)

  const [person, diretorResult, castResult, movieIds] = await Promise.all([
    fetchPersonDetail(id),
    fetchFilmografia(personId, 0, 'director'),
    fetchFilmografia(personId, 0, 'cast'),
    fetchPersonMovieIds(personId, 'director'),
  ])

  if (!person) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col">
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          <p className="text-muted-300 text-xl mb-6">Diretor não encontrado.</p>
          <Link
            href="/filmes"
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
          >
            Explorar Filmes
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const roleLabel = person.gender === 1 ? 'Diretora' : 'Diretor'
  const actorLabel = person.gender === 1 ? 'Atriz' : 'Ator'

  const { films: dirFilms, total: totalDirFilms } = diretorResult
  const { films: castFilms, total: totalCastFilms } = castResult

  const supabase = await createClient()
  const reviewsRaw =
    movieIds.length > 0
      ? await supabase
          .from('reviews')
          .select('movie_id, final_score, movies!inner(tmdb_id, title, year, poster_url)')
          .in('movie_id', movieIds)
      : { data: null }

  const reviews = (reviewsRaw.data ?? []) as unknown as ReviewRow[]

  const movieMap = new Map<number, { movie: ReviewRow['movies']; scores: number[] }>()
  for (const r of reviews) {
    if (!r.movies) continue
    if (!movieMap.has(r.movie_id)) movieMap.set(r.movie_id, { movie: r.movies, scores: [] })
    movieMap.get(r.movie_id)!.scores.push(r.final_score)
  }

  const reviewedMovies = Array.from(movieMap.values())
    .map(({ movie, scores }) => ({
      ...movie!,
      avg: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)),
      count: scores.length,
    }))
    .sort((a, b) => b.count - a.count)

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col">
      <main className="flex-1">

        {/* Hero backdrop */}
        <div className="relative w-full h-56 md:h-72 bg-white/5 overflow-hidden">
          {person.backdrop_urls.length > 0 && (
            <BackdropImage urls={person.backdrop_urls} alt={person.name} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/65 to-bg-dark/20" />

          <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 max-w-7xl pb-6">
            <div className="flex gap-4 items-end">
              {/* Portrait */}
              <div className="relative flex-shrink-0 w-[90px] h-[135px] md:w-[120px] md:h-[180px] rounded-xl overflow-hidden bg-white/10 shadow-2xl -mb-8 md:-mb-12">
                {person.profile_url ? (
                  <Image
                    src={person.profile_url}
                    alt={person.name}
                    fill
                    className="object-cover"
                    sizes="120px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-400 text-3xl font-bold">
                    {person.name[0]}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 pb-2 min-w-0">
                <p className="text-primary-400 text-xs font-semibold uppercase tracking-widest mb-1">
                  {roleLabel}
                </p>
                <h1 className="text-white text-2xl md:text-3xl font-bold leading-tight line-clamp-2">
                  {person.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1.5 text-sm text-muted-300">
                  {person.birthday && (
                    <span>
                      {person.deathday
                        ? 'Nasc.'
                        : `Nascid${person.gender === 1 ? 'a' : 'o'} em`}
                      {': '}
                      {formatDate(person.birthday)}
                      {!person.deathday && ` · ${calcAge(person.birthday, today)} anos`}
                    </span>
                  )}
                  {person.deathday && person.birthday && (
                    <span className="text-muted-400">
                      † {formatDate(person.deathday)} · {calcAge(person.birthday, person.deathday)} anos
                    </span>
                  )}
                  {person.place_of_birth && (
                    <span className="text-muted-400">{person.place_of_birth}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="container mx-auto px-4 max-w-7xl mt-10 md:mt-14 mb-8">
          {/* Breadcrumb */}
          <Link
            href="/filmes"
            className="inline-flex items-center gap-1.5 text-muted-400 hover:text-white text-sm transition-colors mb-6"
          >
            <span>←</span>
            <span>Explorar Filmes</span>
          </Link>

          {/* Biografia */}
          {person.biography && (
            <section className="mb-10">
              <h2 className="text-white font-semibold text-lg mb-3">Biografia</h2>
              <p className="text-muted-300 text-sm leading-relaxed whitespace-pre-line">
                {person.biography}
              </p>
            </section>
          )}

          {/* Filmografia como Diretor */}
          {dirFilms.length > 0 && (
            <section className="mb-10">
              <h2 className="text-white font-semibold text-lg mb-4">
                Filmografia como {roleLabel}
              </h2>
              <FilmografiaGrid
                initialFilms={dirFilms}
                totalCount={totalDirFilms}
                personId={personId}
                role="director"
              />
            </section>
          )}

          {/* Também como Ator */}
          {castFilms.length > 0 && (
            <section className="mb-10">
              <h2 className="text-white font-semibold text-lg mb-4">
                Também como {actorLabel}
              </h2>
              <FilmografiaGrid
                initialFilms={castFilms}
                totalCount={totalCastFilms}
                personId={personId}
                role="cast"
                showCharacter
              />
            </section>
          )}

          {/* Notas CineNotes */}
          <section className="mb-10">
            <h2 className="text-white font-semibold text-lg mb-4">Notas CineNotes</h2>
            {reviewedMovies.length === 0 ? (
              <div className="text-center py-10 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-muted-400 text-sm">
                  Nenhum filme avaliado pela comunidade ainda.
                </p>
              </div>
            ) : (
              <>
                <p className="text-muted-400 text-sm mb-4">
                  {reviewedMovies.length}{' '}
                  {reviewedMovies.length === 1 ? 'filme avaliado' : 'filmes avaliados'} pela
                  comunidade
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {reviewedMovies.map(movie => (
                    <Link
                      key={movie.tmdb_id}
                      href={`/filmes/${movie.tmdb_id}`}
                      className="group flex flex-col gap-1.5"
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/10 ring-1 ring-white/10 group-hover:ring-white/30 transition-all">
                        {movie.poster_url ? (
                          <Image
                            src={movie.poster_url}
                            alt={movie.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 50vw, 20vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-500 text-xs text-center px-2">
                            {movie.title}
                          </div>
                        )}
                        <div
                          className={`absolute top-1.5 right-1.5 text-white text-xs font-bold px-1.5 py-0.5 rounded-md ${getScoreColor(movie.avg)}`}
                        >
                          {movie.avg.toFixed(1)}
                        </div>
                      </div>
                      <p className="text-muted-300 text-xs leading-tight line-clamp-2 group-hover:text-white transition-colors">
                        {movie.title}
                      </p>
                      <p className="text-muted-500 text-xs">
                        {movie.count} {movie.count === 1 ? 'avaliação' : 'avaliações'}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
