import Link from "next/link";
import LuckyModal from "./LuckyModal";

export default function HeroSection() {
  return (
    <section className="text-center max-w-4xl mx-auto">
      <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
        Sua opinião merece mais do que
        <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent"> uma nota</span>
      </h1>
      <p className="text-xl md:text-2xl text-muted-300 mb-8 leading-relaxed">
        Avalie cada aspecto — do roteiro à trilha sonora — e veja o que a comunidade está achando.
      </p>
      <div className="flex flex-col gap-4 justify-center w-max place-self-center">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/filmes"
            className="border-2 border-white/20 text-white/80 px-8 py-4 rounded-lg text-lg font-semibold hover:border-white/40 hover:text-white transition-all hover:scale-105"
          >
            Explorar Filmes
          </Link>
          <Link
            href="/register"
            className="border-2 border-primary-500 text-primary-400 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-500 hover:text-white transition-all hover:scale-105"
          >
            Começar Agora
          </Link>
        </div>
        <LuckyModal />
      </div>
    </section>
  );
}
