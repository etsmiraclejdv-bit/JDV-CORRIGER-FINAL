'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, FileUp, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

type DocStatus =
  | 'missing'
  | 'pending'
  | 'analyzing'
  | 'verified'
  | 'rejected'
  | 'needs_review'
  | 'stale'
  | 'expired';
type DocRow = {
  type: string;
  status: DocStatus;
  reason: string | null;
  document_id: string | null;
  name: string | null;
};
type Validation = {
  application_status: string;
  identity: { status: 'pending' | 'approved' | 'refused'; reasons: string[]; attempts: number };
  required: string[];
  documents: DocRow[];
  can_validate: boolean;
};

const DOC_LABELS: Record<string, TerrainKey> = {
  identity: 'vp.dIdentity',
  rccm: 'vp.dRccm',
  ifu: 'vp.dIfu',
  statutes: 'vp.dStat',
  address_proof: 'vp.dAddr',
  mandate: 'vp.dMand',
};
const EDIT_FIELDS: [string, TerrainKey][] = [
  ['company_name', 'vp.fCompany'],
  ['legal_name', 'vp.fLegal'],
  ['registration_number', 'vp.fReg'],
  ['tax_number', 'vp.fTax'],
  ['representative_first_name', 'vp.fFirst'],
  ['representative_last_name', 'vp.fLast'],
  ['city', 'vp.fCity'],
  ['address', 'vp.fAddr'],
];
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

async function fnError(error: unknown): Promise<string> {
  const e = error as { message?: string; context?: { json?: () => Promise<{ error?: string }> } };
  try {
    const body = await e.context?.json?.();
    if (body?.error) return body.error;
  } catch {
    /* corps illisible : on garde le message générique */
  }
  return e?.message || 'vp.eGen';
}

function validateMessage(raw: string): string {
  if (raw.includes('VALIDATION_INCOMPLETE')) return 'vp.eIncomplete';
  if (raw.includes('APPLICATION_NOT_FOUND')) return 'vp.eNotFound';
  return raw;
}

function DocIcon({ status, busy }: { status: DocStatus; busy: boolean }) {
  if (busy || status === 'analyzing' || status === 'pending')
    return <Loader2 size={20} className="animate-spin text-[#63B3ED]" />;
  if (status === 'verified') return <CheckCircle2 size={20} className="text-green-400" />;
  if (status === 'rejected' || status === 'expired')
    return <XCircle size={20} className="text-red-400" />;
  if (status === 'needs_review' || status === 'stale')
    return <Clock size={20} className="text-orange-300" />;
  return <FileUp size={20} className="text-[#718096]" />;
}

function docText(d: DocRow, t: (k: TerrainKey) => string): string {
  switch (d.status) {
    case 'verified':
      return t('vp.sOk');
    case 'rejected':
      return d.reason || t('vp.sBad');
    case 'expired':
      return t('vp.sExp');
    case 'needs_review':
      return t('vp.sRev');
    case 'stale':
      return d.reason || t('vp.sStale');
    case 'analyzing':
    case 'pending':
      return t('vp.sAn');
    default:
      return t('vp.sNone');
  }
}

export default function CompanyValidationPanel({ applicationId }: { applicationId: string }) {
  const { t } = useLanguage();
  // Les erreurs d’état sont soit une clé de traduction, soit un message brut du serveur.
  const tr = (s: string) => (s.startsWith('vp.') ? t(s as TerrainKey) : s);
  const router = useRouter();
  const [data, setData] = useState<Validation | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const autoRan = useRef(false);

  const refresh = useCallback(async () => {
    const { data: v, error: e } = await supabase.rpc('jdvcrm_my_company_validation_v1', {
      p_application_id: applicationId,
    });
    if (e) {
      setError(e.message);
      return null;
    }
    setData(v as Validation);
    return v as Validation;
  }, [applicationId]);

  const runIdentity = useCallback(async () => {
    setBusy('identity');
    setError('');
    const { error: e } = await supabase.functions.invoke('company-ai-review', {
      body: { application_id: applicationId, stage: 'identity' },
    });
    if (e) setError(await fnError(e));
    await refresh();
    setBusy(null);
  }, [applicationId, refresh]);

  useEffect(() => {
    (async () => {
      const v = await refresh();
      setLoading(false);
      if (
        v &&
        v.identity.status === 'pending' &&
        v.identity.attempts === 0 &&
        !autoRan.current &&
        !['approved_pending_email', 'activated'].includes(v.application_status)
      ) {
        autoRan.current = true;
        await runIdentity();
      }
    })();
  }, [refresh, runIdentity]);

  async function openEdit() {
    const { data: row } = await supabase
      .from('organization_applications')
      .select(
        'company_name,legal_name,registration_number,tax_number,representative_first_name,representative_last_name,city,address'
      )
      .eq('id', applicationId)
      .maybeSingle();
    setForm(
      Object.fromEntries(
        Object.entries((row ?? {}) as Record<string, unknown>).map(([k, v]) => [k, String(v ?? '')])
      )
    );
    setEditing(true);
  }

  async function saveEdit() {
    setError('');
    if (!form.company_name?.trim()) {
      setError('vp.eName');
      return;
    }
    setBusy('identity');
    const patch = {
      company_name: form.company_name.trim(),
      legal_name: form.legal_name?.trim() || null,
      registration_number: form.registration_number?.trim() || null,
      tax_number: form.tax_number?.trim() || null,
      representative_first_name: form.representative_first_name?.trim() || '',
      representative_last_name: form.representative_last_name?.trim() || '',
      city: form.city?.trim() || null,
      address: form.address?.trim() || null,
    };
    const { error: e } = await supabase
      .from('organization_applications')
      .update(patch)
      .eq('id', applicationId);
    if (e) {
      setError(e.message);
      setBusy(null);
      return;
    }
    setEditing(false);
    await runIdentity();
  }

  async function upload(type: string, file: File) {
    setError('');
    if (file.size > MAX_BYTES) {
      setError('vp.eBig');
      return;
    }
    if (!ACCEPTED.includes(file.type)) {
      setError('vp.eFmt');
      return;
    }
    setBusy(type);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error('vp.eSess');
      const safe = file.name.replace(/[^\w.-]/g, '_');
      const path = `${user.id}/${applicationId}/${Date.now()}-${safe}`;
      const up = await supabase.storage
        .from('company-kyb-documents')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
      const ins = await supabase
        .from('organization_application_documents')
        .insert({
          application_id: applicationId,
          document_type: type,
          document_name: file.name,
          storage_path: path,
          mime_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
        })
        .select('id')
        .single();
      if (ins.error) throw ins.error;
      const { error: e } = await supabase.functions.invoke('company-ai-review', {
        body: {
          application_id: applicationId,
          stage: 'document',
          document_id: (ins.data as { id: string }).id,
        },
      });
      if (e) setError(await fnError(e));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'vp.eSend');
    }
    await refresh();
    setBusy(null);
  }

  async function validate() {
    setBusy('validate');
    setError('');
    const { error: e } = await supabase.rpc('jdvcrm_validate_my_company_v1', {
      p_application_id: applicationId,
    });
    if (e) {
      setError(validateMessage(e.message));
      setBusy(null);
      return;
    }
    router.replace('/business/dashboard');
  }

  if (loading) return <p className="text-sm text-[#A0AEC0]">{t('vp.loading')}</p>;
  if (!data)
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
        {tr(error) || t('vp.unavail')}
      </div>
    );

  const legacy = data.application_status === 'approved_pending_email';
  const identityOk = data.identity.status === 'approved';
  const card = 'rounded-2xl border border-[#D4AF37]/20 bg-[#0F2347] p-6';

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {tr(error)}
        </div>
      )}

      {legacy ? (
        <section className={card}>
          <h2 className="text-lg font-bold text-white">{t('vp.appr')}</h2>
          <p className="mt-2 text-sm text-[#A0AEC0]">{t('vp.apprSub')}</p>
          <button
            onClick={validate}
            disabled={busy === 'validate'}
            className="btn-gold mt-5 rounded-xl px-6 py-3 text-sm font-bold disabled:opacity-60"
          >
            {busy === 'validate' ? t('vp.fin') : t('vp.finBtn')}
          </button>
        </section>
      ) : (
        <>
          <section className={card}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
                  {t('vp.step1')}
                </p>
                <h2 className="text-lg font-bold text-white">{t('vp.idH')}</h2>
              </div>
              {busy === 'identity' ? (
                <Loader2 className="animate-spin text-[#63B3ED]" />
              ) : identityOk ? (
                <CheckCircle2 className="text-green-400" />
              ) : data.identity.status === 'refused' ? (
                <XCircle className="text-red-400" />
              ) : (
                <Clock className="text-orange-300" />
              )}
            </div>
            {busy === 'identity' && <p className="mt-3 text-sm text-[#A0AEC0]">{t('vp.ai')}</p>}
            {!busy && identityOk && <p className="mt-3 text-sm text-green-300">{t('vp.idOk')}</p>}
            {!busy && data.identity.status === 'refused' && (
              <div className="mt-3 space-y-2">
                <p className="text-sm text-red-300">{t('vp.idNo')}</p>
                <ul className="list-disc space-y-1 pl-5 text-sm text-red-200">
                  {data.identity.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {!busy && !identityOk && !editing && (
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={openEdit}
                  className="btn-gold rounded-xl px-5 py-2.5 text-sm font-bold"
                >
                  {t('vp.fix')}
                </button>
                <button
                  onClick={runIdentity}
                  className="rounded-xl border border-[#D4AF37]/30 px-5 py-2.5 text-sm text-[#D4AF37]"
                >
                  {t('vp.rerun')}
                </button>
              </div>
            )}
            {editing && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {EDIT_FIELDS.map(([key, label]) => (
                  <label
                    key={key}
                    className="text-xs font-semibold uppercase tracking-wide text-[#A0AEC0]"
                  >
                    {t(label)}
                    <input
                      value={form[key] ?? ''}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      className="input-navy mt-1 w-full px-3 py-2.5 text-sm normal-case"
                    />
                  </label>
                ))}
                <div className="flex gap-3 sm:col-span-2">
                  <button
                    onClick={saveEdit}
                    className="btn-gold rounded-xl px-5 py-2.5 text-sm font-bold"
                  >
                    {t('vp.saveRe')}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-[#A0AEC0]"
                  >
                    {t('vp.cancel')}
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className={`${card} ${identityOk ? '' : 'opacity-50'}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              {t('vp.step2')}
            </p>
            <h2 className="text-lg font-bold text-white">{t('vp.docH')}</h2>
            <p className="mt-1 text-sm text-[#A0AEC0]">{t('vp.docSub')}</p>
            <div className="mt-4 space-y-3">
              {data.documents.map((d) => {
                const isBusy = busy === d.type;
                const canSend =
                  identityOk && !busy && d.status !== 'verified' && d.status !== 'needs_review';
                return (
                  <div
                    key={d.type}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-white/5 bg-[#0A1628] p-4"
                  >
                    <DocIcon status={d.status} busy={isBusy} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">
                        {DOC_LABELS[d.type] ? t(DOC_LABELS[d.type]) : d.type}
                      </p>
                      <p
                        className={`text-xs ${d.status === 'rejected' ? 'text-red-300' : d.status === 'verified' ? 'text-green-300' : 'text-[#A0AEC0]'}`}
                      >
                        {isBusy ? t('vp.docBusy') : docText(d, t)}
                      </p>
                    </div>
                    {canSend && (
                      <label className="cursor-pointer rounded-lg border border-[#D4AF37]/30 px-3 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10">
                        {d.status === 'missing' ? t('vp.send') : t('vp.resend')}
                        <input
                          type="file"
                          accept={ACCEPTED.join(',')}
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (f) upload(d.type, f);
                          }}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className={`${card} ${data.can_validate ? '' : 'opacity-50'}`}>
            <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              {t('vp.step3')}
            </p>
            <h2 className="text-lg font-bold text-white">{t('vp.valH')}</h2>
            <p className="mt-1 text-sm text-[#A0AEC0]">{t('vp.valSub')}</p>
            <button
              onClick={validate}
              disabled={!data.can_validate || busy === 'validate'}
              className="btn-gold mt-4 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ShieldCheck size={16} /> {busy === 'validate' ? t('vp.creating') : t('vp.valH')}
            </button>
          </section>
        </>
      )}
    </div>
  );
}
