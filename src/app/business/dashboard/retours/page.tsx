'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';

type Row = {
  return_id: string;
  return_number: string;
  return_date: string;
  reason: string;
  status: string;
  prospecteur_id: string | null;
  returned_by_name: string | null;
  returned_by_role: string | null;
  warehouse_name: string | null;
  warehouse_code: string | null;
  subwarehouse_name: string | null;
  subwarehouse_code: string | null;
  received_at: string | null;
  article_code: string;
  article_name: string;
  quantity: number;
};

export default function RetoursPage() {
  const { t, locale } = useLanguage();
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    supabase
      .from('jdvcrm_returns_traceability_v1')
      .select('*')
      .order('return_date', { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setData((data ?? []) as Row[]);
        setLoading(false);
      });
  }, []);
  return (
    <div className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('bz.rtTitle')}</h1>
        <p className="text-slate-400">{t('bz.rtSub')}</p>
      </div>
      {error && (
        <div className="rounded-xl border border-red-400/30 bg-red-950/30 p-4 text-red-200">
          {error}
        </div>
      )}
      <div className="rounded-2xl border border-white/10 bg-[#08152f] p-5 overflow-x-auto">
        {loading ? (
          <p className="text-slate-400">{t('we.loading')}</p>
        ) : (
          <table className="w-full min-w-[1500px] text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10">
                <th className="p-2">{t('bz.rtDateTime')}</th>
                <th className="p-2">{t('bz.rtNo')}</th>
                <th className="p-2">{t('bz.rtAgent')}</th>
                <th className="p-2">{t('bz.rtCode')}</th>
                <th className="p-2">{t('bz.rtItem')}</th>
                <th className="p-2">{t('bz.rtQty')}</th>
                <th className="p-2">{t('bz.rtWh')}</th>
                <th className="p-2">{t('bz.rtSubWh')}</th>
                <th className="p-2">{t('bz.rtReason')}</th>
                <th className="p-2">{t('bz.rtStatus')}</th>
                <th className="p-2">{t('bz.rtReceipt')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((x) => (
                <tr key={x.return_id} className="border-t border-white/5">
                  <td className="p-2 whitespace-nowrap">
                    {x.return_date ? new Date(x.return_date).toLocaleString(locale) : '—'}
                  </td>
                  <td className="p-2 font-mono text-[#D4AF37]">{x.return_number || '—'}</td>
                  <td className="p-2 font-medium">{x.returned_by_name || t('bz.rtUnknown')}</td>
                  <td className="p-2 font-mono">{x.article_code}</td>
                  <td className="p-2">{x.article_name}</td>
                  <td className="p-2">{x.quantity}</td>
                  <td className="p-2">
                    {x.warehouse_code || '—'} {x.warehouse_name || ''}
                  </td>
                  <td className="p-2">
                    {x.subwarehouse_code || '—'} {x.subwarehouse_name || ''}
                  </td>
                  <td className="p-2">{x.reason || '—'}</td>
                  <td className="p-2">{x.status || '—'}</td>
                  <td className="p-2">
                    {x.received_at ? new Date(x.received_at).toLocaleString(locale) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
