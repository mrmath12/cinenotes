import HeroSection from "./components/HeroSection";
import UpcomingSection from "./components/UpcomingSection";
import StatsSection from "./components/StatsSection";
import ReviewsSection from "./components/ReviewsSection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-bg-mid to-bg-dark flex flex-col">
      <main className="flex-1">
        <HeroSection />
        <div className="container mx-auto px-4 max-w-7xl pb-20">
          <UpcomingSection />
          <ReviewsSection />
          <StatsSection />
        </div>
      </main>
      <Footer />
    </div>
  )
}
