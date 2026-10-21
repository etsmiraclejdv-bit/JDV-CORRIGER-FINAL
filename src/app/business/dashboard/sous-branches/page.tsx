'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

// Netlify sync checkpoint
export default function SousBranchesPage() {
  const { t } = useLanguage();
  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('bz.sbTitle')}</h1>
        <p className="mt-2 text-slate-400">{t('bz.sbSub')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/entrepot/login"
          className="rounded-2xl border border-[#D4AF37]/30 bg-[#08152f] p-5 hover:bg-[#0F2347]"
        >
          <h2 className="font-semibold text-[#D4AF37]">{t('bz.sbWh')}</h2>
          <p className="mt-2 text-sm text-slate-400">{t('bz.sbWhSub')}</p>
        </Link>

        <Link
          href="/business/dashboard/suivi-prospecteurs"
          className="rounded-2xl border border-white/10 bg-[#08152f] p-5 hover:bg-[#0F2347]"
        >
          <h2 className="font-semibold">{t('bz.sbPros')}</h2>
          <p className="mt-2 text-sm text-slate-400">{t('bz.sbProsSub')}</p>
        </Link>

        <Link
          href="/business/dashboard/mouvements-stock"
          className="rounded-2xl border border-white/10 bg-[#08152f] p-5 hover:bg-[#0F2347]"
        >
          <h2 className="font-semibold">{t('bz.sbMov')}</h2>
          <p className="mt-2 text-sm text-slate-400">{t('bz.sbMovSub')}</p>
        </Link>

        <Link
          href="/business/dashboard/sous-entrepots"
          className="rounded-2xl border border-[#D4AF37]/30 bg-[#08152f] p-5 hover:bg-[#0F2347]"
        >
          <h2 className="font-semibold text-[#D4AF37]">{t('bz.sbSub2')}</h2>
          <p className="mt-2 text-sm text-slate-400">{t('bz.sbSub2Sub')}</p>
        </Link>
      </div>
    </div>
  );
}
