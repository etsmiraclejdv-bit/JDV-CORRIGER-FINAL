'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ImagePlus, Trash2, Sparkles, LoaderCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { fetchOrgProfile } from '@/lib/auth/context';
const db = supabase as any;

type Asset = {
  name: string;
  id?: string;
  created_at?: string;
  metadata?: { mimetype?: string; size?: number } | null;
};

export default function AmbiancePage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [opacity, setOpacity] = useState(14);
  const [fit, setFit] = useState<'cover' | 'contain' | 'auto'>('cover');
  const [motion, setMotion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const bucket = 'jdv-dashboard-backgrounds';

  const loadAssets = useCallback(async (orgId: string) => {
    const { data } = await supabase.storage
      .from(bucket)
      .list(orgId, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    setAssets((data ?? []).filter((item) => item.name && !item.name.startsWith('.')) as Asset[]);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: profile } = await fetchOrgProfile();
      const orgId = profile?.organization_id;
      if (!orgId) {
        if (alive) {
          setMessage('Aucune organisation active n’est associée à votre compte.');
          setLoading(false);
        }
        return;
      }
      const [settings] = await Promise.all([
        db
          .from('organization_personalization')
          .select(
            'dashboard_background_url,dashboard_background_opacity,dashboard_background_fit,dashboard_background_motion'
          )
          .eq('organization_id', orgId)
          .maybeSingle(),
        loadAssets(orgId),
      ]);
      if (!alive) return;
      setOrganizationId(orgId);
      setSelectedUrl(settings.data?.dashboard_background_url ?? '');
      setOpacity(Math.round(Number(settings.data?.dashboard_background_opacity ?? 0.14) * 100));
      setFit((settings.data?.dashboard_background_fit ?? 'cover') as 'cover' | 'contain' | 'auto');
      setMotion(Boolean(settings.data?.dashboard_background_motion));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [loadAssets]);

  async function saveSettings(url = selectedUrl) {
    if (!organizationId) return;
    setBusy(true);
    setMessage('');
    const { error } = await db.from('organization_personalization').upsert(
      {
        organization_id: organizationId,
        dashboard_background_url: url || null,
        dashboard_background_opacity: opacity / 100,
        dashboard_background_fit: fit,
        dashboard_background_motion: motion,
        dashboard_background_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id' }
    );
    setBusy(false);
    setMessage(error ? `Enregistrement impossible : ${error.message}` : 'Ambiance enregistrée.');
  }

  async function upload(file?: File) {
    if (!file || !organizationId) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(file.type)) {
      setMessage('Format refusé. Utilisez JPG, PNG, WebP, GIF ou AVIF.');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setMessage('Le fichier dépasse la limite de 12 Mo.');
      return;
    }
    setBusy(true);
    setMessage('');
    const safeName =
      file.name
        .normalize('NFKD')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .slice(-90) || 'background';
    const path = `${organizationId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (uploadError) {
      setBusy(false);
      setMessage(`Téléversement impossible : ${uploadError.message}`);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    setSelectedUrl(data.publicUrl);
    const { error: saveError } = await db.from('organization_personalization').upsert(
      {
        organization_id: organizationId,
        dashboard_background_url: data.publicUrl,
        dashboard_background_opacity: opacity / 100,
        dashboard_background_fit: fit,
        dashboard_background_motion: motion,
        dashboard_background_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id' }
    );
    await loadAssets(organizationId);
    setBusy(false);
    setMessage(
      saveError
        ? `Image importée, mais réglages non enregistrés : ${saveError.message}`
        : 'Image importée et appliquée au fond du tableau de bord.'
    );
  }

  async function removeAsset(name: string) {
    if (!organizationId) return;
    const path = `${organizationId}/${name}`;
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      setMessage(error.message);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (selectedUrl === data.publicUrl) {
      setSelectedUrl('');
      await saveSettings('');
    }
    await loadAssets(organizationId);
    setMessage('Image supprimée.');
  }

  if (loading) return <div className="p-8 text-slate-300">Chargement du studio d’ambiance…</div>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8 text-white">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-amber-300">
            <Sparkles size={20} />
            <span className="text-xs font-semibold uppercase tracking-[.2em]">
              Personnalisation
            </span>
          </div>
          <h1 className="text-2xl font-bold">Studio d’ambiance</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Importe tes images de fond, GIF animés ou visuels de marque. Le fond reste décoratif et
            ne doit pas gêner la lecture.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-semibold text-slate-950 hover:bg-amber-300">
          {busy ? <LoaderCircle className="animate-spin" size={18} /> : <ImagePlus size={18} />}{' '}
          Importer une image
          <input
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              void upload(file);
              e.currentTarget.value = '';
            }}
          />
        </label>
      </header>
      {message && (
        <div
          className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${message.includes('impossible') || message.includes('dépasse') || message.includes('refusé') ? 'border-red-400/30 bg-red-950/30 text-red-200' : 'border-emerald-400/30 bg-emerald-950/30 text-emerald-200'}`}
        >
          {message.startsWith('Ambiance') || message.startsWith('Image') ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{message}</span>
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
          <div className="border-b border-white/10 p-4">
            <h2 className="font-semibold">Aperçu du fond</h2>
            <p className="mt-1 text-xs text-slate-400">
              Les images GIF conservent leur animation dans l’application.
            </p>
          </div>
          <div className="relative min-h-72 overflow-hidden bg-[#0B1B3D] p-6">
            {selectedUrl && (
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("${selectedUrl}")`,
                  backgroundSize: fit,
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  opacity: opacity / 100,
                  animation: motion
                    ? 'jdv-preview-drift 24s ease-in-out infinite alternate'
                    : undefined,
                }}
              />
            )}
            <div className="relative space-y-3">
              <div className="w-36 rounded-lg border border-white/10 bg-[#08152f]/90 p-3 text-xs text-slate-200">
                JDV CRM
                <br />
                <span className="text-amber-300">Tableau de bord</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-[#0F2347]/90 p-4">
                  <span className="text-xs text-slate-300">Clients</span>
                  <p className="mt-2 text-2xl font-bold">128</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0F2347]/90 p-4">
                  <span className="text-xs text-slate-300">Activité</span>
                  <p className="mt-2 text-2xl font-bold text-emerald-300">+12%</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="space-y-5 rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="font-semibold">Réglages visuels</h2>
          <label className="block text-sm">
            Opacité du fond <span className="float-right text-amber-300">{opacity}%</span>
            <input
              className="mt-3 w-full accent-amber-400"
              type="range"
              min="0"
              max="45"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
            />
            <span className="mt-1 block text-xs text-slate-400">
              Conseil : 8 à 20 % pour conserver une bonne lisibilité.
            </span>
          </label>
          <label className="block text-sm">
            Ajustement de l’image
            <select
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-white"
              value={fit}
              onChange={(e) => setFit(e.target.value as typeof fit)}
            >
              <option value="cover">Remplir l’écran</option>
              <option value="contain">Afficher l’image entière</option>
              <option value="auto">Taille originale</option>
            </select>
          </label>
          <label className="flex items-start gap-3 rounded-xl bg-slate-800/70 p-3">
            <input
              className="mt-1 accent-amber-400"
              type="checkbox"
              checked={motion}
              onChange={(e) => setMotion(e.target.checked)}
            />
            <span className="text-sm">
              <b>Animation lente du fond</b>
              <span className="mt-1 block text-xs text-slate-400">
                Déplacement subtil, désactivable pour limiter les distractions.
              </span>
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={busy}
              onClick={() => void saveSettings()}
              className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {busy ? 'Enregistrement…' : 'Enregistrer les réglages'}
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setSelectedUrl('');
                void saveSettings('');
              }}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-200 disabled:opacity-50"
            >
              Retirer le fond
            </button>
          </div>
        </section>
      </div>
      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
        <div className="mb-4">
          <h2 className="font-semibold">Bibliothèque des images</h2>
          <p className="mt-1 text-xs text-slate-400">
            Les fichiers sont stockés dans le bucket JDV dédié à l’organisation.
          </p>
        </div>
        {assets.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">
            Aucune image importée pour le moment.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {assets.map((asset) => (
              <div
                key={asset.name}
                className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/60"
              >
                <button
                  className="block w-full text-left"
                  onClick={() => {
                    const { data } = supabase.storage
                      .from(bucket)
                      .getPublicUrl(`${organizationId}/${asset.name}`);
                    setSelectedUrl(data.publicUrl);
                  }}
                >
                  <div
                    className="h-28 bg-slate-800 bg-cover bg-center"
                    style={{
                      backgroundImage: `url("${supabase.storage.from(bucket).getPublicUrl(`${organizationId}/${asset.name}`).data.publicUrl}")`,
                    }}
                  />
                  <p className="truncate p-3 text-xs">{asset.name}</p>
                </button>
                <div className="flex justify-between border-t border-white/10 p-2">
                  <button
                    onClick={() => {
                      const { data } = supabase.storage
                        .from(bucket)
                        .getPublicUrl(`${organizationId}/${asset.name}`);
                      setSelectedUrl(data.publicUrl);
                    }}
                    className="text-xs text-amber-300"
                  >
                    Prévisualiser
                  </button>
                  <button
                    onClick={() => void removeAsset(asset.name)}
                    className="rounded p-1 text-red-300 hover:bg-red-950/50"
                    title="Supprimer l’image"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <style jsx global>{`
        @keyframes jdv-preview-drift {
          from {
            transform: scale(1);
            background-position: 45% 45%;
          }
          to {
            transform: scale(1.06);
            background-position: 55% 55%;
          }
        }
      `}</style>
    </div>
  );
}
