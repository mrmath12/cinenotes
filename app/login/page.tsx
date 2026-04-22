import AuthForm from '../components/AuthForm'
import Footer from '../components/Footer'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const { redirectTo } = await searchParams

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col justify-between">
      <div className="flex flex-1 items-center justify-center">
        <AuthForm mode="login" redirectTo={redirectTo} />
      </div>
      <Footer />
    </div>
  )
}