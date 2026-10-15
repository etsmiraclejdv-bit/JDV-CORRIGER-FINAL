'use client';

import React from 'react';
import { Check, Zap } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { LandingKey } from '@/lib/i18n/landing';

const plans = [
  {
    id: 'plan-mensuel',
    name: 'pricing.monthly' as LandingKey,
    price: '50',
    currency: 'USD',
    duration: '30',
    popular: false,
    features: [
      'pricing.m1' as LandingKey,
      'pricing.m2' as LandingKey,
      'pricing.m3' as LandingKey,
      'pricing.m4' as LandingKey,
      'pricing.m5' as LandingKey,
    ],
  },
  {
    id: 'plan-trimestriel',
    name: 'pricing.quarterly' as LandingKey,
    price: '150',
    currency: 'USD',
    duration: '90',
    popular: false,
    features: [
      'pricing.q1' as LandingKey,
      'pricing.q2' as LandingKey,
      'pricing.q3' as LandingKey,
      'pricing.q4' as LandingKey,
      'pricing.q5' as LandingKey,
      'pricing.q6' as LandingKey,
    ],
  },
  {
    id: 'plan-semestriel',
    name: 'pricing.semiannual' as LandingKey,
    price: '300',
    currency: 'USD',
    duration: '180',
    popular: true,
    features: [
      'pricing.s1' as LandingKey,
      'pricing.s2' as LandingKey,
      'pricing.s3' as LandingKey,
      'pricing.s4' as LandingKey,
      'pricing.s5' as LandingKey,
      'pricing.s6' as LandingKey,
      'pricing.s7' as LandingKey,
    ],
  },
  {
    id: 'plan-annuel',
    name: 'pricing.annual' as LandingKey,
    price: '600',
    currency: 'USD',
    duration: '365',
    popular: false,
    features: [
      'pricing.y1' as LandingKey,
      'pricing.y2' as LandingKey,
      'pricing.y3' as LandingKey,
      'pricing.y4' as LandingKey,
      'pricing.y5' as LandingKey,
      'pricing.y6' as LandingKey,
      'pricing.y7' as LandingKey,
    ],
  },
];

export default function PricingSection() {
  const { t } = useLanguage();
  return (
    <section id="pricing" className="py-20">
      <div className="max-w-screen-xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-14">
          <p
            className="text-xs font-semibold uppercase tracking-widest text-primary mb-3"
            style={{ letterSpacing: '0.12em' }}
          >
            {t('pricing.kicker')}
          </p>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground mb-4">
            {t('pricing.titleBefore')}
            <span className="gold-gradient-text">{t('pricing.titleHighlight')}</span>
            {t('pricing.titleAfter')}
          </h2>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">{t('pricing.intro')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans?.map((plan) => (
            <div
              key={plan?.id}
              className={`rounded-2xl p-6 flex flex-col transition-all duration-250 ${
                plan?.popular ? 'pricing-card-popular relative' : 'card-navy feature-card-hover'
              }`}
            >
              {plan?.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="btn-gold text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                    <Zap size={11} />
                    {t('pricing.popular')}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-semibold text-muted-foreground mb-2">{t(plan.name)}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground stat-number">
                    {plan?.price}
                  </span>
                  <span className="text-lg font-bold text-primary">$</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {plan?.duration} {t('pricing.days')} · {t('pricing.renewable')}
                </p>
              </div>

              <ul className="flex-1 space-y-3 mb-6">
                {plan?.features?.map((feature, fi) => (
                  <li
                    key={`${plan?.id}-feat-${fi}`}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check size={14} className="text-success mt-0.5 flex-shrink-0" />
                    {t(feature)}
                  </li>
                ))}
              </ul>

              <a
                href="#register"
                className={`w-full py-3 rounded-xl text-sm font-bold text-center transition-all duration-150 ${
                  plan?.popular ? 'btn-gold' : 'btn-outline-gold'
                }`}
              >
                {plan?.popular ? t('pricing.choose') : t('pricing.start')}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">{t('pricing.note')}</p>
      </div>
    </section>
  );
}
