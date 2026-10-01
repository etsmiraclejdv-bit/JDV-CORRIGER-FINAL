import { supabase } from '@/lib/supabase/client';
import { newArticleCode, toCents } from '@/lib/services/compat';

/** Un « produit » de l'interface correspond à un article + sa ligne de stock. */
export interface Product {
  id: string;
  organization_id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  price_cents: number;
  created_at: string;
  active?: boolean;
  minimum_quantity?: number;
}

type Row = Record<string, unknown>;

function mapProduct(a: Row, stock?: Row): Row {
  return {
    ...a,
    sku: a.code,
    price_cents: toCents(a.cash_price ?? a.fixed_price),
    stock_quantity: Number(stock?.quantity ?? 0),
    minimum_quantity: Number(stock?.minimum_quantity ?? 0),
  };
}

export async function fetchProducts(organizationId: string, filters?: { search?: string }) {
  let query = supabase
    .from('articles')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true });

  if (filters?.search) {
    const s = filters.search.replace(/[%,()]/g, ' ');
    query = query.or(`name.ilike.%${s}%,code.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) return { data: null, error };

  const { data: stocks } = await supabase
    .from('stocks')
    .select('article_id, quantity, minimum_quantity')
    .eq('organization_id', organizationId);
  const byArticle = new Map<string, Row>();
  ((stocks ?? []) as Row[]).forEach((s) => byArticle.set(s.article_id as string, s));

  return { data: ((data ?? []) as Row[]).map((a) => mapProduct(a, byArticle.get(a.id as string))), error: null };
}

export async function fetchProductById(productId: string) {
  const { data, error } = await supabase.from('articles').select('*').eq('id', productId).single();
  if (error || !data) return { data: null, error };
  const { data: stock } = await supabase
    .from('stocks')
    .select('quantity, minimum_quantity')
    .eq('article_id', productId)
    .maybeSingle();
  return { data: mapProduct(data as Row, (stock ?? undefined) as Row | undefined), error: null };
}

async function setStock(organizationId: string, articleId: string, quantity: number) {
  const { data: existing } = await supabase
    .from('stocks')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('article_id', articleId)
    .maybeSingle();
  if (existing) {
    return supabase.from('stocks').update({ quantity, updated_at: new Date().toISOString() }).eq('id', (existing as Row).id as string);
  }
  return supabase.from('stocks').insert({ organization_id: organizationId, article_id: articleId, quantity });
}

export async function createProduct(product: Partial<Product>) {
  if (!product.organization_id) {
    return { data: null, error: new Error('organization_id is required') as unknown as { message: string } };
  }
  const price = Math.round((product.price_cents ?? 0) / 100);
  const { data, error } = await supabase
    .from('articles')
    .insert({
      organization_id: product.organization_id,
      code: (product.sku ?? '').trim() || newArticleCode(),
      name: product.name,
      fixed_price: price,
      cash_price: price,
      credit_price: price,
      active: true,
    })
    .select()
    .single();
  if (error || !data) return { data: null, error };

  const qty = Number(product.stock_quantity ?? 0);
  const { error: stockError } = await setStock(product.organization_id, (data as Row).id as string, qty);
  if (stockError) return { data: mapProduct(data as Row), error: stockError };
  return { data: mapProduct(data as Row, { quantity: qty }), error: null };
}

export async function updateProduct(productId: string, updates: Partial<Product>) {
  const patch: Row = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) patch.name = updates.name;
  if (updates.sku !== undefined && updates.sku.trim()) patch.code = updates.sku.trim();
  if (updates.active !== undefined) patch.active = updates.active;
  if (updates.price_cents !== undefined) {
    const price = Math.round(updates.price_cents / 100);
    patch.fixed_price = price;
    patch.cash_price = price;
    patch.credit_price = price;
  }
  const { data, error } = await supabase.from('articles').update(patch).eq('id', productId).select().single();
  if (error || !data) return { data: null, error };

  if (updates.stock_quantity !== undefined) {
    const { error: stockError } = await setStock((data as Row).organization_id as string, productId, Number(updates.stock_quantity) || 0);
    if (stockError) return { data: mapProduct(data as Row), error: stockError };
  }
  return { data: mapProduct(data as Row, updates.stock_quantity !== undefined ? { quantity: updates.stock_quantity } : undefined), error: null };
}
