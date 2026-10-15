'use client';

import Image from 'next/image';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { LandingKey } from '@/lib/i18n/landing';
import {
  Building2,
  Warehouse,
  Package,
  UsersRound,
  MapPin,
  UserCheck,
  CreditCard,
  HandCoins,
  LineChart,
} from 'lucide-react';

// Les noms de fichiers contiennent des espaces et des accents : encodeURI garantit une adresse valide.
const IMG = {
  presentation: encodeURI('/assets/images/Présentation CRM JDV en entreprise.png'),
  terrain: encodeURI('/assets/images/CRM mobile pour commerciaux terrain.png'),
  equipe: encodeURI('/assets/images/JDV CRM _ Votre succès, notre priorité.png'),
};

type Step = { letter: string; icon: typeof Building2; title: LandingKey; text: LandingKey };
type Chapter = {
  tag: LandingKey;
  title: LandingKey;
  intro: LandingKey;
  image: string;
  alt: LandingKey;
  steps: Step[];
};

const chapters: Chapter[] = [
  {
    tag: 'journey.c1.tag',
    title: 'journey.c1.title',
    intro: 'journey.c1.intro',
    image: IMG.presentation,
    alt: 'journey.c1.alt',
    steps: [
      {
        letter: 'A',
        icon: Building2,
        title: 'journey.sA.title',
        text: 'journey.sA.text',
      },
      {
        letter: 'B',
        icon: Warehouse,
        title: 'journey.sB.title',
        text: 'journey.sB.text',
      },
      {
        letter: 'C',
        icon: Package,
        title: 'journey.sC.title',
        text: 'journey.sC.text',
      },
    ],
  },
  {
    tag: 'journey.c2.tag',
    title: 'journey.c2.title',
    intro: 'journey.c2.intro',
    image: IMG.terrain,
    alt: 'journey.c2.alt',
    steps: [
      {
        letter: 'D',
        icon: UsersRound,
        title: 'journey.sD.title',
        text: 'journey.sD.text',
      },
      {
        letter: 'E',
        icon: MapPin,
        title: 'journey.sE.title',
        text: 'journey.sE.text',
      },
      {
        letter: 'F',
        icon: UserCheck,
        title: 'journey.sF.title',
        text: 'journey.sF.text',
      },
    ],
  },
  {
    tag: 'journey.c3.tag',
    title: 'journey.c3.title',
    intro: 'journey.c3.intro',
    image: IMG.equipe,
    alt: 'journey.c3.alt',
    steps: [
      {
        letter: 'G',
        icon: CreditCard,
        title: 'journey.sG.title',
        text: 'journey.sG.text',
      },
      {
        letter: 'H',
        icon: HandCoins,
        title: 'journey.sH.title',
        text: 'journey.sH.text',
      },
      {
        letter: 'Z',
        icon: LineChart,
        title: 'journey.sZ.title',
        text: 'journey.sZ.text',
      },
    ],
  },
];

export default function JourneySection() {
  const { t } = useLanguage();
  return (
    <section id="parcours" className="py-20">
      <div className="mx-auto max-w-screen-xl px-6 lg:px-10">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--brand-text)' }}
          >
            {t('journey.kicker')}
          </p>
          <h2 className="text-3xl font-extrabold text-foreground lg:text-4xl">
            {t('journey.title')}
          </h2>
          <p className="mt-4 text-muted-foreground">{t('journey.intro')}</p>
        </div>

        <div className="space-y-16">
          {chapters.map((c, i) => (
            <article key={t(c.tag)} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
              <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">
                  <Image
                    src={c.image}
                    alt={t(c.alt)}
                    width={1698}
                    height={926}
                    sizes="(min-width: 1024px) 560px, 100vw"
                    className="h-auto w-full"
                  />
                </div>
              </div>
              <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--brand-text)' }}
                >
                  {c.tag}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-foreground">{t(c.title)}</h3>
                <p className="mt-2 text-muted-foreground">{t(c.intro)}</p>
                <ol className="mt-6 space-y-4">
                  {c.steps.map((s) => {
                    const Icon = s.icon;
                    return (
                      <li
                        key={s.letter}
                        className="flex gap-4 rounded-2xl border border-border bg-card p-4"
                      >
                        <span
                          className="flex h-11 w-11 flex-none items-center justify-center rounded-xl font-extrabold"
                          style={{ background: 'var(--brand-gradient)', color: 'var(--on-brand)' }}
                        >
                          {s.letter}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-semibold text-foreground">
                            <Icon size={16} style={{ color: 'var(--brand-text)' }} />
                            {t(s.title)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">{t(s.text)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
