'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useWarehouse } from '@/components/entrepot/WarehouseContext';
import { Card, PageTitle, num } from '@/components/entrepot/common';

type Row = {
  movement_id: string; article_code: string; article_name: string; occurred_at: string;
  movement_label: string; entry_quantity: number; exit_quantity: number;
  stock_before: number; stock_after: number; unit_price: number;
  movement_amount: number; stock_value_after: number; notes: string | null;
};

export default function JournalStockPage() {
  const { current } = useWarehouse();
  const [data, setData] = useState<Row[]>([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!current) return;
    setLoading(true);
    setError('');
    let query = supabase.from('jdvcrm_warehouse_stock_ledger_v1')
      .select('movement_id,article_code,article_name,occurred_at,movement_label,entry_quantity,exit_quantity,stock_before,stock_after,unit_price,movement_amount,stock_value_after,notes')
      .eq('warehouse_id', current.warehouse_id)
      .order('occurred_at', { ascending: false }).limit(1000);
    if (date) {
      const start = new Date(date + 'T00:00:00');
      const end = new Date(date + 'T23:59:59.999');
      query = query.gte('occurred_at', start.toISOString()).lte('occurred_at', end.toISOString());
    }
    const result = await query;
    if (result.error) setError(result.error.message);
    else setData((result.data ?? []) as Row[]);
    setLoading(false);
  }, [current, date]);

  useEffect(() => { void load(); }, [load]);

  const totals = useMemo(() => ({
    entries: data.reduce((s, r) => s + Number(r.entry_quantity || 0), 0),
    exits: data.reduce((s, r) => s + Number(r.exit_quantity || 0), 0),
    value: data.reduce((s, r) => s + Number(r.movement_amount || 0), 0),
  }), [data]);

  return (
    <div className="p-6 space-y-6 text-white">
      <PageTitle title="Journal détaillé du stock" subtitle="Stock avant, mouvement, stock après et valorisation pour chaque opération.">
        <div className="flex gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-white/10 bg-[#08152f] px-3 py-2 text-sm" />
          <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm"><RefreshCw size={14} /> Actualiser</button>
        </div>
      </PageTitle>

      {error && <p className="text-red-400">{error}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-xs uppercase text-slate-500">Entrées</p><p className="mt-1 text-2xl font-bold text-emerald-400">{num(totals.entries)}</p></Card>
        <Card><p className="text-xs uppercase text-slate-500">Sorties</p><p className="mt-1 text-2xl font-bold text-red-400">{num(totals.exits)}</p></Card>
        <Card><p className="text-xs uppercase text-slate-500">Valeur mouvements</p><p className="mt-1 text-2xl font-bold">{num(totals.value)} FCFA</p></Card>
      </div>

      <Card>
        {loading ? <p className="text-slate-400">Chargement…</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead><tr className="border-b border-white/10 text-left text-slate-400">
                <th className="p-2">Date / heure</th><th className="p-2">Code</th><th className="p-2">Article</th>
                <th className="p-2 text-right">Stock initial</th><th className="p-2 text-right">Entrée</th><th className="p-2 text-right">Sortie</th>
                <th className="p-2 text-right">Stock final</th><th className="p-2 text-right">Prix unitaire</th><th className="p-2 text-right">Montant</th><th className="p-2 text-right">Valeur stock</th>
              </tr></thead>
              <tbody>
                {data.map((r) => <tr key={r.movement_id} className="border-b border-white/5">
                  <td className="p-2 whitespace-nowrap">{new Date(r.occurred_at).toLocaleString('fr-FR')}</td>
                  <td className="p-2 font-mono text-[#D4AF37]">{r.article_code}</td>
                  <td className="p-2">{r.article_name}</td>
                  <td className="p-2 text-right">{num(r.stock_before)}</td>
                  <td className="p-2 text-right text-emerald-400">{r.entry_quantity ? '+' + num(r.entry_quantity) : '—'}</td>
                  <td className="p-2 text-right text-red-400">{r.exit_quantity ? '-' + num(r.exit_quantity) : '—'}</td>
                  <td className="p-2 text-right font-semibold">{num(r.stock_after)}</td>
                  <td className="p-2 text-right">{num(r.unit_price)} FCFA</td>
                  <td className="p-2 text-right">{num(r.movement_amount)} FCFA</td>
                  <td className="p-2 text-right">{num(r.stock_value_after)} FCFA</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
