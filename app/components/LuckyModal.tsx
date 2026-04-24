'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface Person {
  id: number
  name: string
  profile_url: string | null
}

interface PersonSearchInputProps {
  label: string
  placeholder: string
  value: Person | null
  onChange: (person: Person | null) => void
}

function PersonSearchInput({ label, placeholder, value, onChange }: PersonSearchInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Person[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/tmdb/person-search?query=${encodeURIComponent(query)}`)
        const data: Person[] = await res.json()
        setResults(Array.isArray(data) ? data : [])
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  function handleSelect(person: Person) {
    onChange(person)
    setQuery('')
    setResults([])
  }

  function handleClear() {
    onChange(null)
    setQuery('')
    setResults([])
  }

  return (
    <div>
      <label className="block text-muted-300 text-sm font-medium mb-1.5">{label}</label>

      {value ? (
        <div className="flex items-center gap-2 bg-white/5 border border-white/15 rounded-xl px-3 py-2">
          {value.profile_url ? (
            <Image
              src={value.profile_url}
              alt={value.name}
              width={28}
              height={28}
              className="rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{value.name[0]}</span>
            </div>
          )}
          <span className="text-white text-sm flex-1 truncate">{value.name}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-white/50 hover:text-white text-lg leading-none flex-shrink-0 px-1"
            aria-label="Remover seleção"
          >
            ×
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder:text-muted-400 focus:outline-none focus:border-primary-400 transition-colors text-sm"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {results.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-bg-dark border border-white/20 rounded-xl overflow-hidden shadow-xl">
              {results.map(person => (
                <li key={person.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(person)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/10 transition-colors"
                  >
                    {person.profile_url ? (
                      <Image
                        src={person.profile_url}
                        alt={person.name}
                        width={32}
                        height={32}
                        className="rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{person.name[0]}</span>
                      </div>
                    )}
                    <span className="text-white text-sm truncate">{person.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function LuckyModal() {
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([])
  const [genre, setGenre] = useState<number | null>(null)
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')
  const [minRating, setMinRating] = useState('')
  const [actor, setActor] = useState<Person | null>(null)
  const [director, setDirector] = useState<Person | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || genres.length > 0) return
    fetch('/api/tmdb/genres')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setGenres(data) })
      .catch(() => {})
  }, [isOpen, genres.length])

  function handleClearFilters() {
    setGenre(null)
    setYearFrom('')
    setYearTo('')
    setMinRating('')
    setActor(null)
    setDirector(null)
    setError(null)
  }

  function handleClose() {
    setIsOpen(false)
    setError(null)
  }

  async function handleSortear() {
    if (yearFrom && yearTo && parseInt(yearFrom) > parseInt(yearTo)) {
      setError('O ano inicial deve ser menor ou igual ao final.')
      return
    }

    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (genre) params.set('genre', String(genre))
    if (yearFrom) params.set('year_from', yearFrom)
    if (yearTo) params.set('year_to', yearTo)
    if (minRating) params.set('min_rating', minRating)
    if (actor) params.set('actor_id', String(actor.id))
    if (director) params.set('director_id', String(director.id))

    try {
      const res = await fetch(`/api/tmdb/random?${params}`)
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Nenhum filme encontrado com esses filtros.')
        return
      }
      const data = await res.json()
      router.push(`/filmes/${data.tmdb_id}`)
      handleClose()
    } catch {
      setError('Não foi possível sortear. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-primary-600 hover:to-accent-600 transition-all transform hover:scale-105 cursor-pointer"
      >
        Estou com Sorte
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
          onClick={handleClose}
        >
          <div
            className="relative w-full max-w-lg mx-4 bg-surface border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-white text-xl font-bold">Estou com Sorte</h2>
              <button
                onClick={handleClose}
                className="text-white/50 hover:text-white text-2xl leading-none ml-4 flex-shrink-0"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <p className="text-muted-400 text-sm mb-1">
              Sorteamos um filme aleatório para você assistir.
            </p>
            <p className="text-muted-500 text-xs mb-4">
              Use os filtros abaixo para refinar o sorteio — ou clique em <span className="text-muted-300">Sortear!</span> sem nenhum filtro para uma surpresa completa.
            </p>

            <div className="space-y-5">
              {/* Gênero */}
              <div>
                <label className="block text-muted-300 text-sm font-medium mb-1.5">Gênero</label>
                {genres.length === 0 ? (
                  <div className="flex items-center gap-2 text-muted-400 text-sm">
                    <div className="w-3.5 h-3.5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
                    Carregando...
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={genre ?? ''}
                      onChange={e => setGenre(e.target.value ? Number(e.target.value) : null)}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-primary-400 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-bg-dark text-muted-400">Qualquer gênero</option>
                      {genres.map(g => (
                        <option key={g.id} value={g.id} className="bg-bg-dark text-white">
                          {g.name}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Período */}
              <div>
                <label className="block text-muted-300 text-sm font-medium mb-1.5">Período</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={yearFrom}
                      onChange={e => setYearFrom(e.target.value)}
                      placeholder="De (ex: 1990)"
                      min={1888}
                      max={2026}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder:text-muted-400 focus:outline-none focus:border-primary-400 transition-colors text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={yearTo}
                      onChange={e => setYearTo(e.target.value)}
                      placeholder="Até (ex: 2010)"
                      min={1888}
                      max={2026}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder:text-muted-400 focus:outline-none focus:border-primary-400 transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Nota mínima */}
              <div>
                <label className="block text-muted-300 text-sm font-medium mb-1.5">
                  Nota mínima TMDB
                </label>
                <input
                  type="number"
                  value={minRating}
                  onChange={e => setMinRating(e.target.value)}
                  placeholder="Ex: 7.5"
                  min={0}
                  max={10}
                  step={0.1}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder:text-muted-400 focus:outline-none focus:border-primary-400 transition-colors text-sm"
                />
              </div>

              {/* Ator */}
              <PersonSearchInput
                label="Ator / Atriz"
                placeholder="Buscar por nome... (ex: Tom Hanks)"
                value={actor}
                onChange={setActor}
              />

              {/* Diretor */}
              <PersonSearchInput
                label="Diretor / Diretora"
                placeholder="Buscar por nome... (ex: Nolan)"
                value={director}
                onChange={setDirector}
              />
            </div>

            {/* Erro */}
            {error && (
              <p className="mt-4 text-red-400 text-sm">{error}</p>
            )}

            {/* Footer */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleClearFilters}
                disabled={loading}
                className="flex-1 bg-white/5 border border-white/15 text-muted-300 hover:text-white hover:bg-white/10 px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={handleSortear}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? 'Sorteando...' : 'Sortear!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
