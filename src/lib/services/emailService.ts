import { supabase } from '@/lib/supabase/client';

export async function sendCompanyRegistrationEmail(params: {
  to: string;
  organizationName: string;
  adminName?: string;
}) {
  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      type: 'company_registration',
      to: params.to,
      organizationName: params.organizationName,
      adminName: params.adminName ?? params.organizationName,
    },
  });
  if (error) console.error('[Email] company_registration failed:', error.message);
}

export async function sendProspecteurCreationEmail(params: {
  to: string;
  prospecteurName: string;
  prospecteurEmail: string;
  prospecteurPassword: string;
  organizationName: string;
}) {
  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      type: 'prospecteur_creation',
      to: params.to,
      prospecteurName: params.prospecteurName,
      prospecteurEmail: params.prospecteurEmail,
      prospecteurPassword: params.prospecteurPassword,
      organizationName: params.organizationName,
    },
  });
  if (error) console.error('[Email] prospecteur_creation failed:', error.message);
}
