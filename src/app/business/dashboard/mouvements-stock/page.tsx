'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
export default function MouvementsStockPage() {
  const { t, locale } = useLanguage();
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    supabase
      .from('jdvcrm_stock_journal_v1')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(500)
      .then((r) => setData(r.data ?? []));
  }, []);
  return (
    <div className="p-6 text-white space-y-6">
      <h1 className="text-2xl font-bold">{t('bz.msTitle')}</h1>
      <p className="text-slate-400">{t('bz.msSub')}</p>
      <div className="rounded-2xl border border-white/10 bg-[#08152f] p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="p-2">{t('bz.msDate')}</th>
              <th className="p-2">{t('bz.msProduct')}</th>
              <th className="p-2">{t('bz.msOp')}</th>
              <th className="p-2">{t('bz.msQty')}</th>
              <th className="p-2">{t('bz.msFrom')}</th>
              <th className="p-2">{t('bz.msTo')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((x) => (
              <tr key={x.movement_id} className="border-t border-white/5">
                <td className="p-2">
                  {x.occurred_at ? new Date(x.occurred_at).toLocaleString(locale) : '—'}
                </td>
                <td className="p-2">{x.article_name}</td>
                <td className="p-2">{x.movement_label}</td>
                <td className="p-2">{x.quantity}</td>
                <td className="p-2">{x.from_section ?? '—'}</td>
                <td className="p-2">{x.to_section ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
