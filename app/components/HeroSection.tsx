import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="text-center max-w-4xl mx-auto">
      <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
        Avalie Filmes com
        <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Precisão</span>
      </h1>
      <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
        Compartilhe suas opiniões sobre filmes usando critérios profissionais. 
        Descubra novos filmes através das avaliações da comunidade.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link 
          href="/filmes" 
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
        >
          Explorar Filmes
        </Link>
        <Link 
          href="/cadastro" 
          className="border-2 border-purple-500 text-purple-400 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-500 hover:text-white transition-all"
        >
          Começar Agora
        </Link>
      </div>
    </section>
  );
} 