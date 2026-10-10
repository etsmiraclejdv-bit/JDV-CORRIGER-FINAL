-- Performance : index sur les clés étrangères non couvertes + suppression des index en double

create index if not exists idx_fk_commission_rules_created_by on public.commission_rules (created_by);
create index if not exists idx_fk_organization_team_members_user_id on public.organization_team_members (user_id);
create index if not exists idx_fk_organization_teams_created_by on public.organization_teams (created_by);
create index if not exists idx_fk_organization_teams_supervisor_user_id on public.organization_teams (supervisor_user_id);
create index if not exists idx_fk_sales_returns_received_by_user_id on public.sales_returns (received_by_user_id);
create index if not exists idx_fk_wh_stock_closure_lines_article_id on public.warehouse_stock_daily_closure_lines (article_id);
create index if not exists idx_fk_wh_stock_closure_lines_organization_id on public.warehouse_stock_daily_closure_lines (organization_id);
create index if not exists idx_fk_wh_stock_closures_closed_by on public.warehouse_stock_daily_closures (closed_by);
create index if not exists idx_fk_wh_stock_closures_reopened_by on public.warehouse_stock_daily_closures (reopened_by);
create index if not exists idx_fk_subwh_closure_lines_article_id on public.warehouse_subwarehouse_daily_closure_lines (article_id);
create index if not exists idx_fk_subwh_closure_lines_organization_id on public.warehouse_subwarehouse_daily_closure_lines (organization_id);
create index if not exists idx_fk_subwh_closure_lines_subwarehouse_id on public.warehouse_subwarehouse_daily_closure_lines (subwarehouse_id);
create index if not exists idx_fk_subwh_closure_lines_warehouse_id on public.warehouse_subwarehouse_daily_closure_lines (warehouse_id);
create index if not exists idx_fk_subwh_closures_closed_by on public.warehouse_subwarehouse_daily_closures (closed_by);
create index if not exists idx_fk_subwh_closures_organization_id on public.warehouse_subwarehouse_daily_closures (organization_id);
create index if not exists idx_fk_subwh_closures_warehouse_id on public.warehouse_subwarehouse_daily_closures (warehouse_id);
create index if not exists idx_fk_warehouse_subwarehouses_created_by on public.warehouse_subwarehouses (created_by);

-- Index en double : on supprime uniquement ceux qui ne portent aucune contrainte
do $$
declare n text;
begin
  foreach n in array array['permissions_code_uidx','role_permissions_role_permission_key','role_permissions_role_permission_uidx','idx_stock_movements_article_created']
  loop
    if exists (select 1 from pg_class c join pg_namespace s on s.oid = c.relnamespace
               where s.nspname = 'public' and c.relname = n and c.relkind = 'i')
       and not exists (select 1 from pg_constraint k join pg_class c on c.oid = k.conindid
                       where c.relname = n and c.relnamespace = 'public'::regnamespace) then
      execute format('drop index public.%I', n);
    end if;
  end loop;
end $$;
