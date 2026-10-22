'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
export default function SuiviProspecteursPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    supabase
      .from('prospecteurs')
      .select('*')
      .limit(500)
      .then((r) => setData(r.data ?? []));
  }, []);
  return (
    <div className="p-6 text-white space-y-6">
      <h1 className="text-2xl font-bold">{t('bz.spTitle')}</h1>
      <div className="rounded-2xl border border-white/10 bg-[#08152f] p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="p-2">{t('bz.spName')}</th>
              <th className="p-2">{t('bz.spPhone')}</th>
              <th className="p-2">{t('bz.spStatus')}</th>
              <th className="p-2">{t('bz.spZone')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((x) => (
              <tr key={x.id} className="border-t border-white/5">
                <td className="p-2">{x.full_name ?? x.name ?? '—'}</td>
                <td className="p-2">{x.phone ?? '—'}</td>
                <td className="p-2">{x.status ?? '—'}</td>
                <td className="p-2">{x.work_zone ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
