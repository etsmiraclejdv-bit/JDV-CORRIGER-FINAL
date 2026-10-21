'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

const docs = [
  ['identity', 'bz.oDoc.identity'],
  ['rccm', 'bz.oDoc.rccm'],
  ['ifu', 'bz.oDoc.ifu'],
  ['incorporation', 'bz.oDoc.incorporation'],
  ['statutes', 'bz.oDoc.statutes'],
  ['mandate', 'bz.oDoc.mandate'],
  ['address_proof', 'bz.oDoc.address_proof'],
] as const;
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

type ValidationState = {
  identity?: { status?: string; reasons?: string[]; attempts?: number };
  documents?: Array<{
    type: string;
    status: string;
    reason?: string | null;
    document_id?: string | null;
    name?: string | null;
  }>;
  can_validate?: boolean;
};

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const { t } = useLanguage();
  // Une valeur « bz.… » est une clé de traduction ; sinon c'est un texte brut venant du serveur.
  const show = (s: string) => (s.startsWith('bz.') ? t(s as TerrainKey) : s);
  const fill = (key: TerrainKey, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      t(key)
    );
  const [app, setApp] = useState<any>(null);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [validation, setValidation] = useState<ValidationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refreshValidation = useCallback(async (applicationId: string) => {
    const { data, error: rpcError } = await supabase.rpc('jdvcrm_my_company_validation_v1', {
      p_application_id: applicationId,
    });
    if (rpcError) throw rpcError;
    setValidation(data as ValidationState);
    return data as ValidationState;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.replace('/business/login');
          return;
        }
        const { data, error: queryError } = await supabase
          .from('organization_applications')
          .select('id,company_name,status,professional_email,company_nature,company_size')
          .eq('applicant_user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (queryError) throw queryError;
        if (!data) throw new Error('bz.oNoFile');
        if (cancelled) return;
        setApp(data);
        await refreshValidation(data.id);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'bz.oLoadFail');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, refreshValidation]);

  async function reviewIdentity() {
    if (!app) return;
    setBusy('identity');
    setError('');
    setNotice('');
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('company-ai-review', {
        body: { application_id: app.id, stage: 'identity' },
      });
      if (invokeError) throw invokeError;
      if (data?.status === 'approved') setNotice('bz.oIdApproved');
      else if (data?.status === 'refused')
        setError((data.reasons || ['bz.oIdRefused']).map((r: string) => show(r)).join(' '));
      else setNotice(data?.message || 'bz.oResult');
      await refreshValidation(app.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'bz.oIdFail');
    } finally {
      setBusy('');
    }
  }

  async function uploadDocument(type: string, labelKey: TerrainKey) {
    const label = t(labelKey);
    const file = files[type];
    if (!app || !file) {
      setError('bz.oPickFile');
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('bz.oBadFormat');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('bz.oTooBig');
      return;
    }
    setBusy(type);
    setError('');
    setNotice('');
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('bz.oSession');
      const safeName = file.name.replace(/[^\w.-]/g, '_');
      const path = user.id + '/' + app.id + '/' + Date.now() + '-' + safeName;
      const { error: storageError } = await supabase.storage
        .from('company-kyb-documents')
        .upload(path, file, {
          upsert: false,
          contentType: file.type,
        });
      if (storageError) throw storageError;
      const { data: doc, error: insertError } = await supabase
        .from('organization_application_documents')
        .insert({
          application_id: app.id,
          document_type: type,
          document_name: file.name,
          storage_path: path,
          mime_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
        })
        .select('id')
        .single();
      if (insertError) throw insertError;
      const { data: verdict, error: reviewError } = await supabase.functions.invoke(
        'company-ai-review',
        {
          body: { application_id: app.id, stage: 'document', document_id: doc.id },
        }
      );
      if (reviewError) throw reviewError;
      if (verdict?.status === 'verified') setNotice(fill('bz.oDocVerified', { l: label }));
      else if (verdict?.status === 'rejected')
        setNotice(fill('bz.oDocRejected', { l: label, r: verdict.reason || t('bz.oSendNew') }));
      else if (verdict?.status === 'needs_review') setNotice(verdict.message || 'bz.oNeedsReview');
      else setNotice('bz.oSubmitted');
      setFiles((current) => ({ ...current, [type]: null }));
      await refreshValidation(app.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'bz.oUploadFail');
    } finally {
      setBusy('');
    }
  }

  async function validateCompany() {
    if (!app || !validation?.can_validate) return;
    setBusy('activate');
    setError('');
    setNotice('');
    try {
      const { data, error: rpcError } = await supabase.rpc('jdvcrm_validate_my_company_v1', {
        p_application_id: app.id,
      });
      if (rpcError) throw rpcError;
      if (!data || (Array.isArray(data) && !data[0])) throw new Error('bz.oNoConfirm');
      router.replace('/business/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'bz.oValFail');
    } finally {
      setBusy('');
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-[#0B1B3D] text-white grid place-items-center">
        <Loader2 className="animate-spin mr-2" />
        {t('bz.oLoading')}
      </div>
    );

  const identityStatus = validation?.identity?.status || 'pending';
  const stKeys = [
    'missing',
    'pending',
    'analyzing',
    'verified',
    'approved',
    'rejected',
    'refused',
    'stale',
    'needs_review',
  ];
  const statusLabel = (s: string) => (stKeys.includes(s) ? t(('bz.oSt.' + s) as TerrainKey) : s);
  const statusClass = (status: string) =>
    ['verified', 'approved'].includes(status)
      ? 'text-emerald-300'
      : ['rejected', 'refused'].includes(status)
        ? 'text-red-300'
        : status === 'needs_review'
          ? 'text-amber-300'
          : 'text-slate-300';

  return (
    <main className="min-h-screen bg-[#0B1B3D] text-white px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8">
          <p className="text-[#D4AF37] text-xs uppercase tracking-widest">{t('bz.oKicker')}</p>
          <h1 className="text-3xl font-bold mt-2">
            {fill('bz.oTitle', { n: app?.company_name || t('bz.oYourCompany') })}
          </h1>
          <p className="text-slate-300 mt-2">{t('bz.oIntro')}</p>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 flex gap-2"
          >
            <AlertCircle className="shrink-0" size={19} />
            <span>{show(error)}</span>
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="mb-4 p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-amber-100"
          >
            {show(notice)}
          </div>
        )}

        <section className="grid md:grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#0F2347] p-5">
            <span className="text-xs text-[#D4AF37]">{fill('bz.oStep', { n: 1 })}</span>
            <h2 className="font-bold mt-2">{t('bz.oS1')}</h2>
            <p className={'text-sm mt-2 ' + statusClass(identityStatus)}>
              {statusLabel(identityStatus)}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              {fill('bz.oAttempts', { a: validation?.identity?.attempts ?? 0 })}
            </p>
            <button
              onClick={reviewIdentity}
              disabled={!!busy || identityStatus === 'approved'}
              className="mt-4 w-full rounded-lg bg-[#D4AF37] text-[#0B1B3D] p-3 font-semibold disabled:opacity-50"
            >
              {busy === 'identity'
                ? t('bz.oChecking')
                : identityStatus === 'approved'
                  ? t('bz.oIdApprovedBtn')
                  : t('bz.oVerifyId')}
            </button>
            {validation?.identity?.reasons?.length ? (
              <ul className="mt-3 list-disc pl-5 text-sm text-red-200">
                {validation.identity.reasons.map((reason, i) => (
                  <li key={i}>{show(reason)}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#0F2347] p-5">
            <span className="text-xs text-[#D4AF37]">{fill('bz.oStep', { n: 2 })}</span>
            <h2 className="font-bold mt-2">{t('bz.oS2')}</h2>
            <p className="text-sm text-slate-300 mt-2">{t('bz.oFormats')}</p>
            <p className="text-xs text-slate-400 mt-2">{t('bz.oReplace')}</p>
          </div>
          <div className="rounded-2xl border border-[#D4AF37]/30 bg-[#0F2347] p-5">
            <span className="text-xs text-[#D4AF37]">{fill('bz.oStep', { n: 3 })}</span>
            <h2 className="font-bold mt-2">{t('bz.oS3')}</h2>
            <p className="text-sm mt-2 text-slate-300">
              {validation?.can_validate ? t('bz.oAllGreen') : t('bz.oAfter')}
            </p>
            <button
              onClick={validateCompany}
              disabled={!!busy || !validation?.can_validate}
              className="mt-4 w-full rounded-lg bg-emerald-500 text-slate-950 p-3 font-bold disabled:opacity-40"
            >
              {busy === 'activate' ? t('bz.fActivating') : t('bz.oValidate')}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-[#D4AF37]/20 bg-[#0F2347] p-5 md:p-7">
          <h2 className="text-xl font-bold mb-4">{t('bz.oPieces')}</h2>
          <div className="space-y-4">
            {docs.map(([type, labelKey]) => {
              const current = validation?.documents?.find((document) => document.type === type);
              const status = current?.status || 'missing';
              const selectedFile = files[type];
              return (
                <div key={type} className="rounded-xl border border-white/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-[#D4AF37]" />
                      <span className="font-semibold">{t(labelKey)}</span>
                    </div>
                    <span className={'text-sm flex items-center gap-1 ' + statusClass(status)}>
                      {status === 'verified' ? (
                        <CheckCircle2 size={16} />
                      ) : ['rejected', 'refused'].includes(status) ? (
                        <XCircle size={16} />
                      ) : null}
                      {statusLabel(status)}
                    </span>
                  </div>
                  {current?.reason && (
                    <p className="text-sm text-red-200 mb-3">{show(current.reason)}</p>
                  )}
                  {status === 'verified' ? (
                    <p className="text-sm text-emerald-200">{t('bz.oChecked')}</p>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-white/20 p-3 text-sm text-slate-300">
                        <span className="flex items-center gap-2">
                          <UploadCloud size={17} />
                          {selectedFile?.name || t('bz.oChooseNew')}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            setFiles((old) => ({ ...old, [type]: file }));
                            event.currentTarget.value = '';
                            setError('');
                          }}
                        />
                      </label>
                      <button
                        onClick={() => uploadDocument(type, labelKey)}
                        disabled={!selectedFile || !!busy || identityStatus !== 'approved'}
                        className="rounded-lg bg-[#D4AF37] text-[#0B1B3D] px-5 py-3 font-semibold disabled:opacity-40"
                      >
                        {busy === type ? t('bz.oSending') : t('bz.oSend')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex items-start gap-3 text-sm text-slate-400">
            <ShieldCheck className="text-[#D4AF37] shrink-0" size={20} />
            <p>{t('bz.oPrivate')}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
