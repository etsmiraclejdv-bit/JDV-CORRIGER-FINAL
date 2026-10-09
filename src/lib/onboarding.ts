import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/types/database.types';

export type OnboardingPayload =
  Database['public']['Functions']['jdvcrm_submit_company_application_v1']['Args'];

const KEY = 'jdv_pending_company_application';

function isPayload(value: unknown): value is OnboardingPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  const requiredStrings = [
    'p_address',
    'p_city',
    'p_company_name',
    'p_company_nature',
    'p_company_size',
    'p_country',
    'p_legal_form',
    'p_legal_name',
    'p_legal_status',
    'p_phone',
    'p_primary_sector_id',
    'p_registration_number',
    'p_representative_email',
    'p_representative_first_name',
    'p_representative_last_name',
    'p_representative_nationality',
    'p_representative_phone',
    'p_representative_role',
    'p_tax_number',
    'p_website',
  ];
  const requiredNumbers = [
    'p_associate_count',
    'p_manager_count',
    'p_ownership_count',
    'p_people_count',
  ];
  return (
    requiredStrings.every((key) => typeof payload[key] === 'string') &&
    (payload.p_representative_birth_date === null ||
      typeof payload.p_representative_birth_date === 'string') &&
    requiredNumbers.every(
      (key) => typeof payload[key] === 'number' && Number.isFinite(payload[key])
    ) &&
    Array.isArray(payload.p_secondary_sector_ids) &&
    payload.p_secondary_sector_ids.every((id) => typeof id === 'string')
  );
}

async function clearPending() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  try {
    await supabase.auth.updateUser({ data: { pending_company_application: null } });
  } catch {}
}

/** Soumet le dossier d'entreprise sans créer d'organisation active. */
export async function runOnboarding(userId: string, payload: OnboardingPayload) {
  void userId;
  return await supabase.rpc('jdvcrm_submit_company_application_v1', payload);
}

/** Après confirmation de l'email, soumet le dossier conservé localement. */
export async function completePendingOnboarding(userId: string, email: string): Promise<boolean> {
  let parsed: unknown = null;
  try {
    const raw = localStorage.getItem(KEY);
    parsed = raw ? JSON.parse(raw) : null;
  } catch {}
  if (!isPayload(parsed)) return false;
  const payload = parsed;
  const professionalEmail = payload.p_representative_email;
  if (!professionalEmail || professionalEmail.toLowerCase() !== email.toLowerCase()) return false;
  const { data: existing } = await supabase
    .from('organization_applications')
    .select('id')
    .eq('applicant_user_id', userId)
    .eq('professional_email', email.toLowerCase())
    .limit(1);
  if (existing && existing.length > 0) {
    await clearPending();
    return true;
  }
  const { error } = await runOnboarding(userId, payload);
  if (error) return false;
  await clearPending();
  return true;
}
