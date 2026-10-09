import { supabase } from '@/lib/supabase/client';
import type { Tables, TablesInsert } from '@/types/database.types';
import { trackSaleRecorded } from '@/lib/analytics';
import { newSaleNumber, personName, saleTotal, toCents } from '@/lib/services/compat';

export interface Sale {
  id: string;
  organization_id: string;
  client_id?: string;
  prospecteur_id?: string;
  article_id?: string;
  product_id?: string;
  amount_cents: number;
  status: string;
  sold_at: string;
}

export interface Payment {
  id: string;
  organization_id: string;
  client_id?: string;
  amount_cents: number;
  status: string;
  paid_at: string;
}

type Row = Record<string, unknown>;

async function nameMaps(organizationId: string) {
  const [{ data: clients }, { data: pros }, { data: articles }] = await Promise.all([
    supabase.from('clients').select('id, first_name, last_name, phone').eq('organization_id', organizationId),
    supabase.from('prospecteurs').select('id, first_name, last_name').eq('organization_id', organizationId),
    supabase.from('articles').select('id, name, code').eq('organization_id', organizationId),
  ]);
  const c = new Map<string, Row>();
  ((clients ?? []) as Row[]).forEach((x) =>
    c.set(x.id as string, { id: x.id, full_name: personName(x as never), phone: x.phone })
  );
  const p = new Map<string, Row>();
  ((pros ?? []) as Row[]).forEach((x) => p.set(x.id as string, { id: x.id, full_name: personName(x as never) }));
  const a = new Map<string, Row>();
  ((articles ?? []) as Row[]).forEach((x) => a.set(x.id as string, { id: x.id, name: x.name, sku: x.code }));
  return { c, p, a };
}

type SaleView = Sale & { clients: Row | null; profiles: Row | null; products: Row | null };

function mapSale(s: Tables<'sales'>, m: Awaited<ReturnType<typeof nameMaps>>): SaleView {
  return {
    ...s,
    id: s.id,
    organization_id: s.organization_id,
    status: s.status,
    sold_at: s.sale_date,
    product_id: typeof s.article_id === 'string' ? s.article_id : undefined,
    amount_cents: toCents(saleTotal(s as never)),
    clients: typeof s.client_id === 'string' ? m.c.get(s.client_id) ?? null : null,
    profiles: typeof s.prospecteur_id === 'string' ? m.p.get(s.prospecteur_id) ?? null : null,
    products: typeof s.article_id === 'string' ? m.a.get(s.article_id) ?? null : null,
  };
}

export async function fetchSales(
  organizationId: string,
  filters?: { status?: string; prospecteurId?: string; dateFrom?: string; dateTo?: string }
) {
  let query = supabase
    .from('sales')
    .select('*')
    .eq('organization_id', organizationId)
    .order('sale_date', { ascending: false });
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.prospecteurId) query = query.eq('prospecteur_id', filters.prospecteurId);
  if (filters?.dateFrom) query = query.gte('sale_date', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('sale_date', filters.dateTo);

  const { data, error } = await query;
  if (error) return { data: null, error };
  const m = await nameMaps(organizationId);
  return { data: (data ?? []).map((s) => mapSale(s, m)), error: null };
}

export async function fetchSaleById(saleId: string) {
  const { data, error } = await supabase.from('sales').select('*').eq('id', saleId).single();
  if (error || !data) return { data: null, error };
  const m = await nameMaps(data.organization_id);
  return { data: mapSale(data, m), error: null };
}

/**
 * Création d'une vente. Le montant se règle par article : cash_price / credit_price.
 * Les champs hérités (amount_cents, sold_at, product_id) sont traduits vers le schéma réel.
 */
export async function createSale(sale: Partial<Sale> & Record<string, unknown>) {
  if (!sale.organization_id) {
    return { data: null, error: new Error('organization_id is required') as unknown as { message: string } };
  }
  const amountCents = typeof sale.amount_cents === 'number' ? sale.amount_cents : undefined;
  const payload: TablesInsert<'sales'> = {
    organization_id: sale.organization_id,
    sale_number: newSaleNumber(),
    sale_type: typeof sale.sale_type === 'string' ? sale.sale_type : 'cash',
    quantity: typeof sale.quantity === 'number' && sale.quantity > 0 ? sale.quantity : 1,
  };
  const stringFields = ['client_id', 'prospecteur_id', 'article_id', 'client_phone', 'client_location', 'payment_frequency', 'deadline_date', 'notes', 'status'] as const;
  for (const key of stringFields) {
    const value = sale[key];
    if (typeof value === 'string' || value === null) {
      if (key === 'client_id') payload.client_id = value;
      else if (key === 'prospecteur_id') payload.prospecteur_id = value;
      else if (key === 'article_id') payload.article_id = value;
      else if (key === 'client_phone') payload.client_phone = value;
      else if (key === 'client_location') payload.client_location = value;
      else if (key === 'payment_frequency') payload.payment_frequency = value;
      else if (key === 'deadline_date') payload.deadline_date = value;
      else if (key === 'notes') payload.notes = value;
      else if (key === 'status') payload.status = value;
    }
  }
  const articleId = typeof sale.product_id === 'string' ? sale.product_id : undefined;
  if (articleId && !payload.article_id) payload.article_id = articleId;
  if (typeof sale.sold_at === 'string') payload.sale_date = sale.sold_at;
  for (const key of ['cash_price', 'credit_price', 'fixed_price', 'payment_amount'] as const) {
    if (typeof sale[key] === 'number') payload[key] = sale[key] as number;
  }
  if (amountCents !== undefined && !payload.cash_price && !payload.credit_price && !payload.fixed_price) {
    const unit = Math.round(amountCents / 100 / payload.quantity);
    payload.fixed_price = unit;
    payload.cash_price = unit;
    payload.credit_price = unit;
  }

  const { data, error } = await supabase.from('sales').insert(payload).select().single();
  if (!error && data) {
    trackSaleRecorded({
      organizationId: sale.organization_id,
      amountCents: amountCents ?? toCents(saleTotal(data)),
      portal: 'business',
    });
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (accessToken) {
        await fetch('/api/commissions/payout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ saleId: data.id }),
        });
      }
    } catch (payoutError) {
      console.error('[commission-payout]', payoutError);
    }
  }
  return { data, error };
}

function mapPayment(p: Tables<'payments'>, clients?: Map<string, Row>): Row {
  return {
    ...p,
    paid_at: p.payment_date,
    amount_cents: toCents(p.amount),
    clients: clients && p.client_id ? clients.get(p.client_id as string) ?? null : undefined,
  };
}

export async function fetchPaymentsBySale(saleId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('sale_id', saleId)
    .order('payment_date', { ascending: false });
  if (error) return { data: null, error };
  return { data: (data ?? []).map((p) => mapPayment(p)), error: null };
}

export async function createPayment(payment: Partial<Payment> & Record<string, unknown>) {
  if (!payment.organization_id) {
    return { data: null, error: new Error('organization_id is required') as unknown as { message: string } };
  }
  const amount = typeof payment.amount === 'number'
    ? payment.amount
    : typeof payment.amount_cents === 'number'
      ? Math.round(payment.amount_cents / 100)
      : null;
  if (amount === null || !Number.isFinite(amount) || amount < 0) {
    return { data: null, error: new Error('amount is required and must be non-negative') as unknown as { message: string } };
  }
  const payload: TablesInsert<'payments'> = { organization_id: payment.organization_id, amount };
  if (typeof payment.client_id === 'string' || payment.client_id === null) payload.client_id = payment.client_id;
  if (typeof payment.sale_id === 'string' || payment.sale_id === null) payload.sale_id = payment.sale_id;
  if (typeof payment.prospecteur_id === 'string' || payment.prospecteur_id === null) payload.prospecteur_id = payment.prospecteur_id;
  if (typeof payment.status === 'string') payload.status = payment.status;
  if (typeof payment.payment_method === 'string' || payment.payment_method === null) payload.payment_method = payment.payment_method;
  if (typeof payment.currency === 'string') payload.currency = payment.currency;
  if (typeof payment.notes === 'string' || payment.notes === null) payload.notes = payment.notes;
  if (typeof payment.paid_at === 'string') payload.payment_date = payment.paid_at;
  const { data, error } = await supabase.from('payments').insert(payload).select().single();
  return { data, error };
}

export async function fetchPaymentsByOrg(organizationId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('organization_id', organizationId)
    .order('payment_date', { ascending: false });
  if (error) return { data: null, error };
  const m = await nameMaps(organizationId);
  return { data: (data ?? []).map((p) => mapPayment(p, m.c)), error: null };
}
