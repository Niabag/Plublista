import { HeroSection } from '../components/landing/HeroSection';
import { SocialProofSection } from '../components/landing/SocialProofSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { UseCasesSection } from '../components/landing/UseCasesSection';
import { PricingPreviewSection } from '../components/landing/PricingPreviewSection';

export function LandingPage() {
  return (
    <>
      <HeroSection />
      <SocialProofSection />
      <FeaturesSection />
      <UseCasesSection />
      <PricingPreviewSection />
    </>
  );
}
