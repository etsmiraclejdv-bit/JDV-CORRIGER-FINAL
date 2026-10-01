import { supabase } from '@/lib/supabase/client';

export interface OnboardingPayload {
  companyName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  industry: string;
  contactName: string;
}

const KEY = 'jdv_pending_onboarding';

function split(full: string) {
  const parts = full.trim().split(/\s+/);
  const first = parts.shift() ?? '';
  return { first, last: parts.join(' ') };
}

/** Crée l'entreprise, le rattachement admin et l'abonnement d'essai (fonction SQL sécurisée). */
export async function runOnboarding(userId: string, p: OnboardingPayload) {
  const { first, last } = split(p.contactName || p.companyName);
  const { data, error } = await supabase.rpc('create_company_onboarding', {
    p_user_id: userId,
    p_company_name: p.companyName,
    p_legal_name: p.companyName,
    p_email: p.email,
    p_phone: p.phone,
    p_country: p.country,
    p_city: p.city,
    p_address: '',
    p_website: '',
    p_industry: p.industry,
    p_team_size: '',
    p_plan_code: 'TRIAL',
    p_first_name: first,
    p_last_name: last,
  });
  return { data, error };
}

/** Si l'email n'est pas encore confirmé, on garde les infos et on termine à la première connexion. */
export function savePendingOnboarding(p: OnboardingPayload) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* stockage indisponible : l'inscription devra être refaite */
  }
}

/** À appeler juste après une connexion réussie. Renvoie true si une entreprise vient d'être créée. */
export async function completePendingOnboarding(userId: string, email: string): Promise<boolean> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return false;
  }
  if (!raw) return false;
  let p: OnboardingPayload;
  try {
    p = JSON.parse(raw) as OnboardingPayload;
  } catch {
    return false;
  }
  if (p.email.toLowerCase() !== email.toLowerCase()) return false;

  const { data: existing } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', userId)
    .limit(1);
  if (existing && existing.length > 0) {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    return false;
  }
  const { error } = await runOnboarding(userId, p);
  if (error) return false;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  return true;
}
