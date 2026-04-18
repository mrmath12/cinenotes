"use client"

import { useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { useSupabase } from '../../lib/supabase-provider'
import { useRouter } from 'next/navigation'
import { getRandomAvatarColor } from '../../lib/avatar-colors'

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/

interface AuthFormProps {
  mode?: 'login' | 'register'
}

function mapAuthError(message: string): string {
  if (message.includes('User already registered') || message.includes('already registered')) {
    return 'Este e-mail já está em uso.'
  }
  if (message.includes('Email not confirmed') || message.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de fazer login.'
  }
  if (message.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  return message
}

export default function AuthForm({ mode = 'login' }: AuthFormProps) {
  const { signIn, signUp } = useAuth()
  const supabase = useSupabase()
  const router = useRouter()

  const [formMode, setFormMode] = useState<'login' | 'register'>(mode)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null)

  // --- inline username validation (while typing) ---
  const validateUsernameFormat = (value: string): string | null => {
    if (value.length === 0) return null
    if (value.length < 3) return 'Username deve ter pelo menos 3 caracteres'
    if (value.length > 20) return 'Username deve ter no máximo 20 caracteres'
    if (!USERNAME_REGEX.test(value)) return 'Apenas letras, números e _ são permitidos'
    return null
  }

  const handleUsernameChange = (value: string) => {
    setUsername(value)
    setUsernameError(validateUsernameFormat(value))
  }

  // --- uniqueness check on blur ---
  const checkUsernameAvailable = async (value: string) => {
    const formatError = validateUsernameFormat(value)
    if (formatError || !supabase || value.length < 3) return
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', value.toLowerCase())
      .maybeSingle()
    if (data) setUsernameError('Este nome de usuário já está em uso.')
  }

  const resetForm = () => {
    setFullName('')
    setUsername('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setUsernameError(null)
  }

  const handleModeChange = (newMode: 'login' | 'register') => {
    setFormMode(newMode)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formMode === 'register') {
      if (!fullName.trim()) {
        setError('Nome completo é obrigatório.')
        return
      }
      const formatError = validateUsernameFormat(username)
      if (formatError) {
        setUsernameError(formatError)
        return
      }
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.')
        return
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.')
        return
      }
    }

    setLoading(true)

    try {
      if (formMode === 'login') {
        await signIn(email, password)
        router.push('/dashboard')
      } else {
        const avatarColor = getRandomAvatarColor()
        const normalizedUsername = username.toLowerCase()

        const user = await signUp(email, password, { full_name: fullName })

        if (user) {
          const res = await fetch('/api/create-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: user.id,
              full_name: fullName,
              username: normalizedUsername,
              avatar_color: avatarColor,
            }),
          })
          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            if (body?.error?.includes('username') || body?.error?.includes('Username')) {
              setError('Este nome de usuário já está em uso.')
              setLoading(false)
              return
            }
          }
        }

        // Show email confirmation screen instead of redirecting
        setRegisteredEmail(email)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao autenticar'
      setError(mapAuthError(message))
    } finally {
      setLoading(false)
    }
  }

  // --- Email confirmation screen ---
  if (registeredEmail) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-muted-200 text-center space-y-4">
        <h2 className="text-2xl font-extrabold text-primary-900">Verifique seu e-mail</h2>
        <p className="text-muted-700 text-sm leading-relaxed">
          Enviamos um link de confirmação para{' '}
          <span className="font-semibold text-primary-900">{registeredEmail}</span>.
          Clique no link para ativar sua conta.
        </p>
        <button
          type="button"
          className="text-link hover:underline font-medium text-sm"
          onClick={() => {
            setRegisteredEmail(null)
            handleModeChange('login')
          }}
        >
          Voltar para login
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg border border-muted-200">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-primary-900 tracking-tight">
        {formMode === 'login' ? 'Entrar' : 'Criar Conta'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Register-only fields */}
        {formMode === 'register' && (
          <>
            {/* 1. Nome completo */}
            <input
              type="text"
              placeholder="Nome completo"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-muted-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-focus transition text-muted-800 placeholder-muted-400"
            />

            {/* 2. Username */}
            <div>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => handleUsernameChange(e.target.value)}
                onBlur={e => checkUsernameAvailable(e.target.value)}
                required
                maxLength={20}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-focus transition text-muted-800 placeholder-muted-400 ${
                  usernameError ? 'border-danger' : 'border-muted-300'
                }`}
              />
              {usernameError && (
                <p className="mt-1 text-xs text-danger">{usernameError}</p>
              )}
            </div>
          </>
        )}

        {/* 3. E-mail */}
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 border border-muted-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-focus transition text-muted-800 placeholder-muted-400"
        />

        {/* 4. Senha */}
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 border border-muted-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-focus transition text-muted-800 placeholder-muted-400"
        />

        {/* 5. Confirmar senha (register only) */}
        {formMode === 'register' && (
          <input
            type="password"
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-muted-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-focus transition text-muted-800 placeholder-muted-400"
          />
        )}

        {error && <div className="text-danger text-sm text-center">{error}</div>}

        <button
          type="submit"
          disabled={loading || (formMode === 'register' && !!usernameError)}
          className="w-full bg-primary-900 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-60"
        >
          {loading ? 'Carregando...' : formMode === 'login' ? 'Entrar' : 'Cadastrar'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-muted-600">
        {formMode === 'login' ? (
          <div className="space-y-2">
            <span>
              Não tem conta?{' '}
              <button
                type="button"
                className="text-link hover:underline font-medium"
                onClick={() => handleModeChange('register')}
              >
                Cadastre-se
              </button>
            </span>
            <div>
              <a href="/forgot-password" className="text-link hover:underline font-medium">
                Esqueci minha senha
              </a>
            </div>
          </div>
        ) : (
          <span>
            Já tem conta?{' '}
            <button
              type="button"
              className="text-link hover:underline font-medium"
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
