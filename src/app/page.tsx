import React from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import PricingSection from './components/PricingSection';
import RegistrationSection from './components/RegistrationSection';
import PublicFooter from './components/PublicFooter';
import Link from 'next/link';
import { Building2, MapPin } from 'lucide-react';

export default function PublicSitePage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      {/* Portal Access Banner */}
      <div className="bg-[#08152f] border-b border-[#D4AF37]/20 py-3 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
          <span className="text-[#A0AEC0]">Vous avez déjà un compte ?</span>
          <div className="flex items-center gap-3">
            <Link
              href="/business/login"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all font-medium"
            >
              <Building2 size={14} />
              Espace Entreprise
            </Link>
            <Link
              href="/terrain/login"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#63B3ED]/10 border border-[#63B3ED]/30 text-[#63B3ED] hover:bg-[#63B3ED]/20 transition-all font-medium"
            >
              <MapPin size={14} />
              Espace Prospecteur
            </Link>
          </div>
        </div>
      </div>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <RegistrationSection />
      <PublicFooter />
    </div>
  );
}