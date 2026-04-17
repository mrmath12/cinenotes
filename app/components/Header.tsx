'use client'

import Link from "next/link";
import { useAuth } from "../../lib/auth-context";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const getFirstName = (user: User) => {
    if ((user.user_metadata as Record<string, unknown>)?.['full_name']) {
      const full = String((user.user_metadata as Record<string, unknown>)['full_name'])
      return full.split(' ')[0];
    }
    if (user.email) {
      return user.email.split('@')[0];
    }
    return 'Usuário';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <header className="container mx-auto px-4 py-6">
      <nav className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
            <Link href="/" className="text-white font-bold text-lg">C</Link>
          </div>
          <Link href="/" className="text-white text-xl font-bold hover:text-primary-300 transition-colors cursor-pointer">CineNotes</Link>
        </div>

        <div className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <Link href="/dashboard" className="text-muted-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/filmes" className="text-muted-300 hover:text-white transition-colors">
                Filmes
              </Link>
              <Link href="/avaliacoes" className="text-muted-300 hover:text-white transition-colors">
                Avaliações
              </Link>
              <div className="flex items-center space-x-4">
                <div className="text-white text-right">
                  <p className="text-sm text-primary-300">Bem-vindo,</p>
                  <p className="font-medium text-sm">{getFirstName(user)}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="bg-danger hover:bg-danger-hover text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sair
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/filmes" className="text-muted-300 hover:text-white transition-colors">
                Filmes
              </Link>
              <Link href="/avaliacoes" className="text-muted-300 hover:text-white transition-colors">
                Avaliações
              </Link>
              <Link href="/login" className="text-muted-300 hover:text-white transition-colors">
                Entrar
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-4 py-2 rounded-lg hover:from-primary-600 hover:to-accent-600 transition-all"
              >
                Cadastrar
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
