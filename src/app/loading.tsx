'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Banknote, Building2, CreditCard, MapPin, Users } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

const steps: { icon: typeof Building2; label: TerrainKey; text: TerrainKey }[] = [
  { icon: Building2, label: 'ld.s1', text: 'ld.s1t' },
  { icon: MapPin, label: 'ld.s2', text: 'ld.s2t' },
  { icon: Users, label: 'ld.s3', text: 'ld.s3t' },
  { icon: CreditCard, label: 'ld.s4', text: 'ld.s4t' },
  { icon: Banknote, label: 'ld.s5', text: 'ld.s5t' },
];

// Les noms de fichiers contiennent des espaces, des accents et une virgule : encodeURI garantit une adresse valide.
// Les noms ci-dessous doivent correspondre EXACTEMENT aux fichiers de public/assets/images/.
const slides: { image: string; title: TerrainKey; alt: TerrainKey }[] = [
  {
    image: encodeURI('/assets/images/CRM mobile pour commerciaux terrain.png'),
    title: 'ld.t1',
    alt: 'ld.a1',
  },
  {
    image: encodeURI('/assets/images/Présentation CRM JDV en entreprise.png'),
    title: 'ld.t2',
    alt: 'ld.a2',
  },
  {
    image: encodeURI('/assets/images/JDV CRM _ Votre succès, notre priorité.png'),
    title: 'ld.t3',
    alt: 'ld.a3',
  },
];

export default function Loading() {
  const { t } = useLanguage();
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(
      () => setSlide((current) => (current + 1) % slides.length),
      10000
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="jdv-loading jdv-loading--extended" aria-label={t('ld.aria')}>
      <div className="jdv-loading__glow jdv-loading__glow--one" />
      <div className="jdv-loading__glow jdv-loading__glow--two" />
      <div className="jdv-loading__grid" />
      <section className="jdv-loading__content">
        <div className="jdv-loading__brand">
          <div className="jdv-loading__logo-wrap">
            <div className="jdv-loading__orbit jdv-loading__orbit--outer" />
            <div className="jdv-loading__orbit jdv-loading__orbit--inner" />
            <div className="jdv-loading__logo-card">
              <img src="/assets/images/app_logo.png" alt="JDV CRM" className="jdv-loading__logo" />
            </div>
          </div>
          <div className="jdv-loading__name">
            JDV <span>CRM</span>
          </div>
          <p>{t('ld.tag1')}</p>
        </div>

        <div className="jdv-loading__headline">
          <span>{t('ld.h1')}</span>
          <strong>{t('ld.h2')}</strong>
          <span>{t('ld.h3')}</span>
        </div>

        <div className="jdv-loading__flow" aria-hidden="true">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                className="jdv-loading__flow-item"
                key={step.label}
                style={{ animationDelay: index * 180 + 'ms' }}
              >
                <div className="jdv-loading__flow-card">
                  <Icon size={22} strokeWidth={1.8} />
                  <div>
                    <b>{t(step.label)}</b>
                    <small>{t(step.text)}</small>
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight className="jdv-loading__arrow" size={17} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="jdv-loading__visual" aria-live="polite">
          <div className="jdv-loading__hero">
            {slides.map((item, index) => (
              <img
                key={item.image}
                src={item.image}
                alt={t(item.alt)}
                className={`jdv-loading__hero-image ${index === slide ? 'is-active' : ''}`}
              />
            ))}
            <div className="jdv-loading__hero-overlay" />
            <div className="jdv-loading__hero-caption">
              <span>JDV CRM • {slide + 1}/3</span>
              <strong>{t(slides[slide].title)}</strong>
            </div>
          </div>
        </div>

        <div className="jdv-loading__timeline" aria-hidden="true">
          {slides.map((item, index) => (
            <i key={item.image} className={index === slide ? 'is-active' : ''} />
          ))}
        </div>

        <div className="jdv-loading__progress">
          <div className="jdv-loading__progress-track">
            <span />
          </div>
          <div className="jdv-loading__status">
            <span>{t('ld.prep')}</span>
            <span>{t('ld.30')}</span>
          </div>
        </div>
        <div className="mx-auto mt-4 max-w-3xl rounded-2xl border border-white/10 bg-[#08152f]/80 px-4 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#D4AF37]">
            {t('ld.need')}
          </p>
          <p className="mt-1 text-xs text-slate-300">{t('ld.contact')}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[11px] text-white">
            <a href="tel:+2290166038221">+229 01 66 03 82 21</a>
            <a href="tel:+2290195325987">+229 01 95 32 59 87</a>
            <a href="tel:+2290151565878">+229 01 51 56 58 78</a>
            <a href="tel:+2290140164627">+229 01 40 16 46 27</a>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-x-3 text-[11px] text-slate-300">
            <a href="mailto:centre.global.jdv@gmail.com">centre.global.jdv@gmail.com</a>
            <span>{t('ld.city')}</span>
          </div>
        </div>
      </section>
      <p className="jdv-loading__footer">{t('ld.foot')}</p>
    </main>
  );
}
