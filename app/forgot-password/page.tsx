import Footer from '../components/Footer'
import Header from '../components/Header'
import ForgotPasswordForm from '@/app/forgot-password/request-form'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col justify-between">
      <Header />
      <div className="flex flex-1 items-center justify-center">
        <ForgotPasswordForm />
      </div>
      <Footer />
    </div>
  )
}
