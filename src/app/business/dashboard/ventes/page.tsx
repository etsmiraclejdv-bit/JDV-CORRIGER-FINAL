'use client';
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { fetchSales } from '@/lib/services/salesService';
import Link from 'next/link';
import { fetchOrgProfile } from '@/lib/auth/context';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

interface Sale {
  id: string;
  organization_id: string;
  client_id?: string;
  prospecteur_id?: string;
  product_id?: string;
  amount_cents: number;
  status: string;
  sold_at: string;
  clients?: { id: string; full_name: string; phone?: string } | null;
  profiles?: { id: string; full_name: string } | null;
  products?: { id: string; name: string; sku: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  encaissé: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export default function BusinessVentesPage() {
  const { t, locale } = useLanguage();
  const statusLabel = (s: string) =>
    ['pending', 'active', 'completed', 'cancelled', 'encaissé'].includes(s)
      ? t(('bz.vl.' + s) as TerrainKey)
      : s;
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await fetchOrgProfile();
      if (profile?.organization_id) {
        setOrgId(profile.organization_id);
        const { data: salesData, error: salesError } = await fetchSales(profile.organization_id, {
          status: statusFilter || undefined,
        });
        if (salesError) setError(salesError.message);
        else setSales((salesData as Sale[]) ?? []);
        setLoading(false);
      }
    });
  }, [statusFilter]);

  const filtered = sales.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.clients?.full_name?.toLowerCase().includes(q) ||
      s.products?.name?.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
  });

  const totalRevenue = sales.reduce((sum, s) => sum + (s.amount_cents ?? 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('bz.vTitle')}</h1>
          <p className="text-sm text-[#A0AEC0] mt-1">{t('bz.vSub')}</p>
        </div>
        <Link
          href="/business/dashboard/ventes/new"
          className="flex items-center gap-2 btn-gold px-4 py-2.5 rounded-xl text-sm font-bold"
        >
          <Plus size={14} />
          {t('bz.vNew')}
        </Link>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0F2347] border border-[#34D399]/20 rounded-2xl p-4">
          <p className="text-xs text-[#A0AEC0] mb-1">{t('bz.vKpiTotal')}</p>
          <p className="text-2xl font-bold text-white">{sales.length}</p>
        </div>
        <div className="bg-[#0F2347] border border-[#34D399]/20 rounded-2xl p-4">
          <p className="text-xs text-[#A0AEC0] mb-1">{t('bz.vKpiRevenue')}</p>
          <p className="text-2xl font-bold text-[#34D399]">
            {new Intl.NumberFormat(locale, {
              style: 'currency',
              currency: 'XOF',
              maximumFractionDigits: 0,
            }).format(totalRevenue / 100)}
          </p>
        </div>
        <div className="bg-[#0F2347] border border-[#34D399]/20 rounded-2xl p-4">
          <p className="text-xs text-[#A0AEC0] mb-1">{t('bz.vKpiPending')}</p>
          <p className="text-2xl font-bold text-yellow-400">
            {sales.filter((s) => s.status === 'pending').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('bz.vSearchPh')}
            className="w-full bg-[#0F2347] border border-[#34D399]/20 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-[#718096] focus:outline-none focus:border-[#34D399]/60"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#0F2347] border border-[#34D399]/20 rounded-xl px-3 py-2.5 text-[#A0AEC0] text-sm focus:outline-none focus:border-[#34D399]/60"
        >
          <option value="">{t('bz.vAllStatus')}</option>
          <option value="pending">{statusLabel('pending')}</option>
          <option value="active">{statusLabel('active')}</option>
          <option value="completed">{statusLabel('completed')}</option>
          <option value="cancelled">{statusLabel('cancelled')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0F2347] border border-[#34D399]/20 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#A0AEC0] text-sm">{t('bz.vLoading')}</div>
        ) : error ? (
          <div className="py-16 text-center text-red-400 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart size={32} className="mx-auto mb-3 text-[#718096] opacity-50" />
            <p className="text-[#A0AEC0] text-sm">{t('bz.vNone')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#34D399]/10">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    {t('bz.vColClient')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    {t('bz.vColProduct')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    {t('bz.vColAmount')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    {t('bz.puColStatus')}
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase tracking-wider">
                    {t('bz.puColDate')}
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b border-[#34D399]/5 hover:bg-[#0A1628]/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-white">
                        {sale.clients?.full_name ?? '—'}
                      </p>
                      <p className="text-xs text-[#718096]">{sale.clients?.phone ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#A0AEC0]">
                      {sale.products?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#34D399]">
                      {new Intl.NumberFormat(locale, {
                        style: 'currency',
                        currency: 'XOF',
                        maximumFractionDigits: 0,
                      }).format((sale.amount_cents ?? 0) / 100)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${STATUS_COLORS[sale.status] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
                      >
                        {statusLabel(sale.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#718096]">
                      {new Date(sale.sold_at).toLocaleDateString(locale)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/business/dashboard/ventes/${sale.id}`}
                        className="p-1.5 rounded-lg text-[#718096] hover:text-[#34D399] hover:bg-[#34D399]/10 transition-all inline-flex"
                      >
                        <Eye size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
