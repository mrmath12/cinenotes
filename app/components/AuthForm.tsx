"use client"

import { useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { useRouter } from 'next/navigation'

interface AuthFormProps {
  mode?: 'login' | 'register'
}

export default function AuthForm({ mode = 'login' }: AuthFormProps) {
  const { signIn, signUp } = useAuth()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formMode, setFormMode] = useState<'login' | 'register'>(mode)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validação para registro
    if (formMode === 'register') {
      if (password !== confirmPassword) {
        setError('As senhas não coincidem')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres')
        setLoading(false)
        return
      }
      if (!fullName.trim()) {
        setError('Nome completo é obrigatório')
        setLoading(false)
        return
      }
    }

    try {
      if (formMode === 'login') {
        await signIn(email, password)
        console.log('Login bem-sucedido, redirecionando para dashboard...')
        router.push('/dashboard')
      } else {
        const user = await signUp(email, password, { full_name: fullName })
        if (user) {
          try {
            await fetch('/api/create-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: user.id, full_name: fullName })
            })
          } catch (e) {
            console.error('Falha ao criar perfil:', e)
          }
        }
        console.log('Registro bem-sucedido, redirecionando para dashboard...')
        router.push('/dashboard')
      }
    } catch (error: unknown) {
      console.error('Erro na autenticação:', error)
      setError(error instanceof Error ? error.message : 'Erro ao autenticar')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
  }

  const handleModeChange = (newMode: 'login' | 'register') => {
    setFormMode(newMode)
    resetForm()
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-purple-900 tracking-tight">
        {formMode === 'login' ? 'Entrar' : 'Criar Conta'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        {formMode === 'register' && (
          <input
            type="text"
            placeholder="Nome completo"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-gray-900 placeholder-gray-500"
          />
        )}
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-gray-900 placeholder-gray-500"
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-gray-900 placeholder-gray-500"
        />
        {formMode === 'register' && (
          <input
            type="password"
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-gray-900 placeholder-gray-500"
          />
        )}
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-900 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-60"
        >
          {loading ? 'Carregando...' : formMode === 'login' ? 'Entrar' : 'Cadastrar'}
        </button>
      </form>
      <div className="mt-6 text-center text-sm text-gray-600">
        {formMode === 'login' ? (
          <div className="space-y-2">
            <span>
              Não tem conta?{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline font-medium"
                onClick={() => handleModeChange('register')}
              >
                Cadastre-se
              </button>
            </span>
            <div>
              <a href="/forgot-password" className="text-blue-600 hover:underline font-medium">Esqueci minha senha</a>
            </div>
          </div>
        ) : (
          <span>
            Já tem conta?{' '}
            <button
              type="button"
              className="text-blue-600 hover:underline font-medium"
              onClick={() => handleModeChange('login')}
            >
              Entrar
            </button>
          </span>
        )}
      </div>
    </div>
  )
}