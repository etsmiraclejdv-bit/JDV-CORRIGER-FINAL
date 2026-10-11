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
