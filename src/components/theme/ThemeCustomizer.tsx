'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Contrast, Moon, Monitor, Palette, RotateCcw, Sun, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { fetchOrgProfile } from '@/lib/auth/context';
import type { DesignConfig, DesignElementStyle } from '@/features/design-studio/types';

export type ThemeChoice = 'light' | 'dark' | 'contrast' | 'system';
export type Accent = 'gold' | 'blue' | 'green' | 'violet' | 'orange';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';
export type Prefs = {
  theme: ThemeChoice;
  accent: Accent;
  font: FontSize;
  reduceMotion: boolean;
  themeOverride?: boolean;
};

export const DEFAULT_PREFS: Prefs = {
  theme: 'light',
  accent: 'gold',
  font: 'md',
  reduceMotion: false,
  themeOverride: false,
};
export const THEME_STORAGE_KEY = 'jdv_theme_v1';

const THEMES: { id: ThemeChoice; label: string; hint: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Clair', hint: 'Fond blanc, lecture classique', icon: Sun },
  { id: 'dark', label: 'Nuit', hint: 'Fond bleu nuit, repose les yeux', icon: Moon },
  {
    id: 'contrast',
    label: 'Contraste élevé',
    hint: 'Noir sur blanc, bordures marquées',
    icon: Contrast,
  },
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
    themeOverride: r.themeOverride === true,
  };
}

function resolveTheme(theme: ThemeChoice): 'light' | 'dark' | 'contrast' {
  if (theme === 'system')
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  return theme;
}

function applyElementStyles(design: Partial<DesignConfig> | null) {
  const styles = design?.elementStyles ?? {};
  const properties: Record<keyof DesignElementStyle, string> = {
    color: 'color',
    backgroundColor: 'background-color',
    fontFamily: 'font-family',
    fontSize: 'font-size',
    fontWeight: 'font-weight',
    borderColor: 'border-color',
    borderWidth: 'border-width',
    borderStyle: 'border-style',
    borderRadius: 'border-radius',
    shadow: 'box-shadow',
    padding: 'padding',
  };
  document.querySelectorAll<HTMLElement>('[data-jdv-design]').forEach((element) => {
    const id = element.dataset.jdvDesign;
    if (!id) return;
    const selected = styles[id];
    for (const property of Object.keys(properties) as (keyof DesignElementStyle)[]) {
      const cssProperty = properties[property];
      const value = selected?.[property];
      if (value === undefined || value === null || value === '') {
        element.style.removeProperty(cssProperty);
      } else {
        const cssValue =
          typeof value === 'number' &&
          ['fontSize', 'borderWidth', 'borderRadius', 'padding'].includes(property)
            ? String(value) + 'px'
            : String(value);
        element.style.setProperty(cssProperty, cssValue);
      }
    }
  });
}

function apply(p: Prefs, design: Partial<DesignConfig> | null = null) {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(!p.themeOverride && design?.mode ? design.mode : p.theme);
  root.dataset.accent = p.accent;
  root.dataset.font = p.font;
  root.dataset.motion = p.reduceMotion ? 'reduce' : 'normal';
  const brandProperties = ['--brand', '--brand-2', '--brand-3', '--brand-ink', '--brand-ink-dark'];
  if (design?.primaryColor && p.accent === 'gold') {
    for (const property of brandProperties) root.style.setProperty(property, design.primaryColor);
  } else {
    for (const property of brandProperties) root.style.removeProperty(property);
  }
  if (design?.secondaryColor) root.style.setProperty('--secondary', design.secondaryColor);
  else root.style.removeProperty('--secondary');
  if (design?.accentColor) root.style.setProperty('--accent', design.accentColor);
  else root.style.removeProperty('--accent');
  if (design?.density) root.dataset.designDensity = design.density;
  if (design?.radius) root.dataset.designRadius = design.radius;
  if (design?.fontScale) root.dataset.designFontScale = design.fontScale;
  else delete root.dataset.designFontScale;
  applyElementStyles(design);
}

export default function ThemeCustomizer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openCustomizer = () => setOpen(true);
    window.addEventListener('jdv:open-theme-customizer', openCustomizer);
    return () => window.removeEventListener('jdv:open-theme-customizer', openCustomizer);
  }, []);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [designConfig, setDesignConfig] = useState<Partial<DesignConfig> | null>(null);
  const loaded = useRef(false);
  const fromRemote = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chargement : préférences de l'appareil, puis celles du compte si l'utilisateur est connecté
  useEffect(() => {
    try {
      const local = clean(JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) || 'null'));
      if (local) setPrefs(local);
    } catch {
      /* stockage indisponible : valeurs par défaut */
    }
    loaded.current = true;

    const loadRemote = async (user: { id: string; user_metadata?: unknown } | null) => {
      if (!user) return;
      const { data: row } = await supabase
        .from('user_settings')
        .select('setting_value')
        .eq('user_id', user.id)
        .eq('setting_key', 'theme_prefs')
        .maybeSingle();
      const stored = (row as { setting_value?: unknown } | null)?.setting_value;
      const remote =
        clean(stored) ??
        clean((user.user_metadata as { theme_prefs?: unknown } | null)?.theme_prefs);
      if (remote) {
        fromRemote.current = true;
        setPrefs(remote);
      }
    };
    supabase.auth.getSession().then(({ data }) => loadRemote(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') void loadRemote(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Application du thème : la configuration publiée est superposée aux préférences autorisées.
  useEffect(() => {
    if (!loaded.current) return;
    apply(prefs, designConfig);
    const observer = new MutationObserver(() => applyElementStyles(designConfig));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [prefs, designConfig]);

  // Persistance des préférences personnelles, sans réécriture lors du chargement du thème global.
  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignoré */
    }
    if (fromRemote.current) {
      fromRemote.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        const { error } = await supabase.from('user_settings').upsert(
          {
            user_id: data.session.user.id,
            setting_key: 'theme_prefs',
            setting_value: prefs,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,setting_key' }
        );
        if (error) await supabase.auth.updateUser({ data: { theme_prefs: prefs } });
      }
    }, 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [prefs]);

  // Charger la dernière configuration publiée, d'abord la plateforme puis l'entreprise.
  useEffect(() => {
    let active = true;
    async function loadPublishedDesign() {
      try {
        const { data: platform } = await supabase
          .from('design_config_versions')
          .select('config')
          .eq('scope', 'platform')
          .eq('status', 'published')
          .is('organization_id', null)
          .order('version_no', { ascending: false })
          .limit(1)
          .maybeSingle();
        let resolved = (platform as { config?: Partial<DesignConfig> } | null)?.config ?? null;
        const { data: profile } = await fetchOrgProfile();
        const organizationId = String(
          (profile as Record<string, unknown> | null)?.organization_id ?? ''
        );
        if (organizationId) {
          const { data: organization } = await supabase
            .from('design_config_versions')
            .select('config')
            .eq('scope', 'organization')
            .eq('organization_id', organizationId)
            .eq('status', 'published')
            .order('version_no', { ascending: false })
            .limit(1)
            .maybeSingle();
          const localConfig = (organization as { config?: Partial<DesignConfig> } | null)?.config;
          if (localConfig) resolved = { ...(resolved ?? {}), ...localConfig };
        }
        if (active) setDesignConfig(resolved);
      } catch {
        // Avant l'application de la migration, l'application continue avec les thèmes existants.
      }
    }
    void loadPublishedDesign();
    return () => {
      active = false;
    };
  }, []);

  // Mode automatique : suivre l'appareil
  useEffect(() => {
    if (prefs.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply(prefs, designConfig);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [prefs, designConfig]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const set = useCallback(
    <K extends keyof Prefs>(key: K, value: Prefs[K]) =>
      setPrefs((p) => ({
        ...p,
        [key]: value,
        ...(key === 'theme' ? { themeOverride: true } : {}),
      })),
    []
  );

  const section = 'text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2';
  const chip = (active: boolean) =>
    `rounded-xl border px-3 py-2 text-sm transition-colors ${active ? 'border-[var(--brand)] bg-[color-mix(in_srgb,var(--brand)_14%,transparent)] font-semibold' : 'border-border hover:bg-muted'}`;

  const backgroundUrl = (() => {
    const value = designConfig?.backgroundMediaUrl;
    if (!value) return null;
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
    } catch {
      return null;
    }
  })();
  const backgroundIsVideo = !!backgroundUrl && /\.(mp4|webm)(\?|$)/i.test(backgroundUrl);
  const backgroundAnimation = designConfig?.backgroundAnimation ?? 'none';
  const backgroundOpacity = Math.max(0.02, Math.min(0.28, Number(designConfig?.backgroundOpacity ?? 0.12)));

  return (
    <>
      {backgroundUrl && (
        <div
          aria-hidden="true"
          data-jdv-platform-background
          className={`pointer-events-none fixed inset-0 z-[1] overflow-hidden mix-blend-soft-light ${backgroundAnimation === 'slow-pan' ? 'jdv-platform-bg-pan' : ''} ${backgroundAnimation === 'float' ? 'jdv-platform-bg-float' : ''} ${backgroundAnimation === 'gradient' ? 'jdv-platform-bg-gradient' : ''}`}
          style={{ opacity: prefs.reduceMotion ? Math.min(backgroundOpacity, 0.08) : backgroundOpacity }}
        >
          {backgroundIsVideo ? (
            <video src={backgroundUrl} autoPlay muted loop playsInline preload="metadata" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${JSON.stringify(backgroundUrl)})` }} />
          )}
          <style jsx global>{`
            @keyframes jdv-platform-pan { from { transform: scale(1); background-position: 45% 50%; } to { transform: scale(1.08); background-position: 55% 50%; } }
            @keyframes jdv-platform-float { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(0,-1.2%,0) scale(1.03); } }
            @keyframes jdv-platform-gradient { 0%,100% { filter: hue-rotate(0deg); } 50% { filter: hue-rotate(18deg); } }
            .jdv-platform-bg-pan { animation: jdv-platform-pan 50s ease-in-out infinite alternate; }
            .jdv-platform-bg-float { animation: jdv-platform-float 32s ease-in-out infinite; }
            .jdv-platform-bg-gradient { animation: jdv-platform-gradient 28s ease-in-out infinite; }
            @media (prefers-reduced-motion: reduce) { .jdv-platform-bg-pan,.jdv-platform-bg-float,.jdv-platform-bg-gradient { animation: none !important; } }
          `}</style>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Personnaliser l’apparence"
        aria-expanded={open}
        className="fixed right-4 top-20 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-card transition-all hover:scale-105 hover:shadow-card-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 print:hidden"
      >
        <Palette size={20} style={{ color: 'var(--brand-text)' }} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Personnalisation de l’apparence"
          className="fixed right-4 top-[8.25rem] z-50 max-h-[calc(100dvh-9.5rem)] w-[min(92vw,22rem)] overflow-y-auto rounded-2xl border border-border bg-card p-5 text-foreground shadow-card-hover print:hidden"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold">Mon apparence</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="rounded-lg p-1 hover:bg-muted"
            >
              <X size={18} />
            </button>
          </div>

          <p className={section}>Thème</p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {THEMES.map(({ id, label, hint, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => set('theme', id)}
                title={hint}
                aria-pressed={prefs.theme === id}
                className={`${chip(prefs.theme === id)} flex items-center gap-2 text-left`}
              >
                <Icon size={16} /> <span className="leading-tight">{label}</span>
              </button>
            ))}
          </div>

          <p className={section}>Couleur principale</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {ACCENTS.map(({ id, label, color }) => (
              <button
                key={id}
                type="button"
                onClick={() => set('accent', id)}
                aria-label={label}
                aria-pressed={prefs.accent === id}
                title={label}
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${prefs.accent === id ? 'border-foreground' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
              >
                {prefs.accent === id && <Check size={16} color="#fff" />}
              </button>
            ))}
          </div>

          <p className={section}>Taille du texte</p>
          <div className="mb-4 grid grid-cols-4 gap-2">
            {FONTS.map(({ id, label, sample }) => (
              <button
                key={id}
                type="button"
                onClick={() => set('font', id)}
                aria-pressed={prefs.font === id}
                className={`${chip(prefs.font === id)} px-1 text-center`}
              >
                <span className={`block font-semibold ${sample}`}>Aa</span>
                <span className="block text-[10px] text-muted-foreground">{label}</span>
              </button>
            ))}
          </div>

          <label className="mb-4 flex cursor-pointer items-center justify-between gap-3 text-sm">
            <span>Réduire les animations</span>
            <input
              type="checkbox"
              checked={prefs.reduceMotion}
              onChange={(e) => set('reduceMotion', e.target.checked)}
              className="h-4 w-4"
            />
          </label>

          <button
            type="button"
            onClick={() => setPrefs(DEFAULT_PREFS)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            <RotateCcw size={14} /> Réinitialiser
          </button>
          <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
            Vos choix sont enregistrés sur cet appareil, et sur votre compte quand vous êtes
            connecté.
          </p>
        </div>
      )}
    </>
  );
}
