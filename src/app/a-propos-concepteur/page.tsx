'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Lightbulb, Target } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function AboutConcepteurPage() {
  const { t } = useLanguage();
  return (
    <main className="min-h-screen bg-[#07142d] text-white">
      <section className="relative overflow-hidden border-b border-[#D4AF37]/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.16),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_34%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-24">
          <Link
            href="/"
            className="mb-12 inline-flex items-center gap-2 text-sm text-slate-300 transition hover:text-[#D4AF37]"
          >
            <ArrowLeft size={16} />
            {t('pg.abBack')}
          </Link>

          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="flex justify-center lg:justify-start">
              <div className="relative h-72 w-64 overflow-hidden rounded-[2rem] border border-[#D4AF37]/50 bg-[#0b1b3d] shadow-2xl shadow-black/40 sm:h-80 sm:w-72">
                <div className="absolute inset-0 bg-gradient-to-t from-[#07142d]/80 via-transparent to-transparent z-10" />
                <div className="absolute inset-3 rounded-[1.5rem] border border-[#D4AF37]/30 z-20 pointer-events-none" />
                <img
                  src="/assets/images/Portrait de PDG dans un bureau moderne.png"
                  alt={t('pg.abAlt')}
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute bottom-5 left-5 right-5 z-30">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
                    JDV CRM
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">{t('pg.abRole')}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
                {t('pg.abKick')}
              </p>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Romaric A. B. ADEDEDJI
              </h1>
              <p className="mt-5 text-xl font-semibold text-slate-200 sm:text-2xl">
                {t('pg.abRoleLong')}
              </p>
              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                {t('pg.abIntro')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10">
        <div className="grid gap-8 md:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <Target className="mb-5 text-[#D4AF37]" size={30} />
            <h2 className="text-2xl font-bold">{t('pg.abH1')}</h2>
            <p className="mt-4 leading-8 text-slate-300">{t('pg.abP1')}</p>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <BriefcaseBusiness className="mb-5 text-[#D4AF37]" size={30} />
            <h2 className="text-2xl font-bold">{t('pg.abH2')}</h2>
            <p className="mt-4 leading-8 text-slate-300">{t('pg.abP2')}</p>
            <p className="mt-4 leading-8 text-slate-300">{t('pg.abP3')}</p>
          </article>
        </div>

        <div className="mt-8 rounded-3xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#D4AF37]/10 to-transparent p-8 sm:p-10">
          <Lightbulb className="mb-5 text-[#D4AF37]" size={32} />
          <h2 className="text-2xl font-bold sm:text-3xl">{t('pg.abH3')}</h2>
          <p className="mt-6 text-2xl font-black leading-relaxed text-[#D4AF37] sm:text-3xl">
            {t('pg.abM1')}
            <br />
            {t('pg.abM2')}
            <br />
            {t('pg.abM3')}
          </p>
          <p className="mt-6 max-w-4xl leading-8 text-slate-300">{t('pg.abP4')}</p>
        </div>
      </section>

      <section className="border-y border-[#D4AF37]/20 bg-[#0b1b3d]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#D4AF37]">
            {t('pg.abNext')}
          </p>
          <h2 className="mt-4 text-4xl font-black sm:text-5xl">JDV GLOBAL CENTER</h2>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">{t('pg.abG1')}</p>
          <p className="mt-4 max-w-4xl leading-8 text-slate-300">
            {t('pg.abG2a')} <strong className="text-white">{t('pg.abG2b')}</strong>. {t('pg.abG2c')}
          </p>
          <div className="mt-10 inline-flex rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-6 py-4 font-semibold text-[#D4AF37]">
            {t('pg.abSoon')}
          </div>
          <p className="mt-5 text-slate-300">{t('pg.abGen')}</p>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:px-8 lg:px-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-bold">Romaric A. B. ADEDEDJI</p>
          <p className="mt-1 text-sm text-slate-400">{t('pg.abFoot')}</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-semibold text-[#D4AF37] hover:underline"
        >
          {t('pg.abDisc')}
          <ArrowRight size={16} />
        </Link>
      </footer>
    </main>
  );
}
