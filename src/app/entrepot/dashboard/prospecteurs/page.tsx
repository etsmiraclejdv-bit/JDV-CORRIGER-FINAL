'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { useWarehouse } from '@/components/entrepot/WarehouseContext';
import { Card, PageTitle, useFormat } from '@/components/entrepot/common';
type Row = {
  prospecteur_id: string;
  full_name: string | null;
  overdue_count: number;
  to_return_units: number;
};
export default function ProspecteursPage() {
  const { current } = useWarehouse();
  const { t } = useLanguage();
  const { num } = useFormat();
  const [data, setData] = useState<Row[]>([]);
  const load = useCallback(async () => {
    if (!current) return;
    const r = await supabase.rpc('jdvcrm_warehouse_prospecteurs_v1', {
      p_warehouse_id: current.warehouse_id,
    });
    setData((r.data ?? []) as Row[]);
  }, [current]);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <div className="p-6 space-y-6 text-white">
      <PageTitle title={t('we.prosTitle')} subtitle={t('we.prosSub')} />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10">
                <th className="p-2">{t('we.thPros')}</th>
                <th className="p-2">{t('we.thOverdue')}</th>
                <th className="p-2">{t('we.thToReturn')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((x) => (
                <tr key={x.prospecteur_id} className="border-b border-white/5">
                  <td className="p-2">{x.full_name ?? '—'}</td>
                  <td className="p-2">{num(x.overdue_count)}</td>
                  <td className="p-2">{num(x.to_return_units)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
