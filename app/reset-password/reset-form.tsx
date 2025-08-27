"use client"

import { useEffect, useState } from 'react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { useSupabase } from '../../lib/supabase-provider'
import { useRouter } from 'next/navigation'

export default function ResetPasswordForm() {
  const supabase = useSupabase()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [canReset, setCanReset] = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
      if (event === 'PASSWORD_RECOVERY') {
        setCanReset(true)
      }
    })

    // Tentar recuperar sessão do link (caso necessário)
    supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
      if (result.data.session) {
        setCanReset(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setMessage('Senha atualizada com sucesso! Redirecionando para login...')
      setTimeout(() => router.push('/login'), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar a senha')
    } finally {
      setLoading(false)
    }
  }

  if (!canReset) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-gray-200 text-center text-gray-800">
        Validando link de redefinição...
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-purple-900 tracking-tight">Definir nova senha</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="password"
          placeholder="Nova senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-gray-900 placeholder-gray-500"
        />
        <input
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-gray-900 placeholder-gray-500"
        />
        {message && <div className="text-green-700 text-sm text-center">{message}</div>}
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-900 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-60"
        >
          {loading ? 'Atualizando...' : 'Atualizar senha'}
        </button>
      </form>
    </div>
  )
}
