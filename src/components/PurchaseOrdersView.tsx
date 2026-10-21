'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ClipboardList, Plus, RefreshCw, Search, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminOrganization } from '@/lib/auth/admin-org';
import {
  createPurchaseOrder,
  fetchArticles,
  fetchPurchaseOrders,
  fetchSuppliers,
  type ArticleOption,
  type PurchaseOrderRow,
  type Supplier,
} from '@/lib/services/purchasesService';
import {
  lineTotal,
  orderTotal,
  toOrderItemsPayload,
  type OrderLineInput,
} from '@/lib/purchases/helpers';
import { toNumber } from '@/lib/relances/helpers';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';
import { usePurchaseLabels } from '@/lib/purchases/useLabels';
import { inputClass, labelClass } from '@/lib/ui/forms';
import Modal from '@/components/ui/Modal';
import MetricCard from '@/components/ui/MetricCard';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

type Filter = 'all' | 'open' | 'received' | 'cancelled';
const FILTERS: { id: Filter; label: TerrainKey }[] = [
  { id: 'all', label: 'bz.puAll' },
  { id: 'open', label: 'bz.puOpen' },
  { id: 'received', label: 'bz.puRecv' },
  { id: 'cancelled', label: 'bz.puCanc' },
];
const OPEN_STATUSES = ['draft', 'sent', 'confirmed', 'partial'];

const STATUS_CLASSES: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  partial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  received: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  closed: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

interface LineState extends OrderLineInput {
  key: number;
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function PurchaseOrdersView() {
  const { t, locale } = useLanguage();
  const labels = usePurchaseLabels();
  const fill = (key: TerrainKey, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      t(key)
    );
  const formatXof = (value: unknown) =>
    `${new Intl.NumberFormat(locale).format(Math.round(toNumber(value)))} XOF`;
  const formatDateFr = (iso: string | null | undefined) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
    return m
      ? new Intl.DateTimeFormat(locale, { timeZone: 'UTC' }).format(
          new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
        )
      : '—';
  };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<PurchaseOrderRow[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [articles, setArticles] = useState<ArticleOption[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [expected, setExpected] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineState[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { orgId: org, error: guardError } = await getAdminOrganization();
    if (!org) {
      setError(guardError ?? 'bz.puNoAccess');
      setLoading(false);
      return;
    }
    const [o, s, a] = await Promise.all([
      fetchPurchaseOrders(org),
      fetchSuppliers(org),
      fetchArticles(org),
    ]);
    if (o.error || s.error || a.error) setError(o.error || s.error || a.error || '');
    setOrders(o.data);
    setSuppliers(s.data);
    setArticles(a.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeSuppliers = useMemo(
    () => suppliers.filter((s) => s.status === 'active'),
    [suppliers]
  );

  const stats = useMemo(() => {
    const live = orders.filter((o) => o.status !== 'cancelled');
    return {
      open: orders.filter((o) => OPEN_STATUSES.includes(o.status)).length,
      toPay: live.reduce((s, o) => s + Math.max(0, o.total_amount - o.paid_amount), 0),
      ordered: live.reduce((s, o) => s + o.total_amount, 0),
    };
  }, [orders]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter === 'open' && !OPEN_STATUSES.includes(o.status)) return false;
      if (filter === 'received' && o.status !== 'received') return false;
      if (filter === 'cancelled' && o.status !== 'cancelled') return false;
      return (
        !q || o.order_number.toLowerCase().includes(q) || o.supplier_name.toLowerCase().includes(q)
      );
    });
  }, [orders, search, filter]);

  function openCreate() {
    setSupplierId(activeSuppliers.length === 1 ? activeSuppliers[0].id : '');
    setExpected('');
    setNotes('');
    setLines([{ key: 1, article_id: '', quantity: '1', unit_cost: '' }]);
    setNextKey(2);
    setFormError('');
    setOpen(true);
  }

  const updateLine = (key: number, patch: Partial<OrderLineInput>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  async function handleCreate() {
    if (saving) return;
    if (!supplierId) {
      setFormError(t('bz.puPickSupplier'));
      return;
    }
    const lineError = labels.lineError(lines);
    if (lineError) {
      setFormError(lineError);
      return;
    }
    if (expected && expected < today()) {
      setFormError(t('bz.puPastDate'));
      return;
    }
    setSaving(true);
    const {
      orderId,
      orderNumber,
      error: err,
    } = await createPurchaseOrder(supplierId, expected || null, notes, toOrderItemsPayload(lines));
    setSaving(false);
    if (err) {
      setFormError(err);
      return;
    }
    toast.success(fill('bz.puCreated', { n: orderNumber ?? '' }));
    setOpen(false);
    if (orderId) router.push(`/business/dashboard/achats/${orderId}`);
    else void load();
  }

  const showError = (s: string) => (s.startsWith('bz.') ? t(s as TerrainKey) : s);
  if (loading && orders.length === 0 && !error) return <LoadingState message={t('bz.puLoading')} />;
  if (error && orders.length === 0 && suppliers.length === 0) {
    return (
      <ErrorState
        message={showError(error)}
        action={{ label: t('bz.fnRetry'), onClick: () => void load() }}
      />
    );
  }

  const noPrerequisite = activeSuppliers.length === 0 || articles.length === 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('bz.puTitle')}</h1>
          <p className="text-sm text-[#A0AEC0] mt-1">{t('bz.puSub')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            aria-label={t('bz.puRefreshAria')}
            className="flex items-center gap-2 btn-outline-gold px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {t('bz.fnRefresh')}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 btn-gold px-4 py-2.5 rounded-xl text-sm font-bold"
          >
            <Plus size={14} />
            {t('bz.puNew')}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {showError(error)}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title={t('bz.puMOpen')}
          value={String(stats.open)}
          subtitle={t('bz.puMOpenSub')}
          icon={<ClipboardList size={18} />}
          variant="default"
        />
        <MetricCard
          title={t('bz.puMToPay')}
          value={formatXof(stats.toPay)}
          subtitle={t('bz.puMToPaySub')}
          icon={<Wallet size={18} />}
          variant={stats.toPay > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          title={t('bz.puMOrdered')}
          value={formatXof(stats.ordered)}
          subtitle={t('bz.puMOrderedSub')}
          icon={<ClipboardList size={18} />}
          variant="gold"
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('bz.puSearchPh')}
            aria-label={t('bz.puSearchAria')}
            className="w-full bg-[#0F2347] border border-[#D4AF37]/20 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-[#718096] focus:outline-none focus:border-[#D4AF37]/60"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('bz.puFilterAria')}>
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

      <div className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
        {visible.length === 0 ? (
          <div className="py-16 text-center px-6">
            <ClipboardList size={32} className="mx-auto mb-3 text-[#D4AF37] opacity-60" />
            <p className="text-white text-sm font-semibold mb-1">
              {orders.length === 0 ? t('bz.puNone') : t('bz.puNoResult')}
            </p>
            <p className="text-[#A0AEC0] text-sm">
              {orders.length === 0 ? t('bz.puCreateFirst') : t('bz.puChangeFilter')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D4AF37]/10">
                  {[
                    t('bz.puColOrder'),
                    t('bz.puColSupplier'),
                    t('bz.puColDate'),
                    t('bz.puColExpected'),
                    t('bz.puColTotal'),
                    t('bz.puColRest'),
                    t('bz.puColStatus'),
                    '',
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="text-left px-4 py-3 text-xs font-semibold text-[#718096] uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((o) => {
                  const remaining = Math.max(0, o.total_amount - o.paid_amount);
                  return (
                    <tr key={o.id} className="border-b border-[#D4AF37]/5 hover:bg-[#0B1B3D]/50">
                      <td className="px-4 py-3 text-sm font-medium text-white whitespace-nowrap">
                        {o.order_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#A0AEC0]">{o.supplier_name}</td>
                      <td className="px-4 py-3 text-sm text-[#A0AEC0] whitespace-nowrap">
                        {formatDateFr(o.order_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#A0AEC0] whitespace-nowrap">
                        {formatDateFr(o.expected_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white whitespace-nowrap">
                        {formatXof(o.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {o.status === 'cancelled' ? (
                          <span className="text-[#718096]">—</span>
                        ) : remaining > 0 ? (
                          <span className="font-semibold text-[#F6AD55]">
                            {formatXof(remaining)}
                          </span>
                        ) : (
                          <span className="text-[#68D391]">{t('bz.puSettled')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLASSES[o.status] ?? STATUS_CLASSES.closed}`}
                        >
                          {labels.orderStatus(o.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/business/dashboard/achats/${o.id}`}
                          className="text-sm text-[#D4AF37] hover:underline whitespace-nowrap"
                        >
                          {t('bz.puOpenLink')}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title={t('bz.puModalTitle')}
        size="xl"
      >
        <div className="space-y-4">
          {noPrerequisite && (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
              {activeSuppliers.length === 0 && (
                <p>
                  {t('bz.puNoSupplier')}{' '}
                  <Link href="/business/dashboard/fournisseurs" className="underline">
                    {t('bz.puAddOne')}
                  </Link>
                  .
                </p>
              )}
              {articles.length === 0 && (
                <p>
                  {t('bz.puNoArticle')}{' '}
                  <Link href="/business/dashboard/catalogue" className="underline">
                    {t('bz.puCreateInCat')}
                  </Link>
                  .
                </p>
              )}
            </div>
          )}
          {formError && (
            <div
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              role="alert"
            >
              {formError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="po-supplier">
                {t('bz.puSupplierReq')}
              </label>
              <select
                id="po-supplier"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className={inputClass}
              >
                <option value="">{t('bz.puChoose')}</option>
                {activeSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.company_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="po-expected">
                {t('bz.puExpected')}
              </label>
              <input
                id="po-expected"
                type="date"
                min={today()}
                value={expected}
                onChange={(e) => setExpected(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <p className={labelClass}>{t('bz.puItemsReq')}</p>
            <div className="space-y-2">
              {lines.map((l) => (
                <div key={l.key} className="grid grid-cols-12 gap-2 items-center">
                  <select
                    value={l.article_id}
                    onChange={(e) => updateLine(l.key, { article_id: e.target.value })}
                    aria-label={t('bz.puItem')}
                    className={`${inputClass} col-span-12 sm:col-span-4`}
                  >
                    <option value="">{t('bz.puItemPh')}</option>
                    {articles.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code ? `${a.code} — ${a.name}` : a.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={l.quantity}
                    onChange={(e) => updateLine(l.key, { quantity: e.target.value })}
                    aria-label={t('bz.puQty')}
                    placeholder={t('bz.puQtyPh')}
                    className={`${inputClass} col-span-5 sm:col-span-2`}
                  />
                  <input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={l.unit_cost}
                    onChange={(e) => updateLine(l.key, { unit_cost: e.target.value })}
                    aria-label={t('bz.puUnitCost')}
                    placeholder={t('bz.puUnitCostPh')}
                    className={`${inputClass} col-span-5 sm:col-span-2`}
                  />
                  <p className="sm:col-span-3 text-xs text-right text-[#A0AEC0] hidden sm:block">
                    {formatXof(lineTotal(l))}
                  </p>
                  <button
                    onClick={() =>
                      setLines((prev) =>
                        prev.length > 1 ? prev.filter((x) => x.key !== l.key) : prev
                      )
                    }
                    disabled={lines.length === 1}
                    aria-label={t('bz.puRemoveLine')}
                    className="col-span-2 sm:col-span-1 p-2 rounded-lg bg-[#0B1B3D] text-[#A0AEC0] border border-[#D4AF37]/20 hover:text-white disabled:opacity-40 flex justify-center"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => {
                  setLines((prev) => [
                    ...prev,
                    { key: nextKey, article_id: '', quantity: '1', unit_cost: '' },
                  ]);
                  setNextKey((k) => k + 1);
                }}
                disabled={lines.length >= 200}
                className="flex items-center gap-1.5 text-sm text-[#D4AF37] hover:underline disabled:opacity-50"
              >
                <Plus size={14} />
                {t('bz.puAddItem')}
              </button>
              <p className="text-sm text-white font-semibold">
                {fill('bz.puTotalLbl', { a: formatXof(orderTotal(lines)) })}
              </p>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="po-notes">
              {t('bz.puNotes')}
            </label>
            <textarea
              id="po-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              rows={2}
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setOpen(false)}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0B1B3D] text-[#A0AEC0] border border-[#D4AF37]/20 hover:text-white disabled:opacity-50"
            >
              {t('bz.puCancel')}
            </button>
            <button
              onClick={() => void handleCreate()}
              disabled={saving || noPrerequisite}
              className="btn-gold px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {saving ? t('bz.puCreating') : t('bz.puCreate')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
