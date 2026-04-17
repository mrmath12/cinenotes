export interface Profile {
  id: string
  full_name: string
  username: string
  avatar_color: string
  created_at: string
}

export interface Movie {
  tmdb_id: number
  title: string
  year: number
  poster_url: string | null
  genres: string[]
}

export interface Review {
  id: string
  user_id: string
  movie_id: number
  score_script: number
  score_direction: number
  score_photography: number
  score_soundtrack: number
  score_impact: number
  final_score: number
  comment: string | null
  created_at: string
  profiles?: Pick<Profile, 'full_name' | 'username' | 'avatar_color'>
  movies?: Pick<Movie, 'title' | 'year' | 'poster_url'>
}
