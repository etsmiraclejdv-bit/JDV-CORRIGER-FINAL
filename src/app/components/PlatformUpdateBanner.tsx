/* eslint-disable prettier/prettier */
'use client';

import { useEffect, useState } from 'react';
import { Megaphone, PlayCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

type UpdateConfig = {
  updateTitle?: string;
  updateBody?: string;
  updateMediaUrl?: string;
  updateMediaType?: 'image' | 'video';
  updatePublished?: boolean;
};

function safeMediaUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export default function PlatformUpdateBanner() {
  const { t } = useLanguage();
  const [config, setConfig] = useState<UpdateConfig | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('design_config_versions')
        .select('config')
        .eq('scope', 'platform')
        .eq('status', 'published')
        .is('organization_id', null)
        .order('version_no', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (active) setConfig((data?.config ?? null) as UpdateConfig | null);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (!config?.updatePublished || !(config.updateTitle || config.updateBody)) return null;
  const mediaUrl = safeMediaUrl(config.updateMediaUrl);

  return (
    <section
      aria-labelledby="jdv-platform-update-title"
      className="mx-auto max-w-screen-xl px-6 py-6 lg:px-10"
    >
      <div className="grid gap-5 overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-[#0B1B3D] p-5 text-white shadow-card sm:p-7 lg:grid-cols-[1fr_.85fr] lg:items-center">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[#D4AF37]">
            <Megaphone size={15} /> {t('upd.kicker')}
          </p>
          <h2 id="jdv-platform-update-title" className="mt-3 text-2xl font-extrabold sm:text-3xl">
            {config.updateTitle}
          </h2>
          {config.updateBody && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-300">
              {config.updateBody}
            </p>
          )}
        </div>
        {mediaUrl && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            {config.updateMediaType === 'video' || /\.(mp4|webm)(\?|$)/i.test(mediaUrl) ? (
              <video
                controls
                playsInline
                preload="metadata"
                className="max-h-[360px] w-full"
                aria-label={t('upd.videoLabel')}
              >
                <source src={mediaUrl} />
                {t('upd.noVideo')}
              </video>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl}
                alt={t('upd.imgAlt')}
                className="max-h-[360px] w-full object-cover"
                loading="lazy"
              />
            )}
            <p className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300">
              <PlayCircle size={14} /> {t('upd.media')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
