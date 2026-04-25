import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '../../../lib/supabase-server'
import Footer from '../../components/Footer'
import BackdropImage from '../../components/BackdropImage'
import FilmeReviewsGrid from '../../components/FilmeReviewsGrid'
import FilmeAvaliacaoButton from '../../components/FilmeAvaliacaoButton'

interface CastMember {
  id: number
  name: string
  character: string
  profile_url: string | null
}

interface Trailer {
  key: string
  name: string
  type: string
}

interface WatchProvider {
  provider_id: number
  provider_name: string
  logo_url: string
}

interface WatchProviders {
  link: string
  flatrate: WatchProvider[]
  rent: WatchProvider[]
  buy: WatchProvider[]
}

interface RelatedMovie {
  id: number
  title: string
  poster_url: string | null
  year: number | null
}

interface MovieDetail {
  tmdb_id: number
  imdb_id: string | null
  title: string
  tagline: string | null
  year: number | null
  poster_url: string | null
  backdrop_urls: string[]
  overview: string | null
  runtime: number | null
  genres: string[]
  director: string | null
  directorId: number | null
  cast: CastMember[]
  certification: string | null
  trailers: Trailer[]
  watchProviders: WatchProviders | null
  recommendations: RelatedMovie[]
}

interface ExternalRating {
  source: string
  value: string
}

interface ReviewWithProfile {
  id: string
  final_score: number
  score_script: number
  score_direction: number
  score_photography: number
  score_soundtrack: number
  score_impact: number
  comment: string | null
  created_at: string
  profiles: {
    full_name: string
    username: string
    avatar_color: string
  } | null
}

async function fetchMovieDetail(tmdbId: string): Promise<MovieDetail | null> {
  const apiKey = process.env.TMDB_API_KEY
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=pt-BR&append_to_response=credits,images,videos,watch/providers,release_dates,recommendations&include_image_language=null,en`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()

    const year = data.release_date
      ? parseInt(data.release_date.slice(0, 4), 10) || null
      : null
    const directorCrew = data.credits?.crew?.find(
      (c: { id: number; job: string }) => c.job === 'Director',
    )
    const director = directorCrew?.name ?? null
    const directorId = directorCrew?.id ?? null

    const cast: CastMember[] = (data.credits?.cast ?? [])
      .slice(0, 6)
      .map((c: { id: number; name: string; character: string; profile_path: string | null }) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profile_url: c.profile_path
          ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
          : null,
      }))

    const brRelease = (data.release_dates?.results ?? []).find(
      (r: { iso_3166_1: string }) => r.iso_3166_1 === 'BR',
    )
    const certification: string | null =
      brRelease?.release_dates?.find(
        (rd: { certification: string }) => rd.certification,
      )?.certification ?? null

    const trailers: Trailer[] = (data.videos?.results ?? [])
      .filter(
        (v: { site: string; type: string }) =>
          v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'),
      )
      .slice(0, 4)
      .map((v: { key: string; name: string; type: string }) => ({
        key: v.key,
        name: v.name,
        type: v.type,
      }))

    const brProviders = data['watch/providers']?.results?.BR ?? null
    const mapProviders = (list: { provider_id: number; provider_name: string; logo_path: string }[]) =>
      (list ?? []).map(p => ({
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        logo_url: `https://image.tmdb.org/t/p/w45${p.logo_path}`,
      }))
    const watchProviders: WatchProviders | null = brProviders
      ? {
          link: brProviders.link ?? '',
          flatrate: mapProviders(brProviders.flatrate),
          rent: mapProviders(brProviders.rent),
          buy: mapProviders(brProviders.buy),
        }
      : null

    const recommendations: RelatedMovie[] = (data.recommendations?.results ?? [])
      .slice(0, 8)
      .map(
        (r: {
          id: number
          title: string
          poster_path: string | null
          release_date?: string
        }) => ({
          id: r.id,
          title: r.title,
          poster_url: r.poster_path
            ? `https://image.tmdb.org/t/p/w342${r.poster_path}`
            : null,
          year: r.release_date ? parseInt(r.release_date.slice(0, 4), 10) || null : null,
        }),
      )

    return {
      tmdb_id: data.id,
      imdb_id: data.imdb_id ?? null,
      title: data.title ?? '',
      tagline: data.tagline || null,
      year,
      poster_url: data.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : null,
      backdrop_urls: [
        ...(data.images?.backdrops ?? []).map(
          (b: { file_path: string }) => `https://image.tmdb.org/t/p/w1280${b.file_path}`,
        ),
        ...(data.backdrop_path ? [`https://image.tmdb.org/t/p/w1280${data.backdrop_path}`] : []),
      ].filter((v, i, arr) => arr.indexOf(v) === i),
      overview: data.overview ?? null,
      runtime: data.runtime ?? null,
      genres: data.genres?.map((g: { name: string }) => g.name) ?? [],
      director,
      directorId,
      cast,
      certification,
      trailers,
      watchProviders,
      recommendations,
    }
  } catch {
    return null
  }
}

async function fetchOMDBRatings(imdbId: string): Promise<ExternalRating[]> {
  const apiKey = process.env.OMDB_API_KEY
  if (!apiKey || apiKey === 'sua_chave_aqui') return []
  try {
    const res = await fetch(
      `https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`,
      { next: { revalidate: 86400 } },
    )
    if (!res.ok) return []
    const data = await res.json()
    if (data.Response === 'False') return []
    return (data.Ratings ?? []).map((r: { Source: string; Value: string }) => ({
      source: r.Source,
      value: r.Value,
    }))
  } catch {
    return []
  }
}

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

function getScoreColor(score: number): string {
  if (score >= 7) return 'bg-emerald-600'
  if (score >= 5) return 'bg-amber-500'
  return 'bg-red-600'
}

function getCertificationStyle(cert: string): string {
  if (cert === 'L' || cert === 'Livre') return 'bg-green-600/20 border-green-500/40 text-green-300'
  if (cert === '10') return 'bg-blue-600/20 border-blue-500/40 text-blue-300'
  if (cert === '12') return 'bg-sky-600/20 border-sky-500/40 text-sky-300'
  if (cert === '14') return 'bg-amber-600/20 border-amber-500/40 text-amber-300'
  if (cert === '16') return 'bg-orange-600/20 border-orange-500/40 text-orange-300'
  if (cert === '18') return 'bg-red-600/20 border-red-500/40 text-red-300'
  return 'bg-white/10 border-white/20 text-muted-300'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tmdb_id: string }>
}): Promise<Metadata> {
  const { tmdb_id } = await params
  const movie = await fetchMovieDetail(tmdb_id)
  if (!movie) return { title: 'Filme não encontrado' }
  return {
    title: `${movie.title} (${movie.year})`,
    description:
      movie.overview?.slice(0, 155) ?? 'Avaliações da comunidade CineNotes.',
  }
}

export default async function FilmeDetailPage({
  params,
}: {
  params: Promise<{ tmdb_id: string }>
}) {
  const { tmdb_id } = await params
  const supabase = await createClient()

  const [movie, { data: { user } }, reviewsResult] = await Promise.all([
    fetchMovieDetail(tmdb_id),
    supabase.auth.getUser(),
    supabase
      .from('reviews')
      .select(
        'id, final_score, score_script, score_direction, score_photography, score_soundtrack, score_impact, comment, created_at, profiles!inner(full_name, username, avatar_color)',
      )
      .eq('movie_id', Number(tmdb_id))
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const externalRatings = movie?.imdb_id
    ? await fetchOMDBRatings(movie.imdb_id)
    : []

  const userHasReviewed = user
    ? (
        await supabase
          .from('reviews')
          .select('id')
          .eq('movie_id', Number(tmdb_id))
          .eq('user_id', user.id)
          .maybeSingle()
      ).data !== null
    : false

  if (!movie) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col">
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
          <p className="text-muted-300 text-xl mb-6">Filme não encontrado.</p>
          <Link
            href="/filmes"
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
          >
            Voltar para Filmes
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const reviews = (reviewsResult.data ?? []) as unknown as ReviewWithProfile[]

  const avgScore =
    reviews.length > 0
      ? parseFloat(
          (
            reviews.reduce((sum, r) => sum + r.final_score, 0) / reviews.length
          ).toFixed(1),
        )
      : null

  const hasWatchProviders =
    movie.watchProviders &&
    (movie.watchProviders.flatrate.length > 0 ||
      movie.watchProviders.rent.length > 0 ||
      movie.watchProviders.buy.length > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col">
      <main className="flex-1">
        {/* Hero backdrop */}
        <div className="relative w-full h-64 md:h-80 bg-white/5 overflow-hidden">
          {movie.backdrop_urls.length > 0 && (
            <BackdropImage urls={movie.backdrop_urls} alt={movie.title} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/70 to-bg-dark/20" />

          {/* Hero content */}
          <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 max-w-7xl pb-6">
            <div className="flex gap-4 items-end">
              {/* Poster */}
              <div className="relative flex-shrink-0 w-[100px] h-[150px] md:w-[150px] md:h-[225px] rounded-xl overflow-hidden bg-white/10 shadow-2xl -mb-8 md:-mb-12">
                {movie.poster_url ? (
                  <Image
                    src={movie.poster_url}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    sizes="150px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-400 text-xs text-center px-2">
                    Sem poster
                  </div>
                )}
              </div>

              {/* Info + External Ratings */}
              <div className="flex-1 flex items-end justify-between gap-4 pb-2 min-w-0">
                {/* Main info */}
                <div className="min-w-0">
                  {avgScore !== null && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`${getScoreColor(avgScore)} text-white font-bold text-lg px-3 py-0.5 rounded-lg`}>
                        {avgScore.toFixed(1)}
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="text-white text-sm font-semibold">Nota da Comunidade</span>
                        <span className="text-muted-400 text-xs">
                          {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
                        </span>
                      </div>
                    </div>
                  )}
                  <h1 className="text-white text-xl md:text-3xl font-bold leading-tight line-clamp-2">
                    {movie.title}
                  </h1>
                  {movie.tagline && (
                    <p className="text-muted-300 text-sm italic mt-0.5 line-clamp-1">
                      {movie.tagline}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    {movie.year && (
                      <span className="text-muted-300 text-sm">{movie.year}</span>
                    )}
                    {movie.runtime && (
                      <span className="text-muted-400 text-sm">
                        · {formatRuntime(movie.runtime)}
                      </span>
                    )}
                    {movie.director && (
                      movie.directorId ? (
                        <Link
                          href={`/diretor/${movie.directorId}`}
                          className="text-muted-400 text-sm hover:text-white transition-colors"
                        >
                          · Dir. {movie.director}
                        </Link>
                      ) : (
                        <span className="text-muted-400 text-sm">
                          · Dir. {movie.director}
                        </span>
                      )
                    )}
                    {movie.certification && (
                      <span
                        className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${getCertificationStyle(movie.certification)}`}
                      >
                        {movie.certification === 'L' ? 'Livre' : `${movie.certification} anos`}
                      </span>
                    )}
                  </div>
                  {movie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {movie.genres.map(g => (
                        <span
                          key={g}
                          className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-200 border border-white/15"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* External ratings */}
                {externalRatings.length > 0 && (
                  <div className="hidden md:flex flex-col gap-1.5 flex-shrink-0">
                    {externalRatings.map(rating => {
                      const label =
                        rating.source === 'Internet Movie Database' ? 'IMDb' :
                        rating.source === 'Rotten Tomatoes' ? 'Rotten Tomatoes' :
                        rating.source === 'Metacritic' ? 'Metacritic' :
                        rating.source
                      const accent =
                        rating.source === 'Internet Movie Database' ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300' :
                        rating.source === 'Rotten Tomatoes' ? 'border-red-500/40 bg-red-500/10 text-red-300' :
                        rating.source === 'Metacritic' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' :
                        'border-white/20 bg-white/5 text-white'
                      return (
                        <div
                          key={rating.source}
                          className={`flex items-center justify-between gap-3 border rounded-lg px-3 py-1.5 ${accent}`}
                        >
                          <span className="text-xs opacity-70">{label}</span>
                          <span className="text-sm font-bold">{rating.value}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="container mx-auto px-4 max-w-7xl mt-4 md:mt-4 mb-8">
          {/* Breadcrumb */}
          <Link
            href="/filmes"
            className="inline-flex items-center gap-1.5 text-muted-400 hover:text-white text-sm transition-colors mb-4"
          >
            <span>←</span>
            <span>Explorar Filmes</span>
          </Link>

          {/* Synopsis + Cast two-column */}
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <section className="flex-1 min-w-0">
              <h2 className="text-white font-semibold text-lg mb-3">Sinopse</h2>
              <p className="text-muted-300 leading-relaxed">
                {movie.overview ?? 'Sem sinopse disponível.'}
              </p>
            </section>

            {movie.cast.length > 0 && (
              <section className="md:w-96 lg:w-[28rem] flex-shrink-0">
                <h2 className="text-white font-semibold text-lg mb-3">Elenco</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                  {movie.cast.map(member => (
                    <Link
                      key={member.id}
                      href={`/ator/${member.id}`}
                      className="flex items-center gap-2 min-w-0 group"
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10 flex-shrink-0 ring-1 ring-transparent group-hover:ring-white/30 transition-all">
                        {member.profile_url ? (
                          <Image
                            src={member.profile_url}
                            alt={member.name}
                            width={36}
                            height={36}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-400 text-xs font-bold">
                            {member.name[0]}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate group-hover:text-primary-400 transition-colors">
                          {member.name}
                        </p>
                        <p className="text-muted-400 text-xs truncate">{member.character}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Onde Assistir */}
          {hasWatchProviders && (
            <section className="mb-8">
              <h2 className="text-white font-semibold text-lg mb-3">Onde Assistir</h2>
              <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                {movie.watchProviders!.flatrate.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-muted-200 text-xs">Streaming</span>
                    <div className="flex flex-wrap gap-2">
                      {movie.watchProviders!.flatrate.map(p => (
                        <a key={p.provider_id} href={movie.watchProviders!.link} target="_blank" rel="noopener noreferrer" title={p.provider_name}>
                          <Image src={p.logo_url} alt={p.provider_name} width={40} height={40} className="rounded-lg object-cover ring-1 ring-white/10 hover:ring-white/40 transition-all" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {movie.watchProviders!.rent.length > 0 && (
                  <>
                    {movie.watchProviders!.flatrate.length > 0 && <span className="w-px self-stretch bg-white/15" />}
                    <div className="flex flex-col gap-2">
                      <span className="text-muted-200 text-xs">Alugar</span>
                      <div className="flex flex-wrap gap-2">
                        {movie.watchProviders!.rent.map(p => (
                          <a key={p.provider_id} href={movie.watchProviders!.link} target="_blank" rel="noopener noreferrer" title={p.provider_name}>
                            <Image src={p.logo_url} alt={p.provider_name} width={40} height={40} className="rounded-lg object-cover ring-1 ring-white/10 hover:ring-white/40 transition-all opacity-80" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {movie.watchProviders!.buy.length > 0 && (
                  <>
                    {(movie.watchProviders!.flatrate.length > 0 || movie.watchProviders!.rent.length > 0) && <span className="w-px self-stretch bg-white/15" />}
                    <div className="flex flex-col gap-2">
                      <span className="text-muted-200 text-xs">Comprar</span>
                      <div className="flex flex-wrap gap-2">
                        {movie.watchProviders!.buy.map(p => (
                          <a key={p.provider_id} href={movie.watchProviders!.link} target="_blank" rel="noopener noreferrer" title={p.provider_name}>
                            <Image src={p.logo_url} alt={p.provider_name} width={40} height={40} className="rounded-lg object-cover ring-1 ring-white/10 hover:ring-white/40 transition-all opacity-80" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <p className="text-muted-400 text-xs mt-2">Disponibilidade no Brasil via JustWatch</p>
            </section>
          )}

          {/* Trailers */}
          {movie.trailers.length > 0 && (
            <section className="mb-8">
              <h2 className="text-white font-semibold text-lg mb-3">Trailers</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {movie.trailers.map(trailer => (
                  <a
                    key={trailer.key}
                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex-shrink-0 w-64 md:w-72 rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/25 transition-all"
                  >
                    <div className="relative w-full aspect-video bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`}
                        alt={trailer.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-black/80 transition-colors">
                          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      {trailer.type === 'Teaser' && (
                        <span className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded bg-black/70 text-muted-300">
                          Teaser
                        </span>
                      )}
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-white text-sm font-medium line-clamp-1">{trailer.name}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Community reviews */}
          <section className="mb-8">
            <h2 className="text-white font-semibold text-lg mb-4">
              Avaliações da Comunidade
            </h2>
            <FilmeReviewsGrid
              reviews={reviews}
              movie={{
                tmdb_id: movie.tmdb_id,
                title: movie.title,
                year: movie.year,
                poster_url: movie.poster_url,
              }}
            />
          </section>

        </div>
      </main>

      {/* Action button — fixed mobile, inline desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:static md:bottom-auto md:z-auto border-t border-white/10 bg-bg-dark/95 md:bg-transparent md:border-t-0 backdrop-blur-sm md:backdrop-blur-none px-4 py-4 md:py-0 md:container md:mx-auto md:px-4 md:max-w-7xl md:pb-8">
        <FilmeAvaliacaoButton
          tmdbId={Number(tmdb_id)}
          isLoggedIn={!!user}
          userHasReviewed={userHasReviewed}
        />
      </div>

      {/* Filmes Relacionados */}
      {movie.recommendations.length > 0 && (
        <div className="container mx-auto px-4 max-w-7xl pb-8 pt-4">
          <h2 className="text-white font-semibold text-lg mb-4">Filmes Relacionados</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {movie.recommendations.map(related => (
              <Link
                key={related.id}
                href={`/filmes/${related.id}`}
                className="group flex flex-col gap-1.5"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/10 ring-1 ring-white/10 group-hover:ring-white/30 transition-all">
                  {related.poster_url ? (
                    <Image
                      src={related.poster_url}
                      alt={related.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 25vw, (max-width: 768px) 17vw, 13vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-500 text-xs text-center px-1">
                      {related.title}
                    </div>
                  )}
                </div>
                <p className="text-muted-300 text-xs leading-tight line-clamp-2 group-hover:text-white transition-colors">
                  {related.title}
                </p>
                {related.year && (
                  <p className="text-muted-500 text-xs">{related.year}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
