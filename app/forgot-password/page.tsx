import type { Metadata } from 'next'
import Footer from '../components/Footer'
import ForgotPasswordForm from '@/app/forgot-password/request-form'

export const metadata: Metadata = {
  title: 'Esqueci a Senha',
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col justify-between">
      <div className="flex flex-1 items-center justify-center">
        <ForgotPasswordForm />
      </div>
      <Footer />
    </div>
  )
}
