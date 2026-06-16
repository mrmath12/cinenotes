import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/filmes/',
        '/ator/',
        '/diretor/',
        '/dashboard',
        '/perfil',
        '/minhas-avaliacoes',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
      ],
    },
  }
}
