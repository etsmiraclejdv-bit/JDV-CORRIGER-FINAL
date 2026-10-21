'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Package, RefreshCw, Wallet, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';
import { usePurchaseLabels } from '@/lib/purchases/useLabels';
import { getAdminOrganization } from '@/lib/auth/admin-org';
import {
  cancelPurchaseOrder,
  fetchOrderDetail,
  payPurchaseOrder,
  receivePurchaseOrder,
  type OrderDetail,
} from '@/lib/services/purchasesService';
import {
  PAYMENT_METHODS,
  canCancelOrder,
  canPay,
  canReceive,
  friendlyDbError,
  paidTotal,
  paymentState,
  receiptProgress,
  receivedByArticle,
  remainingByArticle,
  remainingToPay,
  validatePaymentAmount,
  validateReceiptInputs,
} from '@/lib/purchases/helpers';
import { toNumber } from '@/lib/relances/helpers';
import { inputClass, labelClass } from '@/lib/ui/forms';
import Modal from '@/components/ui/Modal';
import MetricCard from '@/components/ui/MetricCard';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

const STATUS_CLASSES: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  partial: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  received: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  closed: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

const btnGhost =
  'px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0B1B3D] text-[#A0AEC0] border border-[#D4AF37]/20 hover:text-white disabled:opacity-50';

export default function PurchaseOrderDetailView({ orderId }: { orderId: string }) {
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState<OrderDetail | null>(null);

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveInputs, setReceiveInputs] = useState<Record<string, string>>({});
  const [receiveNotes, setReceiveNotes] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<string>('cash');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { orgId, error: guardError } = await getAdminOrganization();
    if (!orgId) {
      setError(guardError ?? 'bz.puNoAccess');
      setLoading(false);
      return;
    }
    const res = await fetchOrderDetail(orderId);
    if (res.error || !res.data) setError(res.error ?? 'bz.pdNotFound');
    setDetail(res.data);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const computed = useMemo(() => {
    if (!detail) return null;
    const remaining = remainingByArticle(detail.items, detail.receipts);
    const received = receivedByArticle(detail.receipts);
    const paid = paidTotal(detail.payments);
    const toPay = remainingToPay(detail.total_amount, detail.payments);
    const names: Record<string, string> = {};
    for (const it of detail.items) names[it.article_id.toLowerCase()] = it.article_name;
    return {
      remaining,
      received,
      paid,
      toPay,
      names,
      progress: receiptProgress(detail.items, detail.receipts),
      state: paymentState(detail.total_amount, detail.payments),
    };
  }, [detail]);

  function openReceive() {
    if (!detail || !computed) return;
    const inputs: Record<string, string> = {};
    for (const it of detail.items) inputs[it.article_id] = '';
    setReceiveInputs(inputs);
    setReceiveNotes('');
    setModalError('');
    setReceiveOpen(true);
  }

  function receiveAll() {
    if (!computed) return;
    const inputs: Record<string, string> = {};
    for (const [id, qty] of Object.entries(computed.remaining))
      inputs[id] = qty > 0 ? String(qty) : '';
    setReceiveInputs(inputs);
  }

  async function handleReceive() {
    if (!detail || !computed || busy) return;
    const v = validateReceiptInputs(computed.remaining, receiveInputs);
    if (v.error) {
      setModalError(labels.helperError(v.error));
      return;
    }
    setBusy(true);
    const res = await receivePurchaseOrder(detail.id, v.items, receiveNotes);
    setBusy(false);
    if (res.error) {
      setModalError(
        friendlyDbError(res.error, { ...computed.names }).replace(
          /« cet article »|cet article/g,
          t('bz.pdThisItem')
        )
      );
      return;
    }
    toast.success(fill('bz.pdReceived', { n: res.receiptNumber ?? '' }));
    setReceiveOpen(false);
    void load();
  }

  function openPay() {
    if (!computed) return;
    setPayAmount(String(computed.toPay));
    setPayMethod('cash');
    setPayRef('');
    setPayNotes('');
    setModalError('');
    setPayOpen(true);
  }

  async function handlePay() {
    if (!detail || !computed || busy) return;
    const v = validatePaymentAmount(payAmount, computed.toPay);
    if (v.error) {
      setModalError(labels.helperError(v.error));
      return;
    }
    setBusy(true);
    const res = await payPurchaseOrder(detail.id, v.amount, payMethod, payRef, payNotes);
    setBusy(false);
    if (res.error) {
      setModalError(res.error);
      return;
    }
    toast.success(res.remaining === 0 ? t('bz.pdPaySettled') : t('bz.pdPaid'));
    setPayOpen(false);
    void load();
  }

  async function handleCancel() {
    if (!detail || busy) return;
    setBusy(true);
    const res = await cancelPurchaseOrder(detail.id);
    setBusy(false);
    if (res.error) {
      setModalError(res.error);
      return;
    }
    toast.success(t('bz.pdCancelled'));
    setCancelOpen(false);
    void load();
  }

  const showError = (s: string) => (s.startsWith('bz.') ? t(s as TerrainKey) : s);
  if (loading && !detail) return <LoadingState message={t('bz.pdLoading')} />;
  if (error && !detail) {
    return (
      <ErrorState
        message={showError(error)}
        action={{ label: t('bz.fnRetry'), onClick: () => void load() }}
      />
    );
  }
  if (!detail || !computed) return null;

  const showReceive = canReceive(detail.status);
  const showPay = canPay(detail.status, computed.toPay);
  const showCancel = canCancelOrder(detail.status, computed.paid);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <Link
        href="/business/dashboard/achats"
        className="inline-flex items-center gap-1.5 text-sm text-[#A0AEC0] hover:text-white"
      >
        <ArrowLeft size={14} />
        {t('bz.pdBack')}
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{detail.order_number}</h1>
            <span
              className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_CLASSES[detail.status] ?? STATUS_CLASSES.closed}`}
            >
              {labels.orderStatus(detail.status)}
            </span>
          </div>
          <p className="text-sm text-[#A0AEC0] mt-1">
            {fill('bz.pdOrderedOn', {
              s: detail.supplier_name,
              d: formatDateFr(detail.order_date),
            })}
            {detail.expected_date
              ? fill('bz.pdExpectedOn', { d: formatDateFr(detail.expected_date) })
              : ''}
          </p>
          {detail.notes && (
            <p className="text-sm text-[#718096] mt-1 break-words">{detail.notes}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            aria-label={t('bz.fnRefresh')}
            className="p-2.5 rounded-xl btn-outline-gold disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          {showReceive && (
            <button
              onClick={openReceive}
              className="flex items-center gap-2 btn-gold px-4 py-2.5 rounded-xl text-sm font-bold"
            >
              <Package size={14} />
              {t('bz.pdReceive')}
            </button>
          )}
          {showPay && (
            <button
              onClick={openPay}
              className="flex items-center gap-2 btn-outline-gold px-4 py-2.5 rounded-xl text-sm font-semibold"
            >
              <Wallet size={14} />
              {t('bz.pdPay')}
            </button>
          )}
          {showCancel && (
            <button
              onClick={() => {
                setModalError('');
                setCancelOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-300 border border-red-500/30 hover:bg-red-500/20"
            >
              <XCircle size={14} />
              {t('bz.pdCancel')}
            </button>
          )}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title={t('bz.pdMAmount')}
          value={formatXof(detail.total_amount)}
          subtitle={fill('bz.pdItemsCount', { n: detail.items.length })}
          icon={<Wallet size={18} />}
          variant="gold"
        />
        <MetricCard
          title={t('bz.pdMPaid')}
          value={formatXof(computed.paid)}
          subtitle={labels.paymentState(computed.state)}
          icon={<CheckCircle size={18} />}
          variant="success"
        />
        <MetricCard
          title={t('bz.puMToPay')}
          value={formatXof(computed.toPay)}
          subtitle={computed.toPay > 0 ? t('bz.pdMToPaySub') : t('bz.pdMNothing')}
          icon={<Wallet size={18} />}
          variant={computed.toPay > 0 ? 'warning' : 'success'}
        />
        <MetricCard
          title={t('bz.pdMReceipt')}
          value={`${computed.progress} %`}
          subtitle={t('bz.pdMReceiptSub')}
          icon={<Package size={18} />}
          variant={computed.progress >= 100 ? 'success' : 'default'}
        />
      </div>

      <div className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D4AF37]/10">
          <h2 className="text-sm font-semibold text-white">{t('bz.pdItems')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D4AF37]/10">
                {[
                  t('bz.pdColItem'),
                  t('bz.pdColOrdered'),
                  t('bz.pdColReceived'),
                  t('bz.pdColRest'),
                  t('bz.pdColUnit'),
                  t('bz.pdColTotal'),
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
              {detail.items.map((it) => (
                <tr key={it.id} className="border-b border-[#D4AF37]/5">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{it.article_name}</p>
                    {it.article_code && <p className="text-xs text-[#718096]">{it.article_code}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{Number(it.quantity)}</td>
                  <td className="px-4 py-3 text-sm text-[#68D391]">
                    {computed.received[it.article_id] ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#F6AD55]">
                    {computed.remaining[it.article_id] ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#A0AEC0] whitespace-nowrap">
                    {formatXof(it.unit_cost)}
                  </td>
                  <td className="px-4 py-3 text-sm text-white whitespace-nowrap">
                    {formatXof(it.total_amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#D4AF37]/10">
            <h2 className="text-sm font-semibold text-white">{t('bz.pdReceipts')}</h2>
          </div>
          {detail.receipts.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[#A0AEC0] text-center">{t('bz.pdNoReceipt')}</p>
          ) : (
            <ul className="divide-y divide-[#D4AF37]/5">
              {detail.receipts.map((r) => (
                <li key={r.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white">{r.receipt_number}</p>
                    <p className="text-xs text-[#718096]">
                      {formatDateFr(r.receipt_date)}
                      {r.status !== 'received'
                        ? ` · ${r.status === 'cancelled' ? t('bz.pdCancelledLc') : t('bz.pdDraftLc')}`
                        : ''}
                    </p>
                  </div>
                  <p className="text-xs text-[#A0AEC0] mt-0.5">
                    {(r.goods_receipt_items ?? [])
                      .map(
                        (i) =>
                          `${computed.names[i.article_id.toLowerCase()] ?? t('bz.puItem')} × ${Number(i.quantity_received)}`
                      )
                      .join(' · ') || '—'}
                  </p>
                  {r.notes && (
                    <p className="text-xs text-[#718096] mt-0.5 break-words">{r.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#D4AF37]/10">
            <h2 className="text-sm font-semibold text-white">{t('bz.pdPayments')}</h2>
          </div>
          {detail.payments.length === 0 ? (
            <p className="px-5 py-8 text-sm text-[#A0AEC0] text-center">{t('bz.pdNoPayment')}</p>
          ) : (
            <ul className="divide-y divide-[#D4AF37]/5">
              {detail.payments.map((p) => (
                <li key={p.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-white">
                      {labels.paymentMethod(p.payment_method)}
                      {p.provider_reference ? ` · ${p.provider_reference}` : ''}
                    </p>
                    <p className="text-xs text-[#718096]">
                      {formatDateFr(p.payment_date)}
                      {p.status !== 'paid' ? ` · ${p.status}` : ''}
                    </p>
                    {p.notes && <p className="text-xs text-[#718096] break-words">{p.notes}</p>}
                  </div>
                  <p className="text-sm font-semibold text-white whitespace-nowrap">
                    {formatXof(p.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Réception */}
      <Modal
        open={receiveOpen}
        onClose={() => !busy && setReceiveOpen(false)}
        title={t('bz.pdRcvTitle')}
        size="xl"
      >
        <div className="space-y-4">
          {modalError && (
            <div
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              role="alert"
            >
              {modalError}
            </div>
          )}
          <p className="text-sm text-[#A0AEC0]">{t('bz.pdRcvIntro')}</p>
          <div className="space-y-2">
            {detail.items.map((it) => {
              const rest = computed.remaining[it.article_id] ?? 0;
              return (
                <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-12 sm:col-span-7">
                    <p className="text-sm text-white">{it.article_name}</p>
                    <p className="text-xs text-[#718096]">{fill('bz.pdRestToRecv', { n: rest })}</p>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={rest}
                    step="any"
                    inputMode="decimal"
                    value={receiveInputs[it.article_id] ?? ''}
                    onChange={(e) =>
                      setReceiveInputs((prev) => ({ ...prev, [it.article_id]: e.target.value }))
                    }
                    disabled={rest <= 0}
                    aria-label={fill('bz.pdQtyRecvFor', { a: it.article_name })}
                    placeholder="0"
                    className={`${inputClass} col-span-12 sm:col-span-5 disabled:opacity-40`}
                  />
                </div>
              );
            })}
          </div>
          <button onClick={receiveAll} className="text-sm text-[#D4AF37] hover:underline">
            {t('bz.pdRecvAll')}
          </button>
          <div>
            <label className={labelClass} htmlFor="rcv-notes">
              {t('bz.pdNotes')}
            </label>
            <textarea
              id="rcv-notes"
              value={receiveNotes}
              onChange={(e) => setReceiveNotes(e.target.value)}
              maxLength={1000}
              rows={2}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setReceiveOpen(false)} disabled={busy} className={btnGhost}>
              {t('bz.pdCancel')}
            </button>
            <button
              onClick={() => void handleReceive()}
              disabled={busy}
              className="btn-gold px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {busy ? t('bz.pdSaving') : t('bz.pdValidateRcv')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Paiement */}
      <Modal
        open={payOpen}
        onClose={() => !busy && setPayOpen(false)}
        title={t('bz.pdPay')}
        size="md"
      >
        <div className="space-y-4">
          {modalError && (
            <div
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              role="alert"
            >
              {modalError}
            </div>
          )}
          <p className="text-sm text-[#A0AEC0]">
            {t('bz.pdRestToPay')}{' '}
            <span className="text-white font-semibold">{formatXof(computed.toPay)}</span>
          </p>
          <div>
            <label className={labelClass} htmlFor="pay-amount">
              {t('bz.pdAmount')}
            </label>
            <input
              id="pay-amount"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="pay-method">
              {t('bz.pdMethod')}
            </label>
            <select
              id="pay-method"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className={inputClass}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {labels.paymentMethod(m.value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="pay-ref">
              {t('bz.pdRef')}
            </label>
            <input
              id="pay-ref"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              maxLength={120}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="pay-notes">
              {t('bz.pdNotes')}
            </label>
            <textarea
              id="pay-notes"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              maxLength={1000}
              rows={2}
              className={inputClass}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setPayOpen(false)} disabled={busy} className={btnGhost}>
              {t('bz.pdCancel')}
            </button>
            <button
              onClick={() => void handlePay()}
              disabled={busy}
              className="btn-gold px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
            >
              {busy ? t('bz.pdSaving') : t('bz.pdSave')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Annulation */}
      <Modal
        open={cancelOpen}
        onClose={() => !busy && setCancelOpen(false)}
        title={t('bz.pdCancelTitle')}
        size="sm"
      >
        <div className="space-y-4">
          {modalError && (
            <div
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              role="alert"
            >
              {modalError}
            </div>
          )}
          <p className="text-sm text-[#A0AEC0]">
            {t('bz.pdCancelQ1')}{' '}
            <span className="text-white font-semibold">{detail.order_number}</span>
            {t('bz.pdCancelQ2')}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setCancelOpen(false)} disabled={busy} className={btnGhost}>
              {t('bz.pdKeep')}
            </button>
            <button
              onClick={() => void handleCancel()}
              disabled={busy}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-500/80 text-white hover:bg-red-500 disabled:opacity-50"
            >
              {busy ? t('bz.pdCancelling') : t('bz.pdCancelTitle')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
