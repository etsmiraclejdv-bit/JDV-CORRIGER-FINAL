-- Sécurité : la création d'une entreprise ne passe que par le parcours validé (dossier -> JDV IA / contrôle -> finalisation).
-- Les anciennes fonctions de création directe ne sont plus appelables par les utilisateurs connectés.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in ('create_company_onboarding', 'register_company')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;

  -- Fonctions de déclencheur : jamais appelables directement par un client
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in ('jdvcrm_sync_warehouse_head_v1', 'jdvcrm_guard_application_write_v1', 'jdvcrm_guard_application_document_v1')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
  end loop;
end $$;
