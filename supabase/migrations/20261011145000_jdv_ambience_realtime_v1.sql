-- Enable Realtime updates for organization dashboard personalization.
-- This lets the dashboard ambience refresh immediately when an administrator changes it.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'organization_personalization'
     ) then
    execute 'alter publication supabase_realtime add table public.organization_personalization';
  end if;
end
$$;
