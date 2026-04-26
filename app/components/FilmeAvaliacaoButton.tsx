'use client'

import { useState } from 'react'
import NovaAvaliacaoModal from './NovaAvaliacaoModal'
import LiquidButton from './LiquidButton'

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
      <div className="w-full md:w-auto">
        <LiquidButton variant="gray" href="/login" size="lg" fullWidth>Entre para Avaliar</LiquidButton>
      </div>
    )
  }

  return (
    <>
      <div className="w-full md:w-auto">
        <LiquidButton variant="purple" size="lg" fullWidth onClick={() => setModalOpen(true)}>Avaliar este Filme</LiquidButton>
      </div>
      <NovaAvaliacaoModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTmdbId={String(tmdbId)}
      />
    </>
  )
}
