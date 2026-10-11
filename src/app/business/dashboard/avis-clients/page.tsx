'use client';

import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { MessageSquareQuote, Star, Send, RefreshCw, Trash2, ShieldCheck, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { fetchOrgProfile } from '@/lib/auth/context';

type Review = { id: string; customer_name: string; rating: number; comment: string; source: string; status: string; created_at: string };
type ClientOption = { id: string; first_name: string; last_name: string | null; phone: string | null };
const sources = [{value:'in_person',label:'En personne'},{value:'phone',label:'Téléphone'},{value:'whatsapp',label:'WhatsApp'},{value:'email',label:'E-mail'},{value:'online',label:'En ligne'}];

export default function AvisClientsPage() {
  const [orgId,setOrgId]=useState<string|null>(null);
  const [reviews,setReviews]=useState<Review[]>([]);
  const [clients,setClients]=useState<ClientOption[]>([]);
  const [clientId,setClientId]=useState('');
  const [name,setName]=useState('');
  const [rating,setRating]=useState(5);
  const [comment,setComment]=useState('');
  const [source,setSource]=useState('in_person');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState('');

  const loadClients=useCallback(async (id:string)=>{
    const {data}=await supabase.from('clients').select('id,first_name,last_name,phone').eq('organization_id',id).is('archived_at',null).order('first_name').limit(500);
    setClients((data??[]) as ClientOption[]);
  },[]);

  const loadReviews=useCallback(async (id:string)=>{
    const {data,error}=await supabase.from('client_reviews').select('id,customer_name,rating,comment,source,status,created_at').eq('organization_id',id).order('created_at',{ascending:false}).limit(100);
    if(error){setMessage(`Chargement impossible : ${error.message}`);return;}
    setReviews((data??[]) as Review[]);
  },[]);

  useEffect(()=>{let active=true;(async()=>{const {data:profile}=await fetchOrgProfile();const id=profile?.organization_id;if(!id){if(active){setMessage('Aucune organisation active trouvée.');setLoading(false);}return;}if(active)setOrgId(id);await Promise.all([loadReviews(id),loadClients(id)]);if(active)setLoading(false);})();return()=>{active=false;};},[loadReviews,loadClients]);

  async function submit(e:FormEvent){
    e.preventDefault();if(!orgId)return;
    const selectedClient=clients.find(client=>client.id===clientId);
    const trimmedName=(selectedClient ? [selectedClient.first_name,selectedClient.last_name].filter(Boolean).join(' ') : name).trim(), trimmedComment=comment.trim();
    if(trimmedName.length<2||trimmedComment.length<2){setMessage('Renseigne le nom du client et un commentaire.');return;}
    setSaving(true);setMessage('');
    const {data:userData}=await supabase.auth.getUser();
    const {error}=await supabase.from('client_reviews').insert({organization_id:orgId,client_id:clientId||null,customer_name:trimmedName,rating,comment:trimmedComment,source,status:'published',created_by:userData.user?.id??null});
    setSaving(false);
    if(error){setMessage(`Avis non enregistré : ${error.message}`);return;}
    setName('');setClientId('');setComment('');setRating(5);setSource('in_person');
    setMessage('Avis client enregistré.');await loadReviews(orgId);
  }

  async function setStatus(review:Review,status:'published'|'hidden'){
    const {error}=await supabase.from('client_reviews').update({status,updated_at:new Date().toISOString()}).eq('id',review.id);
    setMessage(error?error.message:status==='hidden'?'Avis masqué.':'Avis publié.');
    if(!error&&orgId)await loadReviews(orgId);
  }
  async function remove(review:Review){
    if(!orgId)return;
    const {error}=await supabase.from('client_reviews').delete().eq('id',review.id);
    setMessage(error?error.message:'Avis supprimé.');
    if(!error)await loadReviews(orgId);
  }

  const published=reviews.filter(r=>r.status==='published');
  const average=published.length?published.reduce((sum,r)=>sum+r.rating,0)/published.length:0;
  const counts=[5,4,3,2,1].map(stars=>({stars,count:published.filter(r=>r.rating===stars).length}));

  return <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8 text-white">
    <header><div className="mb-2 flex items-center gap-2 text-amber-300"><MessageSquareQuote size={20}/><span className="text-xs font-semibold uppercase tracking-[.2em]">Relation client</span></div><h1 className="text-2xl font-bold">Avis et satisfaction clients</h1><p className="mt-2 text-sm text-slate-300">Enregistre les retours reçus par l’équipe, suis la satisfaction et masque les commentaires inappropriés.</p></header>
    {message&&<p className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm text-slate-200">{message}</p>}
    <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">Note moyenne publiée</p><div className="mt-2 flex items-center gap-2"><span className="text-3xl font-bold">{average.toFixed(1)}</span><span className="text-amber-300">/ 5</span><Star size={20} className="fill-amber-300 text-amber-300"/></div></div><div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">Avis publiés</p><p className="mt-2 text-3xl font-bold">{published.length}</p></div><div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">À modérer</p><p className="mt-2 text-3xl font-bold">{reviews.filter(r=>r.status==='pending').length}</p></div></div>
    <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
        <h2 className="font-semibold">Enregistrer un avis</h2>
        <label className="block text-sm">Lier à un client du CRM (facultatif)<select value={clientId} onChange={e=>{const id=e.target.value;setClientId(id);const client=clients.find(c=>c.id===id);if(client)setName([client.first_name,client.last_name].filter(Boolean).join(' '));}} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-white"><option value="">Saisie manuelle / client non répertorié</option>{clients.map(client=><option key={client.id} value={client.id}>{[client.first_name,client.last_name].filter(Boolean).join(' ')}{client.phone ? ' · '+client.phone : ''}</option>)}</select></label><label className="block text-sm">Nom du client<input required minLength={2} maxLength={160} value={name} onChange={e=>{setName(e.target.value);if(clientId)setClientId('');}} placeholder="Nom et prénom" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-white"/></label>
        <div><p className="mb-2 text-sm">Note donnée par le client</p><div className="flex gap-1">{[1,2,3,4,5].map(n=><button key={n} type="button" onClick={()=>setRating(n)} aria-label={`${n} étoile(s)`} className="rounded-lg p-1 hover:bg-white/5"><Star size={28} className={n<=rating?'fill-amber-300 text-amber-300':'text-slate-600'}/></button>)}</div></div>
        <label className="block text-sm">Canal de retour<select value={source} onChange={e=>setSource(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-white">{sources.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></label>
        <label className="block text-sm">Commentaire<textarea required minLength={2} maxLength={3000} rows={5} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Que dit le client de son expérience ?" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-white"/></label>
        <button disabled={saving||!orgId} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"><Send size={16}/>{saving?'Enregistrement…':'Enregistrer l’avis'}</button>
        <p className="text-xs text-slate-500">Les avis saisis ici sont internes à votre organisation. Aucun client ne peut publier anonymement via ce formulaire.</p>
      </form>
      <section className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
        <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Historique des avis</h2><button onClick={()=>orgId&&void loadReviews(orgId)} className="rounded-lg border border-white/10 p-2 text-slate-300" title="Actualiser"><RefreshCw size={16}/></button></div>
        <div className="space-y-2">{counts.map(row=><div key={row.stars} className="flex items-center gap-3 text-xs"><span className="w-10 text-slate-300">{row.stars} étoiles</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-amber-300" style={{width:`${published.length?row.count/published.length*100:0}%`}}/></div><span className="w-6 text-right text-slate-400">{row.count}</span></div>)}</div>
        {loading?<p className="p-8 text-center text-sm text-slate-400">Chargement…</p>:reviews.length===0?<p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">Aucun avis enregistré. Le premier retour client pourra être saisi ici.</p>:<div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">{reviews.map(review=><article key={review.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{review.customer_name}</h3><div className="mt-1 flex gap-0.5">{[1,2,3,4,5].map(n=><Star key={n} size={13} className={n<=review.rating?'fill-amber-300 text-amber-300':'text-slate-700'}/>)}</div></div><span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wide ${review.status==='published'?'bg-emerald-950 text-emerald-300':'bg-slate-800 text-slate-300'}`}>{review.status==='published'?'Publié':review.status==='pending'?'À modérer':'Masqué'}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{review.comment}</p><div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3"><span className="text-xs text-slate-500">{sources.find(s=>s.value===review.source)?.label??review.source} · {new Date(review.created_at).toLocaleDateString('fr-FR')}</span><div className="flex gap-2">{review.status==='published'?<button onClick={()=>void setStatus(review,'hidden')} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300">Masquer</button>:<button onClick={()=>void setStatus(review,'published')} className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/20 px-2 py-1 text-xs text-emerald-300"><ShieldCheck size={13}/>Publier</button>}<button onClick={()=>void remove(review)} className="rounded-lg p-1 text-red-300 hover:bg-red-950/40" title="Supprimer"><Trash2 size={14}/></button></div></div></article>)}</div>}
      </section>
    </div>
    <p className="flex items-center gap-2 text-xs text-slate-500"><TrendingUp size={14}/>Les indicateurs se recalculent à partir des avis publiés de votre organisation.</p>
  </div>;
}
