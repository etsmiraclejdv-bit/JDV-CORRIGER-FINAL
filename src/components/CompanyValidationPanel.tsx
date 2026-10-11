'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, FileUp, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

type DocStatus = 'missing' | 'pending' | 'analyzing' | 'verified' | 'rejected' | 'needs_review' | 'stale' | 'expired';
type DocRow = { type: string; status: DocStatus; reason: string | null; document_id: string | null; name: string | null };
type Validation = {
  application_status: string;
  identity: { status: 'pending' | 'approved' | 'refused'; reasons: string[]; attempts: number };
  required: string[];
  documents: DocRow[];
  can_validate: boolean;
};

const DOC_LABELS: Record<string, string> = {
  identity: 'Pièce d’identité du représentant',
  rccm: 'RCCM / registre de commerce',
  ifu: 'IFU / document fiscal',
  statutes: 'Statuts / acte constitutif',
  address_proof: 'Justificatif d’adresse',
  mandate: 'Mandat ou pouvoir',
};
const EDIT_FIELDS: [string, string][] = [
  ['company_name', 'Nom commercial'], ['legal_name', 'Dénomination sociale'], ['registration_number', 'RCCM'], ['tax_number', 'IFU'],
  ['representative_first_name', 'Prénoms du représentant'], ['representative_last_name', 'Nom du représentant'], ['city', 'Ville'], ['address', 'Adresse'],
];
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

async function fnError(error: unknown): Promise<string> {
  const e = error as { message?: string; context?: { json?: () => Promise<{ error?: string }> } };
  try {
    const body = await e.context?.json?.();
    if (body?.error) return body.error;
  } catch { /* corps illisible : on garde le message générique */ }
  return e?.message || 'Une erreur est survenue.';
}

function validateMessage(raw: string): string {
  if (raw.includes('VALIDATION_INCOMPLETE')) return 'Toutes les étapes ne sont pas encore validées.';
  if (raw.includes('APPLICATION_NOT_FOUND')) return 'Dossier introuvable.';
  return raw;
}

function DocIcon({ status, busy }: { status: DocStatus; busy: boolean }) {
  if (busy || status === 'analyzing' || status === 'pending') return <Loader2 size={20} className="animate-spin text-[#63B3ED]" />;
  if (status === 'verified') return <CheckCircle2 size={20} className="text-green-400" />;
  if (status === 'rejected' || status === 'expired') return <XCircle size={20} className="text-red-400" />;
  if (status === 'needs_review' || status === 'stale') return <Clock size={20} className="text-orange-300" />;
  return <FileUp size={20} className="text-[#718096]" />;
}

function docText(d: DocRow): string {
  switch (d.status) {
    case 'verified': return 'Document conforme.';
    case 'rejected': return d.reason || 'Document non conforme.';
    case 'expired': return 'Document expiré.';
    case 'needs_review': return 'Reçu : en attente de contrôle par l’équipe JDV.';
    case 'stale': return d.reason || 'L’identité a changé : renvoyez ce document.';
    case 'analyzing': case 'pending': return 'Analyse en cours…';
    default: return 'Aucun document envoyé.';
  }
}

export default function CompanyValidationPanel({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [data, setData] = useState<Validation | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const autoRan = useRef(false);

  const refresh = useCallback(async () => {
    const { data: v, error: e } = await supabase.rpc('jdvcrm_my_company_validation_v1', { p_application_id: applicationId });
    if (e) { setError(e.message); return null; }
    setData(v as Validation);
    return v as Validation;
  }, [applicationId]);

  const runIdentity = useCallback(async () => {
    setBusy('identity'); setError('');
    const { error: e } = await supabase.functions.invoke('company-ai-review', { body: { application_id: applicationId, stage: 'identity' } });
    if (e) setError(await fnError(e));
    await refresh();
    setBusy(null);
  }, [applicationId, refresh]);

  useEffect(() => {
    (async () => {
      const v = await refresh();
      setLoading(false);
      if (v && v.identity.status === 'pending' && v.identity.attempts === 0 && !autoRan.current
          && !['approved_pending_email', 'activated'].includes(v.application_status)) {
        autoRan.current = true;
        await runIdentity();
      }
    })();
  }, [refresh, runIdentity]);

  async function openEdit() {
    const { data: row } = await supabase.from('organization_applications')
      .select('company_name,legal_name,registration_number,tax_number,representative_first_name,representative_last_name,city,address')
      .eq('id', applicationId).maybeSingle();
    setForm(Object.fromEntries(Object.entries((row ?? {}) as Record<string, unknown>).map(([k, v]) => [k, String(v ?? '')])));
    setEditing(true);
  }

  async function saveEdit() {
    setError('');
    if (!form.company_name?.trim()) { setError('Le nom commercial est obligatoire.'); return; }
    setBusy('identity');
    const patch = Object.fromEntries(EDIT_FIELDS.map(([k]) => [k, form[k]?.trim() ? form[k].trim() : null]));
    const { error: e } = await supabase.from('organization_applications').update(patch).eq('id', applicationId);
    if (e) { setError(e.message); setBusy(null); return; }
    setEditing(false);
    await runIdentity();
  }

  async function upload(type: string, file: File) {
    setError('');
    if (file.size > MAX_BYTES) { setError('Fichier trop volumineux (8 Mo maximum).'); return; }
    if (!ACCEPTED.includes(file.type)) { setError('Format non pris en charge : envoyez un PDF, JPG, PNG ou WEBP.'); return; }
    setBusy(type);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error('Session expirée. Reconnectez-vous.');
      const safe = file.name.replace(/[^\w.\-]/g, '_');
      const path = `${user.id}/${applicationId}/${Date.now()}-${safe}`;
      const up = await supabase.storage.from('company-kyb-documents').upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
      const ins = await supabase.from('organization_application_documents').insert({
        application_id: applicationId, document_type: type, document_name: file.name, storage_path: path,
        mime_type: file.type, file_size: file.size, uploaded_by: user.id,
      }).select('id').single();
      if (ins.error) throw ins.error;
      const { error: e } = await supabase.functions.invoke('company-ai-review', {
        body: { application_id: applicationId, stage: 'document', document_id: (ins.data as { id: string }).id },
      });
      if (e) setError(await fnError(e));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible.');
    }
    await refresh();
    setBusy(null);
  }

  async function validate() {
    setBusy('validate'); setError('');
    const { error: e } = await supabase.rpc('jdvcrm_validate_my_company_v1', { p_application_id: applicationId });
    if (e) { setError(validateMessage(e.message)); setBusy(null); return; }
    router.replace('/business/dashboard');
  }

  if (loading) return <p className="text-sm text-[#A0AEC0]">Chargement de votre dossier…</p>;
  if (!data) return <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error || 'Dossier indisponible.'}</div>;

  const legacy = data.application_status === 'approved_pending_email';
  const identityOk = data.identity.status === 'approved';
  const card = 'rounded-2xl border border-[#D4AF37]/20 bg-[#0F2347] p-6';

  return (
    <div className="space-y-5">
      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

      {legacy ? (
        <section className={card}>
          <h2 className="text-lg font-bold text-white">Votre entreprise est approuvée</h2>
          <p className="mt-2 text-sm text-[#A0AEC0]">Il ne reste qu’à finaliser la création de votre espace.</p>
          <button onClick={validate} disabled={busy === 'validate'} className="btn-gold mt-5 rounded-xl px-6 py-3 text-sm font-bold disabled:opacity-60">
            {busy === 'validate' ? 'Finalisation…' : 'Finaliser mon entreprise'}
          </button>
        </section>
      ) : (
        <>
          <section className={card}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Étape 1</p>
                <h2 className="text-lg font-bold text-white">Identité de l’entreprise</h2>
              </div>
              {busy === 'identity' ? <Loader2 className="animate-spin text-[#63B3ED]" /> : identityOk ? <CheckCircle2 className="text-green-400" /> : data.identity.status === 'refused' ? <XCircle className="text-red-400" /> : <Clock className="text-orange-300" />}
            </div>
            {busy === 'identity' && <p className="mt-3 text-sm text-[#A0AEC0]">JDV IA analyse votre dossier…</p>}
            {!busy && identityOk && <p className="mt-3 text-sm text-green-300">Identité validée. Vous pouvez envoyer vos documents.</p>}
            {!busy && data.identity.status === 'refused' && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-red-300">Votre dossier n’a pas pu être validé :</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-red-200">{data.identity.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
            )}
            {!busy && !identityOk && !editing && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={openEdit} className="btn-gold rounded-xl px-5 py-2.5 text-sm font-bold">Corriger mon dossier</button>
                <button onClick={runIdentity} className="rounded-xl border border-[#D4AF37]/30 px-5 py-2.5 text-sm text-[#D4AF37]">Relancer l’analyse</button>
              </div>
            )}
            {editing && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {EDIT_FIELDS.map(([key, label]) => (
                  <label key={key} className="text-xs font-semibold uppercase tracking-wide text-[#A0AEC0]">
                    {label}
                    <input value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input-navy mt-1 w-full px-3 py-2.5 text-sm normal-case" />
                  </label>
                ))}
                <div className="flex gap-3 sm:col-span-2">
                  <button onClick={saveEdit} className="btn-gold rounded-xl px-5 py-2.5 text-sm font-bold">Enregistrer et relancer l’analyse</button>
                  <button onClick={() => setEditing(false)} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-[#A0AEC0]">Annuler</button>
                </div>
              </div>
            )}
          </section>

          <section className={`${card} ${identityOk ? '' : 'opacity-50'}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Étape 2</p>
            <h2 className="text-lg font-bold text-white">Documents de vérification</h2>
            <p className="mt-1 text-sm text-[#A0AEC0]">PDF, JPG, PNG ou WEBP, 8 Mo maximum. Chaque document est analysé dès son envoi.</p>
            <div className="mt-4 space-y-3">
              {data.documents.map((d) => {
                const isBusy = busy === d.type;
                const canSend = identityOk && !busy && d.status !== 'verified' && d.status !== 'needs_review';
                return (
                  <div key={d.type} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-[#0A1628] p-4">
                    <DocIcon status={d.status} busy={isBusy} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{DOC_LABELS[d.type] ?? d.type}</p>
                      <p className={`text-xs ${d.status === 'rejected' ? 'text-red-300' : d.status === 'verified' ? 'text-green-300' : 'text-[#A0AEC0]'}`}>{isBusy ? 'Envoi et analyse en cours…' : docText(d)}</p>
                    </div>
                    {canSend && (
                      <label className="cursor-pointer rounded-lg border border-[#D4AF37]/30 px-3 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10">
                        {d.status === 'missing' ? 'Envoyer' : 'Renvoyer'}
                        <input type="file" accept={ACCEPTED.join(',')} className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(d.type, f); }} />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className={`${card} ${data.can_validate ? '' : 'opacity-50'}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Étape 3</p>
            <h2 className="text-lg font-bold text-white">Valider mon entreprise</h2>
            <p className="mt-1 text-sm text-[#A0AEC0]">Disponible quand l’identité et tous les documents sont validés.</p>
            <button onClick={validate} disabled={!data.can_validate || busy === 'validate'}
              className="btn-gold mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60">
              <ShieldCheck size={16} /> {busy === 'validate' ? 'Création de votre espace…' : 'Valider mon entreprise'}
            </button>
          </section>
        </>
      )}
    </div>
  );
}
