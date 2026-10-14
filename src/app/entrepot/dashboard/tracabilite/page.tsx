'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useWarehouse } from '@/components/entrepot/WarehouseContext';
import {
  Banner,
  Card,
  PageTitle,
  btnGold,
  dateFr,
  inputCls,
  num,
  useBanner,
} from '@/components/entrepot/common';
import { friendlyRpcError, unitCodeEventLabel, unitCodeStatusLabel } from '@/lib/unitCodes/helpers';
import { traceUnitCode, type TraceUnit } from '@/lib/services/unitCodesService';
type Row = {
  movement_id: string;
  occurred_at: string;
  article_name: string;
  movement_label: string;
  quantity: number;
  from_section: string | null;
  to_section: string | null;
  notes: string | null;
};
export default function TracabilitePage() {
  const { current } = useWarehouse();
  const [data, setData] = useState<Row[]>([]);
  const { banner, fail } = useBanner();
  const [search, setSearch] = useState('');
  const [units, setUnits] = useState<TraceUnit[] | null>(null);

  async function searchCode() {
    const code = search.trim().toUpperCase();
    if (!code) return;
    const { data: res, error } = await traceUnitCode(code);
    if (error) {
      setUnits(null);
      return fail(friendlyRpcError(error.message));
    }
    setUnits(res?.units ?? []);
  }
  const load = useCallback(async () => {
    if (!current) return;
    const r = await supabase
      .from('jdvcrm_stock_journal_v1')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(300);
    setData((r.data ?? []) as unknown as Row[]);
  }, [current]);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <div className="p-6 space-y-6 text-white">
      <PageTitle title="Traçabilité" subtitle="Journal détaillé des mouvements de stock." />
      <Banner state={banner} />
      <Card title="Retrouver un code produit">
        <div className="flex gap-2">
          <input
            className={inputCls}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void searchCode();
            }}
            placeholder="Code unique du produit"
          />
          <button className={btnGold} onClick={() => void searchCode()}>
            Chercher
          </button>
        </div>
        {units && units.length === 0 && (
          <p className="mt-3 text-sm text-slate-400">Aucun code trouvé.</p>
        )}
        {units?.map((u) => (
          <div key={u.unit_code_id} className="mt-4 rounded-xl border border-white/10 p-3 text-sm">
            <p className="font-mono font-semibold">{u.code}</p>
            <p className="text-slate-300">
              {u.article_code} · {u.article_name} — {unitCodeStatusLabel(u.status)}
            </p>
            <p className="text-slate-400">
              Agence : {u.warehouse_name ?? '—'} · Prospecteur : {u.prospecteur_name ?? '—'}
            </p>
            <ul className="mt-2 space-y-1">
              {u.events.map((ev, i) => (
                <li key={i}>
                  {dateFr(ev.created_at)} — {unitCodeEventLabel(ev.event_type)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Card>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-white/10">
                <th className="p-2">Date</th>
                <th className="p-2">Produit</th>
                <th className="p-2">Opération</th>
                <th className="p-2">Qté</th>
                <th className="p-2">De / Vers</th>
              </tr>
            </thead>
            <tbody>
              {data.map((x) => (
                <tr key={x.movement_id} className="border-b border-white/5">
                  <td className="p-2">{dateFr(x.occurred_at)}</td>
                  <td className="p-2">{x.article_name}</td>
                  <td className="p-2">{x.movement_label}</td>
                  <td className="p-2">{num(x.quantity)}</td>
                  <td className="p-2">
                    {x.from_section ?? '—'} → {x.to_section ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
