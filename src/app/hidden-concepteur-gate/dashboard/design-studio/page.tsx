'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Palette, Save, Send, RotateCcw, History } from 'lucide-react';
import { toast } from 'sonner';
import { checkCurrentSuperAdmin } from '@/lib/auth/super-admin';
import { DEFAULT_DESIGN_CONFIG } from '@/features/design-studio/defaults';
import { createDesignVersion, listDesignVersions } from '@/features/design-studio/designService';
import type { DesignConfig, DesignVersion } from '@/features/design-studio/types';
import VisualDesignEditor from '@/features/design-studio/VisualDesignEditor';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

export default function DesignStudioPage() {
  const { t, locale } = useLanguage();
  const tRef = useRef(t);
  tRef.current = t;
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<DesignConfig>(DEFAULT_DESIGN_CONFIG);
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [history, setHistory] = useState(false);
  const [uploading, setUploading] = useState<'background' | 'update' | null>(null);

  /* eslint-disable prettier/prettier */
  async function uploadMedia(file: File, target: 'background' | 'update') {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
      'video/mp4',
      'video/webm',
    ];
    if (!allowed.includes(file.type)) {
      toast.error(t('cg.dsFmt'));
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error(t('cg.dsSize'));
      return;
    }
    setUploading(target);
    try {
      const safeName = file.name
        .normalize('NFKD')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .slice(-100);
      const path = 'platform/' + Date.now() + '-' + safeName;
      const { error } = await supabase.storage
        .from('jdv-dashboard-backgrounds')
        .upload(path, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        });
      if (error) throw error;
      const { data } = supabase.storage.from('jdv-dashboard-backgrounds').getPublicUrl(path);
      setConfig((current) =>
        target === 'background'
          ? { ...current, backgroundMediaUrl: data.publicUrl }
          : {
              ...current,
              updateMediaUrl: data.publicUrl,
              updateMediaType: file.type.startsWith('video/') ? 'video' : 'image',
            }
      );
      toast.success(t('cg.dsUpOk'));
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : t('cg.dsUpErr'));
    } finally {
      setUploading(null);
    }
  }
  /* eslint-enable prettier/prettier */

  const reload = useCallback(async () => {
    const result = await listDesignVersions('platform');
    if (result.error) {
      toast.error(tRef.current('cg.dsHist'));
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
      toast.error(result.error.message || t('cg.dsSaveErr'));
      return;
    }
    toast.success(status === 'published' ? t('cg.dsPubOk') : t('cg.dsDraftOk'));
    await reload();
  }

  if (loading) return <div className="p-8 text-sm text-[#A1A1AA]">{t('cg.dsCheck')}</div>;
  if (!allowed)
    return (
      <div className="m-6 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-200">
        {t('cg.dsDenied')}
      </div>
    );

  const fields: { key: 'primaryColor' | 'secondaryColor' | 'accentColor'; label: string }[] = [
    { key: 'primaryColor', label: t('cg.dsPrimary') },
    { key: 'secondaryColor', label: t('cg.dsSecondary') },
    { key: 'accentColor', label: t('cg.dsAccent') },
  ];

  /* eslint-disable prettier/prettier */
  return (
    <div className="space-y-6 p-5 sm:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#34D399]">
            <Palette size={15} /> {t('cg.dsStudio')}
          </p>
          <h1 className="text-2xl font-bold text-white">{t('cg.dsGlobal')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#A1A1AA]">{t('cg.dsGlobalSub')}</p>
        </div>
        <div className="flex gap-2">
          <button
            disabled={saving}
            onClick={() => save('draft')}
            className="flex items-center gap-2 rounded-xl border border-[#1E355B] px-4 py-2.5 text-sm text-[#6EE7B7] disabled:opacity-50"
          >
            <Save size={15} /> {t('cg.dsDraftBtn')}
          </button>
          <button
            disabled={saving}
            onClick={() => save('published')}
            className="flex items-center gap-2 rounded-xl bg-[#147866] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            <Send size={15} /> {t('cg.dsPublish')}
          </button>
        </div>
      </header>
      <div className="flex gap-2 border-b border-[#1E355B]">
        <button
          onClick={() => setHistory(false)}
          className={`border-b-2 px-3 py-3 text-sm ${!history ? 'border-[#34D399] text-[#6EE7B7]' : 'border-transparent text-[#AFC0D8]'}`}
        >
          {t('cg.dsEditor')}
        </button>
        <button
          onClick={() => setHistory(true)}
          className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm ${history ? 'border-[#34D399] text-[#6EE7B7]' : 'border-transparent text-[#AFC0D8]'}`}
        >
          <History size={14} /> {t('cg.dsVersions').replace('{n}', String(versions.length))}
        </button>
      </div>
      {!history ? (
        <div className="space-y-5">
          <VisualDesignEditor config={config} onChange={setConfig} />
          <div className="grid gap-5 xl:grid-cols-2">
            <section className="space-y-5 rounded-2xl border border-[#1E355B] bg-[#080B12] p-5">
              <label className="block space-y-2">
                <span className="text-sm text-white">{t('cg.dsBrand')}</span>
                <input
                  value={config.brandName}
                  onChange={(e) => setConfig((v) => ({ ...v, brandName: e.target.value }))}
                  maxLength={60}
                  className="w-full rounded-xl border border-[#1E355B] bg-[#0A0D16] px-3 py-2.5 text-sm text-[#F4F7FC]"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                {fields.map((f) => (
                  <label key={f.key} className="space-y-2">
                    <span className="block text-xs text-[#AFC0D8]">{f.label}</span>
                    <input
                      type="color"
                      value={config[f.key]}
                      onChange={(e) => setConfig((v) => ({ ...v, [f.key]: e.target.value }))}
                      className="h-11 w-full rounded-lg border border-[#1E355B] bg-[#0A0D16] p-1"
                    />
                    <input
                      value={config[f.key]}
                      onChange={(e) => setConfig((v) => ({ ...v, [f.key]: e.target.value }))}
                      pattern="^#[0-9A-Fa-f]{6}$"
                      className="w-full rounded-lg border border-[#1E355B] bg-[#0A0D16] px-2 py-1.5 text-xs text-[#F4F7FC]"
                    />
                  </label>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-sm text-white">
                  {t('cg.dsTheme')}
                  <select
                    value={config.mode}
                    onChange={(e) =>
                      setConfig((v) => ({ ...v, mode: e.target.value as DesignConfig['mode'] }))
                    }
                    className="mt-2 w-full rounded-xl border border-[#1E355B] bg-[#0A0D16] p-2.5"
                  >
                    <option value="light">{t('cg.dsLight')}</option>
                    <option value="dark">{t('cg.dsDark')}</option>
                    <option value="system">{t('cg.dsSystem')}</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-white">
                  {t('cg.dsDensity')}
                  <select
                    value={config.density}
                    onChange={(e) =>
                      setConfig((v) => ({
                        ...v,
                        density: e.target.value as DesignConfig['density'],
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-[#1E355B] bg-[#0A0D16] p-2.5"
                  >
                    <option value="comfortable">{t('cg.dsComfort')}</option>
                    <option value="compact">{t('cg.dsCompact')}</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-white">
                  {t('cg.dsRadius')}
                  <select
                    value={config.radius}
                    onChange={(e) =>
                      setConfig((v) => ({ ...v, radius: e.target.value as DesignConfig['radius'] }))
                    }
                    className="mt-2 w-full rounded-xl border border-[#1E355B] bg-[#0A0D16] p-2.5"
                  >
                    <option value="small">{t('cg.dsRSmall')}</option>
                    <option value="medium">{t('cg.dsRMed')}</option>
                    <option value="large">{t('cg.dsRLarge')}</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-white">
                  {t('cg.dsFont')}
                  <select
                    value={config.fontScale}
                    onChange={(e) =>
                      setConfig((v) => ({
                        ...v,
                        fontScale: e.target.value as DesignConfig['fontScale'],
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-[#1E355B] bg-[#0A0D16] p-2.5"
                  >
                    <option value="small">{t('cg.dsFSmall')}</option>
                    <option value="normal">{t('cg.dsFNormal')}</option>
                    <option value="large">{t('cg.dsFLarge')}</option>
                  </select>
                </label>
              </div>
              <button
                onClick={() => setConfig(DEFAULT_DESIGN_CONFIG)}
                className="flex items-center gap-2 text-sm text-[#AFC0D8]"
              >
                <RotateCcw size={14} /> {t('cg.dsReset')}
              </button>
            </section>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-white">{t('cg.dsLive')}</h2>
              <div
                className="overflow-hidden border p-5 shadow-xl"
                style={{
                  background: config.mode === 'dark' ? '#0A0D16' : '#F5F7FB',
                  color: config.mode === 'dark' ? '#F7F9FC' : '#0A0D16',
                  borderColor: config.primaryColor + '77',
                  borderRadius:
                    config.radius === 'small' ? 8 : config.radius === 'medium' ? 16 : 24,
                }}
              >
                <div
                  className="flex items-center gap-3 rounded-xl p-4 text-[#F4F7FC]"
                  style={{ background: config.secondaryColor }}
                >
                  <span
                    className="grid h-9 w-9 place-items-center font-bold"
                    style={{ background: config.primaryColor, color: '#0A0D16' }}
                  >
                    J
                  </span>
                  <div>
                    <p className="font-bold">{config.brandName || 'JDV CRM'}</p>
                    <p className="text-xs opacity-70">{t('cg.dsWork')}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    [t('cg.dsProspects'), '128'],
                    [t('cg.dsClients'), '86'],
                    [t('cg.dsSales'), '2 450 000'],
                    [t('cg.dsFollow'), '78 %'],
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
                  style={{ background: config.primaryColor, color: '#0A0D16' }}
                >
                  {t('cg.dsAction')}
                </button>
              </div>
              <p className="text-xs leading-5 text-[#71717A]">{t('cg.dsIndic')}</p>
            </section>
          </div>
          <section className="grid gap-5 xl:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-[#1E355B] bg-[#080B12] p-5">
              <div>
                <h2 className="text-base font-bold text-white">{t('cg.dsBgH')}</h2>
                <p className="mt-1 text-xs leading-5 text-[#A1A1AA]">{t('cg.dsBgSub')}</p>
              </div>
              <label className="block space-y-2 text-sm text-white">
                {t('cg.dsBgUrl')}
                <input
                  value={config.backgroundMediaUrl ?? ''}
                  onChange={(e) => setConfig((v) => ({ ...v, backgroundMediaUrl: e.target.value }))}
                  placeholder="https://…"
                  className="w-full rounded-xl border border-[#1E355B] bg-[#0A0D16] px-3 py-2.5 text-sm"
                />
              </label>
              <label className="block space-y-2 text-sm text-white">
                {t('cg.dsImport50')}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm"
                  disabled={uploading !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadMedia(file, 'background');
                    e.currentTarget.value = '';
                  }}
                  className="block w-full text-xs text-[#AFC0D8] file:mr-3 file:rounded-lg file:border-0 file:bg-[#147866] file:px-3 file:py-2 file:font-bold file:text-white"
                />
                {uploading === 'background' && (
                  <span className="text-xs text-[#F5E17A]">{t('cg.dsUploading')}</span>
                )}
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-2 text-sm text-white">
                  {t('cg.dsAnim')}
                  <select
                    value={config.backgroundAnimation ?? 'none'}
                    onChange={(e) =>
                      setConfig((v) => ({
                        ...v,
                        backgroundAnimation: e.target.value as NonNullable<
                          DesignConfig['backgroundAnimation']
                        >,
                      }))
                    }
                    className="w-full rounded-xl border border-[#1E355B] bg-[#0A0D16] p-2.5"
                  >
                    <option value="none">{t('cg.dsAnNone')}</option>
                    <option value="slow-pan">{t('cg.dsAnPan')}</option>
                    <option value="float">{t('cg.dsAnFloat')}</option>
                    <option value="gradient">{t('cg.dsAnGrad')}</option>
                  </select>
                </label>
                <label className="block space-y-2 text-sm text-white">
                  {t('cg.dsIntensity').replace(
                    '{n}',
                    String(Math.round((config.backgroundOpacity ?? 0.12) * 100))
                  )}
                  <input
                    type="range"
                    min="0.02"
                    max="0.28"
                    step="0.01"
                    value={config.backgroundOpacity ?? 0.12}
                    onChange={(e) =>
                      setConfig((v) => ({ ...v, backgroundOpacity: Number(e.target.value) }))
                    }
                    className="mt-3 w-full accent-[#34D399]"
                  />
                </label>
              </div>
            </div>
            <div className="space-y-4 rounded-2xl border border-[#1E355B] bg-[#080B12] p-5">
              <div>
                <h2 className="text-base font-bold text-white">{t('cg.dsNewsH')}</h2>
                <p className="mt-1 text-xs leading-5 text-[#A1A1AA]">{t('cg.dsNewsSub')}</p>
              </div>
              <label className="block space-y-2 text-sm text-white">
                {t('cg.dsAnnTitle')}
                <input
                  maxLength={120}
                  value={config.updateTitle ?? ''}
                  onChange={(e) => setConfig((v) => ({ ...v, updateTitle: e.target.value }))}
                  placeholder={t('cg.dsAnnPh')}
                  className="w-full rounded-xl border border-white/10 bg-[#080B12] px-3 py-2.5 text-sm"
                />
              </label>
              <label className="block space-y-2 text-sm text-white">
                {t('cg.dsInfo')}
                <textarea
                  maxLength={2000}
                  rows={4}
                  value={config.updateBody ?? ''}
                  onChange={(e) => setConfig((v) => ({ ...v, updateBody: e.target.value }))}
                  placeholder={t('cg.dsInfoPh')}
                  className="w-full rounded-xl border border-white/10 bg-[#080B12] px-3 py-2.5 text-sm"
                />
              </label>
              <label className="block space-y-2 text-sm text-white">
                {t('cg.dsDemoUrl')}
                <input
                  value={config.updateMediaUrl ?? ''}
                  onChange={(e) => setConfig((v) => ({ ...v, updateMediaUrl: e.target.value }))}
                  placeholder="https://…"
                  className="w-full rounded-xl border border-[#1E355B] bg-[#0A0D16] px-3 py-2.5 text-sm"
                />
              </label>
              <label className="block space-y-2 text-sm text-white">
                {t('cg.dsImportShort')}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm"
                  disabled={uploading !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadMedia(file, 'update');
                    e.currentTarget.value = '';
                  }}
                  className="block w-full text-xs text-[#AFC0D8] file:mr-3 file:rounded-lg file:border-0 file:bg-[#147866] file:px-3 file:py-2 file:font-bold file:text-white"
                />
                {uploading === 'update' && (
                  <span className="text-xs text-[#F5E17A]">{t('cg.dsUploading')}</span>
                )}
              </label>
              <label className="flex items-center gap-3 text-sm text-[#F4F7FC]">
                <input
                  type="checkbox"
                  checked={config.updatePublished ?? false}
                  onChange={(e) => setConfig((v) => ({ ...v, updatePublished: e.target.checked }))}
                  className="h-4 w-4 accent-[#34D399]"
                />
                {t('cg.dsShowHome')}
              </label>
            </div>
          </section>
        </div>
      ) : (
        <section className="divide-y divide-white/5 rounded-2xl border border-[#1E355B] bg-[#080B12]">
          {versions.length === 0 ? (
            <p className="p-5 text-sm text-[#A1A1AA]">{t('cg.dsNoVer')}</p>
          ) : (
            versions.map((v) => (
              <div
                key={v.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {t('cg.dsVer')
                      .replace('{n}', String(v.version_no))
                      .replace(
                        '{s}',
                        v.status === 'draft'
                          ? t('cg.dsStDraft')
                          : v.status === 'published'
                            ? t('cg.dsStPub')
                            : v.status
                      )}
                  </p>
                  <p className="mt-1 text-xs text-[#71717A]">
                    {new Date(v.created_at).toLocaleString(locale)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setConfig({ ...DEFAULT_DESIGN_CONFIG, ...v.config });
                    setHistory(false);
                    toast.success(t('cg.dsLoaded'));
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-[#1E355B] px-3 py-2 text-xs text-[#F4F7FC]"
                >
                  <RotateCcw size={13} /> {t('cg.dsRestore')}
                </button>
              </div>
            ))
          )}
        </section>
      )}
    </div>
  );
  /* eslint-enable prettier/prettier */
}
