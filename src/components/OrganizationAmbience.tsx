'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { fetchOrgProfile } from '@/lib/auth/context';
const db = supabase as any;

type AmbienceSettings = {
  dashboard_background_url: string | null;
  dashboard_background_opacity: number | null;
  dashboard_background_fit: 'cover' | 'contain' | 'auto' | null;
  dashboard_background_motion: boolean | null;
};

export default function OrganizationAmbience() {
  const [settings, setSettings] = useState<AmbienceSettings | null>(null);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: profile } = await fetchOrgProfile();
      const organizationId = profile?.organization_id;
      if (!organizationId) return;
      const load = async () => {
        const { data } = await db.from('organization_personalization')
          .select('dashboard_background_url,dashboard_background_opacity,dashboard_background_fit,dashboard_background_motion')
          .eq('organization_id', organizationId).maybeSingle();
        if (active) setSettings(data as AmbienceSettings | null);
      };
      await load();
      channel = supabase.channel(`jdv-ambience-${organizationId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'organization_personalization', filter: `organization_id=eq.${organizationId}` }, () => { void load(); })
        .subscribe();
    })();
    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  if (!settings?.dashboard_background_url) return null;
  const opacity = Math.max(0, Math.min(0.45, Number(settings.dashboard_background_opacity ?? 0.14)));
  const fit = settings.dashboard_background_fit ?? 'cover';

  return <>
    <div aria-hidden="true" className={settings.dashboard_background_motion ? 'jdv-ambience-layer jdv-ambience-motion' : 'jdv-ambience-layer'}
      style={{ backgroundImage: `url("${settings.dashboard_background_url}")`, backgroundSize: fit, opacity }} />
    <style jsx global>{`
      .jdv-ambience-layer { position: fixed; inset: 4.5rem 0 0 15rem; pointer-events: none; z-index: 0; background-position: center; background-repeat: no-repeat; }
      .jdv-ambience-motion { animation: jdv-ambience-float 38s ease-in-out infinite alternate; }
      @keyframes jdv-ambience-float { from { background-position: 46% 46%; transform: scale(1); } to { background-position: 54% 54%; transform: scale(1.035); } }
      @media (max-width: 768px) { .jdv-ambience-layer { inset: 4rem 0 0 4rem; } }
      @media (prefers-reduced-motion: reduce) { .jdv-ambience-motion { animation: none; } }
    `}</style>
  </>;
}
