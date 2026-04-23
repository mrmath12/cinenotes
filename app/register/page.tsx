import type { Metadata } from 'next'
import AuthForm from '../components/AuthForm'
import Footer from '../components/Footer'

export const metadata: Metadata = {
  title: 'Criar Conta',
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col justify-between">
      <div className="flex flex-1 items-center justify-center">
        <AuthForm mode="register" />
      </div>
      <Footer />
    </div>
  )
}