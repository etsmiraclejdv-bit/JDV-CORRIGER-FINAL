'use client';
import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle, RefreshCw, Database, Activity, Server } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

interface TableStat {
  name: string;
  label: string;
  count: number;
  icon: React.ReactNode;
}

export default function SuperAdminMaintenancePage() {
  const { t, locale } = useLanguage();
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [supabaseOk, setSupabaseOk] = useState<boolean | null>(null);

  async function runHealthCheck() {
    setLoading(true);
    try {
      const [orgsRes, profilesRes, clientsRes, salesRes, paymentsRes, productsRes] =
        await Promise.all([
          supabase.from('organizations').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('clients').select('id', { count: 'exact', head: true }),
          supabase.from('sales').select('id', { count: 'exact', head: true }),
          supabase.from('payments').select('id', { count: 'exact', head: true }),
          supabase.from('articles').select('id', { count: 'exact', head: true }),
        ]);

      setTableCounts({
        organizations: orgsRes.count ?? 0,
        profiles: profilesRes.count ?? 0,
        clients: clientsRes.count ?? 0,
        sales: salesRes.count ?? 0,
        payments: paymentsRes.count ?? 0,
        products: productsRes.count ?? 0,
      });
      setSupabaseOk(!orgsRes.error);
      setLastChecked(new Date());
    } catch {
      setSupabaseOk(false);
    }
    setLoading(false);
  }

  useEffect(() => {
    runHealthCheck();
  }, []);

  const tables: TableStat[] = [
    {
      name: 'organizations',
      label: t('cg.mtOrgs'),
      count: tableCounts.organizations ?? 0,
      icon: <Database size={16} className="text-[#D4AF37]" />,
    },
    {
      name: 'profiles',
      label: t('cg.mtProfiles'),
      count: tableCounts.profiles ?? 0,
      icon: <Database size={16} className="text-blue-400" />,
    },
    {
      name: 'clients',
      label: t('cg.mtClients'),
      count: tableCounts.clients ?? 0,
      icon: <Database size={16} className="text-green-400" />,
    },
    {
      name: 'sales',
      label: t('cg.mtSales'),
      count: tableCounts.sales ?? 0,
      icon: <Database size={16} className="text-purple-400" />,
    },
    {
      name: 'payments',
      label: t('cg.mtPayments'),
      count: tableCounts.payments ?? 0,
      icon: <Database size={16} className="text-pink-400" />,
    },
    {
      name: 'products',
      label: t('cg.mtProducts'),
      count: tableCounts.products ?? 0,
      icon: <Database size={16} className="text-orange-400" />,
    },
  ];

  const services = [
    { name: t('cg.mtDb'), status: supabaseOk, description: t('cg.mtPg') },
    { name: t('cg.mtAuth'), status: supabaseOk, description: 'Supabase Auth' },
    {
      name: 'Edge Functions',
      status: false,
      description: t('cg.mtEdgeDesc'),
    },
    { name: t('cg.mtWebhook'), status: true, description: t('cg.mtWebhookDesc') },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('cg.mtTitle')}</h1>
          <p className="text-sm text-[#A0AEC0] mt-1">
            {lastChecked
              ? t('cg.mtLast').replace('{time}', lastChecked.toLocaleTimeString(locale))
              : t('cg.mtChecking')}
          </p>
        </div>
        <button
          onClick={runHealthCheck}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D4AF37]/20 text-[#A0AEC0] hover:text-white text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {t('cg.mtCheck')}
        </button>
      </div>

      {/* Services health */}
      <div className="bg-[#0F2347] border border-[#D4AF37]/15 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Activity size={18} className="text-[#D4AF37]" />
          <h2 className="text-base font-semibold text-white">{t('cg.mtServices')}</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((svc, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-[#0A1628] rounded-xl">
              <div>
                <p className="text-sm font-medium text-white">{svc.name}</p>
                <p className="text-xs text-[#718096]">{svc.description}</p>
              </div>
              {loading ? (
                <div className="w-4 h-4 rounded-full bg-[#718096] animate-pulse" />
              ) : (
                <div
                  className={`flex items-center gap-1.5 text-xs ${svc.status ? 'text-green-400' : 'text-red-400'}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${svc.status ? 'bg-green-400' : 'bg-red-400'}`}
                  />
                  {svc.status ? 'OK' : t('cg.mtErr')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Database stats */}
      <div className="bg-[#0F2347] border border-[#D4AF37]/15 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Server size={18} className="text-[#D4AF37]" />
          <h2 className="text-base font-semibold text-white">{t('cg.mtDbStats')}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {tables.map((tb) => (
            <div key={tb.name} className="p-4 bg-[#0A1628] rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                {tb.icon}
                <span className="text-xs text-[#718096]">{tb.label}</span>
              </div>
              {loading ? (
                <div className="h-7 w-12 bg-[#0F2347] rounded animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-white">{tb.count.toLocaleString(locale)}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-[#0F2347] border border-[#D4AF37]/15 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wrench size={18} className="text-[#D4AF37]" />
          <h2 className="text-base font-semibold text-white">{t('cg.mtInfo')}</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: t('cg.mtFramework'), value: 'Next.js 15 (App Router)' },
            { label: t('cg.mtDb'), value: 'Supabase PostgreSQL' },
            { label: t('cg.mtAuth'), value: t('cg.mtEmailAuth') },
            { label: t('cg.mtPayLabel'), value: 'FedaPay (webhook HMAC-SHA256)' },
            { label: t('cg.mtMail'), value: 'Resend via Edge Function' },
            {
              label: t('cg.mtUrl'),
              value: process.env.NEXT_PUBLIC_SITE_URL || t('cg.mtNoUrl'),
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[#0A1628] rounded-xl">
              <span className="text-sm text-[#718096]">{item.label}</span>
              <span className="text-sm text-white font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
        <p className="text-sm text-green-400">{t('cg.mtNone')}</p>
      </div>
    </div>
  );
}
