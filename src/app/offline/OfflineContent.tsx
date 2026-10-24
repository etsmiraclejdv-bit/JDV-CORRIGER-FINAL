'use client';

import Link from 'next/link';
import OfflineRetryButton from '@/components/OfflineRetryButton';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function OfflineContent() {
  const { t } = useLanguage();
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08152f] px-5 py-12 text-white">
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[.04] p-7 shadow-2xl sm:p-10">
        <div className="mb-5 inline-flex rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-sm text-amber-200">
          {t('pg.offBadge')}
        </div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t('pg.offTitle')}</h1>
        <p className="mt-4 leading-7 text-slate-300">{t('pg.offText')}</p>
        <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
          <li>{t('pg.offL1')}</li>
          <li>{t('pg.offL2')}</li>
          <li>{t('pg.offL3')}</li>
        </ul>
        <div className="mt-7 flex flex-wrap gap-3">
          <OfflineRetryButton />
          <Link
            href="/"
            className="rounded-xl border border-white/20 px-5 py-3 font-semibold text-white"
          >
            {t('pg.offHome')}
          </Link>
        </div>
      </section>
    </main>
  );
}
