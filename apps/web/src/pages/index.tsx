import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { UseCasesSection } from '@/components/landing/UseCasesSection';
import { TechnicalFeaturesSection } from '@/components/landing/TechnicalFeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { ScreenshotsSection } from '@/components/landing/ScreenshotsSection';
import { GetStartedSection } from '@/components/landing/GetStartedSection';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <HeroSection />
      <FeaturesSection />
      <UseCasesSection />
      <TechnicalFeaturesSection />
      <HowItWorksSection />
      <ScreenshotsSection />
      <GetStartedSection />
    </div>
  );
}
