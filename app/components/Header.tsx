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
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Link href="/" className="text-white font-bold text-lg">C</Link>
          </div>
          <Link href="/" className="text-white text-xl font-bold hover:text-purple-300 transition-colors cursor-pointer">CineNotes</Link>
        </div>
        
        <div className="hidden md:flex items-center space-x-6">
          {user ? (
            // Menu para usuários logados
            <>
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link href="/filmes" className="text-gray-300 hover:text-white transition-colors">
                Filmes
              </Link>
              <Link href="/avaliacoes" className="text-gray-300 hover:text-white transition-colors">
                Avaliações
              </Link>
              <div className="flex items-center space-x-4">
                <div className="text-white text-right">
                  <p className="text-sm text-purple-300">Bem-vindo,</p>
                  <p className="font-medium text-sm">{getFirstName(user)}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Sair
                </button>
              </div>
            </>
          ) : (
            // Menu para usuários não logados
            <>
              <Link href="/filmes" className="text-gray-300 hover:text-white transition-colors">
                Filmes
              </Link>
              <Link href="/avaliacoes" className="text-gray-300 hover:text-white transition-colors">
                Avaliações
              </Link>
              <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                Entrar
              </Link>
              <Link 
                href="/register" 
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
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