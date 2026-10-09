'use client';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useWarehouse } from '@/components/entrepot/WarehouseContext';
import { Card, PageTitle } from '@/components/entrepot/common';

type Row = {
  id: string;
  ticket_number: string;
  subject: string;
  priority: string;
  status: string;
  created_at: string;
};

export default function AppelsPage() {
  const { current } = useWarehouse();
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!current) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await supabase
      .from('warehouse_tickets')
      .select('id, ticket_number, subject, priority, status, created_at')
      .eq('warehouse_id', current.warehouse_id)
      .order('created_at', { ascending: false });
    setData(
      (result.data ?? []).map((ticket) => ({
        ...ticket,
        ticket_number: ticket.ticket_number ?? ticket.id,
      }))
    );
    setLoading(false);
  }, [current]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <div className="p-6 space-y-6 text-white">
      <PageTitle
        title="Appels & plaintes"
        subtitle="Suivi des demandes clients et appels à traiter."
      />
      <Card>
        {loading ? (
          <p className="text-slate-400">Chargement…</p>
        ) : (
          <div className="space-y-2">
            {data.map((ticket) => (
              <div key={ticket.id} className="rounded-lg bg-[#0F2347] p-3 flex justify-between">
                <div>
                  <b>{ticket.ticket_number}</b> · {ticket.subject}
                </div>
                <span className="text-slate-400">{ticket.status}</span>
              </div>
            ))}
            {!data.length && <p className="text-slate-500">Aucun appel.</p>}
          </div>
        )}
      </Card>
    </div>
  );
}
