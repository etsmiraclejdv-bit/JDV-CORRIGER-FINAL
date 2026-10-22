'use client';
import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchSaleById,
  fetchPaymentsBySale,
  createPayment,
  type SaleView,
  type PaymentView,
} from '@/lib/services/salesService';
import { saleTotal } from '@/lib/services/compat';
import Modal from '@/components/ui/Modal';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import type { TerrainKey } from '@/lib/i18n/terrain';

type Row = Record<string, unknown>;

export default function SaleDetailPage() {
  const { t, locale } = useLanguage();
  const fill = (key: TerrainKey, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce(
      (text, [name, value]) => text.replace(`{${name}}`, String(value)),
      t(key)
    );
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(n);
  const statusLabel = (s: string) =>
    ['pending', 'active', 'completed', 'cancelled', 'defaulted'].includes(s)
      ? t(('bz.vd.' + s) as TerrainKey)
      : s;
  const METHODS = ['cash', 'mobile_money', 'bank_transfer', 'card'];
  const methodLabel = (m: string) => (METHODS.includes(m) ? t(('bz.vm.' + m) as TerrainKey) : m);
  const params = useParams();
  const saleId = params.id as string;
  const [sale, setSale] = useState<SaleView | null>(null);
  const [payments, setPayments] = useState<PaymentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState('cash');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [s, p] = await Promise.all([fetchSaleById(saleId), fetchPaymentsBySale(saleId)]);
    if (s.error || !s.data) setError(s.error?.message ?? 'bz.vNotFound');
    else setSale(s.data);
    setPayments(p.data ?? []);
    setLoading(false);
  }, [saleId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    if (!sale) return;
    if (amount <= 0) return toast.error(t('bz.vAmountPos'));
    setSaving(true);
    const { error: err } = await createPayment({
      organization_id: sale.organization_id as string,
      sale_id: saleId,
      client_id: (sale.client_id as string) ?? undefined,
      prospecteur_id: (sale.prospecteur_id as string) ?? undefined,
      amount,
      currency: 'XOF',
      payment_method: method,
      status: 'successful',
    });
    setSaving(false);
    if (err) return toast.error(err.message);
    toast.success(t('bz.vPaySaved'));
    setOpen(false);
    setAmount(0);
    load();
  }

  if (loading) return <div className="p-8 text-center text-[#A0AEC0]">{t('we.loading')}</div>;
  if (error || !sale) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-red-400 text-sm">
          {error ? (error.startsWith('bz.') ? t(error as TerrainKey) : error) : t('bz.vNotFound')}
        </p>
        <Link href="/business/dashboard/ventes" className="text-[#D4AF37] text-sm hover:underline">
          {t('bz.vBackSales')}
        </Link>
      </div>
    );
  }

  const total = saleTotal(sale);
  const paid = Number(sale.amount_paid) || 0;
  const remaining = Number(sale.amount_remaining) || 0;
  const client = sale.clients;
  const product = sale.products;
  const seller = sale.profiles;
  const canPay = remaining > 0 && sale.status !== 'cancelled';

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/business/dashboard/ventes"
          className="p-2 rounded-xl text-[#718096] hover:text-white hover:bg-[#0F2347] transition-all"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {fill('bz.vdTitle', { n: sale.sale_number as string })}
          </h1>
          <p className="text-sm text-[#A0AEC0]">
            {new Date(sale.sale_date as string).toLocaleDateString(locale)} —{' '}
            {statusLabel(sale.status as string)}
          </p>
        </div>
        {canPay && (
          <button
            onClick={() => {
              setAmount(remaining);
              setOpen(true);
            }}
            className="ml-auto flex items-center gap-2 btn-gold px-4 py-2.5 rounded-xl text-sm font-bold"
          >
            <Plus size={14} />
            {t('bz.vdCollect')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t('bz.vdTotal'), value: fmt(total), cls: 'text-white' },
          { label: t('bz.vdPaid'), value: fmt(paid), cls: 'text-green-400' },
          { label: t('bz.vdRemaining'), value: fmt(remaining), cls: 'text-[#D4AF37]' },
        ].map((k) => (
          <div key={k.label} className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-2xl p-4">
            <p className="text-xs text-[#A0AEC0] mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.cls}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-2xl p-5 space-y-3 text-sm">
          <h2 className="font-semibold text-white">{t('bz.vdDetails')}</h2>
          <div className="flex justify-between">
            <span className="text-[#718096]">{t('bz.vColClient')}</span>
            {client ? (
              <Link
                href={`/business/dashboard/clients/${client.id as string}`}
                className="text-[#D4AF37] hover:underline"
              >
                {client.full_name as string}
              </Link>
            ) : (
              <span className="text-white">—</span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-[#718096]">{t('bz.vdItem')}</span>
            <span className="text-white">{(product?.name as string) ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#718096]">{t('bz.vdQty')}</span>
            <span className="text-white">{sale.quantity as number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#718096]">{t('bz.vdType')}</span>
            <span className="text-white">
              {sale.sale_type === 'credit' ? t('bz.vdCredit') : t('bz.vdCash')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#718096]">{t('bz.fnProsp')}</span>
            <span className="text-white">{(seller?.full_name as string) ?? '—'}</span>
          </div>
          {sale.sale_type === 'credit' && (
            <div className="flex justify-between">
              <span className="text-[#718096]">{t('bz.vdInstallment')}</span>
              <span className="text-white">
                {fmt(Number(sale.payment_amount) || 0)} / {String(sale.payment_frequency ?? '—')}
              </span>
            </div>
          )}
          {sale.deadline_date ? (
            <div className="flex justify-between">
              <span className="text-[#718096]">{t('bz.vdDeadline')}</span>
              <span className="text-white">
                {new Date(sale.deadline_date as string).toLocaleDateString(locale)}
              </span>
            </div>
          ) : null}
        </div>

        <div className="bg-[#0F2347] border border-[#D4AF37]/20 rounded-2xl p-5">
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Wallet size={16} className="text-[#D4AF37]" /> {t('bz.vdPayments')}
          </h2>
          {payments.length === 0 ? (
            <p className="text-sm text-[#A0AEC0]">{t('bz.vdNoPay')}</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id as string} className="border-b border-[#D4AF37]/5">
                    <td className="py-2 text-[#A0AEC0]">
                      {new Date(p.payment_date as string).toLocaleDateString(locale)}
                    </td>
                    <td className="py-2 text-[#A0AEC0]">
                      {methodLabel(p.payment_method as string) ?? '—'}
                    </td>
                    <td className="py-2 text-right font-semibold text-white">
                      {fmt(Number(p.amount) || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('bz.vdCollect')} size="sm">
        <form onSubmit={handlePayment} className="space-y-4 p-1">
          <div>
            <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
              {t('bz.vdAmountXof')}
            </label>
            <input
              type="number"
              min={1}
              max={remaining}
              value={amount}
              onChange={(e) =>
                setAmount(Math.min(remaining, Math.max(0, parseInt(e.target.value) || 0)))
              }
              className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#D4AF37]/60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
              {t('bz.vdMethod')}
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-[#0A1628] border border-[#D4AF37]/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none"
            >
              {METHODS.map((k) => (
                <option key={k} value={k}>
                  {methodLabel(k)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-[#D4AF37]/20 text-[#A0AEC0] text-sm hover:text-white transition-colors"
            >
              {t('bz.vdCancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-gold py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
            >
              {saving ? t('bz.vdSaving') : t('bz.vdSave')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
