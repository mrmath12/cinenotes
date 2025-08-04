export default function StatsSection() {
  return (
    <section className="mt-20 text-center">
      <div className="grid md:grid-cols-4 gap-8">
        <div>
          <div className="text-3xl font-bold text-white mb-2">1000+</div>
          <div className="text-gray-400">Filmes Avaliados</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-white mb-2">500+</div>
          <div className="text-gray-400">Usuários Ativos</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-white mb-2">5000+</div>
          <div className="text-gray-400">Avaliações</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-white mb-2">4.8</div>
          <div className="text-gray-400">Avaliação da Plataforma</div>
        </div>
      </div>
    </section>
  );
} 