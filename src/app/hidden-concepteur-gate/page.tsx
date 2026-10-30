'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, MapPin, ShieldCheck, Warehouse } from 'lucide-react';
import { checkCurrentSuperAdmin } from '@/lib/auth/super-admin';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

type Branch = { branch_code: string; branch_label: string; route: string };
const ICONS = {
  admin: Building2,
  prospecteur: MapPin,
  agence: Warehouse,
  concepteur: ShieldCheck,
} as const;
// L'espace agence est ajouté côté application : il s'appuie sur les droits concepteur existants
// (un super admin peut gérer toutes les agences) et ne dépend pas de la fonction de base.
const AGENCE_BRANCH: Branch = {
  branch_code: 'agence',
  branch_label: '',
  route: '/entrepot/dashboard',
};
const DESCRIPTIONS: Record<string, TerrainKey> = {
  admin: 'cg.dAdmin',
  prospecteur: 'cg.dField',
  agence: 'cg.dAgency',
  concepteur: 'cg.dDesigner',
};
function Message({ title, text, tone }: { title: string; text: string; tone: 'error' | 'info' }) {
  return (
    <main className="min-h-screen bg-[#07142d] flex items-center justify-center p-6">
      <div
        className={`max-w-xl w-full rounded-2xl border bg-white/5 p-8 text-center text-white ${tone === 'error' ? 'border-red-400/20' : 'border-white/10'}`}
      >
        <h1 className="text-2xl font-semibold mb-3">{title}</h1>
        <p className="text-slate-300">{text}</p>
      </div>
    </main>
  );
}
export default function ConcepteurGatePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'denied' | 'error' | 'ready'>('loading');
  const [message, setMessage] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const auth = await checkCurrentSuperAdmin();
      if (cancelled) return;
      if (!auth.ok) {
        if (auth.reason === 'not_authenticated') {
          router.replace('/hidden-concepteur-gate/login');
          return;
        }
        setMessage(auth.message);
        setState('denied');
        return;
      }
      const { data, error } = await supabase.rpc('jdvcrm_get_concepteur_workspace_v1');
      if (cancelled) return;
      const rows = (data ?? []) as Branch[];
      if (error || rows.length === 0) {
        setMessage(error?.message ?? 'cg.noBranch');
        setState('error');
        return;
      }
      // Ordre d'affichage : Admin, Terrain, Agence, Concepteur.
      const withAgence = [...rows];
      if (!withAgence.some((r) => r.branch_code === 'agence')) {
        const conceptorIndex = withAgence.findIndex((r) => r.branch_code === 'concepteur');
        withAgence.splice(
          conceptorIndex === -1 ? withAgence.length : conceptorIndex,
          0,
          AGENCE_BRANCH
        );
      }
      setBranches(withAgence);
      setState('ready');
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);
  const shownMessage = message.startsWith('cg.') ? t(message as TerrainKey) : message;
  if (state === 'loading')
    return <Message title={t('cg.loading')} text={t('cg.checking')} tone="info" />;
  if (state === 'denied')
    return <Message title={t('cg.denied')} text={shownMessage} tone="error" />;
  if (state === 'error')
    return <Message title={t('cg.unavail')} text={shownMessage} tone="error" />;
  return (
    <main className="min-h-screen bg-[#07142d] text-white p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="text-[#D4AF37] uppercase tracking-[0.25em] text-xs font-semibold">
            JDV CRM
          </p>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold">{t('cg.title')}</h1>
          <p className="mt-3 text-slate-300 max-w-3xl">{t('cg.intro')}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {branches.map((branch) => {
            const Icon = ICONS[branch.branch_code as keyof typeof ICONS] ?? ShieldCheck;
            return (
              <Link
                key={branch.branch_code}
                href={branch.route}
                className="group rounded-2xl border border-white/10 bg-white/[0.04] p-6 hover:border-[#D4AF37]/50 hover:bg-white/[0.07] transition"
              >
                <Icon className="mb-5 text-[#D4AF37]" size={30} />
                <h2 className="text-xl font-semibold">
                  {branch.branch_code === 'agence' && !branch.branch_label
                    ? t('cg.bAgency')
                    : branch.branch_label}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {DESCRIPTIONS[branch.branch_code] ? t(DESCRIPTIONS[branch.branch_code]) : ''}
                </p>
                <span className="mt-6 inline-block text-sm font-medium text-[#D4AF37]">
                  {t('cg.open')}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="mt-8 rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-5 text-sm text-slate-200">
          <strong className="text-[#D4AF37]">{t('cg.rule')}</strong> {t('cg.ruleText')}
        </div>
      </div>
    </main>
  );
}
