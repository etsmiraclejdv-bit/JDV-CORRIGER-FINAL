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
import Link from 'next/link';
import { Building2, MapPin, Warehouse } from 'lucide-react';

export default function PublicSitePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <div className="bg-[#08152f] border-b border-[#D4AF37]/20 py-3 px-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 text-sm sm:flex-row">
          <span className="text-[#A0AEC0]">Vous avez déjà un compte ?</span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/business/login"
              className="flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 font-medium text-[#D4AF37] transition-all hover:bg-[#D4AF37]/20"
            >
              <Building2 size={14} /> Espace Entreprise
            </Link>
            <Link
              href="/terrain/login"
              className="flex items-center gap-2 rounded-xl border border-[#63B3ED]/30 bg-[#63B3ED]/10 px-4 py-2 font-medium text-[#63B3ED] transition-all hover:bg-[#63B3ED]/20"
            >
              <MapPin size={14} /> Espace Prospecteur
            </Link>
            <Link
              href="/entrepot/login"
              className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 font-medium text-emerald-300 transition-all hover:bg-emerald-400/20"
            >
              <Warehouse size={14} /> Espace Agence
            </Link>
          </div>
        </div>
      </div>
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
