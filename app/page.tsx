import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import StatsSection from "./components/StatsSection";
import ReviewsSection from "./components/ReviewsSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-20 max-w-7xl">
          <HeroSection />
          <FeaturesSection />
          <StatsSection />
          <ReviewsSection />
        </div>
      </main>

      <Footer />
    </div>
  )
}
