import Link from "next/link";

export default function Header() {
  return (
    <header className="container mx-auto px-4 py-6">
      <nav className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="text-white text-xl font-bold">CineNotes</span>
        </div>
        <div className="hidden md:flex items-center space-x-6">
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
            href="/cadastro" 
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Cadastrar
          </Link>
        </div>
      </nav>
    </header>
  );
} 