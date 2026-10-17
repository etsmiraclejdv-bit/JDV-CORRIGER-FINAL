'use client';
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { fetchSales } from '@/lib/services/salesService';
import { fetchOrgProfile } from '@/lib/auth/context';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

interface Sale {
  id: string;
  amount_cents: number;
  status: string;
  sold_at: string;
  clients?: { full_name: string } | null;
  products?: { name: string } | null;
}

const STATUS_KEYS: Record<string, TerrainKey> = {
  completed: 'st.completed',
  pending: 'st.pending',
  cancelled: 'st.cancelled',
  draft: 'st.draft',
  active: 'st.active',
  paid: 'st.paid',
};

export default function TerrainVentesPage() {
  const { t, locale } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await fetchOrgProfile();
      if (profile?.organization_id && profile.prospecteur_id) {
        const { data: salesData } = await fetchSales(profile.organization_id, {
          prospecteurId: profile.prospecteur_id,
        });
        setSales((salesData as Sale[]) ?? []);
      }
      setLoading(false);
    });
  }, []);

  const filtered = sales.filter((s) => {
    if (!search) return true;
    return s.clients?.full_name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="p-5 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('tv.title')}</h1>
        <p className="text-sm text-[#A0AEC0] mt-1">
          {sales.length} {t(sales.length !== 1 ? 'tv.countN' : 'tv.count1')}
        </p>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('tv.search')}
          className="w-full bg-[#0F2347] border border-[#D4AF37]/20 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-[#718096] focus:outline-none focus:border-[#D4AF37]/60"
        />
      </div>

      <div className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#A0AEC0] text-sm">{t('tv.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart size={32} className="mx-auto mb-3 text-[#718096] opacity-50" />
            <p className="text-[#A0AEC0] text-sm">{t('tv.none')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#D4AF37]/5">
            {filtered.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-[#0A1628]/40 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {sale.clients?.full_name ?? t('tv.unknownClient')}
                  </p>
                  <p className="text-xs text-[#718096]">
                    {new Date(sale.sold_at).toLocaleDateString(locale)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold text-[#D4AF37]">
                    {new Intl.NumberFormat(locale, {
                      style: 'currency',
                      currency: 'XOF',
                      maximumFractionDigits: 0,
                    }).format((sale.amount_cents ?? 0) / 100)}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-lg ${sale.status === 'completed' || sale.status === 'encaissé' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}
                  >
                    {STATUS_KEYS[sale.status] ? t(STATUS_KEYS[sale.status]) : sale.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
