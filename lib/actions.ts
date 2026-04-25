'use server'

import { createClient } from './supabase-server'
import { createAdminClient } from './supabase-admin'
import { revalidatePath } from 'next/cache'
import type { Profile, FilmCard } from './types'

async function getAllPersonFilms(
  personId: number,
  role: 'cast' | 'director',
): Promise<FilmCard[]> {
  const apiKey = process.env.TMDB_API_KEY
  const url = `https://api.themoviedb.org/3/person/${personId}/combined_credits?api_key=${apiKey}&language=pt-BR`

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()

    const seen = new Set<number>()
    const result: FilmCard[] = []

    const source: { id: number; title?: string; poster_path: string | null; release_date?: string; character?: string; job?: string; popularity: number; media_type: string }[] =
      role === 'cast'
        ? (data.cast ?? []).filter((c: { media_type: string }) => c.media_type === 'movie')
        : (data.crew ?? []).filter((c: { media_type: string; job: string }) => c.media_type === 'movie' && c.job === 'Director')

    source
      .sort((a, b) => b.popularity - a.popularity)
      .forEach(c => {
        if (!seen.has(c.id)) {
          seen.add(c.id)
          result.push({
            id: c.id,
            title: c.title ?? '',
            poster_url: c.poster_path ? `https://image.tmdb.org/t/p/w342${c.poster_path}` : null,
            year: c.release_date ? parseInt(c.release_date.slice(0, 4), 10) || null : null,
            character: role === 'cast' ? (c.character || undefined) : undefined,
          })
        }
      })

    return result
  } catch {
    return []
  }
}

export async function fetchFilmografia(
  personId: number,
  offset: number,
  role: 'cast' | 'director',
): Promise<{ films: FilmCard[]; total: number }> {
  const all = await getAllPersonFilms(personId, role)
  return { films: all.slice(offset, offset + 4), total: all.length }
}

export async function fetchPersonMovieIds(
  personId: number,
  role: 'cast' | 'director',
): Promise<number[]> {
  const all = await getAllPersonFilms(personId, role)
  return all.slice(0, 20).map(f => f.id)
}

export async function fetchPublicReviews() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id, user_id, final_score, score_script, score_direction,
      score_photography, score_soundtrack, score_impact,
      comment, created_at,
      movies!inner(tmdb_id, title, year, poster_url),
      profiles!inner(full_name, username, avatar_color)
    `)
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function getUserProfile(userId: string): Promise<Profile> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error('Erro ao buscar perfil do usuário')
  }

  return data as Profile
}

export async function updateProfile(
  userId: string,
  data: { full_name: string; username: string; avatar_color: string }
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId)

  if (error) {
    if (error.code === '23505') throw new Error('username_taken')
    throw new Error('Erro ao atualizar perfil')
  }

  revalidatePath('/perfil')
}

export async function deleteReview(reviewId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId)

  if (error) {
    throw new Error('Erro ao excluir avaliação')
  }

  revalidatePath('/avaliacoes')
  revalidatePath('/minhas-avaliacoes')
  revalidatePath('/perfil')
  revalidatePath('/dashboard')
}
