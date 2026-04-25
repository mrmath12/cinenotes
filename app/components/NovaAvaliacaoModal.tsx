'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import NovaAvaliacaoForm from './NovaAvaliacaoForm'

interface Props {
  isOpen: boolean
  onClose: () => void
  initialTmdbId?: string
}

export default function NovaAvaliacaoModal({ isOpen, onClose, initialTmdbId }: Props) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isOpen || loading) return
    if (!user) {
      onClose()
      router.push('/login')
    }
  }, [isOpen, user, loading, onClose, router])

  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || loading || !user) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg mx-4 bg-surface border border-white/10 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-white text-xl font-bold">Nova Avaliação</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white text-2xl leading-none ml-4 flex-shrink-0"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <NovaAvaliacaoForm preselectedTmdbId={initialTmdbId} onSuccess={onClose} />
      </div>
    </div>
  )
}
