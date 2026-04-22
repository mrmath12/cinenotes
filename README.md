# CineNotes

Plataforma para avaliação de filmes em 5 critérios independentes: roteiro, direção, fotografia, trilha sonora e impacto geral.

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
TMDB_API_KEY=<sua-chave-tmdb>
```

| Variável | Escopo | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente + Servidor | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente + Servidor | Chave anon pública do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor apenas | Chave service role (usada para inserir em `movies`) |
| `TMDB_API_KEY` | Servidor apenas | Chave da API do TMDB (não exposta ao cliente) |

## Banco de dados

Execute as migrations SQL no painel do Supabase em **SQL Editor**:
- Acesse [supabase.com/dashboard](https://supabase.com/dashboard) → seu projeto → SQL Editor
- Execute os arquivos de migration localizados em `../supabase/migrations/`

## Rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no browser.

## Deploy na Vercel

1. Faça push do projeto para um repositório GitHub
2. Importe o repositório na [Vercel](https://vercel.com/new)
3. Configure as 4 variáveis de ambiente no painel da Vercel (Settings → Environment Variables)
4. Deploy automático a cada push na branch `main`

## Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + TypeScript + Tailwind CSS 4
- **Banco**: Supabase (PostgreSQL + Auth + RLS)
- **API externa**: TMDB v3
- **Deploy**: Vercel
