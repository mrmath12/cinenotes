'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '../../lib/auth-context'
import { createSupabaseBrowserClient } from '../../lib/supabase'
import { getInitials, AVATAR_COLORS } from '../../lib/avatar-colors'
import { updateProfile } from '../../lib/actions'
import Footer from '../components/Footer'

interface Profile {
  full_name: string
  username: string
  avatar_color: string
  created_at: string
}

interface ReviewWithMovie {
  id: string
  final_score: number
  score_script: number
  score_direction: number
  score_photography: number
  score_soundtrack: number
  score_impact: number
  comment: string | null
  created_at: string
  movies: {
    tmdb_id: number
    title: string
    year: number
    poster_url: string | null
  }
}

function getScoreBadgeColor(score: number): string {
  if (score >= 8) return 'bg-emerald-600'
  if (score >= 6) return 'bg-amber-600'
  if (score >= 4) return 'bg-orange-600'
  return 'bg-red-600'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatMemberSince(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
}

export default function PerfilPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [reviews, setReviews] = useState<ReviewWithMovie[]>([])
  const [fetching, setFetching] = useState(true)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editColor, setEditColor] = useState('')
  const [saving, setSaving] = useState(false)
  const [nameError, setNameError] = useState('')
  const [usernameError, setUsernameError] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return
    const supabase = createSupabaseBrowserClient()
    if (!supabase) return

    Promise.all([
      supabase
        .from('profiles')
        .select('full_name, username, avatar_color, created_at')
        .eq('id', user.id)
        .single(),
      supabase
        .from('reviews')
        .select(`
          id, final_score, score_script, score_direction,
          score_photography, score_soundtrack, score_impact,
          comment, created_at,
          movies!inner(tmdb_id, title, year, poster_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
    ]).then(([{ data: profileData }, { data: reviewsData }]) => {
      if (profileData) setProfile(profileData)
      setReviews((reviewsData as unknown as ReviewWithMovie[]) ?? [])
      setFetching(false)
    })
  }, [user])

  function openEdit() {
    if (!profile) return
    setEditName(profile.full_name)
    setEditUsername(profile.username)
    setEditColor(profile.avatar_color)
    setNameError('')
    setUsernameError('')
    setEditing(true)
  }

  function cancelEdit() {
    setEditing(false)
  }

  function validateUsername(value: string): string {
    if (value.length < 3) return 'Mínimo 3 caracteres'
    if (value.length > 20) return 'Máximo 20 caracteres'
    if (!/^[a-z0-9_]+$/.test(value)) return 'Apenas letras minúsculas, números e _'
    return ''
  }

  async function handleSave() {
    const nameErr = editName.trim() === '' ? 'Nome obrigatório' : ''
    const usernameErr = validateUsername(editUsername)
    setNameError(nameErr)
    setUsernameError(usernameErr)
    if (nameErr || usernameErr) return

    setSaving(true)
    try {
      await updateProfile(user!.id, {
        full_name: editName.trim(),
        username: editUsername,
        avatar_color: editColor,
      })
      setProfile(prev =>
        prev
          ? { ...prev, full_name: editName.trim(), username: editUsername, avatar_color: editColor }
          : prev
      )
      toast.success('Perfil atualizado.')
      setEditing(false)
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'username_taken') {
        setUsernameError('Este username já está em uso')
      } else {
        toast.error('Erro ao salvar. Tente novamente.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  if (!user) return null

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Usuário'
  const avatarColor = profile?.avatar_color || '#7C3AED'
  const avgScore =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.final_score, 0) / reviews.length
      : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">

        {/* ── Profile card ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">

          {/* Top row: avatar + info + edit button */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div
                style={{ width: 64, height: 64, backgroundColor: editing ? editColor : avatarColor, fontSize: 22 }}
                className="rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 select-none transition-colors duration-200"
              >
                {getInitials(editing ? editName || displayName : displayName)}
              </div>
              <div>
                <p className="text-white font-bold text-xl leading-tight">
                  {editing ? (editName || displayName) : displayName}
                </p>
                <p className="text-muted-400 text-sm">
                  @{editing ? (editUsername || profile?.username) : profile?.username}
                </p>
                {profile?.created_at && (
                  <p className="text-muted-400 text-xs mt-0.5">
                    Membro desde {formatMemberSince(profile.created_at)}
                  </p>
                )}
              </div>
            </div>

            {!editing && (
              <button
                onClick={openEdit}
                className="flex-shrink-0 flex items-center gap-1.5 text-sm text-muted-300 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.768-6.768a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-.707.464l-3.828 1.414 1.414-3.828A2 2 0 019 13z" />
                </svg>
                Editar
              </button>
            )}
          </div>

          {/* Stats */}
          {!editing && (
            <div className="flex gap-6 border-t border-white/10 pt-5">
              <div>
                <p className="text-white text-2xl font-bold">{reviews.length}</p>
                <p className="text-muted-400 text-xs mt-0.5">Avaliações</p>
              </div>
              {avgScore !== null && (
                <div>
                  <p className="text-white text-2xl font-bold">{avgScore.toFixed(1)}</p>
                  <p className="text-muted-400 text-xs mt-0.5">Nota média</p>
                </div>
              )}
              <div>
                <p className="text-white text-2xl font-bold">
                  {reviews.length > 0
                    ? Math.max(...reviews.map(r => r.final_score)).toFixed(1)
                    : '—'}
                </p>
                <p className="text-muted-400 text-xs mt-0.5">Melhor nota</p>
              </div>
            </div>
          )}

          {/* Edit form */}
          {editing && (
            <div className="border-t border-white/10 pt-5 flex flex-col gap-4">
              {/* Name */}
              <div>
                <label htmlFor="edit-name" className="block text-muted-300 text-sm mb-1">Nome completo</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={e => { setEditName(e.target.value); setNameError('') }}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-muted-400 focus:outline-none focus:border-primary-400 transition-colors"
                  placeholder="Seu nome completo"
                />
                {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
              </div>

              {/* Username */}
              <div>
                <label htmlFor="edit-username" className="block text-muted-300 text-sm mb-1">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-400 text-sm">@</span>
                  <input
                    id="edit-username"
                    type="text"
                    value={editUsername}
                    onChange={e => { setEditUsername(e.target.value.toLowerCase()); setUsernameError('') }}
                    className="w-full bg-white/5 border border-white/20 rounded-lg pl-7 pr-3 py-2 text-white text-sm placeholder-muted-400 focus:outline-none focus:border-primary-400 transition-colors"
                    placeholder="seu_username"
                  />
                </div>
                {usernameError && <p className="text-red-400 text-xs mt-1">{usernameError}</p>}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm text-muted-300 hover:text-white border border-white/20 hover:border-white/40 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-50 font-medium"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Reviews section ── */}
        <h2 className="text-white text-lg font-semibold mb-4">Avaliações</h2>

        {reviews.length === 0 ? (
          <p className="text-muted-300 text-center py-16">Nenhuma avaliação ainda.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map(review => (
              <div
                key={review.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4"
              >
                {/* Poster */}
                <div className="flex-shrink-0 w-[72px] h-[108px] relative rounded-lg overflow-hidden bg-white/10">
                  {review.movies.poster_url ? (
                    <Image
                      src={review.movies.poster_url}
                      alt={review.movies.title}
                      fill
                      className="object-cover"
                      sizes="72px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-400 text-xs text-center px-1">
                      Sem poster
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h3 className="text-white font-semibold text-sm leading-tight">
                        {review.movies.title}
                      </h3>
                      <p className="text-muted-400 text-xs">{review.movies.year}</p>
                    </div>
                    <span className={`flex-shrink-0 ${getScoreBadgeColor(review.final_score)} text-white text-sm font-bold px-2 py-0.5 rounded-lg`}>
                      {review.final_score.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 mb-1.5">
                    <span className="text-muted-300 text-xs">Roteiro: <span className="text-white">{review.score_script}</span></span>
                    <span className="text-muted-300 text-xs">Direção: <span className="text-white">{review.score_direction}</span></span>
                    <span className="text-muted-300 text-xs">Foto: <span className="text-white">{review.score_photography}</span></span>
                    <span className="text-muted-300 text-xs">Trilha: <span className="text-white">{review.score_soundtrack}</span></span>
                    <span className="text-muted-300 text-xs">Impacto: <span className="text-white">{review.score_impact}</span></span>
                  </div>

                  {review.comment && (
                    <p className="text-muted-300 text-xs mb-1 line-clamp-2">{review.comment}</p>
                  )}

                  <span className="text-muted-400 text-xs">{formatDate(review.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
