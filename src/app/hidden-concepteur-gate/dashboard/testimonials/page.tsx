'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { MessageSquareQuote, Pencil, RefreshCw, Save, Star, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { checkCurrentSuperAdmin } from '@/lib/auth/super-admin';

const db = supabase as any;
type ReviewStatus = 'pending' | 'approved' | 'rejected';
type Testimonial = {
  id: string;
  author_name: string;
  author_role: string | null;
  company_name: string | null;
  quote: string;
  rating: number | null;
  status: ReviewStatus;
  sort_order: number;
  approved_at: string | null;
  created_at: string;
};
type FormState = {
  author_name: string;
  author_role: string;
  company_name: string;
  quote: string;
  rating: string;
  status: ReviewStatus;
  sort_order: string;
};
const emptyForm: FormState = {
  author_name: '',
  author_role: '',
  company_name: '',
  quote: '',
  rating: '5',
  status: 'pending',
  sort_order: '100',
};

export default function PlatformTestimonialsAdminPage() {
  const [allowed, setAllowed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<Testimonial[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await db
      .from('testimonials')
      .select('id,author_name,author_role,company_name,quote,rating,status,sort_order,approved_at,created_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) toast.error(`Chargement des avis impossible : ${error.message}`);
    else setItems((data ?? []) as Testimonial[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    checkCurrentSuperAdmin()
      .then(async (result) => {
        if (!active) return;
        setAllowed(result.ok);
        if (result.ok) await load();
        else setLoading(false);
        setAuthLoading(false);
      })
      .catch(() => {
        if (active) {
          setAllowed(false);
          setLoading(false);
          setAuthLoading(false);
        }
      });
    return () => { active = false; };
  }, [load]);

  function startEdit(item: Testimonial) {
    setEditingId(item.id);
    setForm({
      author_name: item.author_name,
      author_role: item.author_role ?? '',
      company_name: item.company_name ?? '',
      quote: item.quote,
      rating: String(item.rating ?? 5),
      status: item.status,
      sort_order: String(item.sort_order),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const now = new Date().toISOString();
    const payload = {
      author_name: form.author_name.trim(),
      author_role: form.author_role.trim() || null,
      company_name: form.company_name.trim() || null,
      quote: form.quote.trim(),
      rating: Number(form.rating),
      status: form.status,
      sort_order: Number(form.sort_order) || 0,
      approved_at: form.status === 'approved' ? now : null,
    };
    const result = editingId
      ? await db.from('testimonials').update(payload).eq('id', editingId)
      : await db.from('testimonials').insert(payload);
    setSaving(false);
    if (result.error) {
      toast.error(`Enregistrement impossible : ${result.error.message}`);
      return;
    }
    toast.success(editingId ? 'Avis mis à jour.' : 'Avis ajouté à la plateforme.');
    resetForm();
    await load();
  }

  async function remove(item: Testimonial) {
    if (!window.confirm(`Supprimer l’avis de ${item.author_name} ?`)) return;
    const { error } = await db.from('testimonials').delete().eq('id', item.id);
    if (error) {
      toast.error(`Suppression impossible : ${error.message}`);
      return;
    }
    toast.success('Avis supprimé.');
    if (editingId === item.id) resetForm();
    await load();
  }

  if (authLoading) return <div className="p-8 text-sm text-slate-300">Vérification des droits du concepteur…</div>;
  if (!allowed) return <div className="m-6 rounded-2xl border border-red-400/30 bg-red-950/30 p-5 text-sm text-red-200">Accès réservé au concepteur de la plateforme JDV CRM.</div>;

  return (
    <div className="space-y-6 p-5 text-white sm:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-amber-300"><MessageSquareQuote size={16}/> Gestion de la plateforme</p>
          <h1 className="text-2xl font-bold">Avis & témoignages de JDV CRM</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">Ces témoignages sont propres à la plateforme et peuvent être affichés sur la page d’accueil après approbation. Ils restent séparés des avis clients de chaque entreprise.</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm hover:bg-white/5"><RefreshCw size={15}/> Actualiser</button>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="rounded-2xl border border-white/10 bg-[#0F2347] p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="font-semibold">{editingId ? 'Modifier un témoignage' : 'Ajouter un témoignage'}</h2>
            {editingId && <button type="button" onClick={resetForm} aria-label="Annuler la modification" className="rounded-lg p-2 text-slate-300 hover:bg-white/10"><X size={16}/></button>}
          </div>
          <form onSubmit={save} className="space-y-4">
            <label className="block space-y-1.5 text-sm"><span className="text-slate-300">Nom affiché *</span><input required minLength={2} maxLength={120} value={form.author_name} onChange={e=>setForm(v=>({...v,author_name:e.target.value}))} className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5 text-white"/></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm"><span className="text-slate-300">Fonction</span><input maxLength={120} value={form.author_role} onChange={e=>setForm(v=>({...v,author_role:e.target.value}))} className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5 text-white"/></label>
              <label className="block space-y-1.5 text-sm"><span className="text-slate-300">Entreprise (facultatif)</span><input maxLength={160} value={form.company_name} onChange={e=>setForm(v=>({...v,company_name:e.target.value}))} className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5 text-white"/></label>
            </div>
            <label className="block space-y-1.5 text-sm"><span className="text-slate-300">Témoignage *</span><textarea required minLength={10} maxLength={600} rows={5} value={form.quote} onChange={e=>setForm(v=>({...v,quote:e.target.value}))} className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5 text-white"/></label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block space-y-1.5 text-sm"><span className="text-slate-300">Note</span><select value={form.rating} onChange={e=>setForm(v=>({...v,rating:e.target.value}))} className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5 text-white">{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></label>
              <label className="block space-y-1.5 text-sm"><span className="text-slate-300">Statut</span><select value={form.status} onChange={e=>setForm(v=>({...v,status:e.target.value as ReviewStatus}))} className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5 text-white"><option value="pending">En attente</option><option value="approved">Approuvé (visible)</option><option value="rejected">Refusé</option></select></label>
              <label className="block space-y-1.5 text-sm"><span className="text-slate-300">Ordre</span><input type="number" value={form.sort_order} onChange={e=>setForm(v=>({...v,sort_order:e.target.value}))} className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5 text-white"/></label>
            </div>
            <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-60"><Save size={16}/>{saving ? 'Enregistrement…' : editingId ? 'Enregistrer les modifications' : 'Ajouter le témoignage'}</button>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Avis enregistrés</h2><span className="text-xs text-slate-400">{items.length} avis</span></div>
          {loading ? <div className="rounded-2xl border border-white/10 bg-[#0F2347] p-8 text-sm text-slate-300">Chargement des avis…</div> : items.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">Aucun avis de plateforme enregistré pour le moment.</div> : items.map(item=>(
            <article key={item.id} className="rounded-2xl border border-white/10 bg-[#0F2347] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{item.author_name}</h3><span className={`rounded-full px-2 py-0.5 text-[11px] ${item.status==='approved'?'bg-emerald-400/15 text-emerald-300':item.status==='rejected'?'bg-red-400/15 text-red-300':'bg-amber-400/15 text-amber-200'}`}>{item.status==='approved'?'Approuvé':item.status==='rejected'?'Refusé':'En attente'}</span></div>
                  <p className="mt-1 text-xs text-slate-400">{[item.author_role,item.company_name].filter(Boolean).join(' · ') || 'Témoignage plateforme'}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-200">“{item.quote}”</p>
                  <div className="mt-3 flex items-center gap-1 text-amber-300">{Array.from({length:5}).map((_,i)=><Star key={i} size={13} fill={i<(item.rating??0)?'currentColor':'none'}/>)}<span className="ml-1 text-xs text-slate-400">{item.rating ?? '—'} / 5</span></div>
                </div>
                <div className="flex gap-1"><button type="button" onClick={()=>startEdit(item)} aria-label="Modifier" className="rounded-lg p-2 text-sky-200 hover:bg-white/10"><Pencil size={15}/></button><button type="button" onClick={()=>void remove(item)} aria-label="Supprimer" className="rounded-lg p-2 text-red-300 hover:bg-white/10"><Trash2 size={15}/></button></div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
