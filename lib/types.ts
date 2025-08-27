export interface Profile {
  id: string
  full_name: string | null
  username?: string
  created_at?: string
}

export interface Review {
  id: string
  score_overall: number
  comment: string
  created_at: string
  profiles: { full_name: string; username: string }
  movies: { title: string; year: number } 
}
