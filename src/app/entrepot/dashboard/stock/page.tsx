'use client';
import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { useWarehouse } from '@/components/entrepot/WarehouseContext';
import { Card, PageTitle, useFormat } from '@/components/entrepot/common';
type Row = {
  article_id: string;
  article_name: string;
  quantity: number;
  minimum_quantity: number;
  is_low: boolean;
};
export default function StockPage() {
  const { current } = useWarehouse();
  const { t } = useLanguage();
  const { num } = useFormat();
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!current) return;
    setLoading(true);
    const r = await supabase.rpc('jdvcrm_warehouse_stock_v1', {
      p_warehouse_id: current.warehouse_id,
    });
    if (r.error) setError(r.error.message);
    else setData((r.data ?? []) as Row[]);
    setLoading(false);
  }, [current]);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <div className="p-6 space-y-6 text-white">
      <PageTitle title={t('we.stockTitle')} subtitle={t('we.stockSub')}>
        <div className="flex gap-2">
          {current?.access_role !== 'manager' && (
            <Link
              href="/entrepot/dashboard/journal-stock"
              className="rounded-lg border border-[#34D399]/30 px-3 py-2 text-sm text-[#34D399]"
            >
              {t('we.journal')}
            </Link>
          )}
          {current?.access_role !== 'manager' && (
            <Link
              href="/entrepot/dashboard/cloture-stock"
              className="rounded-lg border border-white/10 px-3 py-2 text-sm"
            >
              {t('we.closure')}
            </Link>
          )}
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm"
          >
            <RefreshCw size={14} />
            {t('we.refresh')}
          </button>
        </div>
      </PageTitle>
      {error && <p className="text-red-400">{error}</p>}
      <Card>
        {loading ? (
          <p className="text-slate-400">{t('we.loading')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-white/10">
                  <th className="p-2">{t('we.thProduct')}</th>
                  <th className="p-2 text-right">{t('we.thStock')}</th>
                  <th className="p-2 text-right">{t('we.thThreshold')}</th>
                  <th className="p-2">{t('we.thState')}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.article_id} className="border-b border-white/5">
                    <td className="p-2">{r.article_name}</td>
                    <td className="p-2 text-right">{num(r.quantity)}</td>
                    <td className="p-2 text-right">{num(r.minimum_quantity)}</td>
                    <td className={r.is_low ? 'p-2 text-red-400' : 'p-2 text-emerald-400'}>
                      {r.is_low ? t('we.low') : t('we.ok')}
                    </td>
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
