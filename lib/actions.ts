'use server'

import { createClient } from './supabase-server'
import { revalidatePath } from 'next/cache'
import type { Profile } from './types'

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
