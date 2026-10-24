'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Globe, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import PublicBusinessReviews from '@/app/components/PublicBusinessReviews';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

type PublicBusinessProfile = {
  id: string;
  name: string;
  legal_name: string | null;
  country: string;
  language: string;
  city: string | null;
  logo_url: string | null;
  website: string | null;
};

const db = supabase as any;

export default function PublicBusinessStorefrontPage() {
  const { t } = useLanguage();
  const params = useParams<{ id: string }>();
  const organizationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [business, setBusiness] = useState<PublicBusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const { data, error } = await db
        .from('public_business_profiles')
        .select('id,name,legal_name,country,language,city,logo_url,website')
        .eq('id', organizationId)
        .maybeSingle();
      if (!active) return;
      if (error || !data) {
        setBusiness(null);
        setUnavailable(true);
      } else {
        setBusiness(data as PublicBusinessProfile);
        setUnavailable(false);
      }
      setLoading(false);
    }
    if (organizationId) void load();
    return () => {
      active = false;
    };
  }, [organizationId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-200">
        <p className="mx-auto max-w-4xl animate-pulse">{t('pg.vLoading')}</p>
      </main>
    );
  }

  if (unavailable || !business) {
    return (
      <main className="min-h-screen bg-slate-950 px-5 py-16 text-slate-200">
        <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-slate-900 p-8 text-center">
          <Building2 className="mx-auto mb-4 text-amber-300" size={32} />
          <h1 className="text-2xl font-bold text-white">{t('pg.vNone')}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">{t('pg.vNoneSub')}</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-300 px-4 py-2.5 font-semibold text-slate-950"
          >
            <ArrowLeft size={16} /> {t('pg.vBack')}
          </Link>
        </div>
      </main>
    );
  }

  const brand = '#D4AF37';
  const location = [business.city, business.country].filter(Boolean).join(', ');
  const websiteUrl =
    business.website && /^https?:\/\//i.test(business.website) ? business.website : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-[#08152f]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white"
          >
            <ArrowLeft size={16} /> JDV CRM
          </Link>
          <span className="text-xs font-semibold uppercase tracking-[.2em] text-amber-300">
            {t('pg.vTag')}
          </span>
        </div>
      </header>
      <div className="mx-auto max-w-5xl space-y-8 px-5 py-10 sm:py-14">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-[#08152f]">
          <div className="h-2" style={{ backgroundColor: brand }} />
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-10">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={t('pg.vLogo').replace('{name}', business.name)}
                className="h-24 w-24 rounded-2xl border border-white/10 bg-white object-contain p-2"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Building2 size={36} style={{ color: brand }} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[.2em]" style={{ color: brand }}>
                {t('pg.vDiscover')}
              </p>
              <h1 className="mt-2 break-words text-3xl font-extrabold text-white sm:text-4xl">
                {business.name}
              </h1>
              {business.legal_name && business.legal_name !== business.name && (
                <p className="mt-2 text-sm text-slate-300">{business.legal_name}</p>
              )}
              {location && (
                <p className="mt-3 flex items-start gap-2 text-sm text-slate-300">
                  <MapPin className="mt-0.5 shrink-0" size={16} />
                  {location}
                </p>
              )}
            </div>
          </div>
          {websiteUrl && (
            <div className="border-t border-white/10">
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-slate-900/90 p-5 text-sm hover:bg-slate-800"
              >
                <Globe size={18} style={{ color: brand }} /> {t('pg.vSite')}{' '}
                <span className="sr-only">{t('pg.vNewTab')}</span>
              </a>
            </div>
          )}
        </section>
        <PublicBusinessReviews organizationId={business.id} />
        <p className="text-center text-xs text-slate-500">{t('pg.vNote')}</p>
      </div>
    </main>
  );
}
