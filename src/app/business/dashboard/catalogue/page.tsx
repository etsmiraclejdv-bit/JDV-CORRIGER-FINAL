'use client';
import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { fetchProducts, updateProduct, createProduct } from '@/lib/services/catalogueService';
import Modal from '@/components/ui/Modal';
import { toast } from 'sonner';
import { fetchOrgProfile } from '@/lib/auth/context';

interface Product {
  id: string;
  organization_id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  price_cents: number;
  created_at: string;
  active?: boolean;
}

export default function CataloguePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', sku: '', price_cents: 0, stock_quantity: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await fetchOrgProfile();
      if (profile?.organization_id) {
        setOrgId(profile.organization_id);
        loadProducts(profile.organization_id);
      }
    });
  }, []);

  async function loadProducts(oid: string) {
    setLoading(true);
    const { data, error: err } = await fetchProducts(oid);
    if (err) setError(err.message);
    else setProducts((data as Product[]) ?? []);
    setLoading(false);
  }

  function openCreate() {
    setEditProduct(null);
    setForm({ name: '', sku: '', price_cents: 0, stock_quantity: 0 });
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditProduct(p);
    setForm({ name: p.name, sku: p.sku, price_cents: p.price_cents, stock_quantity: p.stock_quantity });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) return;
    setSaving(true);
    if (editProduct) {
      const { error: err } = await updateProduct(editProduct.id, form);
      if (err) toast.error(err.message);
      else { toast.success('Article mis à jour'); setModalOpen(false); loadProducts(orgId); }
    } else {
      const { error: err } = await createProduct({ ...form, organization_id: orgId });
      if (err) toast.error(err.message);
      else { toast.success('Article créé'); setModalOpen(false); loadProducts(orgId); }
    }
    setSaving(false);
  }

  const filtered = products.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Catalogue Articles</h1>
          <p className="text-sm text-[#A0AEC0] mt-1">{products.length} article{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 btn-gold px-4 py-2.5 rounded-xl text-sm font-bold">
          <Plus size={14} />
          Nouvel article
        </button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, SKU..."
          className="w-full bg-[#0F2347] border border-[#D4AF37]/20 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-[#718096] focus:outline-none focus:border-[#D4AF37]/60"
        />
      </div>

      <div className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#A0AEC0] text-sm">Chargement...</div>
        ) : error ? (
          <div className="py-16 text-center text-red-400 text-sm">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={32} className="mx-auto mb-3 text-[#718096] opacity-50" />
            <p className="text-[#A0AEC0] text-sm">Aucun article trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D4AF37]/10">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase">SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase">Nom</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase">Prix</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase">Stock</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-[#D4AF37]/5 hover:bg-[#0A1628]/40 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-[#D4AF37]">{p.sku}</td>
                    <td className="px-4 py-3 text-sm font-medium text-white">{p.name}</td>
                    <td className="px-4 py-3 text-sm text-[#A0AEC0]">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format((p.price_cents ?? 0) / 100)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${p.stock_quantity <= 0 ? 'text-red-400' : p.stock_quantity <= 5 ? 'text-yellow-400' : 'text-green-400'}`}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-1.5 rounded-lg text-[#718096] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? 'Modifier l\'article' : 'Nouvel article'} size="md">
        <form onSubmit={handleSave} className="space-y-4 p-1">
          <div>
            <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">Nom de l&apos;article</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60"
              placeholder="Nom du produit"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">Code article (laisser vide pour générer)</label>
            <input
              type="text"
              value={form.sku}
              onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
              className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60"
              placeholder="SKU-001"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">Prix comptant (XOF)</label>
            <input
              type="number"
              value={Math.round(form.price_cents / 100)}
              onChange={e => setForm(f => ({ ...f, price_cents: (parseInt(e.target.value) || 0) * 100 }))}
              min={0}
              className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">Quantité en stock</label>
            <input
              type="number"
              value={form.stock_quantity}
              onChange={e => setForm(f => ({ ...f, stock_quantity: parseInt(e.target.value) || 0 }))}
              min={0}
              className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-[#D4AF37]/20 text-[#A0AEC0] text-sm hover:text-white transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="flex-1 btn-gold py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60">
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
