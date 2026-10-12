/* eslint-disable prettier/prettier */
'use client';

import { Palette, Moon, Sun, Contrast, Type, Sparkles } from 'lucide-react';

export default function TerrainPersonalisationPage() {
  function openSettings() {
    window.dispatchEvent(new Event('jdv:open-theme-customizer'));
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-5 text-white lg:p-8">
      <header>
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[#D4AF37]">
          <Palette size={16} /> Préférences personnelles
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl">Personnaliser mon écran</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Choisissez un thème, une couleur, une taille de texte et réduisez les animations si vous le souhaitez.
          Vos préférences sont enregistrées sur cet appareil et, lorsque vous êtes connecté, sur votre compte.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Thème clair', text: 'Lecture sur fond clair', icon: Sun },
          { title: 'Thème nuit', text: 'Interface sombre', icon: Moon },
          { title: 'Contraste élevé', text: 'Bordures et contraste renforcés', icon: Contrast },
          { title: 'Lisibilité', text: 'Taille de texte ajustable', icon: Type },
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
            <h2 className="flex items-center gap-2 text-lg font-bold"><Sparkles size={18} className="text-[#D4AF37]" /> Réglages de l’apparence</h2>
            <p className="mt-2 text-sm text-slate-300">Le panneau flottant est disponible dans toute l’application.</p>
          </div>
          <button type="button" onClick={openSettings} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#0B1B3D]">
            <Palette size={16} /> Ouvrir les réglages
          </button>
        </div>
      </section>
    </main>
  );
}
