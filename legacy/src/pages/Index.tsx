import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import IdentitySection from "@/components/home/IdentitySection";
import EventSection from "@/components/home/EventSection";
import GamificationSection from "@/components/home/GamificationSection";
import PricingSection from "@/components/home/PricingSection";
import ProOffersSection from "@/components/home/ProOffersSection";
import TimelineSection from "@/components/home/TimelineSection";
import CTASection from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <IdentitySection />
        <EventSection />
        <GamificationSection />
        <PricingSection />
        <ProOffersSection />
        <TimelineSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;