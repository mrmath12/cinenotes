'use client'

import { useState } from 'react'
import type React from 'react'
import Image from 'next/image'
import ReviewModal from '../components/ReviewModal'
import NovaAvaliacaoModal from '../components/NovaAvaliacaoModal'
import type { DashboardReview } from './page'

const CRITERIA = [
  { key: 'score_script' as const, label: 'Roteiro' },
  { key: 'score_direction' as const, label: 'Direção' },
  { key: 'score_photography' as const, label: 'Fotografia' },
  { key: 'score_soundtrack' as const, label: 'Trilha' },
  { key: 'score_impact' as const, label: 'Impacto' },
]

const BUCKETS = [
  { label: '9 – 10', min: 9, max: 10 },
  { label: '7 – 8', min: 7, max: 8.9 },
  { label: '5 – 6', min: 5, max: 6.9 },
  { label: '1 – 4', min: 1, max: 4.9 },
]

function avg(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function scoreBadgeClass(score: number) {
  if (score >= 7) return 'bg-green-500/20 text-green-400 border border-green-500/40'
  if (score >= 5) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
  return 'bg-red-500/20 text-red-400 border border-red-500/40'
}

export default function UserStats({ reviews, headerActions }: { reviews: DashboardReview[], headerActions?: React.ReactNode }) {
  const [selectedReview, setSelectedReview] = useState<DashboardReview | null>(null)
  const [avaliacaoModalOpen, setAvaliacaoModalOpen] = useState(false)

  if (reviews.length === 0) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white">Suas Estatísticas</h2>
          {headerActions}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-muted-300 mb-4">Você ainda não avaliou nenhum filme.</p>
          <button
            onClick={() => setAvaliacaoModalOpen(true)}
            className="inline-block bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-2 rounded-xl hover:from-primary-600 hover:to-accent-600 transition font-medium cursor-pointer"
          >
            Avaliar meu primeiro filme
          </button>
        </div>
        <NovaAvaliacaoModal
          isOpen={avaliacaoModalOpen}
          onClose={() => setAvaliacaoModalOpen(false)}
        />
      </section>
    )
  }

  const totalReviews = reviews.length
  const overallAvg = avg(reviews.map(r => r.final_score))

  const criteriaAvgs = CRITERIA.map(c => ({
    ...c,
    value: avg(reviews.map(r => r[c.key])),
  }))
  const best = criteriaAvgs.reduce((a, b) => (b.value > a.value ? b : a))
  const worst = criteriaAvgs.reduce((a, b) => (b.value < a.value ? b : a))

  const bucketCounts = BUCKETS.map(b => ({
    ...b,
    count: reviews.filter(r => r.final_score >= b.min && r.final_score <= b.max).length,
  }))
  const maxBucketCount = Math.max(...bucketCounts.map(b => b.count), 1)

  const recent = reviews.slice(0, 4)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold text-white">Suas Estatísticas</h2>
        {headerActions}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-muted-400 text-sm mb-1">Filmes avaliados</p>
          <p className="text-3xl font-bold text-white">{totalReviews}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-muted-400 text-sm mb-1">Nota média</p>
          <p className={`text-3xl font-bold ${overallAvg >= 7 ? 'text-green-400' : overallAvg >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
            {overallAvg.toFixed(1)}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-muted-400 text-sm mb-1">Melhor critério</p>
          <p className="text-white font-semibold">{best.label}</p>
          <p className="text-green-400 text-sm">média {best.value.toFixed(1)}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-muted-400 text-sm mb-1">Critério mais baixo</p>
          <p className="text-white font-semibold">{worst.label}</p>
          <p className="text-red-400 text-sm">média {worst.value.toFixed(1)}</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

        {/* Score distribution */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-medium mb-4">Distribuição de Notas</h3>
          <div className="space-y-3">
            {bucketCounts.map(b => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="text-muted-400 text-xs w-10 flex-shrink-0">{b.label}</span>
                <div className="flex-1 bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      b.min >= 9 ? 'bg-green-400' :
                      b.min >= 7 ? 'bg-green-500/70' :
                      b.min >= 5 ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${(b.count / maxBucketCount) * 100}%` }}
                  />
                </div>
                <span className="text-muted-300 text-xs w-4 text-right flex-shrink-0">{b.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Criteria breakdown */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-medium mb-4">Média por Critério</h3>
          <div className="space-y-3">
            {criteriaAvgs.map(c => (
              <div key={c.key} className="flex items-center gap-3">
                <span className="text-muted-400 text-xs w-20 flex-shrink-0">{c.label}</span>
                <div className="flex-1 bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${c.value >= 7 ? 'bg-green-400' : c.value >= 5 ? 'bg-yellow-400' : 'bg-red-400'}`}
                    style={{ width: `${(c.value / 10) * 100}%` }}
                  />
                </div>
                <span className="text-muted-300 text-xs w-6 text-right flex-shrink-0">{c.value.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent reviews */}
      <div>
        <h3 className="text-white font-medium mb-3">Últimas Avaliações</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {recent.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedReview(r)}
              className="bg-white/5 border border-white/10 rounded-xl p-3 flex gap-3 text-left hover:border-white/20 hover:bg-white/8 transition-all w-full cursor-pointer"
            >
              <div className="flex-shrink-0 w-10 h-[60px] relative rounded overflow-hidden bg-white/10">
                {r.movies.poster_url ? (
                  <Image
                    src={r.movies.poster_url}
                    alt={r.movies.title}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-400 text-xs">?</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate leading-tight">{r.movies.title}</p>
                <p className="text-muted-400 text-xs">{r.movies.year}</p>
                <span className={`inline-block text-xs font-bold px-1.5 py-0.5 rounded-full mt-1 ${scoreBadgeClass(r.final_score)}`}>
                  {r.final_score.toFixed(1)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedReview && (
        <ReviewModal
          review={selectedReview}
          isOpen={true}
          onClose={() => setSelectedReview(null)}
          showDelete={false}
          censorProfile={false}
        />
      )}
    </section>
  )
}
