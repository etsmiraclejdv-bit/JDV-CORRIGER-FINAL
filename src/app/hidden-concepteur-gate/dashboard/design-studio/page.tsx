'use client';
import { useCallback, useEffect, useState } from 'react';
import { Palette, Save, Send, RotateCcw, History } from 'lucide-react';
import { toast } from 'sonner';
import { checkCurrentSuperAdmin } from '@/lib/auth/super-admin';
import { DEFAULT_DESIGN_CONFIG } from '@/features/design-studio/defaults';
import { createDesignVersion, listDesignVersions } from '@/features/design-studio/designService';
import type { DesignConfig, DesignVersion } from '@/features/design-studio/types';
import VisualDesignEditor from '@/features/design-studio/VisualDesignEditor';
import { supabase } from '@/lib/supabase/client';

export default function DesignStudioPage() {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<DesignConfig>(DEFAULT_DESIGN_CONFIG);
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [history, setHistory] = useState(false);
  const [uploading, setUploading] = useState<'background' | 'update' | null>(null);

  async function uploadMedia(file: File, target: 'background' | 'update') {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm'];
    if (!allowed.includes(file.type)) {
      toast.error('Format refusé. Utilisez JPG, PNG, WebP, GIF, AVIF, MP4 ou WebM.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Le fichier dépasse la limite de 50 Mo.');
      return;
    }
    setUploading(target);
    try {
      const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '-').slice(-100);
      const path = 'platform/' + Date.now() + '-' + safeName;
      const { error } = await supabase.storage.from('jdv-dashboard-backgrounds').upload(path, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from('jdv-dashboard-backgrounds').getPublicUrl(path);
      setConfig((current) => target === 'background'
        ? { ...current, backgroundMediaUrl: data.publicUrl }
        : { ...current, updateMediaUrl: data.publicUrl, updateMediaType: file.type.startsWith('video/') ? 'video' : 'image' });
      toast.success('Média téléversé. Enregistrez un brouillon avant de publier.');
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Téléversement impossible. Vérifiez la migration du studio et vos droits concepteur.');
    } finally {
      setUploading(null);
    }
  }

  const reload = useCallback(async () => {
    const result = await listDesignVersions('platform');
    if (result.error) {
      toast.error('Historique indisponible : vérifiez que la migration du studio a été appliquée.');
      return;
    }
    setVersions(result.data);
    const published = result.data.find((v) => v.status === 'published');
    if (published) setConfig({ ...DEFAULT_DESIGN_CONFIG, ...published.config });
  }, []);

  useEffect(() => {
    let live = true;
    checkCurrentSuperAdmin()
      .then(async (r) => {
        if (!live) return;
        setAllowed(r.ok);
        if (r.ok) await reload();
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => {
      live = false;
    };
  }, [reload]);

  async function save(status: 'draft' | 'published') {
    setSaving(true);
    const result = await createDesignVersion({ scope: 'platform', config, status });
    setSaving(false);
    if (result.error) {
      toast.error(
        result.error.message ||
          'Échec. La migration SQL du studio est nécessaire avant l’enregistrement.'
      );
      return;
    }
    toast.success(status === 'published' ? 'Version publiée.' : 'Brouillon enregistré.');
    await reload();
  }

  if (loading) return <div className="p-8 text-sm text-[#A0AEC0]">Vérification des droits…</div>;
  if (!allowed)
    return (
      <div className="m-6 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
        Accès réservé au concepteur JDV CRM.
      </div>
    );

  const fields: { key: 'primaryColor' | 'secondaryColor' | 'accentColor'; label: string }[] = [
    { key: 'primaryColor', label: 'Couleur principale' },
    { key: 'secondaryColor', label: 'Couleur secondaire' },
    { key: 'accentColor', label: 'Couleur d’accentuation' },
  ];

  return (
    <div className="space-y-6 p-5 sm:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
            <Palette size={15} /> Studio de design
          </p>
          <h1 className="text-2xl font-bold text-white">Personnalisation globale</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#A0AEC0]">
            Configurez la charte, prévisualisez le résultat et gérez les versions sans déployer
            l’application.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            disabled={saving}
            onClick={() => save('draft')}
            className="flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 px-4 py-2.5 text-sm text-[#F5E17A] disabled:opacity-50"
          >
            <Save size={15} /> Brouillon
          </button>
          <button
            disabled={saving}
            onClick={() => save('published')}
            className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-[#0B1B3D] disabled:opacity-50"
          >
            <Send size={15} /> Publier
          </button>
        </div>
      </header>
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setHistory(false)}
          className={`border-b-2 px-3 py-3 text-sm ${!history ? 'border-[#D4AF37] text-[#F5E17A]' : 'border-transparent text-[#A0AEC0]'}`}
        >
          Éditeur
        </button>
        <button
          onClick={() => setHistory(true)}
          className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm ${history ? 'border-[#D4AF37] text-[#F5E17A]' : 'border-transparent text-[#A0AEC0]'}`}
        >
          <History size={14} /> Versions ({versions.length})
        </button>
      </div>
      {!history ? (
        <div className="space-y-5">
          <VisualDesignEditor config={config} onChange={setConfig} />
          <div className="grid gap-5 xl:grid-cols-2">
            <section className="space-y-5 rounded-2xl border border-white/10 bg-[#0F2347] p-5">
              <label className="block space-y-2">
                <span className="text-sm text-white">Nom affiché</span>
                <input
                  value={config.brandName}
                  onChange={(e) => setConfig((v) => ({ ...v, brandName: e.target.value }))}
                  maxLength={60}
                  className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5 text-sm text-white"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {fields.map((f) => (
                  <label key={f.key} className="space-y-2">
                    <span className="block text-xs text-[#A0AEC0]">{f.label}</span>
                    <input
                      type="color"
                      value={config[f.key]}
                      onChange={(e) => setConfig((v) => ({ ...v, [f.key]: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-white/10 bg-[#08152F] p-1"
                    />
                    <input
                      value={config[f.key]}
                      onChange={(e) => setConfig((v) => ({ ...v, [f.key]: e.target.value }))}
                      pattern="^#[0-9A-Fa-f]{6}$"
                      className="w-full rounded-lg border border-white/10 bg-[#08152F] px-2 py-1.5 text-xs text-white"
                    />
                  </label>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-white">
                  Thème
                  <select
                    value={config.mode}
                    onChange={(e) =>
                      setConfig((v) => ({ ...v, mode: e.target.value as DesignConfig['mode'] }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#08152F] p-2.5"
                  >
                    <option value="light">Clair</option>
                    <option value="dark">Sombre</option>
                    <option value="system">Système</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-white">
                  Densité
                  <select
                    value={config.density}
                    onChange={(e) =>
                      setConfig((v) => ({
                        ...v,
                        density: e.target.value as DesignConfig['density'],
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#08152F] p-2.5"
                  >
                    <option value="comfortable">Confortable</option>
                    <option value="compact">Compacte</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-white">
                  Arrondis
                  <select
                    value={config.radius}
                    onChange={(e) =>
                      setConfig((v) => ({ ...v, radius: e.target.value as DesignConfig['radius'] }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#08152F] p-2.5"
                  >
                    <option value="small">Discrets</option>
                    <option value="medium">Moyens</option>
                    <option value="large">Arrondis</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-white">
                  Taille du texte
                  <select
                    value={config.fontScale}
                    onChange={(e) =>
                      setConfig((v) => ({
                        ...v,
                        fontScale: e.target.value as DesignConfig['fontScale'],
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-[#08152F] p-2.5"
                  >
                    <option value="small">Petite</option>
                    <option value="normal">Normale</option>
                    <option value="large">Grande</option>
                  </select>
                </label>
              </div>
              <button
                onClick={() => setConfig(DEFAULT_DESIGN_CONFIG)}
                className="flex items-center gap-2 text-sm text-[#A0AEC0]"
              >
                <RotateCcw size={14} /> Réinitialiser l’éditeur
              </button>
            </section>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-white">Aperçu en direct</h2>
              <div
                className="overflow-hidden border p-5 shadow-xl"
                style={{
                  background: config.mode === 'dark' ? '#0B1B3D' : '#F5F7FB',
                  color: config.mode === 'dark' ? '#F7F9FC' : '#0B1B3D',
                  borderColor: config.primaryColor + '77',
                  borderRadius:
                    config.radius === 'small' ? 8 : config.radius === 'medium' ? 16 : 24,
                }}
              >
                <div
                  className="flex items-center gap-3 rounded-xl p-4 text-white"
                  style={{ background: config.secondaryColor }}
                >
                  <span
                    className="grid h-9 w-9 place-items-center font-bold"
                    style={{ background: config.primaryColor, color: '#0B1B3D' }}
                  >
                    J
                  </span>
                  <div>
                    <p className="font-bold">{config.brandName || 'JDV CRM'}</p>
                    <p className="text-xs opacity-70">Espace de travail</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    ['Prospects', '128'],
                    ['Clients', '86'],
                    ['Ventes', '2 450 000'],
                    ['Suivi', '78 %'],
                  ].map(([a, b]) => (
                    <div
                      key={a}
                      className="border p-4"
                      style={{
                        borderColor: config.primaryColor + '66',
                        borderRadius:
                          config.radius === 'small' ? 6 : config.radius === 'medium' ? 12 : 18,
                        padding: config.density === 'compact' ? 10 : 16,
                      }}
                    >
                      <p className="text-xs opacity-70">{a}</p>
                      <p
                        className="mt-2 text-xl font-bold"
                        style={{
                          color: config.primaryColor,
                          fontSize:
                            config.fontScale === 'small'
                              ? 16
                              : config.fontScale === 'large'
                                ? 24
                                : 20,
                        }}
                      >
                        {b}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold"
                  style={{ background: config.primaryColor, color: '#0B1B3D' }}
                >
                  Action principale
                </button>
              </div>
              <p className="text-xs leading-5 text-[#718096]">
                Aperçu indicatif. La propagation du design à toutes les pages sera vérifiée pendant
                les tests d’intégration.
              </p>
            </section>
          </div>
          <section className="grid gap-5 xl:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0F2347] p-5">
              <div>
                <h2 className="text-base font-bold text-white">Arrière-plan et animations</h2>
                <p className="mt-1 text-xs leading-5 text-[#A0AEC0]">Ajoutez une image ou une courte vidéo de fond pour les pages qui prennent en charge l’ambiance JDV. Respectez la lisibilité et les préférences de réduction des mouvements.</p>
              </div>
              <label className="block space-y-2 text-sm text-white">
                URL du média de fond
                <input value={config.backgroundMediaUrl ?? ''} onChange={(e) => setConfig((v) => ({ ...v, backgroundMediaUrl: e.target.value }))} placeholder="https://…" className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5 text-sm" />
              </label>
              <label className="block space-y-2 text-sm text-white">
                Importer une image ou vidéo (50 Mo maximum)
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm" disabled={uploading !== null} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadMedia(file, 'background'); e.currentTarget.value = ''; }} className="block w-full text-xs text-[#A0AEC0] file:mr-3 file:rounded-lg file:border-0 file:bg-[#D4AF37] file:px-3 file:py-2 file:font-bold file:text-[#0B1B3D]" />
                {uploading === 'background' && <span className="text-xs text-[#F5E17A]">Téléversement…</span>}
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-2 text-sm text-white">
                  Animation
                  <select value={config.backgroundAnimation ?? 'none'} onChange={(e) => setConfig((v) => ({ ...v, backgroundAnimation: e.target.value as NonNullable<DesignConfig['backgroundAnimation']> }))} className="w-full rounded-xl border border-white/10 bg-[#08152F] p-2.5">
                    <option value="none">Aucune</option>
                    <option value="slow-pan">Déplacement lent</option>
                    <option value="float">Flottement doux</option>
                    <option value="gradient">Dégradé animé</option>
                  </select>
                </label>
                <label className="block space-y-2 text-sm text-white">
                  Intensité visuelle ({Math.round((config.backgroundOpacity ?? 0.12) * 100)} %)
                  <input type="range" min="0.02" max="0.28" step="0.01" value={config.backgroundOpacity ?? 0.12} onChange={(e) => setConfig((v) => ({ ...v, backgroundOpacity: Number(e.target.value) }))} className="mt-3 w-full accent-[#D4AF37]" />
                </label>
              </div>
            </div>
            <div className="space-y-4 rounded-2xl border border-white/10 bg-[#0F2347] p-5">
              <div>
                <h2 className="text-base font-bold text-white">Actualités du concepteur</h2>
                <p className="mt-1 text-xs leading-5 text-[#A0AEC0]">Publiez une annonce de mise à jour, un visuel ou une courte vidéo de démonstration. La publication devient visible sur l’accueil lorsque la version est publiée.</p>
              </div>
              <label className="block space-y-2 text-sm text-white">
                Titre de l’annonce
                <input maxLength={120} value={config.updateTitle ?? ''} onChange={(e) => setConfig((v) => ({ ...v, updateTitle: e.target.value }))} placeholder="Nouvelle fonctionnalité disponible" className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5 text-sm" />
              </label>
              <label className="block space-y-2 text-sm text-white">
                Information à communiquer
                <textarea maxLength={2000} rows={4} value={config.updateBody ?? ''} onChange={(e) => setConfig((v) => ({ ...v, updateBody: e.target.value }))} placeholder="Expliquez ce qui change et comment l’utiliser…" className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5 text-sm" />
              </label>
              <label className="block space-y-2 text-sm text-white">
                URL du média de démonstration (facultatif)
                <input value={config.updateMediaUrl ?? ''} onChange={(e) => setConfig((v) => ({ ...v, updateMediaUrl: e.target.value }))} placeholder="https://…" className="w-full rounded-xl border border-white/10 bg-[#08152F] px-3 py-2.5 text-sm" />
              </label>
              <label className="block space-y-2 text-sm text-white">
                Importer image ou courte vidéo
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm" disabled={uploading !== null} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadMedia(file, 'update'); e.currentTarget.value = ''; }} className="block w-full text-xs text-[#A0AEC0] file:mr-3 file:rounded-lg file:border-0 file:bg-[#D4AF37] file:px-3 file:py-2 file:font-bold file:text-[#0B1B3D]" />
                {uploading === 'update' && <span className="text-xs text-[#F5E17A]">Téléversement…</span>}
              </label>
              <label className="flex items-center gap-3 text-sm text-white">
                <input type="checkbox" checked={config.updatePublished ?? false} onChange={(e) => setConfig((v) => ({ ...v, updatePublished: e.target.checked }))} className="h-4 w-4 accent-[#D4AF37]" />
                Afficher cette annonce sur la page d’accueil après publication du design
              </label>
            </div>
          </section>
        </div>
      ) : (
        <section className="divide-y divide-white/5 rounded-2xl border border-white/10 bg-[#0F2347]">
          {versions.length === 0 ? (
            <p className="p-5 text-sm text-[#A0AEC0]">Aucune version enregistrée.</p>
          ) : (
            versions.map((v) => (
              <div
                key={v.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    Version {v.version_no} · {v.status}
                  </p>
                  <p className="mt-1 text-xs text-[#718096]">
                    {new Date(v.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setConfig({ ...DEFAULT_DESIGN_CONFIG, ...v.config });
                    setHistory(false);
                    toast.success(
                      'Configuration chargée. Enregistrez-la comme nouveau brouillon pour conserver la restauration.'
                    );
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white"
                >
                  <RotateCcw size={13} /> Restaurer dans l’éditeur
                </button>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
}
