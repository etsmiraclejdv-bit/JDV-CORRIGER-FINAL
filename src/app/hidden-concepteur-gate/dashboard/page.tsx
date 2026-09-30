'use client';
import React, { useState, useEffect } from 'react';
import { Building2, Users, ShoppingCart, Wallet, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { saleTotal, toCents } from '@/lib/services/compat';

interface PlatformStats {
  totalOrgs: number;
  activeOrgs: number;
  suspendedOrgs: number;
  totalProfiles: number;
  totalSales: number;
  totalRevenueCents: number;
}

interface OrgRow {
  id: string;
  name: string;
  city: string | null;
  status: string;
  created_at: string;
}

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats>({
    totalOrgs: 0, activeOrgs: 0, suspendedOrgs: 0,
    totalProfiles: 0, totalSales: 0, totalRevenueCents: 0,
  });
  const [recentOrgs, setRecentOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [orgsRes, profilesRes, salesRes] = await Promise.all([
        supabase.from('organizations').select('id, name, city, status, created_at').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('sales').select('sale_type, cash_price, credit_price, fixed_price, quantity'),
      ]);

      const orgs: OrgRow[] = orgsRes.data ?? [];
      const totalRevenueCents = ((salesRes.data ?? []) as Record<string, unknown>[]).reduce((sum, s) => sum + toCents(saleTotal(s as never)), 0);

      setStats({
        totalOrgs: orgs.length,
        activeOrgs: orgs.filter(o => o.status === 'active').length,
        suspendedOrgs: orgs.filter(o => o.status !== 'active').length,
        totalProfiles: profilesRes.count ?? 0,
        totalSales: (salesRes.data ?? []).length,
        totalRevenueCents,
      });
      setRecentOrgs(orgs.slice(0, 5));
      setLoading(false);
    }
    load();
  }, []);

  const formatAmount = (cents: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(cents / 100);

  const kpis = [
    { label: 'Entreprises actives', value: loading ? '—' : stats.activeOrgs, icon: <Building2 size={20} />, color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10' },
    { label: 'Utilisateurs inscrits', value: loading ? '—' : stats.totalProfiles, icon: <Users size={20} />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Ventes totales', value: loading ? '—' : stats.totalSales, icon: <ShoppingCart size={20} />, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Chiffre d\'affaires', value: loading ? '—' : formatAmount(stats.totalRevenueCents), icon: <Wallet size={20} />, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Vue d&apos;ensemble Plateforme</h1>
        <p className="text-sm text-[#A0AEC0] mt-1">Supervision globale de JDV CRM</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-[#0F2347] border border-[#D4AF37]/15 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center mb-3 ${kpi.color}`}>
              {kpi.icon}
            </div>
            <p className="text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-xs text-[#718096] mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Platform health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F2347] border border-[#D4AF37]/15 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Statut des entreprises</h2>
            <Link href="/hidden-concepteur-gate/dashboard/companies" className="text-xs text-[#D4AF37] hover:underline">
              Voir tout →
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#0A1628] rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-sm text-[#A0AEC0]">Actives</span>
              </div>
              <span className="text-sm font-bold text-white">{loading ? '—' : stats.activeOrgs}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#0A1628] rounded-xl">
              <div className="flex items-center gap-2">
                <XCircle size={16} className="text-red-400" />
                <span className="text-sm text-[#A0AEC0]">Suspendues</span>
              </div>
              <span className="text-sm font-bold text-white">{loading ? '—' : stats.suspendedOrgs}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#0A1628] rounded-xl">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-[#D4AF37]" />
                <span className="text-sm text-[#A0AEC0]">Total</span>
              </div>
              <span className="text-sm font-bold text-white">{loading ? '—' : stats.totalOrgs}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0F2347] border border-[#D4AF37]/15 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Entreprises récentes</h2>
            <Link href="/hidden-concepteur-gate/dashboard/companies" className="text-xs text-[#D4AF37] hover:underline">
              Gérer →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-[#0A1628] rounded-xl animate-pulse" />)}
            </div>
          ) : recentOrgs.length === 0 ? (
            <p className="text-sm text-[#718096] text-center py-4">Aucune entreprise enregistrée</p>
          ) : (
            <div className="space-y-2">
              {recentOrgs.map(org => (
                <div key={org.id} className="flex items-center justify-between p-3 bg-[#0A1628] rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-white">{org.name}</p>
                    <p className="text-xs text-[#718096]">{org.city ?? '—'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-lg ${
                    org.status === 'active' ?'bg-green-500/20 text-green-400 border border-green-500/30' :'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {org.status === 'active' ? 'Active' : 'Suspendue'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
