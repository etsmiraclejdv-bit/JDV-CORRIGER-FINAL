'use client';

import Image from 'next/image';
import { Eye, Handshake, ShieldCheck, Smartphone } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { LandingKey } from '@/lib/i18n/landing';

const values = [
  {
    icon: Smartphone,
    title: 'brand.v1.title' as LandingKey,
    text: 'brand.v1.text' as LandingKey,
  },
  {
    icon: Eye,
    title: 'brand.v2.title' as LandingKey,
    text: 'brand.v2.text' as LandingKey,
  },
  {
    icon: Handshake,
    title: 'brand.v3.title' as LandingKey,
    text: 'brand.v3.text' as LandingKey,
  },
  {
    icon: ShieldCheck,
    title: 'brand.v4.title' as LandingKey,
    text: 'brand.v4.text' as LandingKey,
  },
];

export default function BrandSection() {
  const { t } = useLanguage();
  return (
    <section id="marque" className="py-20">
      <div className="mx-auto grid max-w-screen-xl items-center gap-12 px-6 lg:grid-cols-2 lg:px-10">
        <div>
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--brand-text)' }}
          >
            {t('brand.kicker')}
          </p>
          <h2 className="text-3xl font-extrabold text-foreground lg:text-4xl">
            {t('brand.title')}
          </h2>
          <p className="mt-4 text-muted-foreground">{t('brand.intro')}</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {values.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-4">
                <Icon size={20} style={{ color: 'var(--brand-text)' }} />
                <p className="mt-2 font-semibold text-foreground">{t(title)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t(text)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <div className="overflow-hidden rounded-[2rem] border border-border bg-card p-3 shadow-card">
            <Image
              src="/assets/images/image_a5395bef-1789678648033.jpg"
              alt={t('brand.logoAlt')}
              width={420}
              height={420}
              sizes="(min-width: 1024px) 420px, 80vw"
              className="h-auto w-full max-w-[420px] rounded-3xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
