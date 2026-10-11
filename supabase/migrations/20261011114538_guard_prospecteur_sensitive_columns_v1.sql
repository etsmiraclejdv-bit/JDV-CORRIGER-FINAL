-- Sécurité : un prospecteur peut modifier sa propre fiche (téléphone, ville…) mais pas son statut ni sa commission.

create or replace function public.jdvcrm_is_org_admin_v1(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public, private as $$
  select coalesce(private.is_super_admin(), false) or coalesce(private.is_org_admin(p_organization_id), false)
$$;
revoke all on function public.jdvcrm_is_org_admin_v1(uuid) from public, anon;
grant execute on function public.jdvcrm_is_org_admin_v1(uuid) to authenticated, service_role;

create or replace function public.jdvcrm_guard_prospecteur_update_v1()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated','anon') and not public.jdvcrm_is_org_admin_v1(OLD.organization_id) then
    if NEW.status is distinct from OLD.status
       or NEW.commission_rate is distinct from OLD.commission_rate
       or NEW.commission_payout_mode is distinct from OLD.commission_payout_mode
       or NEW.organization_id is distinct from OLD.organization_id
       or NEW.user_id is distinct from OLD.user_id
       or NEW.code is distinct from OLD.code then
      raise exception 'PROTECTED_COLUMNS' using errcode = '42501';
    end if;
  end if;
  return NEW;
end $$;
revoke all on function public.jdvcrm_guard_prospecteur_update_v1() from public, anon, authenticated;

drop trigger if exists jdvcrm_guard_prospecteur_update on public.prospecteurs;
create trigger jdvcrm_guard_prospecteur_update
  before update on public.prospecteurs
  for each row execute function public.jdvcrm_guard_prospecteur_update_v1();
