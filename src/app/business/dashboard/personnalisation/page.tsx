'use client';

import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function OrganizationDesignPage() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-8">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-card">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {t('bz.mdKicker')}
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">{t('bz.mdTitle')}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('bz.mdP1')}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('bz.mdP2')}</p>
      </section>
    </div>
  );
}
