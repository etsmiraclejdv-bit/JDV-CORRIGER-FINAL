/* eslint-disable prettier/prettier */
'use client';

import { Palette, Moon, Sun, Contrast, Type, Sparkles } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function TerrainPersonalisationPage() {
  const { t } = useLanguage();
  function openSettings() {
    window.dispatchEvent(new Event('jdv:open-theme-customizer'));
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-5 text-white lg:p-8">
      <header>
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[#D4AF37]">
          <Palette size={16} /> {t('tp.kicker')}
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl">{t('tp.title')}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{t('tp.intro')}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: t('tp.light'), text: t('tp.lightText'), icon: Sun },
          { title: t('tp.dark'), text: t('tp.darkText'), icon: Moon },
          { title: t('tp.contrast'), text: t('tp.contrastText'), icon: Contrast },
          { title: t('tp.legibility'), text: t('tp.legibilityText'), icon: Type },
        ].map(({ title, text, icon: Icon }) => (
          <article key={title} className="rounded-2xl border border-white/10 bg-[#0F2347] p-5">
            <Icon className="mb-4 text-[#D4AF37]" size={24} />
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-2 text-xs leading-5 text-slate-300">{text}</p>
          </article>
        ))}
      </div>

      <section className="rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/5 p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Sparkles size={18} className="text-[#D4AF37]" /> {t('tp.appearance')}
            </h2>
            <p className="mt-2 text-sm text-slate-300">{t('tp.panel')}</p>
          </div>
          <button
            type="button"
            onClick={openSettings}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#0B1B3D]"
          >
            <Palette size={16} /> {t('tp.open')}
          </button>
        </div>
      </section>
    </main>
  );
}
