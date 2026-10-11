-- Correctif : analysis_result est NOT NULL (défaut '{}'). Le verrou ne doit pas y écrire NULL.
create or replace function public.jdvcrm_guard_application_document_v1()
returns trigger language plpgsql set search_path = public, private as $$
declare v_count integer;
begin
  if current_user in ('authenticated','anon') and not coalesce(private.is_super_admin(), false) then
    select count(*) into v_count from public.organization_application_documents d where d.application_id = NEW.application_id;
    if v_count >= 24 then raise exception 'TOO_MANY_DOCUMENTS'; end if;
    NEW.status := 'pending';
    NEW.analysis_result := '{}'::jsonb;
    NEW.rejection_reason := null;
  end if;
  return NEW;
end $$;

revoke all on function public.jdvcrm_guard_application_document_v1() from public, anon, authenticated;
