'use client';

import { Gauge, Lock, Rocket, Smartphone, Wallet, Workflow } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { LandingKey } from '@/lib/i18n/landing';

const advantages = [
  {
    icon: Workflow,
    title: 'adv.a1.title' as LandingKey,
    text: 'adv.a1.text' as LandingKey,
  },
  {
    icon: Wallet,
    title: 'adv.a2.title' as LandingKey,
    text: 'adv.a2.text' as LandingKey,
  },
  {
    icon: Smartphone,
    title: 'adv.a3.title' as LandingKey,
    text: 'adv.a3.text' as LandingKey,
  },
  {
    icon: Gauge,
    title: 'adv.a4.title' as LandingKey,
    text: 'adv.a4.text' as LandingKey,
  },
  {
    icon: Lock,
    title: 'adv.a5.title' as LandingKey,
    text: 'adv.a5.text' as LandingKey,
  },
  {
    icon: Rocket,
    title: 'adv.a6.title' as LandingKey,
    text: 'adv.a6.text' as LandingKey,
  },
];

export default function AdvantagesSection() {
  const { t } = useLanguage();
  return (
    <section id="avantages" className="py-20">
      <div className="mx-auto max-w-screen-xl px-6 lg:px-10">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--brand-text)' }}
          >
            {t('adv.kicker')}
          </p>
          <h2 className="text-3xl font-extrabold text-foreground lg:text-4xl">{t('adv.title')}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {advantages.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
              <span
                className="flex h-10 w-10 flex-none items-center justify-center rounded-xl"
                style={{ background: 'var(--brand-gradient)', color: 'var(--on-brand)' }}
              >
                <Icon size={19} />
              </span>
              <div>
                <p className="font-semibold text-foreground">{t(title)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t(text)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
