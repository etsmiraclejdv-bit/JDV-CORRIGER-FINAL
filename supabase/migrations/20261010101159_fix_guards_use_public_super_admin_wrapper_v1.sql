-- Correctif : le rôle « authenticated » n'a pas accès au schéma « private ». Les verrous des dossiers et documents
-- passent donc par une fonction publique (SECURITY DEFINER) qui interroge « private » à leur place.

create or replace function public.jdvcrm_is_super_admin_v1()
returns boolean language sql stable security definer set search_path = public, private as $$
  select coalesce(private.is_super_admin(), false)
$$;
revoke all on function public.jdvcrm_is_super_admin_v1() from public, anon;
grant execute on function public.jdvcrm_is_super_admin_v1() to authenticated, service_role;

create or replace function public.jdvcrm_guard_application_write_v1()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated','anon') and not public.jdvcrm_is_super_admin_v1() then
    if tg_op = 'INSERT' then
      if NEW.status not in ('draft','submitted') then
        raise exception 'PROTECTED_STATUS' using errcode = '42501';
      end if;
      NEW.ai_identity_status := 'pending';
      NEW.ai_identity_reasons := '[]'::jsonb;
      NEW.ai_identity_attempts := 0;
      NEW.ai_identity_checked_at := null;
      NEW.reviewed_by := null; NEW.reviewed_at := null; NEW.approved_at := null;
      NEW.email_verified_at := null; NEW.activated_at := null;
    else
      if NEW.applicant_user_id is distinct from OLD.applicant_user_id
         or NEW.reviewed_by is distinct from OLD.reviewed_by
         or NEW.reviewed_at is distinct from OLD.reviewed_at
         or NEW.approved_at is distinct from OLD.approved_at
         or NEW.email_verified_at is distinct from OLD.email_verified_at
         or NEW.activated_at is distinct from OLD.activated_at
         or NEW.ai_identity_status is distinct from OLD.ai_identity_status
         or NEW.ai_identity_reasons is distinct from OLD.ai_identity_reasons
         or NEW.ai_identity_attempts is distinct from OLD.ai_identity_attempts
         or NEW.ai_identity_checked_at is distinct from OLD.ai_identity_checked_at then
        raise exception 'PROTECTED_COLUMNS' using errcode = '42501';
      end if;
      if NEW.status is distinct from OLD.status and NEW.status in ('approved_pending_email','email_verified','activated') then
        raise exception 'PROTECTED_STATUS' using errcode = '42501';
      end if;
      if (NEW.company_name, NEW.legal_name, NEW.legal_form, NEW.company_nature, NEW.country, NEW.registration_number,
          NEW.tax_number, NEW.representative_first_name, NEW.representative_last_name, NEW.primary_sector_id)
         is distinct from
         (OLD.company_name, OLD.legal_name, OLD.legal_form, OLD.company_nature, OLD.country, OLD.registration_number,
          OLD.tax_number, OLD.representative_first_name, OLD.representative_last_name, OLD.primary_sector_id) then
        NEW.ai_identity_status := 'pending';
        NEW.ai_identity_reasons := '[]'::jsonb;
      end if;
    end if;
  end if;
  return NEW;
end $$;

create or replace function public.jdvcrm_guard_application_document_v1()
returns trigger language plpgsql set search_path = public as $$
declare v_count integer;
begin
  if current_user in ('authenticated','anon') and not public.jdvcrm_is_super_admin_v1() then
    select count(*) into v_count from public.organization_application_documents d where d.application_id = NEW.application_id;
    if v_count >= 24 then raise exception 'TOO_MANY_DOCUMENTS'; end if;
    NEW.status := 'pending';
    NEW.analysis_result := '{}'::jsonb;
    NEW.rejection_reason := null;
  end if;
  return NEW;
end $$;

revoke all on function public.jdvcrm_guard_application_write_v1() from public, anon, authenticated;
revoke all on function public.jdvcrm_guard_application_document_v1() from public, anon, authenticated;
