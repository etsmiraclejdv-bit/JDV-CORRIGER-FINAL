import { supabase } from '@/lib/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';
import { personName, saleTotal, toCents, splitName } from '@/lib/services/compat';

export interface Client {
  id: string;
  organization_id: string;
  assigned_to?: string;
  full_name: string;
  phone?: string;
  payment_status: 'a_jour' | 'a_surveiller' | 'en_retard';
  balance_cents: number;
  created_at: string;
  profiles?: { id: string; full_name: string; phone?: string } | null;
}

type Row = Record<string, unknown>;

async function prospecteurMap(
  organizationId: string
): Promise<Map<string, { id: string; full_name: string; phone?: string }>> {
  const { data } = await supabase
    .from('prospecteurs')
    .select('id, first_name, last_name, phone')
    .eq('organization_id', organizationId);
  const map = new Map<string, { id: string; full_name: string; phone?: string }>();
  (data ?? []).forEach((p) =>
    map.set(p.id, { id: p.id, full_name: personName(p), phone: p.phone ?? undefined })
  );
  return map;
}

function mapClient(
  c: Tables<'clients'>,
  pros: Map<string, { id: string; full_name: string; phone?: string }>,
  balance: number,
  late: boolean
): Client {
  const paymentStatus: Client['payment_status'] = late
    ? 'en_retard'
    : balance > 0
      ? 'a_surveiller'
      : 'a_jour';
  return {
    id: c.id,
    organization_id: c.organization_id,
    full_name: personName(c),
    phone: c.phone ?? undefined,
    assigned_to: c.prospecteur_id ?? undefined,
    payment_status: paymentStatus,
    balance_cents: toCents(balance),
    created_at: c.created_at,
    profiles: c.prospecteur_id ? (pros.get(c.prospecteur_id) ?? null) : null,
  };
}

/** Solde restant et retards par client pour toute l'organisation. */
async function balances(
  organizationId: string
): Promise<{ balance: Map<string, number>; late: Set<string> }> {
  const [{ data: sales }, { data: late }] = await Promise.all([
    supabase
      .from('sales')
      .select('id, client_id, amount_remaining, status')
      .eq('organization_id', organizationId)
      .not('status', 'in', '(cancelled,completed)'),
    supabase
      .from('payment_schedules')
      .select('sale_id')
      .eq('organization_id', organizationId)
      .eq('status', 'late'),
  ]);
  const balance = new Map<string, number>();
  const saleClient = new Map<string, string>();
  (sales ?? []).forEach((s) => {
    if (!s.client_id) return;
    saleClient.set(s.id, s.client_id);
    balance.set(s.client_id, (balance.get(s.client_id) ?? 0) + (Number(s.amount_remaining) || 0));
  });
  const lateClients = new Set<string>();
  (late ?? []).forEach((l) => {
    const c = saleClient.get(l.sale_id);
    if (c) lateClients.add(c);
  });
  return { balance, late: lateClients };
}

export async function fetchClients(
  organizationId: string,
  filters?: { paymentStatus?: string; assignedTo?: string }
) {
  let query = supabase
    .from('clients')
    .select('*')
    .eq('organization_id', organizationId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });
  if (filters?.assignedTo) query = query.eq('prospecteur_id', filters.assignedTo);

  const { data, error } = await query;
  if (error) return { data: null, error };

  const [pros, { balance, late }] = await Promise.all([
    prospecteurMap(organizationId),
    balances(organizationId),
  ]);
  let rows = (data ?? []).map((c) => mapClient(c, pros, balance.get(c.id) ?? 0, late.has(c.id)));
  if (filters?.paymentStatus) rows = rows.filter((r) => r.payment_status === filters.paymentStatus);
  return { data: rows, error: null };
}

export async function fetchClientById(clientId: string) {
  const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single();
  if (error || !data) return { data: null, error };
  const c = data;
  const orgId = c.organization_id;
  const [pros, { balance, late }] = await Promise.all([prospecteurMap(orgId), balances(orgId)]);
  return { data: mapClient(c, pros, balance.get(clientId) ?? 0, late.has(clientId)), error: null };
}

export async function createClient(client: Partial<Client> & Record<string, unknown>) {
  if (!client.organization_id) {
    return {
      data: null,
      error: new Error('organization_id is required') as unknown as { message: string },
    };
  }
  const fullName = typeof client.full_name === 'string' ? client.full_name : '';
  const names = splitName(fullName);
  const code =
    typeof client.code === 'string' && client.code.trim()
      ? client.code.trim()
      : `CLI-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const payload: TablesInsert<'clients'> = {
    organization_id: client.organization_id,
    code,
    first_name: typeof client.first_name === 'string' ? client.first_name : names.first_name,
    last_name: typeof client.last_name === 'string' ? client.last_name : names.last_name,
  };
  if (typeof client.phone === 'string' || client.phone === null) payload.phone = client.phone;
  if (typeof client.email === 'string' || client.email === null) payload.email = client.email;
  if (typeof client.address === 'string' || client.address === null)
    payload.address = client.address;
  if (typeof client.city === 'string' || client.city === null) payload.city = client.city;
  if (typeof client.country === 'string' || client.country === null)
    payload.country = client.country;
  if (typeof client.notes === 'string' || client.notes === null) payload.notes = client.notes;
  if (typeof client.whatsapp === 'string' || client.whatsapp === null)
    payload.whatsapp = client.whatsapp;
  if (typeof client.identity_reference === 'string' || client.identity_reference === null)
    payload.identity_reference = client.identity_reference;
  const prospecteurId =
    typeof client.assigned_to === 'string' ? client.assigned_to : client.prospecteur_id;
  if (typeof prospecteurId === 'string' || prospecteurId === null)
    payload.prospecteur_id = prospecteurId;
  if (typeof client.status === 'string') payload.status = client.status;
  if (typeof client.temperature === 'string' || client.temperature === null)
    payload.temperature = client.temperature;
  if (typeof client.portfolio_id === 'string' || client.portfolio_id === null)
    payload.portfolio_id = client.portfolio_id;
  const { data, error } = await supabase.from('clients').insert(payload).select().single();
  return { data, error };
}

export async function updateClient(
  clientId: string,
  updates: Partial<Client> & Record<string, unknown>
) {
  const payload: TablesUpdate<'clients'> = {};
  if (typeof updates.organization_id === 'string') {
    // L'organisation d'un client ne se change pas via ce formulaire.
  }
  if (typeof updates.full_name === 'string') Object.assign(payload, splitName(updates.full_name));
  if (typeof updates.first_name === 'string') payload.first_name = updates.first_name;
  if (typeof updates.last_name === 'string' || updates.last_name === null)
    payload.last_name = updates.last_name;
  if (typeof updates.phone === 'string' || updates.phone === null) payload.phone = updates.phone;
  if (typeof updates.email === 'string' || updates.email === null) payload.email = updates.email;
  if (typeof updates.address === 'string' || updates.address === null)
    payload.address = updates.address;
  if (typeof updates.city === 'string' || updates.city === null) payload.city = updates.city;
  if (typeof updates.country === 'string' || updates.country === null)
    payload.country = updates.country;
  if (typeof updates.notes === 'string' || updates.notes === null) payload.notes = updates.notes;
  if (typeof updates.whatsapp === 'string' || updates.whatsapp === null)
    payload.whatsapp = updates.whatsapp;
  if (typeof updates.identity_reference === 'string' || updates.identity_reference === null)
    payload.identity_reference = updates.identity_reference;
  if (typeof updates.assigned_to === 'string' || updates.assigned_to === null)
    payload.prospecteur_id = updates.assigned_to;
  if (typeof updates.status === 'string') payload.status = updates.status;
  if (typeof updates.temperature === 'string' || updates.temperature === null)
    payload.temperature = updates.temperature;
  if (typeof updates.portfolio_id === 'string' || updates.portfolio_id === null)
    payload.portfolio_id = updates.portfolio_id;
  const { data, error } = await supabase
    .from('clients')
    .update(payload)
    .eq('id', clientId)
    .select()
    .single();
  return { data, error };
}

export async function fetchClientSales(clientId: string) {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('client_id', clientId)
    .order('sale_date', { ascending: false });
  if (error) return { data: null, error };
  return {
    data: ((data ?? []) as Row[]).map((s) => ({
      ...s,
      sold_at: s.sale_date,
      amount_cents: toCents(saleTotal(s as never)),
    })),
    error: null,
  };
}

export async function fetchClientPayments(clientId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('client_id', clientId)
    .order('payment_date', { ascending: false });
  if (error) return { data: null, error };
  return {
    data: ((data ?? []) as Row[]).map((p) => ({
      ...p,
      paid_at: p.payment_date,
      amount_cents: toCents(p.amount),
    })),
    error: null,
  };
}
