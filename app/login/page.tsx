import AuthForm from '../components/AuthForm'
import Footer from '../components/Footer'
import Header from '../components/Header'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col justify-between">
      <Header />

      <div className="flex flex-1 items-center justify-center">
        <AuthForm mode="login" />
      </div>
      <Footer />
    </div>
  )
}