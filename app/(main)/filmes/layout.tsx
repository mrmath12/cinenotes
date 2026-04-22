import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explorar Filmes — CineNotes',
  description: 'Descubra filmes avaliados pela comunidade com critérios profissionais.',
}

export default function FilmesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
