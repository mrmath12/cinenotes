import Footer from '../components/Footer'
import Header from '../components/Header'
import ResetPasswordForm from './reset-form'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col justify-between">
      <Header />
      <div className="flex flex-1 items-center justify-center">
        <ResetPasswordForm />
      </div>
      <Footer />
    </div>
  )
}
