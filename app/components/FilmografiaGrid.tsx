'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { fetchFilmografia } from '../../lib/actions'
import type { FilmCard } from '../../lib/types'

interface FilmografiaGridProps {
  initialFilms: FilmCard[]
  totalCount: number
  personId: number
  role: 'cast' | 'director'
  showCharacter?: boolean
}

export default function FilmografiaGrid({
  initialFilms,
  totalCount,
  personId,
  role,
  showCharacter = false,
}: FilmografiaGridProps) {
  const [films, setFilms] = useState<FilmCard[]>(initialFilms)
  const [isPending, startTransition] = useTransition()

  function loadMore() {
    startTransition(async () => {
      const result = await fetchFilmografia(personId, films.length, role)
      setFilms(prev => [...prev, ...result.films])
    })
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {films.map(film => (
          <Link
            key={`${film.id}-${film.character ?? role}`}
            href={`/filmes/${film.id}`}
            className="group flex flex-col gap-1.5"
          >
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/10 ring-1 ring-white/10 group-hover:ring-white/30 transition-all">
              {film.poster_url ? (
                <Image
                  src={film.poster_url}
                  alt={film.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-500 text-xs text-center px-2">
                  {film.title}
                </div>
              )}
            </div>
            <p className="text-muted-300 text-xs leading-tight line-clamp-2 group-hover:text-white transition-colors">
              {film.title}
            </p>
            {film.year && <p className="text-muted-500 text-xs">{film.year}</p>}
            {showCharacter && film.character && (
              <p className="text-muted-500 text-xs italic line-clamp-1">{film.character}</p>
            )}
          </Link>
        ))}
      </div>

      {films.length < totalCount && (
        <div className="mt-5 flex justify-end">
          <button
            onClick={loadMore}
            disabled={isPending}
            className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-xl border border-white/10 hover:border-white/20 transition-all disabled:opacity-50"
          >
            {isPending ? 'Carregando...' : `Mostrar mais (${totalCount - films.length} restantes)`}
          </button>
        </div>
      )}
    </div>
  )
}
