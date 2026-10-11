'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Contrast, Moon, Monitor, Palette, RotateCcw, Sun, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export type ThemeChoice = 'light' | 'dark' | 'contrast' | 'system';
export type Accent = 'gold' | 'blue' | 'green' | 'violet' | 'orange';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type Prefs = { theme: ThemeChoice; accent: Accent; font: FontSize; reduceMotion: boolean };

export const DEFAULT_PREFS: Prefs = { theme: 'light', accent: 'gold', font: 'md', reduceMotion: false };
export const THEME_STORAGE_KEY = 'jdv_theme_v1';

const THEMES: { id: ThemeChoice; label: string; hint: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Clair', hint: 'Fond blanc, lecture classique', icon: Sun },
  { id: 'dark', label: 'Nuit', hint: 'Fond bleu nuit, repose les yeux', icon: Moon },
  { id: 'contrast', label: 'Contraste élevé', hint: 'Noir sur blanc, bordures marquées', icon: Contrast },
  { id: 'system', label: 'Automatique', hint: 'Suit votre appareil', icon: Monitor },
];
const ACCENTS: { id: Accent; label: string; color: string }[] = [
  { id: 'gold', label: 'Or JDV', color: '#D4AF37' },
  { id: 'blue', label: 'Bleu', color: '#2563EB' },
  { id: 'green', label: 'Vert', color: '#059669' },
  { id: 'violet', label: 'Violet', color: '#7C3AED' },
  { id: 'orange', label: 'Orange', color: '#EA580C' },
];
const FONTS: { id: FontSize; label: string; sample: string }[] = [
  { id: 'sm', label: 'Petit', sample: 'text-xs' },
  { id: 'md', label: 'Normal', sample: 'text-sm' },
  { id: 'lg', label: 'Grand', sample: 'text-base' },
  { id: 'xl', label: 'Très grand', sample: 'text-lg' },
];

function clean(raw: unknown): Prefs | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<Prefs>;
  return {
    theme: THEMES.some((t) => t.id === r.theme) ? (r.theme as ThemeChoice) : DEFAULT_PREFS.theme,
    accent: ACCENTS.some((a) => a.id === r.accent) ? (r.accent as Accent) : DEFAULT_PREFS.accent,
    font: FONTS.some((f) => f.id === r.font) ? (r.font as FontSize) : DEFAULT_PREFS.font,
    reduceMotion: r.reduceMotion === true,
  };
}

function resolveTheme(theme: ThemeChoice): 'light' | 'dark' | 'contrast' {
  if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return theme;
}

function apply(p: Prefs) {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(p.theme);
  root.dataset.accent = p.accent;
  root.dataset.font = p.font;
  root.dataset.motion = p.reduceMotion ? 'reduce' : 'normal';
}

export default function ThemeCustomizer() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const loaded = useRef(false);
  const fromRemote = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chargement : préférences de l'appareil, puis celles du compte si l'utilisateur est connecté
  useEffect(() => {
    try {
      const local = clean(JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) || 'null'));
      if (local) setPrefs(local);
    } catch { /* stockage indisponible : valeurs par défaut */ }
    loaded.current = true;

    const loadRemote = (meta: unknown) => {
      const remote = clean((meta as { theme_prefs?: unknown } | null)?.theme_prefs);
      if (remote) { fromRemote.current = true; setPrefs(remote); }
    };
    supabase.auth.getSession().then(({ data }) => loadRemote(data.session?.user?.user_metadata ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') loadRemote(session?.user?.user_metadata ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Application + sauvegarde
  useEffect(() => {
    if (!loaded.current) return;
    apply(prefs);
    try { window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(prefs)); } catch { /* ignoré */ }
    if (fromRemote.current) { fromRemote.current = false; return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) await supabase.auth.updateUser({ data: { theme_prefs: prefs } });
    }, 900);
  }, [prefs]);

  // Mode automatique : suivre l'appareil
  useEffect(() => {
    if (prefs.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply(prefs);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [prefs]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const set = useCallback(<K extends keyof Prefs>(key: K, value: Prefs[K]) => setPrefs((p) => ({ ...p, [key]: value })), []);

  const section = 'text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2';
  const chip = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-sm transition-colors ${active ? 'border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] font-semibold' : 'border-border hover:bg-muted'}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Personnaliser l’apparence"
        aria-expanded={open}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-card transition-transform hover:scale-105 print:hidden"
      >
        <Palette size={20} style={{ color: 'var(--brand-text)' }} />
      </button>

      {open && (
        <div role="dialog" aria-label="Personnalisation de l’apparence" className="fixed bottom-20 right-4 z-50 w-[min(92vw,22rem)] rounded-2xl border border-border bg-card p-5 text-foreground shadow-card-hover print:hidden">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold">Mon apparence</h2>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-lg p-1 hover:bg-muted"><X size={18} /></button>
          </div>

          <p className={section}>Thème</p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {THEMES.map(({ id, label, hint, icon: Icon }) => (
              <button key={id} type="button" onClick={() => set('theme', id)} title={hint} aria-pressed={prefs.theme === id} className={`${chip(prefs.theme === id)} flex items-center gap-2 text-left`}>
                <Icon size={16} /> <span className="leading-tight">{label}</span>
              </button>
            ))}
          </div>

          <p className={section}>Couleur principale</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {ACCENTS.map(({ id, label, color }) => (
              <button key={id} type="button" onClick={() => set('accent', id)} aria-label={label} aria-pressed={prefs.accent === id} title={label}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${prefs.accent === id ? 'border-foreground' : 'border-transparent'}`} style={{ backgroundColor: color }}>
                {prefs.accent === id && <Check size={16} color="#fff" />}
              </button>
            ))}
          </div>

          <p className={section}>Taille du texte</p>
          <div className="mb-4 grid grid-cols-4 gap-2">
            {FONTS.map(({ id, label, sample }) => (
              <button key={id} type="button" onClick={() => set('font', id)} aria-pressed={prefs.font === id} className={`${chip(prefs.font === id)} px-1 text-center`}>
                <span className={`block font-semibold ${sample}`}>Aa</span>
                <span className="block text-[10px] text-muted-foreground">{label}</span>
              </button>
            ))}
          </div>

          <label className="mb-4 flex cursor-pointer items-center justify-between gap-3 text-sm">
            <span>Réduire les animations</span>
            <input type="checkbox" checked={prefs.reduceMotion} onChange={(e) => set('reduceMotion', e.target.checked)} className="h-4 w-4" />
          </label>

          <button type="button" onClick={() => setPrefs(DEFAULT_PREFS)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted">
            <RotateCcw size={14} /> Réinitialiser
          </button>
          <p className="mt-3 text-[11px] leading-snug text-muted-foreground">Vos choix sont enregistrés sur cet appareil, et sur votre compte quand vous êtes connecté.</p>
        </div>
      )}
    </>
  );
}
