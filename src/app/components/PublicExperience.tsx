'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { LandingKey } from '@/lib/i18n/landing';

const terrainPoints: LandingKey[][] = [
  ['terrain.p1.title', 'terrain.p1.text'],
  ['terrain.p2.title', 'terrain.p2.text'],
  ['terrain.p3.title', 'terrain.p3.text'],
  ['terrain.p4.title', 'terrain.p4.text'],
];

const adminPoints: LandingKey[][] = [
  ['admin.p1.title', 'admin.p1.text'],
  ['admin.p2.title', 'admin.p2.text'],
  ['admin.p3.title', 'admin.p3.text'],
  ['admin.p4.title', 'admin.p4.text'],
];

export default function PublicExperience() {
  const { t } = useLanguage();
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const seen = window.sessionStorage.getItem('jdv_crm_intro_seen');
    if (seen === '1') {
      setIntro(false);
      return;
    }
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem('jdv_crm_intro_seen', '1');
      setIntro(false);
    }, 5200);
    return () => window.clearTimeout(timer);
  }, []);

  if (intro) {
    return (
      <div className="fixed inset-0 z-[100] overflow-hidden bg-[#050d22] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(212,175,55,.18),transparent_32%),radial-gradient(circle_at_15%_80%,rgba(99,179,237,.10),transparent_28%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(212,175,55,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,.15)_1px,transparent_1px)] [background-size:52px_52px] animate-[jdvGrid_14s_linear_infinite]" />
        <div className="relative z-10 flex min-h-full items-center justify-center px-5 py-10">
          <div className="w-full max-w-5xl text-center">
            <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-3xl border border-[#D4AF37]/50 bg-[#0B1B3D]/90 p-3 shadow-[0_0_70px_rgba(212,175,55,.25)] animate-[jdvPulse_2.4s_ease-in-out_infinite]">
              <img
                src="/assets/images/app_logo.png"
                alt="JDV CRM"
                className="h-full w-full rounded-2xl object-contain"
              />
            </div>
            <p className="text-xs font-bold uppercase tracking-[.35em] text-[#D4AF37] animate-fade-in">
              JDV CRM
            </p>
            <h1 className="mt-4 text-3xl font-extrabold sm:text-5xl lg:text-6xl animate-slide-up">
              {t('hero.i.title1')} <span className="gold-gradient-text">{t('hero.i.title2')}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base animate-slide-up">
              {t('hero.i.text')}
            </p>

            <div className="mx-auto mt-9 grid max-w-3xl gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#63B3ED]/25 bg-[#0F2347]/70 p-5 text-left backdrop-blur-xl animate-[jdvStep_.7s_.25s_both]">
                <div className="mb-3 flex items-center gap-3">
                  <MapPin className="text-[#63B3ED]" />
                  <span className="font-bold">{t('hero.i.terrainTitle')}</span>
                </div>
                <p className="text-xs leading-6 text-slate-300">{t('hero.i.terrainText')}</p>
              </div>
              <div className="rounded-2xl border border-[#D4AF37]/25 bg-[#0F2347]/70 p-5 text-left backdrop-blur-xl animate-[jdvStep_.7s_.45s_both]">
                <div className="mb-3 flex items-center gap-3">
                  <Building2 className="text-[#D4AF37]" />
                  <span className="font-bold">{t('hero.i.adminTitle')}</span>
                </div>
                <p className="text-xs leading-6 text-slate-300">{t('hero.i.adminText')}</p>
              </div>
            </div>

            <div className="mx-auto mt-8 h-1 max-w-md overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/2 animate-[jdvProgress_1.7s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
            </div>
            <button
              type="button"
              onClick={() => {
                window.sessionStorage.setItem('jdv_crm_intro_seen', '1');
                setIntro(false);
              }}
              className="mt-5 text-xs font-semibold text-slate-400 transition hover:text-white"
            >
              {t('hero.skip')} <ArrowRight size={13} className="ml-1 inline" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 hero-glow" />

      <div className="relative mx-auto max-w-screen-xl px-6 pb-20 pt-20 lg:px-10 lg:pt-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div className="animate-slide-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full badge-gold px-3 py-1.5 text-xs font-semibold">
              <ShieldCheck size={13} /> {t('hero.badge')}
            </div>
            <h2 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              {t('hero.title1')} <span className="gold-gradient-text">{t('hero.title2')}</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              {t('hero.text')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#terrain"
                className="btn-gold inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm"
              >
                {t('hero.ctaTerrain')} <ArrowRight size={16} />
              </a>
              <a
                href="#entreprise"
                className="btn-outline-gold inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm"
              >
                {t('hero.ctaAdmin')} <Building2 size={16} />
              </a>
            </div>
          </div>

          <div className="relative animate-scale-in">
            <div className="overflow-hidden rounded-3xl border border-[#D4AF37]/20 bg-[#0F2347] shadow-card-hover">
              <img
                src="/assets/images/image_a5395bef-1789673870442.jpg"
                alt={t('hero.imgAlt')}
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-[#63B3ED]/20 bg-[#0B1B3D]/95 px-4 py-3 shadow-xl sm:block">
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-[#63B3ED]" />
                <div>
                  <p className="text-[10px] text-slate-400">{t('hero.chip1a')}</p>
                  <p className="text-sm font-bold text-white">{t('hero.chip1b')}</p>
                </div>
              </div>
            </div>
            <div className="absolute -right-4 -top-5 hidden rounded-2xl border border-[#D4AF37]/20 bg-[#0B1B3D]/95 px-4 py-3 shadow-xl sm:block">
              <div className="flex items-center gap-3">
                <BarChart3 size={18} className="text-[#D4AF37]" />
                <div>
                  <p className="text-[10px] text-slate-400">{t('hero.chip2a')}</p>
                  <p className="text-sm font-bold text-white">{t('hero.chip2b')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="terrain" className="relative border-y border-[#D4AF37]/10 bg-[#08152f]/65">
        <div className="mx-auto max-w-screen-xl px-6 py-20 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-[.85fr_1.15fr]">
            <div className="relative">
              <div className="absolute -inset-5 rounded-[2rem] bg-[#63B3ED]/5 blur-2xl" />
              <div className="relative rounded-[2rem] border border-[#63B3ED]/20 bg-[#0A1628] p-7 shadow-card">
                <div className="mb-7 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#63B3ED]/10 p-3">
                      <Smartphone className="text-[#63B3ED]" size={24} />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400">
                        {t('terrain.space')}
                      </p>
                      <h3 className="font-bold text-white">{t('terrain.activity')}</h3>
                    </div>
                  </div>
                  <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-[10px] text-green-300">
                    {t('terrain.online')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['24', 'terrain.stat1'],
                    ['8', 'terrain.stat2'],
                    ['5', 'terrain.stat3'],
                    ['320 000 F', 'terrain.stat4'],
                  ].map(([v, l], i) => (
                    <div
                      key={l}
                      className="rounded-2xl border border-white/5 bg-white/[.03] p-4 animate-[jdvStep_.7s_both]"
                      style={{ animationDelay: i * 120 + 'ms' }}
                    >
                      <p className="text-xl font-extrabold text-white">{v}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{t(l as LandingKey)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-[#D4AF37]/10 bg-[#D4AF37]/5 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#D4AF37]">
                    <Package size={15} /> {t('terrain.stockTitle')}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{t('terrain.stockText')}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#63B3ED]">
                {t('terrain.kicker')}
              </p>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                {t('terrain.title1')} <span className="text-[#63B3ED]">{t('terrain.title2')}</span>
              </h2>
              <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
                {t('terrain.intro')}
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {terrainPoints.map(([title, text]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/5 bg-white/[.025] p-4 transition hover:-translate-y-1 hover:border-[#63B3ED]/30"
                  >
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                      <CheckCircle2 size={15} className="text-[#63B3ED]" />
                      {t(title)}
                    </div>
                    <p className="text-xs leading-5 text-slate-400">{t(text)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-4 text-xs text-slate-400">
                <span className="inline-flex items-center gap-2">
                  <Phone size={14} /> {t('terrain.calls')}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users size={14} /> {t('terrain.clients')}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Wallet size={14} /> {t('terrain.payments')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="entreprise" className="relative">
        <div className="mx-auto max-w-screen-xl px-6 py-20 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
            <div className="lg:order-2">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-[#D4AF37]">
                {t('admin.kicker')}
              </p>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                {t('admin.title1')} <span className="gold-gradient-text">{t('admin.title2')}</span>
              </h2>
              <p className="mt-5 text-sm leading-7 text-muted-foreground sm:text-base">
                {t('admin.intro')}
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {adminPoints.map(([title, text]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-[#D4AF37]/10 bg-[#0F2347]/70 p-4 transition hover:-translate-y-1 hover:border-[#D4AF37]/35"
                  >
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                      <CheckCircle2 size={15} className="text-[#D4AF37]" />
                      {t(title)}
                    </div>
                    <p className="text-xs leading-5 text-slate-400">{t(text)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:order-1">
              <div className="rounded-[2rem] border border-[#D4AF37]/20 bg-gradient-to-br from-[#0F2347] to-[#08152f] p-6 shadow-card-hover">
                <div className="mb-5 flex items-center gap-3">
                  <Building2 className="text-[#D4AF37]" size={27} />
                  <div>
                    <p className="text-xs text-slate-400">{t('admin.dash')}</p>
                    <p className="font-bold text-white">{t('admin.company')}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    [BarChart3, 'admin.d1.title', 'admin.d1.text'],
                    [Package, 'admin.d2.title', 'admin.d2.text'],
                    [Users, 'admin.d3.title', 'admin.d3.text'],
                    [CreditCard, 'admin.d4.title', 'admin.d4.text'],
                  ].map(([Icon, title, text], i) => {
                    const I = Icon as typeof BarChart3;
                    return (
                      <div
                        key={title as string}
                        className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[.03] p-4 animate-[jdvStep_.7s_both]"
                        style={{ animationDelay: i * 120 + 'ms' }}
                      >
                        <div className="rounded-xl bg-[#D4AF37]/10 p-2.5">
                          <I size={18} className="text-[#D4AF37]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {t(title as LandingKey)}
                          </p>
                          <p className="text-[10px] text-slate-400">{t(text as LandingKey)}</p>
                        </div>
                        <ArrowRight size={15} className="ml-auto text-slate-600" />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-xl px-6 pb-16 lg:px-10">
        <div className="rounded-3xl border border-[#D4AF37]/15 bg-[#0F2347]/70 p-7 text-center shadow-card sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#D4AF37]">
            {t('why.kicker')}
          </p>
          <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">{t('why.title')}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
            {t('why.text')}
          </p>
        </div>
      </div>
    </section>
  );
}
