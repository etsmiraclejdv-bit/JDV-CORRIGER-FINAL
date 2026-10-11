# Migration reconstruction evidence (read-only production inspection)

Date: 2026-10-09  
Project: `arxhppptxeeyeexkdyjv`  
Status: forensic evidence only; **not an executable migration**.

## Execution and cost constraints

- No Supabase development branch was created.
- No branch fee was incurred.
- No SQL was written to or executed against production during this inspection; queries were read-only metadata/function-definition queries.
- No clean rebuild or replay test was run. This report must not be treated as proof that a clean replay succeeds.

## Missing migration sources still not recovered

The original SQL bodies for these applied versions were not found in the checked repository branches or current `main` tree:

- `20261008115141_ai_company_validation_v1`
- `20261008174410_company_document_manual_review_v1`
- `20261009011506_agency_head_chef_agence_v1`
- `20261009012135_scope_prospecteur_assignments_to_agency_v1`

The live database proves that related objects currently exist, but it does not reveal which exact DDL statements or intermediate states were in each original migration. Do not label a newly authored SQL file as the recovered original.

## Verified live objects: application identity validation

Read-only inspection of `pg_proc`, `pg_trigger`, and `pg_policies` confirmed:

- `public.jdvcrm_guard_application_write_v1()` is attached to `public.organization_applications` by trigger `jdvcrm_guard_application_write`, before INSERT or UPDATE.
- `public.jdvcrm_guard_application_document_v1()` is attached to `public.organization_application_documents` by trigger `jdvcrm_guard_application_document`, before INSERT.
- The application guard prevents authenticated/anonymous non-super-admin callers from setting protected review/activation and AI identity fields. It also limits which status transitions a client can make and resets identity analysis fields when identity-relevant company data changes.
- The document guard caps an application at 24 documents and resets client-supplied document status/analysis/rejection fields for non-super-admin callers.
- Current application RLS policies include owner insert/read/update policies and super-admin read access. Document policies include applicant-owned insert/read and super-admin read access.
- Current review RPCs include `public.jdvcrm_get_pending_company_applications_v1()`, `public.jdvcrm_get_documents_to_review_v1()`, and `public.jdvcrm_review_application_document_v1(uuid,text,text)`. The review RPCs require super-admin authorization; document review accepts only `verified` or `rejected`, and rejection requires a reason.

These definitions are evidence of current behavior, not a complete substitute for the missing AI validation migration. The exact AI provider/network behavior, scoring logic, retry rules, and grants still need comparison against the deployed Edge Function/source artifacts.

## Verified live objects: agency-scoped prospecteur warehouse assignments

Read-only inspection confirmed:

- Table `public.prospecteur_warehouse_assignments` has three relevant policies:
  - `prospecteur_warehouse_assignment_admin_write`: organization-admin write access.
  - `prospecteur_warehouse_assignment_head_write`: warehouse-manager write access through `private.can_manage_warehouse(warehouse_id)`, with a check that the assignment organization matches the warehouse organization.
  - `prospecteur_warehouse_assignment_select`: the assigned prospecteur can read their assignments; active organization members with roles `business_admin`, `manager`, `accountant`, or `viewer` can also read within their organization.
- `public.jdvcrm_assign_prospecteur_warehouse_v1(uuid,uuid,uuid,text,text,text)` checks authentication, organization-admin/super-admin authorization, active prospecteur membership in the requested organization, and active warehouse membership in that same organization. It deactivates prior active assignments and inserts a new primary assignment.
- `private.can_manage_warehouse(uuid)` is used by the warehouse-head policy and warehouse operations. Its current definition should be preserved/compared when rebuilding the historical migration chain.
- Current warehouse/prospecteur RPCs include `public.jdvcrm_warehouse_prospecteurs_v1(uuid)` and `public.jdvcrm_warehouse_supply_prospecteur_v1(uuid,uuid,jsonb,boolean,text)`, which require warehouse-management permission and verify primary assignment before supply.

This establishes that the current database has a warehouse-head assignment policy and scoped assignment RPC. It does not prove the original migration contained only these objects, nor does it establish whether any prior version used different policy definitions.

## Reconstruction decision

Do **not** create speculative, executable migration files from names alone. The safe next action is to preserve this evidence alongside the draft reconciliation PR and keep the four source gaps explicit. If reconstructed migration candidates are later authored, each must be labeled `RECONSTRUCTED FROM LIVE STATE — NOT ORIGINAL SOURCE`, reviewed line-by-line, and tested by a clean replay before it can be considered merge-ready.

## Remaining gates

1. Recover exact originals from deployment artifacts, backups, local developer copies, or CI logs if available.
2. Compare the 11 renamed migration bodies with exact production changes; matching version numbers is not enough.
3. Reconstruct only what is evidenced by current object definitions and metadata; identify historical uncertainty explicitly.
4. Run clean replay and schema/security diffs in an isolated environment before merging. This gate is currently **not run** because no paid branch is being created.
5. Keep the PR draft and do not merge or push reconciled migrations to production until the gates above are satisfied.
