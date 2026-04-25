'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import LuckyModal from './LuckyModal'

interface HeroMovie {
  trailerKey: string
  title: string
  year: number | null
  tmdbId: number
}

interface HeroVideoBackgroundProps {
  movies: HeroMovie[]
  ctaHref: string
}

export default function HeroVideoBackground({ movies, ctaHref }: HeroVideoBackgroundProps) {
  const [picked, setPicked] = useState<HeroMovie | null>(null)

  useEffect(() => {
    if (movies.length > 0) {
      const idx = Math.floor(Math.random() * movies.length)
      setPicked(movies[idx])
    }
  }, [movies])

  const embedUrl = picked
    ? `https://www.youtube-nocookie.com/embed/${picked.trailerKey}?autoplay=1&mute=1&controls=0&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&playsinline=1&disablekb=1`
    : null

  return (
    <section className="relative overflow-hidden min-h-[75vh] flex items-center">
      {/* Video background */}
      {embedUrl && (
        <iframe
          key={picked?.trailerKey}
          src={embedUrl}
          style={{
            position: 'absolute',
            zIndex: 0,
            top: '50%',
            left: '50%',
            width: '100vw',
            height: '56.25vw',
            minHeight: '100%',
            minWidth: '177.78vh',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            border: 'none',
          }}
          allow="autoplay; encrypted-media"
          title="trailer background"
        />
      )}

      {/* Dark overlay — z-[1] garante que fica acima do iframe */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-bg-dark via-bg-dark/75 to-bg-dark/50" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-bg-dark/40 via-transparent to-bg-dark/40" />

      {/* Movie label */}
      {picked && (
        <div className="absolute bottom-6 left-0 right-0 z-[2] flex justify-center">
          <Link
            href={`/filmes/${picked.tmdbId}`}
            className="flex flex-col items-center gap-1 bg-white/0 backdrop-blur-xl backdrop-saturate-150 px-6 py-3 rounded-2xl hover:bg-white/5 transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-primary-300">| Trailer em destaque |</span>
            <span className="text-sm text-white font-medium">{picked.title}{picked.year ? ` (${picked.year})` : ''}</span>
          </Link>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 w-full container mx-auto px-4 max-w-7xl py-24 text-center">
        <h1 className="text-3xl md:text-5xl xl:text-6xl font-bold text-white mb-6 max-w-7xl mx-auto">
          Sua opinião merece mais do que
          <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent"> uma nota</span>
        </h1>
        <p className="text-md md:text-xl xl:text-2xl text-muted-300 mb-8 max-w-7xl leading-relaxed mx-auto">
          Avalie cada aspecto — do roteiro à trilha sonora —{' '}
          e veja o que a comunidade está achando.
        </p>
        <div className="flex flex-col gap-4 items-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <div className="p-[1px] rounded-lg bg-gradient-to-br from-primary-400/60 via-primary-500/10 to-primary-500/30">
              <Link
                href="/filmes"
                className="flex items-center justify-center bg-white/10 backdrop-blur-xl backdrop-saturate-150 text-primary-300 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-500/20 hover:text-primary-200 transition-all hover:scale-105 shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]"
              >
                Explorar Filmes
              </Link>
            </div>
            <div className="p-[1px] rounded-lg bg-gradient-to-br from-primary-400/60 via-primary-500/10 to-primary-500/30">
              <Link
                href={ctaHref}
                className="flex items-center justify-center bg-white/10 backdrop-blur-xl backdrop-saturate-150 text-primary-300 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-500/20 hover:text-primary-200 transition-all hover:scale-105 shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]"
              >
                Começar Agora
              </Link>
            </div>
          </div>
          <LuckyModal />
        </div>
      </div>
    </section>
  )
}
