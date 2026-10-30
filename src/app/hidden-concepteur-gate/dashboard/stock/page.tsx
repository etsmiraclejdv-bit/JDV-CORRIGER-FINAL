'use client';
import React, { useState, useEffect } from 'react';
import { Package, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { toCents } from '@/lib/services/compat';

interface ProductRow {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  price_cents: number;
  created_at: string;
  organization_id: string;
  org_name?: string;
}

export default function SuperAdminStockPage() {
  const { t, locale } = useLanguage();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function loadProducts() {
    setLoading(true);
    const [{ data: arts }, { data: stocks }] = await Promise.all([
      supabase
        .from('articles')
        .select('id, name, code, cash_price, fixed_price, created_at, organization_id')
        .order('created_at', { ascending: false }),
      supabase.from('stocks').select('article_id, quantity'),
    ]);
    const qty = new Map<string, number>();
    ((stocks ?? []) as { article_id: string; quantity: number }[]).forEach((x) =>
      qty.set(x.article_id, (qty.get(x.article_id) ?? 0) + (x.quantity ?? 0))
    );
    const prods = ((arts ?? []) as Record<string, unknown>[]).map((a) => ({
      id: a.id as string,
      name: a.name as string,
      sku: a.code as string,
      stock_quantity: qty.get(a.id as string) ?? 0,
      price_cents: toCents(a.cash_price ?? a.fixed_price),
      created_at: a.created_at as string,
      organization_id: a.organization_id as string,
    }));

    if (prods.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const orgIds = [...new Set(prods.map((p) => p.organization_id))];
    const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds);
    const orgMap: Record<string, string> = {};
    (orgs ?? []).forEach((o) => {
      orgMap[o.id] = o.name;
    });

    setProducts(prods.map((p) => ({ ...p, org_name: orgMap[p.organization_id] ?? '—' })));
    setLoading(false);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.org_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(cents / 100);

  const lowStock = products.filter((p) => p.stock_quantity <= 5).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('cg.skTitle')}</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">
            {t('cg.skCount').replace('{n}', String(products.length))}
          </p>
        </div>
        <button
          onClick={loadProducts}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#8B5CF6]/20 text-[#A1A1AA] hover:text-white text-sm transition-colors"
        >
          <RefreshCw size={14} />
          {t('cg.refresh')}
        </button>
      </div>

      {lowStock > 0 && (
        <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
          <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-400">
            {t('cg.skLow').replace('{n}', String(lowStock))}
          </p>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('cg.skSearch')}
          className="w-full bg-[#0F2347] border border-[#8B5CF6]/20 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-[#71717A] text-sm focus:outline-none focus:border-[#8B5CF6]/60 transition-colors"
        />
      </div>

      <div className="bg-[#0F2347] border border-[#8B5CF6]/15 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-[#0A1628] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={32} className="text-[#71717A] mx-auto mb-3" />
            <p className="text-[#A1A1AA] text-sm">{t('cg.skNone')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#8B5CF6]/10">
                  <th className="text-left text-xs font-semibold text-[#71717A] uppercase tracking-wider px-6 py-4">
                    {t('cg.skColProd')}
                  </th>
                  <th className="text-left text-xs font-semibold text-[#71717A] uppercase tracking-wider px-6 py-4">
                    SKU
                  </th>
                  <th className="text-left text-xs font-semibold text-[#71717A] uppercase tracking-wider px-6 py-4">
                    {t('cg.dbColCo')}
                  </th>
                  <th className="text-left text-xs font-semibold text-[#71717A] uppercase tracking-wider px-6 py-4">
                    {t('cg.skColStock')}
                  </th>
                  <th className="text-left text-xs font-semibold text-[#71717A] uppercase tracking-wider px-6 py-4">
                    {t('cg.skColPrice')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8B5CF6]/5">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[#0A1628]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center">
                          <Package size={14} className="text-[#8B5CF6]" />
                        </div>
                        <span className="text-sm font-medium text-white">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#A1A1AA] font-mono">{p.sku}</td>
                    <td className="px-6 py-4 text-sm text-[#A1A1AA]">{p.org_name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-sm font-semibold ${p.stock_quantity <= 5 ? 'text-yellow-400' : 'text-white'}`}
                      >
                        {p.stock_quantity}
                        {p.stock_quantity <= 5 && (
                          <span className="ml-1 text-xs text-yellow-400">⚠</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8B5CF6] font-medium">
                      {formatPrice(p.price_cents)}
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
