import { supabase } from '@/lib/supabase/client';

/**
 * Codes uniques par produit (mode sans lecteur de codes-barres).
 * Toute écriture passe par les fonctions de la base ; les tables sont en lecture seule.
 */

export type UnitCodeRow = {
  id: string;
  code: string;
  status: string;
  article_id: string;
  warehouse_id: string | null;
  prospecteur_id: string | null;
  shipment_id: string | null;
  generated: boolean;
  registered_at: string;
};

export type TraceUnit = {
  unit_code_id: string;
  code: string;
  status: string;
  generated: boolean;
  article_code: string;
  article_name: string;
  warehouse_name: string | null;
  prospecteur_name: string | null;
  shipment_id: string | null;
  registered_at: string;
  events: Array<{
    event_type: string;
    entry_mode: string;
    actor_role: string;
    created_at: string;
    shipment_id: string | null;
  }>;
};

type RpcResult<T> = { data: T | null; error: { message: string } | null };

// Les fonctions de ce module ne figurent pas encore dans les types générés.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client = supabase as any;

export async function registerUnitCodes(params: {
  warehouseId: string;
  articleId: string;
  codes?: string[];
  quantity?: number;
}): Promise<RpcResult<{ count: number; generated: boolean; codes: string[] }>> {
  return client.rpc('jdvcrm_register_unit_codes_v1', {
    p_warehouse_id: params.warehouseId,
    p_article_id: params.articleId,
    p_codes: params.codes && params.codes.length > 0 ? params.codes : null,
    p_quantity: params.quantity ?? null,
  });
}

export async function dispatchUnitCodes(params: {
  warehouseId: string;
  prospecteurId: string;
  codes: string[];
  notes?: string;
  idempotencyKey: string;
}): Promise<RpcResult<{ shipment_number: string; shipment_id: string; unit_count: number }>> {
  return client.rpc('jdvcrm_dispatch_unit_codes_v1', {
    p_warehouse_id: params.warehouseId,
    p_prospecteur_id: params.prospecteurId,
    p_codes: params.codes,
    p_notes: params.notes?.trim() || null,
    p_idempotency_key: params.idempotencyKey,
  });
}

export async function confirmUnitCodeReceipt(params: {
  shipmentId: string;
  codes: string[];
  damagedCodes: string[];
  notes?: string;
}): Promise<
  RpcResult<{
    status: string;
    shipment_number: string;
    units_expected: number;
    units_received: number;
    units_damaged: number;
    units_missing: number;
  }>
> {
  return client.rpc('jdvcrm_confirm_unit_code_receipt_v1', {
    p_shipment_id: params.shipmentId,
    p_codes: params.codes,
    p_damaged_codes: params.damagedCodes,
    p_notes: params.notes?.trim() || null,
  });
}

/** Nombre de codes attendus par bon (sans révéler les codes eux-mêmes). */
export async function getShipmentUnitCounts(
  shipmentIds: string[]
): Promise<Record<string, number>> {
  if (shipmentIds.length === 0) return {};
  const { data, error } = await client.rpc('jdvcrm_shipment_unit_counts_v1', {
    p_shipment_ids: shipmentIds,
  });
  if (error || !Array.isArray(data)) return {};
  return Object.fromEntries(
    (data as Array<{ shipment_id: string; unit_count: number }>).map((r) => [
      r.shipment_id,
      Number(r.unit_count),
    ])
  );
}

export async function traceUnitCode(code: string): Promise<RpcResult<{ units: TraceUnit[] }>> {
  return client.rpc('jdvcrm_trace_unit_code_v1', { p_code: code });
}

export async function listWarehouseUnitCodes(
  warehouseId: string,
  status?: string
): Promise<RpcResult<UnitCodeRow[]>> {
  let query = client
    .from('unit_codes')
    .select(
      'id,code,status,article_id,warehouse_id,prospecteur_id,shipment_id,generated,registered_at'
    )
    .eq('warehouse_id', warehouseId)
    .order('registered_at', { ascending: false })
    .limit(300);
  if (status) query = query.eq('status', status);
  return query;
}
