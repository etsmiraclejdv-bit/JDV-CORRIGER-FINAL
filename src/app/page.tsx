import React from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicExperience from './components/PublicExperience';
import BrandSection from './components/BrandSection';
import ServicesSection from './components/ServicesSection';
import FeaturesSection from './components/FeaturesSection';
import JourneySection from './components/JourneySection';
import AdvantagesSection from './components/AdvantagesSection';
import PricingSection from './components/PricingSection';
import RegistrationSection from './components/RegistrationSection';
import ContactSection from './components/ContactSection';
import PublicFooter from './components/PublicFooter';
import PublicAIAssistant from '@/components/PublicAIAssistant';
import PublicNewsPanel from './components/PublicNewsPanel';
import PlatformUpdateBanner from './components/PlatformUpdateBanner';
import PublicAccountBanner from './components/PublicAccountBanner';

export default function PublicSitePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicAccountBanner />
      <PublicNavbar />
      <PublicExperience />
      <PublicNewsPanel />
      <PlatformUpdateBanner />
      <BrandSection />
      <ServicesSection />
      <FeaturesSection />
      <JourneySection />
      <AdvantagesSection />
      <PricingSection />
      <RegistrationSection />
      <ContactSection />
      <PublicFooter />
      <PublicAIAssistant />
    </div>
  );
}
