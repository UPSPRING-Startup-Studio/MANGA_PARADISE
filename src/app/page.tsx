import { getAuthContext } from "@/features/auth/server";
import { MotionProvider } from "@/components/motion-provider";
import { LandingNav } from "@/components/landing/landing-nav";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { AudienceSection } from "@/components/landing/audience-section";
import { GamificationSection } from "@/components/landing/gamification-section";
import { RoadmapSection } from "@/components/landing/roadmap-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";

export default async function HomePage() {
  const { user } = await getAuthContext();

  return (
    <MotionProvider>
      <LandingNav isAuthed={Boolean(user)} />
      <main>
        <HeroSection />
        <FeaturesSection />
        <AudienceSection />
        <GamificationSection />
        <RoadmapSection />
        <FinalCtaSection />
      </main>
      <LandingFooter />
    </MotionProvider>
  );
}
