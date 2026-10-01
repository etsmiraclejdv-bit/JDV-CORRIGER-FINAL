'use client';
import React, { useState, useEffect } from 'react';
import { Building2, Search, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Organization {
  id: string;
  name: string;
  city: string | null;
  phone: string | null;
  status: string;
  currency: string;
  created_at: string;
}

export default function SuperAdminCompaniesPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  async function loadOrgs() {
    setLoading(true);
    const { data } = await supabase
      .from('organizations')
      .select('id, name, city, phone, status, currency, created_at')
      .order('created_at', { ascending: false });
    setOrgs(data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadOrgs(); }, []);

  async function toggleStatus(org: Organization) {
    setUpdating(org.id);
    const newStatus = org.status === 'active' ? 'suspended' : 'active';
    await supabase.from('organizations').update({ status: newStatus }).eq('id', org.id);
    setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, status: newStatus } : o));
    setUpdating(null);
  }

  const filtered = orgs.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    (o.city ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Entreprises</h1>
          <p className="text-sm text-[#A0AEC0] mt-1">{orgs.length} entreprise{orgs.length !== 1 ? 's' : ''} enregistrée{orgs.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={loadOrgs} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D4AF37]/20 text-[#A0AEC0] hover:text-white text-sm transition-colors">
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une entreprise..."
          className="w-full bg-[#0F2347] border border-[#D4AF37]/20 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-[#718096] text-sm focus:outline-none focus:border-[#D4AF37]/60 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0F2347] border border-[#D4AF37]/15 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-12 bg-[#0A1628] rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 size={32} className="text-[#718096] mx-auto mb-3" />
            <p className="text-[#A0AEC0] text-sm">Aucune entreprise trouvée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D4AF37]/10">
                  <th className="text-left text-xs font-semibold text-[#718096] uppercase tracking-wider px-6 py-4">Entreprise</th>
                  <th className="text-left text-xs font-semibold text-[#718096] uppercase tracking-wider px-6 py-4">Ville</th>
                  <th className="text-left text-xs font-semibold text-[#718096] uppercase tracking-wider px-6 py-4">Téléphone</th>
                  <th className="text-left text-xs font-semibold text-[#718096] uppercase tracking-wider px-6 py-4">Inscrite le</th>
                  <th className="text-left text-xs font-semibold text-[#718096] uppercase tracking-wider px-6 py-4">Statut</th>
                  <th className="text-left text-xs font-semibold text-[#718096] uppercase tracking-wider px-6 py-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4AF37]/5">
                {filtered.map(org => (
                  <tr key={org.id} className="hover:bg-[#0A1628]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                          <Building2 size={14} className="text-[#D4AF37]" />
                        </div>
                        <span className="text-sm font-medium text-white">{org.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#A0AEC0]">{org.city ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-[#A0AEC0]">{org.phone ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-[#A0AEC0]">{formatDate(org.created_at)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg ${
                        org.status === 'active' ?'bg-green-500/20 text-green-400 border border-green-500/30' :'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {org.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {org.status === 'active' ? 'Active' : 'Suspendue'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleStatus(org)}
                        disabled={updating === org.id}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
                          org.status === 'active' ?'border-red-500/30 text-red-400 hover:bg-red-500/10' :'border-green-500/30 text-green-400 hover:bg-green-500/10'
                        }`}
                      >
                        {updating === org.id ? '...' : org.status === 'active' ? 'Suspendre' : 'Activer'}
                      </button>
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
