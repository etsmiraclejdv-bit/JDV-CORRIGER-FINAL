import { supabase } from '@/lib/supabase/client';
import type { Json, TablesUpdate } from '@/types/database.types';
import { personName, splitName } from '@/lib/services/compat';

export interface OrganizationSettings {
  notifications?: {
    email_on_late_payment?: boolean;
    sms_on_sale?: boolean;
  };
  sales?: {
    default_payment_frequency?: string;
    require_deposit?: boolean;
  };
  stock?: {
    low_stock_alert_threshold_percent?: number;
  };
}

type Row = Record<string, unknown>;

function isJson(value: unknown): value is Json {
  if (value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.every(isJson);
  if (typeof value === 'object') return Object.values(value as Record<string, unknown>).every(isJson);
  return false;
}

function jsonObject(value: unknown): Record<string, Json | undefined> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, Json | undefined> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (entry === undefined) continue;
    if (!isJson(entry)) throw new Error('Réglage non sérialisable : ' + key);
    result[key] = entry;
  }
  return result;
}

export async function fetchOrganization(organizationId: string) {
  const { data, error } = await supabase.from('organizations').select('*').eq('id', organizationId).single();
  if (error || !data) return { data: null, error };
  // « org_status » est l'ancien nom de la colonne « status ».
  return { data: { ...(data as Row), org_status: (data as Row).status }, error: null };
}

/** Réglages libres stockés en JSON dans organization_settings.settings. */
export async function fetchOrganizationSettings(organizationId: string) {
  const { data, error } = await supabase
    .from('organization_settings')
    .select('settings')
    .eq('organization_id', organizationId)
    .maybeSingle();
  return { data: ((data as Row | null)?.settings ?? {}) as OrganizationSettings & Row, error };
}

export async function saveOrganizationSettings(organizationId: string, settings: Row) {
  const normalizedSettings = jsonObject(settings);
  const { data: existing } = await supabase
    .from('organization_settings')
    .select('id, settings')
    .eq('organization_id', organizationId)
    .maybeSingle();
  if (existing) {
    const merged: Json = { ...jsonObject(existing.settings), ...normalizedSettings };
    const { error } = await supabase
      .from('organization_settings')
      .update({ settings: merged })
      .eq('id', (existing as Row).id as string);
    return { error };
  }
  const { error } = await supabase.from('organization_settings').insert({ organization_id: organizationId, settings: normalizedSettings });
  return { error };
}

export async function updateOrganization(organizationId: string, updates: Record<string, unknown>) {
  // Le statut et l'abonnement ne se modifient que par le concepteur.
  const { status, subscription_status, org_status, owner_user_id, ...safe } = updates;
  void status; void subscription_status; void org_status; void owner_user_id;
  const { data, error } = await supabase
    .from('organizations')
    .update({ ...safe, updated_at: new Date().toISOString() })
    .eq('id', organizationId)
    .select()
    .single();
  return { data, error };
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) return { data: null, error };
  return {
    data: {
      ...(data as Row),
      full_name: String((data as Row).display_name || personName(data as never)),
      phone: typeof (data as Row).phone === 'string' ? (data as Row).phone : '',
    },
    error: null,
  };
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  // Seules les colonnes réellement présentes dans `profiles` sont envoyées.
  const { full_name, phone, preferred_language, avatar_url, country } = updates as Row;
  const payload: TablesUpdate<'profiles'> = { updated_at: new Date().toISOString() };
  if (typeof phone === 'string' || phone === null) payload.phone = phone || null;
  if (typeof preferred_language === 'string') payload.preferred_language = preferred_language;
  if (typeof avatar_url === 'string' || avatar_url === null) payload.avatar_url = avatar_url;
  if (typeof country === 'string' || country === null) payload.country = country;
  if (typeof full_name === 'string') {
    Object.assign(payload, splitName(full_name), { display_name: full_name.trim() });
  }
  const { data, error } = await supabase.from('profiles').update(payload).eq('id', userId).select().single();
  return { data, error };
}
