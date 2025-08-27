import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import StatsSection from "./components/StatsSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-20">
          <HeroSection />
          <FeaturesSection />
          <StatsSection />
        </div>
      </main>

      <Footer />
    </div>
  )
}
