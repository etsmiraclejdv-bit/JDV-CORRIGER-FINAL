'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BellRing,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Download,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShoppingCart,
  Smartphone,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Warehouse,
} from 'lucide-react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchClients, type Client } from '@/lib/services/clientsService';
import { fetchSales, type SaleView } from '@/lib/services/salesService';
import { fetchOrgProfile } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

type Period = '7' | '30' | '90';

const palette = {
  green: '#147866',
  greenLight: '#DCEFE8',
  orange: '#D58A1D',
  red: '#B94735',
  blue: '#39759A',
  ink: '#1D302D',
  muted: '#71807B',
  grid: '#E7E4D9',
};

const money = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(value);

const shortMoney = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function dateKey(value: string | Date) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export default function BusinessDashboardPage() {
  const { t, locale } = useLanguage();
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [sales, setSales] = useState<SaleView[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30');
  const [loadError, setLoadError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadDashboard = useCallback(async (organizationId: string) => {
    setLoadError(false);
    const [clientsResult, salesResult, orgResult] = await Promise.all([
      fetchClients(organizationId),
      fetchSales(organizationId),
      supabase.from('organizations').select('name').eq('id', organizationId).maybeSingle(),
    ]);
    if (clientsResult.error || salesResult.error) {
      setLoadError(true);
    } else {
      setClients(clientsResult.data ?? []);
      setSales(salesResult.data ?? []);
      setLastUpdated(new Date());
    }
    if (orgResult.data?.name) setOrgName(orgResult.data.name);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      if (!data.user) {
        setLoading(false);
        return;
      }
      const { data: profile } = await fetchOrgProfile();
      if (!active) return;
      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }
      setOrgId(profile.organization_id);
      await loadDashboard(profile.organization_id);
    }
    void initialize();

    return () => {
      active = false;
    };
  }, [loadDashboard]);

  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`business-dashboard-${orgId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales', filter: `organization_id=eq.${orgId}` },
        () => void loadDashboard(orgId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients', filter: `organization_id=eq.${orgId}` },
        () => void loadDashboard(orgId)
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orgId, loadDashboard]);

  const filteredSales = useMemo(() => {
    const cutoff = startOfDay(new Date());
    cutoff.setDate(cutoff.getDate() - Number(period) + 1);
    return sales.filter((sale) => {
      const date = new Date(sale.sold_at);
      return !Number.isNaN(date.getTime()) && date >= cutoff;
    });
  }, [sales, period]);

  const metrics = useMemo(() => {
    const revenueCents = filteredSales.reduce((sum, sale) => sum + (Number(sale.amount_cents) || 0), 0);
    const outstandingCents = clients.reduce((sum, client) => sum + (Number(client.balance_cents) || 0), 0);
    const overdueClients = clients.filter((client) => client.payment_status === 'en_retard');
    const salesToday = sales.filter((sale) => dateKey(sale.sold_at) === dateKey(new Date()));
    const revenueToday = salesToday.reduce((sum, sale) => sum + (Number(sale.amount_cents) || 0), 0);
    const creditSales = filteredSales.filter((sale) =>
      String(sale.sale_type ?? '').toLowerCase().includes('credit')
    );
    const cashSales = filteredSales.filter((sale) =>
      ['cash', 'comptant'].includes(String(sale.sale_type ?? '').toLowerCase())
    );
    return {
      revenueCents,
      outstandingCents,
      overdueClients,
      salesToday: salesToday.length,
      revenueToday,
      creditCount: creditSales.length,
      cashCount: cashSales.length,
    };
  }, [clients, filteredSales, sales]);

  const trendData = useMemo(() => {
    const days = Number(period);
    const now = startOfDay(new Date());
    const byDate = new Map<string, { date: string; ventes: number; count: number }>();
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - offset);
      const key = dateKey(date);
      byDate.set(key, {
        date: new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short' }).format(date),
        ventes: 0,
        count: 0,
      });
    }
    filteredSales.forEach((sale) => {
      const key = dateKey(sale.sold_at);
      const row = byDate.get(key);
      if (row) {
        row.ventes += (Number(sale.amount_cents) || 0) / 100;
        row.count += 1;
      }
    });
    return Array.from(byDate.values());
  }, [filteredSales, locale, period]);

  const clientStatusData = useMemo(() => {
    const rows = [
      { name: locale.startsWith('fr') ? 'À jour' : 'Up to date', value: 0, color: palette.green },
      { name: locale.startsWith('fr') ? 'À surveiller' : 'Watch', value: 0, color: palette.orange },
      { name: locale.startsWith('fr') ? 'En retard' : 'Overdue', value: 0, color: palette.red },
    ];
    clients.forEach((client) => {
      const index = client.payment_status === 'en_retard' ? 2 : client.payment_status === 'a_surveiller' ? 1 : 0;
      rows[index].value += 1;
    });
    return rows.filter((row) => row.value > 0);
  }, [clients, locale]);

  const periodLabel = period === '7' ? (locale.startsWith('fr') ? '7 derniers jours' : 'Last 7 days') : period === '30' ? (locale.startsWith('fr') ? '30 derniers jours' : 'Last 30 days') : (locale.startsWith('fr') ? '90 derniers jours' : 'Last 90 days');
  const fr = locale.startsWith('fr');
  const cardClass = 'rounded-2xl border border-[#E5E0D3] bg-[#FFFEFA] shadow-[0_2px_10px_rgba(44,56,44,0.025)]';
  const sectionTitleClass = 'text-base font-semibold tracking-tight text-[#20332F]';

  const handleExport = () => {
    const rows = [
      [fr ? 'Indicateur' : 'Metric', fr ? 'Valeur' : 'Value'],
      [fr ? 'Clients' : 'Customers', String(clients.length)],
      [fr ? 'Ventes sur la période (FCFA)' : 'Sales in period (XOF)', String(metrics.revenueCents / 100)],
      [fr ? 'Nombre de ventes sur la période' : 'Sales count in period', String(filteredSales.length)],
      [fr ? 'Clients en retard' : 'Overdue customers', String(metrics.overdueClients.length)],
      [fr ? 'Encours clients (FCFA)' : 'Customer balances (XOF)', String(metrics.outstandingCents / 100)],
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jdv-crm-tableau-de-bord.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-full bg-[#F7F4EB] px-4 py-6 text-[#20332F] sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-[1600px] space-y-7">
        <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F817B]">
              <span>{new Intl.DateTimeFormat(locale, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date())}</span>
              {orgName && <><span className="text-[#C9C4B7]">·</span><span>{orgName}</span></>}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#20332F] sm:text-3xl">
              {fr ? 'Bonjour, voici l’état de votre activité' : 'Here is your business overview'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#71807B]">
              {fr ? 'Les indicateurs de votre organisation, les points à surveiller et les actions à effectuer.' : 'Your organization metrics, items to watch, and next actions.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-[#E3DECF] bg-[#FFFEFA] p-1">
              {(['7', '30', '90'] as Period[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPeriod(value)}
                  aria-pressed={period === value}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${period === value ? 'bg-[#147866] text-white shadow-sm' : 'text-[#66756F] hover:bg-[#F1EFE6]'}`}
                >
                  {value === '7' ? (fr ? '7 jours' : '7 days') : value === '30' ? (fr ? '30 jours' : '30 days') : (fr ? '90 jours' : '90 days')}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => orgId && void loadDashboard(orgId)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E3DECF] bg-[#FFFEFA] px-3 text-sm font-medium text-[#435650] hover:bg-white" title={fr ? 'Actualiser' : 'Refresh'}>
              <RefreshCw size={15} />
              <span className="hidden sm:inline">{fr ? 'Actualiser' : 'Refresh'}</span>
            </button>
            <button type="button" onClick={handleExport} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E3DECF] bg-[#FFFEFA] px-3 text-sm font-semibold text-[#435650] hover:bg-white">
              <Download size={15} /> {fr ? 'Exporter' : 'Export'}
            </button>
            <Link href="/business/dashboard/ventes" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#147866] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0F6557]">
              <ShoppingCart size={16} /> {fr ? 'Enregistrer une vente' : 'Record a sale'}
            </Link>
          </div>
        </header>

        {loadError && (
          <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertTriangle size={18} />
            <span>{fr ? 'Certaines données n’ont pas pu être chargées. Vérifiez la connexion puis actualisez.' : 'Some data could not be loaded. Check your connection and refresh.'}</span>
          </div>
        )}

        <section aria-labelledby="overview-title" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="overview-title" className="text-xs font-bold uppercase tracking-[0.14em] text-[#7A8982]">{fr ? '01 · Vue générale' : '01 · Overview'}</h2>
            {lastUpdated && <span className="inline-flex items-center gap-1.5 text-xs text-[#71807B]"><span className="h-2 w-2 rounded-full bg-emerald-500" />{fr ? 'Mis à jour' : 'Updated'} {new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(lastUpdated)}</span>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            <Link href="/business/dashboard/clients" className={`${cardClass} group p-5 transition hover:-translate-y-0.5 hover:shadow-md`}>
              <div className="flex items-start justify-between">
                <span className="text-sm text-[#71807B]">{fr ? 'Clients enregistrés' : 'Registered customers'}</span>
                <span className="rounded-xl bg-[#E5F2EC] p-2.5 text-[#147866]"><Users size={19} /></span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <strong className="text-3xl font-bold tabular-nums">{loading ? '—' : clients.length.toLocaleString(locale)}</strong>
                <span className="mb-1 text-xs text-[#147866]">{fr ? 'Voir les clients' : 'View customers'} <ArrowRight className="ml-1 inline" size={13} /></span>
              </div>
            </Link>
            <Link href="/business/dashboard/ventes" className={`${cardClass} group p-5 transition hover:-translate-y-0.5 hover:shadow-md`}>
              <div className="flex items-start justify-between">
                <span className="text-sm text-[#71807B]">{fr ? 'Ventes · ' : 'Sales · '}{periodLabel}</span>
                <span className="rounded-xl bg-[#E5F2EC] p-2.5 text-[#147866]"><Wallet size={19} /></span>
              </div>
              <div className="mt-4 text-2xl font-bold tabular-nums sm:text-3xl">{loading ? '—' : money(metrics.revenueCents / 100, locale)}</div>
              <p className="mt-2 text-xs text-[#71807B]">{filteredSales.length.toLocaleString(locale)} {fr ? 'vente(s) enregistrée(s)' : 'sale(s) recorded'}</p>
            </Link>
            <Link href="/business/dashboard/clients" className={`${cardClass} group p-5 transition hover:-translate-y-0.5 hover:shadow-md`}>
              <div className="flex items-start justify-between">
                <span className="text-sm text-[#71807B]">{fr ? 'Encours clients' : 'Customer balances'}</span>
                <span className="rounded-xl bg-[#FFF0D9] p-2.5 text-[#B97813]"><CreditCard size={19} /></span>
              </div>
              <div className="mt-4 text-2xl font-bold tabular-nums sm:text-3xl">{loading ? '—' : money(metrics.outstandingCents / 100, locale)}</div>
              <p className="mt-2 text-xs text-[#B97813]">{fr ? 'Soldes calculés depuis les dossiers clients' : 'Calculated from customer records'}</p>
            </Link>
            <Link href="/business/dashboard/clients" className={`${cardClass} group p-5 transition hover:-translate-y-0.5 hover:shadow-md`}>
              <div className="flex items-start justify-between">
                <span className="text-sm text-[#71807B]">{fr ? 'Clients en retard' : 'Overdue customers'}</span>
                <span className="rounded-xl bg-[#FBE8E3] p-2.5 text-[#B94735]"><AlertTriangle size={19} /></span>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <strong className="text-3xl font-bold tabular-nums">{loading ? '—' : metrics.overdueClients.length.toLocaleString(locale)}</strong>
                <span className="mb-1 text-xs text-[#B94735]">{fr ? 'À vérifier' : 'Needs review'} <ArrowRight className="ml-1 inline" size={13} /></span>
              </div>
            </Link>
          </div>
        </section>

        <section aria-labelledby="analysis-title" className="space-y-3">
          <h2 id="analysis-title" className="text-xs font-bold uppercase tracking-[0.14em] text-[#7A8982]">{fr ? '02 · Analyse et urgences' : '02 · Analytics and alerts'}</h2>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(300px,0.9fr)]">
            <div className={`${cardClass} min-w-0 p-5 sm:p-6`}>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className={sectionTitleClass}>{fr ? 'Évolution des ventes' : 'Sales over time'}</h3>
                  <p className="mt-1 text-sm text-[#71807B]">{fr ? 'Montant des ventes enregistrées, par jour' : 'Recorded sales amount by day'}</p>
                </div>
                <span className="rounded-lg bg-[#EAF3EE] px-2.5 py-1.5 text-xs font-semibold text-[#147866]">{periodLabel}</span>
              </div>
              <div className="h-[260px] w-full">
                {filteredSales.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-[#71807B]">
                    <BarChart3 size={26} className="text-[#A7B6AE]" />
                    {loading ? (fr ? 'Chargement des ventes…' : 'Loading sales…') : (fr ? 'Aucune vente enregistrée sur cette période.' : 'No sales recorded in this period.')}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="jdvSalesFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={palette.green} stopOpacity={0.24} />
                          <stop offset="95%" stopColor={palette.green} stopOpacity={0.015} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={palette.grid} strokeDasharray="3 4" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: palette.muted, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={18} />
                      <YAxis tick={{ fill: palette.muted, fontSize: 11 }} axisLine={false} tickLine={false} width={58} tickFormatter={(value: number) => shortMoney(value, locale)} />
                      <Tooltip formatter={(value) => money(Number(value), locale)} contentStyle={{ borderRadius: 12, borderColor: palette.grid, fontSize: 12 }} />
                      <Area type="monotone" dataKey="ventes" name={fr ? 'Ventes (FCFA)' : 'Sales (XOF)'} stroke={palette.green} strokeWidth={2.5} fill="url(#jdvSalesFill)" activeDot={{ r: 5 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#EEE9DE] pt-4 text-xs text-[#71807B]">
                <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#147866]" />{fr ? 'Montant des ventes' : 'Sales amount'}</span>
                <span className="inline-flex items-center gap-2"><Activity size={14} />{metrics.salesToday} {fr ? 'vente(s) aujourd’hui' : 'sale(s) today'}</span>
              </div>
            </div>

            <aside className={`${cardClass} overflow-hidden`}>
              <div className="flex items-start justify-between border-b border-[#EAE5D9] p-5">
                <div>
                  <h3 className={sectionTitleClass}>{fr ? 'À traiter en priorité' : 'Priority actions'}</h3>
                  <p className="mt-1 text-sm text-[#71807B]">{fr ? 'Accès direct aux dossiers à vérifier' : 'Quick access to items needing review'}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#F0D0C6] bg-[#FFF2ED] px-2.5 py-1 text-xs font-semibold text-[#B94735]"><AlertTriangle size={12} />{metrics.overdueClients.length}</span>
              </div>
              <div className="space-y-3 p-4">
                <Link href="/business/dashboard/clients" className="flex gap-3 rounded-xl border border-[#EEE5D8] p-3.5 transition hover:border-[#D9B4A7] hover:bg-[#FFFAF6]">
                  <span className="mt-0.5 rounded-lg bg-[#FBE8E3] p-2 text-[#B94735]"><CircleDollarSign size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm font-semibold text-[#273A35]">{fr ? 'Clients en retard de paiement' : 'Overdue customer payments'}</strong>
                    <span className="mt-1 block text-xs leading-5 text-[#71807B]">{loading ? '—' : metrics.overdueClients.length} {fr ? 'dossier(s) à examiner dans les clients' : 'record(s) to review in customers'}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#147866]">{fr ? 'Ouvrir les clients' : 'Open customers'} <ArrowRight size={13} /></span>
                  </span>
                </Link>
                <Link href="/business/dashboard/stock" className="flex gap-3 rounded-xl border border-[#EEE5D8] p-3.5 transition hover:border-[#E3C99E] hover:bg-[#FFFCF5]">
                  <span className="mt-0.5 rounded-lg bg-[#FFF0D9] p-2 text-[#B97813]"><Package size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm font-semibold text-[#273A35]">{fr ? 'Contrôler les niveaux de stock' : 'Check stock levels'}</strong>
                    <span className="mt-1 block text-xs leading-5 text-[#71807B]">{fr ? 'Consultez les quantités disponibles et les seuils dans le module Stock.' : 'Review available quantities and thresholds in Inventory.'}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#147866]">{fr ? 'Ouvrir le stock' : 'Open inventory'} <ArrowRight size={13} /></span>
                  </span>
                </Link>
                <Link href="/business/dashboard/relances" className="flex gap-3 rounded-xl border border-[#EEE5D8] p-3.5 transition hover:border-[#C7DCD3] hover:bg-[#F7FCF8]">
                  <span className="mt-0.5 rounded-lg bg-[#E5F2EC] p-2 text-[#147866]"><BellRing size={18} /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm font-semibold text-[#273A35]">{fr ? 'Relances commerciales' : 'Sales follow-ups'}</strong>
                    <span className="mt-1 block text-xs leading-5 text-[#71807B]">{fr ? 'Consultez les suivis et échéances enregistrés.' : 'Review recorded follow-ups and due dates.'}</span>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#147866]">{fr ? 'Voir les relances' : 'View follow-ups'} <ArrowRight size={13} /></span>
                  </span>
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <section aria-labelledby="operations-title" className="space-y-3">
          <h2 id="operations-title" className="text-xs font-bold uppercase tracking-[0.14em] text-[#7A8982]">{fr ? '03 · Prospection et logistique' : '03 · Sales pipeline and logistics'}</h2>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className={`${cardClass} min-w-0 p-5 sm:p-6`}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className={sectionTitleClass}>{fr ? 'Situation des comptes clients' : 'Customer account status'}</h3>
                  <p className="mt-1 text-sm text-[#71807B]">{fr ? 'Répartition calculée depuis les dossiers clients' : 'Distribution calculated from customer records'}</p>
                </div>
                <Link href="/business/dashboard/clients" className="shrink-0 text-xs font-semibold text-[#147866] hover:underline">{fr ? 'Détails' : 'Details'} <ArrowRight className="ml-1 inline" size={13} /></Link>
              </div>
              <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(120px,0.9fr)]">
                <div className="h-[190px] min-w-0">
                  {clients.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-[#71807B]">{loading ? (fr ? 'Chargement…' : 'Loading…') : (fr ? 'Aucun client enregistré.' : 'No customers recorded.')}</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={clientStatusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="none">
                          {clientStatusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: 12, borderColor: palette.grid, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="space-y-3">
                  {[
                    { label: fr ? 'À jour' : 'Up to date', value: clients.filter((client) => client.payment_status === 'a_jour').length, color: palette.green },
                    { label: fr ? 'À surveiller' : 'Watch', value: clients.filter((client) => client.payment_status === 'a_surveiller').length, color: palette.orange },
                    { label: fr ? 'En retard' : 'Overdue', value: metrics.overdueClients.length, color: palette.red },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 text-[#71807B]"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.label}</span>
                      <strong className="tabular-nums text-[#273A35]">{loading ? '—' : item.value}</strong>
                    </div>
                  ))}
                  <div className="border-t border-[#EEE9DE] pt-3 text-xs text-[#71807B]">{fr ? 'Total : ' : 'Total: '}{loading ? '—' : clients.length} {fr ? 'clients' : 'customers'}</div>
                </div>
              </div>
            </div>

            <div className={`${cardClass} min-w-0 p-5 sm:p-6`}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className={sectionTitleClass}>{fr ? 'Activité commerciale par jour' : 'Daily sales activity'}</h3>
                  <p className="mt-1 text-sm text-[#71807B]">{fr ? 'Nombre de ventes enregistrées sur la période' : 'Number of sales recorded during the period'}</p>
                </div>
                <span className="rounded-lg bg-[#F0F3F8] p-2 text-[#39759A]"><BarChart3 size={18} /></span>
              </div>
              <div className="h-[220px] w-full">
                {filteredSales.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-[#71807B]">{loading ? (fr ? 'Chargement…' : 'Loading…') : (fr ? 'Les ventes apparaîtront ici dès leur enregistrement.' : 'Sales will appear here when recorded.')}</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                      <CartesianGrid stroke={palette.grid} strokeDasharray="3 4" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: palette.muted, fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={18} />
                      <YAxis allowDecimals={false} tick={{ fill: palette.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 12, borderColor: palette.grid, fontSize: 12 }} />
                      <Bar dataKey="count" name={fr ? 'Nombre de ventes' : 'Sales count'} fill={palette.orange} radius={[4, 4, 0, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#EEE9DE] pt-3 text-xs text-[#71807B]">
                <span>{fr ? 'Comptant identifié' : 'Cash identified'} : {metrics.cashCount}</span>
                <span>{fr ? 'Crédit identifié' : 'Credit identified'} : {metrics.creditCount}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Link href="/business/dashboard/prospects" className={`${cardClass} flex items-center gap-3 p-4 transition hover:border-[#C9DAD2] hover:shadow-sm`}>
              <span className="rounded-xl bg-[#E5F2EC] p-3 text-[#147866]"><Target size={20} /></span>
              <span className="min-w-0 flex-1"><strong className="block text-sm">{fr ? 'Pipeline des prospects' : 'Prospect pipeline'}</strong><span className="mt-1 block text-xs text-[#71807B]">{fr ? 'Étapes et suivi commercial' : 'Stages and sales follow-up'}</span></span>
              <ArrowRight size={16} className="text-[#84938C]" />
            </Link>
            <Link href="/business/dashboard/stock" className={`${cardClass} flex items-center gap-3 p-4 transition hover:border-[#C9DAD2] hover:shadow-sm`}>
              <span className="rounded-xl bg-[#FFF0D9] p-3 text-[#B97813]"><Package size={20} /></span>
              <span className="min-w-0 flex-1"><strong className="block text-sm">{fr ? 'Articles et stocks' : 'Products and stock'}</strong><span className="mt-1 block text-xs text-[#71807B]">{fr ? 'Disponibilités et seuils' : 'Availability and thresholds'}</span></span>
              <ArrowRight size={16} className="text-[#84938C]" />
            </Link>
            <Link href="/business/dashboard/entrepots" className={`${cardClass} flex items-center gap-3 p-4 transition hover:border-[#C9DAD2] hover:shadow-sm`}>
              <span className="rounded-xl bg-[#F0F3F8] p-3 text-[#39759A]"><Warehouse size={20} /></span>
              <span className="min-w-0 flex-1"><strong className="block text-sm">{fr ? 'Stocks par entrepôt' : 'Stock by warehouse'}</strong><span className="mt-1 block text-xs text-[#71807B]">{fr ? 'Entrepôts et sous-entrepôts' : 'Warehouses and sub-warehouses'}</span></span>
              <ArrowRight size={16} className="text-[#84938C]" />
            </Link>
            <Link href="/business/dashboard/mouvements-stock" className={`${cardClass} flex items-center gap-3 p-4 transition hover:border-[#C9DAD2] hover:shadow-sm`}>
              <span className="rounded-xl bg-[#E5F2EC] p-3 text-[#147866]"><Search size={20} /></span>
              <span className="min-w-0 flex-1"><strong className="block text-sm">{fr ? 'Traçabilité des mouvements' : 'Movement traceability'}</strong><span className="mt-1 block text-xs text-[#71807B]">{fr ? 'Retrouver un code de produit' : 'Track a product code'}</span></span>
              <ArrowRight size={16} className="text-[#84938C]" />
            </Link>
          </div>
          <div className={`${cardClass} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-[#FFF0D9] p-3 text-[#B97813]"><TrendingUp size={20} /></span>
              <div><h3 className={sectionTitleClass}>{fr ? 'Performance des prospecteurs' : 'Prospector performance'}</h3><p className="mt-1 text-sm text-[#71807B]">{fr ? 'Consultez les visites, ventes et objectifs dans le module de suivi des équipes.' : 'Review visits, sales and targets in the team tracking module.'}</p></div>
            </div>
            <Link href="/business/dashboard/suivi-prospecteurs" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#DCD8CC] px-4 py-2.5 text-sm font-semibold text-[#435650] hover:bg-[#F8F6EF]">{fr ? 'Voir les performances' : 'View performance'} <ArrowRight size={15} /></Link>
          </div>
        </section>

        <section aria-labelledby="followups-title" className="space-y-3">
          <h2 id="followups-title" className="text-xs font-bold uppercase tracking-[0.14em] text-[#7A8982]">{fr ? '04 · Actions commerciales' : '04 · Sales actions'}</h2>
          <div className={`${cardClass} overflow-hidden`}>
            <div className="flex flex-col gap-3 border-b border-[#EAE5D9] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h3 className={sectionTitleClass}>{fr ? 'Relances et tâches commerciales' : 'Follow-ups and sales tasks'}</h3>
                <p className="mt-1 text-sm text-[#71807B]">{fr ? 'Accédez à la liste opérationnelle pour traiter les rappels, les échéances et les prospects prioritaires.' : 'Open the operational list to manage reminders, due dates and priority prospects.'}</p>
              </div>
              <Link href="/business/dashboard/relances" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#147866] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0F6557]"><CalendarClock size={16} />{fr ? 'Ouvrir les relances' : 'Open follow-ups'} <ArrowRight size={15} /></Link>
            </div>
            <div className="grid grid-cols-1 divide-y divide-[#EEE9DE] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <Link href="/business/dashboard/relances" className="flex items-center gap-3 p-5 hover:bg-[#FAF8F1]">
                <span className="rounded-xl bg-[#E5F2EC] p-2.5 text-[#147866]"><Phone size={18} /></span>
                <span><strong className="block text-sm">{fr ? 'Appeler un prospect' : 'Call a prospect'}</strong><span className="mt-1 block text-xs text-[#71807B]">{fr ? 'Depuis la fiche de relance' : 'From a follow-up record'}</span></span>
              </Link>
              <Link href="/business/dashboard/relances" className="flex items-center gap-3 p-5 hover:bg-[#FAF8F1]">
                <span className="rounded-xl bg-[#FFF0D9] p-2.5 text-[#B97813]"><CalendarClock size={18} /></span>
                <span><strong className="block text-sm">{fr ? 'Planifier un rappel' : 'Schedule a reminder'}</strong><span className="mt-1 block text-xs text-[#71807B]">{fr ? 'Fixer une échéance' : 'Set a due date'}</span></span>
              </Link>
              <Link href="/business/dashboard/prospects" className="flex items-center gap-3 p-5 hover:bg-[#FAF8F1]">
                <span className="rounded-xl bg-[#F0F3F8] p-2.5 text-[#39759A]"><ClipboardList size={18} /></span>
                <span><strong className="block text-sm">{fr ? 'Mettre à jour un prospect' : 'Update a prospect'}</strong><span className="mt-1 block text-xs text-[#71807B]">{fr ? 'Ajouter le résultat du contact' : 'Record the contact outcome'}</span></span>
              </Link>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-[#E5E0D3] pt-4 text-xs text-[#829089] sm:flex-row sm:items-center sm:justify-between">
          <span>{fr ? 'Les indicateurs sont calculés à partir des données accessibles à votre organisation.' : 'Metrics are calculated from data accessible to your organization.'}</span>
          <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} />{fr ? 'Vue organisationnelle' : 'Organization-scoped view'}</span>
        </footer>
      </div>
    </div>
  );
}
