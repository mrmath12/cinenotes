'use server'

import { createClient } from './supabase-server'
import { createAdminClient } from './supabase-admin'
import { revalidatePath } from 'next/cache'
import type { Profile } from './types'

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
