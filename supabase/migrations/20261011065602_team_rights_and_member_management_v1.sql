-- Équipe et droits : nouvelles permissions, cohérence des doublons, gestion des membres et des prospecteurs.

-- 1. Nouvelles permissions
insert into public.permissions (code, name, description, module) values
  ('team.view', 'Voir l''équipe', 'Consulter les membres de l''entreprise et leurs rôles', 'team'),
  ('team.manage', 'Gérer l''équipe', 'Créer des membres, changer leurs rôles, les suspendre ou les réactiver', 'team'),
  ('prospecteurs.view', 'Voir les prospecteurs', 'Consulter la liste et les fiches des prospecteurs', 'prospecteurs'),
  ('prospecteurs.manage', 'Gérer les prospecteurs', 'Modifier, suspendre ou réactiver un prospecteur', 'prospecteurs')
on conflict (code) do nothing;

insert into public.role_permissions (role, permission_id)
select v.role, p.id
from (values
  ('business_admin','team.view'), ('business_admin','team.manage'), ('manager','team.view'), ('supervisor','team.view'),
  ('business_admin','prospecteurs.view'), ('business_admin','prospecteurs.manage'),
  ('manager','prospecteurs.view'), ('manager','prospecteurs.manage'), ('supervisor','prospecteurs.view'),
  ('commercial','prospecteurs.view'), ('accountant','prospecteurs.view')
) as v(role, code)
join public.permissions p on p.code = v.code
on conflict (role, permission_id) do nothing;

-- 2. Permissions en double : un rôle qui a l'une a aussi l'équivalente (sans élargir au-delà de l'équivalence)
do $$
declare
  pairs text[] := array[
    ['clients.update','crm.clients.manage'], ['crm.clients.manage','clients.create'], ['crm.clients.manage','clients.update'],
    ['clients.read','crm.clients.view'], ['crm.clients.view','clients.read'],
    ['prospects.create','crm.prospects.create'], ['crm.prospects.create','prospects.create'],
    ['prospects.read','crm.prospects.view'], ['crm.prospects.view','prospects.read'],
    ['prospects.update','crm.prospects.edit'], ['crm.prospects.edit','prospects.update'],
    ['sales.read','sales.view'], ['sales.view','sales.read']
  ];
  i int;
begin
  for i in 1 .. array_length(pairs, 1) loop
    insert into public.role_permissions (role, permission_id)
    select rp.role, t.id
    from public.role_permissions rp
    join public.permissions s on s.id = rp.permission_id and s.code = pairs[i][1]
    join public.permissions t on t.code = pairs[i][2]
    on conflict (role, permission_id) do nothing;
  end loop;
end $$;

-- 3. Liste des membres de l'entreprise
create or replace function public.jdvcrm_list_org_members_v1(p_organization_id uuid)
returns table(member_id uuid, user_id uuid, role text, status text, joined_at timestamptz, email text, display_name text, phone text, is_owner boolean, is_me boolean)
language plpgsql security definer set search_path = public, private as $$
#variable_conflict use_column
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if not (private.is_super_admin() or private.is_org_admin(p_organization_id) or exists (
        select 1 from public.organization_members x
        where x.organization_id = p_organization_id and x.user_id = auth.uid() and x.status = 'active' and x.role in ('manager','supervisor'))) then
    raise exception 'ACCESS_DENIED';
  end if;
  return query
    select m.id, m.user_id, m.role, m.status, m.joined_at, u.email::text,
           coalesce(nullif(p.display_name,''), nullif(btrim(coalesce(p.first_name,'') || ' ' || coalesce(p.last_name,'')),''), u.email::text),
           p.phone, (o.owner_user_id = m.user_id), (m.user_id = auth.uid())
    from public.organization_members m
    join auth.users u on u.id = m.user_id
    join public.organizations o on o.id = m.organization_id
    left join public.profiles p on p.id = m.user_id
    where m.organization_id = p_organization_id
    order by m.created_at;
end $$;

-- 4. Changer le rôle d'un membre
create or replace function public.jdvcrm_update_member_role_v1(p_member_id uuid, p_role text)
returns boolean language plpgsql security definer set search_path = public, private as $$
#variable_conflict use_column
declare m public.organization_members%rowtype; v_owner uuid; v_allowed boolean; v_other int;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  select * into m from public.organization_members x where x.id = p_member_id for update;
  if not found then raise exception 'MEMBER_NOT_FOUND'; end if;
  if not (private.is_super_admin() or private.is_org_admin(m.organization_id)) then raise exception 'ACCESS_DENIED'; end if;
  if p_role not in ('business_admin','manager','supervisor','accountant','commercial','viewer') then raise exception 'INVALID_ROLE'; end if;
  if m.role = 'prospecteur' then raise exception 'USE_PROSPECTEURS_PAGE'; end if;
  if m.user_id = auth.uid() then raise exception 'CANNOT_CHANGE_OWN_ROLE'; end if;
  select o.owner_user_id into v_owner from public.organizations o where o.id = m.organization_id;
  if m.user_id = v_owner then raise exception 'OWNER_PROTECTED'; end if;
  if m.role = 'business_admin' and p_role <> 'business_admin' then
    select count(*) into v_other from public.organization_members x
     where x.organization_id = m.organization_id and x.role = 'business_admin' and x.status = 'active' and x.id <> m.id;
    if v_other = 0 then raise exception 'LAST_ADMIN'; end if;
  end if;
  if p_role = 'business_admin' and m.role <> 'business_admin' then
    select l.allowed into v_allowed from public.jdvcrm_check_subscription_limit_v1(m.organization_id, 'admins') l limit 1;
    if v_allowed is false then raise exception 'ADMIN_LIMIT_REACHED'; end if;
  end if;
  update public.organization_members set role = p_role, updated_at = now() where id = m.id;
  return true;
end $$;

-- 5. Suspendre / réactiver un membre
create or replace function public.jdvcrm_set_member_status_v1(p_member_id uuid, p_status text)
returns boolean language plpgsql security definer set search_path = public, private as $$
#variable_conflict use_column
declare m public.organization_members%rowtype; v_owner uuid; v_other int;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_status not in ('active','suspended') then raise exception 'INVALID_STATUS'; end if;
  select * into m from public.organization_members x where x.id = p_member_id for update;
  if not found then raise exception 'MEMBER_NOT_FOUND'; end if;
  if not (private.is_super_admin() or private.is_org_admin(m.organization_id)) then raise exception 'ACCESS_DENIED'; end if;
  if m.user_id = auth.uid() then raise exception 'CANNOT_CHANGE_OWN_STATUS'; end if;
  select o.owner_user_id into v_owner from public.organizations o where o.id = m.organization_id;
  if m.user_id = v_owner then raise exception 'OWNER_PROTECTED'; end if;
  if p_status = 'suspended' and m.role = 'business_admin' then
    select count(*) into v_other from public.organization_members x
     where x.organization_id = m.organization_id and x.role = 'business_admin' and x.status = 'active' and x.id <> m.id;
    if v_other = 0 then raise exception 'LAST_ADMIN'; end if;
  end if;
  update public.organization_members set status = p_status, updated_at = now() where id = m.id;
  if m.role = 'prospecteur' then
    update public.prospecteurs set status = case when p_status = 'active' then 'active' else 'suspended' end, updated_at = now()
     where user_id = m.user_id and organization_id = m.organization_id;
  end if;
  update public.warehouse_managers set status = p_status where user_id = m.user_id and organization_id = m.organization_id;
  return true;
end $$;

-- 6. Statut d'un prospecteur (administrateur ou gestionnaire)
create or replace function public.jdvcrm_set_prospecteur_status_v1(p_prospecteur_id uuid, p_status text)
returns boolean language plpgsql security definer set search_path = public, private as $$
#variable_conflict use_column
declare pr public.prospecteurs%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_status not in ('active','suspended','blocked','inactive') then raise exception 'INVALID_STATUS'; end if;
  select * into pr from public.prospecteurs x where x.id = p_prospecteur_id for update;
  if not found then raise exception 'PROSPECTEUR_NOT_FOUND'; end if;
  if not (private.is_super_admin() or private.is_org_admin(pr.organization_id) or exists (
        select 1 from public.organization_members x
        where x.organization_id = pr.organization_id and x.user_id = auth.uid() and x.status = 'active' and x.role = 'manager')) then
    raise exception 'ACCESS_DENIED';
  end if;
  update public.prospecteurs set status = p_status, updated_at = now() where id = pr.id;
  if pr.user_id is not null then
    update public.organization_members set status = case when p_status = 'active' then 'active' else 'suspended' end, updated_at = now()
     where user_id = pr.user_id and organization_id = pr.organization_id and role = 'prospecteur';
  end if;
  return true;
end $$;

-- 7. Matrice des droits par rôle (lecture)
create or replace function public.jdvcrm_role_permissions_matrix_v1()
returns table(role text, module text, code text, name text)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  return query
    select rp.role, p.module, p.code, p.name
    from public.role_permissions rp join public.permissions p on p.id = rp.permission_id
    order by rp.role, p.module, p.code;
end $$;

revoke all on function public.jdvcrm_list_org_members_v1(uuid) from public, anon;
revoke all on function public.jdvcrm_update_member_role_v1(uuid, text) from public, anon;
revoke all on function public.jdvcrm_set_member_status_v1(uuid, text) from public, anon;
revoke all on function public.jdvcrm_set_prospecteur_status_v1(uuid, text) from public, anon;
revoke all on function public.jdvcrm_role_permissions_matrix_v1() from public, anon;
grant execute on function public.jdvcrm_list_org_members_v1(uuid) to authenticated, service_role;
grant execute on function public.jdvcrm_update_member_role_v1(uuid, text) to authenticated, service_role;
grant execute on function public.jdvcrm_set_member_status_v1(uuid, text) to authenticated, service_role;
grant execute on function public.jdvcrm_set_prospecteur_status_v1(uuid, text) to authenticated, service_role;
grant execute on function public.jdvcrm_role_permissions_matrix_v1() to authenticated, service_role;
