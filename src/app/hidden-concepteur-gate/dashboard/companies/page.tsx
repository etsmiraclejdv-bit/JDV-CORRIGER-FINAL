'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  RefreshCw,
  Search,
  Bell,
  ShieldOff,
  RotateCcw,
  Repeat2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

type Company = {
  organization_id: string;
  organization_name: string;
  city: string | null;
  phone: string | null;
  organization_status: string;
  subscription_status: string;
  plan_code: string | null;
  plan_name: string | null;
  plan_price: number | null;
  plan_currency: string | null;
  started_at: string | null;
  expires_at: string | null;
  auto_renew: boolean;
  last_payment_at: string | null;
  last_payment_status: string | null;
  days_remaining: number | null;
};

export default function CompaniesPage() {
  const { t, locale } = useLanguage();
  const [rows, setRows] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc('jdvcrm_get_platform_companies_v1');
    if (!error) setRows((data ?? []) as Company[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function action(id: string, kind: 'suspend' | 'remind' | 'renew') {
    setBusy(id + kind);
    if (kind === 'suspend')
      await supabase.rpc('jdvcrm_platform_suspend_organization_v1', { p_organization_id: id });
    if (kind === 'remind')
      await supabase.rpc('jdvcrm_platform_subscription_reminder_v1', { p_organization_id: id });
    if (kind === 'renew')
      await supabase.rpc('jdvcrm_platform_set_auto_renew_v1', {
        p_organization_id: id,
        p_auto_renew: true,
      });
    await load();
    setBusy(null);
  }
  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        (r.organization_name + ' ' + (r.city ?? '')).toLowerCase().includes(search.toLowerCase())
      ),
    [rows, search]
  );
  const money = (n: number | null, c: string | null) =>
    n == null
      ? '—'
      : new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: c || 'USD',
          maximumFractionDigits: 0,
        }).format(n);
  const date = (v: string | null) =>
    v ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(v)) : '—';

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('cg.coTitle')}</h1>
          <p className="text-sm text-[#A1A1AA] mt-1">{t('cg.coSub')}</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#8B5CF6]/20 text-[#A1A1AA] hover:text-white text-sm"
        >
          <RefreshCw size={14} />
          {t('cg.refresh')}
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          [t('cg.dbCompanies'), rows.length, 'text-white'],
          [
            t('cg.dbActive'),
            rows.filter((r) => ['active', 'trial'].includes(r.subscription_status)).length,
            'text-green-400',
          ],
          [
            t('cg.dbUnpaid'),
            rows.filter((r) => ['past_due', 'expired', 'cancelled'].includes(r.subscription_status))
              .length,
            'text-red-400',
          ],
          [t('cg.dbAuto'), rows.filter((r) => r.auto_renew).length, 'text-[#8B5CF6]'],
        ].map(([l, v, c]) => (
          <div
            key={l as string}
            className="rounded-2xl bg-[#0F2347] border border-[#8B5CF6]/15 p-5"
          >
            <p className={(c as string) + ' text-2xl font-bold'}>{v as number}</p>
            <p className="text-xs text-[#71717A] mt-1">{l as string}</p>
          </div>
        ))}
      </div>
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('cg.coSearch')}
          className="w-full bg-[#0F2347] border border-[#8B5CF6]/20 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-[#71717A]"
        />
      </div>
      <div className="rounded-2xl bg-[#0F2347] border border-[#8B5CF6]/15 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#A1A1AA]">{t('cg.coLoading')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[#A1A1AA]">{t('cg.coNone')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="border-b border-[#8B5CF6]/10">
                  {[
                    t('cg.dbColCo'),
                    t('cg.dbColSub'),
                    t('cg.dbColDue'),
                    t('cg.coColLastPay'),
                    t('cg.coColRenew'),
                    t('cg.dbColState'),
                    t('cg.coColActions'),
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-[#71717A] uppercase tracking-wider px-5 py-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8B5CF6]/5">
                {filtered.map((r) => {
                  const unpaid =
                    ['past_due', 'expired', 'cancelled'].includes(r.subscription_status) ||
                    r.last_payment_status === 'failed';
                  const suspended =
                    r.organization_status === 'suspended' || r.subscription_status === 'expired';
                  return (
                    <tr key={r.organization_id} className="hover:bg-[#0A1628]/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center">
                            <Building2 size={15} className="text-[#8B5CF6]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {r.organization_name}
                            </p>
                            <p className="text-xs text-[#71717A]">
                              {r.city || '—'} · {r.phone || '—'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-white">{r.plan_name || t('cg.coNoPlan')}</p>
                        <p className="text-xs text-[#71717A]">
                          {r.plan_price != null ? money(r.plan_price, r.plan_currency) : '—'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-white">{date(r.expires_at)}</p>
                        <p
                          className={
                            'text-xs ' +
                            ((r.days_remaining ?? 99) <= 3 ? 'text-red-400' : 'text-[#71717A]')
                          }
                        >
                          {r.days_remaining == null
                            ? '—'
                            : t('cg.coDaysLeft').replace('{n}', String(r.days_remaining))}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-white">{date(r.last_payment_at)}</p>
                        <p className="text-xs text-[#71717A]">
                          {r.last_payment_status || t('cg.coNoPay')}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={r.auto_renew ? 'text-green-400' : 'text-[#71717A]'}>
                          {r.auto_renew ? t('cg.coOn') : t('cg.coOff')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg ' +
                            (suspended
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-green-500/15 text-green-400')
                          }
                        >
                          {suspended ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}{' '}
                          {suspended
                            ? t('cg.coSusp')
                            : unpaid
                              ? t('cg.coUnpaid')
                              : t('cg.coActive')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {!suspended && (
                            <button
                              onClick={() => action(r.organization_id, 'suspend')}
                              disabled={busy === r.organization_id + 'suspend'}
                              title={t('cg.coSuspendT')}
                              className="p-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              <ShieldOff size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => action(r.organization_id, 'remind')}
                            disabled={busy === r.organization_id + 'remind'}
                            title={t('cg.coRemindT')}
                            className="p-2 rounded-lg border border-[#8B5CF6]/30 text-[#8B5CF6] hover:bg-[#8B5CF6]/10"
                          >
                            <Bell size={14} />
                          </button>
                          {!r.auto_renew && (
                            <button
                              onClick={() => action(r.organization_id, 'renew')}
                              disabled={busy === r.organization_id + 'renew'}
                              title={t('cg.coRenewT')}
                              className="p-2 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10"
                            >
                              <Repeat2 size={14} />
                            </button>
                          )}
                          {suspended && (
                            <button
                              onClick={() => action(r.organization_id, 'remind')}
                              disabled={busy === r.organization_id + 'remind'}
                              title={t('cg.coRemind2')}
                              className="p-2 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
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
    </div>
  );
}
