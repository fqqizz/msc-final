import Navigation from '@/components/navigation'
import HeroSection from '@/components/hero-section'
import FeaturedVenues from '@/components/featured-venues'
import WhyChooseUs from '@/components/why-choose-us'
import HowItWorks from '@/components/how-it-works'
import Footer from '@/components/footer'

export default function Home() {
  return (
    <main className="relative min-h-screen">
      {/* Navigation - Dark variant for hero */}
      <Navigation variant="dark" />

      {/* Cinematic Hero with 3D Football Experience */}
      <HeroSection />

      {/* Featured Venues */}
      <FeaturedVenues />

      {/* How It Works */}
      <HowItWorks />

      {/* Why Choose Us */}
      <WhyChooseUs />

      {/* Footer with Final CTA */}
      <Footer />
    </main>
  )
}
