'use client';

import React from 'react';
import { Building2, MapPin, Store, Warehouse } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function PublicAccountBanner() {
  const { t } = useLanguage();
  return (
    <div className="relative isolate z-[1000] bg-[#08152f] border-b border-[#D4AF37]/20 py-3 px-4 pointer-events-auto">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 text-sm sm:flex-row">
        <span className="text-[#A0AEC0]">{t('alreadyHaveAccount')}</span>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/business/login"
            className="flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 font-medium text-[#D4AF37] transition-all hover:bg-[#D4AF37]/20"
          >
            <Building2 size={14} /> {t('companySpace')}
          </a>
          <a
            href="/terrain/login"
            className="flex items-center gap-2 rounded-xl border border-[#63B3ED]/30 bg-[#63B3ED]/10 px-4 py-2 font-medium text-[#63B3ED] transition-all hover:bg-[#63B3ED]/20"
          >
            <MapPin size={14} /> {t('prospectorSpace')}
          </a>
          <a
            href="/agence/login"
            className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 font-medium text-emerald-300 transition-all hover:bg-emerald-400/20"
          >
            <Store size={14} /> {t('agencySpace')}
          </a>
          <a href="/entrepot/login" className="flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-2 font-medium text-violet-300 transition-all hover:bg-violet-400/20">
            <Warehouse size={14} /> {t('warehouse')}
          </a>
        </div>
      </div>
    </div>
  );
}
