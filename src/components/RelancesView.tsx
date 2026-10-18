'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle,
  Clock,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAuthContext } from '@/lib/auth/context';
import {
  fetchFollowups,
  fetchPendingReminders,
  fetchProspecteurNames,
  generateReminders,
  updateReminderStatus,
  type PendingReminder,
  type ReminderStatus,
} from '@/lib/services/relancesService';
import {
  buildReminderMessage,
  displayStatus,
  filterFollowups,
  formatDateFr,
  summarize,
  toNumber,
  toTelHref,
  toWhatsAppHref,
  type Followup,
  type FollowupFilter,
} from '@/lib/relances/helpers';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';
import MetricCard from '@/components/ui/MetricCard';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

interface RelancesViewProps {
  /** « business » : administrateur de l'entreprise ; « terrain » : prospecteur (ses propres ventes uniquement). */
  mode: 'business' | 'terrain';
}

const FILTERS: { id: FollowupFilter; label: TerrainKey }[] = [
  { id: 'all', label: 'trl.fAll' },
  { id: 'overdue', label: 'trl.fOverdue' },
  { id: 'partial', label: 'trl.fPartial' },
  { id: 'upcoming', label: 'trl.fUpcoming' },
];

const STATUS_KEYS = {
  overdue: 'trl.sOverdue',
  partial: 'trl.sPartial',
  upcoming: 'trl.sUpcoming',
} as const satisfies Record<string, TerrainKey>;

const BADGE_CLASSES = {
  overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
  partial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
} as const;

// Indicatif pays facultatif (ex. 229) pour transformer les numéros locaux en liens WhatsApp valides.
const PHONE_PREFIX = process.env.NEXT_PUBLIC_PHONE_PREFIX ?? '';

export default function RelancesView({ mode }: RelancesViewProps) {
  const isBusiness = mode === 'business';
  const { t, locale } = useLanguage();
  const fill = (key: TerrainKey, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      t(key)
    );
  const formatXof = (value: unknown) =>
    `${new Intl.NumberFormat(locale).format(Math.round(toNumber(value)))} XOF`;
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [reminders, setReminders] = useState<PendingReminder[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FollowupFilter>('all');
  const [generating, setGenerating] = useState(false);
  const [busyReminder, setBusyReminder] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const ctx = await getAuthContext();
    if (!ctx) {
      setError(t('trl.notLogged'));
      setLoading(false);
      return;
    }
    const org = isBusiness ? ctx.organizationId : ctx.prospecteurOrganizationId;
    if (!org) {
      setError(isBusiness ? t('trl.noOrgBusiness') : t('trl.noOrgField'));
      setLoading(false);
      return;
    }
    setOrgId(org);
    const [f, r, n] = await Promise.all([
      fetchFollowups(org),
      fetchPendingReminders(org),
      isBusiness ? fetchProspecteurNames(org) : Promise.resolve({} as Record<string, string>),
    ]);
    if (f.error) setError(f.error);
    setFollowups(f.data);
    setReminders(r.data);
    setNames(n);
    setLoading(false);
  }, [isBusiness, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => summarize(followups), [followups]);
  const visible = useMemo(
    () => filterFollowups(followups, { search, filter }),
    [followups, search, filter]
  );

  async function handleGenerate() {
    if (!orgId || generating) return;
    setGenerating(true);
    const { created, error: err } = await generateReminders(orgId);
    setGenerating(false);
    if (err) {
      toast.error(err);
      return;
    }
    toast.success(created > 0 ? fill('trl.created', { n: created }) : t('trl.upToDate'));
    void load();
  }

  async function handleReminder(id: string, status: ReminderStatus) {
    setBusyReminder(id);
    const err = await updateReminderStatus(id, status);
    setBusyReminder(null);
    if (err) {
      toast.error(err);
      return;
    }
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  if (loading) return <LoadingState message={t('trl.loading')} />;
  if (error && followups.length === 0 && reminders.length === 0) {
    return (
      <ErrorState message={error} action={{ label: t('trl.retry'), onClick: () => void load() }} />
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isBusiness ? t('trl.titleBusiness') : t('trl.titleField')}
          </h1>
          <p className="text-sm text-[#A0AEC0] mt-1">
            {isBusiness ? t('trl.subBusiness') : t('trl.subField')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            className="flex items-center gap-2 btn-outline-gold px-4 py-2.5 rounded-xl text-sm font-semibold"
            aria-label={t('trl.refreshAria')}
          >
            <RefreshCw size={14} />
            {t('trl.refresh')}
          </button>
          {isBusiness && (
            <button
              onClick={() => void handleGenerate()}
              disabled={generating || summary.overdueCount === 0}
              className="flex items-center gap-2 btn-gold px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              title={summary.overdueCount === 0 ? t('trl.noOverdueTitle') : t('trl.createTitle')}
            >
              <Bell size={14} />
              {generating ? t('trl.creating') : t('trl.generate')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Indicateurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title={t('trl.mRemaining')}
          value={formatXof(summary.totalRemaining)}
          subtitle={fill('trl.openCount', { n: summary.count })}
          icon={<Wallet size={18} />}
          variant="gold"
        />
        <MetricCard
          title={t('trl.mOverdue')}
          value={formatXof(summary.overdueRemaining)}
          subtitle={fill('trl.overdueCount', { n: summary.overdueCount })}
          icon={<AlertTriangle size={18} />}
          variant={summary.overdueCount > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          title={t('trl.mClients')}
          value={String(summary.clients)}
          subtitle={t('trl.mClientsSub')}
          icon={<Users size={18} />}
          variant="default"
        />
        <MetricCard
          title={t('trl.mMaxLate')}
          value={
            summary.maxDaysLate > 0 ? fill('trl.daysN', { n: summary.maxDaysLate }) : t('trl.none')
          }
          subtitle={summary.maxDaysLate > 0 ? t('trl.sinceDue') : t('trl.allPaid')}
          icon={<Clock size={18} />}
          variant={
            summary.maxDaysLate > 30 ? 'danger' : summary.maxDaysLate > 0 ? 'warning' : 'success'
          }
        />
      </div>

      {/* Filtres */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('trl.searchPh')}
            aria-label={t('trl.searchAria')}
            className="w-full bg-[#0F2347] border border-[#D4AF37]/20 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-[#718096] focus:outline-none focus:border-[#D4AF37]/60"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('trl.filterAria')}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                filter === f.id
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/50'
                  : 'bg-[#0F2347] text-[#A0AEC0] border-[#D4AF37]/20 hover:text-white'
              }`}
            >
              {t(f.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau des échéances */}
      <div className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
        {visible.length === 0 ? (
          <div className="py-16 text-center px-6">
            <CheckCircle size={32} className="mx-auto mb-3 text-[#68D391] opacity-70" />
            <p className="text-white text-sm font-semibold mb-1">
              {followups.length === 0 ? t('trl.noDebt') : t('trl.noResult')}
            </p>
            <p className="text-[#A0AEC0] text-sm">
              {followups.length === 0 ? t('trl.allUpToDate') : t('trl.changeFilter')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D4AF37]/10">
                  {[
                    t('trl.thClient'),
                    t('trl.thDue'),
                    t('trl.thRemaining'),
                    t('trl.thStatus'),
                    ...(isBusiness ? [t('trl.thOwner')] : []),
                    t('trl.thActions'),
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((f) => {
                  const status = displayStatus(f);
                  const tel = toTelHref(f.client_phone);
                  const wa = toWhatsAppHref(f.client_phone, buildReminderMessage(f), PHONE_PREFIX);
                  return (
                    <tr
                      key={f.schedule_id}
                      className="border-b border-[#D4AF37]/5 hover:bg-[#0B1B3D]/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">
                          {f.client_name?.trim() || t('trl.noName')}
                        </p>
                        <p className="text-xs text-[#718096]">
                          {f.client_phone || t('trl.noPhone')}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm text-white">
                          N°{f.installment_number} · {formatDateFr(f.due_date)}
                        </p>
                        {isBusiness && (
                          <Link
                            href={`/business/dashboard/ventes/${f.sale_id}`}
                            className="text-xs text-[#D4AF37] hover:underline"
                          >
                            {t('trl.viewSale')}
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-sm font-semibold text-white">
                          {formatXof(f.remaining_amount)}
                        </p>
                        <p className="text-xs text-[#718096]">
                          {fill('trl.paidOf', {
                            a: formatXof(f.paid_amount),
                            b: formatXof(f.expected_amount),
                          })}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${BADGE_CLASSES[status]}`}
                        >
                          {t(STATUS_KEYS[status])}
                          {status === 'overdue' &&
                            ` · ${toNumber(f.days_late)} ${t('trl.dayShort')}`}
                        </span>
                      </td>
                      {isBusiness && (
                        <td className="px-4 py-3 text-sm text-[#A0AEC0] whitespace-nowrap">
                          {(f.prospecteur_id && names[f.prospecteur_id]) || '—'}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {tel ? (
                            <a
                              href={tel}
                              aria-label={fill('trl.callAria', {
                                n: f.client_name ?? t('trl.theClient'),
                              })}
                              className="p-2 rounded-lg bg-[#0B1B3D] border border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                            >
                              <Phone size={14} />
                            </a>
                          ) : null}
                          {wa ? (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={fill('trl.waAria', {
                                n: f.client_name ?? t('trl.theClient'),
                              })}
                              className="p-2 rounded-lg bg-[#0B1B3D] border border-[#D4AF37]/20 text-[#68D391] hover:bg-[#68D391]/10"
                            >
                              <MessageCircle size={14} />
                            </a>
                          ) : null}
                          {!tel && !wa && <span className="text-xs text-[#718096]">—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rappels programmés */}
      <div className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D4AF37]/10 flex items-center gap-2">
          <Bell size={16} className="text-[#D4AF37]" />
          <h2 className="text-sm font-semibold text-white">{t('trl.pending')}</h2>
          <span className="text-xs text-[#718096]">({reminders.length})</span>
        </div>
        {reminders.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#A0AEC0] text-center">
            {t('trl.noPending')}
            {isBusiness && t('trl.useGenerate')}
          </p>
        ) : (
          <ul className="divide-y divide-[#D4AF37]/5">
            {reminders.map((r) => (
              <li
                key={r.id}
                className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white">{r.client_name ?? t('trl.customer')}</p>
                  <p className="text-xs text-[#A0AEC0] break-words">
                    {r.message ?? t('trl.reminder')}
                  </p>
                  <p className="text-xs text-[#718096] mt-0.5">{formatDateFr(r.reminder_at)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => void handleReminder(r.id, 'completed')}
                    disabled={busyReminder === r.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#68D391]/10 text-[#68D391] border border-[#68D391]/30 hover:bg-[#68D391]/20 disabled:opacity-50"
                  >
                    <Check size={12} />
                    {t('trl.done')}
                  </button>
                  <button
                    onClick={() => void handleReminder(r.id, 'cancelled')}
                    disabled={busyReminder === r.id}
                    aria-label={t('trl.cancelAria')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0B1B3D] text-[#A0AEC0] border border-[#D4AF37]/20 hover:text-white disabled:opacity-50"
                  >
                    <X size={12} />
                    {t('trl.cancel')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
