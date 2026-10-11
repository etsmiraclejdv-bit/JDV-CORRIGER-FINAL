# Supabase migration history reconciliation

Date: 2026-10-09  
Production project: `arxhppptxeeyeexkdyjv` (`eu-west-1`)

## Static reconciliation result

A fresh read-only comparison of the live Supabase migration history with the reconciliation branch's `supabase/migrations/*.sql` filenames returned:

- **136** migration versions recorded in production.
- **132** migration SQL files in the repository.
- **0** repository migration filename versions absent from the production history.
- **4** production migration versions with no corresponding repository SQL file.

The 11 mismatched filenames have been aligned to the corresponding production version strings on this branch. This resolves the filename/version mismatch found in the initial audit. It does **not** resolve the four missing source bodies or prove that the 11 carried-over SQL bodies match the exact statements deployed.

## Safety status

- This branch changes GitHub migration filenames and adds reconciliation/evidence documentation; no SQL was executed against production.
- No Supabase development branch was created, so no branch cost was incurred. Work continued using read-only production metadata inspection and GitHub source review only.
- Do not run `supabase db push`, `supabase migration up`, or a production reset until this reconciliation is reviewed.
- Matching a filename/version to the remote history does **not** prove the SQL body is identical to the SQL originally applied. Compare each renamed file with deployment artifacts, CI logs, backups, or the resulting live object definitions before merging.
- A clean rebuild has not yet been performed. The repository currently lacks a confirmed `supabase/config.toml`; four migration sources remain missing. Read-only findings are documented in [MIGRATION_RECONSTRUCTION_EVIDENCE.md](./MIGRATION_RECONSTRUCTION_EVIDENCE.md).

## Version mappings made on this branch

The following files were renamed to use the version recorded in Supabase. SQL bodies were carried over unchanged:

| Previous repository filename | Version recorded by Supabase / new filename |
| --- | --- |
| `20261007130000_fix_organization_applications_authenticated_grants_v1.sql` | `20261007124229_fix_organization_applications_authenticated_grants_v1.sql` |
| `20261007143000_finalize_company_application_v1.sql` | `20261007131402_finalize_company_application_v1.sql` |
| `20261008200000_warehouse_subwarehouses_admin_v1.sql` | `20261008183819_warehouse_subwarehouses_admin_v1.sql` |
| `20261008200500_harden_warehouse_subwarehouses_admin_v1.sql` | `20261008183835_harden_warehouse_subwarehouses_admin_v1.sql` |
| `20261008201000_preserve_warehouse_subwarehouse_history_v1.sql` | `20261008183922_preserve_warehouse_subwarehouse_history_v1.sql` |
| `20261008210000_warehouse_stock_journal_inventory_closure_v1.sql` | `20261008184729_warehouse_stock_journal_inventory_closure_v1.sql` |
| `20261008220000_link_stock_to_subwarehouses_v1.sql` | `20261008185008_link_stock_to_subwarehouses_v1.sql` |
| `20261008230000_subwarehouse_stock_journal_closure_v1.sql` | `20261008185724_subwarehouse_stock_journal_closure_v1.sql` |
| `20261008240000_return_traceability_agent_prospecteur_v1.sql` | `20261008185937_return_traceability_agent_prospecteur_v1.sql` |
| `20261008250000_ai_jdv_crm_sector_knowledge_v1.sql` | `20261008200212_ai_jdv_crm_sector_knowledge_v1_retry.sql` |
| `20261008260000_ai_jdv_crm_operational_sections_v1.sql` | `20261008200533_ai_jdv_crm_operational_sections_v1.sql` |

**Special review required:** the live history labels the sector knowledge migration as a retry. The repository SQL is idempotent in several places, but its equivalence to the exact successful retry has not been proven.

## Additional migration gap found on 2026-10-11

A fresh read-only Supabase migration-history check after the 2026-10-09 audit found one more applied version missing from all checked GitHub branches:

| Applied version | Applied name | Current finding |
| --- | --- | --- |
| `20261011065602` | `team_rights_and_member_management_v1` | The history entry exists in production, but no matching SQL file was found in `main`, `feature/jdv-design-studio`, or the checked reconciliation/feature branches. The live database currently contains team tables, member-management RPCs, role/permission tables, and associated RLS policies. |

This raises the known source-file gaps from four to **at least five**. The four earlier gaps listed below remain unresolved. The earlier 136-version/132-file counts are a dated snapshot from 2026-10-09 and must not be presented as the current counts. The exact SQL body for the new gap has not been recovered. Live catalog definitions are evidence for current behavior only, not proof of the original migration body.

Do not apply, mark as applied, or merge a guessed replacement for this migration. A reconstruction candidate, if needed, must be kept outside `supabase/migrations`, labeled as reconstructed from live state, and reviewed/tested separately.

## Applied in production, source file not found in the repository

These four versions appear in the live migration history but have no corresponding SQL source file in `supabase/migrations`:

| Applied version | Applied name | Required action |
| --- | --- | --- |
| `20261008115141` | `ai_company_validation_v1` | Recover exact SQL from original deployment/source-control artifacts; otherwise reconstruct from live definitions and review manually. |
| `20261008174410` | `company_document_manual_review_v1` | Recover exact SQL and verify policies, storage access, and review workflow. |
| `20261009011506` | `agency_head_chef_agence_v1` | Recover exact SQL and verify schema, role permissions, and policies. |
| `20261009012135` | `scope_prospecteur_assignments_to_agency_v1` | Recover exact SQL and verify assignment scoping and RLS behavior. |

The exact paths were also checked against GitHub's commit history; no commits for these paths were returned. Do not fabricate migration bodies from names alone. The deployed schema is evidence for current behavior, but it is not a substitute for the original migration source when reproducing a clean database.

## Verified live-state evidence

Read-only definitions of the application validation/document-review functions, triggers and RLS policies, and warehouse/prospecteur assignment policies/RPCs are recorded in [MIGRATION_RECONSTRUCTION_EVIDENCE.md](./MIGRATION_RECONSTRUCTION_EVIDENCE.md). That evidence describes the current live behavior; it does not claim to reconstruct every historical statement or intermediate schema state.

## Final disposition

- **Completed without cost:** align the 11 migration filenames to live version numbers, perform a fresh static filename/version comparison, inspect the current database definitions for the four missing migrations' areas, and commit the evidence reports to the reconciliation branch.
- **Still unverified:** exact SQL equivalence for the 11 renamed files, original source bodies for four applied migrations, the full clean replay, and a schema/security diff against a rebuilt database.
- **Decision:** keep PR #2 in draft and do not merge or deploy it yet. A production migration push is not needed to reconcile these filenames and must not be used as a substitute for clean-replay testing.
- No Supabase development branch was created, and no production SQL was executed.


chore/reconcile-supabase-migration-history
## Follow-up forensic work on 2026-10-11

A first **partial forensic candidate** has now been committed outside the executable migrations directory:

- `docs/reconstruction-candidates/README.md`
- `docs/reconstruction-candidates/20261011065602_team_rights_and_member_management_v1.partial.sql.txt`

The candidate records four live function bodies obtained with read-only `pg_get_functiondef`: member listing, member status changes, member role changes, and member audit logging. It is explicitly labeled **RECONSTRUCTED FROM LIVE STATE — NOT ORIGINAL SOURCE** and is a `.sql.txt` evidence artifact, not an executable migration.

Further catalog inspection confirmed the current columns and indexes for `organization_teams` / `organization_team_members`, their four RLS policies, grants on the three RPCs, and three triggers on `organization_members`. The candidate does not yet recreate tables, RLS, indexes, trigger attachments, helper dependencies, seeds, full grants, or historical intermediate states. It is therefore **not a complete replacement** for version `20261011065602`.

No production schema or data was changed. No file was added to `supabase/migrations/`; no migration was applied, marked as applied, merged, or deployed. A clean replay remains untested.


## Additional forensic captures on 2026-10-11

Two more **partial live-state evidence artifacts** have been added under `docs/reconstruction-candidates/`:

- `20261008115141_ai_company_validation_v1.partial.sql.txt`: five observed functions for application write protection, document upload protection, pending application listing, document review queue, and manual document review.
- `20261009012135_scope_prospecteur_assignments_to_agency_v1.partial.sql.txt`: the current prospecteur-to-warehouse assignment RPC and warehouse-head synchronization function.

These are deliberately non-executable `.sql.txt` evidence artifacts outside `supabase/migrations/`. They document observed current function definitions only. They do not establish migration ownership, recover the original source, or reproduce all schema, triggers, RLS, grants, storage configuration, Edge Functions, secrets, and historical changes. No production SQL was written or executed.

The known missing-source count remains **at least five**. The next work is to capture the remaining live evidence for document review and agency/warehouse-head scope, then inspect whether the original SQL can be recovered from GitHub history or deployment artifacts. All candidate artifacts remain unapproved and untested.
=======
## Forensic follow-up carried onto current main base (2026-10-11)

A fresh evidence branch based directly on current `main` now contains three partial live-state artifacts under `docs/reconstruction-candidates/`:

- `20261011065602_team_rights_and_member_management_v1.partial.sql.txt`
- `20261008115141_ai_company_validation_v1.partial.sql.txt`
- `20261009012135_scope_prospecteur_assignments_to_agency_v1.partial.sql.txt`

These are non-executable `.sql.txt` evidence files, explicitly labeled **RECONSTRUCTED FROM LIVE STATE — NOT ORIGINAL SOURCE**. They capture selected function bodies only. They are not complete replacements for the missing migrations and must not be copied into `supabase/migrations/` or executed against production.

The known missing-source count remains at least five: the three areas with partial evidence above, plus `20261008174410_company_document_manual_review_v1` and `20261009011506_agency_head_chef_agence_v1` still need separate source recovery/verification. The overlapping document-review functions do not prove migration ownership.

No production schema/data was changed; no migration was applied or marked applied; no merge, PR, or Netlify deployment was performed. The original reconciliation branch was 58 commits behind current main when compared, so this fresh branch is based on main to avoid asking for a blind merge of the stale branch. Full replay/tests remain outstanding.
main
