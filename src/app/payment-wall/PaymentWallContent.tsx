'use client';
import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Star,
  Zap,
  Shield,
  Users,
  BarChart2,
  Package,
  Bell,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { trackPlanSelection, trackPaymentConfirmed } from '@/lib/analytics';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

// Textes affichés par plan (le nom français reste utilisé pour les statistiques).
const PLAN_TEXT: Record<string, { name: TerrainKey; features: (TerrainKey | `n:${number}`)[] }> = {
  monthly: {
    name: 'pw.plM',
    features: ['n:5', 'pw.fSales', 'pw.fTrack', 'pw.fRepB', 'pw.fSupE'],
  },
  quarterly: {
    name: 'pw.plQ',
    features: ['n:10', 'pw.fSales', 'pw.fTrack', 'pw.fRepA', 'pw.fStock', 'pw.fSupP'],
  },
  semester: {
    name: 'pw.plS',
    features: ['n:25', 'pw.fAll', 'pw.fTransf', 'pw.fAudit', 'pw.fNotif', 'pw.fSupD'],
  },
  annual: {
    name: 'pw.plA',
    features: ['pw.fUnl', 'pw.fAll', 'pw.fApi', 'pw.fCustom', 'pw.fFeda', 'pw.f247', 'pw.f2m'],
  },
};

interface Plan {
  id: string;
  billing_amount_xof?: number;
  code: string;
  name: string;
  price: number;
  currency: string;
  duration_days: number;
  recommended?: boolean;
  features: string[];
  prospecteur_limit: string;
}

const PLANS: Plan[] = [
  {
    id: 'monthly',
    code: 'MONTHLY',
    name: 'Mensuel',
    price: 50,
    currency: 'USD',
    duration_days: 30,
    recommended: false,
    prospecteur_limit: '5',
    features: [
      "Jusqu'à 5 prospecteurs",
      'Gestion des ventes & paiements',
      'Suivi des prospects',
      'Rapports de base',
      'Support par email',
    ],
  },
  {
    id: 'quarterly',
    code: 'QUARTERLY',
    name: 'Trimestriel',
    price: 150,
    currency: 'USD',
    duration_days: 90,
    recommended: false,
    prospecteur_limit: '10',
    features: [
      "Jusqu'à 10 prospecteurs",
      'Gestion des ventes & paiements',
      'Suivi des prospects',
      'Rapports avancés',
      'Gestion du stock',
      'Support prioritaire',
    ],
  },
  {
    id: 'semester',
    code: 'SEMESTER',
    name: 'Semestriel',
    price: 300,
    currency: 'USD',
    duration_days: 180,
    recommended: false,
    prospecteur_limit: '25',
    features: [
      "Jusqu'à 25 prospecteurs",
      'Toutes les fonctionnalités',
      'Transferts de stock',
      "Journal d'audit complet",
      'Notifications avancées',
      'Support dédié',
    ],
  },
  {
    id: 'annual',
    code: 'ANNUAL',
    name: 'Annuel',
    price: 600,
    currency: 'USD',
    duration_days: 365,
    recommended: true,
    prospecteur_limit: 'Illimité',
    features: [
      'Prospecteurs illimités',
      'Toutes les fonctionnalités',
      'Accès API',
      'Personnalisation avancée',
      'Intégration FedaPay entreprise',
      'Support 24/7 prioritaire',
      '2 mois offerts vs mensuel',
    ],
  },
];

interface TrialStatus {
  status: 'trial' | 'active' | 'expired' | 'suspended';
  daysRemaining: number;
  organizationId: string;
  organizationName: string;
  subscriptionId?: string;
  planName?: string;
  expiresAt?: string;
}

export default function PaymentWallContent() {
  const { t, locale } = useLanguage();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>(PLANS);

  useEffect(() => {
    loadTrialStatus();
    (async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('code, price, billing_amount_xof, active')
        .neq('code', 'TRIAL');
      if (!data) return;
      const byCode = new Map(
        (
          data as {
            code: string;
            price: number | string;
            billing_amount_xof: number | string | null;
            active: boolean;
          }[]
        ).map((r) => [r.code, r])
      );
      setPlans(
        PLANS.filter((p) => byCode.get(p.code)?.active !== false).map((p) => {
          const r = byCode.get(p.code);
          return r
            ? {
                ...p,
                price: Number(r.price) || p.price,
                billing_amount_xof: Number(r.billing_amount_xof) || undefined,
              }
            : p;
        })
      );
    })();
  }, []);

  async function loadTrialStatus() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(name, status, subscription_status)')
        .eq('user_id', user.id)
        .eq('role', 'business_admin')
        .eq('status', 'active')
        .single();

      if (!member) return;

      const organizationRelation = member.organizations;
      const org = (
        Array.isArray(organizationRelation) ? organizationRelation[0] : organizationRelation
      ) as { name: string; status: string; subscription_status: string } | null;

      const { data: sub } = await supabase
        .from('organization_subscriptions')
        .select('id, status, expires_at, subscription_plans(name)')
        .eq('organization_id', member.organization_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let daysRemaining = 0;
      if (sub?.expires_at) {
        const diff = new Date(sub.expires_at).getTime() - Date.now();
        daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      const planRelation = sub?.subscription_plans;
      const plan = Array.isArray(planRelation) ? planRelation[0] : planRelation;

      setTrialStatus({
        status: (sub?.status ?? org?.subscription_status ?? 'trial') as TrialStatus['status'],
        daysRemaining,
        organizationId: member.organization_id,
        organizationName: org?.name ?? '',
        subscriptionId: sub?.id,
        planName: (plan as { name: string } | null | undefined)?.name,
        expiresAt: sub?.expires_at ?? undefined,
      });
    } catch {
      // silently fail — show plans anyway
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectPlan(plan: Plan) {
    if (initiating) return;
    setSelectedPlan(plan);
    setError(null);
    setInitiating(true);

    // Track plan selection event
    trackPlanSelection({
      planCode: plan.code,
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency,
    });

    try {
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess.session?.access_token;
      if (!accessToken || !trialStatus) throw new Error(t('pw.session'));

      // Le montant et l'entreprise sont déterminés côté serveur : on n'envoie que le plan choisi.
      const response = await fetch('/api/fedapay/initiate-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ planCode: plan.code }),
      });

      const result = await response.json();

      if (!response.ok || !result.paymentUrl) {
        throw new Error(result.error ?? t('pw.payErr'));
      }

      // Track payment initiation (confirmed when webhook fires, but track intent here)
      trackPaymentConfirmed({
        paymentType: 'subscription',
        planCode: plan.code,
        amountCents: (plan.billing_amount_xof ?? plan.price) * 100,
        organizationId: trialStatus.organizationId,
      });

      // Redirection vers la page de paiement FedaPay
      window.location.href = result.paymentUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('pw.generic');
      setError(message);
      setInitiating(false);
      setSelectedPlan(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1B3D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="text-[#D4AF37] animate-spin" />
          <p className="text-[#A0AEC0] text-sm">{t('pw.loading')}</p>
        </div>
      </div>
    );
  }

  const isExpired = trialStatus?.status === 'expired';
  const isTrial = trialStatus?.status === 'trial';
  const daysLeft = trialStatus?.daysRemaining ?? 0;

  return (
    <div className="min-h-screen bg-[#0B1B3D] py-12 px-4">
      {/* Header */}
      <div className="max-w-5xl mx-auto text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] rounded-full px-4 py-1.5 mb-6">
          <Star size={14} className="text-[#D4AF37]" />
          <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider">
            {t('pw.badge')}
          </span>
        </div>

        {isTrial && daysLeft > 0 && (
          <div className="inline-flex items-center gap-2 bg-[rgba(99,179,237,0.1)] border border-[rgba(99,179,237,0.2)] rounded-xl px-5 py-3 mb-6">
            <Bell size={16} className="text-[#63B3ED]" />
            <span className="text-sm text-[#63B3ED]">
              {(() => {
                const [a, b] = t(daysLeft > 1 ? 'pw.trialN' : 'pw.trial1').split('{n}');
                return (
                  <>
                    {a}
                    <strong>{daysLeft}</strong>
                    {b}
                  </>
                );
              })()}
            </span>
          </div>
        )}

        {isExpired && (
          <div className="inline-flex items-center gap-2 bg-[rgba(252,129,129,0.1)] border border-[rgba(252,129,129,0.2)] rounded-xl px-5 py-3 mb-6">
            <AlertCircle size={16} className="text-[#FC8181]" />
            <span className="text-sm text-[#FC8181]">{t('pw.expired')}</span>
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {t('pw.choose1')} <span className="gold-gradient-text">{t('pw.choose2')}</span>
        </h1>
        <p className="text-[#A0AEC0] text-base max-w-xl mx-auto">{t('pw.intro')}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-5xl mx-auto mb-6">
          <div className="flex items-center gap-3 bg-[rgba(252,129,129,0.1)] border border-[rgba(252,129,129,0.2)] rounded-xl px-5 py-3">
            <AlertCircle size={16} className="text-[#FC8181] flex-shrink-0" />
            <p className="text-sm text-[#FC8181]">{error}</p>
          </div>
        </div>
      )}

      {/* Plans grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-2xl border transition-all duration-200 ${
              plan.recommended
                ? 'bg-gradient-to-b from-[#132a56] to-[#0F2347] border-[rgba(212,175,55,0.5)] shadow-[0_0_40px_rgba(212,175,55,0.12)]'
                : 'bg-[#0F2347] border-[rgba(212,175,55,0.15)] hover:border-[rgba(212,175,55,0.35)]'
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="btn-gold text-xs font-bold px-3 py-1 rounded-full">
                  {t('pw.recom')}
                </span>
              </div>
            )}

            <div className="p-5 flex-1">
              <h3 className="text-base font-bold text-white mb-1">
                {PLAN_TEXT[plan.id] ? t(PLAN_TEXT[plan.id].name) : plan.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold text-[#D4AF37]">{plan.price}</span>
                <span className="text-sm text-[#A0AEC0]">{plan.currency}</span>
              </div>
              {plan.billing_amount_xof ? (
                <p className="text-xs text-[#A0AEC0] mb-1">
                  {t('pw.cfa')}{' '}
                  <span className="font-semibold text-white">
                    {new Intl.NumberFormat(locale).format(plan.billing_amount_xof)} XOF
                  </span>
                </p>
              ) : null}
              <p className="text-xs text-[#718096] mb-4">
                {t('pw.days').replace('{n}', String(plan.duration_days))}
              </p>

              <div className="flex items-center gap-2 bg-[rgba(212,175,55,0.08)] rounded-lg px-3 py-2 mb-4">
                <Users size={13} className="text-[#D4AF37]" />
                <span className="text-xs text-[#D4AF37] font-semibold">
                  {plan.prospecteur_limit === 'Illimité'
                    ? t('pw.unl')
                    : t(plan.prospecteur_limit === '1' ? 'pw.pro1' : 'pw.proN').replace(
                        '{n}',
                        plan.prospecteur_limit
                      )}
                </span>
              </div>

              <ul className="space-y-2">
                {((PLAN_TEXT[plan.id]?.features ?? plan.features) as string[]).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#A0AEC0]">
                    <CheckCircle size={13} className="text-[#68D391] flex-shrink-0 mt-0.5" />
                    {f.startsWith('n:')
                      ? t('pw.upTo').replace('{n}', f.slice(2))
                      : f.startsWith('pw.')
                        ? t(f as TerrainKey)
                        : f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={initiating}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  plan.recommended ? 'btn-gold' : 'btn-outline-gold'
                }`}
              >
                {initiating && selectedPlan?.id === plan.id ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {t('pw.redir')}
                  </>
                ) : (
                  <>
                    {t('pw.pick')}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Features overview */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-lg font-bold text-white text-center mb-6">{t('pw.inclH')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Zap size={20} />, label: t('pw.i1'), desc: t('pw.i1d') },
            { icon: <Users size={20} />, label: t('pw.i2'), desc: t('pw.i2d') },
            { icon: <BarChart2 size={20} />, label: t('pw.i3'), desc: t('pw.i3d') },
            { icon: <Package size={20} />, label: t('pw.fStock'), desc: t('pw.i4d') },
            { icon: <Shield size={20} />, label: t('pw.i5'), desc: t('pw.i5d') },
            { icon: <Bell size={20} />, label: t('pw.i6'), desc: t('pw.i6d') },
            { icon: <CheckCircle size={20} />, label: t('pw.i7'), desc: t('pw.i7d') },
            { icon: <Star size={20} />, label: t('pw.fSupD'), desc: t('pw.i8d') },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-[#0F2347] border border-[rgba(212,175,55,0.1)] rounded-xl p-4 flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-[rgba(212,175,55,0.1)] text-[#D4AF37] flex-shrink-0">
                {f.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{f.label}</p>
                <p className="text-xs text-[#718096]">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security note */}
      <div className="max-w-5xl mx-auto mt-8 text-center">
        <p className="text-xs text-[#718096]">
          {t('pw.sec1')} <span className="text-[#D4AF37]">FedaPay</span> {t('pw.sec2')}
        </p>
      </div>
    </div>
  );
}
