'use client';

import { BarChart3, Boxes, CreditCard, HandCoins, MapPin, Users } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { LandingKey } from '@/lib/i18n/landing';

const services = [
  {
    icon: Users,
    title: 'services.s1.title' as LandingKey,
    text: 'services.s1.text' as LandingKey,
  },
  {
    icon: CreditCard,
    title: 'services.s2.title' as LandingKey,
    text: 'services.s2.text' as LandingKey,
  },
  {
    icon: MapPin,
    title: 'services.s3.title' as LandingKey,
    text: 'services.s3.text' as LandingKey,
  },
  {
    icon: Boxes,
    title: 'services.s4.title' as LandingKey,
    text: 'services.s4.text' as LandingKey,
  },
  {
    icon: HandCoins,
    title: 'services.s5.title' as LandingKey,
    text: 'services.s5.text' as LandingKey,
  },
  {
    icon: BarChart3,
    title: 'services.s6.title' as LandingKey,
    text: 'services.s6.text' as LandingKey,
  },
];

export default function ServicesSection() {
  const { t } = useLanguage();
  return (
    <section id="services" className="py-20">
      <div className="mx-auto max-w-screen-xl px-6 lg:px-10">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--brand-text)' }}
          >
            {t('services.kicker')}
          </p>
          <h2 className="text-3xl font-extrabold text-foreground lg:text-4xl">
            {t('services.title')}
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: 'color-mix(in srgb, var(--brand) 14%, transparent)' }}
              >
                <Icon size={22} style={{ color: 'var(--brand-text)' }} />
              </span>
              <h3 className="mt-4 text-lg font-bold text-foreground">{t(title)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(text)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
