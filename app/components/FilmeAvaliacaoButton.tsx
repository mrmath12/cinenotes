'use client'

import { useState } from 'react'
import Link from 'next/link'
import NovaAvaliacaoModal from './NovaAvaliacaoModal'

interface Props {
  tmdbId: number
  isLoggedIn: boolean
  userHasReviewed: boolean
}

export default function FilmeAvaliacaoButton({ tmdbId, isLoggedIn, userHasReviewed }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  if (userHasReviewed) {
    return (
      <div className="block w-full md:w-auto md:inline-block text-center px-6 py-3 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-semibold rounded-xl">
        Você já avaliou esse filme
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="block w-full md:w-auto md:inline-block text-center px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold rounded-xl transition-colors"
      >
        Entre para Avaliar
      </Link>
    )
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="block w-full md:w-auto md:inline-block text-center px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-lg cursor-pointer"
      >
        Avaliar este Filme
      </button>
      <NovaAvaliacaoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTmdbId={String(tmdbId)}
      />
    </>
  )
}
