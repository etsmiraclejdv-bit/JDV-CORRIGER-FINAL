'use client';
import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingDown, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { fetchProducts } from '@/lib/services/catalogueService';
import Link from 'next/link';
import { fetchOrgProfile } from '@/lib/auth/context';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  price_cents: number;
}

export default function BusinessStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await fetchOrgProfile();
      if (profile?.organization_id) {
        setOrgId(profile.organization_id);
        loadStock(profile.organization_id);
      }
    });
  }, []);

  async function loadStock(oid: string) {
    setLoading(true);
    const { data } = await fetchProducts(oid);
    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }

  const lowStock = products.filter(p => p.stock_quantity <= 5 && p.stock_quantity > 0);
  const outOfStock = products.filter(p => p.stock_quantity <= 0);
  const inStock = products.filter(p => p.stock_quantity > 5);

  const fmt = (cents: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(cents / 100);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Stock</h1>
          <p className="text-sm text-[#A0AEC0] mt-1">{products.length} article{products.length !== 1 ? 's' : ''} au catalogue</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => orgId && loadStock(orgId)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D4AF37]/20 text-[#A0AEC0] hover:text-white text-sm transition-colors">
            <RefreshCw size={14} />
            Actualiser
          </button>
          <Link href="/business/dashboard/catalogue" className="flex items-center gap-2 btn-gold px-4 py-2 rounded-xl text-sm font-bold">
            <Package size={14} />
            Gérer le catalogue
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0F2347] border border-green-500/20 rounded-2xl p-4">
          <p className="text-xs text-[#A0AEC0] mb-1">En stock</p>
          <p className="text-2xl font-bold text-green-400">{inStock.length}</p>
        </div>
        <div className="bg-[#0F2347] border border-yellow-500/20 rounded-2xl p-4">
          <p className="text-xs text-[#A0AEC0] mb-1">Stock faible (≤5)</p>
          <p className="text-2xl font-bold text-yellow-400">{lowStock.length}</p>
        </div>
        <div className="bg-[#0F2347] border border-red-500/20 rounded-2xl p-4">
          <p className="text-xs text-[#A0AEC0] mb-1">Rupture de stock</p>
          <p className="text-2xl font-bold text-red-400">{outOfStock.length}</p>
        </div>
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="space-y-2">
          {outOfStock.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <TrendingDown size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{outOfStock.length} article{outOfStock.length !== 1 ? 's' : ''} en rupture de stock</p>
            </div>
          )}
          {lowStock.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0" />
              <p className="text-sm text-yellow-400">{lowStock.length} article{lowStock.length !== 1 ? 's' : ''} avec stock faible</p>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#A0AEC0] text-sm">Chargement...</div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={32} className="mx-auto mb-3 text-[#718096] opacity-50" />
            <p className="text-[#A0AEC0] text-sm">Aucun article au catalogue</p>
            <Link href="/business/dashboard/catalogue" className="inline-block mt-3 text-xs text-[#D4AF37] hover:underline">
              Ajouter des articles →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D4AF37]/10">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase">Article</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase">Prix</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase">Stock</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase">Statut</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-[#D4AF37]/5 hover:bg-[#0A1628]/40 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-[#D4AF37]">{p.sku}</td>
                    <td className="px-4 py-3 text-sm font-medium text-white">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-[#A0AEC0]">{fmt(p.price_cents)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${p.stock_quantity <= 0 ? 'text-red-400' : p.stock_quantity <= 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-lg border ${
                        p.stock_quantity <= 0
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : p.stock_quantity <= 5
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :'bg-green-500/20 text-green-400 border-green-500/30'
                      }`}>
                        {p.stock_quantity <= 0 ? 'Rupture' : p.stock_quantity <= 5 ? 'Faible' : 'OK'}
                      </span>
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
