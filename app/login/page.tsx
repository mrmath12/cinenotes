import AuthForm from '../components/AuthForm'
import Footer from '../components/Footer'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col justify-between">
      <div className="flex flex-1 items-center justify-center">
        <AuthForm mode="login" />
      </div>
      <Footer />
    </div>
  )
}