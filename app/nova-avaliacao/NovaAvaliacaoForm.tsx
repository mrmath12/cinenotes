'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth-context'
import { createSupabaseBrowserClient } from '../../lib/supabase'

interface TMDBMovie {
  tmdb_id: number
  title: string
  year: number | null
  poster_url: string | null
  genre_ids?: number[]
}

const CRITERIA = [
  { key: 'score_script', label: 'Roteiro' },
  { key: 'score_direction', label: 'Direção' },
  { key: 'score_photography', label: 'Fotografia' },
  { key: 'score_soundtrack', label: 'Trilha Sonora' },
  { key: 'score_impact', label: 'Impacto Geral' },
] as const

type CriteriaKey = (typeof CRITERIA)[number]['key']

function parseScore(val: string): number | null {
  if (val.trim() === '') return null
  const n = parseFloat(val)
  return isNaN(n) ? NaN : n
}

function scoreError(val: string): string | null {
  if (val.trim() === '') return null
  const n = parseFloat(val)
  if (isNaN(n)) return 'Digite um número válido'
  if (n < 1 || n > 10) return 'Nota deve estar entre 1 e 10'
  return null
}

export default function NovaAvaliacaoForm() {
  const { user } = useAuth()
  const router = useRouter()

  // Movie search
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TMDBMovie[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null)
  const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Scores
  const [scores, setScores] = useState<Record<CriteriaKey, string>>({
    score_script: '',
    score_direction: '',
    score_photography: '',
    score_soundtrack: '',
    score_impact: '',
  })

  // Comment
  const [comment, setComment] = useState('')

  // Submitting
  const [submitting, setSubmitting] = useState(false)

  // Debounced TMDB search
  useEffect(() => {
    if (selectedMovie) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 4) {
      setResults([])
      setSearchError(null)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      setSearchError(null)
      try {
        const res = await fetch(`/api/tmdb/search?query=${encodeURIComponent(query)}`)
        if (!res.ok) {
          const data = await res.json()
          setSearchError(data.error ?? 'Não foi possível buscar filmes. Tente novamente.')
          setResults([])
        } else {
          const data: TMDBMovie[] = await res.json()
          setResults(data)
          // Check which of these have already been reviewed by the user
          if (user && data.length > 0) {
            checkReviewed(data.map((m) => m.tmdb_id))
          }
        }
      } catch {
        setSearchError('Não foi possível buscar filmes. Tente novamente.')
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selectedMovie, user])

  async function checkReviewed(tmdbIds: number[]) {
    if (!user) return
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return
    const { data } = await supabase
      .from('reviews')
      .select('movie_id')
      .eq('user_id', user.id)
      .in('movie_id', tmdbIds)
    if (data) {
      setReviewedIds(new Set(data.map((r: { movie_id: number }) => r.movie_id)))
    }
  }

  function handleSelectMovie(movie: TMDBMovie) {
    if (reviewedIds.has(movie.tmdb_id)) return
    setSelectedMovie(movie)
    setQuery('')
    setResults([])
    setSearchError(null)
  }

  function handleClearMovie() {
    setSelectedMovie(null)
    setQuery('')
    setResults([])
  }

  function handleScoreChange(key: CriteriaKey, val: string) {
    setScores((prev) => ({ ...prev, [key]: val }))
  }

  const finalScore = useMemo(() => {
    const vals = CRITERIA.map((c) => parseScore(scores[c.key]))
    const valid = vals.filter((v) => v !== null && !isNaN(v as number) && (v as number) >= 1 && (v as number) <= 10) as number[]
    if (valid.length < 5) return null
    return Math.round((valid.reduce((a, b) => a + b, 0) / 5) * 10) / 10
  }, [scores])

  const isFormValid = useMemo(() => {
    if (!selectedMovie) return false
    return finalScore !== null
  }, [selectedMovie, finalScore])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isFormValid || !selectedMovie) return

    setSubmitting(true)
    try {
      const body = {
        movie: selectedMovie,
        score_script: parseFloat(scores.score_script),
        score_direction: parseFloat(scores.score_direction),
        score_photography: parseFloat(scores.score_photography),
        score_soundtrack: parseFloat(scores.score_soundtrack),
        score_impact: parseFloat(scores.score_impact),
        comment: comment.trim() || undefined,
      }

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 409) {
        toast.error('Você já avaliou este filme.')
        return
      }

      if (res.status === 403) {
        toast.error('Seu cadastro está incompleto. Faça o registro novamente.')
        return
      }

      if (!res.ok) {
        toast.error('Erro ao salvar avaliação. Tente novamente.')
        return
      }

      toast.success('Avaliação salva com sucesso!')
      router.push('/avaliacoes')
    } catch {
      toast.error('Erro ao salvar avaliação. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 space-y-6"
    >
      {/* Movie search */}
      <div>
        <label htmlFor="movie-search" className="block text-white font-medium mb-2">Filme</label>

        {selectedMovie ? (
          <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3 border border-white/20">
            {selectedMovie.poster_url ? (
              <Image
                src={selectedMovie.poster_url}
                alt={selectedMovie.title}
                width={40}
                height={60}
                className="rounded object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-[60px] bg-white/20 rounded flex-shrink-0 flex items-center justify-center">
                <span className="text-white/40 text-xs">?</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{selectedMovie.title}</p>
              {selectedMovie.year && (
                <p className="text-primary-300 text-sm">{selectedMovie.year}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleClearMovie}
              className="text-white/60 hover:text-white text-xl leading-none flex-shrink-0 px-1"
              aria-label="Remover filme selecionado"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              id="movie-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar filme..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {searchError && (
              <p className="mt-2 text-red-400 text-sm">{searchError}</p>
            )}

            {!searchError && results.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-bg-dark border border-white/20 rounded-lg overflow-hidden shadow-xl">
                {results.map((movie) => {
                  const alreadyReviewed = reviewedIds.has(movie.tmdb_id)
                  return (
                    <li key={movie.tmdb_id}>
                      <button
                        type="button"
                        disabled={alreadyReviewed}
                        onClick={() => handleSelectMovie(movie)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition ${
                          alreadyReviewed
                            ? 'opacity-60 cursor-not-allowed'
                            : 'hover:bg-white/10 cursor-pointer'
                        }`}
                      >
                        {movie.poster_url ? (
                          <Image
                            src={movie.poster_url}
                            alt={movie.title}
                            width={40}
                            height={60}
                            className="rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-[60px] bg-white/20 rounded flex-shrink-0 flex items-center justify-center">
                            <span className="text-white/40 text-xs">?</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{movie.title}</p>
                          {movie.year && (
                            <p className="text-primary-300 text-sm">{movie.year}</p>
                          )}
                          {alreadyReviewed && (
                            <p className="text-yellow-400 text-xs mt-0.5">
                              Já avaliado · Vá em Minhas Avaliações para excluir antes de reavaliar
                            </p>
                          )}
                        </div>
                        {alreadyReviewed && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded px-2 py-0.5 flex-shrink-0">
                            Já avaliado
                          </span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Score fields */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-white font-medium">Notas</label>
          <span className="text-primary-200 text-sm">
            Nota Final:{' '}
            <span className="font-bold text-white">
              {finalScore !== null ? finalScore : '—'}
            </span>
          </span>
        </div>
        <div className="space-y-3">
          {CRITERIA.map((c) => {
            const err = scoreError(scores[c.key])
            return (
              <div key={c.key} className="flex items-start gap-4">
                <label htmlFor={`score-${c.key}`} className="w-32 text-primary-200 text-sm pt-2 flex-shrink-0">
                  {c.label}
                </label>
                <div className="flex-1">
                  <input
                    id={`score-${c.key}`}
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    placeholder="1.0 – 10.0"
                    value={scores[c.key]}
                    onChange={(e) => handleScoreChange(c.key, e.target.value)}
                    className={`w-full bg-white/10 border rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      err ? 'border-red-400' : 'border-white/20'
                    }`}
                  />
                  {err && (
                    <p className="mt-1 text-red-400 text-xs">{err}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-white font-medium mb-2">
          Comentário <span className="text-primary-400 font-normal text-sm">(opcional)</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, 1000))}
          rows={4}
          placeholder="Escreva sua opinião sobre o filme..."
          className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
        <p className="mt-1 text-right text-primary-400 text-xs">{comment.length}/1000</p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isFormValid || submitting}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
      >
        {submitting && (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {submitting ? 'Salvando...' : 'Salvar Avaliação'}
      </button>
    </form>
  )
}
