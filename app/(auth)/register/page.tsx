import AuthForm from '../../components/AuthForm'
import Footer from '../../components/Footer'
import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col justify-between">
      <div className="px-6 py-4">
        <Link href="/">
          <img src="/logo/full/cinenotes-logotipo-full-branco.svg" alt="CineNotes" className="h-7 w-auto" />
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <AuthForm mode="register" />
      </div>
      <Footer />
    </div>
  )
}