import Footer from '../../components/Footer'
import ResetPasswordForm from './reset-form'

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col justify-between">
      <div className="flex flex-1 items-center justify-center">
        <ResetPasswordForm />
      </div>
      <Footer />
    </div>
  )
}
