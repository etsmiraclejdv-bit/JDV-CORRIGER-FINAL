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

function isPayload(v: unknown): v is OnboardingPayload {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return typeof o.companyName === 'string' && typeof o.email === 'string';
}

async function clearPending() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  try { await supabase.auth.updateUser({ data: { pending_onboarding: null } }); } catch { /* ignore */ }
}

/** À appeler juste après une connexion réussie. Renvoie true si une entreprise vient d'être créée. */
export async function completePendingOnboarding(userId: string, email: string): Promise<boolean> {
  let p: unknown = null;
  try {
    const raw = localStorage.getItem(KEY);
    p = raw ? JSON.parse(raw) : null;
  } catch {
    p = null;
  }
  if (!isPayload(p)) {
    // Repli : les informations saisies à l'inscription sont aussi stockées dans le compte lui-même.
    // Cela permet de terminer la création depuis un autre navigateur, un autre appareil ou une autre adresse du site.
    const { data } = await supabase.auth.getUser();
    const meta: unknown = data.user?.user_metadata?.pending_onboarding;
    p = isPayload(meta) ? meta : null;
  }
  if (!isPayload(p)) return false;
  const payload: OnboardingPayload = p;
  if (payload.email.toLowerCase() !== email.toLowerCase()) return false;

  const { data: existing } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', userId)
    .limit(1);
  if (existing && existing.length > 0) {
    await clearPending();
    return false;
  }
  const { error } = await runOnboarding(userId, payload);
  if (error) return false;
  await clearPending();
  return true;
}
