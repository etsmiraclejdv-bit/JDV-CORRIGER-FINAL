'use client';

import { useEffect, useState } from 'react';
import { FileText, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const docs=[
 ['identity','Pièce d’identité du représentant'],
 ['rccm','RCCM / registre de commerce'],
 ['ifu','IFU / document fiscal'],
 ['incorporation','Acte constitutif / création'],
 ['statutes','Statuts'],
 ['mandate','Mandat / pouvoir si nécessaire'],
 ['address_proof','Justificatif d’adresse'],
] as const;

export default function CompanyOnboardingPage(){
 const router=useRouter(); const [app,setApp]=useState<any>(null); const [files,setFiles]=useState<Record<string,File|null>>({}); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [done,setDone]=useState(false); const [error,setError]=useState('');
 useEffect(()=>{(async()=>{const {data:{user}}=await supabase.auth.getUser();if(!user){router.replace('/business/login');return;}const {data}=await supabase.from('organization_applications').select('id,company_name,status,professional_email,company_nature,company_size').eq('applicant_user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();if(!data){setError('Aucun dossier d’entreprise trouvé.');}else setApp(data);setLoading(false);})();},[router]);
 async function upload(){
  if(!app)return; setSaving(true);setError('');
  try{
   const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('Session expirée.');
   for(const [type,label] of docs){const file=files[type];if(!file)continue;
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=user.id+'/'+app.id+'/'+type+'-'+Date.now()+'-'+safe;
    const {error:e}=await supabase.storage.from('company-kyb-documents').upload(path,file,{upsert:false,contentType:file.type});if(e)throw e;
    const {error:db}=await supabase.from('organization_application_documents').insert({application_id:app.id,document_type:type,document_name:label,storage_path:path,mime_type:file.type,file_size:file.size,uploaded_by:user.id,status:'pending'});if(db)throw db;
   }
   const {error:e}=await supabase.from('organization_applications').update({status:'under_review',analysis_status:'processing'}).eq('id',app.id).eq('applicant_user_id',user.id);if(e)throw e;
   setDone(true);
  }catch(e){setError(e instanceof Error?e.message:'Échec de l’envoi.');}finally{setSaving(false);}
 }
 if(loading)return <div className="min-h-screen bg-[#0B1B3D] text-white grid place-items-center">Chargement du dossier…</div>;
 return <div className="min-h-screen bg-[#0B1B3D] text-white px-4 py-10"><div className="max-w-4xl mx-auto">
  <div className="mb-8"><p className="text-[#D4AF37] text-xs uppercase tracking-widest">Finalisation du dossier</p><h1 className="text-3xl font-bold mt-2">Vérification de {app?.company_name||'votre entreprise'}</h1><p className="text-[#A0AEC0] mt-2">Téléversez les pièces nécessaires. Elles restent privées et accessibles uniquement aux personnes autorisées.</p></div>
  {error&&<div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex gap-2"><AlertCircle size={18}/>{error}</div>}
  {done?<div className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-3xl p-10 text-center"><CheckCircle2 size={54} className="mx-auto text-green-400 mb-4"/><h2 className="text-2xl font-bold">Dossier transmis</h2><p className="text-[#A0AEC0] mt-3">Le Concepteur peut maintenant vérifier votre entreprise. Vous recevrez la suite sur votre email professionnel.</p></div>:
  <div className="grid md:grid-cols-2 gap-4">{docs.map(([type,label])=><label key={type} className="bg-[#0F2347] border border-[#D4AF37]/15 rounded-2xl p-5 cursor-pointer hover:border-[#D4AF37]/40"><div className="flex items-center gap-3 mb-3"><FileText size={18} className="text-[#D4AF37]"/><span className="font-semibold text-sm">{label}</span></div><div className="border border-dashed border-[#D4AF37]/25 rounded-xl p-4 text-center text-xs text-[#A0AEC0]"><UploadCloud className="mx-auto mb-2" size={20}/>{files[type]?.name||'Choisir un PDF ou une image'}<input type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={e=>setFiles(v=>({...v,[type]:e.target.files?.[0]||null}))}/></div></label>)}
  <div className="md:col-span-2"><button onClick={upload} disabled={saving} className="w-full bg-[#D4AF37] text-[#0B1B3D] py-4 rounded-xl font-bold disabled:opacity-60">{saving?'Transmission sécurisée…':'Transmettre le dossier au Concepteur'}</button></div></div>}
 </div></div>
}
