"use client"

import { useState } from 'react'
import { useSupabase } from '../../lib/supabase-provider'

export default function ForgotPasswordForm() {
  const supabase = useSupabase()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      if (!supabase) throw new Error('Configuração do Supabase ausente')
      const redirectTo = `${window.location.origin}/reset-password`
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      })
      if (error) throw error
      setMessage('Se o e-mail existir, enviaremos um link para redefinição.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o e-mail de redefinição')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-muted-200">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-primary-900 tracking-tight">Redefinir senha</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="email"
          placeholder="Seu e-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 border border-muted-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-focus transition text-muted-800 placeholder-muted-400"
        />
        {message && <div className="text-success text-sm text-center">{message}</div>}
        {error && <div className="text-danger text-sm text-center">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-900 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-60"
        >
          {loading ? 'Enviando...' : 'Enviar link de redefinição'}
        </button>
      </form>
    </div>
  )
}
