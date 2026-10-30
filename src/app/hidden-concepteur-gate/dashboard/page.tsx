'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  Boxes,
  Users,
  Palette,
  ChartNoAxesCombined,
  Warehouse,
  MapPinned,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

type Row = {
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

const workspaceLinks = [
  {
    title: 'Entreprises',
    description: 'Entreprises clientes et demandes d’adhésion',
    href: '/hidden-concepteur-gate/dashboard/companies',
    icon: Building2,
  },
  {
    title: 'Agences et entrepôts',
    description: 'Accéder aux outils existants de gestion des stocks',
    href: '/entrepot/dashboard',
    icon: Warehouse,
  },
  {
    title: 'Terrain et prospecteurs',
    description: 'Suivre les activités et les équipes terrain',
    href: '/hidden-concepteur-gate/dashboard/prospecteurs',
    icon: MapPinned,
  },
  {
    title: 'Stock et traçabilité',
    description: 'Consulter la gestion de stock disponible',
    href: '/hidden-concepteur-gate/dashboard/stock',
    icon: Boxes,
  },
  {
    title: 'Atelier du Concepteur',
    description: 'Personnaliser et prévisualiser les interfaces',
    href: '/hidden-concepteur-gate/dashboard/design-studio',
    icon: Palette,
  },
  {
    title: 'Croissance marketing',
    description: 'Ouvrir le centre de croissance existant',
    href: '/hidden-concepteur-gate/dashboard/croissance-marketing',
    icon: ChartNoAxesCombined,
  },
  {
    title: 'Comptes et paiements',
    description: 'Accéder au suivi administratif et financier',
    href: '/hidden-concepteur-gate/dashboard/payments',
    icon: CreditCard,
  },
  {
    title: 'Sécurité et audit',
    description: 'Consulter les outils existants de contrôle',
    href: '/hidden-concepteur-gate/dashboard/audit',
    icon: ShieldCheck,
  },
];

export default function SuperAdminDashboardPage() {
  const { t, locale } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const { data, error } = await supabase.rpc('jdvcrm_get_platform_companies_v1');
      if (error) throw error;
      setRows((data ?? []) as Row[]);
    } catch {
      setLoadError(true);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const active = rows.filter((r) => ['active', 'trial'].includes(r.subscription_status)).length;
  const unpaid = rows.filter(
    (r) =>
      ['past_due', 'expired', 'cancelled'].includes(r.subscription_status) ||
      r.last_payment_status === 'failed'
  ).length;
  const suspended = rows.filter((r) => r.organization_status === 'suspended').length;
  const auto = rows.filter((r) => r.auto_renew).length;

  return (
    <div className="min-h-full space-y-8 bg-[#0B1B3D] p-5 text-[#F4F7FC] sm:p-6 lg:p-8">
      <section className="relative overflow-hidden rounded-3xl border border-[#34D399]/20 bg-gradient-to-br from-[#14294B] via-[#0D2042] to-[#08152F] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-[#34D399]/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#34D399]/25 bg-[#34D399]/10 px-3 py-1 text-xs font-semibold text-[#6EE7B7]">
              <span className="h-2 w-2 rounded-full bg-[#34D399]" />
              CENTRE DE PILOTAGE
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('cg.dbTitle')}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#AFC0D8]">
              {t('cg.dbSub')} Gérez les espaces JDV CRM depuis un point d’accès unique.
            </p>
          </div>
          <button
            onClick={() => void load()}
            disabled={loading}
            aria-label="Actualiser les données"
            className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#34D399]/30 bg-[#34D399]/10 px-4 py-2 text-sm font-semibold text-[#6EE7B7] transition hover:bg-[#34D399]/20 disabled:opacity-60 sm:self-center"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </section>

      <section aria-label="Indicateurs de la plateforme" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: t('cg.dbCompanies'), value: rows.length, Icon: Building2, color: 'text-[#6EE7B7]', tint: 'bg-[#34D399]/10' },
          { label: t('cg.dbActive'), value: active, Icon: CreditCard, color: 'text-sky-300', tint: 'bg-sky-400/10' },
          { label: t('cg.dbUnpaid'), value: unpaid, Icon: AlertTriangle, color: 'text-rose-300', tint: 'bg-rose-400/10' },
          { label: t('cg.dbAuto'), value: auto, Icon: CheckCircle2, color: 'text-violet-300', tint: 'bg-violet-400/10' },
        ].map(({ label, value, Icon, color, tint }) => (
          <article key={label} className="rounded-2xl border border-[#1E355B] bg-[#08152F] p-5 transition hover:border-[#34D399]/30">
            <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${tint} `}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold tracking-tight sm:text-3xl">{loading ? '—' : value}</p>
            <p className="mt-1 text-xs text-[#94A3B8] sm:text-sm">{label}</p>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Accès rapide aux espaces</h2>
            <p className="mt-1 text-sm text-[#94A3B8]">Des raccourcis vers les modules déjà présents dans JDV CRM.</p>
          </div>
          <span className="text-xs text-[#718096]">Les droits existants restent applicables</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {workspaceLinks.map(({ title, description, href, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="group flex min-h-40 flex-col rounded-2xl border border-[#1E355B] bg-[#08152F] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#34D399]/40 hover:bg-[#0D2042] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#34D399]"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#34D399]/15 bg-[#34D399]/10 text-[#6EE7B7]">
                  <Icon size={20} />
                </span>
                <ArrowRight size={17} className="text-[#718096] transition group-hover:translate-x-1 group-hover:text-[#34D399]" />
              </div>
              <h3 className="font-semibold text-[#F4F7FC]">{title}</h3>
              <p className="mt-1 text-sm leading-5 text-[#94A3B8]">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#1E355B] bg-[#08152F] p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">{t('cg.dbState')}</h2>
            <p className="mt-1 text-xs text-[#718096]">{t('cg.dbNote')}</p>
          </div>
          <Link
            href="/hidden-concepteur-gate/dashboard/company-applications"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#34D399] hover:text-[#6EE7B7]"
          >
            {t('cg.dbFiles')} <ArrowRight size={13} />
          </Link>
        </div>
        {loadError && (
          <div role="alert" className="mb-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
            Impossible de charger les indicateurs. Vérifiez la connexion et les autorisations, puis réessayez.
          </div>
        )}
        {!loading && suspended > 0 && (
          <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
            {t('cg.dbSuspN').replace('{n}', String(suspended))}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[#1E355B]">
                {[t('cg.dbColCo'), t('cg.dbColSub'), t('cg.dbColDue'), t('cg.dbColPay'), t('cg.dbColState')].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#718096]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E355B]">
              {!loading && rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[#94A3B8]">
                  {loadError ? 'Les données sont temporairement indisponibles.' : 'Aucune entreprise à afficher.'}
                </td></tr>
              )}
              {rows.slice(0, 10).map((r) => (
                <tr key={r.organization_id} className="transition hover:bg-[#14294B]/50">
                  <td className="px-4 py-3 text-sm font-medium text-white">{r.organization_name}</td>
                  <td className="px-4 py-3 text-sm text-[#A0AEC0]">{r.plan_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#A0AEC0]">{r.expires_at ? new Date(r.expires_at).toLocaleDateString(locale) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#A0AEC0]">{r.last_payment_status || t('cg.dbNone')}</td>
                  <td className="px-4 py-3">
                    <span className={r.organization_status === 'suspended' || r.subscription_status === 'expired' ? 'rounded-full bg-rose-400/10 px-2.5 py-1 text-xs font-medium text-rose-300' : 'rounded-full bg-[#34D399]/10 px-2.5 py-1 text-xs font-medium text-[#6EE7B7]'}>
                      {r.organization_status === 'suspended' || r.subscription_status === 'expired' ? t('cg.dbSusp') : t('cg.dbOk')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
