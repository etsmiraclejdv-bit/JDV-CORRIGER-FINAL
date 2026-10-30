'use client';

import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { SITE } from '@/lib/siteConfig';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n/messages';

export default function PublicFooter() {
  const { t } = useLanguage();
  const productLinks: Array<{ key: TranslationKey; href: string }> = [
    { key: 'services', href: '/#services' },
    { key: 'features', href: '/#features' },
    { key: 'advantages', href: '/#avantages' },
    { key: 'pricing', href: '/#pricing' },
    { key: 'freeTrial', href: '/#register' },
  ];
  const supportLinks: Array<{ key: TranslationKey; href: string }> = [
    { key: 'contact', href: '/#contact' },
    { key: 'userGuide', href: '/guide-onboarding' },
    { key: 'companySpace', href: '/business/login' },
    { key: 'prospectorSpace', href: '/terrain/login' },
    { key: 'agencySpace', href: '/agence/login' },
  ];
  return (
    <footer id="about" className="border-t border-border py-12 mt-8">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <AppLogo size={28} />
              <span className="font-bold text-lg tracking-tight">JDV <span className="gold-gradient-text">CRM</span></span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{SITE.tagline}.</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4" style={{ letterSpacing: '0.08em' }}>{t('product')}</p>
            <ul className="space-y-2">{productLinks.map((item) => <li key={`footer-product-${item.key}`}><Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t(item.key)}</Link></li>)}</ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4" style={{ letterSpacing: '0.08em' }}>{t('support')}</p>
            <ul className="space-y-2">{supportLinks.map((item) => <li key={`footer-support-${item.key}`}><Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{t(item.key)}</Link></li>)}</ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">{t('rights')}</p>
          <div className="flex gap-6">
            <Link href="/legal#confidentialite" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t('privacy')}</Link>
            <Link href="/legal#conditions" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t('terms')}</Link>
            <Link href="/legal#mentions" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t('legalNotice')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
