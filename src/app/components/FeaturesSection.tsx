'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { LandingKey } from '@/lib/i18n/landing';
import { CreditCard, MapPin, Package, AlertCircle, BarChart2, Shield } from 'lucide-react';

const features = [
  {
    id: 'feat-credit',
    icon: <CreditCard size={24} />,
    title: 'feat.f1.title' as LandingKey,
    description: 'feat.f1.desc' as LandingKey,
    highlight: 'feat.f1.tag' as LandingKey,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    id: 'feat-terrain',
    icon: <MapPin size={24} />,
    title: 'feat.f2.title' as LandingKey,
    description: 'feat.f2.desc' as LandingKey,
    highlight: 'feat.f2.tag' as LandingKey,
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  {
    id: 'feat-stock',
    icon: <Package size={24} />,
    title: 'feat.f3.title' as LandingKey,
    description: 'feat.f3.desc' as LandingKey,
    highlight: 'feat.f3.tag' as LandingKey,
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    id: 'feat-recouvrement',
    icon: <AlertCircle size={24} />,
    title: 'feat.f4.title' as LandingKey,
    description: 'feat.f4.desc' as LandingKey,
    highlight: 'feat.f4.tag' as LandingKey,
    color: 'text-danger',
    bgColor: 'bg-danger/10',
  },
  {
    id: 'feat-commissions',
    icon: <BarChart2 size={24} />,
    title: 'feat.f5.title' as LandingKey,
    description: 'feat.f5.desc' as LandingKey,
    highlight: 'feat.f5.tag' as LandingKey,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    id: 'feat-securite',
    icon: <Shield size={24} />,
    title: 'feat.f6.title' as LandingKey,
    description: 'feat.f6.desc' as LandingKey,
    highlight: 'feat.f6.tag' as LandingKey,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
];

export default function FeaturesSection() {
  const { t } = useLanguage();
  return (
    <section id="features" className="py-20">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-14">
          <p
            className="text-xs font-semibold uppercase tracking-widest text-primary mb-3"
            style={{ letterSpacing: '0.12em' }}
          >
            {t('feat.kicker')}
          </p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-4">
            {t('feat.title1')} <span className="gold-gradient-text">{t('feat.title2')}</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">{t('feat.intro')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features?.map((feat) => (
            <div
              key={feat?.id}
              className="card-navy rounded-2xl p-6 feature-card-hover cursor-default"
            >
              <div
                className={`w-12 h-12 rounded-2xl ${feat?.bgColor} ${feat?.color} flex items-center justify-center mb-4`}
              >
                {feat?.icon}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-base font-semibold text-foreground">{t(feat.title)}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {t(feat.description)}
              </p>
              <span
                className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${feat?.bgColor} ${feat?.color} border border-current/20`}
              >
                {t(feat.highlight)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
