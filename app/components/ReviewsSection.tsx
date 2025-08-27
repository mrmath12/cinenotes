'use client'

import { useEffect, useState } from 'react'
import ReviewCard from './ReviewCard'

interface Review {
  id: string
  score_overall: number
  comment: string
  created_at: string
  profiles: {
    full_name: string
    username: string
  } | null
  movies: {
    title: string
    year: number
  } | null
}

type ReviewFilter = 'recentes' | 'mais-curtidos' | 'estou-com-sorte'

// Dados mock para teste
const mockReviews: Review[] = [
  {
    id: '1',
    score_overall: 9,
    comment: 'Filme incrível! A direção é impecável e a fotografia é deslumbrante. Uma experiência cinematográfica única.',
    created_at: '2024-12-15T10:30:00Z',
    profiles: { full_name: 'Maria Silva', username: 'maria_silva' },
    movies: { title: 'Interestelar', year: 2014 }
  },
  {
    id: '2',
    score_overall: 8,
    comment: 'Excelente roteiro e atuações marcantes. O filme prende a atenção do início ao fim.',
    created_at: '2024-12-14T15:45:00Z',
    profiles: { full_name: 'João Santos', username: 'joao_santos' },
    movies: { title: 'O Poderoso Chefão', year: 1972 }
  },
  {
    id: '3',
    score_overall: 7,
    comment: 'Bom filme, mas poderia ter sido mais impactante. A trilha sonora é o destaque.',
    created_at: '2024-12-13T20:15:00Z',
    profiles: { full_name: 'Ana Costa', username: 'ana_costa' },
    movies: { title: 'Pulp Fiction', year: 1994 }
  },
  {
    id: '4',
    score_overall: 10,
    comment: 'Obra-prima absoluta! Cada cena é perfeita e a narrativa é genial.',
    created_at: '2024-12-12T14:20:00Z',
    profiles: { full_name: 'Carlos Lima', username: 'carlos_lima' },
    movies: { title: 'Cidadão Kane', year: 1941 }
  },
  {
    id: '5',
    score_overall: 6,
    comment: 'Filme interessante, mas com alguns problemas de ritmo. Vale a pena assistir.',
    created_at: '2024-12-11T11:10:00Z',
    profiles: { full_name: 'Lucia Ferreira', username: 'lucia_ferreira' },
    movies: { title: 'Taxi Driver', year: 1976 }
  },
  {
    id: '6',
    score_overall: 9,
    comment: 'Surpreendente! A direção de arte e os efeitos visuais são espetaculares.',
    created_at: '2024-12-10T16:30:00Z',
    profiles: { full_name: 'Pedro Alves', username: 'pedro_alves' },
    movies: { title: 'Blade Runner', year: 1982 }
  }
]

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>('recentes')
  const [loading, setLoading] = useState(false)

  // Função para aplicar filtros aos dados mock
  const applyFilter = (filter: ReviewFilter) => {
    setLoading(true)
    
    setTimeout(() => {
      const filteredReviews = [...mockReviews]
      
      switch (filter) {
        case 'recentes':
          filteredReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          break
        case 'mais-curtidos':
          filteredReviews.sort((a, b) => b.score_overall - a.score_overall)
          break
        case 'estou-com-sorte':
          filteredReviews.sort(() => Math.random() - 0.5)
          break
      }
      
      setReviews(filteredReviews)
      setLoading(false)
    }, 300) // Simular loading
  }

  useEffect(() => {
    // Carregar e atualizar quando o filtro mudar
    applyFilter(activeFilter)
  }, [activeFilter])

  const handleFilterChange = (filter: ReviewFilter) => {
    setActiveFilter(filter)
  }

  const getFilterLabel = (filter: ReviewFilter) => {
    switch (filter) {
      case 'recentes': return '🕒 Recentes'
      case 'mais-curtidos': return '❤️ Mais Curtidos'
      case 'estou-com-sorte': return '🎲 Estou com Sorte'
    }
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Reviews da Comunidade</h3>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
            <span className="text-purple-200">Carregando...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="text-xl font-semibold text-white">Reviews da Comunidade</h3>
          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full border border-yellow-500/30">
            Modo Demo
          </span>
        </div>
        
        {/* Filtros */}
        <div className="flex space-x-2">
          {(['recentes', 'mais-curtidos', 'estou-com-sorte'] as ReviewFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeFilter === filter
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-purple-200 hover:bg-white/20'
              }`}
            >
              {getFilterLabel(filter)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-blue-200 text-sm text-center">
          💡 <strong>Dica:</strong> Estes são dados de demonstração. 
          Conecte seu banco de dados para ver reviews reais da comunidade!
        </p>
      </div>
    </div>
  )
}