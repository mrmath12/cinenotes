'use server'

import { createClient } from './supabase-server'
import { revalidatePath } from 'next/cache'

// Exemplo de Server Action para buscar dados do usuário
export async function getUserProfile(userId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
    
  if (error) {
    throw new Error('Erro ao buscar perfil do usuário')
  }
  
  return data
}

// Exemplo de Server Action para criar avaliação
export async function createReview(formData: FormData) {
  const supabase = await createClient()
  
  // Verificar se o usuário está autenticado
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Usuário não autenticado')
  }
  
  const movieId = formData.get('movieId') as string
  const scoreScript = parseInt(formData.get('scoreScript') as string)
  const scoreDirection = parseInt(formData.get('scoreDirection') as string)
  const scoreCinematography = parseInt(formData.get('scoreCinematography') as string)
  const scoreSoundtrack = parseInt(formData.get('scoreSoundtrack') as string)
  const scoreOverall = parseInt(formData.get('scoreOverall') as string)
  const comment = formData.get('comment') as string
  
  const { error } = await supabase
    .from('reviews')
    .insert({
      user_id: user.id,
      movie_id: movieId,
      score_script: scoreScript,
      score_direction: scoreDirection,
      score_cinematography: scoreCinematography,
      score_soundtrack: scoreSoundtrack,
      score_overall: scoreOverall,
      comment
    })
    
  if (error) {
    throw new Error('Erro ao criar avaliação')
  }
  
  // Revalidar a página para mostrar a nova avaliação
  revalidatePath('/filmes/[id]')
  
  return { success: true }
}

// Exemplo de Server Action para buscar avaliações de um filme
export async function getMovieReviews(movieId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles (
        username,
        full_name
      )
    `)
    .eq('movie_id', movieId)
    .order('created_at', { ascending: false })
    
  if (error) {
    throw new Error('Erro ao buscar avaliações')
  }
  
  return data
} 