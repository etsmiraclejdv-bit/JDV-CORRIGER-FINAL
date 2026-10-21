'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageProvider';
import { useWarehouse } from '@/components/entrepot/WarehouseContext';
import {
  Banner,
  Card,
  PageTitle,
  btnGold,
  inputCls,
  useBanner,
} from '@/components/entrepot/common';
export default function FinDeServicePage() {
  const { current } = useWarehouse();
  const { t } = useLanguage();
  const { banner, ok, fail } = useBanner();
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const load = useCallback(async () => {
    if (!current) return;
    const r = await supabase.rpc('jdvcrm_warehouse_day_report_v1', {
      p_warehouse_id: current.warehouse_id,
    });
    setStatus(r.data);
  }, [current]);
  useEffect(() => {
    load();
  }, [load]);
  async function close() {
    if (!current) return;
    setBusy(true);
    const r = await supabase.rpc('jdvcrm_warehouse_close_day_v1', {
      p_warehouse_id: current.warehouse_id,
      p_notes: notes.trim() || undefined,
    });
    setBusy(false);
    if (r.error) fail(r.error.message);
    else {
      ok(t('we.dayClosed'));
      load();
    }
  }
  return (
    <div className="p-6 space-y-6 text-white">
      <PageTitle title={t('endOfService')} subtitle={t('we.eosSub')} />
      <Banner state={banner} />
      <Card title={t('we.closure')}>
        <p className="text-sm text-slate-400 mb-4">{t('we.closureText')}</p>
        <input
          className={inputCls}
          placeholder={t('we.notesPh')}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button disabled={busy} onClick={close} className={btnGold + ' mt-4'}>
          {busy ? t('we.closing') : t('we.closeDay')}
        </button>
        {status?.closure?.notes && (
          <p className="mt-4 text-sm text-slate-400">{status.closure.notes}</p>
        )}
      </Card>
    </div>
  );
}
