'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useWarehouse } from '@/components/entrepot/WarehouseContext';
import { Card, PageTitle, useFormat } from '@/components/entrepot/common';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

type Row = {
  movement_id: string;
  article_code: string;
  article_name: string;
  occurred_at: string;
  movement_label: string;
  entry_quantity: number;
  exit_quantity: number;
  stock_before: number;
  stock_after: number;
  unit_price: number;
  movement_amount: number;
  stock_value_after: number;
  notes: string | null;
  subwarehouse_name: string | null;
  subwarehouse_code: string | null;
};
type Sub = { id: string; name: string; code: string };

export default function JournalStockPage() {
  const { current } = useWarehouse();
  const { t, locale } = useLanguage();
  const { num } = useFormat();
  const [rows, setRows] = useState<Row[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [subId, setSubId] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!current) return;
    setLoading(true);
    setError('');
    const [sres, qres] = await Promise.all([
      supabase
        .from('warehouse_subwarehouses')
        .select('id,name,code')
        .eq('parent_warehouse_id', current.warehouse_id)
        .eq('active', true)
        .order('name'),
      supabase
        .from('jdvcrm_subwarehouse_stock_ledger_v1')
        .select(
          'movement_id,article_code,article_name,occurred_at,movement_label,entry_quantity,exit_quantity,stock_before,stock_after,unit_price,movement_amount,stock_value_after,notes,subwarehouse_name,subwarehouse_code'
        )
        .eq('warehouse_id', current.warehouse_id)
        .order('occurred_at', { ascending: false })
        .limit(1000),
    ]);
    if (sres.error) setError(sres.error.message);
    else setSubs((sres.data ?? []) as Sub[]);
    if (qres.error) setError(qres.error.message);
    setRows((qres.data ?? []) as Row[]);
    setLoading(false);
  }, [current]);
  // Les filtres s'appliquent aux lignes déjà chargées : changer de sous-entrepôt ou de date
  // ne relance plus de requête (et ne boucle plus sur le rechargement de la liste).
  const data = useMemo(() => {
    let filtered = rows;
    if (subId) {
      const sub = subs.find((s) => s.id === subId);
      filtered = filtered.filter((r) => !!sub && r.subwarehouse_name === sub.name);
    }
    if (date) {
      const start = new Date(date + 'T00:00:00').getTime();
      const end = new Date(date + 'T23:59:59.999').getTime();
      filtered = filtered.filter((r) => {
        const time = new Date(r.occurred_at).getTime();
        return time >= start && time <= end;
      });
    }
    return filtered;
  }, [rows, subs, subId, date]);
  useEffect(() => {
    void load();
  }, [load]);
  const totals = useMemo(
    () => ({
      entries: data.reduce((s, r) => s + Number(r.entry_quantity || 0), 0),
      exits: data.reduce((s, r) => s + Number(r.exit_quantity || 0), 0),
      value: data.reduce((s, r) => s + Number(r.movement_amount || 0), 0),
    }),
    [data]
  );
  return (
    <div className="p-6 space-y-6 text-white">
      <PageTitle title={t('we.jTitle')} subtitle={t('we.jSub')}>
        <div className="flex flex-wrap gap-2">
          <select
            value={subId}
            onChange={(e) => setSubId(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#08152f] px-3 py-2 text-sm"
          >
            <option value="">{t('we.allSubs')}</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#08152f] px-3 py-2 text-sm"
          />
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm"
          >
            <RefreshCw size={14} />
            {t('we.refresh')}
          </button>
        </div>
      </PageTitle>
      {error && <p className="text-red-400">{error}</p>}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase text-slate-500">{t('we.jEntries')}</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{num(totals.entries)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-slate-500">{t('we.jExits')}</p>
          <p className="mt-1 text-2xl font-bold text-red-400">{num(totals.exits)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase text-slate-500">{t('we.jValue')}</p>
          <p className="mt-1 text-2xl font-bold">{num(totals.value)} FCFA</p>
        </Card>
      </div>
      <Card>
        {loading ? (
          <p className="text-slate-400">{t('we.loading')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-slate-400">
                  <th className="p-2">{t('we.jThDateTime')}</th>
                  <th className="p-2">{t('we.jThSub')}</th>
                  <th className="p-2">{t('we.jThCode')}</th>
                  <th className="p-2">{t('we.jThItem')}</th>
                  <th className="p-2 text-right">{t('we.jThInitial')}</th>
                  <th className="p-2 text-right">{t('we.jThIn')}</th>
                  <th className="p-2 text-right">{t('we.jThOut')}</th>
                  <th className="p-2 text-right">{t('we.jThFinal')}</th>
                  <th className="p-2 text-right">{t('we.jThUnitPrice')}</th>
                  <th className="p-2 text-right">{t('we.jThAmount')}</th>
                  <th className="p-2 text-right">{t('we.jThStockValue')}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.movement_id} className="border-b border-white/5">
                    <td className="p-2 whitespace-nowrap">
                      {new Date(r.occurred_at).toLocaleString(locale)}
                    </td>
                    <td className="p-2">
                      {r.subwarehouse_code || '—'} {r.subwarehouse_name || ''}
                    </td>
                    <td className="p-2 font-mono text-[#D4AF37]">{r.article_code}</td>
                    <td className="p-2">{r.article_name}</td>
                    <td className="p-2 text-right">{num(r.stock_before)}</td>
                    <td className="p-2 text-right text-emerald-400">
                      {r.entry_quantity ? '+' + num(r.entry_quantity) : '—'}
                    </td>
                    <td className="p-2 text-right text-red-400">
                      {r.exit_quantity ? '-' + num(r.exit_quantity) : '—'}
                    </td>
                    <td className="p-2 text-right font-semibold">{num(r.stock_after)}</td>
                    <td className="p-2 text-right">{num(r.unit_price)} FCFA</td>
                    <td className="p-2 text-right">{num(r.movement_amount)} FCFA</td>
                    <td className="p-2 text-right">{num(r.stock_value_after)} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
