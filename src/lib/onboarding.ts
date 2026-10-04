import { supabase } from '@/lib/supabase/client';

export interface OnboardingPayload { [key: string]: unknown; }

const KEY = 'jdv_pending_onboarding';

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
