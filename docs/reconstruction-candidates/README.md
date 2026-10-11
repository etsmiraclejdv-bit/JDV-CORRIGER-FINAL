# Reconstruction candidate — team rights/member management

**Status: partial, forensic reconstruction only. Not original source. Not approved for execution.**

This folder is deliberately outside `supabase/migrations/` so the candidate cannot be mistaken for a normal migration by the CLI.

## Evidence captured 2026-10-11

Read-only queries against Supabase project `arxhppptxeeyeexkdyjv` confirmed:

- `public.organization_teams` columns: `id`, `organization_id`, `name`, `code`, `supervisor_user_id`, `status`, `created_by`, `created_at`, `updated_at`.
- `public.organization_team_members` columns: `id`, `organization_id`, `team_id`, `user_id`, `status`, `joined_at`, `created_at`, `updated_at`.
- Unique indexes: team name per organization; team/member pair. Supporting indexes exist on organization, supervisor/creator, team, and user.
- RLS policies on both tables allow organization admins to write. Reads allow super-admins, org admins, relevant team members, and supervisors as encoded in the live policies.
- Current RPCs: `jdvcrm_list_org_members_v1(uuid)`, `jdvcrm_set_member_status_v1(uuid,text)`, `jdvcrm_update_member_role_v1(uuid,text)`; a trigger function `jdvcrm_audit_organization_member()` writes to `public.audit_logs`.
- Live triggers on `organization_members`: `organization_members_updated_at`, `trg_guard_membership_user_change`, and `trg_jdvcrm_audit_organization_member`.
- The three RPCs are owned by `postgres`; live ACL metadata showed EXECUTE for `authenticated` and `service_role`.

## Candidate contents

`20261011065602_team_rights_and_member_management_v1.partial.sql.txt` records the four observed function bodies from `pg_get_functiondef`. It does **not** reconstruct the entire missing migration.

## Still missing before a complete reconstruction is possible

1. Exact DDL for the two team tables, constraints, indexes, RLS enablement and policies, and any seeds.
2. Exact trigger/function bodies for dependencies including `private.guard_membership_user_change()`, `private.set_updated_at()`, and `public.jdvcrm_check_subscription_limit_v1(...)`.
3. Complete grants and ownership statements, plus whether other objects were introduced in the same migration.
4. The historical original SQL or deployment artifact to distinguish the original migration from the present-day live state.
5. A clean replay and schema/security diff in an isolated database. This has **not** been run.

## Safety decision

Do not copy this candidate into `supabase/migrations/`, do not run it against production, and do not mark the missing version as applied based on this reconstruction. The migration remains unresolved. The existing production schema was not modified during this inspection.


## Dependency follow-up (read-only, 2026-10-11)

Current definitions were also captured for these dependencies used by the live objects:

- `private.guard_membership_user_change()`: blocks changes to `organization_members.user_id` unless the caller is a super-admin.
- `private.set_updated_at()`: sets `NEW.updated_at = now()`.
- `public.jdvcrm_check_subscription_limit_v1(uuid,text)`: checks organization subscription and resource limits; the member-role RPC calls it before granting `business_admin`.

The live trigger inspection confirmed three triggers on `public.organization_members` and no non-internal triggers directly attached to `organization_teams` or `organization_team_members`. These are current-state facts only; they do not prove which objects were introduced by migration version `20261011065602`.


## Second forensic candidate: company application validation and document review

A second partial evidence artifact was added at `docs/reconstruction-candidates/20261008115141_ai_company_validation_v1.partial.sql.txt`. It records five currently observed function bodies from the live database: application write guard, application-document guard, pending application listing, document review queue, and manual document review RPC.

This is **not** the original `20261008115141_ai_company_validation_v1` migration. It does not include the full schema, trigger attachments, RLS policies, grants, storage configuration, Edge Function/provider configuration, secrets, or the complete AI analysis path. Function presence alone does not prove those functions were created by this migration. Keep this evidence file outside `supabase/migrations/` and do not execute it.


## Third forensic candidate: agency-scoped prospecteur/warehouse assignment

A third partial evidence artifact was added at `docs/reconstruction-candidates/20261009012135_scope_prospecteur_assignments_to_agency_v1.partial.sql.txt`. It records the current live definition of `jdvcrm_assign_prospecteur_warehouse_v1(...)` and the current warehouse-head synchronization trigger function `jdvcrm_sync_warehouse_head_v1()`.

This is **not** the original migration source. The trigger attachment, table DDL, full RLS and indexes, grants, and other objects are not included. The warehouse-head sync function may have originated in a separate migration; its presence here is only catalog evidence, not a claim about migration ownership. Do not execute this artifact.
