'use client';
import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, XCircle, RefreshCw, FileSearch, FileText, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type Row={application_id:string;company_name:string;legal_name:string|null;professional_email:string;company_nature:string;legal_form:string|null;legal_status:string|null;sector_name:string|null;country:string;city:string|null;company_size:string|null;status:string;analysis_status:string;analysis_score:number|null;created_at:string};
type DocRow={document_id:string;application_id:string;company_name:string;document_type:string;document_name:string;storage_path:string;created_at:string};

const DOC_LABELS:Record<string,string>={identity:'Pièce d’identité',rccm:'RCCM',ifu:'IFU',statutes:'Statuts',incorporation:'Acte constitutif',mandate:'Mandat',address_proof:'Justificatif d’adresse',other:'Autre document'};

export default function CompanyApplicationsPage(){
 const [rows,setRows]=useState<Row[]>([]);const [docs,setDocs]=useState<DocRow[]>([]);const [loading,setLoading]=useState(true);const [message,setMessage]=useState('');const [busy,setBusy]=useState<string|null>(null);const [reasons,setReasons]=useState<Record<string,string>>({});

 async function load(){
  setLoading(true);
  const [apps,toReview]=await Promise.all([supabase.rpc('jdvcrm_get_pending_company_applications_v1'),supabase.rpc('jdvcrm_get_documents_to_review_v1')]);
  if(apps.error)setMessage(apps.error.message);else if(toReview.error)setMessage(toReview.error.message);
  setRows((apps.data??[]) as Row[]);
  setDocs((toReview.data??[]) as DocRow[]);
  setLoading(false);
 }
 useEffect(()=>{load()},[]);

 async function openDoc(path:string){
  const {data,error}=await supabase.storage.from('company-kyb-documents').createSignedUrl(path,600);
  if(error||!data?.signedUrl){setMessage(error?.message??'Lien du document indisponible.');return;}
  window.open(data.signedUrl,'_blank','noopener,noreferrer');
 }

 async function reviewDoc(d:DocRow,decision:'verified'|'rejected'){
  const reason=(reasons[d.document_id]??'').trim();
  if(decision==='rejected'&&!reason){setMessage('Indiquez le motif du refus : il sera montré au candidat.');return;}
  setBusy(d.document_id);setMessage('');
  const {error}=await supabase.rpc('jdvcrm_review_application_document_v1',{p_document_id:d.document_id,p_decision:decision,p_reason:decision==='rejected'?reason:null});
  if(error)setMessage(error.message);
  else setMessage(decision==='verified'?'Document validé.':'Document refusé : le candidat voit le motif et peut le renvoyer.');
  setBusy(null);await load();
 }

 async function decide(id:string,decision:'approve'|'request_changes'|'reject'){
  setBusy(id);setMessage('');
  try{
   const notes=decision==='approve'?'Dossier approuvé par le Concepteur.':decision==='reject'?'Dossier refusé après vérification.':'Correction demandée avant validation.';
   const {error}=await supabase.rpc('jdvcrm_platform_review_company_application_v1',{p_application_id:id,p_decision:decision,p_notes:notes});
   if(error)throw error;
   setMessage(decision==='approve'?'Dossier approuvé. Le candidat peut finaliser son entreprise depuis sa page de validation (aucun e-mail n’est envoyé).':decision==='reject'?'Dossier refusé.':'Correction demandée.');
  }catch(e){setMessage(e instanceof Error?e.message:'Une erreur est survenue.')}
  finally{setBusy(null);await load();}
 }

 return <div className="p-6 lg:p-8 space-y-7">
  <div className="flex items-center justify-between"><div><p className="text-xs text-[#D4AF37] uppercase tracking-widest">Concepteur</p><h1 className="text-2xl font-bold text-white mt-1">Dossiers de création d’entreprise</h1><p className="text-sm text-[#A0AEC0] mt-1">Contrôle des documents et suivi des dossiers.</p></div><button onClick={load} className="p-3 rounded-xl border border-[#D4AF37]/20 text-[#A0AEC0]"><RefreshCw size={17}/></button></div>
  {message&&<div className="p-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-sm">{message}</div>}
  <div className="bg-[#0F2347] border border-[#D4AF37]/15 rounded-2xl p-4 text-sm text-[#A0AEC0]"><FileSearch className="inline mr-2 text-[#D4AF37]" size={17}/>L’identité est validée automatiquement. Tant que l’analyse IA des documents n’est pas activée, chaque document reçu arrive ici pour un contrôle humain. Quand tous les documents d’un dossier sont conformes, le candidat valide lui-même son entreprise.</div>

  <section className="space-y-4">
   <h2 className="text-lg font-bold text-white">Documents à contrôler ({docs.length})</h2>
   {loading?<div className="text-[#A0AEC0]">Chargement…</div>:docs.length===0?<div className="bg-[#0F2347] rounded-2xl p-8 text-center text-[#A0AEC0]">Aucun document en attente de contrôle.</div>:docs.map(d=><div key={d.document_id} className="bg-[#0F2347] border border-[#D4AF37]/15 rounded-2xl p-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div className="space-y-1"><div className="flex items-center gap-2"><FileText size={17} className="text-[#D4AF37]"/><span className="font-semibold text-white">{DOC_LABELS[d.document_type]??d.document_type}</span></div><p className="text-sm text-[#A0AEC0]">{d.company_name} · {d.document_name}</p><button onClick={()=>openDoc(d.storage_path)} className="inline-flex items-center gap-1 text-sm text-[#63B3ED] hover:underline"><ExternalLink size={14}/>Ouvrir le document</button></div>
    <div className="flex flex-col gap-2 lg:w-96"><input value={reasons[d.document_id]??''} onChange={e=>setReasons({...reasons,[d.document_id]:e.target.value})} placeholder="Motif si refus (montré au candidat)" className="bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2 text-sm text-white placeholder-[#718096]"/><div className="flex gap-2"><button disabled={busy===d.document_id} onClick={()=>reviewDoc(d,'verified')} className="flex-1 px-4 py-2 rounded-xl bg-green-500/15 text-green-300 flex items-center justify-center gap-2 text-sm disabled:opacity-50"><CheckCircle2 size={16}/>Conforme</button><button disabled={busy===d.document_id} onClick={()=>reviewDoc(d,'rejected')} className="flex-1 px-4 py-2 rounded-xl bg-red-500/15 text-red-300 flex items-center justify-center gap-2 text-sm disabled:opacity-50"><XCircle size={16}/>Refuser</button></div></div>
   </div>)}
  </section>

  <section className="space-y-4">
   <h2 className="text-lg font-bold text-white">Dossiers en cours ({rows.length})</h2>
   {loading?null:rows.length===0?<div className="bg-[#0F2347] rounded-2xl p-8 text-center text-[#A0AEC0]">Aucun dossier en attente.</div>:rows.map(r=><div key={r.application_id} className="bg-[#0F2347] border border-[#D4AF37]/15 rounded-2xl p-6"><div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5"><div className="space-y-2"><div className="flex items-center gap-2"><Building2 size={18} className="text-[#D4AF37]"/><h3 className="font-bold text-white">{r.company_name}</h3></div><p className="text-sm text-[#A0AEC0]">{r.legal_name||'—'} · {r.legal_form||'forme non précisée'} · {r.sector_name||'secteur non précisé'}</p><p className="text-sm text-[#A0AEC0]">{r.professional_email} · {r.country}{r.city ? ' · '+r.city : ''}</p><div className="flex gap-2 flex-wrap"><span className="px-2 py-1 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] text-xs">{r.status}</span><span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-300 text-xs">Analyse: {r.analysis_status}</span></div></div><div className="flex flex-wrap gap-2">
   {r.status==='approved_pending_email'?<span className="px-3 py-2 rounded-xl bg-green-500/10 text-green-300 text-sm">Approuvé : le candidat finalise depuis sa page de validation</span>:<><button disabled={busy===r.application_id} onClick={()=>decide(r.application_id,'approve')} className="px-4 py-2 rounded-xl bg-green-500/15 text-green-300 flex items-center gap-2 text-sm disabled:opacity-50"><CheckCircle2 size={16}/>Approuver sans attendre</button><button disabled={busy===r.application_id} onClick={()=>decide(r.application_id,'request_changes')} className="px-4 py-2 rounded-xl bg-yellow-500/15 text-yellow-300 text-sm disabled:opacity-50">Demander correction</button><button disabled={busy===r.application_id} onClick={()=>decide(r.application_id,'reject')} className="px-4 py-2 rounded-xl bg-red-500/15 text-red-300 flex items-center gap-2 text-sm disabled:opacity-50"><XCircle size={16}/> Refuser</button></>}
  </div></div></div>)}
  </section>
 </div>;
}
