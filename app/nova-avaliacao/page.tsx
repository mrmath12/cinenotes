import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase-server'
import Header from '../components/Header'
import Footer from '../components/Footer'
import NovaAvaliacaoForm from './NovaAvaliacaoForm'

export default async function NovaAvaliacaoPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) redirect('/register')

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-6">Nova Avaliação</h1>
        <NovaAvaliacaoForm />
      </main>
      <Footer />
    </div>
  )
}
