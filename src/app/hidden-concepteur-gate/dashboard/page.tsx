'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight,
  Building2, CheckCircle2, CreditCard, Gauge, Layers3, Palette,
  RefreshCw, Search, ShieldCheck, Users, Warehouse, Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

type CompanyRow = {
  organization_id: string;
  organization_name: string;
  organization_status: string;
  subscription_status: string;
  plan_name: string | null;
  expires_at: string | null;
  days_remaining: number | null;
  last_payment_status: string | null;
  auto_renew: boolean;
};

const modules = [
  { title: 'Entreprises', detail: 'Comptes clients et demandes', href: '/hidden-concepteur-gate/dashboard/companies', Icon: Building2, color: 'text-violet-300', bg: 'bg-violet-500/10' },
  { title: 'Agences & entrepôts', detail: 'Ouvrir le pilotage des entrepôts', href: '/entrepot/dashboard', Icon: Warehouse, color: 'text-emerald-300', bg: 'bg-emerald-500/10' },
  { title: 'Terrain & prospecteurs', detail: 'Suivi des équipes terrain', href: '/hidden-concepteur-gate/dashboard/prospecteurs', Icon: Users, color: 'text-sky-300', bg: 'bg-sky-500/10' },
  { title: 'Atelier du Concepteur', detail: 'Thèmes et personnalisation', href: '/hidden-concepteur-gate/dashboard/design-studio', Icon: Palette, color: 'text-fuchsia-300', bg: 'bg-fuchsia-500/10' },
  { title: 'Stock & traçabilité', detail: 'Gestion et suivi des stocks', href: '/hidden-concepteur-gate/dashboard/stock', Icon: Layers3, color: 'text-amber-300', bg: 'bg-amber-500/10' },
  { title: 'Croissance marketing', detail: 'Outils de croissance JDV', href: '/hidden-concepteur-gate/dashboard/croissance-marketing', Icon: Activity, color: 'text-cyan-300', bg: 'bg-cyan-500/10' },
  { title: 'Maintenance', detail: 'Suivi technique de la plateforme', href: '/hidden-concepteur-gate/dashboard/maintenance', Icon: Wrench, color: 'text-orange-300', bg: 'bg-orange-500/10' },
  { title: 'Sécurité & audit', detail: 'Contrôles et journal d’audit', href: '/hidden-concepteur-gate/dashboard/audit', Icon: ShieldCheck, color: 'text-rose-300', bg: 'bg-rose-500/10' },
];

export default function SuperAdminDashboardPage() {
  const { t, locale } = useLanguage();
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const { data, error } = await supabase.rpc('jdvcrm_get_platform_companies_v1');
      if (error) throw error;
      setRows((data ?? []) as CompanyRow[]);
    } catch {
      setRows([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const active = rows.filter((r) => ['active', 'trial'].includes(r.subscription_status)).length;
  const attention = rows.filter((r) =>
    ['past_due', 'expired', 'cancelled'].includes(r.subscription_status) ||
    r.last_payment_status === 'failed' || r.organization_status === 'suspended'
  ).length;
  const renewing = rows.filter((r) => r.auto_renew).length;
  const filteredRows = useMemo(() => rows.filter((r) =>
    r.organization_name.toLocaleLowerCase().includes(search.toLocaleLowerCase())
  ), [rows, search]);

  const statusGroups = [
    { label: 'Actifs / Essai', count: active, color: 'bg-emerald-400' },
    { label: 'À surveiller', count: attention, color: 'bg-amber-400' },
    { label: 'Autres statuts', count: Math.max(0, rows.length - active - attention), color: 'bg-violet-400' },
  ];
  const maxStatus = Math.max(1, ...statusGroups.map((s) => s.count));

  return (
    <div className="min-h-full space-y-5 bg-[#0A0D16] p-4 text-[#F5F7FC] sm:p-6 xl:p-7">
      <section className="flex flex-col gap-4 border-b border-white/[0.07] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300">JDV CRM · CONCEPTEUR</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Bienvenue dans votre centre de pilotage</h1>
          <p className="mt-1 text-sm text-slate-400">Voici l’état de la plateforme et les espaces à administrer.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-[#111827] px-3 py-2.5 sm:w-64">
            <Search size={16} className="shrink-0 text-slate-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une entreprise…" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
          </label>
          <button onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-2.5 text-sm font-semibold text-violet-200 hover:bg-violet-500/25 disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>
      </section>

      <section aria-label="Indicateurs principaux" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Entreprises suivies', value: rows.length, Icon: Building2, color: 'text-violet-300', trend: 'Comptes enregistrés' },
          { label: 'Abonnements actifs', value: active, Icon: Users, color: 'text-sky-300', trend: 'Actifs et périodes d’essai' },
          { label: 'Revenus / paiements', value: attention, Icon: CreditCard, color: 'text-emerald-300', trend: 'Dossiers nécessitant attention' },
          { label: 'Renouvellement auto', value: renewing, Icon: Gauge, color: 'text-amber-300', trend: 'Renouvellements activés' },
        ].map(({ label, value, Icon, color, trend }) => (
          <article key={label} className="rounded-2xl border border-white/[0.07] bg-[#111827] p-4 shadow-lg shadow-black/10 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{label}</span>
              <Icon size={18} className={color} />
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{loading ? '—' : value}</p>
            <p className="mt-1 text-[11px] text-slate-500">{trend}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className="rounded-2xl border border-white/[0.07] bg-[#111827] p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div><h2 className="font-semibold">Vue d’ensemble des abonnements</h2><p className="mt-1 text-xs text-slate-500">Répartition calculée à partir des données disponibles</p></div>
            <span className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-slate-400">En direct</span>
          </div>
          <div className="space-y-5">
            {statusGroups.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-xs"><span className="text-slate-300">{item.label}</span><strong className="text-slate-100">{loading ? '—' : item.count}</strong></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${loading ? 0 : (item.count / maxStatus) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-xs text-slate-500"><Activity size={14} /> {rows.length} entreprise(s) dans les données retournées</div>
        </article>

        <article className="rounded-2xl border border-white/[0.07] bg-[#111827] p-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Espaces de travail</h2><p className="mt-1 text-xs text-slate-500">Accès aux outils existants</p></div><ArrowUpRight size={17} className="text-violet-300" /></div>
          <div className="space-y-1">
            {modules.slice(0, 5).map(({ title, detail, href, Icon, color, bg }) => (
              <Link key={title} href={href} className="group flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-white/[0.04]">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg} ${color}`}><Icon size={17} /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-200">{title}</span><span className="block truncate text-[11px] text-slate-500">{detail}</span></span>
                <ArrowRight size={14} className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-violet-300" />
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <article className="min-w-0 rounded-2xl border border-white/[0.07] bg-[#111827] p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-semibold">Entreprises récemment consultables</h2><p className="mt-1 text-xs text-slate-500">Liste issue du service de gestion de la plateforme</p></div>
            <Link href="/hidden-concepteur-gate/dashboard/companies" className="inline-flex items-center gap-1 text-xs font-medium text-violet-300 hover:text-violet-200">Voir les entreprises <ArrowRight size={13} /></Link>
          </div>
          {loadError && <div role="alert" className="mb-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-200">Impossible de charger les données. Vérifiez la connexion et les autorisations puis actualisez.</div>}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left">
              <thead><tr className="border-b border-white/[0.07] text-[10px] uppercase tracking-wider text-slate-500"><th className="px-3 py-3">Entreprise</th><th className="px-3 py-3">Offre</th><th className="px-3 py-3">Échéance</th><th className="px-3 py-3">Paiement</th><th className="px-3 py-3">État</th></tr></thead>
              <tbody className="divide-y divide-white/[0.05]">
                {!loading && filteredRows.length === 0 && <tr><td colSpan={5} className="px-3 py-8 text-center text-xs text-slate-500">{search ? 'Aucun résultat pour cette recherche.' : 'Aucune entreprise à afficher.'}</td></tr>}
                {filteredRows.slice(0, 8).map((r) => {
                  const warning = r.organization_status === 'suspended' || ['expired', 'past_due', 'cancelled'].includes(r.subscription_status);
                  return <tr key={r.organization_id} className="hover:bg-white/[0.025]">
                    <td className="px-3 py-3 text-xs font-medium text-slate-200">{r.organization_name}</td>
                    <td className="px-3 py-3 text-xs text-slate-400">{r.plan_name || '—'}</td>
                    <td className="px-3 py-3 text-xs text-slate-400">{r.expires_at ? new Date(r.expires_at).toLocaleDateString(locale) : '—'}</td>
                    <td className="px-3 py-3 text-xs text-slate-400">{r.last_payment_status || t('cg.dbNone')}</td>
                    <td className="px-3 py-3"><span className={warning ? 'inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-1 text-[10px] text-amber-300' : 'inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] text-emerald-300'}>{warning ? <ArrowDownRight size={11} /> : <CheckCircle2 size={11} />}{warning ? t('cg.dbSusp') : t('cg.dbOk')}</span></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </article>
        <article className="rounded-2xl border border-white/[0.07] bg-[#111827] p-5">
          <div className="mb-4"><h2 className="font-semibold">Outils de pilotage</h2><p className="mt-1 text-xs text-slate-500">Administration et configuration</p></div>
          <div className="grid grid-cols-2 gap-2">
            {modules.slice(5).map(({ title, detail, href, Icon, color, bg }) => (
              <Link key={title} href={href} className="rounded-xl border border-white/[0.06] bg-[#0D1422] p-3 transition hover:border-violet-400/30 hover:bg-[#151D2E]">
                <span className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${bg} ${color}`}><Icon size={16} /></span>
                <span className="block text-xs font-semibold text-slate-200">{title}</span>
                <span className="mt-1 block text-[10px] leading-4 text-slate-500">{detail}</span>
              </Link>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-violet-400/15 bg-violet-500/[0.07] p-3 text-[11px] leading-5 text-slate-400"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-violet-300" /> Les accès restent soumis aux contrôles de rôle et aux autorisations déjà en place.</div>
        </article>
      </section>
    </div>
  );
}
