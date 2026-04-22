import { redirect } from 'next/navigation'
import { createClient } from '../../lib/supabase-server'
import Footer from '../components/Footer'
import NovaAvaliacaoForm from './NovaAvaliacaoForm'

export default async function NovaAvaliacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ tmdb_id?: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) redirect('/register')

  const { tmdb_id } = await searchParams

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-6">Nova Avaliação</h1>
        <NovaAvaliacaoForm preselectedTmdbId={tmdb_id} />
      </main>
      <Footer />
    </div>
  )
}
