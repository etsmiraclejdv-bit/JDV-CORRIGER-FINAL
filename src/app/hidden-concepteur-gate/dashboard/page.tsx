'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
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

export default function SuperAdminDashboardPage() {
  const { t, locale } = useLanguage();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    const { data } = await supabase.rpc('jdvcrm_get_platform_companies_v1');
    setRows((data ?? []) as Row[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
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
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
 fix/traduction-pages-diverses
          <h1 className="text-2xl font-bold text-white">{t('cg.dbTitle')}</h1>
          <p className="text-sm text-[#A0AEC0] mt-1">{t('cg.dbSub')}</p>
=======
          <h1 className="text-2xl font-bold text-[#F4F7FC]">Gestion de la plateforme</h1>
          <p className="text-sm text-[#AFC0D8] mt-1">
            Contrôle global des entreprises et des abonnements JDV CRM.
          </p>
 main
        </div>
        <button
          onClick={load}
          className="p-2 rounded-xl border border-[#D4AF37]/20 text-[#AFC0D8] hover:text-[#F4F7FC]"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
 fix/traduction-pages-diverses
          [t('cg.dbCompanies'), rows.length, Building2, 'text-[#D4AF37]'],
          [t('cg.dbActive'), active, CreditCard, 'text-green-400'],
          [t('cg.dbUnpaid'), unpaid, AlertTriangle, 'text-red-400'],
          [t('cg.dbAuto'), auto, CheckCircle2, 'text-blue-400'],
=======
          ['Entreprises', rows.length, Building2, 'text-[#34D399]'],
          ['Abonnements actifs', active, CreditCard, 'text-emerald-300'],
          ['Impayées / expirées', unpaid, AlertTriangle, 'text-red-400'],
          ['Renouvellement auto', auto, CheckCircle2, 'text-blue-700'],
 main
        ].map(([l, v, I, c]) => {
          const Icon = I as typeof Building2;
          return (
            <div
              key={l as string}
              className="bg-[#08152F] border border-[#1E355B] rounded-2xl p-5"
            >
              <Icon size={20} className={c as string} />
              <p className="text-2xl font-bold text-[#F4F7FC] mt-3">{loading ? '—' : (v as number)}</p>
              <p className="text-xs text-[#94A3B8] mt-1">{l as string}</p>
            </div>
          );
        })}
      </div>
      <div className="bg-[#08152F] border border-[#1E355B] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
 fix/traduction-pages-diverses
            <h2 className="text-base font-semibold text-white">{t('cg.dbState')}</h2>
            <p className="text-xs text-[#718096] mt-1">{t('cg.dbNote')}</p>
=======
            <h2 className="text-base font-semibold text-[#F4F7FC]">État des entreprises</h2>
            <p className="text-xs text-[#94A3B8] mt-1">
              Les échéances expirées sont automatiquement marquées comme expirées/suspendues lors du
              contrôle.
            </p>
 main
          </div>
          <Link
            href="/hidden-concepteur-gate/dashboard/company-applications"
            className="flex items-center gap-1 text-xs text-[#34D399]"
          >
            {t('cg.dbFiles')} <ArrowRight size={13} />
          </Link>
        </div>
        {suspended > 0 && (
 fix/traduction-pages-diverses
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-300">
            {t('cg.dbSuspN').replace('{n}', String(suspended))}
=======
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-400/30 text-sm text-red-300">
            {suspended} entreprise(s) actuellement suspendue(s).
 main
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
 fix/traduction-pages-diverses
              <tr className="border-b border-[#D4AF37]/10">
                {[
                  t('cg.dbColCo'),
                  t('cg.dbColSub'),
                  t('cg.dbColDue'),
                  t('cg.dbColPay'),
                  t('cg.dbColState'),
                ].map((h) => (
                  <th key={h} className="text-left text-xs text-[#718096] uppercase px-4 py-3">
=======
              <tr className="border-b border-[#1E355B]">
                {['Entreprise', 'Abonnement', 'Échéance', 'Paiement', 'État'].map((h) => (
                  <th key={h} className="text-left text-xs text-[#94A3B8] uppercase px-4 py-3">
 main
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E355B]">
              {rows.slice(0, 10).map((r) => (
                <tr key={r.organization_id}>
 fix/traduction-pages-diverses
                  <td className="px-4 py-3 text-sm text-white">{r.organization_name}</td>
                  <td className="px-4 py-3 text-sm text-[#A0AEC0]">{r.plan_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#A0AEC0]">
                    {r.expires_at ? new Date(r.expires_at).toLocaleDateString(locale) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#A0AEC0]">
                    {r.last_payment_status || t('cg.dbNone')}
=======
                  <td className="px-4 py-3 text-sm text-[#F4F7FC]">{r.organization_name}</td>
                  <td className="px-4 py-3 text-sm text-[#AFC0D8]">{r.plan_name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#AFC0D8]">
                    {r.expires_at ? new Date(r.expires_at).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#AFC0D8]">
                    {r.last_payment_status || 'Aucun'}
 main
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        r.organization_status === 'suspended' || r.subscription_status === 'expired'
                          ? 'text-red-400'
                          : 'text-emerald-300'
                      }
                    >
                      {r.organization_status === 'suspended' || r.subscription_status === 'expired'
                        ? t('cg.dbSusp')
                        : t('cg.dbOk')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
