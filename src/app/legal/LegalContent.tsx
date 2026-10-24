'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function LegalContent() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> {t('lg.back')}
        </Link>

        <section id="conditions" className="space-y-3 scroll-mt-24">
          <h1 className="text-2xl font-bold text-foreground">{t('lg.termsH')}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{t('lg.terms')}</p>
        </section>

        <section id="confidentialite" className="space-y-3 scroll-mt-24">
          <h2 className="text-xl font-bold text-foreground">{t('lg.privH')}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t('lg.priv')}</p>
        </section>

        <section id="mentions" className="space-y-3 scroll-mt-24">
          <h2 className="text-xl font-bold text-foreground">{t('lg.legalH')}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{t('lg.legal')}</p>
        </section>
      </div>
    </main>
  );
}
