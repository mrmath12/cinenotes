'use client'

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

interface ReviewCardProps {
  review: Review
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:border-white/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-white font-medium">
            {review.profiles?.full_name || review.profiles?.username || 'Usuário'}
          </span>
          <span className="text-purple-300">•</span>
          <span className="text-purple-200 text-sm">
            {review.movies?.title} ({review.movies?.year})
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-yellow-400">★</span>
          <span className="text-white font-medium">{review.score_overall}/10</span>
        </div>
      </div>
      
      {review.comment && (
        <p className="text-gray-300 text-sm line-clamp-3 mb-3">{review.comment}</p>
      )}
      
      <div className="text-purple-300 text-xs">
        {new Date(review.created_at).toLocaleDateString('pt-BR')}
      </div>
    </div>
  )
}