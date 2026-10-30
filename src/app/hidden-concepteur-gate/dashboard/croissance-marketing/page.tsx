'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Activity,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Compass,
  Eye,
  FileText,
  Megaphone,
  MousePointerClick,
  Plus,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';
import {
  generateMarketingRecommendations,
  type MarketingMetrics,
  type MarketingRecommendation,
} from '@/lib/marketing/recommendationEngine';

type Channel = 'organic' | 'paid';
type Objective = 'visibilite' | 'leads' | 'conversion' | 'fidelisation';

const CAMPAIGN_STORAGE_KEY = 'jdvcrm:marketing:official-launch:v2';
const ORGANIC_CHECKLIST_STORAGE_KEY = 'jdvcrm:marketing:organic-checklist:v1';
const OFFICIAL_VISUALS = [
  {
    title: '1. Lancement principal',
    path: 'https://github.com/user-attachments/assets/9381e174-b676-41cc-ba51-034112c57d60',
    fileName: 'JDV CRM _ Votre partenaire de croissance.png',
    description: 'Visuel officiel de lancement : JDV CRM, partenaire de croissance.',
  },
  {
    title: '2. Vitrine publique',
    path: 'https://github.com/user-attachments/assets/511aec49-e197-4925-8da6-b63d3640930b',
    fileName: 'JDV CRM _ votre croissance, simplifiée (1).png',
    description: 'Visuel de présentation destiné à la vitrine publique.',
  },
  {
    title: '3. Visuels complémentaires',
    path: 'https://github.com/user-attachments/assets/e41a6222-f078-4fb9-a5d0-87f498eb8d23',
    fileName: 'JDV CRM _ Connecter, Développer, Réussir (1).png',
    description: 'Visuel complémentaire des fonctionnalités et de la signature de marque.',
  },
] as const;
const VISUAL_KEYS: Record<string, { title: TerrainKey; description: TerrainKey }> = {
  [OFFICIAL_VISUALS[0].path]: { title: 'mk.v1t', description: 'mk.v1d' },
  [OFFICIAL_VISUALS[1].path]: { title: 'mk.v2t', description: 'mk.v2d' },
  [OFFICIAL_VISUALS[2].path]: { title: 'mk.v3t', description: 'mk.v3d' },
};

const REC_KEYS: Record<
  string,
  { title: TerrainKey; reason: TerrainKey; action: TerrainKey; successMetric: TerrainKey }
> = {
  'instrument-conversion': {
    title: 'mk.r1t',
    reason: 'mk.r1r',
    action: 'mk.r1a',
    successMetric: 'mk.r1m',
  },
  'measure-profile-completeness': {
    title: 'mk.r2t',
    reason: 'mk.r2r',
    action: 'mk.r2a',
    successMetric: 'mk.r2m',
  },
  'measure-retention': {
    title: 'mk.r3t',
    reason: 'mk.r3r',
    action: 'mk.r3a',
    successMetric: 'mk.r3m',
  },
  'measure-reputation': {
    title: 'mk.r4t',
    reason: 'mk.r4r',
    action: 'mk.r4a',
    successMetric: 'mk.r4m',
  },
};

const EMPTY_METRICS: MarketingMetrics = {
  storefrontConversionRatePct: null,
  profileCompletenessPct: null,
  qualifiedVisits: null,
  repeatCustomerRatePct: null,
  recentReviews: null,
};

const OBJECTIVES: { value: Objective; label: TerrainKey }[] = [
  { value: 'visibilite', label: 'mk.o1' },
  { value: 'leads', label: 'mk.o2' },
  { value: 'conversion', label: 'mk.o3' },
  { value: 'fidelisation', label: 'mk.o4' },
];

const PRIORITY_LABEL: Record<MarketingRecommendation['priority'], TerrainKey> = {
  high: 'mk.pHigh',
  medium: 'mk.pMed',
  low: 'mk.pLow',
};

function MetricCard({
  label,
  icon: Icon,
  description,
  missingSource,
}: {
  label: TerrainKey;
  icon: typeof Eye;
  description: TerrainKey;
  missingSource: TerrainKey;
}) {
  const { t } = useLanguage();
  return (
    <article className="rounded-2xl border border-white/10 bg-[#0F2347] p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#34D399]/20 bg-[#34D399]/10 text-[#6EE7B7]">
          <Icon size={19} />
        </span>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
          {t('mk.srcConn')}
        </span>
      </div>
      <p className="mt-5 text-sm font-medium text-white">{t(label)}</p>
      <p className="mt-1 text-xs leading-5 text-[#8FA2C1]">{t(description)}</p>
      <p className="mt-4 text-sm font-semibold text-[#F5D76E]">{t('mk.dataNA')}</p>
      <p className="mt-1 text-xs leading-5 text-[#A1A1AA]">{t(missingSource)}</p>
    </article>
  );
}

function RecommendationCard({ item, index }: { item: MarketingRecommendation; index: number }) {
  const { t } = useLanguage();
  const rk = REC_KEYS[item.id];
  const priorityClass =
    item.priority === 'high'
      ? 'border-amber-300/25 bg-amber-300/10 text-amber-200'
      : item.priority === 'medium'
        ? 'border-sky-300/20 bg-sky-300/10 text-sky-200'
        : 'border-white/10 bg-white/5 text-[#A1A1AA]';

  return (
    <article className="rounded-2xl border border-white/10 bg-[#0F2347] p-5 transition hover:border-[#34D399]/30">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-xs font-semibold text-[#34D399]">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#34D399]/10">
            {index + 1}
          </span>
          {t('mk.recGuided')}
        </span>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${priorityClass}`}
        >
          {t(PRIORITY_LABEL[item.priority])}
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold text-white">{rk ? t(rk.title) : item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#A1A1AA]">{rk ? t(rk.reason) : item.reason}</p>
      <div className="mt-4 rounded-xl border border-white/5 bg-[#080B12] p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#8B5CF6]">
          <Sparkles size={14} /> {t('mk.recAction')}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-200">{rk ? t(rk.action) : item.action}</p>
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-[11px] uppercase tracking-wide text-[#7186A8]">{t('mk.recKpi')}</p>
          <p className="mt-1 text-xs leading-5 text-[#C5D0E2]">
            {rk ? t(rk.successMetric) : item.successMetric}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function MarketingGrowthPage() {
  const { t, formatNumber } = useLanguage();
  const [channel, setChannel] = useState<Channel>('organic');
  const [organicTasksDone, setOrganicTasksDone] = useState<string[]>([]);
  const [persistenceStatus, setPersistenceStatus] = useState<TerrainKey>('mk.loading');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(ORGANIC_CHECKLIST_STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
          setOrganicTasksDone(parsed);
        }
      }
    } catch {
      // Checklist stays usable in this session if browser storage is unavailable.
    }
  }, []);
  const organicTasks = [
    {
      id: 'profile',
      title: t('mk.ot1t'),
      detail: t('mk.ot1d'),
    },
    {
      id: 'photos',
      title: t('mk.ot2t'),
      detail: t('mk.ot2d'),
    },
    {
      id: 'keywords',
      title: t('mk.ot3t'),
      detail: t('mk.ot3d'),
    },
    {
      id: 'content',
      title: t('mk.ot4t'),
      detail: t('mk.ot4d'),
    },
    {
      id: 'reviews',
      title: t('mk.ot5t'),
      detail: t('mk.ot5d'),
    },
    {
      id: 'referrals',
      title: t('mk.ot6t'),
      detail: t('mk.ot6d'),
    },
  ];
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [campaignName, setCampaignName] = useState<string | null>(null);
  const campaignNameValue = campaignName ?? t('mk.defName');
  const [objective, setObjective] = useState<Objective>('visibilite');
  const [budget, setBudget] = useState('0');
  const [duration, setDuration] = useState('14');
  const [campaignDraft, setCampaignDraft] = useState<{
    name: string;
    audience: string;
    channels: string[];
    objective: Objective;
    channel: Channel;
    budget: number;
    duration: number;
    socialCopy: string;
    storefrontCopy: string;
    id?: string;
    visualPaths: { title: string; path: string; fileName: string; description: string }[];
    updatedAt: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    async function loadCampaign() {
      try {
        const { data, error } = await supabase
          .from('jdv_marketing_campaigns')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        if (!active) return;
        if (data) {
          const draft = {
            id: data.id,
            name: data.name,
            audience: data.audience,
            channels: data.channels,
            objective: data.objective as Objective,
            channel: data.channel as Channel,
            budget: Number(data.budget),
            duration: data.duration_days,
            socialCopy: data.social_copy,
            storefrontCopy: data.storefront_copy,
            visualPaths: data.visual_paths as unknown as (typeof OFFICIAL_VISUALS)[number][],
            updatedAt: data.updated_at,
          };
          setCampaignDraft(draft);
          setOrganicTasksDone(data.organic_tasks_done ?? []);
          setPersistenceStatus('mk.stSynced');
          try {
            window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(draft));
            window.localStorage.setItem(
              ORGANIC_CHECKLIST_STORAGE_KEY,
              JSON.stringify(data.organic_tasks_done ?? [])
            );
          } catch {
            /* Supabase remains the durable source of truth. */
          }
          return;
        }
        setPersistenceStatus('mk.stNone');
      } catch {
        if (!active) return;
        try {
          const stored = window.localStorage.getItem(CAMPAIGN_STORAGE_KEY);
          if (stored) setCampaignDraft(JSON.parse(stored));
        } catch {
          /* Browser storage is optional fallback only. */
        }
        setPersistenceStatus('mk.stLocal');
      }
    }
    void loadCampaign();
    return () => {
      active = false;
    };
  }, []);

  const recommendations = useMemo(() => generateMarketingRecommendations(EMPTY_METRICS), []);

  async function createLocalDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedBudget = Number(budget);
    const parsedDuration = Number(duration);
    if (
      !campaignNameValue.trim() ||
      !Number.isFinite(parsedBudget) ||
      parsedBudget < 0 ||
      !Number.isInteger(parsedDuration) ||
      parsedDuration < 1 ||
      parsedDuration > 365
    )
      return;
    const draft = {
      name: campaignNameValue.trim(),
      audience: t('mk.audience'),
      channels: [t('mk.chPub'), t('mk.chSoc')],
      objective,
      channel,
      budget: parsedBudget,
      duration: parsedDuration,
      socialCopy: t('mk.social'),
      storefrontCopy: t('mk.store'),
      visualPaths: [...OFFICIAL_VISUALS],
      updatedAt: new Date().toISOString(),
    };
    setCampaignDraft(draft);
    try {
      window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* Local fallback is optional. */
    }
    setShowCampaignForm(false);
    setCampaignName('');
    setPersistenceStatus('mk.stSaving');
    const { data, error } = await supabase
      .from('jdv_marketing_campaigns')
      .insert({
        name: draft.name,
        audience: draft.audience,
        channels: draft.channels,
        objective: draft.objective,
        channel: draft.channel,
        budget: draft.budget,
        duration_days: draft.duration,
        social_copy: draft.socialCopy,
        storefront_copy: draft.storefrontCopy,
        visual_paths: draft.visualPaths,
        organic_tasks_done: organicTasksDone,
        status: 'draft',
      })
      .select('id, updated_at')
      .single();
    if (error || !data) {
      setPersistenceStatus('mk.stFail');
      return;
    }
    const savedDraft = { ...draft, id: data.id, updatedAt: data.updated_at };
    setCampaignDraft(savedDraft);
    try {
      window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(savedDraft));
    } catch {
      /* Supabase is the source of truth. */
    }
    setPersistenceStatus('mk.stSaved');
  }

  return (
    <div className="min-h-full space-y-7 p-4 sm:p-6 lg:p-8">
      <header className="relative overflow-hidden rounded-3xl border border-[#34D399]/20 bg-gradient-to-br from-[#102851] via-[#0D2041] to-[#080B12] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-[#34D399]/10" />
        <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-[#34D399]/15" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#8B5CF6]">
              <Sparkles size={15} /> {t('mk.kicker')}
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {t('mk.h1')}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#B6C5DC]">{t('mk.intro')}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100">
                <ShieldCheck size={14} /> {t('mk.sep')}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#C5D0E2]">
                <Activity size={14} /> {t('mk.mode')}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowCampaignForm(true)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#34D399] px-5 py-3 text-sm font-bold text-[#07142D] shadow-lg shadow-black/10 transition hover:bg-[#A7F3D0]"
          >
            <Plus size={17} /> {t('mk.prep')}
          </button>
        </div>
      </header>

      <p
        role="status"
        aria-live="polite"
        className="rounded-xl border border-white/10 bg-[#0A0D16] px-4 py-3 text-xs text-[#A1A1AA]"
      >
        <ShieldCheck size={14} className="mr-2 inline text-[#8B5CF6]" />
        {t(persistenceStatus)}
      </p>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="mk.m1l" icon={Eye} description="mk.m1d" missingSource="mk.m1s" />
        <MetricCard label="mk.m2l" icon={Users} description="mk.m2d" missingSource="mk.m2s" />
        <MetricCard
          label="mk.m3l"
          icon={MousePointerClick}
          description="mk.m3d"
          missingSource="mk.m3s"
        />
        <MetricCard label="mk.m4l" icon={Wallet} description="mk.m4d" missingSource="mk.m4s" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)]">
        <div className="space-y-5 rounded-2xl border border-white/10 bg-[#0A0D16] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{t('mk.planH')}</h2>
              <p className="mt-1 text-sm text-[#8FA2C1]">{t('mk.planSub')}</p>
            </div>
            <div className="flex rounded-xl border border-white/10 bg-[#080B12] p-1">
              <button
                onClick={() => setChannel('organic')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${channel === 'organic' ? 'bg-[#34D399] text-[#07142D]' : 'text-[#A1A1AA] hover:text-white'}`}
              >
                {t('mk.organic')}
              </button>
              <button
                onClick={() => setChannel('paid')}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${channel === 'paid' ? 'bg-[#34D399] text-[#07142D]' : 'text-[#A1A1AA] hover:text-white'}`}
              >
                {t('mk.paid')}
              </button>
            </div>
          </div>
          {channel === 'organic' ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[
                {
                  icon: Compass,
                  title: t('mk.c1t'),
                  desc: t('mk.c1d'),
                },
                {
                  icon: Users,
                  title: t('mk.c2t'),
                  desc: t('mk.c2d'),
                },
                {
                  icon: BadgeCheck,
                  title: t('mk.c3t'),
                  desc: t('mk.c3d'),
                },
                {
                  icon: FileText,
                  title: t('mk.c4t'),
                  desc: t('mk.c4d'),
                },
              ].map(({ icon: Icon, title, desc }) => (
                <article
                  key={title}
                  className="flex gap-3 rounded-xl border border-white/10 bg-[#0F2347] p-4"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#34D399]/10 text-[#34D399]">
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#8FA2C1]">{desc}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-xl border border-amber-200/20 bg-amber-200/5 p-4">
                <Wallet size={19} className="mt-0.5 shrink-0 text-amber-200" />
                <div>
                  <h3 className="text-sm font-semibold text-amber-100">{t('mk.nsH')}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#B6C5DC]">{t('mk.nsP')}</p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-[#0F2347] p-4">
                  <p className="text-xs text-[#8FA2C1]">{t('mk.chL')}</p>
                  <p className="mt-2 text-sm font-semibold text-white">Meta · Google · TikTok</p>
                  <p className="mt-1 text-xs text-[#7186A8]">{t('mk.chS')}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0F2347] p-4">
                  <p className="text-xs text-[#8FA2C1]">{t('mk.bfL')}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{t('mk.bfV')}</p>
                  <p className="mt-1 text-xs text-[#7186A8]">{t('mk.bfS')}</p>
                </div>
              </div>
            </div>
          )}
          {channel === 'organic' && (
            <section
              aria-labelledby="organic-checklist-title"
              className="rounded-xl border border-[#34D399]/20 bg-[#080B12] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 id="organic-checklist-title" className="text-sm font-semibold text-white">
                    {t('mk.clH')}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[#8FA2C1]">{t('mk.clP')}</p>
                </div>
                <span className="rounded-full border border-[#8B5CF6]/20 px-3 py-1 text-xs font-semibold text-[#F5D76E]">
                  {t('mk.clCount')
                    .replace('{d}', String(organicTasksDone.length))
                    .replace('{n}', String(organicTasks.length))}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#34D399] transition-all"
                  style={{ width: `${(organicTasksDone.length / organicTasks.length) * 100}%` }}
                />
              </div>
              <div className="mt-4 space-y-2">
                {organicTasks.map((task) => {
                  const done = organicTasksDone.includes(task.id);
                  return (
                    <label
                      key={task.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${done ? 'border-emerald-300/20 bg-emerald-300/5' : 'border-white/5 bg-[#0F2347]/60 hover:border-white/15'}`}
                    >
                      <input
                        type="checkbox"
                        checked={done}
                        onChange={(event) => {
                          const next = event.target.checked
                            ? [...organicTasksDone.filter((id) => id !== task.id), task.id]
                            : organicTasksDone.filter((id) => id !== task.id);
                          setOrganicTasksDone(next);
                          try {
                            window.localStorage.setItem(
                              ORGANIC_CHECKLIST_STORAGE_KEY,
                              JSON.stringify(next)
                            );
                          } catch {
                            /* Browser storage is only a fallback. */
                          }
                          if (campaignDraft?.id) {
                            void supabase
                              .from('jdv_marketing_campaigns')
                              .update({ organic_tasks_done: next })
                              .eq('id', campaignDraft.id)
                              .then(({ error }) =>
                                setPersistenceStatus(error ? 'mk.stNoSync' : 'mk.stSynced')
                              );
                          }
                        }}
                        className="mt-1 h-4 w-4 rounded border-white/20 bg-[#080B12] accent-[#34D399]"
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm font-medium ${done ? 'text-emerald-100 line-through' : 'text-white'}`}
                        >
                          {task.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[#8FA2C1]">
                          {task.detail}
                        </span>
                      </span>
                      {done && (
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" />
                      )}
                    </label>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#7186A8]">{t('mk.clNote')}</p>
                <button
                  type="button"
                  onClick={() => {
                    setOrganicTasksDone([]);
                    try {
                      window.localStorage.removeItem(ORGANIC_CHECKLIST_STORAGE_KEY);
                    } catch {
                      /* Browser storage may be unavailable. */
                    }
                  }}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#C5D0E2] hover:bg-white/5"
                >
                  {t('mk.clReset')}
                </button>
              </div>
            </section>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <p className="flex items-center gap-2 text-xs text-[#7186A8]">
              <CircleHelp size={14} /> {t('mk.platNote')}
            </p>
            <button
              onClick={() => setShowCampaignForm(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#6EE7B7] hover:text-white"
            >
              {t('mk.draftLink')} <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <aside className="space-y-4 rounded-2xl border border-white/10 bg-[#0A0D16] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#34D399]/10 text-[#34D399]">
              <Target size={19} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-white">{t('mk.objH')}</h2>
              <p className="text-xs text-[#8FA2C1]">{t('mk.objS')}</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              ['01', t('mk.g1t'), t('mk.g1d')],
              ['02', t('mk.g2t'), t('mk.g2d')],
              ['03', t('mk.g3t'), t('mk.g3d')],
              ['04', t('mk.g4t'), t('mk.g4d')],
            ].map(([n, title, desc]) => (
              <div
                key={n}
                className="flex gap-3 rounded-xl border border-white/5 bg-[#0F2347]/70 p-3"
              >
                <span className="text-xs font-bold text-[#34D399]">{n}</span>
                <div>
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-0.5 text-xs text-[#8FA2C1]">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-100">
              <CheckCircle2 size={14} /> {t('mk.respH')}
            </div>
            <p className="mt-2 text-xs leading-5 text-[#A8C8C0]">{t('mk.respP')}</p>
          </div>
        </aside>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8B5CF6]">
              <Sparkles size={14} /> {t('mk.engK')}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">{t('mk.engH')}</h2>
            <p className="mt-1 max-w-2xl text-sm text-[#8FA2C1]">{t('mk.engP')}</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#A1A1AA]">
            {t('mk.engBadge')}
          </span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {recommendations.map((item, index) => (
            <RecommendationCard key={item.id} item={item} index={index} />
          ))}
        </div>
      </section>

      {campaignDraft && (
        <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-200">
                <CheckCircle2 size={19} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  {campaignDraft.id ? t('mk.dSaved') : t('mk.dLocal')}
                </p>
                <p className="mt-1 text-xs text-[#A1A1AA]">
                  {campaignDraft.id ? t('mk.dSavedP') : t('mk.dLocalP')}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const id = campaignDraft.id;
                setCampaignDraft(null);
                try {
                  window.localStorage.removeItem(CAMPAIGN_STORAGE_KEY);
                } catch {
                  /* Storage may be unavailable. */
                }
                if (id)
                  void supabase
                    .from('jdv_marketing_campaigns')
                    .delete()
                    .eq('id', id)
                    .then(({ error }) =>
                      setPersistenceStatus(error ? 'mk.stDelFail' : 'mk.stDeleted')
                    );
              }}
              aria-label={t('mk.dDelAria')}
              className="rounded-lg p-2 text-[#A1A1AA] hover:bg-white/5 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-[#7186A8]">{t('mk.dName')}</p>
              <p className="mt-1 text-sm font-medium text-white">{campaignDraft.name}</p>
            </div>
            <div>
              <p className="text-xs text-[#7186A8]">{t('mk.dMode')}</p>
              <p className="mt-1 text-sm font-medium text-white">
                {campaignDraft.channel === 'organic' ? t('mk.organic') : t('mk.dPaid')}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#7186A8]">{t('mk.dObj')}</p>
              <p className="mt-1 text-sm font-medium text-white">
                {(() => {
                  const o = OBJECTIVES.find((x) => x.value === campaignDraft.objective);
                  return o ? t(o.label) : '';
                })()}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#7186A8]">{t('mk.dAud')}</p>
              <p className="mt-1 text-sm font-medium text-white">{campaignDraft.audience}</p>
            </div>
            <div>
              <p className="text-xs text-[#7186A8]">{t('mk.dChan')}</p>
              <p className="mt-1 text-sm font-medium text-white">
                {campaignDraft.channels.join(' + ')}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#7186A8]">{t('mk.dBud')}</p>
              <p className="mt-1 text-sm font-medium text-white">
                {t('mk.dDur')
                  .replace('{b}', formatNumber(campaignDraft.budget))
                  .replace('{n}', String(campaignDraft.duration))}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {campaignDraft.visualPaths.map((visual) => (
                <article
                  key={visual.path}
                  className="rounded-xl border border-white/10 bg-[#080B12] p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {VISUAL_KEYS[visual.path] ? t(VISUAL_KEYS[visual.path].title) : visual.title}
                    </h3>
                    <a
                      href={visual.path}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-xs font-semibold text-[#6EE7B7] hover:text-white"
                    >
                      {t('mk.open')}
                    </a>
                  </div>
                  <img
                    src={visual.path}
                    alt={
                      VISUAL_KEYS[visual.path] ? t(VISUAL_KEYS[visual.path].title) : visual.title
                    }
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                    className="mt-3 aspect-[4/3] w-full rounded-lg border border-white/10 object-cover"
                  />
                  <p className="mt-2 break-words text-[11px] text-[#7186A8]">
                    {t('mk.fileExp').replace('{f}', visual.fileName)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#8FA2C1]">
                    {VISUAL_KEYS[visual.path]
                      ? t(VISUAL_KEYS[visual.path].description)
                      : visual.description}
                  </p>
                </article>
              ))}
            </div>
            <p className="rounded-lg border border-amber-200/15 bg-amber-200/5 p-3 text-xs leading-5 text-[#B6C5DC]">
              {t('mk.visNote')}
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#080B12] p-4">
                <h3 className="text-sm font-semibold text-white">{t('mk.socH')}</h3>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#B6C5DC]">
                  {campaignDraft.socialCopy}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-[#080B12] p-4">
                <h3 className="text-sm font-semibold text-white">{t('mk.storeH')}</h3>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#B6C5DC]">
                  {campaignDraft.storefrontCopy}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-amber-200/15 bg-amber-200/5 p-3">
            <p className="text-xs leading-5 text-[#B6C5DC]">{t('mk.dLocalNote')}</p>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-[#0A0D16] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#34D399]/20 bg-[#34D399]/10 text-[#34D399]">
            <ShieldCheck size={19} />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white">{t('mk.privH')}</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-[#8FA2C1]">{t('mk.privP')}</p>
          </div>
        </div>
      </section>

      {showCampaignForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCampaignForm(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-dialog-title"
            className="my-auto w-full max-w-xl rounded-2xl border border-[#34D399]/20 bg-[#0A0D16] p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8B5CF6]">
                  <Megaphone size={14} /> {t('mk.fPlan')}
                </p>
                <h2 id="campaign-dialog-title" className="mt-2 text-xl font-bold text-white">
                  {t('mk.prep')}
                </h2>
                <p className="mt-1 text-sm text-[#8FA2C1]">{t('mk.fSub')}</p>
              </div>
              <button
                onClick={() => setShowCampaignForm(false)}
                aria-label={t('mk.close')}
                className="rounded-lg p-2 text-[#A1A1AA] hover:bg-white/5 hover:text-white"
              >
                <X size={17} />
              </button>
            </div>
            <form onSubmit={createLocalDraft} className="mt-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-white">{t('mk.fName')}</span>
                <input
                  required
                  maxLength={100}
                  value={campaignNameValue}
                  onChange={(event) => setCampaignName(event.target.value)}
                  placeholder={t('mk.fNamePh')}
                  className="w-full rounded-xl border border-white/10 bg-[#080B12] px-3 py-3 text-sm text-white outline-none focus:border-[#8B5CF6]/60"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white">{t('mk.fChan')}</span>
                  <select
                    value={channel}
                    onChange={(event) => setChannel(event.target.value as Channel)}
                    className="w-full rounded-xl border border-white/10 bg-[#080B12] px-3 py-3 text-sm text-white"
                  >
                    <option value="organic">{t('mk.fOrg')}</option>
                    <option value="paid">{t('mk.paid')}</option>
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white">{t('mk.dObj')}</span>
                  <select
                    value={objective}
                    onChange={(event) => setObjective(event.target.value as Objective)}
                    className="w-full rounded-xl border border-white/10 bg-[#080B12] px-3 py-3 text-sm text-white"
                  >
                    {OBJECTIVES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {t(item.label)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white">{t('mk.fBud')}</span>
                  <input
                    type="number"
                    min="0"
                    max="1000000000"
                    step="1"
                    required
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#080B12] px-3 py-3 text-sm text-white"
                  />
                  <span className="text-xs text-[#7186A8]">{t('mk.fNoDebit')}</span>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white">{t('mk.fDur')}</span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    step="1"
                    required
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#080B12] px-3 py-3 text-sm text-white"
                  />
                </label>
              </div>
              <div className="flex gap-3 rounded-xl border border-amber-200/15 bg-amber-200/5 p-3">
                <CalendarDays size={16} className="mt-0.5 shrink-0 text-amber-200" />
                <p className="text-xs leading-5 text-[#B6C5DC]">{t('mk.fNote')}</p>
              </div>
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCampaignForm(false)}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-[#C5D0E2] hover:bg-white/5"
                >
                  {t('mk.cancel')}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#34D399] px-4 py-3 text-sm font-bold text-[#07142D] hover:bg-[#A7F3D0]"
                >
                  <Rocket size={16} /> {t('mk.create')}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
