'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Plus, UserCheck, UserX, Warehouse } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';

type Wh = { id: string; name: string; code: string; city: string | null; active: boolean };
type Head = { warehouse_id: string; user_id: string; display_name: string | null; phone: string | null; status: string };
type MemberLite = { member_id: string; user_id: string };

const EMPTY = { firstName: '', lastName: '', email: '', phone: '', password: '' };

// Chefs d'agence : un seul chef actif par entrepôt. Création, suspension et réactivation.
export default function AgencyHeadsPanel({ orgId, canManage, members, onChanged }: { orgId: string; canManage: boolean; members: MemberLite[]; onChanged: () => void }) {
  const [warehouses, setWarehouses] = useState<Wh[]>([]);
  const [heads, setHeads] = useState<Head[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: w } = await supabase.from('warehouses').select('id,name,code,city,active').eq('organization_id', orgId).order('name');
    const list = (w ?? []) as Wh[];
    setWarehouses(list);
    if (list.length) {
      const { data: h, error } = await supabase.from('warehouse_managers').select('warehouse_id,user_id,display_name,phone,status').in('warehouse_id', list.map((x) => x.id));
      if (error) toast.error(error.message);
      setHeads((h ?? []) as Head[]);
    } else setHeads([]);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  async function create(e: FormEvent<HTMLFormElement>, warehouseId: string) {
    e.preventDefault();
    setBusy(warehouseId);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error('Session expirée. Reconnectez-vous.');
      const res = await fetch('/api/business/create-warehouse-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, warehouseId }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out?.error || 'Création impossible.');
      toast.success('Chef d’agence créé. Transmettez-lui son mot de passe vous-même : aucun e-mail n’est envoyé.');
      setForm(EMPTY); setOpenFor(null);
      await load(); onChanged();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Création impossible.';
      toast.error(msg.includes('warehouse_managers_one_active_head') ? 'Cette agence a déjà un chef d’agence actif.' : msg);
    } finally { setBusy(null); }
  }

  async function toggle(h: Head) {
    const member = members.find((m) => m.user_id === h.user_id);
    if (!member) { toast.error('Ce chef d’agence n’a pas de compte membre : contactez le support.'); return; }
    const next = h.status === 'active' ? 'suspended' : 'active';
    if (next === 'suspended' && !window.confirm(`Suspendre ${h.display_name ?? 'ce chef d’agence'} ?`)) return;
    setBusy(h.user_id);
    const { error } = await supabase.rpc('jdvcrm_set_member_status_v1', { p_member_id: member.member_id, p_status: next });
    setBusy(null);
    if (error) { toast.error(error.message.includes('warehouse_managers_one_active_head') ? 'Cette agence a déjà un chef d’agence actif.' : error.message); return; }
    toast.success(next === 'active' ? 'Chef d’agence réactivé.' : 'Chef d’agence suspendu.');
    await load(); onChanged();
  }

  const input = 'input-navy w-full px-3 py-2.5 text-sm';
  if (loading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (warehouses.length === 0) return <p className="text-sm text-muted-foreground">Créez d’abord un entrepôt (menu Entrepôts &amp; zones) pour y nommer un chef d’agence.</p>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Un chef d’agence pilote un entrepôt et ses sous-entrepôts depuis l’espace Agence (<span className="font-mono">/entrepot/login</span>). Il ne voit que son agence.</p>
      {warehouses.map((w) => {
        const list = heads.filter((h) => h.warehouse_id === w.id);
        const activeHead = list.find((h) => h.status === 'active');
        return (
          <div key={w.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Warehouse size={20} style={{ color: 'var(--brand-text)' }} />
                <div><p className="font-semibold text-foreground">{w.name}</p><p className="text-xs text-muted-foreground">{w.code}{w.city ? ` · ${w.city}` : ''}{w.active ? '' : ' · inactif'}</p></div>
              </div>
              {canManage && !activeHead && w.active && (
                <button onClick={() => setOpenFor(openFor === w.id ? null : w.id)} className="btn-gold inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"><Plus size={14} />Nommer un chef d’agence</button>
              )}
            </div>

            {list.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Aucun chef d’agence pour cette agence.</p> : (
              <div className="mt-3 space-y-2">
                {list.map((h) => (
                  <div key={h.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3">
                    <div><p className="text-sm font-medium text-foreground">{h.display_name ?? 'Sans nom'}</p><p className="text-xs text-muted-foreground">{h.phone ?? '—'}</p></div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] ${h.status === 'active' ? 'badge-success' : 'badge-danger'}`}>{h.status === 'active' ? 'Actif' : 'Suspendu'}</span>
                      {canManage && (
                        <button onClick={() => toggle(h)} disabled={busy === h.user_id} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs disabled:opacity-50">
                          {h.status === 'active' ? <><UserX size={12} />Suspendre</> : <><UserCheck size={12} />Réactiver</>}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {openFor === w.id && (
              <form onSubmit={(e) => create(e, w.id)} className="mt-4 grid gap-3 md:grid-cols-3">
                <input required placeholder="Prénom *" className={input} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                <input placeholder="Nom" className={input} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                <input placeholder="Téléphone" className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <input required type="email" placeholder="E-mail de connexion *" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <input required minLength={8} placeholder="Mot de passe provisoire * (8 caractères)" className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button disabled={busy === w.id} className="btn-gold rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-60">{busy === w.id ? 'Création…' : 'Créer le chef d’agence'}</button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
